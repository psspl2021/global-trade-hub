-- Harden get_scoped_auctions_by_purchaser: non-blocking audit
CREATE OR REPLACE FUNCTION public.get_scoped_auctions_by_purchaser(
  p_user_id uuid,
  p_acting_purchaser_id uuid,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_from_date timestamptz DEFAULT NULL,
  p_to_date timestamptz DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS SETOF public.reverse_auctions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_role text;
  v_effective_purchaser uuid;
BEGIN
  SELECT company_id, role INTO v_company_id, v_role
  FROM public.buyer_company_members
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN;
  END IF;

  v_effective_purchaser := COALESCE(p_acting_purchaser_id, p_user_id);

  -- Non-blocking audit: never break the read path
  IF v_effective_purchaser <> p_user_id THEN
    BEGIN
      PERFORM public.log_impersonation_read(p_user_id, v_effective_purchaser, 'auction');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN QUERY
  SELECT ra.*
  FROM public.reverse_auctions ra
  WHERE ra.buyer_company_id = v_company_id
    AND ra.purchaser_id = v_effective_purchaser
    AND (p_status IS NULL OR ra.status = p_status)
    AND (p_search IS NULL OR ra.title ILIKE '%' || p_search || '%')
    AND (p_from_date IS NULL OR ra.created_at >= p_from_date)
    AND (p_to_date IS NULL OR ra.created_at <= p_to_date)
  ORDER BY ra.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;