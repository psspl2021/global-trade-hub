-- =============================================
-- 1) RLS PARITY — purchase_orders & requirements
-- =============================================

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;

-- Drop if re-running
DROP POLICY IF EXISTS po_purchaser_self ON public.purchase_orders;
DROP POLICY IF EXISTS po_management_company ON public.purchase_orders;
DROP POLICY IF EXISTS rfq_purchaser_self ON public.requirements;
DROP POLICY IF EXISTS rfq_management_company ON public.requirements;

-- Purchase Orders: purchasers see only own
CREATE POLICY po_purchaser_self
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.buyer_company_members bcm
    WHERE bcm.user_id = auth.uid()
      AND bcm.is_active = true
      AND LOWER(bcm.role) = 'purchaser'
  )
  AND purchase_orders.purchaser_id = auth.uid()
);

-- Purchase Orders: management roles see all in same company
CREATE POLICY po_management_company
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.buyer_company_members mgr
    JOIN public.buyer_company_members own
      ON own.company_id = mgr.company_id
    WHERE mgr.user_id = auth.uid()
      AND mgr.is_active = true
      AND LOWER(mgr.role) IN ('ceo','cfo','director','manager','operations_manager','purchase_head')
      AND own.user_id = purchase_orders.purchaser_id
      AND own.is_active = true
  )
);

-- Requirements (RFQs): purchasers see only own
CREATE POLICY rfq_purchaser_self
ON public.requirements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.buyer_company_members bcm
    WHERE bcm.user_id = auth.uid()
      AND bcm.is_active = true
      AND LOWER(bcm.role) = 'purchaser'
  )
  AND requirements.purchaser_id = auth.uid()
);

-- Requirements (RFQs): management roles see all in same company
CREATE POLICY rfq_management_company
ON public.requirements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.buyer_company_members mgr
    JOIN public.buyer_company_members own
      ON own.company_id = mgr.company_id
    WHERE mgr.user_id = auth.uid()
      AND mgr.is_active = true
      AND LOWER(mgr.role) IN ('ceo','cfo','director','manager','operations_manager','purchase_head')
      AND own.user_id = requirements.purchaser_id
      AND own.is_active = true
  )
);

-- =============================================
-- 2) INDEX REFINEMENT — lifecycle & overdue
-- =============================================

CREATE INDEX IF NOT EXISTS idx_po_purchaser_lifecycle_due
  ON public.purchase_orders (purchaser_id, approval_status, payment_status, payment_due_date DESC);

CREATE INDEX IF NOT EXISTS idx_po_overdue_open
  ON public.purchase_orders (purchaser_id, payment_due_date)
  WHERE COALESCE(payment_status, '') <> 'paid';

-- =============================================
-- 3) SOFT NOT NULL GUARDS (NOT VALID — phase-in)
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rfq_purchaser_not_null_new'
  ) THEN
    ALTER TABLE public.requirements
      ADD CONSTRAINT rfq_purchaser_not_null_new
      CHECK (purchaser_id IS NOT NULL) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'po_purchaser_not_null_new'
  ) THEN
    ALTER TABLE public.purchase_orders
      ADD CONSTRAINT po_purchaser_not_null_new
      CHECK (purchaser_id IS NOT NULL) NOT VALID;
  END IF;
END $$;

-- =============================================
-- 4) REASSIGNMENT PRIMITIVE — transfer_po_purchaser
-- =============================================

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
  -- Resolve PO's owning company via current purchaser's membership
  SELECT po.purchaser_id INTO v_old_purchaser
  FROM public.purchase_orders po
  WHERE po.id = p_po_id;

  IF v_old_purchaser IS NULL THEN
    RAISE EXCEPTION 'Purchase order not found or has no purchaser';
  END IF;

  SELECT bcm.company_id INTO v_company
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = v_old_purchaser
    AND bcm.is_active = true
  LIMIT 1;

  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Could not resolve company for PO';
  END IF;

  -- Caller must be ceo/cfo/director in same company
  SELECT LOWER(bcm.role) INTO v_role
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = auth.uid()
    AND bcm.company_id = v_company
    AND bcm.is_active = true
  ORDER BY CASE LOWER(bcm.role)
    WHEN 'ceo' THEN 1
    WHEN 'cfo' THEN 2
    WHEN 'director' THEN 3
    ELSE 9
  END
  LIMIT 1;

  IF v_role IS NULL OR v_role NOT IN ('ceo','cfo','director') THEN
    RAISE EXCEPTION 'Not authorized to transfer purchaser';
  END IF;

  -- Target must belong to same company
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

  -- Audit (best-effort; ignore if audit table missing)
  BEGIN
    INSERT INTO public.audit_ledger(action, entity_type, entity_id, performed_by, new_data, record_hash)
    VALUES (
      'po_purchaser_transferred',
      'purchase_order',
      p_po_id,
      auth.uid(),
      jsonb_build_object('from', v_old_purchaser, 'to', p_new_user),
      encode(digest(p_po_id::text || p_new_user::text || now()::text, 'sha256'), 'hex')
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_ok = 1;
END;
$$;