-- 1) Fix transfer_po_purchaser: derive company from PO, deterministic hash
CREATE OR REPLACE FUNCTION public.transfer_po_purchaser(
  p_po_id uuid,
  p_new_user uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
  v_role text;
  v_ok int;
  v_old_purchaser uuid;
BEGIN
  SELECT buyer_company_id, purchaser_id
  INTO v_company, v_old_purchaser
  FROM public.purchase_orders
  WHERE id = p_po_id;

  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Purchase order not found or missing company';
  END IF;

  SELECT LOWER(role) INTO v_role
  FROM public.buyer_company_members
  WHERE user_id = auth.uid()
    AND company_id = v_company
    AND is_active = true
  ORDER BY CASE LOWER(role)
    WHEN 'ceo' THEN 1
    WHEN 'cfo' THEN 2
    WHEN 'director' THEN 3
    ELSE 9
  END
  LIMIT 1;

  IF v_role IS NULL OR v_role NOT IN ('ceo','cfo','director') THEN
    RAISE EXCEPTION 'Not authorized to transfer purchase order';
  END IF;

  PERFORM 1
  FROM public.buyer_company_members
  WHERE user_id = p_new_user
    AND company_id = v_company
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not in company';
  END IF;

  UPDATE public.purchase_orders
  SET purchaser_id = p_new_user,
      updated_at = now()
  WHERE id = p_po_id;

  GET DIAGNOSTICS v_ok = ROW_COUNT;

  INSERT INTO public.audit_ledger(
    action, entity_type, entity_id, performed_by,
    old_data, new_data, record_hash
  )
  VALUES (
    'po_purchaser_transferred',
    'purchase_order',
    p_po_id,
    auth.uid(),
    jsonb_build_object('purchaser_id', v_old_purchaser),
    jsonb_build_object('purchaser_id', p_new_user),
    encode(
      digest(
        p_po_id::text || '|' ||
        COALESCE(v_old_purchaser::text,'') || '|' ||
        p_new_user::text || '|' ||
        auth.uid()::text,
        'sha256'
      ),
      'hex'
    )
  );

  RETURN v_ok = 1;
END;
$$;

-- 2) Mutually exclusive RLS for purchase_orders
DROP POLICY IF EXISTS po_purchaser_self ON public.purchase_orders;
DROP POLICY IF EXISTS po_management_company ON public.purchase_orders;

CREATE POLICY po_purchaser_self
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (
  purchaser_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.buyer_company_members m
    WHERE m.user_id = auth.uid()
      AND m.company_id = purchase_orders.buyer_company_id
      AND m.is_active = true
      AND LOWER(m.role) = 'purchaser'
  )
);

CREATE POLICY po_management_company
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.buyer_company_members m
    WHERE m.user_id = auth.uid()
      AND m.company_id = purchase_orders.buyer_company_id
      AND m.is_active = true
      AND LOWER(m.role) IN ('ceo','cfo','director','manager','operations_manager','purchase_head')
  )
);

-- 3) Mutually exclusive RLS for requirements (company resolved via buyer's membership)
DROP POLICY IF EXISTS rfq_purchaser_self ON public.requirements;
DROP POLICY IF EXISTS rfq_management_company ON public.requirements;

CREATE POLICY rfq_purchaser_self
ON public.requirements
FOR SELECT
TO authenticated
USING (
  purchaser_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.buyer_company_members caller
    JOIN public.buyer_company_members owner_m
      ON owner_m.company_id = caller.company_id
    WHERE caller.user_id = auth.uid()
      AND caller.is_active = true
      AND LOWER(caller.role) = 'purchaser'
      AND owner_m.user_id = requirements.buyer_id
      AND owner_m.is_active = true
  )
);

CREATE POLICY rfq_management_company
ON public.requirements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.buyer_company_members caller
    JOIN public.buyer_company_members owner_m
      ON owner_m.company_id = caller.company_id
    WHERE caller.user_id = auth.uid()
      AND caller.is_active = true
      AND LOWER(caller.role) IN ('ceo','cfo','director','manager','operations_manager','purchase_head')
      AND owner_m.user_id = requirements.buyer_id
      AND owner_m.is_active = true
  )
);

-- 4) Index audit lookups for transfer events
CREATE INDEX IF NOT EXISTS idx_audit_po_transfer
ON public.audit_ledger (entity_id)
WHERE action = 'po_purchaser_transferred';