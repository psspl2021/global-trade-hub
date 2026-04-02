
-- 1. Decay boosts: randomize related_slugs to prevent stagnation
CREATE OR REPLACE FUNCTION public.decay_boosts(max_links int DEFAULT 10)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE demand_generated
  SET related_slugs = (
    SELECT ARRAY(
      SELECT s FROM (
        SELECT unnest(COALESCE(related_slugs, '{}')) AS s
      ) t
      WHERE s IS NOT NULL AND s != ''
      ORDER BY random()
      LIMIT max_links
    )
  )
  WHERE status = 'active'
    AND array_length(related_slugs, 1) > 0;
END;
$$;

-- 2. Category-aware boost: inject category-specific winners into pages
CREATE OR REPLACE FUNCTION public.boost_category_links(max_links int DEFAULT 10)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  cat text;
  winner_slugs text[];
  updated_count int := 0;
BEGIN
  -- Get distinct categories from active pages
  FOR cat IN
    SELECT DISTINCT category FROM demand_generated WHERE status = 'active' AND category IS NOT NULL
  LOOP
    -- Find top 3 winners for this category via the revenue dashboard
    SELECT ARRAY(
      SELECT drv.slug
      FROM demand_revenue_dashboard drv
      JOIN demand_generated dg ON dg.slug = drv.slug
      WHERE dg.category = cat
      ORDER BY drv.revenue_score DESC NULLS LAST
      LIMIT 3
    ) INTO winner_slugs;

    IF array_length(winner_slugs, 1) IS NULL OR array_length(winner_slugs, 1) = 0 THEN
      CONTINUE;
    END IF;

    -- Merge winners into related_slugs for all pages in this category
    UPDATE demand_generated
    SET related_slugs = (
      SELECT ARRAY(
        SELECT DISTINCT s FROM (
          SELECT unnest(COALESCE(related_slugs, '{}')) AS s
          UNION
          SELECT unnest(winner_slugs)
        ) t
        WHERE s IS NOT NULL AND s != ''
        LIMIT max_links
      )
    )
    WHERE status = 'active' AND category = cat;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;
