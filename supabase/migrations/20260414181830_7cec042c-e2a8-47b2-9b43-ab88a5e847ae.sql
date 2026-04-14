
-- =============================================================
-- FIX 1: Idempotency Race Condition — unique partial index
-- =============================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_po_payment_idempotency_key
  ON po_payment_audit_logs(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- =============================================================
-- FIX 2 + FIX 3: Org-scoped CFO RPC with correct burn rate
-- Replace get_cfo_financial_summary to be org-scoped and use
-- payment confirmation timestamps for burn rate
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_cfo_financial_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_result jsonb;
BEGIN
  -- Resolve caller's company
  SELECT company_id INTO v_company_id
  FROM buyer_company_members
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('error', 'no_company');
  END IF;

  SELECT jsonb_build_object(
    'payables', (
      SELECT jsonb_build_object(
        'total_payable_base', COALESCE(SUM(CASE WHEN po.payment_workflow_status NOT IN ('payment_confirmed') THEN po.po_value_base_currency ELSE 0 END), 0),
        'total_paid_base', COALESCE(SUM(CASE WHEN po.payment_workflow_status = 'payment_confirmed' THEN po.po_value_base_currency ELSE 0 END), 0),
        'by_currency', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'currency', sub.currency,
            'payable', sub.payable,
            'paid', sub.paid
          ))
          FROM (
            SELECT
              po2.currency,
              SUM(CASE WHEN po2.payment_workflow_status NOT IN ('payment_confirmed') THEN po2.po_value ELSE 0 END) AS payable,
              SUM(CASE WHEN po2.payment_workflow_status = 'payment_confirmed' THEN po2.po_value ELSE 0 END) AS paid
            FROM purchase_orders po2
            WHERE po2.buyer_company_id = v_company_id
              AND po2.status NOT IN ('cancelled')
            GROUP BY po2.currency
          ) sub
        ), '[]'::jsonb)
      )
      FROM purchase_orders po
      WHERE po.buyer_company_id = v_company_id
        AND po.status NOT IN ('cancelled')
    ),
    'aging', (
      SELECT jsonb_build_object(
        'overdue_base', COALESCE(SUM(CASE WHEN po.expected_delivery_date < now() AND po.payment_workflow_status NOT IN ('payment_confirmed') THEN po.po_value_base_currency ELSE 0 END), 0),
        'due_7d_base', COALESCE(SUM(CASE WHEN po.expected_delivery_date BETWEEN now() AND now() + interval '7 days' AND po.payment_workflow_status NOT IN ('payment_confirmed') THEN po.po_value_base_currency ELSE 0 END), 0),
        'due_30d_base', COALESCE(SUM(CASE WHEN po.expected_delivery_date BETWEEN now() AND now() + interval '30 days' AND po.payment_workflow_status NOT IN ('payment_confirmed') THEN po.po_value_base_currency ELSE 0 END), 0)
      )
      FROM purchase_orders po
      WHERE po.buyer_company_id = v_company_id
        AND po.status NOT IN ('cancelled')
    ),
    'burn_rate', (
      -- FIX 3: Use actual payment confirmation timestamps, not updated_at
      SELECT jsonb_build_object(
        'burn_7d', COALESCE(SUM(CASE WHEN pal.created_at >= now() - interval '7 days' THEN po.po_value_base_currency ELSE 0 END), 0),
        'burn_30d', COALESCE(SUM(CASE WHEN pal.created_at >= now() - interval '30 days' THEN po.po_value_base_currency ELSE 0 END), 0)
      )
      FROM po_payment_audit_logs pal
      JOIN purchase_orders po ON po.id = pal.po_id
      WHERE po.buyer_company_id = v_company_id
        AND pal.to_status = 'payment_confirmed'
    ),
    'vendor_exposure', (
      SELECT COALESCE(jsonb_agg(ve ORDER BY ve.total_exposure_base DESC), '[]'::jsonb)
      FROM (
        SELECT
          po.supplier_id AS contract_id,
          SUM(po.po_value_base_currency) AS total_exposure_base,
          COUNT(*) AS po_count,
          array_agg(DISTINCT po.currency) AS currencies
        FROM purchase_orders po
        WHERE po.buyer_company_id = v_company_id
          AND po.status NOT IN ('cancelled')
          AND po.payment_workflow_status NOT IN ('payment_confirmed')
        GROUP BY po.supplier_id
        ORDER BY SUM(po.po_value_base_currency) DESC
        LIMIT 5
      ) ve
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =============================================================
-- FIX 4: Wire cron monitoring for CFO refresh
-- Replace the CFO materialized view refresh to log into cron_job_monitor
-- =============================================================
CREATE OR REPLACE FUNCTION public.refresh_cfo_with_monitoring()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monitor_id uuid;
BEGIN
  INSERT INTO cron_job_monitor (job_name, status, started_at)
  VALUES ('refresh_cfo_cashflow_summary', 'running', now())
  RETURNING id INTO v_monitor_id;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY cfo_cashflow_summary;

    UPDATE cron_job_monitor
    SET status = 'completed', completed_at = now()
    WHERE id = v_monitor_id;
  EXCEPTION WHEN OTHERS THEN
    UPDATE cron_job_monitor
    SET status = 'failed', error_message = SQLERRM, completed_at = now()
    WHERE id = v_monitor_id;
  END;
END;
$$;

-- =============================================================
-- NEW: CFO Decision Engine RPC
-- Returns runway, prioritized payments, alerts, suggested actions
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_cfo_decision_intelligence()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_daily_burn numeric;
  v_pending_payable numeric;
  v_runway_days numeric;
  v_burn_7d numeric;
  v_burn_30d numeric;
  v_avg_daily_burn numeric;
  v_due_7d numeric;
  v_result jsonb;
BEGIN
  SELECT company_id INTO v_company_id
  FROM buyer_company_members
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('error', 'no_company');
  END IF;

  -- Calculate burn rate from actual confirmed payments
  SELECT
    COALESCE(SUM(CASE WHEN pal.created_at >= now() - interval '7 days' THEN po.po_value_base_currency ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pal.created_at >= now() - interval '30 days' THEN po.po_value_base_currency ELSE 0 END), 0)
  INTO v_burn_7d, v_burn_30d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE po.buyer_company_id = v_company_id
    AND pal.to_status = 'payment_confirmed';

  v_avg_daily_burn := GREATEST(v_burn_30d / 30.0, 1);

  -- Pending payables
  SELECT COALESCE(SUM(po_value_base_currency), 0)
  INTO v_pending_payable
  FROM purchase_orders
  WHERE buyer_company_id = v_company_id
    AND status NOT IN ('cancelled')
    AND payment_workflow_status NOT IN ('payment_confirmed');

  -- Due in 7 days
  SELECT COALESCE(SUM(po_value_base_currency), 0)
  INTO v_due_7d
  FROM purchase_orders
  WHERE buyer_company_id = v_company_id
    AND status NOT IN ('cancelled')
    AND payment_workflow_status NOT IN ('payment_confirmed')
    AND expected_delivery_date BETWEEN now() AND now() + interval '7 days';

  v_runway_days := CASE WHEN v_avg_daily_burn > 0 THEN v_pending_payable / v_avg_daily_burn ELSE 9999 END;

  SELECT jsonb_build_object(
    -- 1. Cash Risk Projection
    'runway', jsonb_build_object(
      'daily_burn', round(v_avg_daily_burn, 2),
      'pending_payable', round(v_pending_payable, 2),
      'runway_days', round(v_runway_days, 1),
      'burn_7d', round(v_burn_7d, 2),
      'burn_30d', round(v_burn_30d, 2),
      'burn_ratio_7d_vs_avg', CASE WHEN v_avg_daily_burn > 0 THEN round((v_burn_7d / 7.0) / v_avg_daily_burn, 2) ELSE 0 END
    ),

    -- 2. Payment Prioritization (top 10 vendors by risk)
    'priority_vendors', (
      SELECT COALESCE(jsonb_agg(pv ORDER BY pv.risk_score DESC), '[]'::jsonb)
      FROM (
        SELECT
          po.supplier_id,
          COUNT(*) AS po_count,
          SUM(po.po_value_base_currency) AS total_exposure,
          SUM(CASE WHEN po.expected_delivery_date < now() THEN po.po_value_base_currency ELSE 0 END) AS overdue_amount,
          MAX(CASE WHEN po.expected_delivery_date < now() THEN EXTRACT(DAY FROM now() - po.expected_delivery_date) ELSE 0 END) AS max_days_overdue,
          -- Risk score: weighted combo of overdue amount + dependency (po count)
          (SUM(CASE WHEN po.expected_delivery_date < now() THEN po.po_value_base_currency ELSE 0 END) * 0.6
           + SUM(po.po_value_base_currency) * 0.3
           + COUNT(*) * 10000 * 0.1) AS risk_score
        FROM purchase_orders po
        WHERE po.buyer_company_id = v_company_id
          AND po.status NOT IN ('cancelled')
          AND po.payment_workflow_status NOT IN ('payment_confirmed')
        GROUP BY po.supplier_id
        ORDER BY risk_score DESC
        LIMIT 10
      ) pv
    ),

    -- 3. Smart Alerts
    'alerts', (
      SELECT COALESCE(jsonb_agg(a), '[]'::jsonb)
      FROM (
        -- Alert: 7-day payable exceeds average burn by 2x+
        SELECT 'high_outflow_week' AS alert_type,
               'critical' AS severity,
               jsonb_build_object(
                 'due_7d', round(v_due_7d, 2),
                 'avg_weekly_burn', round(v_avg_daily_burn * 7, 2),
                 'multiplier', CASE WHEN v_avg_daily_burn * 7 > 0 THEN round(v_due_7d / (v_avg_daily_burn * 7), 1) ELSE 0 END
               ) AS details
        WHERE v_due_7d > v_avg_daily_burn * 7 * 2

        UNION ALL

        -- Alert: Runway below 30 days
        SELECT 'low_runway' AS alert_type,
               CASE WHEN v_runway_days < 14 THEN 'critical' ELSE 'warning' END AS severity,
               jsonb_build_object('runway_days', round(v_runway_days, 1)) AS details
        WHERE v_runway_days < 30

        UNION ALL

        -- Alert: Vendor concentration > 40%
        SELECT 'vendor_concentration' AS alert_type,
               'warning' AS severity,
               jsonb_build_object(
                 'vendor_id', vc.supplier_id,
                 'pct', round(vc.pct, 1)
               ) AS details
        FROM (
          SELECT supplier_id,
                 SUM(po_value_base_currency) / NULLIF(v_pending_payable, 0) * 100 AS pct
          FROM purchase_orders
          WHERE buyer_company_id = v_company_id
            AND status NOT IN ('cancelled')
            AND payment_workflow_status NOT IN ('payment_confirmed')
          GROUP BY supplier_id
          HAVING SUM(po_value_base_currency) / NULLIF(v_pending_payable, 0) * 100 > 40
          LIMIT 3
        ) vc
      ) a
    ),

    -- 4. Suggested Actions
    'suggested_actions', (
      SELECT COALESCE(jsonb_agg(sa), '[]'::jsonb)
      FROM (
        -- Action: Delay non-critical vendors to free cash
        SELECT 'delay_payment' AS action_type,
               jsonb_build_object(
                 'vendor_id', d.supplier_id,
                 'amount', round(d.total_val, 2),
                 'suggested_delay_days', 5,
                 'reason', 'No overdue POs — safe to defer'
               ) AS details,
               d.total_val AS priority_val
        FROM (
          SELECT supplier_id, SUM(po_value_base_currency) AS total_val
          FROM purchase_orders
          WHERE buyer_company_id = v_company_id
            AND status NOT IN ('cancelled')
            AND payment_workflow_status NOT IN ('payment_confirmed')
            AND expected_delivery_date > now() + interval '7 days'
            AND supplier_id NOT IN (
              SELECT supplier_id FROM purchase_orders
              WHERE buyer_company_id = v_company_id
                AND expected_delivery_date < now()
                AND payment_workflow_status NOT IN ('payment_confirmed')
            )
          GROUP BY supplier_id
          ORDER BY SUM(po_value_base_currency) DESC
          LIMIT 3
        ) d

        UNION ALL

        -- Action: Release payment for overdue critical vendors
        SELECT 'release_payment' AS action_type,
               jsonb_build_object(
                 'vendor_id', r.supplier_id,
                 'overdue_amount', round(r.overdue_val, 2),
                 'days_overdue', r.max_overdue,
                 'reason', 'Overdue > 14 days — supply risk'
               ) AS details,
               r.overdue_val AS priority_val
        FROM (
          SELECT supplier_id,
                 SUM(po_value_base_currency) AS overdue_val,
                 MAX(EXTRACT(DAY FROM now() - expected_delivery_date)::int) AS max_overdue
          FROM purchase_orders
          WHERE buyer_company_id = v_company_id
            AND status NOT IN ('cancelled')
            AND payment_workflow_status NOT IN ('payment_confirmed')
            AND expected_delivery_date < now() - interval '14 days'
          GROUP BY supplier_id
          ORDER BY SUM(po_value_base_currency) DESC
          LIMIT 3
        ) r
      ) sa
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
