
-- ============================================================
-- GLOBAL DEMAND HEATMAP PIPELINE FIX
-- ============================================================
-- This migration:
-- A. Deletes seeded placeholder signals
-- B. Creates missing promote_signal_on_visit RPC
-- C. Creates trigger to auto-create demand signal when RFQ is created with signal_page_id
-- ============================================================

-- A. DELETE SEEDED PLACEHOLDER SIGNALS
-- These are 60 records created at same timestamp with classification='research' and estimated_value=0
DELETE FROM demand_intelligence_signals
WHERE signal_source = 'signal_page'
  AND classification = 'research'
  AND (estimated_value = 0 OR estimated_value IS NULL)
  AND created_at < '2026-01-23';

-- B. CREATE MISSING promote_signal_on_visit RPC
-- This is called by SignalPageLayout.tsx on page load
CREATE OR REPLACE FUNCTION public.promote_signal_on_visit(
  p_country TEXT,
  p_category TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signal_id UUID;
BEGIN
  -- Find existing signal for this country+category in detected/pending state
  SELECT id INTO v_signal_id
  FROM demand_intelligence_signals
  WHERE country = p_country
    AND category = p_category
    AND classification IN ('research', 'buy')
    AND lane_state IN ('detected', 'pending_activation', NULL)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_signal_id IS NOT NULL THEN
    -- Increment intent score for existing signal
    UPDATE demand_intelligence_signals
    SET 
      intent_score = COALESCE(intent_score, 0) + 1,
      updated_at = NOW()
    WHERE id = v_signal_id;
  ELSE
    -- Create new demand signal for this country+category
    INSERT INTO demand_intelligence_signals (
      signal_source,
      country,
      category,
      classification,
      decision_action,
      confidence_score,
      intent_score,
      lane_state,
      discovered_at,
      created_at
    ) VALUES (
      'seo_page',
      p_country,
      p_category,
      'research',
      'pending',
      5.0,  -- Default confidence (0-10 scale)
      1,
      'detected',
      NOW(),
      NOW()
    );
  END IF;
END;
$$;

-- C. CREATE TRIGGER TO AUTO-CREATE DEMAND SIGNAL ON RFQ WITH signal_page_id
CREATE OR REPLACE FUNCTION public.create_demand_signal_on_rfq()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signal_id UUID;
  v_estimated_value NUMERIC;
BEGIN
  -- Only trigger when signal_page_id is set (signal page sourced RFQ)
  IF NEW.signal_page_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate estimated value from requirement items if available
  SELECT COALESCE(SUM(quantity * estimated_price_per_unit), 0)
  INTO v_estimated_value
  FROM requirement_items
  WHERE requirement_id = NEW.id
    AND estimated_price_per_unit > 0;

  -- Check if signal already exists for this RFQ
  SELECT id INTO v_signal_id
  FROM demand_intelligence_signals
  WHERE converted_to_rfq_id = NEW.id;

  IF v_signal_id IS NULL THEN
    -- Create new demand signal linked to this RFQ
    INSERT INTO demand_intelligence_signals (
      signal_source,
      signal_page_id,
      converted_to_rfq_id,
      category,
      subcategory,
      country,
      classification,
      decision_action,
      confidence_score,
      intent_score,
      estimated_value,
      product_description,
      lane_state,
      discovered_at,
      converted_at,
      created_at
    ) VALUES (
      'signal_page',
      NEW.signal_page_id,
      NEW.id,
      NEW.category,
      NEW.subcategory,
      COALESCE(NEW.delivery_location, 'India'),
      'buy',
      'admin_review',
      8.0,  -- High confidence for actual RFQ submission
      10,   -- Max intent for RFQ submission
      v_estimated_value,
      NEW.title,
      'pending_activation',
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    -- Update existing signal
    UPDATE demand_intelligence_signals
    SET 
      classification = 'buy',
      converted_to_rfq_id = NEW.id,
      converted_at = NOW(),
      lane_state = 'pending_activation',
      intent_score = GREATEST(COALESCE(intent_score, 0), 10),
      confidence_score = GREATEST(COALESCE(confidence_score, 0), 8.0),
      updated_at = NOW()
    WHERE id = v_signal_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists and recreate trigger
DROP TRIGGER IF EXISTS trg_create_demand_signal_on_rfq ON requirements;
CREATE TRIGGER trg_create_demand_signal_on_rfq
  AFTER INSERT ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION create_demand_signal_on_rfq();

-- D. UPDATE admin_signal_pages TO TRACK rfqs_submitted PROPERLY
-- Add trigger to increment rfqs_submitted when RFQ links to signal page
CREATE OR REPLACE FUNCTION public.update_signal_page_rfq_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.signal_page_id IS NOT NULL THEN
    UPDATE admin_signal_pages
    SET 
      rfqs_submitted = COALESCE(rfqs_submitted, 0) + 1,
      intent_score = COALESCE(intent_score, 0) + 5,
      updated_at = NOW()
    WHERE id = NEW.signal_page_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_signal_page_rfq_count ON requirements;
CREATE TRIGGER trg_update_signal_page_rfq_count
  AFTER INSERT ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_page_rfq_count();

-- E. ENSURE demand_intelligence_signals HAS proper indexes for heatmap queries
CREATE INDEX IF NOT EXISTS idx_dis_country_category ON demand_intelligence_signals(country, category);
CREATE INDEX IF NOT EXISTS idx_dis_lane_state ON demand_intelligence_signals(lane_state);
CREATE INDEX IF NOT EXISTS idx_dis_classification ON demand_intelligence_signals(classification);
CREATE INDEX IF NOT EXISTS idx_dis_signal_page_id ON demand_intelligence_signals(signal_page_id);
