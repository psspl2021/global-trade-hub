CREATE OR REPLACE FUNCTION public.integrity_signals()
RETURNS TABLE(orphan_buyers bigint, members_without_roles bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT count(DISTINCT ur.user_id)
      FROM public.user_roles ur
      WHERE ur.role::text LIKE 'buyer_%'
        AND NOT EXISTS (
          SELECT 1 FROM public.buyer_company_members m
          WHERE m.user_id = ur.user_id AND m.is_active = true
        )
    )::bigint AS orphan_buyers,
    (
      SELECT count(*)
      FROM public.buyer_company_members m
      WHERE m.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM public.user_roles ur WHERE ur.user_id = m.user_id
        )
    )::bigint AS members_without_roles;
$$;

REVOKE ALL ON FUNCTION public.integrity_signals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.integrity_signals() TO service_role;