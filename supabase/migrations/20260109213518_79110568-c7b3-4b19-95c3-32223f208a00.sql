-- GAP 1: Add sample_size column to market_price_indices
ALTER TABLE public.market_price_indices
ADD COLUMN IF NOT EXISTS sample_size INTEGER DEFAULT 0;

-- GAP 5 & Optional: Add columns to price_confidence_scores
ALTER TABLE public.price_confidence_scores
ADD COLUMN IF NOT EXISTS confidence_suppressed BOOLEAN DEFAULT false;

-- GAP 5: Create unique index for immutability per award
CREATE UNIQUE INDEX IF NOT EXISTS uq_price_confidence_unique
ON public.price_confidence_scores (requirement_id, COALESCE(bid_id, '00000000-0000-0000-0000-000000000000'));

-- Drop and recreate the function with all fixes
DROP FUNCTION IF EXISTS public.calculate_price_confidence(UUID, UUID, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION public.calculate_price_confidence(
  p_requirement_id UUID,
  p_bid_id UUID DEFAULT NULL,
  p_buyer_visible_price NUMERIC DEFAULT NULL,
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
  v_buyer_visible_price NUMERIC;
  v_price_position NUMERIC;
  v_market_stability NUMERIC;
  v_competition_score NUMERIC;
  v_price_spread_ratio NUMERIC;
  v_confidence_score INTEGER;
  v_confidence_label TEXT;
  v_buyer_message TEXT;
  v_price_behavior_note TEXT;
  v_logistics_note TEXT;
  v_margin_type TEXT;
  v_total_bids INTEGER;
  v_historical_variance NUMERIC;
  v_market_pressure NUMERIC;
  v_competition_message TEXT;
  v_confidence_suppressed BOOLEAN := false;
  v_sample_size INTEGER;
BEGIN
  -- Fetch requirement
  SELECT * INTO v_requirement
  FROM requirements
  WHERE id = p_requirement_id;

  IF v_requirement IS NULL THEN
    RETURN jsonb_build_object('error', 'Requirement not found');
  END IF;

  -- Determine buyer visible price
  IF p_buyer_visible_price IS NOT NULL THEN
    v_buyer_visible_price := p_buyer_visible_price;
  ELSIF p_bid_id IS NOT NULL THEN
    SELECT buyer_visible_price INTO v_buyer_visible_price
    FROM bids
    WHERE id = p_bid_id;
  ELSE
    SELECT buyer_visible_price INTO v_buyer_visible_price
    FROM bids
    WHERE requirement_id = p_requirement_id
      AND status IN ('accepted', 'completed')
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_buyer_visible_price IS NULL OR v_buyer_visible_price <= 0 THEN
    RETURN jsonb_build_object('error', 'No valid price found');
  END IF;

  -- Fetch or derive market data
  SELECT * INTO v_market
  FROM market_price_indices
  WHERE product_category = v_requirement.product_category
  ORDER BY last_updated DESC
  LIMIT 1;

  -- GAP 1: Count sample size from historical bids
  SELECT COUNT(*) INTO v_sample_size
  FROM bids b
  JOIN requirements r ON r.id = b.requirement_id
  WHERE r.product_category = v_requirement.product_category
    AND b.status IN ('accepted', 'completed');

  IF v_market IS NULL THEN
    -- Derive from bids if no market index exists
    SELECT 
      COALESCE(MIN(buyer_visible_price), v_buyer_visible_price * 0.9),
      COALESCE(MAX(buyer_visible_price), v_buyer_visible_price * 1.1),
      COALESCE(AVG(buyer_visible_price), v_buyer_visible_price),
      COALESCE(STDDEV(buyer_visible_price), 0),
      0.5, -- default demand
      0.5, -- default supply
      0.3  -- default volatility
    INTO 
      v_market.min_market_price,
      v_market.max_market_price,
      v_market.average_market_price,
      v_market.price_std_deviation,
      v_market.demand_index,
      v_market.supply_index,
      v_market.volatility_index
    FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE r.product_category = v_requirement.product_category
      AND b.status IN ('accepted', 'completed');
      
    -- GAP 1: Apply conservative defaults for low sample size
    IF v_sample_size < 5 THEN
      v_market.volatility_index := 0.6;
    END IF;
  ELSE
    -- Use stored sample size if available
    v_sample_size := COALESCE(v_market.sample_size, v_sample_size);
  END IF;

  -- GAP 1: Apply conservative market stability for low sample size
  IF v_sample_size < 5 THEN
    v_market_stability := 0.4;
  ELSE
    -- Step 2: Calculate market stability
    v_market_stability := 1 - COALESCE(v_market.volatility_index, 0.3);
  END IF;

  -- Step 1: Calculate relative price position
  IF v_market.max_market_price = v_market.min_market_price THEN
    v_price_position := 0.5;
  ELSE
    v_price_position := (v_buyer_visible_price - v_market.min_market_price) / 
                        NULLIF(v_market.max_market_price - v_market.min_market_price, 0);
    v_price_position := GREATEST(0, LEAST(1, v_price_position));
  END IF;

  -- Step 3: Calculate competition strength
  IF p_selection_mode = 'bidding' THEN
    SELECT COUNT(*) INTO v_total_bids
    FROM bids
    WHERE requirement_id = p_requirement_id;
    
    v_competition_score := LEAST(1, v_total_bids::NUMERIC / 5);
    v_historical_variance := NULL;
  ELSE
    -- Mode B: auto_assign
    v_total_bids := NULL;
    
    SELECT COALESCE(
      STDDEV(buyer_visible_price) / NULLIF(AVG(buyer_visible_price), 0),
      0.2
    ) INTO v_historical_variance
    FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE r.product_category = v_requirement.product_category
      AND b.status IN ('accepted', 'completed');
    
    v_competition_score := 1 - LEAST(1, COALESCE(v_historical_variance, 0.2));
  END IF;

  -- Step 4: Calculate price spread ratio
  v_price_spread_ratio := (v_market.max_market_price - v_market.min_market_price) / 
                          NULLIF(v_market.min_market_price, 0);
  v_price_spread_ratio := COALESCE(v_price_spread_ratio, 0);

  -- GAP 2: Calculate market pressure from demand/supply imbalance
  v_market_pressure := ABS(COALESCE(v_market.demand_index, 0.5) - COALESCE(v_market.supply_index, 0.5));

  -- Step 5: Calculate final confidence score with GAP 2 fix
  v_confidence_score := ROUND(
    (
      (1 - v_price_position) * 0.35 +
      v_market_stability * 0.3 +
      v_competition_score * 0.25 +
      (1 - v_market_pressure) * 0.1
    ) * 100
  );

  -- GAP 3: Cap MODE B confidence at 85
  IF p_selection_mode = 'auto_assign' THEN
    IF v_confidence_score > 85 THEN
      v_confidence_score := 85;
      v_confidence_suppressed := true;
    END IF;
  END IF;

  -- GAP 4: Hard floor for low market transparency
  IF COALESCE(v_market.volatility_index, 0.3) > 0.6 OR v_price_spread_ratio > 0.15 THEN
    IF v_confidence_score > 75 THEN
      v_confidence_score := 75;
      v_confidence_suppressed := true;
    END IF;
  END IF;

  -- Ensure score is within bounds
  v_confidence_score := GREATEST(0, LEAST(100, v_confidence_score));

  -- Classify confidence
  IF v_confidence_score >= 80 THEN
    v_confidence_label := 'HIGH';
    v_buyer_message := 'Price is highly competitive & market-aligned';
  ELSIF v_confidence_score >= 60 THEN
    v_confidence_label := 'MEDIUM';
    v_buyer_message := 'Price is fair under current market conditions';
  ELSE
    v_confidence_label := 'LOW';
    v_buyer_message := 'Price reflects current supply-demand constraints';
  END IF;

  -- GAP 4: Override label if suppressed due to market conditions
  IF v_confidence_suppressed AND v_confidence_label = 'HIGH' THEN
    v_confidence_label := 'MEDIUM';
    v_buyer_message := 'Price is fair under current market conditions';
  END IF;

  -- Optional Improvement 1: Competition message for buyer trust
  IF v_total_bids IS NOT NULL AND v_total_bids >= 5 THEN
    v_competition_message := 'Strong supplier competition observed';
  ELSIF p_selection_mode = 'auto_assign' THEN
    v_competition_message := 'Optimized from historical performance';
  ELSE
    v_competition_message := 'Market-driven pricing applied';
  END IF;

  -- Set notes
  v_price_behavior_note := 'Prices may vary due to market conditions.';
  v_logistics_note := 'Logistics charges are calculated separately.';

  -- Determine margin type
  IF v_requirement.trade_type = 'import_export' OR v_requirement.trade_type = 'export' THEN
    v_margin_type := 'import_export_2%';
  ELSE
    v_margin_type := 'domestic_0.5%';
  END IF;

  -- GAP 5: Store confidence score with upsert
  INSERT INTO price_confidence_scores (
    requirement_id,
    bid_id,
    buyer_visible_price,
    confidence_score,
    confidence_label,
    buyer_message,
    price_behavior_note,
    logistics_note,
    selection_mode,
    price_position,
    market_stability,
    competition_score,
    price_spread_ratio,
    margin_type,
    total_bids,
    historical_price_variance,
    confidence_suppressed
  ) VALUES (
    p_requirement_id,
    p_bid_id,
    v_buyer_visible_price,
    v_confidence_score,
    v_confidence_label,
    v_buyer_message,
    v_price_behavior_note,
    v_logistics_note,
    p_selection_mode,
    v_price_position,
    v_market_stability,
    v_competition_score,
    v_price_spread_ratio,
    v_margin_type,
    v_total_bids,
    v_historical_variance,
    v_confidence_suppressed
  )
  ON CONFLICT (requirement_id, COALESCE(bid_id, '00000000-0000-0000-0000-000000000000'))
  DO UPDATE SET
    buyer_visible_price = EXCLUDED.buyer_visible_price,
    confidence_score = EXCLUDED.confidence_score,
    confidence_label = EXCLUDED.confidence_label,
    buyer_message = EXCLUDED.buyer_message,
    price_behavior_note = EXCLUDED.price_behavior_note,
    logistics_note = EXCLUDED.logistics_note,
    selection_mode = EXCLUDED.selection_mode,
    price_position = EXCLUDED.price_position,
    market_stability = EXCLUDED.market_stability,
    competition_score = EXCLUDED.competition_score,
    price_spread_ratio = EXCLUDED.price_spread_ratio,
    margin_type = EXCLUDED.margin_type,
    total_bids = EXCLUDED.total_bids,
    historical_price_variance = EXCLUDED.historical_price_variance,
    confidence_suppressed = EXCLUDED.confidence_suppressed,
    created_at = now();

  -- Return buyer-facing response
  RETURN jsonb_build_object(
    'price_confidence_score', v_confidence_score,
    'confidence_label', v_confidence_label,
    'buyer_message', v_buyer_message,
    'competition_message', v_competition_message,
    'price_behavior_note', v_price_behavior_note,
    'logistics_note', v_logistics_note,
    'mode', p_selection_mode,
    'internal', jsonb_build_object(
      'price_position', ROUND(v_price_position::NUMERIC, 4),
      'market_stability', ROUND(v_market_stability::NUMERIC, 4),
      'competition_score', ROUND(v_competition_score::NUMERIC, 4),
      'price_spread_ratio', ROUND(v_price_spread_ratio::NUMERIC, 4),
      'market_pressure', ROUND(v_market_pressure::NUMERIC, 4),
      'margin_type', v_margin_type,
      'total_bids', v_total_bids,
      'historical_price_variance', ROUND(v_historical_variance::NUMERIC, 4),
      'sample_size', v_sample_size,
      'confidence_suppressed', v_confidence_suppressed
    )
  );
END;
$$;