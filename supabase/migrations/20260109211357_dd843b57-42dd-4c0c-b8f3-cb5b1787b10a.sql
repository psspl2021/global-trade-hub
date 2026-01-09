-- Create table for market price indices
CREATE TABLE public.market_price_indices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_category TEXT NOT NULL,
  min_market_price NUMERIC NOT NULL DEFAULT 0,
  max_market_price NUMERIC NOT NULL DEFAULT 0,
  average_market_price NUMERIC NOT NULL DEFAULT 0,
  price_std_deviation NUMERIC NOT NULL DEFAULT 0,
  demand_index NUMERIC NOT NULL DEFAULT 0.5 CHECK (demand_index >= 0 AND demand_index <= 1),
  supply_index NUMERIC NOT NULL DEFAULT 0.5 CHECK (supply_index >= 0 AND supply_index <= 1),
  volatility_index NUMERIC NOT NULL DEFAULT 0.3 CHECK (volatility_index >= 0 AND volatility_index <= 1),
  data_source TEXT DEFAULT 'historical',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_category)
);

-- Create table for price confidence scores
CREATE TABLE public.price_confidence_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL,
  buyer_visible_price NUMERIC NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  confidence_label TEXT NOT NULL CHECK (confidence_label IN ('HIGH', 'MEDIUM', 'LOW')),
  buyer_message TEXT NOT NULL,
  price_behavior_note TEXT DEFAULT 'Prices may vary due to market conditions.',
  logistics_note TEXT DEFAULT 'Logistics charges are calculated separately.',
  selection_mode TEXT NOT NULL CHECK (selection_mode IN ('bidding', 'auto_assign')),
  -- Internal explainability (admin only)
  price_position NUMERIC,
  market_stability NUMERIC,
  competition_score NUMERIC,
  price_spread_ratio NUMERIC,
  margin_type TEXT,
  total_bids INTEGER,
  historical_price_variance NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_price_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_confidence_scores ENABLE ROW LEVEL SECURITY;

-- Market indices: admins can manage, public can read
CREATE POLICY "Admins can manage market indices"
  ON public.market_price_indices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can read market indices"
  ON public.market_price_indices FOR SELECT
  USING (true);

-- Price confidence: buyers see their own, admins see all
CREATE POLICY "Buyers can view their requirement confidence scores"
  ON public.price_confidence_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.requirements
      WHERE id = requirement_id AND buyer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all confidence scores"
  ON public.price_confidence_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to calculate price confidence
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
  v_market RECORD;
  v_price_position NUMERIC;
  v_market_stability NUMERIC;
  v_competition_score NUMERIC;
  v_price_spread_ratio NUMERIC;
  v_confidence_score INTEGER;
  v_confidence_label TEXT;
  v_buyer_message TEXT;
  v_margin_type TEXT;
  v_total_bids INTEGER;
  v_historical_variance NUMERIC;
  v_final_price NUMERIC;
  v_result JSONB;
BEGIN
  -- Get requirement details
  SELECT r.*, r.product_category, r.trade_type
  INTO v_requirement
  FROM requirements r
  WHERE r.id = p_requirement_id;

  IF v_requirement IS NULL THEN
    RETURN jsonb_build_object('error', 'Requirement not found');
  END IF;

  -- Determine margin type
  IF v_requirement.trade_type IN ('import', 'export') THEN
    v_margin_type := 'import_export_2%';
  ELSE
    v_margin_type := 'domestic_0.5%';
  END IF;

  -- Get or create market indices for this category
  SELECT * INTO v_market
  FROM market_price_indices
  WHERE product_category = v_requirement.product_category;

  -- If no market data, create defaults from bids
  IF v_market IS NULL THEN
    INSERT INTO market_price_indices (
      product_category,
      min_market_price,
      max_market_price,
      average_market_price,
      price_std_deviation,
      demand_index,
      supply_index,
      volatility_index
    )
    SELECT
      v_requirement.product_category,
      COALESCE(MIN(b.buyer_visible_price), 0),
      COALESCE(MAX(b.buyer_visible_price), 0),
      COALESCE(AVG(b.buyer_visible_price), 0),
      COALESCE(STDDEV(b.buyer_visible_price), 0),
      0.5, -- default demand
      0.5, -- default supply
      0.3  -- default volatility
    FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE r.product_category = v_requirement.product_category
      AND b.status IN ('pending', 'accepted', 'completed')
    ON CONFLICT (product_category) DO UPDATE SET
      min_market_price = EXCLUDED.min_market_price,
      max_market_price = EXCLUDED.max_market_price,
      average_market_price = EXCLUDED.average_market_price,
      price_std_deviation = EXCLUDED.price_std_deviation,
      last_updated = now()
    RETURNING * INTO v_market;
  END IF;

  -- Determine final price
  IF p_buyer_visible_price IS NOT NULL THEN
    v_final_price := p_buyer_visible_price;
  ELSIF p_bid_id IS NOT NULL THEN
    SELECT buyer_visible_price INTO v_final_price
    FROM bids WHERE id = p_bid_id;
  ELSE
    -- Use average if no specific price
    v_final_price := COALESCE(v_market.average_market_price, 0);
  END IF;

  -- Get competition data
  IF p_selection_mode = 'bidding' THEN
    SELECT COUNT(*) INTO v_total_bids
    FROM bids
    WHERE requirement_id = p_requirement_id
      AND status IN ('pending', 'accepted');
    
    v_competition_score := LEAST(1, v_total_bids::NUMERIC / 5);
    v_historical_variance := NULL;
  ELSE
    -- Auto-assign mode: use historical variance
    SELECT COALESCE(STDDEV(b.buyer_visible_price) / NULLIF(AVG(b.buyer_visible_price), 0), 0)
    INTO v_historical_variance
    FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE r.product_category = v_requirement.product_category
      AND b.status IN ('accepted', 'completed');
    
    v_competition_score := 1 - COALESCE(v_historical_variance, 0);
    v_total_bids := NULL;
  END IF;

  -- Step 1: Price Position (0 = at min, 1 = at max)
  IF v_market.max_market_price > v_market.min_market_price THEN
    v_price_position := (v_final_price - v_market.min_market_price) / 
                        (v_market.max_market_price - v_market.min_market_price);
    v_price_position := GREATEST(0, LEAST(1, v_price_position));
  ELSE
    v_price_position := 0.5; -- No spread, neutral position
  END IF;

  -- Step 2: Market Stability
  v_market_stability := 1 - COALESCE(v_market.volatility_index, 0.3);

  -- Step 3: Price Spread Ratio
  IF v_market.min_market_price > 0 THEN
    v_price_spread_ratio := (v_market.max_market_price - v_market.min_market_price) / 
                            v_market.min_market_price;
  ELSE
    v_price_spread_ratio := 0;
  END IF;

  -- Step 4: Final Confidence Score
  v_confidence_score := ROUND(
    (
      (1 - v_price_position) * 0.4 +
      v_market_stability * 0.3 +
      v_competition_score * 0.3
    ) * 100
  )::INTEGER;
  v_confidence_score := GREATEST(0, LEAST(100, v_confidence_score));

  -- Step 5: Classification
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

  -- Store the confidence score
  INSERT INTO price_confidence_scores (
    requirement_id,
    bid_id,
    buyer_visible_price,
    confidence_score,
    confidence_label,
    buyer_message,
    selection_mode,
    price_position,
    market_stability,
    competition_score,
    price_spread_ratio,
    margin_type,
    total_bids,
    historical_price_variance
  ) VALUES (
    p_requirement_id,
    p_bid_id,
    v_final_price,
    v_confidence_score,
    v_confidence_label,
    v_buyer_message,
    p_selection_mode,
    v_price_position,
    v_market_stability,
    v_competition_score,
    v_price_spread_ratio,
    v_margin_type,
    v_total_bids,
    v_historical_variance
  );

  -- Build result
  v_result := jsonb_build_object(
    'price_confidence_score', v_confidence_score,
    'confidence_label', v_confidence_label,
    'buyer_message', v_buyer_message,
    'price_behavior_note', 'Prices may vary due to market conditions.',
    'logistics_note', 'Logistics charges are calculated separately.',
    'mode', p_selection_mode,
    -- Internal explainability (filter in application layer for non-admins)
    'internal', jsonb_build_object(
      'price_position', ROUND(v_price_position::NUMERIC, 3),
      'market_stability', ROUND(v_market_stability::NUMERIC, 3),
      'competition_score', ROUND(v_competition_score::NUMERIC, 3),
      'price_spread_ratio', ROUND(v_price_spread_ratio::NUMERIC, 3),
      'margin_type', v_margin_type,
      'total_bids', v_total_bids,
      'historical_price_variance', ROUND(v_historical_variance::NUMERIC, 3)
    )
  );

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_price_confidence TO authenticated;

-- Create indexes for performance
CREATE INDEX idx_market_price_indices_category ON public.market_price_indices(product_category);
CREATE INDEX idx_price_confidence_requirement ON public.price_confidence_scores(requirement_id);
CREATE INDEX idx_price_confidence_bid ON public.price_confidence_scores(bid_id);