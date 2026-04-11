
-- Add missing execution statuses to the document_status enum
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'payment_done';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'closed';

-- Status history / audit trail for PO execution
CREATE TABLE public.po_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  changed_by_role TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.po_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view PO history"
  ON public.po_status_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can insert PO history"
  ON public.po_status_history FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_po_status_history_po_id ON public.po_status_history(po_id);

-- Server-side function to enforce strict status transitions
CREATE OR REPLACE FUNCTION public.transition_po_status(
  p_po_id UUID,
  p_new_status TEXT,
  p_user_id UUID,
  p_user_role TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_allowed BOOLEAN := FALSE;
BEGIN
  -- Get current status
  SELECT status::TEXT INTO v_current_status
  FROM purchase_orders
  WHERE id = p_po_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Purchase order not found');
  END IF;

  -- Enforce strict sequential transitions + role checks
  IF p_new_status = 'sent' AND v_current_status = 'draft' AND p_user_role IN ('buyer', 'buyer_purchaser', 'admin', 'ps_admin') THEN
    v_allowed := TRUE;
  ELSIF p_new_status = 'accepted' AND v_current_status = 'sent' AND p_user_role IN ('supplier') THEN
    v_allowed := TRUE;
  ELSIF p_new_status = 'in_transit' AND v_current_status = 'accepted' AND p_user_role IN ('supplier', 'transporter') THEN
    v_allowed := TRUE;
  ELSIF p_new_status = 'delivered' AND v_current_status = 'in_transit' AND p_user_role IN ('supplier', 'transporter') THEN
    v_allowed := TRUE;
  ELSIF p_new_status = 'payment_done' AND v_current_status = 'delivered' AND p_user_role IN ('buyer', 'buyer_purchaser', 'buyer_cfo', 'admin', 'ps_admin') THEN
    v_allowed := TRUE;
  ELSIF p_new_status = 'closed' AND v_current_status = 'payment_done' AND p_user_role IN ('admin', 'ps_admin', 'buyer', 'buyer_purchaser') THEN
    v_allowed := TRUE;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Cannot transition from %s to %s with role %s', v_current_status, p_new_status, p_user_role)
    );
  END IF;

  -- Update PO status
  UPDATE purchase_orders SET status = p_new_status::document_status, updated_at = now() WHERE id = p_po_id;

  -- Record history
  INSERT INTO po_status_history (po_id, old_status, new_status, changed_by, changed_by_role, notes)
  VALUES (p_po_id, v_current_status, p_new_status, p_user_id, p_user_role, p_notes);

  RETURN jsonb_build_object('success', true, 'old_status', v_current_status, 'new_status', p_new_status);
END;
$$;
