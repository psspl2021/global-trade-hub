-- Scoped reader for logistics_requirements by purchaser context
-- Mirrors the hard-override pattern: purchaser role = self-only (DB enforces, ignores p_selected_purchaser)
CREATE OR REPLACE FUNCTION public.get_scoped_logistics_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL
)
RETURNS SETOF public.logistics_requirements
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

  -- Solo buyer (no company membership): self only
  IF v_company IS NULL THEN
    RETURN QUERY
      SELECT * FROM public.logistics_requirements
      WHERE customer_id = p_user_id
      ORDER BY created_at DESC;
    RETURN;
  END IF;

  -- Purchaser role: HARD self-only override (ignore p_selected_purchaser)
  IF v_role = 'purchaser' THEN
    RETURN QUERY
      SELECT l.* FROM public.logistics_requirements l
      WHERE l.customer_id = p_user_id
      ORDER BY l.created_at DESC;
    RETURN;
  END IF;

  -- Management roles: optional purchaser filter; otherwise company-wide
  IF p_selected_purchaser IS NOT NULL THEN
    RETURN QUERY
      SELECT l.* FROM public.logistics_requirements l
      WHERE l.customer_id = p_selected_purchaser
        AND EXISTS (
          SELECT 1 FROM public.buyer_company_members m
          WHERE m.user_id = l.customer_id AND m.company_id = v_company
        )
      ORDER BY l.created_at DESC;
  ELSE
    RETURN QUERY
      SELECT l.* FROM public.logistics_requirements l
      WHERE EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.user_id = l.customer_id AND m.company_id = v_company
      )
      ORDER BY l.created_at DESC;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_scoped_logistics_by_purchaser(uuid, uuid) TO authenticated;