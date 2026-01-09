
-- Add subtle demand/supply imbalance penalty for better AI explainability
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
  v_avg_price NUMERIC;
  v_price_position NUMERIC := 0;
  v_market_stability NUMERIC := 0;
  v_competition_score NUMERIC := 0;
  v_price_spread_ratio NUMERIC := 0;
  v_confidence_score NUMERIC := 0;
  v_confidence_label TEXT := 'LOW';
  v_buyer_message TEXT;
  v_competition_message TEXT;
  v_price_behavior_note TEXT;
  v_logistics_note TEXT;
  v_margin_type TEXT;
  v_total_bids INTEGER;
  v_historical_variance NUMERIC;
  v_sample_size INTEGER := 0;
  v_confidence_suppressed BOOLEAN := FALSE;
  v_normalized_mode TEXT;
  v_logistics_cost NUMERIC := 0;
  v_is_admin BOOLEAN := FALSE;
  v_market_avg_price NUMERIC := 0;
  v_market_min_price NUMERIC := 0;
  v_market_max_price NUMERIC := 0;
  v_market_volatility NUMERIC := 0.5;
  v_market_demand NUMERIC := 0.5;
  v_market_supply NUMERIC := 0.5;
  v_market_id UUID := NULL;
  v_market_pressure NUMERIC := 0;
BEGIN
  -- Normalize selection mode (prevent enum drift)
  v_normalized_mode := CASE 
    WHEN p_selection_mode = 'sealed_bidding' THEN 'bidding'
    WHEN p_selection_mode IN ('bidding', 'auto_assign') THEN p_selection_mode
    ELSE 'bidding'
  END;

  -- Fetch requirement details
  SELECT * INTO v_requirement
  FROM requirements
  WHERE id = p_requirement_id;

  IF v_requirement IS NULL THEN
    RETURN jsonb_build_object('error', 'Requirement not found');
  END IF;

  -- Fetch bid details if provided (includes logistics cost)
  IF p_bid_id IS NOT NULL THEN
    SELECT * INTO v_bid
    FROM bids
    WHERE id = p_bid_id AND requirement_id = p_requirement_id;
    
    IF v_bid IS NOT NULL THEN
      v_logistics_cost := COALESCE(v_bid.service_fee, 0);
    END IF;
  END IF;

  -- Fetch market index for category using explicit field access (safe pattern)
  SELECT 
    id,
    average_market_price,
    min_market_price,
    max_market_price,
    volatility_index,
    demand_index,
    supply_index
  INTO 
    v_market_id,
    v_market_avg_price,
    v_market_min_price,
    v_market_max_price,
    v_market_volatility,
    v_market_demand,
    v_market_supply
  FROM market_price_indices
  WHERE product_category = v_requirement.product_category
  ORDER BY last_updated DESC
  LIMIT 1;

  -- Calculate average price from recent bids in same category
  SELECT 
    AVG(buyer_visible_price),
    COUNT(*)
  INTO v_avg_price, v_sample_size
  FROM bids b
  JOIN requirements r ON b.requirement_id = r.id
  WHERE r.product_category = v_requirement.product_category
    AND b.created_at > NOW() - INTERVAL '90 days'
    AND b.status IN ('submitted', 'accepted', 'dispatched', 'delivered');

  -- Update market index sample_size if we have fresh data
  IF v_market_id IS NOT NULL AND v_sample_size > 0 THEN
    UPDATE market_price_indices
    SET sample_size = v_sample_size,
        last_updated = NOW()
    WHERE id = v_market_id;
  END IF;

  -- If no market data, use conservative defaults (safe explicit assignment)
  IF v_market_id IS NULL THEN
    v_market_avg_price := COALESCE(v_avg_price, 0);
    v_market_min_price := COALESCE(v_avg_price, 0);
    v_market_max_price := COALESCE(v_avg_price, 0);
    v_market_volatility := 0.5;
    v_market_demand := 0.5;
    v_market_supply := 0.5;
    v_confidence_suppressed := TRUE;
  END IF;

  -- Suppress confidence if sample size too small
  IF v_sample_size < 5 THEN
    v_confidence_suppressed := TRUE;
    v_market_volatility := 0.6;
  END IF;

  -- Calculate market pressure (demand/supply imbalance) for soft penalty
  v_market_pressure := ABS(COALESCE(v_market_demand, 0.5) - COALESCE(v_market_supply, 0.5));

  -- MODE A: Bidding mode with actual bid
  IF v_normalized_mode = 'bidding' AND v_bid IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total_bids
    FROM bids
    WHERE requirement_id = p_requirement_id
      AND status IN ('submitted', 'accepted');

    IF v_market_avg_price > 0 THEN
      v_price_position := 1 - ABS(v_bid.buyer_visible_price - v_market_avg_price) 
                          / v_market_avg_price;
      v_price_position := GREATEST(0, LEAST(1, v_price_position));
    END IF;

    v_market_stability := 1 - COALESCE(v_market_volatility, 0.5);

    v_competition_score := CASE
      WHEN v_total_bids >= 5 THEN 1.0
      WHEN v_total_bids >= 3 THEN 0.8
      WHEN v_total_bids >= 2 THEN 0.6
      ELSE 0.4
    END;

    IF v_market_max_price > v_market_min_price AND v_market_avg_price > 0 THEN
      v_price_spread_ratio := 1 - (v_market_max_price - v_market_min_price) 
                              / v_market_avg_price;
      v_price_spread_ratio := GREATEST(0, LEAST(1, v_price_spread_ratio));
    ELSE
      v_price_spread_ratio := 0.7;
    END IF;

    v_confidence_score := (
      v_price_position * 0.35 +
      v_market_stability * 0.25 +
      v_competition_score * 0.25 +
      v_price_spread_ratio * 0.15
    ) * 100;

    v_margin_type := 'competitive';
    v_competition_message := 'Competitive pricing from multiple verified suppliers';

  -- MODE B: Auto-assign mode (no bids yet)
  ELSE
    SELECT COALESCE(STDDEV(buyer_visible_price) / NULLIF(AVG(buyer_visible_price), 0), 0.3)
    INTO v_historical_variance
    FROM bids b
    JOIN requirements r ON b.requirement_id = r.id
    WHERE r.product_category = v_requirement.product_category
      AND b.created_at > NOW() - INTERVAL '180 days';

    v_historical_variance := COALESCE(v_historical_variance, 0.3);

    v_price_position := 0.7;
    v_market_stability := 1 - COALESCE(v_market_volatility, 0.5);
    v_competition_score := LEAST(0.7, 1 - v_historical_variance);
    v_price_spread_ratio := 0.6;

    v_confidence_score := (
      v_price_position * 0.30 +
      v_market_stability * 0.30 +
      v_competition_score * 0.20 +
      v_price_spread_ratio * 0.20
    ) * 100;

    v_margin_type := 'market_aligned';
    v_competition_message := 'Market-driven pricing applied';
    v_total_bids := NULL;
  END IF;

  -- Apply subtle demand/supply imbalance penalty (max 10% reduction)
  v_confidence_score := v_confidence_score * (1 - v_market_pressure * 0.1);

  -- Suppress artificially high confidence when data is sparse
  IF v_confidence_suppressed AND v_confidence_score > 65 THEN
    v_confidence_score := 65;
  END IF;

  -- Determine confidence label
  v_confidence_label := CASE
    WHEN v_confidence_score >= 75 THEN 'HIGH'
    WHEN v_confidence_score >= 50 THEN 'MEDIUM'
    ELSE 'LOW'
  END;

  -- Generate buyer-safe messaging with logistics clarity
  v_buyer_message := CASE v_confidence_label
    WHEN 'HIGH' THEN 'This price is well-aligned with current market conditions and verified supplier availability. Logistics costs, if applicable, are shown separately.'
    WHEN 'MEDIUM' THEN 'The price reflects current market dynamics. Prices may vary based on demand and availability. Logistics costs, if applicable, are shown separately.'
    ELSE 'Market conditions are variable. We recommend reviewing multiple options for best value. Logistics costs, if applicable, are shown separately.'
  END;

  -- Price behavior note
  v_price_behavior_note := CASE
    WHEN v_market_volatility > 0.7 THEN 'Prices in this category are currently volatile. Consider locking in pricing early.'
    WHEN v_market_demand > v_market_supply THEN 'High demand may affect pricing. Early procurement recommended.'
    ELSE 'Market conditions are stable. Standard pricing terms apply.'
  END;

  -- Logistics note based on actual logistics cost (PLATFORM RULES COMPLIANT)
  IF v_logistics_cost > 0 THEN
    v_logistics_note := 'Logistics charges are calculated separately for each enquiry and transparently included where applicable.';
  ELSE
    v_logistics_note := 'No logistics charges are applied for this enquiry.';
  END IF;

  -- Store confidence score using correct partial unique index targeting
  IF p_bid_id IS NOT NULL THEN
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
      margin_type,
      price_position,
      market_stability,
      competition_score,
      price_spread_ratio,
      total_bids,
      historical_price_variance,
      confidence_suppressed
    ) VALUES (
      p_requirement_id,
      p_bid_id,
      COALESCE(v_bid.buyer_visible_price, v_avg_price, v_market_avg_price, 1),
      v_confidence_score,
      v_confidence_label,
      v_buyer_message,
      v_price_behavior_note,
      v_logistics_note,
      v_normalized_mode,
      v_margin_type,
      v_price_position,
      v_market_stability,
      v_competition_score,
      v_price_spread_ratio,
      v_total_bids,
      v_historical_variance,
      v_confidence_suppressed
    )
    ON CONFLICT (requirement_id, bid_id) WHERE bid_id IS NOT NULL
    DO UPDATE SET
      buyer_visible_price = EXCLUDED.buyer_visible_price,
      confidence_score = EXCLUDED.confidence_score,
      confidence_label = EXCLUDED.confidence_label,
      buyer_message = EXCLUDED.buyer_message,
      price_behavior_note = EXCLUDED.price_behavior_note,
      logistics_note = EXCLUDED.logistics_note,
      selection_mode = EXCLUDED.selection_mode,
      margin_type = EXCLUDED.margin_type,
      price_position = EXCLUDED.price_position,
      market_stability = EXCLUDED.market_stability,
      competition_score = EXCLUDED.competition_score,
      price_spread_ratio = EXCLUDED.price_spread_ratio,
      total_bids = EXCLUDED.total_bids,
      historical_price_variance = EXCLUDED.historical_price_variance,
      confidence_suppressed = EXCLUDED.confidence_suppressed,
      created_at = NOW();
  ELSE
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
      margin_type,
      price_position,
      market_stability,
      competition_score,
      price_spread_ratio,
      total_bids,
      historical_price_variance,
      confidence_suppressed
    ) VALUES (
      p_requirement_id,
      NULL,
      COALESCE(p_buyer_visible_price, v_avg_price, v_market_avg_price, 1),
      v_confidence_score,
      v_confidence_label,
      v_buyer_message,
      v_price_behavior_note,
      v_logistics_note,
      v_normalized_mode,
      v_margin_type,
      v_price_position,
      v_market_stability,
      v_competition_score,
      v_price_spread_ratio,
      v_total_bids,
      v_historical_variance,
      v_confidence_suppressed
    )
    ON CONFLICT (requirement_id) WHERE bid_id IS NULL
    DO UPDATE SET
      buyer_visible_price = EXCLUDED.buyer_visible_price,
      confidence_score = EXCLUDED.confidence_score,
      confidence_label = EXCLUDED.confidence_label,
      buyer_message = EXCLUDED.buyer_message,
      price_behavior_note = EXCLUDED.price_behavior_note,
      logistics_note = EXCLUDED.logistics_note,
      selection_mode = EXCLUDED.selection_mode,
      margin_type = EXCLUDED.margin_type,
      price_position = EXCLUDED.price_position,
      market_stability = EXCLUDED.market_stability,
      competition_score = EXCLUDED.competition_score,
      price_spread_ratio = EXCLUDED.price_spread_ratio,
      total_bids = EXCLUDED.total_bids,
      historical_price_variance = EXCLUDED.historical_price_variance,
      confidence_suppressed = EXCLUDED.confidence_suppressed,
      created_at = NOW();
  END IF;

  -- Check if caller is admin for internal data access
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) INTO v_is_admin;

  -- Return buyer-safe response (internal metrics only for admins)
  IF v_is_admin THEN
    RETURN jsonb_build_object(
      'price_confidence_score', ROUND(v_confidence_score, 2),
      'confidence_label', v_confidence_label,
      'buyer_message', v_buyer_message,
      'competition_message', v_competition_message,
      'price_behavior_note', v_price_behavior_note,
      'logistics_note', v_logistics_note,
      'mode', v_normalized_mode,
      'confidence_suppressed', v_confidence_suppressed,
      'internal', jsonb_build_object(
        'price_position', ROUND(v_price_position, 4),
        'market_stability', ROUND(v_market_stability, 4),
        'competition_score', ROUND(v_competition_score, 4),
        'price_spread_ratio', ROUND(v_price_spread_ratio, 4),
        'market_pressure', ROUND(v_market_pressure, 4),
        'margin_type', v_margin_type,
        'total_bids', v_total_bids,
        'historical_price_variance', ROUND(v_historical_variance, 4),
        'sample_size', v_sample_size,
        'logistics_cost', v_logistics_cost
      )
    );
  ELSE
    RETURN jsonb_build_object(
      'price_confidence_score', ROUND(v_confidence_score, 2),
      'confidence_label', v_confidence_label,
      'buyer_message', v_buyer_message,
      'competition_message', v_competition_message,
      'price_behavior_note', v_price_behavior_note,
      'logistics_note', v_logistics_note,
      'mode', v_normalized_mode,
      'confidence_suppressed', v_confidence_suppressed
    );
  END IF;
END;
$$;
