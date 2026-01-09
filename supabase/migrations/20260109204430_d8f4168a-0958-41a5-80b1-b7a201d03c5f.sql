-- 1. CRITICAL: Race condition fix - only one accepted bid per requirement
CREATE UNIQUE INDEX IF NOT EXISTS one_accepted_bid_per_requirement
ON public.bids(requirement_id)
WHERE status = 'accepted';

-- 2. CRITICAL: Add missing composite_score column
ALTER TABLE public.supplier_selection_log
ADD COLUMN IF NOT EXISTS composite_score NUMERIC(6,4);

-- 3. Add supplier capacity columns for overload prevention
ALTER TABLE public.supplier_performance
ADD COLUMN IF NOT EXISTS daily_capacity INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS current_load INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS load_reset_date DATE DEFAULT CURRENT_DATE;

-- 4. Create function to reset daily load
CREATE OR REPLACE FUNCTION reset_supplier_daily_load()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.load_reset_date < CURRENT_DATE THEN
    NEW.current_load := 0;
    NEW.load_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_reset_daily_load ON public.supplier_performance;
CREATE TRIGGER trigger_reset_daily_load
  BEFORE UPDATE ON public.supplier_performance
  FOR EACH ROW
  EXECUTE FUNCTION reset_supplier_daily_load();

-- 5. Update MODE A function with row locking and improved cost scoring
CREATE OR REPLACE FUNCTION select_supplier_with_bidding(p_requirement_id UUID)
RETURNS JSON AS $$
DECLARE
  v_selected_bid RECORD;
  v_selection_log_id UUID;
  v_delivery_rate NUMERIC;
  v_quality_risk NUMERIC;
  v_composite_score NUMERIC;
  v_risk_threshold NUMERIC := 0.7;
  v_fallback_triggered BOOLEAN := false;
  v_fallback_reason TEXT;
  v_total_bids INT;
  v_cost_rank INT := 0;
  v_runner_ups JSONB := '[]'::JSONB;
BEGIN
  -- Lock bids to prevent race condition
  PERFORM id FROM public.bids
  WHERE requirement_id = p_requirement_id
    AND status = 'pending'
  FOR UPDATE;

  -- Count total bids for relative cost scoring
  SELECT COUNT(*) INTO v_total_bids
  FROM public.bids
  WHERE requirement_id = p_requirement_id AND status = 'pending';

  IF v_total_bids = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No pending bids found'
    );
  END IF;

  -- Find best bid with relative cost scoring
  FOR v_selected_bid IN
    SELECT 
      b.id AS bid_id,
      b.supplier_id,
      b.bid_amount AS material_cost,
      COALESCE(b.service_fee, 0) AS logistics_cost,
      (b.bid_amount + COALESCE(b.service_fee, 0)) AS total_landed_cost,
      b.delivery_timeline_days,
      COALESCE(sp.quality_risk_score, 0) AS quality_risk,
      get_delivery_success_rate(b.supplier_id) AS delivery_rate,
      sp.total_orders,
      ROW_NUMBER() OVER (ORDER BY (b.bid_amount + COALESCE(b.service_fee, 0)) ASC) AS cost_rank
    FROM public.bids b
    LEFT JOIN public.supplier_performance sp ON sp.supplier_id = b.supplier_id
    WHERE b.requirement_id = p_requirement_id
      AND b.status = 'pending'
    ORDER BY 
      (b.bid_amount + COALESCE(b.service_fee, 0)) ASC,
      get_delivery_success_rate(b.supplier_id) DESC,
      COALESCE(sp.quality_risk_score, 0) ASC
  LOOP
    v_cost_rank := v_cost_rank + 1;
    v_delivery_rate := v_selected_bid.delivery_rate;
    v_quality_risk := v_selected_bid.quality_risk;
    
    -- Relative cost score: 1 = cheapest, approaches 0 for most expensive
    -- Composite score (higher is better): cost(40%) + delivery(40%) + quality(20%)
    v_composite_score := 
      (1 - (v_cost_rank::NUMERIC - 1) / GREATEST(v_total_bids, 1)) * 0.4 +
      v_delivery_rate * 0.4 +
      (1 - v_quality_risk) * 0.2;
    
    -- Check risk thresholds
    IF v_delivery_rate < 0.6 OR v_quality_risk > v_risk_threshold THEN
      v_fallback_triggered := true;
      v_fallback_reason := CASE 
        WHEN v_delivery_rate < 0.6 THEN 'Low delivery success rate: ' || ROUND(v_delivery_rate, 2)
        ELSE 'High quality risk: ' || ROUND(v_quality_risk, 2)
      END;
      -- Add to runner-ups with reason
      v_runner_ups := v_runner_ups || jsonb_build_object(
        'supplier_id', v_selected_bid.supplier_id,
        'reason', v_fallback_reason,
        'cost', v_selected_bid.total_landed_cost
      );
      CONTINUE;
    END IF;
    
    -- This supplier passes thresholds - select them
    UPDATE public.bids SET status = 'accepted' WHERE id = v_selected_bid.bid_id;
    
    -- Log the selection
    INSERT INTO public.supplier_selection_log (
      requirement_id, selection_mode, selected_bid_id, selected_supplier_id,
      material_cost, logistics_cost, total_landed_cost,
      delivery_success_probability, quality_risk_score, composite_score,
      fallback_triggered, fallback_reason, runner_up_suppliers
    ) VALUES (
      p_requirement_id, 'bidding', v_selected_bid.bid_id, v_selected_bid.supplier_id,
      v_selected_bid.material_cost, v_selected_bid.logistics_cost, v_selected_bid.total_landed_cost,
      v_delivery_rate, v_quality_risk, v_composite_score,
      v_fallback_triggered, v_fallback_reason, v_runner_ups
    ) RETURNING id INTO v_selection_log_id;
    
    UPDATE public.requirements SET status = 'awarded' WHERE id = p_requirement_id;
    
    -- Increment supplier load
    UPDATE public.supplier_performance
    SET current_load = current_load + 1
    WHERE supplier_id = v_selected_bid.supplier_id;
    
    RETURN json_build_object(
      'success', true,
      'selection_log_id', v_selection_log_id,
      'supplier_id', v_selected_bid.supplier_id,
      'total_price', v_selected_bid.total_landed_cost,
      'delivery_days', v_selected_bid.delivery_timeline_days,
      'composite_score', v_composite_score,
      'fallback_triggered', v_fallback_triggered
    );
  END LOOP;
  
  RETURN json_build_object(
    'success', false,
    'error', 'No supplier met risk thresholds',
    'fallback_reason', v_fallback_reason,
    'runner_ups', v_runner_ups
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Update MODE B function with fast-track guard, capacity check, and L1 cap
CREATE OR REPLACE FUNCTION auto_assign_supplier(p_requirement_id UUID)
RETURNS JSON AS $$
DECLARE
  v_requirement RECORD;
  v_best_supplier RECORD;
  v_selection_log_id UUID;
  v_inventory_valid BOOLEAN;
  v_estimated_price NUMERIC;
  v_composite_score NUMERIC;
BEGIN
  SELECT * INTO v_requirement FROM public.requirements WHERE id = p_requirement_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Requirement not found');
  END IF;
  
  -- CRITICAL: Guard against unauthorized auto-assign
  IF v_requirement.selection_mode != 'auto_assign' AND COALESCE(v_requirement.fast_track, false) IS FALSE THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Auto-assign not allowed. Set selection_mode=auto_assign or fast_track=true'
    );
  END IF;
  
  -- Find best supplier with capacity check and capped L1 wins
  SELECT 
    scp.supplier_id,
    scp.l1_wins,
    scp.average_price,
    get_delivery_success_rate(scp.supplier_id) AS delivery_rate,
    COALESCE(sp.quality_risk_score, 0) AS quality_risk,
    sp.daily_capacity,
    sp.current_load,
    sis.available_quantity,
    sis.confidence_score,
    sis.valid_until,
    CASE 
      WHEN sis.valid_until IS NOT NULL AND sis.valid_until < NOW() THEN false
      WHEN sis.last_updated < NOW() - INTERVAL '24 hours' THEN false
      ELSE true
    END AS inventory_fresh
  INTO v_best_supplier
  FROM public.supplier_category_performance scp
  LEFT JOIN public.supplier_performance sp ON sp.supplier_id = scp.supplier_id
  LEFT JOIN public.supplier_inventory_signals sis 
    ON sis.supplier_id = scp.supplier_id AND sis.category = v_requirement.product_category
  WHERE scp.category = v_requirement.product_category
    AND (sis.available_quantity IS NULL OR sis.available_quantity >= v_requirement.quantity)
    -- Capacity check: don't assign if overloaded
    AND (sp.current_load IS NULL OR sp.current_load < COALESCE(sp.daily_capacity, 10))
  ORDER BY 
    -- Cap L1 wins influence at 10
    LEAST(scp.l1_wins, 10) DESC,
    get_delivery_success_rate(scp.supplier_id) DESC,
    COALESCE(sp.quality_risk_score, 0) ASC,
    scp.average_price ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No suitable supplier found for category or all at capacity');
  END IF;
  
  v_inventory_valid := COALESCE(v_best_supplier.inventory_fresh, true);
  
  IF NOT v_inventory_valid AND COALESCE(v_best_supplier.confidence_score, 1) < 0.5 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Inventory data stale and low confidence',
      'supplier_id', v_best_supplier.supplier_id
    );
  END IF;
  
  v_estimated_price := COALESCE(v_best_supplier.average_price, 0) * v_requirement.quantity;
  
  -- Composite score with capped L1 influence
  v_composite_score := 
    (v_best_supplier.delivery_rate * 0.5) + 
    ((1 - v_best_supplier.quality_risk) * 0.3) + 
    (LEAST(v_best_supplier.l1_wins, 10) * 0.02);
  
  INSERT INTO public.supplier_selection_log (
    requirement_id, selection_mode, selected_supplier_id,
    material_cost, total_landed_cost,
    delivery_success_probability, quality_risk_score, composite_score,
    ai_reasoning
  ) VALUES (
    p_requirement_id, 'auto_assign', v_best_supplier.supplier_id,
    v_estimated_price, v_estimated_price,
    v_best_supplier.delivery_rate, v_best_supplier.quality_risk, v_composite_score,
    json_build_object(
      'mode', 'auto_assign',
      'l1_wins', v_best_supplier.l1_wins,
      'l1_wins_capped', LEAST(v_best_supplier.l1_wins, 10),
      'inventory_confidence', v_best_supplier.confidence_score,
      'inventory_fresh', v_inventory_valid,
      'supplier_load', v_best_supplier.current_load,
      'supplier_capacity', v_best_supplier.daily_capacity
    )::TEXT
  ) RETURNING id INTO v_selection_log_id;
  
  UPDATE public.requirements 
  SET status = 'awarded', selection_mode = 'auto_assign'
  WHERE id = p_requirement_id;
  
  -- Increment supplier load
  UPDATE public.supplier_performance
  SET current_load = current_load + 1
  WHERE supplier_id = v_best_supplier.supplier_id;
  
  RETURN json_build_object(
    'success', true,
    'selection_log_id', v_selection_log_id,
    'supplier_id', v_best_supplier.supplier_id,
    'estimated_price', v_estimated_price,
    'delivery_rate', v_best_supplier.delivery_rate,
    'composite_score', v_composite_score,
    'inventory_fresh', v_inventory_valid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. SECURITY: Revoke public access to AI selection functions
REVOKE EXECUTE ON FUNCTION select_supplier_with_bidding(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION auto_assign_supplier(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION get_delivery_success_rate(UUID) FROM public;

-- Grant only to authenticated (backend calls via service role)
GRANT EXECUTE ON FUNCTION select_supplier_with_bidding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_assign_supplier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_delivery_success_rate(UUID) TO authenticated;