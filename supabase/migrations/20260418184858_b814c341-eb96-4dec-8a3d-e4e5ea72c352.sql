CREATE OR REPLACE FUNCTION public.get_scoped_auctions_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_has_winner boolean DEFAULT NULL,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS SETOF reverse_auctions
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_company_id uuid;
  v_effective_purchaser uuid;
  v_is_management boolean := false;
BEGIN
  SELECT m.company_id, m.role INTO v_company_id, v_caller_role
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id AND m.is_active = true
  ORDER BY m.created_at ASC LIMIT 1;

  v_is_management := v_caller_role IN ('owner','admin','manager','director','cfo','buyer_admin');

  IF v_caller_role IN ('purchaser','buyer_purchaser') THEN
    v_effective_purchaser := p_user_id;
  ELSIF v_is_management THEN
    v_effective_purchaser := COALESCE(p_selected_purchaser, p_user_id);
  ELSE
    v_effective_purchaser := p_user_id;
  END IF;

  IF v_effective_purchaser <> p_user_id
     AND v_caller_role NOT IN ('purchaser','buyer_purchaser') THEN
    PERFORM public.log_impersonation_read(p_user_id, v_effective_purchaser, 'auction');
  END IF;

  RETURN QUERY
  SELECT a.* FROM public.reverse_auctions a
  WHERE
    (
      (v_company_id IS NOT NULL AND a.company_id = v_company_id)
      OR (v_company_id IS NULL AND a.buyer_id = p_user_id)
    )
    AND a.purchaser_id = v_effective_purchaser
    AND (p_status IS NULL OR a.status = p_status)
    AND (p_from IS NULL OR a.created_at >= p_from)
    AND (p_to IS NULL OR a.created_at <= p_to)
    AND (p_has_winner IS NULL
         OR (p_has_winner = true  AND a.winner_supplier_id IS NOT NULL)
         OR (p_has_winner = false AND a.winner_supplier_id IS NULL))
  ORDER BY a.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;