
-- ============================================================
-- 1. FIX COLUMN MISMATCH: performed_by → transitioned_by
-- ============================================================
ALTER TABLE public.po_payment_audit_logs 
  RENAME COLUMN performed_by TO transitioned_by;

-- ============================================================
-- 2. COMPLIANCE ENFORCEMENT TRIGGER ON purchase_orders
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_global_supplier_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_region_type text;
  v_compliance_ok boolean;
BEGIN
  -- Only enforce on global POs with a supplier
  IF NEW.supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if this is a global context (from buyer company or contract)
  SELECT bc.region_type INTO v_region_type
  FROM buyer_company_members bcm
  JOIN buyer_companies bc ON bc.id = bcm.company_id
  WHERE bcm.user_id = NEW.created_by
  LIMIT 1;

  IF v_region_type IS DISTINCT FROM 'global' THEN
    RETURN NEW;
  END IF;

  -- Check supplier compliance
  SELECT EXISTS (
    SELECT 1 FROM supplier_compliance sc
    WHERE sc.supplier_id = NEW.supplier_id
      AND sc.compliance_status = 'approved'
      AND sc.blacklist_screened = true
      AND sc.trade_restriction_check = true
      AND (sc.compliance_expires_at IS NULL OR sc.compliance_expires_at > now())
  ) INTO v_compliance_ok;

  IF NOT v_compliance_ok THEN
    RAISE EXCEPTION 'Global PO blocked: Supplier has not passed compliance screening (blacklist + trade restriction checks required)';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_global_compliance
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_global_supplier_compliance();

-- ============================================================
-- 3. CRON MONITORING TABLE
-- ============================================================
CREATE TABLE public.cron_job_monitor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL DEFAULT 'started',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  rows_affected integer DEFAULT 0,
  metadata jsonb
);

ALTER TABLE public.cron_job_monitor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cron logs"
  ON public.cron_job_monitor FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND business_type = 'admin'
    )
  );

CREATE INDEX idx_cron_monitor_job ON public.cron_job_monitor(job_name, started_at DESC);

-- ============================================================
-- 4. CFO FINANCIAL SUMMARY RPC (replaces client-side aggregation)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_cfo_financial_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_payables jsonb;
  v_burn jsonb;
  v_vendor_exposure jsonb;
  v_aging jsonb;
  v_overdue jsonb;
BEGIN
  -- Total payables (normalized to base currency)
  SELECT jsonb_build_object(
    'total_payable_base', COALESCE(SUM(po_value_base_currency) FILTER (
      WHERE payment_workflow_status IN ('pending','approved_for_payment','payment_initiated')
    ), 0),
    'total_paid_base', COALESCE(SUM(po_value_base_currency) FILTER (
      WHERE payment_workflow_status = 'payment_confirmed'
    ), 0),
    'outstanding_count', COUNT(*) FILTER (
      WHERE payment_workflow_status IN ('pending','approved_for_payment','payment_initiated')
    ),
    'by_currency', (
      SELECT jsonb_agg(jsonb_build_object(
        'currency', sub.currency,
        'payable', sub.payable,
        'paid', sub.paid
      ))
      FROM (
        SELECT currency,
          COALESCE(SUM(po_value) FILTER (WHERE payment_workflow_status IN ('pending','approved_for_payment','payment_initiated')), 0) AS payable,
          COALESCE(SUM(po_value) FILTER (WHERE payment_workflow_status = 'payment_confirmed'), 0) AS paid
        FROM purchase_orders WHERE po_status != 'cancelled'
        GROUP BY currency
      ) sub
    )
  ) INTO v_payables
  FROM purchase_orders
  WHERE po_status != 'cancelled';

  -- Burn rate (base currency, using po_value_base_currency)
  SELECT jsonb_build_object(
    'burn_7d', COALESCE(SUM(po_value_base_currency) FILTER (
      WHERE payment_workflow_status = 'payment_confirmed' AND updated_at >= now() - interval '7 days'
    ), 0),
    'burn_30d', COALESCE(SUM(po_value_base_currency) FILTER (
      WHERE payment_workflow_status = 'payment_confirmed' AND updated_at >= now() - interval '30 days'
    ), 0),
    'burn_90d', COALESCE(SUM(po_value_base_currency) FILTER (
      WHERE payment_workflow_status = 'payment_confirmed' AND updated_at >= now() - interval '90 days'
    ), 0)
  ) INTO v_burn
  FROM purchase_orders
  WHERE po_status != 'cancelled';

  -- Top 5 vendor exposure (by base currency value)
  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb) INTO v_vendor_exposure
  FROM (
    SELECT jsonb_build_object(
      'contract_id', po.contract_id,
      'total_exposure_base', SUM(po.po_value_base_currency),
      'po_count', COUNT(*),
      'currencies', array_agg(DISTINCT po.currency)
    ) AS row_data
    FROM purchase_orders po
    WHERE po.po_status != 'cancelled'
      AND po.payment_workflow_status IN ('pending','approved_for_payment','payment_initiated')
    GROUP BY po.contract_id
    ORDER BY SUM(po.po_value_base_currency) DESC
    LIMIT 5
  ) sub;

  -- Aging analysis
  SELECT jsonb_build_object(
    'due_7d_base', COALESCE(SUM(po_value_base_currency) FILTER (
      WHERE delivery_due_date BETWEEN now() AND now() + interval '7 days'
        AND payment_workflow_status IN ('pending','approved_for_payment','payment_initiated')
    ), 0),
    'due_30d_base', COALESCE(SUM(po_value_base_currency) FILTER (
      WHERE delivery_due_date BETWEEN now() AND now() + interval '30 days'
        AND payment_workflow_status IN ('pending','approved_for_payment','payment_initiated')
    ), 0),
    'overdue_base', COALESCE(SUM(po_value_base_currency) FILTER (
      WHERE delivery_due_date < now()
        AND po_status NOT IN ('delivered','closed','cancelled')
    ), 0),
    'overdue_count', COUNT(*) FILTER (
      WHERE delivery_due_date < now()
        AND po_status NOT IN ('delivered','closed','cancelled')
    )
  ) INTO v_aging
  FROM purchase_orders
  WHERE po_status != 'cancelled';

  v_result := jsonb_build_object(
    'payables', v_payables,
    'burn_rate', v_burn,
    'vendor_exposure', v_vendor_exposure,
    'aging', v_aging,
    'generated_at', now()
  );

  RETURN v_result;
END;
$$;

-- ============================================================
-- 5. UPDATE the old RPC to use correct column name
--    (Drop old version, recreate with transitioned_by)
-- ============================================================
CREATE OR REPLACE FUNCTION public.transition_po_payment(
  p_po_id uuid,
  p_user_id uuid,
  p_target_status text,
  p_payment_reference text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_currency text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_exchange_rate numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
  v_po_value numeric;
  v_po_currency text;
  v_has_permission boolean;
  v_result jsonb;
  v_approved_at timestamptz;
  v_po_status text;
  v_total_paid numeric;
BEGIN
  -- IDEMPOTENCY CHECK
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM po_payment_audit_logs WHERE idempotency_key = p_idempotency_key) THEN
      RETURN jsonb_build_object('po_id', p_po_id, 'idempotent', true, 'message', 'Already processed');
    END IF;
  END IF;

  -- SESSION ENFORCEMENT
  PERFORM validate_active_session(p_user_id);

  -- Lock row
  SELECT payment_workflow_status, po_value, currency, po_status
  INTO v_current_status, v_po_value, v_po_currency, v_po_status
  FROM purchase_orders WHERE id = p_po_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'PO not found'; END IF;

  -- APPROVAL-TO-PAYMENT LOCK
  IF p_target_status IN ('approved_for_payment','payment_initiated','payment_confirmed') THEN
    SELECT MAX(acted_at) INTO v_approved_at
    FROM po_approval_logs WHERE po_id = p_po_id AND action = 'approved';

    IF v_approved_at IS NULL THEN
      RAISE EXCEPTION 'PO must be approved before payment can proceed';
    END IF;

    IF EXISTS (
      SELECT 1 FROM po_approval_logs
      WHERE po_id = p_po_id AND action = 'rejected' AND acted_at > v_approved_at
    ) THEN
      RAISE EXCEPTION 'PO was rejected after approval — payment blocked';
    END IF;
  END IF;

  -- ROLE ENFORCEMENT
  IF p_target_status IN ('approved_for_payment','payment_initiated','payment_confirmed') THEN
    SELECT EXISTS (
      SELECT 1 FROM buyer_company_members
      WHERE user_id = p_user_id AND role IN ('cfo','finance_manager','buyer_admin') AND is_active = true
    ) INTO v_has_permission;

    IF NOT v_has_permission THEN
      RAISE EXCEPTION 'Only CFO or Finance roles can perform this payment transition';
    END IF;
  END IF;

  -- Validate state transition
  IF NOT (
    (v_current_status = 'pending' AND p_target_status = 'approved_for_payment') OR
    (v_current_status = 'approved_for_payment' AND p_target_status = 'payment_initiated') OR
    (v_current_status = 'payment_initiated' AND p_target_status IN ('payment_confirmed','payment_failed')) OR
    (v_current_status = 'payment_failed' AND p_target_status = 'payment_initiated')
  ) THEN
    RAISE EXCEPTION 'Invalid transition: % → %', v_current_status, p_target_status;
  END IF;

  -- CUMULATIVE FRAUD CHECK
  IF p_amount IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM po_payment_audit_logs
    WHERE po_id = p_po_id AND to_status = 'payment_confirmed' AND amount IS NOT NULL;

    IF (v_total_paid + p_amount) > v_po_value THEN
      RAISE EXCEPTION 'Cumulative payments (% + %) exceed PO value (%)', v_total_paid, p_amount, v_po_value;
    END IF;
  END IF;

  -- Currency match
  IF p_currency IS NOT NULL AND p_currency != v_po_currency THEN
    RAISE EXCEPTION 'Payment currency (%) does not match PO currency (%)', p_currency, v_po_currency;
  END IF;

  -- Update PO
  UPDATE purchase_orders SET payment_workflow_status = p_target_status, updated_at = now() WHERE id = p_po_id;

  -- Audit log (using transitioned_by — matches renamed column)
  INSERT INTO po_payment_audit_logs (
    po_id, from_status, to_status, transitioned_by,
    payment_reference, payment_method, amount, currency, notes,
    idempotency_key, payment_exchange_rate
  ) VALUES (
    p_po_id, v_current_status, p_target_status, p_user_id,
    p_payment_reference, p_payment_method, p_amount, p_currency, p_notes,
    p_idempotency_key, p_exchange_rate
  );

  v_result := jsonb_build_object(
    'po_id', p_po_id,
    'from_status', v_current_status,
    'to_status', p_target_status,
    'cumulative_paid', COALESCE(v_total_paid, 0) + COALESCE(p_amount, 0),
    'idempotent', false
  );

  RETURN v_result;
END;
$$;
