-- Fix the auto_activate_lane_on_award trigger function to pass correct parameters
CREATE OR REPLACE FUNCTION public.auto_activate_lane_on_award()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_record RECORD;
  result_lane_id UUID;
BEGIN
  -- Only trigger when bid status changes TO 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    
    -- Get requirement details for category, subcategory, delivery info
    SELECT category, subcategory, delivery_location
    INTO req_record
    FROM public.requirements
    WHERE id = NEW.requirement_id;
    
    -- Call the activate_lane_from_award function with CORRECT parameter order:
    -- (bid_id, requirement_id, supplier_id, awarded_value, awarded_quantity, 
    --  product_category, product_subcategory, delivery_location, delivery_timeline, 
    --  is_partial, coverage_pct)
    result_lane_id := public.activate_lane_from_award(
      NEW.id,                                              -- bid_id
      NEW.requirement_id,                                  -- requirement_id
      NEW.supplier_id,                                     -- supplier_id
      COALESCE(NEW.buyer_visible_price, NEW.total_amount, 0),  -- awarded_value
      COALESCE(NEW.dispatched_qty, 0),                     -- awarded_quantity
      req_record.category,                                 -- product_category
      req_record.subcategory,                              -- product_subcategory
      req_record.delivery_location,                        -- delivery_location
      NEW.delivery_timeline_days,                          -- delivery_timeline
      COALESCE(NEW.award_type = 'PARTIAL', false),         -- is_partial
      COALESCE(NEW.award_coverage_percentage, 100)         -- coverage_pct
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;