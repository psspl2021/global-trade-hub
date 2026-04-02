CREATE OR REPLACE FUNCTION public.boost_internal_links(
  boost_slugs text[],
  max_links int DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE demand_generated
  SET related_slugs = (
    SELECT ARRAY(
      SELECT DISTINCT s FROM (
        SELECT unnest(COALESCE(related_slugs, '{}')) AS s
        UNION
        SELECT unnest(boost_slugs)
      ) t
      WHERE s IS NOT NULL AND s != ''
      LIMIT max_links
    )
  ),
  updated_at = now()
  WHERE status = 'active';
END;
$$;