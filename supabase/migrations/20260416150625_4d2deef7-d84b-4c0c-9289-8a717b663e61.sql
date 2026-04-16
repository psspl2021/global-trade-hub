
DROP FUNCTION IF EXISTS public.get_cfo_decision_intelligence(uuid);

CREATE OR REPLACE FUNCTION public.get_cfo_decision_intelligence(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_payable numeric := 0;
  v_payable_7d numeric := 0;
  v_overdue_amount numeric := 0;
  v_overdue_worst_days int := 0;
  v_burn_30d numeric := 0;
  v_burn_prev numeric := 0;
  v_avg_daily_burn numeric := 0;
  v_clearance_days int := 0;
  v_top_vendor_name text := 'N/A';
  v_top_vendor_amount numeric := 0;
  v_top_vendor_share numeric := 0;
  v_total_vendors int := 0;
  v_payable_severity text := 'normal';
  v_concentration_risk boolean := false;
  v_burn_multiplier numeric := 0;
  v_headline text := '';
  v_actions jsonb := '[]'::jsonb;
  v_alerts jsonb := '[]'::jsonb;
  v_trends jsonb := '[]'::jsonb;
  v_confidence int := 50;
  v_health_score int := 100;
  v_has_overdue boolean := false;
  v_has_high_outflow boolean := false;
  v_overdue_prev numeric := 0;
  v_payable_prev numeric := 0;
  v_base_currency text := 'INR';
  v_due7_sev text := 'normal';
  v_conc_sev text := 'moderate';
  v_fmt_overdue text;
  v_fmt_payable_7d text;
  v_fmt_total_payable text;
BEGIN
  SELECT COALESCE(bc.base_currency, 'INR') INTO v_base_currency
  FROM buyer_companies bc WHERE bc.id = p_company_id;

  -- Total payable + vendor count
  SELECT COALESCE(SUM(po.po_value_base_currency), 0), COUNT(DISTINCT po.supplier_id)
  INTO v_total_payable, v_total_vendors
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status NOT IN ('cancelled', 'completed', 'delivered')
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled');

  -- Payable due within 7 days
  SELECT COALESCE(SUM(po.po_value_base_currency), 0)
  INTO v_payable_7d
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status NOT IN ('cancelled', 'completed', 'delivered')
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) <= now() + interval '7 days'
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) >= now();

  -- Overdue (financial definition)
  SELECT COALESCE(SUM(po.po_value_base_currency), 0),
         COALESCE(MAX(EXTRACT(DAY FROM now() - COALESCE(po.payment_due_date, po.expected_delivery_date))::int), 0)
  INTO v_overdue_amount, v_overdue_worst_days
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status NOT IN ('cancelled', 'completed', 'delivered')
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) < now();

  v_has_overdue := v_overdue_amount > 0;

  -- FIX #1: Burn must filter to_status = 'payment_confirmed' only
  SELECT COALESCE(SUM(
    CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
      THEN pal.amount * pal.payment_exchange_rate ELSE pal.amount END
  ), 0) INTO v_burn_30d
  FROM po_payment_audit_logs pal
  WHERE pal.company_id = p_company_id
    AND pal.to_status = 'payment_confirmed'
    AND COALESCE(pal.changed_at, pal.created_at) >= now() - interval '30 days';

  SELECT COALESCE(SUM(
    CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
      THEN pal.amount * pal.payment_exchange_rate ELSE pal.amount END
  ), 0) INTO v_burn_prev
  FROM po_payment_audit_logs pal
  WHERE pal.company_id = p_company_id
    AND pal.to_status = 'payment_confirmed'
    AND COALESCE(pal.changed_at, pal.created_at) >= now() - interval '60 days'
    AND COALESCE(pal.changed_at, pal.created_at) < now() - interval '30 days';

  -- Historical overdue (7d ago snapshot)
  SELECT COALESCE(SUM(po.po_value_base_currency), 0) INTO v_overdue_prev
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.created_at <= now() - interval '7 days'
    AND po.status NOT IN ('cancelled', 'completed', 'delivered')
    AND (po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled') OR po.updated_at > now() - interval '7 days')
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) < now() - interval '7 days';

  -- Historical payable (7d ago snapshot)
  SELECT COALESCE(SUM(po.po_value_base_currency), 0) INTO v_payable_prev
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.created_at <= now() - interval '7 days'
    AND po.status NOT IN ('cancelled', 'completed', 'delivered')
    AND (po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled') OR po.updated_at > now() - interval '7 days');

  v_avg_daily_burn := CASE WHEN v_burn_30d > 0 THEN v_burn_30d / 30.0 ELSE 0 END;

  -- FIX #3 partial: use ROUND for normal, CEIL only for high/critical (applied after severity)
  IF v_avg_daily_burn > 0 THEN
    v_clearance_days := ROUND(v_total_payable / v_avg_daily_burn);
  ELSE
    v_clearance_days := 0;
  END IF;

  -- FIX #4: Burn multiplier floor threshold to prevent spike on tiny burn
  IF v_burn_30d >= 10000 THEN
    v_burn_multiplier := ROUND(v_payable_7d / (v_burn_30d / 4.0), 1);
  ELSE
    v_burn_multiplier := 0;
  END IF;

  v_has_high_outflow := v_burn_multiplier >= 1.5;

  -- Top vendor (grouped by supplier_id, display name via MAX)
  SELECT COALESCE(MAX(po.vendor_name), 'N/A'), COALESCE(SUM(po.po_value_base_currency), 0)
  INTO v_top_vendor_name, v_top_vendor_amount
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status NOT IN ('cancelled', 'completed', 'delivered')
    AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
  GROUP BY po.supplier_id
  ORDER BY SUM(po.po_value_base_currency) DESC LIMIT 1;

  IF v_total_payable > 0 THEN
    v_top_vendor_share := ROUND((v_top_vendor_amount / v_total_payable) * 100, 1);
  END IF;

  v_concentration_risk := v_top_vendor_share >= 50;

  -- FIX #2: Severity with proper separation of overdue existence vs severity
  IF v_overdue_worst_days >= 7 THEN
    v_payable_severity := 'critical';
  ELSIF v_overdue_amount > 0 THEN
    v_payable_severity := 'high';
  ELSIF v_burn_multiplier >= 2.0 THEN
    v_payable_severity := 'critical';
  ELSIF v_burn_multiplier >= 1.5 OR v_concentration_risk THEN
    v_payable_severity := 'high';
  ELSIF v_payable_7d > 0 THEN
    v_payable_severity := 'elevated';
  END IF;

  v_due7_sev := CASE
    WHEN v_burn_multiplier >= 2.0 THEN 'critical'
    WHEN v_burn_multiplier >= 1.5 THEN 'high'
    WHEN v_payable_7d > 0 THEN 'elevated'
    ELSE 'normal'
  END;

  -- FIX #8: Explicit vendor concentration severity
  v_conc_sev := CASE
    WHEN v_top_vendor_share >= 80 THEN 'critical'
    WHEN v_top_vendor_share >= 60 THEN 'high'
    ELSE 'moderate'
  END;

  -- Formatting
  v_fmt_overdue := CASE WHEN v_overdue_amount >= 100000 THEN ROUND(v_overdue_amount / 100000, 1) || 'L' ELSE ROUND(v_overdue_amount / 1000) || 'K' END;
  v_fmt_payable_7d := CASE WHEN v_payable_7d >= 100000 THEN ROUND(v_payable_7d / 100000, 1) || 'L' ELSE ROUND(v_payable_7d / 1000) || 'K' END;
  v_fmt_total_payable := CASE WHEN v_total_payable >= 100000 THEN ROUND(v_total_payable / 100000, 1) || 'L' ELSE ROUND(v_total_payable / 1000) || 'K' END;

  -- FIX #6: Headline green state uses total_payable, not payable_7d
  IF v_has_overdue AND v_overdue_worst_days >= 7 THEN
    v_headline := format('🔴 ₹%s overdue (%s days) — supply disruption risk imminent', v_fmt_overdue, v_overdue_worst_days);
  ELSIF v_has_overdue THEN
    v_headline := format('🟠 ₹%s overdue — clear within 3 days to avoid escalation', v_fmt_overdue);
  ELSIF v_burn_multiplier >= 2.0 THEN
    v_headline := format('🟠 ₹%s due this week (%sx burn) — liquidity pressure ahead', v_fmt_payable_7d, v_burn_multiplier);
  ELSIF v_concentration_risk THEN
    v_headline := format('🟡 %s%% vendor concentration — diversification required', v_top_vendor_share);
  ELSIF v_total_payable > 0 THEN
    v_headline := format('🟢 ₹%s payable — clears in ~%s days at current burn', v_fmt_total_payable, v_clearance_days);
  ELSE
    v_headline := '✅ No immediate financial pressure detected';
  END IF;

  -- Alerts
  v_alerts := '[]'::jsonb;

  IF v_has_overdue THEN
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'type', 'overdue_payments', 'severity', v_payable_severity,
      'metric', v_overdue_worst_days, 'message', format('₹%s overdue for %s days', v_fmt_overdue, v_overdue_worst_days)
    ));
  END IF;

  IF v_has_high_outflow THEN
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'type', 'high_outflow', 'severity', v_due7_sev,
      'metric', v_burn_multiplier, 'message', format('%sx weekly burn this week', v_burn_multiplier)
    ));
  END IF;

  -- FIX #8: Use dedicated concentration severity
  IF v_concentration_risk THEN
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'type', 'vendor_concentration',
      'severity', v_conc_sev,
      'metric', v_top_vendor_share, 'message', format('%s holds %s%% of exposure', v_top_vendor_name, v_top_vendor_share)
    ));
  END IF;

  -- Actions
  v_actions := '[]'::jsonb;

  IF v_has_overdue THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action', 'clear_overdue',
      'label', format('Clear ₹%s overdue immediately', v_fmt_overdue),
      'priority_score', LEAST(100, 60 + LEAST(v_overdue_worst_days, 15) * 2 + CASE WHEN v_overdue_amount > 500000 THEN 10 ELSE 0 END),
      'confidence', CASE WHEN v_overdue_worst_days >= 14 THEN 95 WHEN v_overdue_worst_days >= 7 THEN 85 ELSE 75 END,
      -- FIX #7: Correct terminology — no "runway" without cash variable
      'impact', format('Improves clearance by ~%s days', LEAST(v_overdue_worst_days, 30)),
      'category', 'overdue'
    ));
  END IF;

  IF v_has_high_outflow AND NOT v_has_overdue THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action', 'reduce_outflow',
      'label', format('Review ₹%s due this week — defer non-critical', v_fmt_payable_7d),
      'priority_score', LEAST(100, 50 + CASE WHEN v_burn_multiplier >= 2.0 THEN 30 ELSE 15 END),
      'confidence', 70,
      'impact', format('Reduce weekly burn from %sx to target', v_burn_multiplier),
      'category', 'burn'
    ));
  END IF;

  IF v_concentration_risk THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action', 'diversify_vendors',
      'label', format('Reduce %s exposure from %s%%', v_top_vendor_name, v_top_vendor_share),
      'priority_score', CASE WHEN v_top_vendor_share >= 70 THEN 65 ELSE 45 END,
      'confidence', 60,
      'impact', 'Reduce single-vendor disruption risk',
      'category', 'concentration'
    ));
  END IF;

  -- Deterministic ordering
  SELECT COALESCE(jsonb_agg(a ORDER BY (a->>'priority_score')::int DESC), '[]'::jsonb)
  INTO v_actions FROM jsonb_array_elements(v_actions) a;

  -- FIX #5: Trend calculations with floor guard to prevent wild swings
  v_trends := jsonb_build_array(
    jsonb_build_object('metric', 'burn_30d_vs_prev_pct',
      'value', CASE WHEN v_burn_prev >= 10000 THEN ROUND(((v_burn_30d - v_burn_prev) / v_burn_prev) * 100, 1) ELSE 0 END,
      'direction', CASE WHEN v_burn_30d > v_burn_prev THEN 'up' WHEN v_burn_30d < v_burn_prev THEN 'down' ELSE 'flat' END),
    jsonb_build_object('metric', 'overdue_change_pct',
      'value', CASE WHEN v_overdue_prev >= 10000 THEN ROUND(((v_overdue_amount - v_overdue_prev) / v_overdue_prev) * 100, 1) ELSE 0 END,
      'direction', CASE WHEN v_overdue_amount > v_overdue_prev THEN 'up' WHEN v_overdue_amount < v_overdue_prev THEN 'down' ELSE 'flat' END),
    jsonb_build_object('metric', 'payable_growth_pct',
      'value', CASE WHEN v_payable_prev >= 10000 THEN ROUND(((v_total_payable - v_payable_prev) / v_payable_prev) * 100, 1) ELSE 0 END,
      'direction', CASE WHEN v_total_payable > v_payable_prev THEN 'up' WHEN v_total_payable < v_payable_prev THEN 'down' ELSE 'flat' END)
  );

  -- Confidence based on data completeness
  v_confidence := LEAST(95, 50
    + CASE WHEN v_total_payable > 0 THEN 20 ELSE 0 END
    + CASE WHEN v_burn_30d > 0 THEN 15 ELSE 0 END
    + CASE WHEN v_overdue_amount IS NOT NULL THEN 10 ELSE 0 END);

  -- FIX #3: Health score rebalanced — overdue weight reduced, concentration/trend increased
  v_health_score := GREATEST(0, LEAST(100,
    100
    - LEAST(v_overdue_worst_days * 3, 30)
    - CASE WHEN v_burn_multiplier >= 2.0 THEN 25 WHEN v_burn_multiplier >= 1.5 THEN 15 ELSE 0 END
    - CASE WHEN v_top_vendor_share >= 80 THEN 20 WHEN v_top_vendor_share >= 60 THEN 15 WHEN v_top_vendor_share >= 50 THEN 10 ELSE 0 END
    - CASE WHEN v_burn_30d > v_burn_prev AND v_burn_prev >= 10000 AND ((v_burn_30d - v_burn_prev) / v_burn_prev) > 0.2 THEN 15 ELSE 0 END
  ));

  RETURN jsonb_build_object(
    'summary', jsonb_build_object(
      'total_payable', v_total_payable, 'payable_7d', v_payable_7d,
      'overdue', v_overdue_amount, 'overdue_worst_days', v_overdue_worst_days,
      'burn_30d', v_burn_30d, 'avg_daily_burn', v_avg_daily_burn,
      'clearance_days', v_clearance_days, 'top_vendor', v_top_vendor_name,
      'top_vendor_amount', v_top_vendor_amount, 'top_vendor_share', v_top_vendor_share,
      'total_vendors', v_total_vendors),
    'insights', jsonb_build_object(
      'payable', jsonb_build_object(
        'severity', v_payable_severity, 'concentration_risk', v_concentration_risk,
        'top_vendor', v_top_vendor_name, 'top_vendor_share', v_top_vendor_share,
        'clearance_days', v_clearance_days,
        'clearance_label', format('Clears in ~%s days at current burn', v_clearance_days)),
      'burn', jsonb_build_object(
        'multiplier', v_burn_multiplier, 'severity', v_due7_sev, 'avg_daily', v_avg_daily_burn)),
    'headline', v_headline,
    'actions', v_actions,
    'alerts', v_alerts,
    'trends', v_trends,
    'system_confidence', v_confidence,
    'health_score', v_health_score,
    'base_currency', v_base_currency,
    'generated_at', now()
  );
END;
$$;
