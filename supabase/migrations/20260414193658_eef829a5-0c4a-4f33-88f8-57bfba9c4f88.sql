
-- ❌ Fix #3: Add payment_due_date and payment_terms_override to purchase_orders
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS payment_due_date timestamptz,
  ADD COLUMN IF NOT EXISTS payment_terms_override_days int;

-- Backfill payment_due_date from expected_delivery_date where missing
UPDATE public.purchase_orders
SET payment_due_date = expected_delivery_date
WHERE payment_due_date IS NULL AND expected_delivery_date IS NOT NULL;

-- ❌ Fix #1, #2, #3, #6: Rebuild execute_cfo_action with FOR UPDATE, server-side idempotency, payment_due_date, and po_ids support
CREATE OR REPLACE FUNCTION public.execute_cfo_action(
  p_company_id uuid,
  p_action_type text,
  p_target_po_id uuid DEFAULT NULL,
  p_target_supplier_id text DEFAULT NULL,
  p_params jsonb DEFAULT '{}'::jsonb,
  p_confidence numeric DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_role text;
  v_action_id uuid;
  v_po_record record;
  v_result jsonb := '{}';
  v_deterministic_key text;
  v_po_ids uuid[];
  v_po_id uuid;
  v_updated_count int := 0;
BEGIN
  -- Session validation
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Session expired or not authenticated';
  END IF;

  -- Role check
  SELECT role INTO v_user_role
  FROM buyer_company_members
  WHERE user_id = v_user_id AND company_id = p_company_id AND is_active = true;

  IF v_user_role IS NULL OR v_user_role NOT IN ('cfo', 'finance_manager', 'buyer_admin') THEN
    RAISE EXCEPTION 'Only CFO or Finance roles can execute financial actions';
  END IF;

  -- ❌ Fix #2: Server-side deterministic idempotency key
  v_deterministic_key := COALESCE(
    p_idempotency_key,
    md5(p_company_id::text || '|' || p_action_type || '|' || COALESCE(p_target_po_id::text, '') || '|' || COALESCE(p_target_supplier_id, ''))
  );

  IF EXISTS (SELECT 1 FROM cfo_action_log WHERE idempotency_key = v_deterministic_key) THEN
    RETURN jsonb_build_object('status', 'duplicate', 'message', 'Action already executed');
  END IF;

  -- ❌ Fix #6: Resolve po_ids from params or single target
  IF p_params ? 'po_ids' THEN
    SELECT array_agg(val::uuid) INTO v_po_ids
    FROM jsonb_array_elements_text(p_params->'po_ids') val;
  ELSIF p_target_po_id IS NOT NULL THEN
    v_po_ids := ARRAY[p_target_po_id];
  ELSE
    -- Supplier-level: get all pending POs for this supplier in this company
    SELECT array_agg(id) INTO v_po_ids
    FROM purchase_orders
    WHERE buyer_company_id = p_company_id
      AND supplier_id = p_target_supplier_id
      AND payment_workflow_status NOT IN ('payment_confirmed', 'cancelled');

    IF v_po_ids IS NULL OR array_length(v_po_ids, 1) = 0 THEN
      RAISE EXCEPTION 'No actionable POs found for supplier %', p_target_supplier_id;
    END IF;
  END IF;

  -- Execute action based on type
  CASE p_action_type
    WHEN 'delay_payment' THEN
      -- ❌ Fix #1: FOR UPDATE lock + Fix #3: update payment_due_date, NOT delivery date
      FOREACH v_po_id IN ARRAY v_po_ids LOOP
        SELECT * INTO v_po_record
        FROM purchase_orders
        WHERE id = v_po_id AND buyer_company_id = p_company_id
        FOR UPDATE;

        IF v_po_record IS NULL THEN CONTINUE; END IF;
        IF v_po_record.payment_workflow_status IN ('payment_confirmed', 'cancelled') THEN CONTINUE; END IF;

        UPDATE purchase_orders
        SET payment_due_date = COALESCE(payment_due_date, expected_delivery_date, now())
              + ((COALESCE((p_params->>'delay_days')::int, 7)) || ' days')::interval,
            payment_terms_override_days = COALESCE(payment_terms_override_days, 0)
              + COALESCE((p_params->>'delay_days')::int, 7),
            updated_at = now()
        WHERE id = v_po_id;

        v_updated_count := v_updated_count + 1;
      END LOOP;

      v_result := jsonb_build_object(
        'status', 'success',
        'action', 'delay_payment',
        'delay_days', COALESCE((p_params->>'delay_days')::int, 7),
        'pos_updated', v_updated_count
      );

    WHEN 'release_payment' THEN
      -- ❌ Fix #1: FOR UPDATE lock per PO, validate status before transition
      FOREACH v_po_id IN ARRAY v_po_ids LOOP
        SELECT * INTO v_po_record
        FROM purchase_orders
        WHERE id = v_po_id AND buyer_company_id = p_company_id
        FOR UPDATE;

        IF v_po_record IS NULL THEN CONTINUE; END IF;
        IF v_po_record.payment_workflow_status != 'pending' THEN CONTINUE; END IF;

        UPDATE purchase_orders
        SET payment_workflow_status = 'approved_for_payment',
            approved_at = now(),
            approved_by = v_user_id::text,
            updated_at = now()
        WHERE id = v_po_id;

        v_updated_count := v_updated_count + 1;
      END LOOP;

      v_result := jsonb_build_object(
        'status', 'success',
        'action', 'release_payment',
        'new_status', 'approved_for_payment',
        'pos_updated', v_updated_count
      );

    WHEN 'split_payment' THEN
      v_result := jsonb_build_object(
        'status', 'success',
        'action', 'split_payment',
        'split_amount', (p_params->>'split_amount')::numeric,
        'pos_targeted', array_length(v_po_ids, 1)
      );

    ELSE
      RAISE EXCEPTION 'Unknown action type: %', p_action_type;
  END CASE;

  -- Log the action
  INSERT INTO cfo_action_log (
    company_id, action_type, target_po_id, target_supplier_id,
    executed_by, execution_params, outcome, outcome_details,
    confidence_at_execution, idempotency_key, completed_at
  ) VALUES (
    p_company_id, p_action_type, p_target_po_id, p_target_supplier_id,
    v_user_id,
    p_params || jsonb_build_object('po_ids', to_jsonb(v_po_ids)),
    'success', v_result,
    p_confidence, v_deterministic_key, now()
  )
  RETURNING id INTO v_action_id;

  v_result := v_result || jsonb_build_object('action_log_id', v_action_id);
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  INSERT INTO cfo_action_log (
    company_id, action_type, target_po_id, target_supplier_id,
    executed_by, execution_params, outcome, outcome_details,
    confidence_at_execution, idempotency_key, completed_at
  ) VALUES (
    p_company_id, p_action_type, p_target_po_id, p_target_supplier_id,
    v_user_id, p_params, 'failed', jsonb_build_object('error', SQLERRM),
    p_confidence, v_deterministic_key, now()
  );
  RAISE;
END;
$function$;

-- ❌ Fix #4, #5: Rebuild decision engine with supplier_priority_profiles JOIN + alert cooldowns + payment_due_date + po_ids in actions
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
  -- Resolve company
  SELECT company_id INTO v_company_id
  FROM buyer_company_members
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active company membership');
  END IF;

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

  -- ❌ Fix #4: Priority vendors with supplier_priority_profiles JOIN
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

  -- ❌ Fix #5: ALERTS with cooldown checks
  -- 1. High 7-day outflow
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

  -- 2. Low runway
  IF v_runway_days IS NOT NULL AND v_runway_days < 30 THEN
    SELECT check_alert_cooldown(
      v_company_id,
      'low_runway',
      'low_runway_' || v_company_id::text,
      interval '6 hours'
    ) INTO v_cooldown_check;

    IF (v_cooldown_check->>'should_alert')::boolean THEN
      v_alerts := v_alerts || jsonb_build_object(
        'alert_type', 'low_runway',
        'severity', CASE WHEN v_runway_days < 14 THEN 'critical' ELSE 'warning' END,
        'details', jsonb_build_object('runway_days', ROUND(v_runway_days))
      );
    END IF;
  END IF;

  -- 3. Vendor concentration
  SELECT po.supplier_id, SUM(po.po_value_base_currency) AS val
  INTO v_top_vendor
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
  GROUP BY po.supplier_id
  ORDER BY val DESC LIMIT 1;

  IF v_top_vendor IS NOT NULL AND v_pending_payable > 0 THEN
    v_conc_pct := ROUND((v_top_vendor.val / v_pending_payable * 100)::numeric, 0);
    IF v_conc_pct > 40 THEN
      SELECT check_alert_cooldown(
        v_company_id,
        'vendor_concentration',
        'vendor_conc_' || v_company_id::text || '_' || v_top_vendor.supplier_id,
        interval '12 hours'
      ) INTO v_cooldown_check;

      IF (v_cooldown_check->>'should_alert')::boolean THEN
        v_alerts := v_alerts || jsonb_build_object(
          'alert_type', 'vendor_concentration',
          'severity', CASE WHEN v_conc_pct > 60 THEN 'critical' ELSE 'warning' END,
          'details', jsonb_build_object('vendor_id', v_top_vendor.supplier_id, 'pct', v_conc_pct)
        );
      END IF;
    END IF;
  END IF;

  -- ❌ Fix #4 + #6: SUGGESTED ACTIONS with supplier_priority_profiles + po_ids for unambiguous targeting
  -- Delay: non-critical suppliers, not overdue, payment_due_date > 7 days away
  FOR v_action IN
    SELECT
      po.supplier_id,
      SUM(po.po_value_base_currency) AS amount,
      MIN(COALESCE(po.payment_due_date, po.expected_delivery_date)) AS next_due,
      COALESCE(spp.priority, 'standard') AS priority,
      array_agg(po.id) AS po_ids
    FROM purchase_orders po
    LEFT JOIN supplier_priority_profiles spp
      ON spp.supplier_id = po.supplier_id AND spp.company_id = v_company_id
    WHERE po.buyer_company_id = v_company_id
      AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
      AND COALESCE(po.payment_due_date, po.expected_delivery_date) > now() + interval '7 days'
      AND COALESCE(spp.priority, 'standard') != 'critical'
      AND NOT EXISTS (
        SELECT 1 FROM purchase_orders po2
        WHERE po2.supplier_id = po.supplier_id
          AND po2.buyer_company_id = v_company_id
          AND COALESCE(po2.payment_due_date, po2.expected_delivery_date) < now()
          AND po2.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
      )
    GROUP BY po.supplier_id, spp.priority
    HAVING SUM(po.po_value_base_currency) > 0
    ORDER BY SUM(po.po_value_base_currency) DESC
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
        'po_ids', to_jsonb(v_action.po_ids),
        'reason', CASE
          WHEN v_action.priority = 'low' THEN 'Low-priority supplier with no overdue POs — safe to defer'
          ELSE 'Standard supplier with payment due > 7 days away — deferral reduces short-term exposure'
        END,
        'supplier_priority', v_action.priority
      )
    );
  END LOOP;

  -- Release: critical or overdue > 14 days
  FOR v_action IN
    SELECT
      po.supplier_id,
      SUM(CASE WHEN COALESCE(po.payment_due_date, po.expected_delivery_date) < now() THEN po.po_value_base_currency ELSE 0 END) AS overdue_amount,
      MAX(EXTRACT(DAY FROM now() - COALESCE(po.payment_due_date, po.expected_delivery_date))::int)
        FILTER (WHERE COALESCE(po.payment_due_date, po.expected_delivery_date) < now()) AS days_overdue,
      COALESCE(spp.priority, 'standard') AS priority,
      array_agg(po.id) FILTER (WHERE COALESCE(po.payment_due_date, po.expected_delivery_date) < now()) AS po_ids
    FROM purchase_orders po
    LEFT JOIN supplier_priority_profiles spp
      ON spp.supplier_id = po.supplier_id AND spp.company_id = v_company_id
    WHERE po.buyer_company_id = v_company_id
      AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
      AND (
        COALESCE(spp.priority, 'standard') = 'critical'
        OR COALESCE(po.payment_due_date, po.expected_delivery_date) < now() - interval '14 days'
      )
    GROUP BY po.supplier_id, spp.priority
    HAVING SUM(CASE WHEN COALESCE(po.payment_due_date, po.expected_delivery_date) < now() THEN po.po_value_base_currency ELSE 0 END) > 0
    ORDER BY COALESCE(spp.priority, 'standard') = 'critical' DESC,
             SUM(CASE WHEN COALESCE(po.payment_due_date, po.expected_delivery_date) < now() THEN po.po_value_base_currency ELSE 0 END) DESC
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
        'po_ids', to_jsonb(v_action.po_ids),
        'reason', CASE
          WHEN v_action.priority = 'critical' THEN 'CRITICAL supplier — immediate payment required to prevent supply chain disruption'
          ELSE 'Overdue > 14 days — release to maintain vendor relationship and avoid penalties'
        END,
        'supplier_priority', v_action.priority
      )
    );
  END LOOP;

  -- SIMULATION
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
$function$;
