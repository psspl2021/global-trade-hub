CREATE OR REPLACE FUNCTION public.get_admin_auction_stats()
RETURNS TABLE(total bigint, live bigint, completed bigint, revenue numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::numeric;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.reverse_auctions)::bigint,
    (SELECT COUNT(*) FROM public.reverse_auctions WHERE status = 'live')::bigint,
    (SELECT COUNT(*) FROM public.reverse_auctions WHERE status = 'completed')::bigint,
    COALESCE(public.auction_total_revenue(), 0)::numeric;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_auction_stats() TO authenticated;