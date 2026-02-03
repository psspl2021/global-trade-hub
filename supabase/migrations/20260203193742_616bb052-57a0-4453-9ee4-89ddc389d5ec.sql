-- ============================================================
-- UNIFIED DEMAND INTELLIGENCE RPC
-- Combines demand_intelligence_signals + buyer_activation_signals
-- Single source of truth for Admin Demand Dashboard
-- ============================================================

-- Drop existing function to recreate with enhanced logic
DROP FUNCTION IF EXISTS public.get_demand_intelligence_grid(INT);

-- Create unified demand intelligence grid RPC
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
    FROM demand_intelligence_signals dis
    WHERE dis.discovered_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND (p_country IS NULL OR dis.country = p_country)
      AND (p_category IS NULL OR dis.category = p_category)
    GROUP BY dis.category, dis.country
  ),
  
  -- Aggregate buyer_activation_signals (RFQ abandonment / repeat drafts)
  activation_signals AS (
    SELECT
      bas.category_slug AS category,
      -- Try to get country from session or default to 'IN' for now
      COALESCE(
        (SELECT r.destination_country 
         FROM rfq_drafts r 
         WHERE r.session_id = bas.session_id 
         LIMIT 1),
        'IN'
      ) AS country,
      -- Intent from confidence_score: 70 → 7, 85 → 8.5 → 9
      CEIL(AVG(bas.confidence_score) / 10)::INT AS intent,
      COUNT(*)::INT AS rfqs,
      'activation' AS signal_source
    FROM buyer_activation_signals bas
    WHERE bas.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND bas.category_slug IS NOT NULL
      AND (p_category IS NULL OR bas.category_slug = p_category)
    GROUP BY bas.category_slug, 2
  ),
  
  -- Combine both signal sources with UNION
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
  ORDER BY cs.intent DESC, cs.rfqs DESC;
END;
$$;

-- ============================================================
-- LANE ACTIVATION FUNCTION
-- Supports activation from buyer_activation_signals
-- ============================================================

CREATE OR REPLACE FUNCTION public.activate_lane_from_signal(
  p_country TEXT,
  p_category TEXT,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signal_exists BOOLEAN := FALSE;
  v_activation_exists BOOLEAN := FALSE;
  v_updated_count INT := 0;
BEGIN
  -- Check if demand signal exists
  SELECT EXISTS(
    SELECT 1 FROM demand_intelligence_signals
    WHERE country = p_country AND category = p_category
    AND lane_state IN ('detected', 'pending')
  ) INTO v_signal_exists;
  
  -- Check if buyer activation signal exists
  SELECT EXISTS(
    SELECT 1 FROM buyer_activation_signals
    WHERE category_slug = p_category
    AND created_at > NOW() - INTERVAL '7 days'
  ) INTO v_activation_exists;
  
  -- If no signals found, still allow activation (admin override)
  -- This creates a new lane from buyer activation signals
  
  -- Update existing demand signals
  UPDATE demand_intelligence_signals
  SET 
    decision_action = 'activated',
    lane_state = 'activated',
    activated_at = NOW(),
    decision_made_by = p_admin_id,
    decision_made_at = NOW()
  WHERE country = p_country 
    AND category = p_category
    AND lane_state IN ('detected', 'pending');
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- If no existing signal but buyer activation exists, create new lane
  IF v_updated_count = 0 AND v_activation_exists THEN
    INSERT INTO demand_intelligence_signals (
      category,
      country,
      lane_state,
      decision_action,
      activated_at,
      signal_source,
      classification,
      intent_score,
      discovered_at
    ) VALUES (
      p_category,
      p_country,
      'activated',
      'activated',
      NOW(),
      'buyer_activation',
      'buy',
      0.7, -- From activation signal
      NOW()
    );
    v_updated_count := 1;
  END IF;
  
  RAISE LOG '[LaneActivation] Activated lane %/% (updated: %, activation_signal: %)', 
    p_country, p_category, v_updated_count, v_activation_exists;
  
  RETURN json_build_object(
    'success', TRUE,
    'country', p_country,
    'category', p_category,
    'updated_count', v_updated_count,
    'from_activation_signal', v_activation_exists
  );
END;
$$;

-- ============================================================
-- INDEX for performance on buyer_activation_signals queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_buyer_activation_category_created
ON public.buyer_activation_signals(category_slug, created_at DESC)
WHERE category_slug IS NOT NULL;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_demand_intelligence_grid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_demand_intelligence_grid TO anon;
GRANT EXECUTE ON FUNCTION public.activate_lane_from_signal TO authenticated;