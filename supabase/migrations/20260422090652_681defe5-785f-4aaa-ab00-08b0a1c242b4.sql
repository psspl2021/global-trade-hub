-- Replace overly strict RBAC in proceed_po_step.
-- Original behaviour: 'sent', 'payment_done', 'closed' all required can_approve_po.
-- Sending a draft PO to a supplier is a dispatch action, not an approval action.
-- New behaviour:
--   * 'sent' is allowed for the PO creator, the assigned purchaser, anyone listed in
--     purchase_order_purchasers for the PO, or any user with can_approve_po.
--   * 'payment_done' and 'closed' continue to require can_approve_po.

CREATE OR REPLACE FUNCTION public.proceed_po_step(
  p_po_id uuid,
  p_new_status text,
  p_updated_by uuid,
  p_idempotency_key text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_po RECORD;
  v_confirmed BOOLEAN;
  v_dup BOOLEAN;
  v_valid_transition BOOLEAN;
  v_has_permission BOOLEAN;
  v_is_owner BOOLEAN;
BEGIN
  -- Idempotency: reject duplicate keys
  IF p_idempotency_key IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.po_status_history
      WHERE idempotency_key = p_idempotency_key
    ) INTO v_dup;

    IF v_dup THEN
      RETURN jsonb_build_object('success', true, 'deduplicated', true);
    END IF;
  END IF;

  -- Lock the PO row to prevent concurrent updates
  SELECT po_source, external_po_number, status, created_by, purchaser_id
  INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'PO not found');
  END IF;

  -- STATE MACHINE: Validate transition against allowed transitions table
  SELECT EXISTS (
    SELECT 1 FROM public.po_status_transitions
    WHERE from_status = v_po.status::TEXT
    AND to_status = p_new_status
  ) INTO v_valid_transition;

  IF NOT v_valid_transition THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', format('Invalid transition: %s → %s', v_po.status, p_new_status)
    );
  END IF;

  -- RBAC
  IF p_new_status = 'sent' THEN
    -- Dispatch action: allow PO creator, assigned purchaser, listed purchasers,
    -- or anyone with the approver permission.
    v_is_owner := (
      v_po.created_by = p_updated_by
      OR v_po.purchaser_id = p_updated_by
      OR EXISTS (
        SELECT 1 FROM public.purchase_order_purchasers
        WHERE po_id = p_po_id AND user_id = p_updated_by
      )
    );

    IF NOT v_is_owner THEN
      SELECT public.check_permission(p_updated_by, 'can_approve_po') INTO v_has_permission;
      IF NOT COALESCE(v_has_permission, false) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Insufficient permissions for this action');
      END IF;
    END IF;

  ELSIF p_new_status IN ('payment_done', 'closed') THEN
    SELECT public.check_permission(p_updated_by, 'can_approve_po') INTO v_has_permission;
    IF NOT COALESCE(v_has_permission, false) THEN
      RETURN jsonb_build_object('success', false, 'reason', 'Insufficient permissions for this action');
    END IF;
  END IF;

  -- Race-safe: re-check supplier confirmation for external POs
  IF v_po.po_source = 'external' THEN
    IF v_po.external_po_number IS NULL OR v_po.external_po_number = '' THEN
      RETURN jsonb_build_object('success', false, 'reason', 'External PO number missing');
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.supplier_po_acknowledgements
      WHERE po_id = p_po_id
      AND confirmed_po_number = v_po.external_po_number
    ) INTO v_confirmed;

    IF NOT v_confirmed THEN
      RETURN jsonb_build_object('success', false, 'reason', 'Supplier has not confirmed this PO number');
    END IF;
  END IF;

  -- Atomically update status
  UPDATE public.purchase_orders
  SET status = p_new_status::public.document_status, updated_at = now()
  WHERE id = p_po_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;