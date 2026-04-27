
-- Trigger: auto-create rfq_revenue_attribution when a new requirement is inserted
CREATE OR REPLACE FUNCTION public.tg_rfq_attribute_revenue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rfq_revenue_attribution (
    rfq_id, page_path, source_page_type, sku_slug, country_slug, revenue_value, session_id, created_at
  ) VALUES (
    NEW.id,
    '/sku/' || lower(regexp_replace(coalesce(NEW.product_category, NEW.title, 'general'), '[^a-zA-Z0-9]+', '-', 'g')),
    COALESCE(NEW.rfq_source, 'organic'),
    lower(regexp_replace(coalesce(NEW.product_category, NEW.title, 'general'), '[^a-zA-Z0-9]+', '-', 'g')),
    lower(regexp_replace(coalesce(NEW.destination_country, 'india'), '[^a-zA-Z0-9]+', '-', 'g')),
    COALESCE(NEW.budget_max, NEW.budget_min, NEW.target_price, NEW.quantity * 1000, 50000)::numeric,
    'auto-' || NEW.id::text,
    NEW.created_at
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- never block the RFQ insert
END;
$$;

DROP TRIGGER IF EXISTS trg_rfq_attribute_revenue ON public.requirements;
CREATE TRIGGER trg_rfq_attribute_revenue
AFTER INSERT ON public.requirements
FOR EACH ROW EXECUTE FUNCTION public.tg_rfq_attribute_revenue();

-- Function: refresh gsc_striking_distance from gsc_queries (call from cron daily)
CREATE OR REPLACE FUNCTION public.refresh_gsc_striking_distance()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE inserted_count integer;
BEGIN
  WITH ins AS (
    INSERT INTO public.gsc_striking_distance (page_slug, query, position, impressions, clicks, ctr, detected_at, is_active)
    SELECT q.page_slug, q.query, q.position::numeric, q.impressions, q.clicks, q.ctr::numeric, now(), true
    FROM public.gsc_queries q
    WHERE q.position BETWEEN 4 AND 20
      AND q.impressions >= 10
      AND NOT EXISTS (
        SELECT 1 FROM public.gsc_striking_distance s
        WHERE s.page_slug = q.page_slug AND s.query = q.query
      )
    RETURNING 1
  )
  SELECT count(*) INTO inserted_count FROM ins;

  -- Deactivate queries that are no longer striking distance (now ranking <4 or >20)
  UPDATE public.gsc_striking_distance s
  SET is_active = false
  FROM public.gsc_queries q
  WHERE s.page_slug = q.page_slug AND s.query = q.query
    AND s.is_active = true
    AND (q.position < 4 OR q.position > 20);

  RETURN inserted_count;
END;
$$;
