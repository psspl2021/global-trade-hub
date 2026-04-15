
-- Fix: replace pal.new_data->>'amount' with pal.amount (direct column)
-- in both get_cfo_financial_summary and get_cfo_decision_intelligence

-- 1. Fix get_cfo_financial_summary
CREATE OR REPLACE FUNCTION public.get_cfo_financial_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_org_base text := 'INR';
  v_payables jsonb;
  v_aging jsonb;
  v_burn jsonb;
  v_vendor jsonb;
BEGIN
  SELECT company_id INTO v_company_id
  FROM buyer_company_members
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No company');
  END IF;

  SELECT COALESCE(bc.base_currency, 'INR') INTO v_org_base
  FROM buyer_companies bc WHERE bc.id = v_company_id;

  -- Payables
  SELECT jsonb_build_object(
    'total_payable_base', COALESCE(SUM(CASE WHEN payment_workflow_status NOT IN ('payment_confirmed','cancelled') THEN po_value_base_currency ELSE 0 END), 0),
    'total_paid_base', COALESCE(SUM(CASE WHEN payment_workflow_status = 'payment_confirmed' THEN po_value_base_currency ELSE 0 END), 0),
    'by_currency', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'currency', sub.currency,
        'payable', sub.payable,
        'paid', sub.paid
      ))
      FROM (
        SELECT currency,
          SUM(CASE WHEN payment_workflow_status NOT IN ('payment_confirmed','cancelled') THEN po_value ELSE 0 END) AS payable,
          SUM(CASE WHEN payment_workflow_status = 'payment_confirmed' THEN po_value ELSE 0 END) AS paid
        FROM purchase_orders WHERE buyer_company_id = v_company_id
        GROUP BY currency
      ) sub
    ), '[]'::jsonb),
    'org_base_currency', v_org_base
  ) INTO v_payables
  FROM purchase_orders WHERE buyer_company_id = v_company_id;

  -- Aging
  SELECT jsonb_build_object(
    'overdue_base', COALESCE(SUM(CASE WHEN expected_delivery_date < now() AND payment_workflow_status NOT IN ('payment_confirmed','cancelled') THEN po_value_base_currency ELSE 0 END), 0),
    'due_7d_base', COALESCE(SUM(CASE WHEN expected_delivery_date BETWEEN now() AND now() + interval '7 days' AND payment_workflow_status NOT IN ('payment_confirmed','cancelled') THEN po_value_base_currency ELSE 0 END), 0),
    'due_30d_base', COALESCE(SUM(CASE WHEN expected_delivery_date BETWEEN now() AND now() + interval '30 days' AND payment_workflow_status NOT IN ('payment_confirmed','cancelled') THEN po_value_base_currency ELSE 0 END), 0)
  ) INTO v_aging
  FROM purchase_orders WHERE buyer_company_id = v_company_id;

  -- Burn rate from confirmed payments (FIXED: use pal.amount directly)
  SELECT jsonb_build_object(
    'burn_30d', COALESCE(SUM(
      CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
           THEN COALESCE(pal.amount, 0) * pal.payment_exchange_rate
           ELSE COALESCE(pal.amount, 0) END
    ), 0),
    'burn_7d', COALESCE((
      SELECT SUM(
        CASE WHEN p2.payment_exchange_rate IS NOT NULL AND p2.payment_exchange_rate > 0
             THEN COALESCE(p2.amount, 0) * p2.payment_exchange_rate
             ELSE COALESCE(p2.amount, 0) END
      ) FROM po_payment_audit_logs p2
      JOIN purchase_orders po2 ON po2.id = p2.po_id
      WHERE p2.to_status = 'payment_confirmed'
        AND p2.created_at >= now() - interval '7 days'
        AND po2.buyer_company_id = v_company_id
    ), 0)
  ) INTO v_burn
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE pal.to_status = 'payment_confirmed'
    AND pal.created_at >= now() - interval '30 days'
    AND po.buyer_company_id = v_company_id;

  -- Vendor exposure
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'contract_id', sub.contract_id,
    'total_exposure_base', sub.total_val,
    'po_count', sub.cnt,
    'currencies', sub.currencies
  ) ORDER BY sub.total_val DESC), '[]'::jsonb)
  INTO v_vendor
  FROM (
    SELECT contract_id,
      SUM(po_value_base_currency) AS total_val,
      COUNT(*) AS cnt,
      array_agg(DISTINCT currency) AS currencies
    FROM purchase_orders
    WHERE buyer_company_id = v_company_id
      AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    GROUP BY contract_id
    ORDER BY total_val DESC LIMIT 5
  ) sub;

  RETURN jsonb_build_object(
    'payables', v_payables,
    'aging', v_aging,
    'burn_rate', v_burn,
    'vendor_exposure', v_vendor,
    'org_base_currency', v_org_base
  );
END;
$$;

-- 2. Fix get_cfo_decision_intelligence (same pal.new_data bug)
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
  v_due_7d numeric;
  v_multiplier numeric;
  v_top_vendor record;
  v_conc_pct numeric;
  v_action record;
  v_action_confidence numeric;
  v_action_impact numeric;
  v_cooldown_check jsonb;
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

  -- Burn rate (FIXED: use pal.amount directly)
  SELECT COALESCE(SUM(
    CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
         THEN COALESCE(pal.amount, 0) * pal.payment_exchange_rate
         ELSE COALESCE(pal.amount, 0)
    END
  ), 0) INTO v_burn_30d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE pal.to_status = 'payment_confirmed'
    AND pal.created_at >= now() - interval '30 days'
    AND po.buyer_company_id = v_company_id;

  SELECT COALESCE(SUM(
    CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
         THEN COALESCE(pal.amount, 0) * pal.payment_exchange_rate
         ELSE COALESCE(pal.amount, 0)
    END
  ), 0) INTO v_burn_7d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE pal.to_status = 'payment_confirmed'
    AND pal.created_at >= now() - interval '7 days'
    AND po.buyer_company_id = v_company_id;

  -- Pending payables
  SELECT COALESCE(SUM(po_value_base_currency), 0) INTO v_pending_payable
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

  SELECT COALESCE(SUM(po_value_base_currency), 1) INTO v_total_pending
  FROM purchase_orders
  WHERE buyer_company_id = v_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed','cancelled');

  SELECT COALESCE(MAX(cnt), 1) INTO v_max_po_count
  FROM (
    SELECT COUNT(*) cnt FROM purchase_orders
    WHERE buyer_company_id = v_company_id
      AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    GROUP BY supplier_id
  ) sub;

  -- Priority vendors with supplier_priority_profiles JOIN
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

  -- ALERTS with cooldown checks
  IF v_burn_30d > 0 THEN
    SELECT COALESCE(SUM(po.po_value_base_currency), 0) INTO v_due_7d
    FROM purchase_orders po
    WHERE po.buyer_company_id = v_company_id
      AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
      AND COALESCE(po.payment_due_date, po.expected_delivery_date) BETWEEN now() AND now() + interval '7 days';

    v_multiplier := ROUND((v_due_7d / GREATEST(v_burn_30d / 4.0, 1))::numeric, 1);

    IF v_multiplier > 1.5 THEN
      SELECT check_alert_cooldown(
        v_company_id,
        'high_outflow_week',
        'high_outflow_week_' || v_company_id::text,
        interval '4 hours'
      ) INTO v_cooldown_check;

      IF (v_cooldown_check->>'should_alert')::boolean THEN
        v_alerts := v_alerts || jsonb_build_object(
          'alert_type', 'high_outflow_week',
          'severity', CASE WHEN v_multiplier > 3.0 THEN 'critical' ELSE 'warning' END,
          'details', jsonb_build_object('due_7d', v_due_7d, 'multiplier', v_multiplier)
        );
      END IF;
    END IF;
  END IF;

  -- Low runway alert
  IF v_runway_days IS NOT NULL AND v_runway_days < 14 THEN
    SELECT check_alert_cooldown(
      v_company_id,
      'low_runway',
      'low_runway_' || v_company_id::text,
      interval '6 hours'
    ) INTO v_cooldown_check;

    IF (v_cooldown_check->>'should_alert')::boolean THEN
      v_alerts := v_alerts || jsonb_build_object(
        'alert_type', 'low_runway',
        'severity', CASE WHEN v_runway_days < 7 THEN 'critical' ELSE 'warning' END,
        'details', jsonb_build_object('runway_days', v_runway_days)
      );
    END IF;
  END IF;

  -- Vendor concentration alert
  SELECT INTO v_top_vendor supplier_id, SUM(po_value_base_currency) AS total_exp
  FROM purchase_orders
  WHERE buyer_company_id = v_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
  GROUP BY supplier_id
  ORDER BY total_exp DESC LIMIT 1;

  IF v_top_vendor IS NOT NULL AND v_total_pending > 0 THEN
    v_conc_pct := ROUND((v_top_vendor.total_exp / v_total_pending * 100)::numeric, 1);
    IF v_conc_pct > 40 THEN
      SELECT check_alert_cooldown(
        v_company_id,
        'vendor_concentration',
        'vendor_conc_' || v_company_id::text,
        interval '12 hours'
      ) INTO v_cooldown_check;

      IF (v_cooldown_check->>'should_alert')::boolean THEN
        v_alerts := v_alerts || jsonb_build_object(
          'alert_type', 'vendor_concentration',
          'severity', CASE WHEN v_conc_pct > 60 THEN 'critical' ELSE 'warning' END,
          'details', jsonb_build_object('concentration_pct', v_conc_pct, 'supplier_id', v_top_vendor.supplier_id)
        );
      END IF;
    END IF;
  END IF;

  -- Suggested actions from overdue POs
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
      'supplier_priority', v_action.supplier_priority
    );
  END LOOP;

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
    'simulation', v_simulation
  );
END;
$function$;
