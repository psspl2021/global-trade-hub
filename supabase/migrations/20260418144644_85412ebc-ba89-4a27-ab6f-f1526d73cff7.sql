-- Scoped reader for RFQs (requirements) by purchaser context
CREATE OR REPLACE FUNCTION public.get_scoped_rfqs_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL
)
RETURNS SETOF public.requirements
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_company uuid;
BEGIN
  SELECT role, company_id INTO v_role, v_company
  FROM public.buyer_company_members
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  -- Solo buyer (no company membership)
  IF v_company IS NULL THEN
    RETURN QUERY
      SELECT * FROM public.requirements
      WHERE buyer_id = p_user_id
      ORDER BY created_at DESC;
    RETURN;
  END IF;

  -- Purchaser role: hard self-only, ignore p_selected_purchaser
  IF v_role = 'purchaser' THEN
    RETURN QUERY
      SELECT r.* FROM public.requirements r
      WHERE r.buyer_id = p_user_id
      ORDER BY r.created_at DESC;
    RETURN;
  END IF;

  -- Management roles: optional filter by selected purchaser, else whole company
  IF p_selected_purchaser IS NOT NULL THEN
    RETURN QUERY
      SELECT r.* FROM public.requirements r
      WHERE r.buyer_id = p_selected_purchaser
        AND EXISTS (
          SELECT 1 FROM public.buyer_company_members m
          WHERE m.user_id = r.buyer_id AND m.company_id = v_company
        )
      ORDER BY r.created_at DESC;
  ELSE
    RETURN QUERY
      SELECT r.* FROM public.requirements r
      WHERE EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.user_id = r.buyer_id AND m.company_id = v_company
      )
      ORDER BY r.created_at DESC;
  END IF;
END;
$$;

-- Scoped reader for reverse_auctions by purchaser context
CREATE OR REPLACE FUNCTION public.get_scoped_auctions_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL
)
RETURNS SETOF public.reverse_auctions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_company uuid;
BEGIN
  SELECT role, company_id INTO v_role, v_company
  FROM public.buyer_company_members
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  IF v_company IS NULL THEN
    RETURN QUERY
      SELECT * FROM public.reverse_auctions
      WHERE buyer_id = p_user_id
      ORDER BY created_at DESC;
    RETURN;
  END IF;

  IF v_role = 'purchaser' THEN
    RETURN QUERY
      SELECT a.* FROM public.reverse_auctions a
      WHERE a.buyer_id = p_user_id
      ORDER BY a.created_at DESC;
    RETURN;
  END IF;

  IF p_selected_purchaser IS NOT NULL THEN
    RETURN QUERY
      SELECT a.* FROM public.reverse_auctions a
      WHERE a.buyer_id = p_selected_purchaser
        AND EXISTS (
          SELECT 1 FROM public.buyer_company_members m
          WHERE m.user_id = a.buyer_id AND m.company_id = v_company
        )
      ORDER BY a.created_at DESC;
  ELSE
    RETURN QUERY
      SELECT a.* FROM public.reverse_auctions a
      WHERE EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.user_id = a.buyer_id AND m.company_id = v_company
      )
      ORDER BY a.created_at DESC;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_scoped_rfqs_by_purchaser(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scoped_auctions_by_purchaser(uuid, uuid) TO authenticated;