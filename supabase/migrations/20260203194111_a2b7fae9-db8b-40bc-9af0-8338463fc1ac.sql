-- ============================================================
-- FIX: UNIFIED DEMAND INTELLIGENCE RPC
-- Fixes column reference - rfq_drafts doesn't have destination_country
-- Uses default 'IN' for buyer_activation_signals country
-- ============================================================

-- Drop and recreate the function with fixed column reference
DROP FUNCTION IF EXISTS public.get_demand_intelligence_grid(INT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_demand_intelligence_grid(
  p_days_back INT DEFAULT 7,
  p_country TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  category TEXT,
  country TEXT,
  intent INT,
  rfqs INT,
  state TEXT,
  source TEXT,
  has_activation_signal BOOLEAN
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Aggregate demand_intelligence_signals
  demand_signals AS (
    SELECT
      dis.category,
      dis.country,
      CEIL(COALESCE(SUM(dis.intent_score * 10), 0))::INT AS intent,
      COUNT(*) FILTER (
        WHERE dis.classification = 'buy'
           OR dis.lane_state = 'rfq_submitted'
      )::INT AS rfqs,
      'seo_rfq' AS signal_source
    FROM public.demand_intelligence_signals dis
    WHERE dis.discovered_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND (p_country IS NULL OR dis.country = p_country)
      AND (p_category IS NULL OR dis.category = p_category)
    GROUP BY dis.category, dis.country
  ),
  
  -- Aggregate buyer_activation_signals (RFQ abandonment / repeat drafts)
  -- Country extracted from form_data JSON if available, else default 'IN'
  activation_signals AS (
    SELECT
      bas.category_slug AS category,
      -- Try to get country from form_data JSON or default to 'IN'
      COALESCE(
        (SELECT r.form_data->>'destinationCountry' 
         FROM public.rfq_drafts r 
         WHERE r.session_id = bas.session_id 
         AND r.form_data IS NOT NULL
         LIMIT 1),
        'IN'
      ) AS country,
      -- Intent from confidence_score: 70 → 7, 85 → 9
      CEIL(AVG(bas.confidence_score) / 10)::INT AS intent,
      COUNT(*)::INT AS rfqs,
      'activation' AS signal_source
    FROM public.buyer_activation_signals bas
    WHERE bas.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND bas.category_slug IS NOT NULL
      AND (p_category IS NULL OR bas.category_slug = p_category)
    GROUP BY bas.category_slug, 2
  ),
  
  -- Combine both signal sources with FULL OUTER JOIN
  combined_signals AS (
    SELECT 
      COALESCE(d.category, a.category) AS category,
      COALESCE(d.country, a.country) AS country,
      COALESCE(d.intent, 0) + COALESCE(a.intent, 0) AS intent,
      COALESCE(d.rfqs, 0) + COALESCE(a.rfqs, 0) AS rfqs,
      CASE 
        WHEN a.category IS NOT NULL THEN 'activation'
        ELSE d.signal_source
      END AS signal_source,
      a.category IS NOT NULL AS has_activation
    FROM demand_signals d
    FULL OUTER JOIN activation_signals a 
      ON d.category = a.category AND d.country = a.country
  )
  
  SELECT 
    cs.category,
    cs.country,
    cs.intent,
    cs.rfqs,
    CASE
      WHEN cs.intent >= 7 OR cs.has_activation THEN 'Active'
      WHEN cs.intent >= 4 THEN 'Confirmed'
      ELSE 'Detected'
    END AS state,
    cs.signal_source AS source,
    cs.has_activation AS has_activation_signal
  FROM combined_signals cs
  WHERE cs.category IS NOT NULL
    AND (p_country IS NULL OR cs.country = p_country)
  ORDER BY cs.intent DESC, cs.rfqs DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_demand_intelligence_grid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_demand_intelligence_grid TO anon;