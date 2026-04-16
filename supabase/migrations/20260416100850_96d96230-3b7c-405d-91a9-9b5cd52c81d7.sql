
CREATE OR REPLACE FUNCTION public.get_cfo_decision_intelligence()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_org_base_currency text := 'INR';
  v_burn_30d numeric := 0;
  v_burn_7d numeric := 0;
  v_avg_daily_burn numeric;
  v_pending_payable numeric := 0;
  v_runway_days numeric;
  v_total_pending numeric := 0;
  v_max_po_count numeric := 1;
  v_runway jsonb;
  v_vendors jsonb;
  v_alerts jsonb := '[]'::jsonb;
  v_actions jsonb := '[]'::jsonb;
  v_simulation jsonb;
  v_projected_runway numeric;
  v_freed_by_actions numeric := 0;
  v_due_7d numeric := 0;
  v_multiplier numeric := 0;
  v_top_vendor record;
  v_conc_pct numeric := 0;
  v_action record;
  v_action_confidence numeric;
  v_action_impact numeric;
  v_cooldown_check jsonb;
  v_insights jsonb;
  v_overdue_total numeric := 0;
  v_overdue_worst_days int := 0;
  v_overdue_vendor_count int := 0;
  v_due7_po_count int := 0;
  v_due7_vendor_count int := 0;
  v_open_po_count int := 0;
  v_open_vendor_count int := 0;
  v_top_action_consequence text := 'No urgent actions required';
  v_stacked_alerts text[] := ARRAY[]::text[];
BEGIN
  SELECT company_id INTO v_company_id
  FROM buyer_company_members
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active company membership');
  END IF;

  SELECT COALESCE(bc.base_currency, 'INR') INTO v_org_base_currency
  FROM buyer_companies bc WHERE bc.id = v_company_id;

  -- Burn rate
  SELECT COALESCE(SUM(
    CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
         THEN COALESCE(pal.amount, 0) * pal.payment_exchange_rate
         ELSE COALESCE(pal.amount, 0) END
  ), 0) INTO v_burn_30d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE pal.to_status = 'payment_confirmed'
    AND pal.created_at >= now() - interval '30 days'
    AND po.buyer_company_id = v_company_id;

  SELECT COALESCE(SUM(
    CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
         THEN COALESCE(pal.amount, 0) * pal.payment_exchange_rate
         ELSE COALESCE(pal.amount, 0) END
  ), 0) INTO v_burn_7d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE pal.to_status = 'payment_confirmed'
    AND pal.created_at >= now() - interval '7 days'
    AND po.buyer_company_id = v_company_id;

  -- Pending payables
  SELECT COALESCE(SUM(po_value_base_currency), 0), COUNT(*), COUNT(DISTINCT supplier_id)
  INTO v_pending_payable, v_open_po_count, v_open_vendor_count
  FROM purchase_orders
  WHERE buyer_company_id = v_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed','cancelled');

  v_avg_daily_burn := NULLIF(v_burn_30d, 0) / 30.0;

  IF v_avg_daily_burn IS NOT NULL AND v_avg_daily_burn > 0 THEN
    v_runway_days := v_pending_payable / v_avg_daily_burn;
  ELSE
    v_runway_days := NULL;
  END IF;

  v_runway := jsonb_build_object(
    'daily_burn', COALESCE(v_avg_daily_burn, 0),
    'pending_payable', v_pending_payable,
    'runway_days', v_runway_days,
    'burn_7d', v_burn_7d,
    'burn_30d', v_burn_30d,
    'burn_ratio_7d_vs_avg', CASE
      WHEN v_burn_30d > 0 THEN ROUND((v_burn_7d / (v_burn_30d / 4.0))::numeric, 1)
      ELSE 0 END,
    'org_base_currency', v_org_base_currency
  );

  v_total_pending := GREATEST(v_pending_payable, 1);

  SELECT COALESCE(MAX(cnt), 1) INTO v_max_po_count
  FROM (
    SELECT COUNT(*) cnt FROM purchase_orders
    WHERE buyer_company_id = v_company_id
      AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    GROUP BY supplier_id
  ) sub;

  -- Due 7d metrics
  SELECT COALESCE(SUM(po_value_base_currency), 0), COUNT(*), COUNT(DISTINCT supplier_id)
  INTO v_due_7d, v_due7_po_count, v_due7_vendor_count
  FROM purchase_orders
  WHERE buyer_company_id = v_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    AND COALESCE(payment_due_date, expected_delivery_date) BETWEEN now() AND now() + interval '7 days';

  v_multiplier := CASE WHEN v_burn_30d > 0 THEN ROUND((v_due_7d / GREATEST(v_burn_30d / 4.0, 1))::numeric, 1) ELSE 0 END;

  -- Overdue metrics
  SELECT COALESCE(SUM(po_value_base_currency), 0),
         COALESCE(MAX(EXTRACT(DAY FROM now() - COALESCE(payment_due_date, expected_delivery_date))::int), 0),
         COUNT(DISTINCT supplier_id)
  INTO v_overdue_total, v_overdue_worst_days, v_overdue_vendor_count
  FROM purchase_orders
  WHERE buyer_company_id = v_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    AND COALESCE(payment_due_date, expected_delivery_date) < now()
    AND COALESCE(payment_due_date, expected_delivery_date) IS NOT NULL;

  -- Vendor concentration
  SELECT INTO v_top_vendor supplier_id, SUM(po_value_base_currency) AS total_exp
  FROM purchase_orders
  WHERE buyer_company_id = v_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
  GROUP BY supplier_id
  ORDER BY total_exp DESC LIMIT 1;

  IF v_top_vendor IS NOT NULL AND v_total_pending > 0 THEN
    v_conc_pct := ROUND((v_top_vendor.total_exp / v_total_pending * 100)::numeric, 1);
  END IF;

  -- Build centralized insights
  v_insights := jsonb_build_object(
    'payable', jsonb_build_object(
      'severity', CASE WHEN v_conc_pct >= 80 THEN 'critical' WHEN v_conc_pct >= 60 THEN 'high' ELSE 'normal' END,
      'concentration_risk', v_conc_pct >= 60,
      'top_vendor_share', v_conc_pct,
      'vendor_count', v_open_vendor_count,
      'po_count', v_open_po_count,
      'runway_equivalent_days', CASE WHEN v_avg_daily_burn > 0 THEN ROUND((v_pending_payable / v_avg_daily_burn)::numeric, 0) ELSE NULL END,
      'consequence', CASE
        WHEN v_conc_pct >= 80 THEN v_conc_pct || '% concentration risk — single vendor failure disrupts all supply'
        WHEN v_conc_pct >= 60 THEN v_conc_pct || '% in top vendor — diversification needed'
        ELSE 'Vendor spread healthy'
      END
    ),
    'due7', jsonb_build_object(
      'severity', CASE WHEN v_multiplier >= 2 THEN 'critical' WHEN v_multiplier >= 1.5 THEN 'high' WHEN v_due7_po_count > 0 THEN 'moderate' ELSE 'clear' END,
      'burn_multiplier', v_multiplier,
      'total', v_due_7d,
      'po_count', v_due7_po_count,
      'vendor_count', v_due7_vendor_count,
      'runway_impact_days', CASE WHEN v_avg_daily_burn > 0 THEN ROUND((v_due_7d / v_avg_daily_burn)::numeric, 0) ELSE NULL END,
      'consequence', CASE
        WHEN v_multiplier >= 2 THEN 'Outflow ' || v_multiplier || 'x normal — runway drops by ~' || CASE WHEN v_avg_daily_burn > 0 THEN ROUND((v_due_7d / v_avg_daily_burn)::numeric, 0)::text ELSE '?' END || ' days'
        WHEN v_due7_po_count > 0 THEN v_due7_po_count || ' POs due — plan liquidity'
        ELSE 'No immediate outflow pressure'
      END
    ),
    'overdue', jsonb_build_object(
      'severity', CASE WHEN v_overdue_worst_days > 14 THEN 'critical' WHEN v_overdue_worst_days > 7 THEN 'high' WHEN v_overdue_total > 0 THEN 'moderate' ELSE 'clear' END,
      'worst_days', v_overdue_worst_days,
      'total', v_overdue_total,
      'vendor_count', v_overdue_vendor_count,
      'consequence', CASE
        WHEN v_overdue_worst_days > 14 THEN 'Stuck cash blocking vendor cycle — escalation risk in ' || GREATEST(21 - v_overdue_worst_days, 1) || ' days'
        WHEN v_overdue_worst_days > 7 THEN 'Payment delay affecting supplier trust'
        WHEN v_overdue_total > 0 THEN 'Minor delays — monitor closely'
        ELSE 'All payments on schedule'
      END
    ),
    'vendor', jsonb_build_object(
      'concentration_pct', v_conc_pct,
      'risk_level', CASE WHEN v_conc_pct >= 70 THEN 'high' WHEN v_conc_pct >= 40 THEN 'moderate' ELSE 'diversified' END
    ),
    'stacked_alerts', v_stacked_alerts
  );

  -- Priority vendors
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.risk_score DESC), '[]'::jsonb)
  INTO v_vendors
  FROM (
    SELECT
      po.supplier_id,
      COUNT(*) AS po_count,
      SUM(po.po_value_base_currency) AS total_exposure,
      SUM(CASE WHEN COALESCE(po.payment_due_date, po.expected_delivery_date) < now() THEN po.po_value_base_currency ELSE 0 END) AS overdue_amount,
      MAX(EXTRACT(DAY FROM now() - COALESCE(po.payment_due_date, po.expected_delivery_date))::int)
        FILTER (WHERE COALESCE(po.payment_due_date, po.expected_delivery_date) < now()) AS max_days_overdue,
      ROUND((
        (SUM(CASE WHEN COALESCE(po.payment_due_date, po.expected_delivery_date) < now() THEN po.po_value_base_currency ELSE 0 END) / v_total_pending) * 0.5
        + (SUM(po.po_value_base_currency) / v_total_pending) * 0.4
        + (COUNT(*)::numeric / v_max_po_count) * 0.1
      )::numeric * 100, 1) AS risk_score,
      COALESCE(spp.priority, 'standard') AS supplier_priority
    FROM purchase_orders po
    LEFT JOIN supplier_priority_profiles spp
      ON spp.supplier_id = po.supplier_id AND spp.company_id = v_company_id
    WHERE po.buyer_company_id = v_company_id
      AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    GROUP BY po.supplier_id, spp.priority
    ORDER BY risk_score DESC
    LIMIT 10
  ) t;

  -- ALERTS with cooldown
  IF v_burn_30d > 0 AND v_multiplier > 1.5 THEN
    SELECT check_alert_cooldown(v_company_id, 'high_outflow_week', 'high_outflow_week_' || v_company_id::text, interval '4 hours') INTO v_cooldown_check;
    IF (v_cooldown_check->>'should_alert')::boolean THEN
      v_alerts := v_alerts || jsonb_build_object(
        'alert_type', 'high_outflow_week',
        'severity', CASE WHEN v_multiplier > 3.0 THEN 'critical' ELSE 'warning' END,
        'details', jsonb_build_object('due_7d', v_due_7d, 'multiplier', v_multiplier)
      );
      v_stacked_alerts := array_append(v_stacked_alerts, 'High outflow week (' || v_multiplier || 'x burn)');
    END IF;
  END IF;

  IF v_runway_days IS NOT NULL AND v_runway_days < 14 THEN
    SELECT check_alert_cooldown(v_company_id, 'low_runway', 'low_runway_' || v_company_id::text, interval '6 hours') INTO v_cooldown_check;
    IF (v_cooldown_check->>'should_alert')::boolean THEN
      v_alerts := v_alerts || jsonb_build_object(
        'alert_type', 'low_runway',
        'severity', CASE WHEN v_runway_days < 7 THEN 'critical' ELSE 'warning' END,
        'details', jsonb_build_object('runway_days', v_runway_days)
      );
      v_stacked_alerts := array_append(v_stacked_alerts, 'Low runway (' || ROUND(v_runway_days, 0) || ' days)');
    END IF;
  END IF;

  IF v_conc_pct > 40 THEN
    SELECT check_alert_cooldown(v_company_id, 'vendor_concentration', 'vendor_conc_' || v_company_id::text, interval '12 hours') INTO v_cooldown_check;
    IF (v_cooldown_check->>'should_alert')::boolean THEN
      v_alerts := v_alerts || jsonb_build_object(
        'alert_type', 'vendor_concentration',
        'severity', CASE WHEN v_conc_pct > 60 THEN 'critical' ELSE 'warning' END,
        'details', jsonb_build_object('concentration_pct', v_conc_pct, 'supplier_id', v_top_vendor.supplier_id)
      );
      v_stacked_alerts := array_append(v_stacked_alerts, 'Vendor concentration (' || v_conc_pct || '%)');
    END IF;
  END IF;

  IF v_overdue_worst_days > 7 THEN
    v_stacked_alerts := array_append(v_stacked_alerts, 'Overdue ' || v_overdue_worst_days || 'd — stuck cash');
  END IF;

  -- Update stacked alerts in insights
  v_insights := jsonb_set(v_insights, '{stacked_alerts}', to_jsonb(v_stacked_alerts));

  -- Suggested actions from overdue POs with predictive consequences
  FOR v_action IN
    SELECT
      po.id AS po_id,
      po.po_number,
      po.supplier_id,
      po.po_value_base_currency AS amount,
      COALESCE(po.payment_due_date, po.expected_delivery_date) AS due_date,
      EXTRACT(DAY FROM now() - COALESCE(po.payment_due_date, po.expected_delivery_date))::int AS days_overdue,
      COALESCE(spp.priority, 'standard') AS supplier_priority
    FROM purchase_orders po
    LEFT JOIN supplier_priority_profiles spp
      ON spp.supplier_id = po.supplier_id AND spp.company_id = v_company_id
    WHERE po.buyer_company_id = v_company_id
      AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
      AND COALESCE(po.payment_due_date, po.expected_delivery_date) < now()
    ORDER BY po.po_value_base_currency DESC
    LIMIT 5
  LOOP
    v_action_confidence := LEAST(95, 60 + v_action.days_overdue * 2);
    v_action_impact := v_action.amount;
    v_freed_by_actions := v_freed_by_actions + v_action.amount;

    v_actions := v_actions || jsonb_build_object(
      'action_type', CASE
        WHEN v_action.supplier_priority = 'critical' THEN 'prioritize_payment'
        WHEN v_action.days_overdue > 30 THEN 'escalate_payment'
        WHEN v_action.days_overdue > 14 THEN 'negotiate_terms'
        ELSE 'schedule_payment'
      END,
      'po_id', v_action.po_id,
      'po_number', v_action.po_number,
      'supplier_id', v_action.supplier_id,
      'amount', v_action.amount,
      'days_overdue', v_action.days_overdue,
      'confidence', v_action_confidence,
      'impact', v_action_impact,
      'supplier_priority', v_action.supplier_priority,
      'runway_impact_days', CASE WHEN v_avg_daily_burn > 0 THEN ROUND((v_action.amount / v_avg_daily_burn)::numeric, 0) ELSE NULL END,
      'inaction_consequence', CASE
        WHEN v_action.days_overdue > 30 THEN 'Escalation imminent — vendor may halt supply within days'
        WHEN v_action.days_overdue > 14 THEN 'Supply disruption risk in ~' || (21 - LEAST(v_action.days_overdue, 20)) || ' days'
        ELSE 'Vendor trust eroding — act within 7 days'
      END
    );
  END LOOP;

  -- Top action for card preview
  IF jsonb_array_length(v_actions) > 0 THEN
    v_insights := jsonb_set(v_insights, '{decision}', jsonb_build_object(
      'top_action', (v_actions->0)->>'po_number',
      'top_action_amount', (v_actions->0)->>'amount',
      'top_action_type', (v_actions->0)->>'action_type',
      'confidence', (v_actions->0)->>'confidence',
      'runway_impact_days', (v_actions->0)->>'runway_impact_days',
      'inaction_consequence', (v_actions->0)->>'inaction_consequence',
      'action_count', jsonb_array_length(v_actions)
    ));
  ELSE
    v_insights := jsonb_set(v_insights, '{decision}', jsonb_build_object(
      'top_action', NULL,
      'top_action_amount', 0,
      'top_action_type', 'none',
      'confidence', 0,
      'runway_impact_days', NULL,
      'inaction_consequence', 'No overdue — maintain current payment discipline',
      'action_count', 0
    ));
  END IF;

  -- Simulation
  v_projected_runway := CASE
    WHEN v_avg_daily_burn IS NOT NULL AND v_avg_daily_burn > 0
    THEN (v_pending_payable - v_freed_by_actions) / v_avg_daily_burn
    ELSE NULL
  END;

  v_simulation := jsonb_build_object(
    'current_runway_days', v_runway_days,
    'projected_runway_days', v_projected_runway,
    'freed_by_actions', v_freed_by_actions,
    'action_count', jsonb_array_length(v_actions)
  );

  RETURN jsonb_build_object(
    'runway', v_runway,
    'vendors', v_vendors,
    'alerts', v_alerts,
    'actions', v_actions,
    'simulation', v_simulation,
    'insights', v_insights
  );
END;
$function$;
