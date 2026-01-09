-- 1. Create a scheduled function for daily load reset (replaces trigger-based approach)
-- This should be called via pg_cron or external scheduler
CREATE OR REPLACE FUNCTION reset_all_supplier_daily_loads()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.supplier_performance
  SET current_load = 0,
      load_reset_date = CURRENT_DATE
  WHERE load_reset_date < CURRENT_DATE;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to service role only (for cron/backend calls)
REVOKE EXECUTE ON FUNCTION reset_all_supplier_daily_loads() FROM public;
GRANT EXECUTE ON FUNCTION reset_all_supplier_daily_loads() TO authenticated;

-- 2. Add configuration table for tunable weights and TTLs
CREATE TABLE IF NOT EXISTS public.procurement_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.procurement_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write config
CREATE POLICY "Admins can manage procurement config"
  ON public.procurement_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default configuration
INSERT INTO public.procurement_config (config_key, config_value, description)
VALUES 
  ('scoring_weights', '{"cost_weight": 0.4, "delivery_weight": 0.4, "quality_weight": 0.2}', 'Composite score weights for MODE A'),
  ('auto_assign_weights', '{"delivery_weight": 0.5, "quality_weight": 0.3, "l1_history_weight": 0.2}', 'Composite score weights for MODE B'),
  ('inventory_ttl_hours', '{"default": 24, "perishables": 6, "chemicals": 48}', 'Inventory freshness TTL by category type'),
  ('risk_thresholds', '{"min_delivery_rate": 0.6, "max_quality_risk": 0.7}', 'Risk thresholds for supplier selection'),
  ('new_supplier_defaults', '{"default_delivery_rate": 0.85, "min_orders_for_trust": 3}', 'Defaults for new suppliers')
ON CONFLICT (config_key) DO NOTHING;

-- 3. Update MODE A function with ALL fixes:
--    - Capacity check
--    - Already-awarded check
--    - Atomic load increment with row lock
CREATE OR REPLACE FUNCTION select_supplier_with_bidding(p_requirement_id UUID)
RETURNS JSON AS $$
DECLARE
  v_selected_bid RECORD;
  v_selection_log_id UUID;
  v_delivery_rate NUMERIC;
  v_quality_risk NUMERIC;
  v_composite_score NUMERIC;
  v_risk_threshold NUMERIC := 0.7;
  v_min_delivery_rate NUMERIC := 0.6;
  v_fallback_triggered BOOLEAN := false;
  v_fallback_reason TEXT;
  v_total_bids INT;
  v_cost_rank INT := 0;
  v_runner_ups JSONB := '[]'::JSONB;
  v_config JSONB;
BEGIN
  -- CRITICAL: Check if requirement is already awarded
  IF EXISTS (
    SELECT 1 FROM public.requirements
    WHERE id = p_requirement_id AND status = 'awarded'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Requirement already awarded'
    );
  END IF;

  -- Load configurable thresholds
  SELECT config_value INTO v_config
  FROM public.procurement_config
  WHERE config_key = 'risk_thresholds';
  
  IF v_config IS NOT NULL THEN
    v_min_delivery_rate := COALESCE((v_config->>'min_delivery_rate')::NUMERIC, 0.6);
    v_risk_threshold := COALESCE((v_config->>'max_quality_risk')::NUMERIC, 0.7);
  END IF;

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

  -- Find best bid with capacity check and relative cost scoring
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
      sp.current_load,
      sp.daily_capacity,
      ROW_NUMBER() OVER (ORDER BY (b.bid_amount + COALESCE(b.service_fee, 0)) ASC) AS cost_rank
    FROM public.bids b
    LEFT JOIN public.supplier_performance sp ON sp.supplier_id = b.supplier_id
    WHERE b.requirement_id = p_requirement_id
      AND b.status = 'pending'
      -- CRITICAL: Capacity check for MODE A
      AND (sp.current_load IS NULL OR sp.current_load < COALESCE(sp.daily_capacity, 10))
    ORDER BY 
      (b.bid_amount + COALESCE(b.service_fee, 0)) ASC,
      get_delivery_success_rate(b.supplier_id) DESC,
      COALESCE(sp.quality_risk_score, 0) ASC
  LOOP
    v_cost_rank := v_cost_rank + 1;
    v_delivery_rate := v_selected_bid.delivery_rate;
    v_quality_risk := v_selected_bid.quality_risk;
    
    -- Composite score (higher is better)
    v_composite_score := 
      (1 - (v_cost_rank::NUMERIC - 1) / GREATEST(v_total_bids, 1)) * 0.4 +
      v_delivery_rate * 0.4 +
      (1 - v_quality_risk) * 0.2;
    
    -- Check risk thresholds
    IF v_delivery_rate < v_min_delivery_rate OR v_quality_risk > v_risk_threshold THEN
      v_fallback_triggered := true;
      v_fallback_reason := CASE 
        WHEN v_delivery_rate < v_min_delivery_rate THEN 'Low delivery rate: ' || ROUND(v_delivery_rate, 2)
        ELSE 'High quality risk: ' || ROUND(v_quality_risk, 2)
      END;
      v_runner_ups := v_runner_ups || jsonb_build_object(
        'supplier_id', v_selected_bid.supplier_id,
        'reason', v_fallback_reason,
        'cost', v_selected_bid.total_landed_cost
      );
      CONTINUE;
    END IF;
    
    -- ATOMIC: Lock supplier row before increment
    PERFORM 1 FROM public.supplier_performance
    WHERE supplier_id = v_selected_bid.supplier_id
    FOR UPDATE;
    
    -- Update bid status
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
    
    -- ATOMIC: Increment supplier load (already locked)
    UPDATE public.supplier_performance
    SET current_load = current_load + 1,
        load_reset_date = CASE WHEN load_reset_date < CURRENT_DATE THEN CURRENT_DATE ELSE load_reset_date END
    WHERE supplier_id = v_selected_bid.supplier_id;
    
    -- If no performance row exists, create one
    IF NOT FOUND THEN
      INSERT INTO public.supplier_performance (supplier_id, current_load, load_reset_date)
      VALUES (v_selected_bid.supplier_id, 1, CURRENT_DATE)
      ON CONFLICT (supplier_id) DO UPDATE SET current_load = supplier_performance.current_load + 1;
    END IF;
    
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
  
  -- Check if we have bids but all suppliers are at capacity
  IF v_cost_rank = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'All bidding suppliers are at daily capacity',
      'fallback_reason', 'capacity_exceeded'
    );
  END IF;
  
  RETURN json_build_object(
    'success', false,
    'error', 'No supplier met risk thresholds',
    'fallback_reason', v_fallback_reason,
    'runner_ups', v_runner_ups
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update MODE B function with atomic load increment and already-awarded check
CREATE OR REPLACE FUNCTION auto_assign_supplier(p_requirement_id UUID)
RETURNS JSON AS $$
DECLARE
  v_requirement RECORD;
  v_best_supplier RECORD;
  v_selection_log_id UUID;
  v_inventory_valid BOOLEAN;
  v_estimated_price NUMERIC;
  v_composite_score NUMERIC;
  v_inventory_ttl_hours INT := 24;
BEGIN
  -- CRITICAL: Check if requirement is already awarded
  IF EXISTS (
    SELECT 1 FROM public.requirements
    WHERE id = p_requirement_id AND status = 'awarded'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Requirement already awarded'
    );
  END IF;

  SELECT * INTO v_requirement FROM public.requirements WHERE id = p_requirement_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Requirement not found');
  END IF;
  
  -- Guard against unauthorized auto-assign
  IF v_requirement.selection_mode != 'auto_assign' AND COALESCE(v_requirement.fast_track, false) IS FALSE THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Auto-assign not allowed. Set selection_mode=auto_assign or fast_track=true'
    );
  END IF;
  
  -- Load configurable inventory TTL
  SELECT COALESCE((config_value->>'default')::INT, 24) INTO v_inventory_ttl_hours
  FROM public.procurement_config
  WHERE config_key = 'inventory_ttl_hours';
  
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
      WHEN sis.last_updated < NOW() - (v_inventory_ttl_hours || ' hours')::INTERVAL THEN false
      ELSE true
    END AS inventory_fresh
  INTO v_best_supplier
  FROM public.supplier_category_performance scp
  LEFT JOIN public.supplier_performance sp ON sp.supplier_id = scp.supplier_id
  LEFT JOIN public.supplier_inventory_signals sis 
    ON sis.supplier_id = scp.supplier_id AND sis.category = v_requirement.product_category
  WHERE scp.category = v_requirement.product_category
    AND (sis.available_quantity IS NULL OR sis.available_quantity >= v_requirement.quantity)
    AND (sp.current_load IS NULL OR sp.current_load < COALESCE(sp.daily_capacity, 10))
  ORDER BY 
    LEAST(scp.l1_wins, 10) DESC,
    get_delivery_success_rate(scp.supplier_id) DESC,
    COALESCE(sp.quality_risk_score, 0) ASC,
    scp.average_price ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No suitable supplier found or all at capacity');
  END IF;
  
  v_inventory_valid := COALESCE(v_best_supplier.inventory_fresh, true);
  
  IF NOT v_inventory_valid AND COALESCE(v_best_supplier.confidence_score, 1) < 0.5 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Inventory data stale and low confidence',
      'supplier_id', v_best_supplier.supplier_id
    );
  END IF;
  
  -- ATOMIC: Lock supplier row
  PERFORM 1 FROM public.supplier_performance
  WHERE supplier_id = v_best_supplier.supplier_id
  FOR UPDATE;
  
  v_estimated_price := COALESCE(v_best_supplier.average_price, 0) * v_requirement.quantity;
  
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
      'inventory_ttl_hours', v_inventory_ttl_hours,
      'supplier_load', v_best_supplier.current_load,
      'supplier_capacity', v_best_supplier.daily_capacity
    )::TEXT
  ) RETURNING id INTO v_selection_log_id;
  
  UPDATE public.requirements 
  SET status = 'awarded', selection_mode = 'auto_assign'
  WHERE id = p_requirement_id;
  
  -- ATOMIC: Increment load (already locked)
  UPDATE public.supplier_performance
  SET current_load = current_load + 1,
      load_reset_date = CASE WHEN load_reset_date < CURRENT_DATE THEN CURRENT_DATE ELSE load_reset_date END
  WHERE supplier_id = v_best_supplier.supplier_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.supplier_performance (supplier_id, current_load, load_reset_date)
    VALUES (v_best_supplier.supplier_id, 1, CURRENT_DATE)
    ON CONFLICT (supplier_id) DO UPDATE SET current_load = supplier_performance.current_load + 1;
  END IF;
  
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

-- 5. Revoke and re-grant permissions
REVOKE EXECUTE ON FUNCTION select_supplier_with_bidding(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION auto_assign_supplier(UUID) FROM public;
GRANT EXECUTE ON FUNCTION select_supplier_with_bidding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_assign_supplier(UUID) TO authenticated;