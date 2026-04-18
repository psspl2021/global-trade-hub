-- Gap 1: Backend enforcement — purchaser role can ONLY see own data
CREATE OR REPLACE FUNCTION public.get_scoped_pos_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL
)
RETURNS SETOF public.purchase_orders
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_company uuid;
BEGIN
  -- Resolve caller's role + company
  SELECT role, company_id
    INTO v_role, v_company
  FROM public.buyer_company_members
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;

  -- No company membership → return only own POs (solo buyer)
  IF v_company IS NULL THEN
    RETURN QUERY
      SELECT * FROM public.purchase_orders
      WHERE purchaser_id = p_user_id
      ORDER BY created_at DESC;
    RETURN;
  END IF;

  -- Purchaser role → FORCED self-only, ignore p_selected_purchaser
  IF v_role = 'purchaser' THEN
    RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE po.purchaser_id = p_user_id
      ORDER BY po.created_at DESC;
    RETURN;
  END IF;

  -- Management roles (ceo, cfo, director, operations_manager, purchase_head, hr)
  -- Optional filter by selected purchaser
  IF p_selected_purchaser IS NOT NULL THEN
    RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE po.purchaser_id = p_selected_purchaser
        AND EXISTS (
          SELECT 1 FROM public.buyer_company_members m
          WHERE m.user_id = po.purchaser_id
            AND m.company_id = v_company
        )
      ORDER BY po.created_at DESC;
  ELSE
    RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.user_id = po.purchaser_id
          AND m.company_id = v_company
      )
      ORDER BY po.created_at DESC;
  END IF;
END;
$$;

-- Gap 4: Performance attribution indexes
CREATE INDEX IF NOT EXISTS idx_po_purchaser_stage
  ON public.purchase_orders (purchaser_id, approval_status, payment_status);

CREATE INDEX IF NOT EXISTS idx_rfq_purchaser
  ON public.requirements (purchaser_id);
