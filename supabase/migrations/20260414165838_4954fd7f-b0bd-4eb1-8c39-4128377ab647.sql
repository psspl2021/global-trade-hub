
-- 1. Fix payment_reference: drop constraint first, then recreate as partial index
ALTER TABLE po_payment_audit_logs DROP CONSTRAINT IF EXISTS uq_payment_reference;
CREATE UNIQUE INDEX uq_payment_reference 
ON po_payment_audit_logs(payment_reference) 
WHERE payment_reference IS NOT NULL;

-- 2. Replace transition_po_payment with hardened version
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
  v_approved_at timestamptz;
  v_po_status text;
  v_total_paid numeric;
BEGIN
  -- SESSION ENFORCEMENT: Block expired/invalid sessions
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

  -- APPROVAL-TO-PAYMENT LOCK: Payment can only proceed if PO has been approved
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

  -- ROLE ENFORCEMENT for financial transitions
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

  -- PARTIAL PAYMENT SUPPORT: Cumulative fraud check
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

  -- Currency match check
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
    'to_status', p_target_status,
    'cumulative_paid', COALESCE(v_total_paid, 0) + COALESCE(p_amount, 0)
  );

  RETURN v_result;
END;
$$;
