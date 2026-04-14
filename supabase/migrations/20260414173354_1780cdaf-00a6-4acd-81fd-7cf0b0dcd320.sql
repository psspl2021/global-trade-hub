
-- 1. Add idempotency_key and payment_exchange_rate columns
ALTER TABLE po_payment_audit_logs 
ADD COLUMN IF NOT EXISTS idempotency_key text,
ADD COLUMN IF NOT EXISTS payment_exchange_rate numeric;

-- Partial unique index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_idempotency_key
ON po_payment_audit_logs(idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- 2. Replace transition_po_payment with final hardened version
CREATE OR REPLACE FUNCTION public.transition_po_payment(
  p_po_id uuid,
  p_target_status text,
  p_user_id uuid,
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
  v_existing_key boolean;
BEGIN
  -- IDEMPOTENCY CHECK: If key already used, return existing result
  IF p_idempotency_key IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM po_payment_audit_logs WHERE idempotency_key = p_idempotency_key
    ) INTO v_existing_key;
    
    IF v_existing_key THEN
      RETURN jsonb_build_object(
        'po_id', p_po_id,
        'idempotent', true,
        'message', 'Payment transition already processed'
      );
    END IF;
  END IF;

  -- SESSION ENFORCEMENT
  PERFORM validate_active_session(p_user_id);

  -- Lock row
  SELECT payment_workflow_status, po_value, currency, po_status
  INTO v_current_status, v_po_value, v_po_currency, v_po_status
  FROM purchase_orders
  WHERE id = p_po_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PO not found';
  END IF;

  -- APPROVAL-TO-PAYMENT LOCK
  IF p_target_status IN ('approved_for_payment', 'payment_initiated', 'payment_confirmed') THEN
    SELECT MAX(acted_at) INTO v_approved_at
    FROM po_approval_logs
    WHERE po_id = p_po_id AND action = 'approved';

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

  -- CUMULATIVE FRAUD CHECK
  IF p_amount IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM po_payment_audit_logs
    WHERE po_id = p_po_id
      AND to_status = 'payment_confirmed'
      AND amount IS NOT NULL;

    IF (v_total_paid + p_amount) > v_po_value THEN
      RAISE EXCEPTION 'Cumulative payments (% + %) exceed PO value (%)', v_total_paid, p_amount, v_po_value;
    END IF;
  END IF;

  -- Currency match
  IF p_currency IS NOT NULL AND p_currency != v_po_currency THEN
    RAISE EXCEPTION 'Payment currency (%) does not match PO currency (%)', p_currency, v_po_currency;
  END IF;

  -- Update PO
  UPDATE purchase_orders
  SET payment_workflow_status = p_target_status,
      updated_at = now()
  WHERE id = p_po_id;

  -- Audit log with idempotency + FX
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

-- 3. Auto-refresh cfo_cashflow_summary every 15 minutes
SELECT cron.schedule(
  'refresh-cfo-cashflow-summary',
  '*/15 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY cfo_cashflow_summary$$
);
