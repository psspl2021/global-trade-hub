-- =====================================================
-- FIX: RFQ → Demand Intelligence Pipeline
-- =====================================================
-- Problem: RFQs without signal_page_id don't create demand signals
-- Solution: Update trigger to ALWAYS create demand signals from RFQs

-- 1. Drop old restrictive function
DROP FUNCTION IF EXISTS create_demand_signal_from_rfq() CASCADE;

-- 2. Create new universal trigger function
CREATE OR REPLACE FUNCTION create_demand_signal_from_rfq()
RETURNS TRIGGER AS $$
DECLARE
  v_signal_page RECORD;
  v_estimated_value NUMERIC;
  v_country TEXT;
  v_category TEXT;
BEGIN
  -- Skip non-active RFQs (only fire on real submissions)
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;
  
  -- Determine country from destination_country or trade_type
  v_country := COALESCE(
    NEW.destination_country, 
    CASE WHEN NEW.trade_type = 'export' THEN 'GLOBAL' ELSE 'IN' END
  );
  
  -- Slugify category (lowercase, replace spaces with hyphens)
  v_category := LOWER(REGEXP_REPLACE(COALESCE(NEW.product_category, 'general'), '\s+', '-', 'g'));
  
  -- Calculate estimated value from requirement items
  SELECT COALESCE(SUM(COALESCE(budget_max, budget_min, 0) * quantity), 100000)
  INTO v_estimated_value
  FROM requirement_items
  WHERE requirement_id = NEW.id;
  
  -- If signal_page_id provided, get signal page data
  IF NEW.signal_page_id IS NOT NULL THEN
    SELECT * INTO v_signal_page 
    FROM admin_signal_pages 
    WHERE id = NEW.signal_page_id;
    
    IF FOUND THEN
      v_category := v_signal_page.category;
      v_country := COALESCE(v_signal_page.target_country, v_country);
    END IF;
  END IF;
  
  -- ALWAYS insert demand signal for submitted RFQs
  INSERT INTO demand_intelligence_signals (
    signal_source,
    signal_page_id,
    converted_to_rfq_id,
    category,
    subcategory,
    country,
    classification,
    lane_state,
    intent_score,
    estimated_value,
    delivery_location,
    product_description,
    buyer_type,
    confidence_score,
    discovered_at,
    created_at
  ) VALUES (
    CASE WHEN NEW.signal_page_id IS NOT NULL THEN 'signal_page' ELSE 'rfq' END,
    NEW.signal_page_id,
    NEW.id,
    v_category,
    'general',
    v_country,
    'buy',
    'detected',
    1.0,
    v_estimated_value,
    NEW.delivery_location,
    NEW.title,
    COALESCE(NEW.trade_type, 'domestic'),
    0.9,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  -- Update signal page stats if applicable
  IF NEW.signal_page_id IS NOT NULL THEN
    UPDATE admin_signal_pages
    SET rfqs_submitted = COALESCE(rfqs_submitted, 0) + 1,
        intent_score = COALESCE(intent_score, 0) + 5,
        updated_at = NOW()
    WHERE id = NEW.signal_page_id;
  END IF;
  
  RAISE LOG '[DemandPipeline] Created demand signal for RFQ %: category=%, country=%, source=%',
    NEW.id, v_category, v_country, 
    CASE WHEN NEW.signal_page_id IS NOT NULL THEN 'signal_page' ELSE 'rfq' END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recreate trigger
DROP TRIGGER IF EXISTS trg_create_demand_signal_on_rfq ON requirements;
CREATE TRIGGER trg_create_demand_signal_on_rfq
  AFTER INSERT ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION create_demand_signal_from_rfq();

-- 4. Fix activate_lane_from_signal to work without admin_id parameter
DROP FUNCTION IF EXISTS activate_lane_from_signal(text, text, uuid);
DROP FUNCTION IF EXISTS activate_lane_from_signal(text, text);

CREATE OR REPLACE FUNCTION activate_lane_from_signal(
  p_country TEXT,
  p_category TEXT,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
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
  
  -- Update existing demand signals to activated
  UPDATE demand_intelligence_signals
  SET 
    decision_action = 'activated',
    lane_state = 'activated',
    activated_at = NOW(),
    decision_made_by = p_admin_id,
    decision_made_at = NOW(),
    updated_at = NOW()
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
      confidence_score,
      discovered_at,
      created_at,
      decision_made_by,
      decision_made_at
    ) VALUES (
      p_category,
      p_country,
      'activated',
      'activated',
      NOW(),
      'buyer_activation',
      'buy',
      0.7,
      0.85,
      NOW(),
      NOW(),
      p_admin_id,
      NOW()
    );
    v_updated_count := 1;
  END IF;
  
  -- If still no updates, create a fresh activated lane (admin override)
  IF v_updated_count = 0 THEN
    INSERT INTO demand_intelligence_signals (
      category,
      country,
      lane_state,
      decision_action,
      activated_at,
      signal_source,
      classification,
      intent_score,
      confidence_score,
      discovered_at,
      created_at,
      decision_made_by,
      decision_made_at
    ) VALUES (
      p_category,
      p_country,
      'activated',
      'activated',
      NOW(),
      'admin',
      'buy',
      0.5,
      0.7,
      NOW(),
      NOW(),
      p_admin_id,
      NOW()
    );
    v_updated_count := 1;
  END IF;
  
  -- Insert lane_events audit log
  INSERT INTO lane_events (
    signal_id,
    event_type,
    country,
    category,
    from_state,
    to_state,
    actor,
    occurred_at,
    metadata
  )
  SELECT 
    id,
    'LANE_STATE_CHANGED',
    p_country,
    p_category,
    'detected',
    'activated',
    COALESCE(p_admin_id::text, 'system')::text,
    NOW(),
    jsonb_build_object('source', 'grid_activation', 'had_signal', v_signal_exists, 'had_activation', v_activation_exists)
  FROM demand_intelligence_signals
  WHERE country = p_country AND category = p_category AND lane_state = 'activated'
  LIMIT 1;
  
  RAISE LOG '[LaneActivation] Activated lane %/% (updated: %, signal: %, activation: %)', 
    p_country, p_category, v_updated_count, v_signal_exists, v_activation_exists;
  
  RETURN json_build_object(
    'success', TRUE,
    'country', p_country,
    'category', p_category,
    'updated_count', v_updated_count,
    'from_activation_signal', v_activation_exists,
    'from_demand_signal', v_signal_exists
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. DROP and recreate grid RPC with lane_state column
DROP FUNCTION IF EXISTS get_demand_intelligence_grid(INT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_demand_intelligence_grid(
  p_days_back INT DEFAULT 7,
  p_country TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  country TEXT,
  category TEXT,
  intent INT,
  rfqs INT,
  source TEXT,
  has_activation BOOLEAN,
  lane_state TEXT
) AS $$
WITH 
  -- Aggregate demand_intelligence_signals (SEO + RFQ signals)
  demand_signals AS (
    SELECT
      dis.country,
      dis.category,
      CEIL(COALESCE(SUM(dis.intent_score * 10), 0))::INT AS intent,
      COUNT(*) FILTER (
        WHERE dis.classification = 'buy'
           OR dis.lane_state IN ('detected', 'pending', 'activated', 'fulfilling')
           OR dis.converted_to_rfq_id IS NOT NULL
      )::INT AS rfqs,
      'seo_rfq' AS signal_source,
      MAX(dis.lane_state) AS lane_state
    FROM public.demand_intelligence_signals dis
    WHERE dis.discovered_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND (p_country IS NULL OR dis.country = p_country)
      AND (p_category IS NULL OR dis.category = p_category)
    GROUP BY dis.country, dis.category
  ),
  
  -- Aggregate buyer_activation_signals (RFQ abandonment / repeat drafts)
  activation_signals AS (
    SELECT
      bas.category_slug AS category,
      COALESCE(
        (SELECT r.form_data->>'destinationCountry' 
         FROM public.rfq_drafts r 
         WHERE r.session_id = bas.session_id 
         AND r.form_data IS NOT NULL
         LIMIT 1),
        'IN'
      ) AS country,
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
      COALESCE(d.country, a.country) AS country,
      COALESCE(d.category, a.category) AS category,
      COALESCE(d.intent, 0) + COALESCE(a.intent, 0) AS intent,
      COALESCE(d.rfqs, 0) + COALESCE(a.rfqs, 0) AS rfqs,
      CASE 
        WHEN a.category IS NOT NULL THEN 'activation'
        ELSE COALESCE(d.signal_source, 'seo_rfq')
      END AS signal_source,
      a.category IS NOT NULL AS has_activation,
      d.lane_state
    FROM demand_signals d
    FULL OUTER JOIN activation_signals a 
      ON d.category = a.category AND d.country = a.country
  )
  
SELECT 
  cs.country,
  cs.category,
  cs.intent,
  cs.rfqs,
  cs.signal_source AS source,
  cs.has_activation,
  COALESCE(cs.lane_state, 'detected') AS lane_state
FROM combined_signals cs
WHERE cs.country IS NOT NULL AND cs.category IS NOT NULL
ORDER BY 
  cs.has_activation DESC,
  cs.intent DESC,
  cs.rfqs DESC
LIMIT 500;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;