-- Fix all 3 critical issues in calculate_price_confidence
CREATE OR REPLACE FUNCTION public.calculate_price_confidence(
  p_requirement_id UUID,
  p_bid_id UUID DEFAULT NULL,
  p_selection_mode TEXT DEFAULT 'bidding'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requirement RECORD;
  v_bid RECORD;
  v_market RECORD;
  v_price_position NUMERIC;
  v_market_stability NUMERIC;
  v_competition_score NUMERIC;
  v_confidence_score INTEGER;
  v_confidence_label TEXT;
  v_buyer_message TEXT;
  v_competition_message TEXT;
  v_internal JSONB;
  v_total_bids INTEGER;
  v_min_price NUMERIC;
  v_max_price NUMERIC;
  v_avg_price NUMERIC;
  v_price_spread_ratio NUMERIC;
  v_historical_variance NUMERIC;
  v_sample_size INTEGER;
  v_market_pressure NUMERIC;
  v_is_admin BOOLEAN;
  v_confidence_suppressed BOOLEAN;
  v_buyer_visible_price_final NUMERIC;
  v_selection_mode_normalized TEXT;
BEGIN
  -- CRITICAL FIX 3: Normalize selection_mode to match existing system
  v_selection_mode_normalized := CASE 
    WHEN p_selection_mode IN ('sealed_bidding', 'bidding') THEN 'bidding'
    ELSE p_selection_mode
  END;

  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  -- Get requirement details
  SELECT * INTO v_requirement
  FROM requirements
  WHERE id = p_requirement_id;

  IF v_requirement IS NULL THEN
    RETURN jsonb_build_object('error', 'Requirement not found');
  END IF;

  -- Get bid details if provided
  IF p_bid_id IS NOT NULL THEN
    SELECT * INTO v_bid
    FROM bids
    WHERE id = p_bid_id AND requirement_id = p_requirement_id;
    
    IF v_bid IS NULL THEN
      RETURN jsonb_build_object('error', 'Bid not found');
    END IF;
  END IF;

  -- Get or create market price index for this category
  SELECT * INTO v_market
  FROM market_price_indices
  WHERE product_category = v_requirement.product_category;

  -- If no market index exists, derive from historical data
  IF v_market IS NULL THEN
    -- Calculate from historical bids in this category
    SELECT 
      COUNT(*),
      COALESCE(AVG(b.buyer_visible_price), 0),
      COALESCE(MIN(b.buyer_visible_price), 0),
      COALESCE(MAX(b.buyer_visible_price), 0),
      COALESCE(STDDEV(b.buyer_visible_price), 0)
    INTO v_sample_size, v_avg_price, v_min_price, v_max_price, v_historical_variance
    FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE r.product_category = v_requirement.product_category
      AND b.status IN ('accepted', 'completed');

    -- Create market index with sample size
    INSERT INTO market_price_indices (
      product_category,
      average_market_price,
      min_market_price,
      max_market_price,
      price_std_deviation,
      volatility_index,
      demand_index,
      supply_index,
      sample_size
    ) VALUES (
      v_requirement.product_category,
      GREATEST(v_avg_price, 1),
      GREATEST(v_min_price, 1),
      GREATEST(v_max_price, 1),
      COALESCE(v_historical_variance, 0),
      0.5,
      0.5,
      0.5,
      v_sample_size
    )
    ON CONFLICT (product_category) DO UPDATE SET
      average_market_price = EXCLUDED.average_market_price,
      min_market_price = EXCLUDED.min_market_price,
      max_market_price = EXCLUDED.max_market_price,
      price_std_deviation = EXCLUDED.price_std_deviation,
      sample_size = EXCLUDED.sample_size,
      last_updated = now()
    RETURNING * INTO v_market;
  ELSE
    -- Count current sample size for existing market index
    SELECT COUNT(*)
    INTO v_sample_size
    FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE r.product_category = v_requirement.product_category
      AND b.status IN ('accepted', 'completed');
    
    -- Update sample_size in market_price_indices
    UPDATE market_price_indices
    SET sample_size = v_sample_size,
        last_updated = now()
    WHERE product_category = v_requirement.product_category;
  END IF;

  -- Apply minimum sample protection (GAP 1 fix) - runtime only, not stored
  IF v_sample_size < 5 THEN
    v_market.volatility_index := 0.6;
  END IF;

  -- Get all bids for this requirement
  SELECT 
    COUNT(*),
    MIN(buyer_visible_price),
    MAX(buyer_visible_price),
    AVG(buyer_visible_price)
  INTO v_total_bids, v_min_price, v_max_price, v_avg_price
  FROM bids
  WHERE requirement_id = p_requirement_id
    AND status NOT IN ('rejected', 'cancelled');

  -- Calculate price spread ratio
  IF v_max_price > 0 AND v_min_price > 0 THEN
    v_price_spread_ratio := (v_max_price - v_min_price) / v_max_price;
  ELSE
    v_price_spread_ratio := 0;
  END IF;

  -- Calculate market pressure from demand/supply
  v_market_pressure := ABS(COALESCE(v_market.demand_index, 0.5) - COALESCE(v_market.supply_index, 0.5));

  -- MODE A: Bidding (L1 Selection)
  IF v_selection_mode_normalized = 'bidding' THEN
    -- Price position: where does this bid sit relative to all bids
    IF p_bid_id IS NOT NULL AND v_max_price > v_min_price THEN
      v_price_position := (v_bid.buyer_visible_price - v_min_price) / (v_max_price - v_min_price);
    ELSE
      v_price_position := 0.5;
    END IF;

    -- Market stability from volatility index
    v_market_stability := 1 - COALESCE(v_market.volatility_index, 0.5);

    -- Competition score based on bid count
    v_competition_score := LEAST(v_total_bids / 5.0, 1.0);

  -- MODE B: Auto-Assign (Historical Performance)
  ELSE
    -- Historical variance analysis
    SELECT COALESCE(STDDEV(buyer_visible_price) / NULLIF(AVG(buyer_visible_price), 0), 0.5)
    INTO v_historical_variance
    FROM bids
    WHERE status IN ('accepted', 'completed');

    v_price_position := 0.3; -- Trusted supplier baseline
    v_market_stability := 1 - COALESCE(v_market.volatility_index, 0.5);
    -- MEDIUM FIX: Cap MODE B competition score at 0.7 (no real competition)
    v_competition_score := LEAST(0.7, 1 - COALESCE(v_historical_variance, 0.5));
  END IF;

  -- Calculate final confidence score with market pressure
  v_confidence_score := ROUND(
    (
      (1 - v_price_position) * 0.35 +
      v_market_stability * 0.3 +
      v_competition_score * 0.25 +
      (1 - v_market_pressure) * 0.1
    ) * 100
  );

  -- Initialize suppressed flag
  v_confidence_suppressed := false;

  -- GAP 3: Cap MODE B confidence at 85
  IF v_selection_mode_normalized = 'auto_assign' AND v_confidence_score > 85 THEN
    v_confidence_score := 85;
    v_confidence_suppressed := true;
  END IF;

  -- GAP 4: Hard floor for low market transparency
  IF (COALESCE(v_market.volatility_index, 0.5) > 0.6 OR v_price_spread_ratio > 0.15) AND v_confidence_score > 75 THEN
    v_confidence_score := 75;
    v_confidence_suppressed := true;
  END IF;

  -- Clamp score between 0 and 100
  v_confidence_score := GREATEST(LEAST(v_confidence_score, 100), 0);

  -- Determine confidence label
  IF v_confidence_score >= 80 THEN
    v_confidence_label := 'HIGH';
    v_buyer_message := 'This price reflects strong market alignment with verified supplier competition.';
  ELSIF v_confidence_score >= 60 THEN
    v_confidence_label := 'MEDIUM';
    v_buyer_message := 'This price is market-competitive based on current supplier availability.';
  ELSE
    v_confidence_label := 'LOW';
    v_buyer_message := 'Market conditions show price variation. Our team ensures best available terms.';
  END IF;

  -- Competition message for UI
  IF v_total_bids >= 5 THEN
    v_competition_message := 'Strong supplier competition observed';
  ELSIF v_selection_mode_normalized = 'auto_assign' THEN
    v_competition_message := 'Optimized from historical performance';
  ELSE
    v_competition_message := 'Market-driven pricing applied';
  END IF;

  -- Add logistics note to buyer message
  v_buyer_message := v_buyer_message || ' Logistics costs are calculated separately based on delivery requirements.';

  -- CRITICAL FIX 2: Never store 0 for buyer_visible_price
  v_buyer_visible_price_final := COALESCE(
    v_bid.buyer_visible_price,
    v_avg_price,
    v_market.average_market_price,
    1  -- absolute fallback to prevent 0
  );

  -- Build internal payload (admin-only gate)
  IF v_is_admin THEN
    v_internal := jsonb_build_object(
      'price_position', v_price_position,
      'market_stability', v_market_stability,
      'competition_score', v_competition_score,
      'market_pressure', v_market_pressure,
      'total_bids', v_total_bids,
      'price_spread_ratio', v_price_spread_ratio,
      'historical_price_variance', v_historical_variance,
      'sample_size', v_sample_size,
      'volatility_index', v_market.volatility_index,
      'demand_index', v_market.demand_index,
      'supply_index', v_market.supply_index,
      'mode_cap_applied', (v_selection_mode_normalized = 'auto_assign' AND v_confidence_suppressed),
      'transparency_cap_applied', (COALESCE(v_market.volatility_index, 0.5) > 0.6 OR v_price_spread_ratio > 0.15)
    );
  ELSE
    v_internal := NULL;
  END IF;

  -- CRITICAL FIX 1: Split upsert for partial unique indexes
  IF p_bid_id IS NOT NULL THEN
    -- Upsert with bid_id (uses uq_price_confidence_with_bid)
    INSERT INTO price_confidence_scores (
      requirement_id,
      bid_id,
      confidence_score,
      confidence_label,
      buyer_message,
      buyer_visible_price,
      selection_mode,
      price_position,
      market_stability,
      competition_score,
      total_bids,
      price_spread_ratio,
      historical_price_variance,
      logistics_note,
      competition_message,
      confidence_suppressed
    ) VALUES (
      p_requirement_id,
      p_bid_id,
      v_confidence_score,
      v_confidence_label,
      v_buyer_message,
      v_buyer_visible_price_final,
      v_selection_mode_normalized,
      v_price_position,
      v_market_stability,
      v_competition_score,
      v_total_bids,
      v_price_spread_ratio,
      v_historical_variance,
      'Logistics costs calculated separately',
      v_competition_message,
      v_confidence_suppressed
    )
    ON CONFLICT (requirement_id, bid_id) WHERE bid_id IS NOT NULL
    DO UPDATE SET
      confidence_score = EXCLUDED.confidence_score,
      confidence_label = EXCLUDED.confidence_label,
      buyer_message = EXCLUDED.buyer_message,
      buyer_visible_price = EXCLUDED.buyer_visible_price,
      selection_mode = EXCLUDED.selection_mode,
      price_position = EXCLUDED.price_position,
      market_stability = EXCLUDED.market_stability,
      competition_score = EXCLUDED.competition_score,
      total_bids = EXCLUDED.total_bids,
      price_spread_ratio = EXCLUDED.price_spread_ratio,
      historical_price_variance = EXCLUDED.historical_price_variance,
      competition_message = EXCLUDED.competition_message,
      confidence_suppressed = EXCLUDED.confidence_suppressed,
      created_at = now();
  ELSE
    -- Upsert without bid_id (uses uq_price_confidence_without_bid)
    INSERT INTO price_confidence_scores (
      requirement_id,
      bid_id,
      confidence_score,
      confidence_label,
      buyer_message,
      buyer_visible_price,
      selection_mode,
      price_position,
      market_stability,
      competition_score,
      total_bids,
      price_spread_ratio,
      historical_price_variance,
      logistics_note,
      competition_message,
      confidence_suppressed
    ) VALUES (
      p_requirement_id,
      NULL,
      v_confidence_score,
      v_confidence_label,
      v_buyer_message,
      v_buyer_visible_price_final,
      v_selection_mode_normalized,
      v_price_position,
      v_market_stability,
      v_competition_score,
      v_total_bids,
      v_price_spread_ratio,
      v_historical_variance,
      'Logistics costs calculated separately',
      v_competition_message,
      v_confidence_suppressed
    )
    ON CONFLICT (requirement_id) WHERE bid_id IS NULL
    DO UPDATE SET
      confidence_score = EXCLUDED.confidence_score,
      confidence_label = EXCLUDED.confidence_label,
      buyer_message = EXCLUDED.buyer_message,
      buyer_visible_price = EXCLUDED.buyer_visible_price,
      selection_mode = EXCLUDED.selection_mode,
      price_position = EXCLUDED.price_position,
      market_stability = EXCLUDED.market_stability,
      competition_score = EXCLUDED.competition_score,
      total_bids = EXCLUDED.total_bids,
      price_spread_ratio = EXCLUDED.price_spread_ratio,
      historical_price_variance = EXCLUDED.historical_price_variance,
      competition_message = EXCLUDED.competition_message,
      confidence_suppressed = EXCLUDED.confidence_suppressed,
      created_at = now();
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'confidence_score', v_confidence_score,
    'confidence_label', v_confidence_label,
    'buyer_message', v_buyer_message,
    'competition_message', v_competition_message,
    'confidence_suppressed', v_confidence_suppressed,
    'internal', v_internal
  );
END;
$$;