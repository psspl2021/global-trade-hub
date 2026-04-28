CREATE OR REPLACE FUNCTION public.refresh_gsc_striking_distance()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.gsc_striking_distance SET is_active = false WHERE is_active = true;

  INSERT INTO public.gsc_striking_distance (page_slug, query, position, impressions, clicks, ctr, is_active, detected_at)
  SELECT
    q.page_slug,
    q.query,
    q.position,
    q.impressions,
    COALESCE(q.clicks, 0),
    CASE WHEN q.impressions > 0 THEN COALESCE(q.clicks, 0)::numeric / q.impressions ELSE 0 END,
    true,
    now()
  FROM public.gsc_queries q
  WHERE q.position BETWEEN 4 AND 20
    AND q.impressions >= 1
  ON CONFLICT (page_slug, query) DO UPDATE
    SET position = EXCLUDED.position,
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        ctr = EXCLUDED.ctr,
        is_active = true,
        detected_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;