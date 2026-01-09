-- 1. Add selection_mode and fast_track to requirements
ALTER TABLE public.requirements 
ADD COLUMN IF NOT EXISTS selection_mode TEXT DEFAULT 'bidding' CHECK (selection_mode IN ('bidding', 'auto_assign')),
ADD COLUMN IF NOT EXISTS fast_track BOOLEAN DEFAULT false;

-- 2. Add inventory freshness columns
ALTER TABLE public.supplier_inventory_signals
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- 3. Drop stored derived score (compute dynamically instead)
ALTER TABLE public.supplier_performance 
DROP COLUMN IF EXISTS delivery_success_rate;

-- 4. Rename quality_score to quality_risk_score for clarity (0 = low risk, 1 = high risk)
-- First add new column, migrate data inverted, then drop old
ALTER TABLE public.supplier_performance
ADD COLUMN IF NOT EXISTS quality_risk_score NUMERIC(5,4) DEFAULT 0;

-- Migrate existing data (invert: old 1=best becomes 0=low risk)
UPDATE public.supplier_performance 
SET quality_risk_score = 1 - COALESCE(quality_score, 1);

ALTER TABLE public.supplier_performance
DROP COLUMN IF EXISTS quality_score;

-- 5. Add delivery tracking to bids table
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'pending' CHECK (quality_status IN ('pending', 'approved', 'rejected', 'complaint'));

-- 6. Create trigger function to update supplier performance on delivery
CREATE OR REPLACE FUNCTION update_supplier_delivery_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_supplier_id UUID;
  v_was_on_time BOOLEAN;
BEGIN
  -- Only process when status changes to 'accepted' and delivered_at is set
  IF NEW.status = 'accepted' AND NEW.delivered_at IS NOT NULL AND 
     (OLD.delivered_at IS NULL OR OLD.delivered_at != NEW.delivered_at) THEN
    
    v_supplier_id := NEW.supplier_id;
    v_was_on_time := NEW.delivered_at <= COALESCE(NEW.expected_delivery_date, NEW.delivered_at);
    
    -- Update supplier performance
    UPDATE public.supplier_performance
    SET 
      successful_deliveries = successful_deliveries + 1,
      on_time_deliveries = on_time_deliveries + CASE WHEN v_was_on_time THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE supplier_id = v_supplier_id;
    
    -- If no row exists, create one
    IF NOT FOUND THEN
      INSERT INTO public.supplier_performance (supplier_id, successful_deliveries, on_time_deliveries)
      VALUES (v_supplier_id, 1, CASE WHEN v_was_on_time THEN 1 ELSE 0 END);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create trigger function to update quality stats
CREATE OR REPLACE FUNCTION update_supplier_quality_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_supplier_id UUID;
  v_rejection_delta INT := 0;
  v_complaint_delta INT := 0;
BEGIN
  v_supplier_id := NEW.supplier_id;
  
  -- Check for quality status changes
  IF OLD.quality_status != NEW.quality_status THEN
    IF NEW.quality_status = 'rejected' AND OLD.quality_status != 'rejected' THEN
      v_rejection_delta := 1;
    ELSIF NEW.quality_status = 'complaint' AND OLD.quality_status NOT IN ('rejected', 'complaint') THEN
      v_complaint_delta := 1;
    END IF;
    
    IF v_rejection_delta > 0 OR v_complaint_delta > 0 THEN
      UPDATE public.supplier_performance
      SET 
        quality_rejections = quality_rejections + v_rejection_delta,
        quality_complaints = quality_complaints + v_complaint_delta,
        -- Recalculate quality_risk_score: higher rejections/complaints = higher risk
        quality_risk_score = LEAST(1.0, 
          (quality_rejections + v_rejection_delta) * 0.1 + 
          (quality_complaints + v_complaint_delta) * 0.05
        ),
        updated_at = NOW()
      WHERE supplier_id = v_supplier_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Create triggers
DROP TRIGGER IF EXISTS trigger_update_delivery_stats ON public.bids;
CREATE TRIGGER trigger_update_delivery_stats
  AFTER UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_delivery_stats();

DROP TRIGGER IF EXISTS trigger_update_quality_stats ON public.bids;
CREATE TRIGGER trigger_update_quality_stats
  AFTER UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_quality_stats();

-- 9. Dynamic delivery success calculation function (replaces stored column)
CREATE OR REPLACE FUNCTION get_delivery_success_rate(p_supplier_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total INT;
  v_successful INT;
BEGIN
  SELECT total_orders, successful_deliveries 
  INTO v_total, v_successful
  FROM public.supplier_performance 
  WHERE supplier_id = p_supplier_id;
  
  IF v_total IS NULL OR v_total < 3 THEN
    RETURN 0.85; -- Default for new suppliers
  END IF;
  
  RETURN ROUND(v_successful::NUMERIC / v_total, 4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. MODE A: Supplier selection with bidding
CREATE OR REPLACE FUNCTION select_supplier_with_bidding(p_requirement_id UUID)
RETURNS JSON AS $$
DECLARE
  v_selected_bid RECORD;
  v_fallback_bid RECORD;
  v_selection_log_id UUID;
  v_delivery_rate NUMERIC;
  v_quality_risk NUMERIC;
  v_composite_score NUMERIC;
  v_risk_threshold NUMERIC := 0.7;
  v_fallback_triggered BOOLEAN := false;
  v_fallback_reason TEXT;
BEGIN
  -- Find best bid based on total landed cost + AI scoring
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
      sp.total_orders
    FROM public.bids b
    LEFT JOIN public.supplier_performance sp ON sp.supplier_id = b.supplier_id
    WHERE b.requirement_id = p_requirement_id
      AND b.status = 'pending'
    ORDER BY 
      (b.bid_amount + COALESCE(b.service_fee, 0)) ASC,
      get_delivery_success_rate(b.supplier_id) DESC,
      COALESCE(sp.quality_risk_score, 0) ASC
  LOOP
    v_delivery_rate := v_selected_bid.delivery_rate;
    v_quality_risk := v_selected_bid.quality_risk;
    
    -- Calculate composite score (higher is better)
    v_composite_score := (v_delivery_rate * 0.4) + ((1 - v_quality_risk) * 0.3) + 
                         (1 / (1 + v_selected_bid.total_landed_cost / 10000) * 0.3);
    
    -- Check risk thresholds
    IF v_delivery_rate < 0.6 OR v_quality_risk > v_risk_threshold THEN
      v_fallback_triggered := true;
      v_fallback_reason := CASE 
        WHEN v_delivery_rate < 0.6 THEN 'Low delivery success rate: ' || v_delivery_rate
        ELSE 'High quality risk: ' || v_quality_risk
      END;
      CONTINUE; -- Try next supplier
    END IF;
    
    -- This supplier passes thresholds - select them
    -- Update bid status
    UPDATE public.bids SET status = 'accepted' WHERE id = v_selected_bid.bid_id;
    
    -- Log the selection
    INSERT INTO public.supplier_selection_log (
      requirement_id, selection_mode, selected_bid_id, selected_supplier_id,
      material_cost, logistics_cost, total_landed_cost,
      delivery_success_probability, quality_risk_score, composite_score,
      fallback_triggered, fallback_reason
    ) VALUES (
      p_requirement_id, 'bidding', v_selected_bid.bid_id, v_selected_bid.supplier_id,
      v_selected_bid.material_cost, v_selected_bid.logistics_cost, v_selected_bid.total_landed_cost,
      v_delivery_rate, v_quality_risk, v_composite_score,
      v_fallback_triggered, v_fallback_reason
    ) RETURNING id INTO v_selection_log_id;
    
    -- Update requirement status
    UPDATE public.requirements SET status = 'awarded' WHERE id = p_requirement_id;
    
    RETURN json_build_object(
      'success', true,
      'selection_log_id', v_selection_log_id,
      'supplier_id', v_selected_bid.supplier_id,
      'total_price', v_selected_bid.total_landed_cost,
      'delivery_days', v_selected_bid.delivery_timeline_days,
      'fallback_triggered', v_fallback_triggered
    );
  END LOOP;
  
  -- No suitable supplier found
  RETURN json_build_object(
    'success', false,
    'error', 'No supplier met risk thresholds',
    'fallback_reason', v_fallback_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. MODE B: Auto-assign supplier without bidding
CREATE OR REPLACE FUNCTION auto_assign_supplier(p_requirement_id UUID)
RETURNS JSON AS $$
DECLARE
  v_requirement RECORD;
  v_best_supplier RECORD;
  v_selection_log_id UUID;
  v_inventory_valid BOOLEAN;
  v_estimated_price NUMERIC;
BEGIN
  -- Get requirement details
  SELECT * INTO v_requirement FROM public.requirements WHERE id = p_requirement_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Requirement not found');
  END IF;
  
  -- Find best supplier based on historical performance + inventory
  SELECT 
    scp.supplier_id,
    scp.l1_wins,
    scp.average_price,
    get_delivery_success_rate(scp.supplier_id) AS delivery_rate,
    COALESCE(sp.quality_risk_score, 0) AS quality_risk,
    sis.available_quantity,
    sis.confidence_score,
    sis.valid_until,
    -- Check inventory freshness
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
  ORDER BY 
    scp.l1_wins DESC,
    get_delivery_success_rate(scp.supplier_id) DESC,
    COALESCE(sp.quality_risk_score, 0) ASC,
    scp.average_price ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No suitable supplier found for category');
  END IF;
  
  -- Validate inventory freshness
  v_inventory_valid := COALESCE(v_best_supplier.inventory_fresh, true);
  
  IF NOT v_inventory_valid AND v_best_supplier.confidence_score < 0.5 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Inventory data stale and low confidence',
      'supplier_id', v_best_supplier.supplier_id
    );
  END IF;
  
  -- Estimate price based on historical average
  v_estimated_price := COALESCE(v_best_supplier.average_price, 0) * v_requirement.quantity;
  
  -- Log the auto-assignment
  INSERT INTO public.supplier_selection_log (
    requirement_id, selection_mode, selected_supplier_id,
    material_cost, total_landed_cost,
    delivery_success_probability, quality_risk_score,
    composite_score, ai_reasoning
  ) VALUES (
    p_requirement_id, 'auto_assign', v_best_supplier.supplier_id,
    v_estimated_price, v_estimated_price,
    v_best_supplier.delivery_rate, v_best_supplier.quality_risk,
    (v_best_supplier.delivery_rate * 0.5) + ((1 - v_best_supplier.quality_risk) * 0.3) + (v_best_supplier.l1_wins * 0.02),
    json_build_object(
      'mode', 'auto_assign',
      'l1_wins', v_best_supplier.l1_wins,
      'inventory_confidence', v_best_supplier.confidence_score,
      'inventory_fresh', v_inventory_valid
    )::TEXT
  ) RETURNING id INTO v_selection_log_id;
  
  -- Update requirement
  UPDATE public.requirements 
  SET status = 'awarded', selection_mode = 'auto_assign'
  WHERE id = p_requirement_id;
  
  RETURN json_build_object(
    'success', true,
    'selection_log_id', v_selection_log_id,
    'supplier_id', v_best_supplier.supplier_id,
    'estimated_price', v_estimated_price,
    'delivery_rate', v_best_supplier.delivery_rate,
    'inventory_fresh', v_inventory_valid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;