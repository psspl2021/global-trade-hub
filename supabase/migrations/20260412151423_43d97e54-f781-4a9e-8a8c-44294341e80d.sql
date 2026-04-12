
CREATE OR REPLACE FUNCTION public.proceed_po_step(
  p_po_id UUID,
  p_new_status TEXT,
  p_updated_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po RECORD;
  v_confirmed BOOLEAN;
BEGIN
  -- Lock the PO row to prevent concurrent updates
  SELECT po_source, external_po_number, status
  INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'PO not found');
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
  SET status = p_new_status, updated_at = now()
  WHERE id = p_po_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
