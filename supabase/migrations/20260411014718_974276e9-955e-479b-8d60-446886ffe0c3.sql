
-- Add transport detail columns to purchase_orders
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
  ADD COLUMN IF NOT EXISTS transporter_name TEXT,
  ADD COLUMN IF NOT EXISTS driver_contact TEXT;

-- Add delay reason tracking
ALTER TABLE public.po_status_history
  ADD COLUMN IF NOT EXISTS delay_reason TEXT;

-- Function to check if buyer can create new PO
CREATE OR REPLACE FUNCTION public.check_can_create_po(p_buyer_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
BEGIN
  -- Check for any incomplete POs (auction-based via reverse_auctions)
  SELECT ra.id, ra.title, ra.status INTO v_pending
  FROM reverse_auctions ra
  WHERE ra.buyer_id = p_buyer_id
    AND ra.status = 'completed'
    AND ra.winner_supplier_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM po_status_history psh
      WHERE psh.po_id = ra.id
        AND psh.new_status IN ('payment_done', 'closed')
    )
    AND EXISTS (
      SELECT 1 FROM po_status_history psh2
      WHERE psh2.po_id = ra.id
        AND psh2.new_status = 'sent'
    )
  LIMIT 1;

  IF v_pending IS NOT NULL THEN
    RETURN json_build_object(
      'allowed', false,
      'blocking_po_id', v_pending.id,
      'blocking_po_title', v_pending.title,
      'message', 'Complete delivery & payment of previous order before creating a new PO'
    );
  END IF;

  -- Check manual POs
  SELECT po.id, po.po_number, po.status INTO v_pending
  FROM purchase_orders po
  WHERE po.supplier_id = p_buyer_id
    AND po.status NOT IN ('payment_done', 'closed', 'draft')
  LIMIT 1;

  IF v_pending IS NOT NULL THEN
    RETURN json_build_object(
      'allowed', false,
      'blocking_po_id', v_pending.id,
      'blocking_po_title', v_pending.po_number,
      'message', 'Complete delivery & payment of previous order before creating a new PO'
    );
  END IF;

  RETURN json_build_object('allowed', true);
END;
$$;

-- Updated transition function with transport validation
CREATE OR REPLACE FUNCTION public.transition_po_status(
  p_po_id UUID,
  p_new_status TEXT,
  p_user_id UUID,
  p_user_role TEXT,
  p_notes TEXT DEFAULT NULL,
  p_vehicle_number TEXT DEFAULT NULL,
  p_transporter_name TEXT DEFAULT NULL,
  p_driver_contact TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_allowed_transitions TEXT[];
  v_allowed_roles TEXT[];
  v_exec_role TEXT;
  v_found BOOLEAN := false;
BEGIN
  -- Get current status from history or default to draft
  SELECT psh.new_status INTO v_current_status
  FROM po_status_history psh
  WHERE psh.po_id = p_po_id
  ORDER BY psh.created_at DESC
  LIMIT 1;

  IF v_current_status IS NULL THEN
    v_current_status := 'draft';
  END IF;

  -- Map user role to execution role
  IF p_user_role IN ('buyer', 'buyer_purchaser', 'buyer_cfo', 'buyer_ceo', 'buyer_manager', 'buyer_hr', 'purchaser') THEN
    v_exec_role := 'buyer';
  ELSIF p_user_role = 'supplier' THEN
    v_exec_role := 'supplier';
  ELSIF p_user_role IN ('transporter', 'logistics_partner') THEN
    v_exec_role := 'transporter';
  ELSIF p_user_role IN ('admin', 'ps_admin') THEN
    v_exec_role := 'admin';
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid role');
  END IF;

  -- Define strict transitions
  CASE v_current_status
    WHEN 'draft' THEN
      IF p_new_status = 'sent' AND v_exec_role IN ('buyer', 'admin') THEN v_found := true; END IF;
    WHEN 'sent' THEN
      IF p_new_status = 'accepted' AND v_exec_role = 'supplier' THEN v_found := true; END IF;
    WHEN 'accepted' THEN
      IF p_new_status = 'in_transit' AND v_exec_role IN ('supplier', 'transporter') THEN
        -- Validate transport details
        IF p_vehicle_number IS NULL OR p_vehicle_number = '' THEN
          RETURN json_build_object('success', false, 'error', 'Vehicle number is required before marking in-transit');
        END IF;
        IF p_transporter_name IS NULL OR p_transporter_name = '' THEN
          RETURN json_build_object('success', false, 'error', 'Transporter name is required before marking in-transit');
        END IF;
        IF p_driver_contact IS NULL OR p_driver_contact = '' THEN
          RETURN json_build_object('success', false, 'error', 'Driver contact number is required before marking in-transit');
        END IF;
        -- Save transport details
        UPDATE purchase_orders SET
          vehicle_number = p_vehicle_number,
          transporter_name = p_transporter_name,
          driver_contact = p_driver_contact
        WHERE id = p_po_id;
        v_found := true;
      END IF;
    WHEN 'in_transit' THEN
      IF p_new_status = 'delivered' AND v_exec_role IN ('supplier', 'transporter') THEN v_found := true; END IF;
    WHEN 'delivered' THEN
      IF p_new_status = 'payment_done' AND v_exec_role IN ('buyer', 'admin') THEN v_found := true; END IF;
    WHEN 'payment_done' THEN
      IF p_new_status = 'closed' AND v_exec_role IN ('buyer', 'admin') THEN v_found := true; END IF;
    ELSE
      RETURN json_build_object('success', false, 'error', 'Invalid current status');
  END CASE;

  IF NOT v_found THEN
    RETURN json_build_object('success', false, 'error',
      format('Transition from %s to %s not allowed for role %s', v_current_status, p_new_status, v_exec_role));
  END IF;

  -- Record transition
  INSERT INTO po_status_history (po_id, old_status, new_status, changed_by, user_role, notes)
  VALUES (p_po_id, v_current_status, p_new_status, p_user_id, p_user_role, p_notes);

  -- Update PO status if it's a manual PO
  UPDATE purchase_orders SET status = p_new_status WHERE id = p_po_id;

  RETURN json_build_object('success', true, 'new_status', p_new_status);
END;
$$;
