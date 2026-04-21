-- 1) Replace the stage-2 approval RPC to accept BOTH purchase_head and vp
CREATE OR REPLACE FUNCTION public.approve_po_as_purchase_head(_po_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po RECORD;
  v_user uuid := auth.uid();
  v_caller_role text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders WHERE id = _po_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF v_po.po_source <> 'auction' THEN
    RAISE EXCEPTION 'Only auction-derived POs go through this approval flow';
  END IF;

  IF v_po.approval_status <> 'pending_purchase_head' THEN
    RAISE EXCEPTION 'PO is not pending stage-2 approval (current: %)', v_po.approval_status;
  END IF;

  -- Caller must be active purchase_head OR vp in same buyer company
  SELECT lower(role) INTO v_caller_role
    FROM public.buyer_company_members
   WHERE user_id = v_user
     AND company_id = v_po.buyer_company_id
     AND is_active = true
     AND lower(role) IN ('purchase_head', 'vp')
   LIMIT 1;

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Only Head of Procurement or VP can perform this approval';
  END IF;

  UPDATE public.purchase_orders
     SET approval_status = 'approved',
         po_status = 'sent',
         director_approved_by = v_user,
         director_approved_at = now(),
         updated_at = now()
   WHERE id = _po_id;

  INSERT INTO public.po_approval_logs (po_id, action, performed_by, performed_role, notes, idempotency_key)
  VALUES (_po_id, 'approved', v_user, v_caller_role, _notes, 'head-approve-' || _po_id::text)
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'approved_as', v_caller_role);
END;
$$;

-- 2) Update RLS visibility so VPs can see pending POs in their company
DROP POLICY IF EXISTS po_approvers_visibility ON public.purchase_orders;
CREATE POLICY po_approvers_visibility
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.buyer_company_members m
     WHERE m.user_id = auth.uid()
       AND m.company_id = purchase_orders.buyer_company_id
       AND m.is_active = true
       AND lower(m.role) IN ('manager','buyer_manager','operations_manager','purchase_head','vp')
  )
);
