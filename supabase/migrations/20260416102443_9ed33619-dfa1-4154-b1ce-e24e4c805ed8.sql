
CREATE OR REPLACE FUNCTION public.get_cfo_decision_intelligence(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_summary jsonb;
  v_insights jsonb;
  v_actions jsonb := '[]'::jsonb;
  v_alerts text[] := '{}';
  v_headline text := '';
  v_trends jsonb;

  -- base metrics
  v_total_payable numeric := 0;
  v_due_7 numeric := 0;
  v_due_7_count int := 0;
  v_overdue numeric := 0;
  v_overdue_count int := 0;
  v_worst_overdue_days int := 0;
  v_worst_overdue_vendor text := '';

  -- burn
  v_burn_7d numeric := 0;
  v_burn_30d numeric := 0;
  v_burn_prev_7d numeric := 0;
  v_avg_daily_burn numeric := 0;
  v_payable_clearance_days numeric := 0;

  -- vendor
  v_top_vendor_name text := '';
  v_top_vendor_amount numeric := 0;
  v_top_vendor_share numeric := 0;
  v_vendor_count int := 0;

  -- trends
  v_overdue_prev numeric := 0;
  v_payable_prev numeric := 0;

  -- severity
  v_payable_severity text := 'normal';
  v_due7_severity text := 'normal';
  v_overdue_severity text := 'normal';
  v_burn_multiplier numeric := 0;

  -- headline parts
  v_headline_parts text[] := '{}';

  rec record;
BEGIN
  -- ═══════════════════════════════════════════
  -- BASE LAYER: Single source of truth
  -- ═══════════════════════════════════════════

  -- Total open payable
  SELECT COALESCE(SUM(po_value_base_currency), 0), COUNT(*)
  INTO v_total_payable, v_vendor_count
  FROM purchase_orders
  WHERE buyer_company_id = p_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed', 'cancelled');

  -- Due in 7 days
  SELECT COALESCE(SUM(po_value_base_currency), 0), COUNT(*)
  INTO v_due_7, v_due_7_count
  FROM purchase_orders
  WHERE buyer_company_id = p_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
    AND expected_delivery_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7;

  -- Overdue
  SELECT COALESCE(SUM(po_value_base_currency), 0), COUNT(*)
  INTO v_overdue, v_overdue_count
  FROM purchase_orders
  WHERE buyer_company_id = p_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
    AND expected_delivery_date < CURRENT_DATE;

  -- Worst overdue
  SELECT
    COALESCE(EXTRACT(DAY FROM CURRENT_DATE - po.expected_delivery_date)::int, 0),
    COALESCE(po.supplier_name, 'Unknown')
  INTO v_worst_overdue_days, v_worst_overdue_vendor
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
    AND po.expected_delivery_date < CURRENT_DATE
  ORDER BY po.expected_delivery_date ASC
  LIMIT 1;

  -- Top vendor exposure
  SELECT
    COALESCE(po.supplier_name, 'Unknown'),
    COALESCE(SUM(po.po_value_base_currency), 0)
  INTO v_top_vendor_name, v_top_vendor_amount
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
  GROUP BY po.supplier_name
  ORDER BY SUM(po.po_value_base_currency) DESC NULLS LAST
  LIMIT 1;

  IF v_total_payable > 0 THEN
    v_top_vendor_share := ROUND((v_top_vendor_amount / v_total_payable) * 100);
  END IF;

  -- ═══════════════════════════════════════════
  -- BURN LAYER: Payment-based cashflow
  -- ═══════════════════════════════════════════

  SELECT COALESCE(SUM(pal.amount), 0)
  INTO v_burn_7d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE po.buyer_company_id = p_company_id
    AND pal.to_status = 'payment_confirmed'
    AND pal.created_at >= NOW() - INTERVAL '7 days';

  SELECT COALESCE(SUM(pal.amount), 0)
  INTO v_burn_30d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE po.buyer_company_id = p_company_id
    AND pal.to_status = 'payment_confirmed'
    AND pal.created_at >= NOW() - INTERVAL '30 days';

  -- Previous 7d burn (for trend)
  SELECT COALESCE(SUM(pal.amount), 0)
  INTO v_burn_prev_7d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE po.buyer_company_id = p_company_id
    AND pal.to_status = 'payment_confirmed'
    AND pal.created_at >= NOW() - INTERVAL '14 days'
    AND pal.created_at < NOW() - INTERVAL '7 days';

  IF v_burn_30d > 0 THEN
    v_avg_daily_burn := ROUND(v_burn_30d / 30, 2);
    v_payable_clearance_days := ROUND(v_total_payable / v_avg_daily_burn);
  END IF;

  -- ═══════════════════════════════════════════
  -- TREND LAYER: 7d deltas
  -- ═══════════════════════════════════════════

  -- Previous week overdue (approximate via snapshot — use current as proxy minus change)
  -- Since we don't store historical snapshots, compute burn trend %
  v_trends := jsonb_build_object(
    'burn_7d_vs_prev_pct', CASE WHEN v_burn_prev_7d > 0 THEN ROUND(((v_burn_7d - v_burn_prev_7d) / v_burn_prev_7d) * 100) ELSE 0 END,
    'burn_7d', v_burn_7d,
    'burn_prev_7d', v_burn_prev_7d,
    'payable_clearance_days', v_payable_clearance_days,
    'avg_daily_burn', v_avg_daily_burn
  );

  -- ═══════════════════════════════════════════
  -- SEVERITY ENGINE
  -- ═══════════════════════════════════════════

  -- Payable severity (concentration)
  IF v_top_vendor_share >= 80 THEN v_payable_severity := 'critical';
  ELSIF v_top_vendor_share >= 60 THEN v_payable_severity := 'high';
  ELSIF v_top_vendor_share >= 40 THEN v_payable_severity := 'moderate';
  END IF;

  -- Due7 severity (burn multiplier)
  IF v_avg_daily_burn > 0 THEN
    v_burn_multiplier := ROUND(v_due_7 / (v_avg_daily_burn * 7), 1);
  END IF;
  IF v_burn_multiplier >= 2 THEN v_due7_severity := 'critical';
  ELSIF v_burn_multiplier >= 1.5 THEN v_due7_severity := 'high';
  ELSIF v_due_7 > 0 THEN v_due7_severity := 'moderate';
  END IF;

  -- Overdue severity
  IF v_worst_overdue_days >= 14 THEN v_overdue_severity := 'critical';
  ELSIF v_worst_overdue_days >= 7 THEN v_overdue_severity := 'high';
  ELSIF v_overdue > 0 THEN v_overdue_severity := 'moderate';
  END IF;

  -- ═══════════════════════════════════════════
  -- ALERT STACKING
  -- ═══════════════════════════════════════════

  IF v_burn_multiplier >= 2 THEN
    v_alerts := array_append(v_alerts, 'High outflow week (' || v_burn_multiplier || 'x burn)');
  END IF;
  IF v_payable_clearance_days > 0 AND v_payable_clearance_days < 15 THEN
    v_alerts := array_append(v_alerts, 'Low payable clearance (' || v_payable_clearance_days || 'd)');
  END IF;
  IF v_top_vendor_share >= 60 THEN
    v_alerts := array_append(v_alerts, 'Vendor concentration risk (' || v_top_vendor_share || '% in ' || v_top_vendor_name || ')');
  END IF;
  IF v_worst_overdue_days >= 7 THEN
    v_alerts := array_append(v_alerts, v_worst_overdue_days || 'd overdue (' || v_worst_overdue_vendor || ')');
  END IF;

  -- ═══════════════════════════════════════════
  -- HEADLINE SYNTHESIS
  -- ═══════════════════════════════════════════

  IF v_total_payable > 0 THEN
    v_headline_parts := array_append(v_headline_parts, '₹' || ROUND(v_total_payable / 100000, 1) || 'L payable');
  END IF;
  IF v_top_vendor_share >= 60 THEN
    v_headline_parts := array_append(v_headline_parts, v_top_vendor_share || '% concentrated');
  END IF;
  IF v_due_7 > 0 THEN
    v_headline_parts := array_append(v_headline_parts, '₹' || ROUND(v_due_7 / 100000, 1) || 'L due this week');
  END IF;
  IF v_overdue > 0 THEN
    v_headline_parts := array_append(v_headline_parts, '₹' || ROUND(v_overdue / 100000, 1) || 'L overdue');
  END IF;

  IF array_length(v_headline_parts, 1) > 0 THEN
    v_headline := array_to_string(v_headline_parts, ', ');
    IF v_overdue > 0 OR v_burn_multiplier >= 2 THEN
      v_headline := v_headline || ' — action required to avoid disruption.';
    ELSE
      v_headline := v_headline || '.';
    END IF;
  ELSE
    v_headline := 'No open payables — financial position clear.';
  END IF;

  -- ═══════════════════════════════════════════
  -- ACTION ENGINE (with priority scoring)
  -- ═══════════════════════════════════════════

  -- Overdue clearance action
  IF v_overdue > 0 THEN
    v_actions := v_actions || jsonb_build_object(
      'action', 'Clear ₹' || ROUND(v_overdue / 100000, 1) || 'L overdue to ' || v_worst_overdue_vendor,
      'impact', 'Reduce overdue by ' || ROUND((v_overdue / GREATEST(v_total_payable, 1)) * 100) || '% of payable',
      'consequence', 'Delay risks supply disruption within ' || GREATEST(3, 7 - v_worst_overdue_days / 2) || ' days',
      'priority_score', LEAST(100, 50 + v_worst_overdue_days * 2 + ROUND(v_overdue / 100000)),
      'category', 'overdue'
    );
  END IF;

  -- Concentration risk action
  IF v_top_vendor_share >= 60 THEN
    v_actions := v_actions || jsonb_build_object(
      'action', 'Diversify from ' || v_top_vendor_name || ' (' || v_top_vendor_share || '% exposure)',
      'impact', 'Reduce single-vendor dependency below 40%',
      'consequence', 'Single-point failure risk on ₹' || ROUND(v_top_vendor_amount / 100000, 1) || 'L',
      'priority_score', LEAST(100, 40 + v_top_vendor_share),
      'category', 'concentration'
    );
  END IF;

  -- High burn action
  IF v_burn_multiplier >= 1.5 THEN
    v_actions := v_actions || jsonb_build_object(
      'action', 'Review ₹' || ROUND(v_due_7 / 100000, 1) || 'L outflow — ' || v_burn_multiplier || 'x normal burn',
      'impact', 'Potential to defer ₹' || ROUND(v_due_7 * 0.3 / 100000, 1) || 'L to next cycle',
      'consequence', 'Unmanaged outflow reduces clearance by ~' || ROUND(v_due_7 / GREATEST(v_avg_daily_burn, 1)) || ' days',
      'priority_score', LEAST(100, 45 + v_burn_multiplier * 15),
      'category', 'cashflow'
    );
  END IF;

  -- Sort actions by priority_score desc (done in jsonb, approximate)
  -- Frontend should sort by priority_score

  -- ═══════════════════════════════════════════
  -- ASSEMBLE RESULT
  -- ═══════════════════════════════════════════

  v_summary := jsonb_build_object(
    'total_payable', v_total_payable,
    'due_next_7_days', v_due_7,
    'due_7_count', v_due_7_count,
    'overdue', v_overdue,
    'overdue_count', v_overdue_count,
    'burn_7d', v_burn_7d,
    'burn_30d', v_burn_30d,
    'avg_daily_burn', v_avg_daily_burn,
    'payable_clearance_days', v_payable_clearance_days,
    'top_vendor_name', v_top_vendor_name,
    'top_vendor_amount', v_top_vendor_amount,
    'top_vendor_share', v_top_vendor_share,
    'vendor_count', v_vendor_count,
    'worst_overdue_days', v_worst_overdue_days,
    'worst_overdue_vendor', v_worst_overdue_vendor
  );

  v_insights := jsonb_build_object(
    'payable', jsonb_build_object(
      'severity', v_payable_severity,
      'concentration_risk', v_top_vendor_share >= 60,
      'top_vendor_share', v_top_vendor_share,
      'clearance_days', v_payable_clearance_days,
      'reason', CASE
        WHEN v_top_vendor_share >= 80 THEN v_top_vendor_share || '% concentration in ' || v_top_vendor_name
        WHEN v_top_vendor_share >= 60 THEN 'High concentration: ' || v_top_vendor_share || '% in ' || v_top_vendor_name
        ELSE 'Diversified across ' || v_vendor_count || ' vendors'
      END
    ),
    'due7', jsonb_build_object(
      'severity', v_due7_severity,
      'burn_multiplier', v_burn_multiplier,
      'clearance_impact_days', CASE WHEN v_avg_daily_burn > 0 THEN ROUND(v_due_7 / v_avg_daily_burn) ELSE 0 END,
      'consequence', CASE
        WHEN v_burn_multiplier >= 2 THEN '₹' || ROUND(v_due_7 / 100000, 1) || 'L outflow → -' || ROUND(v_due_7 / GREATEST(v_avg_daily_burn, 1)) || 'd clearance'
        WHEN v_due_7 > 0 THEN '₹' || ROUND(v_due_7 / 100000, 1) || 'L due — within normal range'
        ELSE 'No immediate dues'
      END
    ),
    'overdue', jsonb_build_object(
      'severity', v_overdue_severity,
      'worst_days', v_worst_overdue_days,
      'worst_vendor', v_worst_overdue_vendor,
      'consequence', CASE
        WHEN v_worst_overdue_days >= 14 THEN '₹' || ROUND(v_overdue / 100000, 1) || 'L stuck → blocking vendor cycle'
        WHEN v_worst_overdue_days >= 7 THEN '₹' || ROUND(v_overdue / 100000, 1) || 'L delayed — escalation risk'
        WHEN v_overdue > 0 THEN '₹' || ROUND(v_overdue / 100000, 1) || 'L overdue — monitor'
        ELSE 'No overdue payments'
      END
    ),
    'decision', jsonb_build_object(
      'top_action', CASE
        WHEN jsonb_array_length(v_actions) > 0 THEN v_actions->0->>'action'
        ELSE 'No immediate actions required'
      END,
      'top_impact', CASE
        WHEN jsonb_array_length(v_actions) > 0 THEN v_actions->0->>'impact'
        ELSE null
      END,
      'inaction_consequence', CASE
        WHEN jsonb_array_length(v_actions) > 0 THEN v_actions->0->>'consequence'
        ELSE null
      END
    )
  );

  v_result := jsonb_build_object(
    'summary', v_summary,
    'insights', v_insights,
    'actions', v_actions,
    'alerts', to_jsonb(v_alerts),
    'headline', v_headline,
    'trends', v_trends
  );

  RETURN v_result;
END;
$$;
