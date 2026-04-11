
-- Add execution enforcement columns
ALTER TABLE public.purchase_orders 
  ADD COLUMN IF NOT EXISTS transport_source text DEFAULT 'supplier',
  ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_delay_reason text,
  ADD COLUMN IF NOT EXISTS delivery_delay_notes text,
  ADD COLUMN IF NOT EXISTS expected_delivery_date date;

-- Update transition function to accept new params
CREATE OR REPLACE FUNCTION public.transition_po_status(
  p_po_id uuid,
  p_new_status text,
  p_user_id uuid,
  p_user_role text,
  p_notes text DEFAULT NULL,
  p_vehicle_number text DEFAULT NULL,
  p_transporter_name text DEFAULT NULL,
  p_driver_contact text DEFAULT NULL,
  p_transport_source text DEFAULT NULL,
  p_payment_mode text DEFAULT NULL,
  p_payment_proof_url text DEFAULT NULL,
  p_delivery_delay_reason text DEFAULT NULL,
  p_delivery_delay_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
  v_allowed_statuses text[];
  v_status_order text[] := ARRAY['draft','sent','accepted','in_transit','delivered','payment_done','closed'];
  v_current_idx int;
  v_target_idx int;
BEGIN
  SELECT status INTO v_current_status FROM purchase_orders WHERE id = p_po_id;
  
  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Purchase order not found');
  END IF;

  v_current_idx := array_position(v_status_order, v_current_status);
  v_target_idx := array_position(v_status_order, p_new_status);

  IF v_current_idx IS NULL OR v_target_idx IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status');
  END IF;

  IF v_target_idx != v_current_idx + 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot skip steps. Next allowed: ' || v_status_order[v_current_idx + 1]);
  END IF;

  -- Role checks
  IF p_new_status = 'sent' AND p_user_role NOT IN ('buyer','buyer_purchaser','buyer_cfo','buyer_ceo','buyer_manager','buyer_hr','purchaser','admin','ps_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only buyers can send POs');
  END IF;
  IF p_new_status = 'accepted' AND p_user_role NOT IN ('supplier','admin','ps_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only suppliers can accept POs');
  END IF;
  IF p_new_status IN ('in_transit','delivered') AND p_user_role NOT IN ('supplier','transporter','logistics_partner','admin','ps_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only suppliers/transporters can update delivery status');
  END IF;
  IF p_new_status IN ('payment_done','closed') AND p_user_role NOT IN ('buyer','buyer_purchaser','buyer_cfo','buyer_ceo','buyer_manager','buyer_hr','purchaser','admin','ps_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only buyers can confirm payment/close');
  END IF;

  -- Transport validation for in_transit
  IF p_new_status = 'in_transit' THEN
    IF p_vehicle_number IS NULL OR trim(p_vehicle_number) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vehicle number is required');
    END IF;
    IF p_transporter_name IS NULL OR trim(p_transporter_name) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Transporter name is required');
    END IF;
    IF p_driver_contact IS NULL OR trim(p_driver_contact) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Driver contact is required');
    END IF;
    
    UPDATE purchase_orders SET
      vehicle_number = p_vehicle_number,
      transporter_name = p_transporter_name,
      driver_contact = p_driver_contact,
      transport_source = COALESCE(p_transport_source, 'supplier')
    WHERE id = p_po_id;
  END IF;

  -- Delivery delay reason tracking
  IF p_new_status = 'delivered' AND p_delivery_delay_reason IS NOT NULL THEN
    UPDATE purchase_orders SET
      delivery_delay_reason = p_delivery_delay_reason,
      delivery_delay_notes = p_delivery_delay_notes
    WHERE id = p_po_id;
  END IF;

  -- Payment proof tracking
  IF p_new_status = 'payment_done' THEN
    UPDATE purchase_orders SET
      payment_mode = COALESCE(p_payment_mode, 'manual'),
      payment_proof_url = p_payment_proof_url,
      payment_confirmed_at = now()
    WHERE id = p_po_id;
  END IF;

  -- Update status
  UPDATE purchase_orders SET status = p_new_status, updated_at = now() WHERE id = p_po_id;

  -- Record history
  INSERT INTO po_status_history (po_id, from_status, to_status, changed_by, user_role, notes)
  VALUES (p_po_id, v_current_status, p_new_status, p_user_id, p_user_role, p_notes);

  -- Update supplier reliability on delivery
  IF p_new_status = 'delivered' THEN
    PERFORM update_supplier_reliability(
      (SELECT supplier_id FROM purchase_orders WHERE id = p_po_id)
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
