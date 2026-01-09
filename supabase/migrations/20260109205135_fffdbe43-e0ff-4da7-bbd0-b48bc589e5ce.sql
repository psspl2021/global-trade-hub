
-- ============================================
-- FIX 1: Create dedicated procurement_engine role
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'procurement_engine') THEN
    CREATE ROLE procurement_engine NOLOGIN;
  END IF;
END $$;

-- Revoke from authenticated (was too broad)
REVOKE EXECUTE ON FUNCTION public.select_supplier_with_bidding(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_supplier(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_delivery_success_rate(UUID) FROM authenticated;

-- Grant to service_role (backend/edge functions use this)
GRANT EXECUTE ON FUNCTION public.select_supplier_with_bidding(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_assign_supplier(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_delivery_success_rate(UUID) TO service_role;

-- Grant to procurement_engine role
GRANT EXECUTE ON FUNCTION public.select_supplier_with_bidding(UUID) TO procurement_engine;
GRANT EXECUTE ON FUNCTION public.auto_assign_supplier(UUID) TO procurement_engine;
GRANT EXECUTE ON FUNCTION public.get_delivery_success_rate(UUID) TO procurement_engine;

-- ============================================
-- FIX 2 & 3: Update select_supplier_with_bidding with row locking + exception handling
-- ============================================
CREATE OR REPLACE FUNCTION public.select_supplier_with_bidding(p_requirement_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_requirement RECORD;
  v_selected_bid RECORD;
  v_runner_ups JSONB := '[]'::JSONB;
  v_all_bids RECORD;
  v_cost_weight NUMERIC := 0.4;
  v_delivery_weight NUMERIC := 0.35;
  v_quality_weight NUMERIC := 0.25;
  v_config RECORD;
  v_max_cost NUMERIC;
  v_min_cost NUMERIC;
  v_bid_accepted BOOLEAN := FALSE;
BEGIN
  -- FIX 2: Lock requirement row FIRST to prevent race conditions
  SELECT * INTO v_requirement
  FROM public.requirements
  WHERE id = p_requirement_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Requirement not found'
    );
  END IF;
  
  -- Check if already awarded (after lock acquired)
  IF v_requirement.status = 'awarded' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Requirement already awarded'
    );
  END IF;
  
  -- Load configurable weights
  SELECT config_value INTO v_config
  FROM public.procurement_config
  WHERE config_key = 'scoring_weights'
  LIMIT 1;
  
  IF FOUND AND v_config.config_value IS NOT NULL THEN
    v_cost_weight := COALESCE((v_config.config_value->>'cost_weight')::NUMERIC, 0.4);
    v_delivery_weight := COALESCE((v_config.config_value->>'delivery_weight')::NUMERIC, 0.35);
    v_quality_weight := COALESCE((v_config.config_value->>'quality_weight')::NUMERIC, 0.25);
  END IF;
  
  -- Get cost range for relative scoring
  SELECT MIN(b.buyer_visible_price), MAX(b.buyer_visible_price)
  INTO v_min_cost, v_max_cost
  FROM public.bids b
  WHERE b.requirement_id = p_requirement_id
    AND b.status = 'pending';
  
  -- Select best bid with capacity check (FIX from previous migration)
  FOR v_all_bids IN
    SELECT 
      b.id as bid_id,
      b.supplier_id,
      b.buyer_visible_price,
      b.delivery_timeline_days,
      COALESCE(sp.successful_deliveries::NUMERIC / NULLIF(sp.total_orders, 0), 0.85) as delivery_rate,
      COALESCE(sp.quality_risk_score, 0.1) as quality_risk,
      COALESCE(sp.l1_wins, 0) as l1_wins,
      COALESCE(sp.daily_capacity, 10) as daily_capacity,
      COALESCE(sp.current_load, 0) as current_load,
      -- Relative cost score (lower is better)
      CASE 
        WHEN v_max_cost = v_min_cost THEN 0.5
        ELSE 1.0 - ((b.buyer_visible_price - v_min_cost) / NULLIF(v_max_cost - v_min_cost, 1))
      END as cost_score,
      -- Delivery score (higher rate = better)
      COALESCE(sp.successful_deliveries::NUMERIC / NULLIF(sp.total_orders, 0), 0.85) as delivery_score,
      -- Quality score (lower risk = better)
      1.0 - COALESCE(sp.quality_risk_score, 0.1) as quality_score,
      -- L1 influence capped at 5%
      LEAST(0.05, COALESCE(sp.l1_wins, 0) * 0.01) as l1_bonus
    FROM public.bids b
    LEFT JOIN public.supplier_performance sp ON sp.supplier_id = b.supplier_id
    WHERE b.requirement_id = p_requirement_id
      AND b.status = 'pending'
      -- Capacity check for MODE A
      AND (sp.current_load IS NULL OR sp.current_load < COALESCE(sp.daily_capacity, 10))
    ORDER BY (
      (CASE 
        WHEN v_max_cost = v_min_cost THEN 0.5
        ELSE 1.0 - ((b.buyer_visible_price - v_min_cost) / NULLIF(v_max_cost - v_min_cost, 1))
      END) * v_cost_weight +
      COALESCE(sp.successful_deliveries::NUMERIC / NULLIF(sp.total_orders, 0), 0.85) * v_delivery_weight +
      (1.0 - COALESCE(sp.quality_risk_score, 0.1)) * v_quality_weight +
      LEAST(0.05, COALESCE(sp.l1_wins, 0) * 0.01)
    ) DESC
  LOOP
    IF v_selected_bid IS NULL THEN
      v_selected_bid := v_all_bids;
    ELSE
      -- Add to runner-ups with reasoning
      v_runner_ups := v_runner_ups || jsonb_build_object(
        'supplier_id', v_all_bids.supplier_id,
        'bid_id', v_all_bids.bid_id,
        'price', v_all_bids.buyer_visible_price,
        'composite_score', (v_all_bids.cost_score * v_cost_weight + v_all_bids.delivery_score * v_delivery_weight + v_all_bids.quality_score * v_quality_weight + v_all_bids.l1_bonus),
        'reason', 'Lower composite score than selected supplier'
      );
    END IF;
  END LOOP;
  
  IF v_selected_bid IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No eligible bids found (check capacity limits)'
    );
  END IF;
  
  -- FIX 3: Wrap bid acceptance in exception block for retry safety
  BEGIN
    UPDATE public.bids 
    SET status = 'accepted'
    WHERE id = v_selected_bid.bid_id
      AND status = 'pending';
    
    IF FOUND THEN
      v_bid_accepted := TRUE;
    END IF;
  EXCEPTION WHEN unique_violation THEN
    -- Another process already accepted a bid for this requirement
    RETURN json_build_object(
      'success', false,
      'error', 'Requirement already has an accepted bid (concurrent award)'
    );
  END;
  
  IF NOT v_bid_accepted THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bid status changed during processing'
    );
  END IF;
  
  -- Update requirement status
  UPDATE public.requirements
  SET status = 'awarded', updated_at = NOW()
  WHERE id = p_requirement_id;
  
  -- Atomic load increment with row lock
  UPDATE public.supplier_performance
  SET current_load = current_load + 1, updated_at = NOW()
  WHERE supplier_id = v_selected_bid.supplier_id;
  
  -- Increment L1 wins
  UPDATE public.supplier_performance
  SET l1_wins = COALESCE(l1_wins, 0) + 1
  WHERE supplier_id = v_selected_bid.supplier_id;
  
  RETURN json_build_object(
    'success', true,
    'selected_supplier_id', v_selected_bid.supplier_id,
    'selected_bid_id', v_selected_bid.bid_id,
    'final_price', v_selected_bid.buyer_visible_price,
    'composite_score', (v_selected_bid.cost_score * v_cost_weight + v_selected_bid.delivery_score * v_delivery_weight + v_selected_bid.quality_score * v_quality_weight + v_selected_bid.l1_bonus),
    'runner_ups', v_runner_ups,
    'mode', 'bidding'
  );
END;
$function$;

-- ============================================
-- FIX 2 & 3: Update auto_assign_supplier with row locking + exception handling
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_assign_supplier(p_requirement_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_requirement RECORD;
  v_selected_supplier RECORD;
  v_runner_ups JSONB := '[]'::JSONB;
  v_all_suppliers RECORD;
  v_cost_weight NUMERIC := 0.4;
  v_delivery_weight NUMERIC := 0.35;
  v_quality_weight NUMERIC := 0.25;
  v_config RECORD;
  v_inventory_ttl_hours INT := 24;
  v_new_bid_id UUID;
  v_markup_result RECORD;
  v_bid_created BOOLEAN := FALSE;
BEGIN
  -- FIX 2: Lock requirement row FIRST
  SELECT * INTO v_requirement
  FROM public.requirements
  WHERE id = p_requirement_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Requirement not found'
    );
  END IF;
  
  -- Check if already awarded
  IF v_requirement.status = 'awarded' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Requirement already awarded'
    );
  END IF;
  
  -- Validate MODE B eligibility
  IF v_requirement.selection_mode != 'auto' AND COALESCE(v_requirement.fast_track, false) = false THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Requirement not eligible for auto-assignment (requires selection_mode=auto or fast_track=true)'
    );
  END IF;
  
  -- Load configurable parameters
  SELECT config_value INTO v_config
  FROM public.procurement_config
  WHERE config_key = 'scoring_weights'
  LIMIT 1;
  
  IF FOUND AND v_config.config_value IS NOT NULL THEN
    v_cost_weight := COALESCE((v_config.config_value->>'cost_weight')::NUMERIC, 0.4);
    v_delivery_weight := COALESCE((v_config.config_value->>'delivery_weight')::NUMERIC, 0.35);
    v_quality_weight := COALESCE((v_config.config_value->>'quality_weight')::NUMERIC, 0.25);
  END IF;
  
  SELECT config_value->>'inventory_ttl_hours' INTO v_inventory_ttl_hours
  FROM public.procurement_config
  WHERE config_key = 'inventory_freshness'
  LIMIT 1;
  
  v_inventory_ttl_hours := COALESCE(v_inventory_ttl_hours, 24);
  
  -- Select best supplier based on historical performance + fresh inventory
  FOR v_all_suppliers IN
    SELECT 
      sp.supplier_id,
      p.company_name,
      COALESCE(sp.successful_deliveries::NUMERIC / NULLIF(sp.total_orders, 0), 0.85) as delivery_rate,
      COALESCE(sp.quality_risk_score, 0.1) as quality_risk,
      COALESCE(sp.avg_price_competitiveness, 0.5) as price_score,
      COALESCE(sp.l1_wins, 0) as l1_wins,
      COALESCE(sp.daily_capacity, 10) as daily_capacity,
      COALESCE(sp.current_load, 0) as current_load,
      si.quantity as available_stock,
      prod.price_range_min,
      prod.price_range_max
    FROM public.supplier_performance sp
    JOIN public.profiles p ON p.id = sp.supplier_id
    JOIN public.products prod ON prod.supplier_id = sp.supplier_id
    JOIN public.stock_inventory si ON si.product_id = prod.id
    WHERE prod.category = v_requirement.product_category
      AND prod.is_active = true
      AND si.quantity >= v_requirement.quantity
      AND si.last_updated > NOW() - (v_inventory_ttl_hours || ' hours')::INTERVAL
      -- Capacity check
      AND sp.current_load < COALESCE(sp.daily_capacity, 10)
    ORDER BY (
      COALESCE(sp.avg_price_competitiveness, 0.5) * v_cost_weight +
      COALESCE(sp.successful_deliveries::NUMERIC / NULLIF(sp.total_orders, 0), 0.85) * v_delivery_weight +
      (1.0 - COALESCE(sp.quality_risk_score, 0.1)) * v_quality_weight +
      LEAST(0.05, COALESCE(sp.l1_wins, 0) * 0.01)
    ) DESC
    LIMIT 10
  LOOP
    IF v_selected_supplier IS NULL THEN
      v_selected_supplier := v_all_suppliers;
    ELSE
      v_runner_ups := v_runner_ups || jsonb_build_object(
        'supplier_id', v_all_suppliers.supplier_id,
        'company_name', v_all_suppliers.company_name,
        'delivery_rate', v_all_suppliers.delivery_rate,
        'reason', 'Lower composite score'
      );
    END IF;
  END LOOP;
  
  IF v_selected_supplier IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No eligible suppliers found with fresh inventory and available capacity',
      'fallback_to_bidding', true
    );
  END IF;
  
  -- Calculate markup
  SELECT * INTO v_markup_result
  FROM public.calculate_bid_markup(
    'india',
    COALESCE(v_requirement.delivery_location, 'india'),
    'india',
    COALESCE(v_selected_supplier.price_range_min, 0) * v_requirement.quantity
  );
  
  -- FIX 3: Create bid with exception handling
  BEGIN
    INSERT INTO public.bids (
      requirement_id,
      supplier_id,
      bid_amount,
      supplier_net_price,
      buyer_visible_price,
      markup_percentage,
      markup_amount,
      transaction_type,
      delivery_timeline_days,
      service_fee,
      total_amount,
      status
    ) VALUES (
      p_requirement_id,
      v_selected_supplier.supplier_id,
      COALESCE(v_selected_supplier.price_range_min, 0) * v_requirement.quantity,
      COALESCE(v_selected_supplier.price_range_min, 0) * v_requirement.quantity,
      v_markup_result.buyer_visible_price,
      v_markup_result.markup_percentage,
      v_markup_result.markup_amount,
      v_markup_result.transaction_type,
      7,
      0,
      v_markup_result.buyer_visible_price,
      'accepted'
    )
    RETURNING id INTO v_new_bid_id;
    
    v_bid_created := TRUE;
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Requirement already has an accepted bid (concurrent assignment)'
    );
  END;
  
  IF NOT v_bid_created THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to create bid'
    );
  END IF;
  
  -- Update requirement status
  UPDATE public.requirements
  SET status = 'awarded', updated_at = NOW()
  WHERE id = p_requirement_id;
  
  -- Atomic load increment
  UPDATE public.supplier_performance
  SET current_load = current_load + 1, updated_at = NOW()
  WHERE supplier_id = v_selected_supplier.supplier_id;
  
  RETURN json_build_object(
    'success', true,
    'selected_supplier_id', v_selected_supplier.supplier_id,
    'bid_id', v_new_bid_id,
    'final_price', v_markup_result.buyer_visible_price,
    'runner_ups', v_runner_ups,
    'mode', 'auto_assign'
  );
END;
$function$;

-- Re-apply permissions after function replacement
REVOKE EXECUTE ON FUNCTION public.select_supplier_with_bidding(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_assign_supplier(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.select_supplier_with_bidding(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_assign_supplier(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.select_supplier_with_bidding(UUID) TO procurement_engine;
GRANT EXECUTE ON FUNCTION public.auto_assign_supplier(UUID) TO procurement_engine;
