
-- 1. Supplier priority enum + column
DO $$ BEGIN
  CREATE TYPE public.supplier_priority AS ENUM ('critical','standard','low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS supplier_priority supplier_priority NOT NULL DEFAULT 'standard';

-- 2. Company base currency
ALTER TABLE public.buyer_companies
  ADD COLUMN IF NOT EXISTS base_currency TEXT NOT NULL DEFAULT 'INR';

-- 3. Update cron to use monitoring wrapper (correct job name)
SELECT cron.unschedule('refresh-cfo-cashflow-summary');

SELECT cron.schedule(
  'refresh-cfo-cashflow-summary',
  '*/15 * * * *',
  $$SELECT public.refresh_cfo_with_monitoring();$$
);

-- 4. Rebuild decision intelligence RPC
CREATE OR REPLACE FUNCTION public.get_cfo_decision_intelligence()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
BEGIN
  -- Resolve company
  SELECT company_id INTO v_company_id
  FROM buyer_company_members
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active company membership');
  END IF;

  -- Get org base currency
  SELECT COALESCE(bc.base_currency, 'INR') INTO v_org_base_currency
  FROM buyer_companies bc WHERE bc.id = v_company_id;

  -- Burn rate from confirmed payments (audit logs)
  SELECT COALESCE(SUM(
    CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
         THEN (pal.new_data->>'amount')::numeric * pal.payment_exchange_rate
         ELSE (pal.new_data->>'amount')::numeric
    END
  ), 0) INTO v_burn_30d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE pal.to_status = 'payment_confirmed'
    AND pal.created_at >= now() - interval '30 days'
    AND po.buyer_company_id = v_company_id;

  SELECT COALESCE(SUM(
    CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
         THEN (pal.new_data->>'amount')::numeric * pal.payment_exchange_rate
         ELSE (pal.new_data->>'amount')::numeric
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

  -- Runway: use NULLIF to avoid artificial values
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

  -- Total pending + max PO count for normalization
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

  -- Priority vendors with NORMALIZED risk score + supplier_priority
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.risk_score DESC), '[]'::jsonb)
  INTO v_vendors
  FROM (
    SELECT
      supplier_id,
      COUNT(*) AS po_count,
      SUM(po_value_base_currency) AS total_exposure,
      SUM(CASE WHEN expected_delivery_date < now() THEN po_value_base_currency ELSE 0 END) AS overdue_amount,
      MAX(EXTRACT(DAY FROM now() - expected_delivery_date)::int) FILTER (WHERE expected_delivery_date < now()) AS max_days_overdue,
      ROUND((
        (SUM(CASE WHEN expected_delivery_date < now() THEN po_value_base_currency ELSE 0 END) / v_total_pending) * 0.5
        + (SUM(po_value_base_currency) / v_total_pending) * 0.4
        + (COUNT(*)::numeric / v_max_po_count) * 0.1
      )::numeric * 100, 1) AS risk_score,
      MAX(supplier_priority::text) AS supplier_priority
    FROM purchase_orders
    WHERE buyer_company_id = v_company_id
      AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    GROUP BY supplier_id
    ORDER BY risk_score DESC
    LIMIT 10
  ) t;

  -- ALERTS
  -- 1. High 7-day outflow
  IF v_burn_30d > 0 THEN
    SELECT COALESCE(SUM(po_value_base_currency), 0) INTO v_due_7d
    FROM purchase_orders
    WHERE buyer_company_id = v_company_id
      AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
      AND expected_delivery_date BETWEEN now() AND now() + interval '7 days';

    v_multiplier := ROUND((v_due_7d / GREATEST(v_burn_30d / 4.0, 1))::numeric, 1);

    IF v_multiplier > 1.5 THEN
      v_alerts := v_alerts || jsonb_build_object(
        'alert_type', 'high_outflow_week',
        'severity', CASE WHEN v_multiplier > 3.0 THEN 'critical' ELSE 'warning' END,
        'details', jsonb_build_object('due_7d', v_due_7d, 'multiplier', v_multiplier)
      );
    END IF;
  END IF;

  -- 2. Low runway
  IF v_runway_days IS NOT NULL AND v_runway_days < 30 THEN
    v_alerts := v_alerts || jsonb_build_object(
      'alert_type', 'low_runway',
      'severity', CASE WHEN v_runway_days < 14 THEN 'critical' ELSE 'warning' END,
      'details', jsonb_build_object('runway_days', ROUND(v_runway_days))
    );
  END IF;

  -- 3. Vendor concentration
  SELECT supplier_id, SUM(po_value_base_currency) AS val
  INTO v_top_vendor
  FROM purchase_orders
  WHERE buyer_company_id = v_company_id
    AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
  GROUP BY supplier_id
  ORDER BY val DESC LIMIT 1;

  IF v_top_vendor IS NOT NULL AND v_pending_payable > 0 THEN
    v_conc_pct := ROUND((v_top_vendor.val / v_pending_payable * 100)::numeric, 0);
    IF v_conc_pct > 40 THEN
      v_alerts := v_alerts || jsonb_build_object(
        'alert_type', 'vendor_concentration',
        'severity', CASE WHEN v_conc_pct > 60 THEN 'critical' ELSE 'warning' END,
        'details', jsonb_build_object('vendor_id', v_top_vendor.supplier_id, 'pct', v_conc_pct)
      );
    END IF;
  END IF;

  -- SUGGESTED ACTIONS with confidence + impact
  -- Delay: non-critical suppliers, not overdue, delivery > 7 days away
  FOR v_action IN
    SELECT
      supplier_id,
      SUM(po_value_base_currency) AS amount,
      MIN(expected_delivery_date) AS next_due,
      MAX(supplier_priority::text) AS priority
    FROM purchase_orders
    WHERE buyer_company_id = v_company_id
      AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
      AND expected_delivery_date > now() + interval '7 days'
      AND supplier_priority != 'critical'
      AND NOT EXISTS (
        SELECT 1 FROM purchase_orders po2
        WHERE po2.supplier_id = purchase_orders.supplier_id
          AND po2.buyer_company_id = v_company_id
          AND po2.expected_delivery_date < now()
          AND po2.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
      )
    GROUP BY supplier_id
    HAVING SUM(po_value_base_currency) > 0
    ORDER BY SUM(po_value_base_currency) DESC
    LIMIT 3
  LOOP
    v_action_impact := v_action.amount;
    v_action_confidence := CASE
      WHEN v_action.priority = 'low' THEN 0.92
      ELSE 0.75
    END;
    v_freed_by_actions := v_freed_by_actions + v_action_impact;

    v_actions := v_actions || jsonb_build_object(
      'action_type', 'delay_payment',
      'confidence', v_action_confidence,
      'impact_value', v_action_impact,
      'risk_reduction', CASE WHEN v_action_impact > v_pending_payable * 0.1 THEN 'high' ELSE 'medium' END,
      'priority_val', 2,
      'details', jsonb_build_object(
        'vendor_id', v_action.supplier_id,
        'amount', v_action.amount,
        'suggested_delay_days', 5,
        'reason', CASE
          WHEN v_action.priority = 'low' THEN 'Low-priority supplier with no overdue POs — safe to defer'
          ELSE 'Standard supplier with delivery > 7 days away — deferral reduces short-term exposure'
        END,
        'supplier_priority', v_action.priority
      )
    );
  END LOOP;

  -- Release: critical or overdue > 14 days
  FOR v_action IN
    SELECT
      supplier_id,
      SUM(CASE WHEN expected_delivery_date < now() THEN po_value_base_currency ELSE 0 END) AS overdue_amount,
      MAX(EXTRACT(DAY FROM now() - expected_delivery_date)::int) FILTER (WHERE expected_delivery_date < now()) AS days_overdue,
      MAX(supplier_priority::text) AS priority
    FROM purchase_orders
    WHERE buyer_company_id = v_company_id
      AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')
      AND (
        supplier_priority = 'critical'
        OR expected_delivery_date < now() - interval '14 days'
      )
    GROUP BY supplier_id
    HAVING SUM(CASE WHEN expected_delivery_date < now() THEN po_value_base_currency ELSE 0 END) > 0
    ORDER BY MAX(supplier_priority::text) = 'critical' DESC,
             SUM(CASE WHEN expected_delivery_date < now() THEN po_value_base_currency ELSE 0 END) DESC
    LIMIT 3
  LOOP
    v_action_confidence := CASE
      WHEN v_action.priority = 'critical' THEN 0.95
      WHEN v_action.days_overdue > 30 THEN 0.90
      ELSE 0.80
    END;

    v_actions := v_actions || jsonb_build_object(
      'action_type', 'release_payment',
      'confidence', v_action_confidence,
      'impact_value', v_action.overdue_amount,
      'risk_reduction', CASE WHEN v_action.priority = 'critical' THEN 'critical' ELSE 'high' END,
      'priority_val', CASE WHEN v_action.priority = 'critical' THEN 0 ELSE 1 END,
      'details', jsonb_build_object(
        'vendor_id', v_action.supplier_id,
        'overdue_amount', v_action.overdue_amount,
        'days_overdue', v_action.days_overdue,
        'reason', CASE
          WHEN v_action.priority = 'critical' THEN 'CRITICAL supplier — immediate payment required to prevent supply chain disruption'
          ELSE 'Overdue > 14 days — release to maintain vendor relationship and avoid penalties'
        END,
        'supplier_priority', v_action.priority
      )
    );
  END LOOP;

  -- SIMULATION: projected runway if all delay actions followed
  IF v_avg_daily_burn IS NOT NULL AND v_avg_daily_burn > 0 THEN
    v_projected_runway := (v_pending_payable - v_freed_by_actions) / v_avg_daily_burn;
  ELSE
    v_projected_runway := NULL;
  END IF;

  v_simulation := jsonb_build_object(
    'current_runway_days', v_runway_days,
    'projected_runway_days', v_projected_runway,
    'freed_by_actions', v_freed_by_actions,
    'actions_count', jsonb_array_length(v_actions)
  );

  -- Sort actions by priority
  SELECT COALESCE(jsonb_agg(elem ORDER BY (elem->>'priority_val')::int ASC), '[]'::jsonb)
  INTO v_actions
  FROM jsonb_array_elements(v_actions) elem;

  RETURN jsonb_build_object(
    'runway', v_runway,
    'priority_vendors', v_vendors,
    'alerts', v_alerts,
    'suggested_actions', v_actions,
    'simulation', v_simulation,
    'org_base_currency', v_org_base_currency
  );
END;
$$;

-- 5. Update get_cfo_financial_summary to use org base currency
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

  -- Burn rate from actual payments
  SELECT jsonb_build_object(
    'burn_30d', COALESCE(SUM(
      CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
           THEN (pal.new_data->>'amount')::numeric * pal.payment_exchange_rate
           ELSE (pal.new_data->>'amount')::numeric END
    ), 0),
    'burn_7d', COALESCE((
      SELECT SUM(
        CASE WHEN p2.payment_exchange_rate IS NOT NULL AND p2.payment_exchange_rate > 0
             THEN (p2.new_data->>'amount')::numeric * p2.payment_exchange_rate
             ELSE (p2.new_data->>'amount')::numeric END
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
