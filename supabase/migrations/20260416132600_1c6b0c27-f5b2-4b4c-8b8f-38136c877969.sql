
DROP FUNCTION IF EXISTS public.get_cfo_decision_intelligence(uuid);

CREATE OR REPLACE FUNCTION public.get_cfo_decision_intelligence(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_result jsonb;
  v_total_payable numeric := 0;
  v_payable_7d numeric := 0;
  v_overdue_amount numeric := 0;
  v_overdue_worst_days integer := 0;
  v_overdue_vendor_count integer := 0;
  v_burn_30d numeric := 0;
  v_burn_prev_30d numeric := 0;
  v_avg_daily_burn numeric := 0;
  v_top_vendor_name text := '';
  v_top_vendor_amount numeric := 0;
  v_top_vendor_share numeric := 0;
  v_total_vendors integer := 0;
  v_clearance_days numeric := 0;
  v_clearance_impact_days numeric := 0;
  v_burn_multiplier numeric := 0;
  v_insights jsonb;
  v_actions jsonb := '[]'::jsonb;
  v_alerts jsonb := '[]'::jsonb;
  v_headline text := '';
  v_trends jsonb;
  v_confidence integer := 50;
  v_overdue_prev numeric := 0;
  v_payable_prev numeric := 0;
  v_overdue_change_pct numeric := 0;
  v_payable_growth_pct numeric := 0;
  v_burn_change_pct numeric := 0;
  v_has_high_outflow boolean := false;
  v_has_overdue boolean := false;
  v_has_concentration boolean := false;
BEGIN
  SELECT bcm.company_id INTO v_company_id
  FROM buyer_company_members bcm
  WHERE bcm.user_id = p_user_id AND bcm.is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object(
      'summary', jsonb_build_object('total_payable', 0, 'payable_7d', 0, 'overdue', 0, 'burn_30d', 0),
      'insights', '{}'::jsonb, 'actions', '[]'::jsonb, 'alerts', '[]'::jsonb,
      'headline', 'No company data available', 'trends', '{}'::jsonb, 'system_confidence', 50
    );
  END IF;

  -- Total open payable (base currency normalized)
  SELECT COALESCE(SUM(COALESCE(po.po_value_base_currency, po.total_po_value)), 0),
         COUNT(DISTINCT po.supplier_id)
  INTO v_total_payable, v_total_vendors
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled');

  -- Due in 7 days
  SELECT COALESCE(SUM(COALESCE(po.po_value_base_currency, po.total_po_value)), 0)
  INTO v_payable_7d
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
    AND po.expected_delivery_date <= (now() + interval '7 days')
    AND po.expected_delivery_date >= now();

  -- Overdue
  SELECT COALESCE(SUM(COALESCE(po.po_value_base_currency, po.total_po_value)), 0),
         COALESCE(MAX(EXTRACT(DAY FROM now() - po.expected_delivery_date)::integer), 0),
         COUNT(DISTINCT po.supplier_id)
  INTO v_overdue_amount, v_overdue_worst_days, v_overdue_vendor_count
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
    AND po.expected_delivery_date < now();

  -- 30-day burn (currency-normalized)
  SELECT COALESCE(SUM(
    CASE
      WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
      THEN pal.amount * pal.payment_exchange_rate
      ELSE pal.amount
    END
  ), 0)
  INTO v_burn_30d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE po.buyer_company_id = v_company_id
    AND pal.to_status = 'payment_confirmed'
    AND pal.created_at >= (now() - interval '30 days');

  -- Previous 30-day burn
  SELECT COALESCE(SUM(
    CASE
      WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
      THEN pal.amount * pal.payment_exchange_rate
      ELSE pal.amount
    END
  ), 0)
  INTO v_burn_prev_30d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE po.buyer_company_id = v_company_id
    AND pal.to_status = 'payment_confirmed'
    AND pal.created_at >= (now() - interval '60 days')
    AND pal.created_at < (now() - interval '30 days');

  -- Previous overdue snapshot
  SELECT COALESCE(SUM(COALESCE(po.po_value_base_currency, po.total_po_value)), 0)
  INTO v_overdue_prev
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
    AND po.expected_delivery_date < (now() - interval '7 days');

  -- Previous payable snapshot
  SELECT COALESCE(SUM(COALESCE(po.po_value_base_currency, po.total_po_value)), 0)
  INTO v_payable_prev
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
    AND po.created_at <= (now() - interval '7 days');

  -- Top vendor exposure
  SELECT COALESCE(s.company_name, s.contact_name, 'Unknown'),
         COALESCE(SUM(COALESCE(po.po_value_base_currency, po.total_po_value)), 0)
  INTO v_top_vendor_name, v_top_vendor_amount
  FROM purchase_orders po
  LEFT JOIN suppliers s ON s.id = po.supplier_id
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
  GROUP BY COALESCE(s.company_name, s.contact_name, 'Unknown')
  ORDER BY 2 DESC
  LIMIT 1;

  -- Derived metrics
  v_avg_daily_burn := CASE WHEN v_burn_30d > 0 THEN v_burn_30d / 30.0 ELSE 0 END;
  v_clearance_days := CASE WHEN v_avg_daily_burn > 0 THEN ROUND(v_total_payable / v_avg_daily_burn) ELSE 0 END;
  v_clearance_impact_days := CASE WHEN v_avg_daily_burn > 0 THEN ROUND(v_payable_7d / v_avg_daily_burn) ELSE 0 END;
  v_top_vendor_share := CASE WHEN v_total_payable > 0 THEN ROUND((v_top_vendor_amount / v_total_payable) * 100) ELSE 0 END;
  v_burn_multiplier := CASE WHEN v_avg_daily_burn > 0 THEN ROUND((v_payable_7d / 7.0) / v_avg_daily_burn, 1) ELSE 0 END;

  v_burn_change_pct := CASE WHEN v_burn_prev_30d > 0 THEN ROUND(((v_burn_30d - v_burn_prev_30d) / v_burn_prev_30d) * 100) ELSE 0 END;
  v_overdue_change_pct := CASE WHEN v_overdue_prev > 0 THEN ROUND(((v_overdue_amount - v_overdue_prev) / v_overdue_prev) * 100) ELSE 0 END;
  v_payable_growth_pct := CASE WHEN v_payable_prev > 0 THEN ROUND(((v_total_payable - v_payable_prev) / v_payable_prev) * 100) ELSE 0 END;

  v_has_overdue := v_overdue_amount > 0;
  v_has_high_outflow := v_burn_multiplier >= 2.0;
  v_has_concentration := v_top_vendor_share >= 60;

  -- Severity-first headline
  IF v_has_overdue AND v_overdue_worst_days >= 7 THEN
    v_headline := format('🔴 ₹%sL overdue (%s days) — supply disruption risk imminent',
      ROUND(v_overdue_amount / 100000, 1), v_overdue_worst_days);
  ELSIF v_has_high_outflow THEN
    v_headline := format('🟠 ₹%sL due this week (%sx burn) — liquidity pressure ahead',
      ROUND(v_payable_7d / 100000, 1), v_burn_multiplier);
  ELSIF v_has_concentration THEN
    v_headline := format('🟡 %s%% vendor concentration on %s — diversification required',
      v_top_vendor_share::integer, v_top_vendor_name);
  ELSIF v_total_payable > 0 THEN
    v_headline := format('✅ ₹%sL payable — clears in ~%s days at current burn',
      ROUND(v_total_payable / 100000, 1), v_clearance_days::integer);
  ELSE
    v_headline := '✅ No open payables — financial position clear';
  END IF;

  -- Insights
  v_insights := jsonb_build_object(
    'payable', jsonb_build_object(
      'severity', CASE WHEN v_top_vendor_share >= 80 THEN 'critical' WHEN v_top_vendor_share >= 60 THEN 'high' ELSE 'normal' END,
      'concentration_risk', v_has_concentration,
      'top_vendor', v_top_vendor_name,
      'top_vendor_share', v_top_vendor_share,
      'clearance_days', v_clearance_days,
      'clearance_label', format('Clears in ~%s days at current burn', v_clearance_days::integer)
    ),
    'due7', jsonb_build_object(
      'severity', CASE WHEN v_burn_multiplier >= 2 THEN 'critical' WHEN v_burn_multiplier >= 1.5 THEN 'high' ELSE 'moderate' END,
      'burn_multiplier', v_burn_multiplier,
      'clearance_impact_days', v_clearance_impact_days,
      'consequence', CASE
        WHEN v_burn_multiplier >= 2 THEN format('₹%sL outflow → -%s days clearance impact', ROUND(v_payable_7d / 100000, 1), v_clearance_impact_days::integer)
        ELSE format('₹%sL outflow this week — within normal range', ROUND(v_payable_7d / 100000, 1))
      END
    ),
    'overdue', jsonb_build_object(
      'severity', CASE WHEN v_overdue_worst_days >= 14 THEN 'critical' WHEN v_overdue_worst_days >= 7 THEN 'high' ELSE 'moderate' END,
      'worst_days', v_overdue_worst_days,
      'vendor_count', v_overdue_vendor_count,
      'consequence', CASE
        WHEN v_overdue_worst_days >= 14 THEN format('₹%sL stuck → blocking vendor cycle for %sd', ROUND(v_overdue_amount / 100000, 1), v_overdue_worst_days)
        WHEN v_overdue_worst_days >= 7 THEN format('₹%sL delayed — vendor escalation likely', ROUND(v_overdue_amount / 100000, 1))
        ELSE 'No critical overdue'
      END
    )
  );

  -- Structured alerts
  IF v_has_overdue AND v_overdue_worst_days >= 7 THEN
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'type', 'overdue_critical', 'severity', 'critical', 'metric', v_overdue_worst_days,
      'message', format('₹%sL overdue by %s days — supply disruption risk', ROUND(v_overdue_amount / 100000, 1), v_overdue_worst_days)
    ));
  END IF;

  IF v_has_high_outflow THEN
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'type', 'high_outflow', 'severity', 'critical', 'metric', v_burn_multiplier,
      'message', format('This week burn at %sx normal — ₹%sL outflow', v_burn_multiplier, ROUND(v_payable_7d / 100000, 1))
    ));
  END IF;

  IF v_has_concentration THEN
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'type', 'vendor_concentration',
      'severity', CASE WHEN v_top_vendor_share >= 80 THEN 'critical' ELSE 'high' END,
      'metric', v_top_vendor_share,
      'message', format('%s%% exposure to %s — concentration risk', v_top_vendor_share::integer, v_top_vendor_name)
    ));
  END IF;

  -- Actions with conflict resolution
  IF v_has_overdue THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action', format('Clear ₹%sL overdue to %s vendor(s)', ROUND(v_overdue_amount / 100000, 1), v_overdue_vendor_count),
      'impact', format('Avoid escalation — worst delay: %sd', v_overdue_worst_days),
      'priority_score', LEAST(99, 70 + v_overdue_worst_days),
      'category', 'overdue_clearance', 'confidence', CASE WHEN v_overdue_worst_days >= 14 THEN 95 WHEN v_overdue_worst_days >= 7 THEN 85 ELSE 75 END
    ));
  END IF;

  IF v_has_concentration AND NOT v_has_overdue THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action', format('Diversify away from %s (%s%%)', v_top_vendor_name, v_top_vendor_share::integer),
      'impact', 'Reduce single-vendor supply risk',
      'priority_score', 60 + (v_top_vendor_share / 2)::integer, 'category', 'concentration_reduction', 'confidence', 70
    ));
  ELSIF v_has_concentration AND v_has_overdue THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action', format('After clearing overdue: diversify from %s (%s%%)', v_top_vendor_name, v_top_vendor_share::integer),
      'impact', 'Secondary priority — resolve overdue first',
      'priority_score', 40, 'category', 'concentration_reduction', 'confidence', 65
    ));
  END IF;

  IF v_has_high_outflow AND NOT v_has_overdue THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action', format('Defer non-critical POs — ₹%sL outflow this week', ROUND(v_payable_7d / 100000, 1)),
      'impact', format('Reduce weekly burn from %sx to normal', v_burn_multiplier),
      'priority_score', 55, 'category', 'burn_control', 'confidence', 75
    ));
  END IF;

  -- Trends
  v_trends := jsonb_build_object(
    'burn_7d_vs_prev_pct', v_burn_change_pct,
    'overdue_change_pct', v_overdue_change_pct,
    'payable_growth_pct', v_payable_growth_pct
  );

  -- System confidence
  v_confidence := CASE
    WHEN v_total_payable > 0 AND v_burn_30d > 0 THEN 90
    WHEN v_total_payable > 0 THEN 70
    WHEN v_burn_30d > 0 THEN 60
    ELSE 50
  END;

  v_result := jsonb_build_object(
    'summary', jsonb_build_object(
      'total_payable', v_total_payable, 'payable_7d', v_payable_7d,
      'overdue', v_overdue_amount, 'overdue_worst_days', v_overdue_worst_days,
      'burn_30d', v_burn_30d, 'avg_daily_burn', ROUND(v_avg_daily_burn, 2),
      'clearance_days', v_clearance_days,
      'top_vendor', v_top_vendor_name, 'top_vendor_amount', v_top_vendor_amount,
      'top_vendor_share', v_top_vendor_share, 'total_vendors', v_total_vendors
    ),
    'insights', v_insights, 'actions', v_actions, 'alerts', v_alerts,
    'headline', v_headline, 'trends', v_trends, 'system_confidence', v_confidence
  );

  RETURN v_result;
END;
$$;
