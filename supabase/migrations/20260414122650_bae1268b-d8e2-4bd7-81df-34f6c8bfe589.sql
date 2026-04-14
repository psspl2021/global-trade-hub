
-- STEP 3: FX source + timestamp on purchase_orders
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS fx_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS fx_timestamp timestamptz DEFAULT now();

-- STEP 1: Reusable compliance gate function
CREATE OR REPLACE FUNCTION public.enforce_supplier_compliance(
  p_supplier_id uuid,
  p_region_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_compliant boolean;
BEGIN
  IF p_region_type != 'global' THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM supplier_compliance
    WHERE supplier_id = p_supplier_id
      AND is_active = true
      AND blacklist_status = false
      AND risk_level != 'critical'
      AND (compliance_expiry IS NULL OR compliance_expiry > now())
  ) INTO v_compliant;

  IF NOT v_compliant THEN
    RAISE EXCEPTION 'Supplier does not meet global trade compliance requirements. PO creation blocked.';
  END IF;
END;
$$;

-- STEP 4: Fraud constraints on payment audit logs
ALTER TABLE public.po_payment_audit_logs
  ADD CONSTRAINT uq_payment_reference
    UNIQUE (payment_reference)
    ;

-- Drop and recreate transition_po_payment with role enforcement + fraud checks (STEP 2 + 4)
CREATE OR REPLACE FUNCTION public.transition_po_payment(
  p_po_id uuid,
  p_target_status text,
  p_user_id uuid,
  p_payment_reference text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_currency text DEFAULT NULL,
  p_notes text DEFAULT NULL
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
BEGIN
  -- Lock row
  SELECT payment_workflow_status, po_value, currency
  INTO v_current_status, v_po_value, v_po_currency
  FROM purchase_orders
  WHERE id = p_po_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PO not found';
  END IF;

  -- STEP 2: Role enforcement for financial transitions
  IF p_target_status IN ('approved_for_payment', 'payment_initiated', 'payment_confirmed') THEN
    SELECT EXISTS (
      SELECT 1 FROM buyer_company_members
      WHERE user_id = p_user_id
        AND role IN ('cfo', 'finance_manager', 'buyer_admin')
        AND is_active = true
    ) INTO v_has_permission;

    IF NOT v_has_permission THEN
      RAISE EXCEPTION 'Only CFO or Finance roles can perform this payment transition';
    END IF;
  END IF;

  -- Validate state transition
  IF NOT (
    (v_current_status = 'pending' AND p_target_status = 'approved_for_payment') OR
    (v_current_status = 'approved_for_payment' AND p_target_status = 'payment_initiated') OR
    (v_current_status = 'payment_initiated' AND p_target_status IN ('payment_confirmed', 'payment_failed')) OR
    (v_current_status = 'payment_failed' AND p_target_status = 'payment_initiated')
  ) THEN
    RAISE EXCEPTION 'Invalid transition: % → %', v_current_status, p_target_status;
  END IF;

  -- STEP 4: Fraud checks
  IF p_amount IS NOT NULL AND p_amount > v_po_value THEN
    RAISE EXCEPTION 'Payment amount (%) exceeds PO value (%)', p_amount, v_po_value;
  END IF;

  IF p_currency IS NOT NULL AND p_currency != v_po_currency THEN
    RAISE EXCEPTION 'Payment currency (%) does not match PO currency (%)', p_currency, v_po_currency;
  END IF;

  -- Update PO
  UPDATE purchase_orders
  SET payment_workflow_status = p_target_status,
      updated_at = now()
  WHERE id = p_po_id;

  -- Audit log
  INSERT INTO po_payment_audit_logs (
    po_id, from_status, to_status, transitioned_by,
    payment_reference, payment_method, amount, currency, notes
  ) VALUES (
    p_po_id, v_current_status, p_target_status, p_user_id,
    p_payment_reference, p_payment_method, p_amount, p_currency, p_notes
  );

  v_result := jsonb_build_object(
    'po_id', p_po_id,
    'from_status', v_current_status,
    'to_status', p_target_status
  );

  RETURN v_result;
END;
$$;

-- STEP 5: CFO Cashflow Intelligence View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cfo_cashflow_summary AS
SELECT
  po.currency,
  COUNT(*) FILTER (WHERE po.payment_workflow_status IN ('pending', 'approved_for_payment', 'payment_initiated')) AS outstanding_pos,
  COALESCE(SUM(po.po_value) FILTER (WHERE po.payment_workflow_status IN ('pending', 'approved_for_payment', 'payment_initiated')), 0) AS total_payable,
  COALESCE(SUM(po.po_value_base_currency) FILTER (WHERE po.payment_workflow_status IN ('pending', 'approved_for_payment', 'payment_initiated')), 0) AS total_payable_base,
  COALESCE(SUM(po.po_value) FILTER (WHERE po.payment_workflow_status = 'payment_confirmed'), 0) AS total_paid,
  COALESCE(SUM(po.po_value_base_currency) FILTER (WHERE po.payment_workflow_status = 'payment_confirmed'), 0) AS total_paid_base,
  COUNT(*) FILTER (WHERE po.payment_workflow_status = 'payment_failed') AS failed_payments,
  COUNT(*) FILTER (WHERE po.delivery_due_date < now() AND po.po_status NOT IN ('delivered', 'closed', 'cancelled')) AS overdue_deliveries,
  COALESCE(SUM(po.po_value) FILTER (WHERE po.delivery_due_date < now() AND po.po_status NOT IN ('delivered', 'closed', 'cancelled')), 0) AS overdue_value,
  COUNT(DISTINCT po.contract_id) FILTER (WHERE po.payment_workflow_status IN ('pending', 'approved_for_payment', 'payment_initiated')) AS active_vendor_exposure_count,
  -- 30-day burn rate (base currency)
  COALESCE(SUM(po.po_value_base_currency) FILTER (
    WHERE po.payment_workflow_status = 'payment_confirmed'
      AND po.updated_at >= now() - interval '30 days'
  ), 0) AS burn_rate_30d_base
FROM purchase_orders po
WHERE po.po_status NOT IN ('cancelled')
GROUP BY po.currency;

-- Index for faster refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_cfo_cashflow_currency ON public.cfo_cashflow_summary (currency);

-- Function to refresh the view
CREATE OR REPLACE FUNCTION public.refresh_cfo_cashflow()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cfo_cashflow_summary;
END;
$$;
