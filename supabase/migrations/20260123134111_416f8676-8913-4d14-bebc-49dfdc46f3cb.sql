
-- Add bid-level award protection to prevent double-awards
CREATE OR REPLACE FUNCTION public.activate_lane_from_award(
  bid_id UUID,
  requirement_id UUID,
  supplier_id UUID,
  awarded_value NUMERIC,
  awarded_quantity NUMERIC DEFAULT NULL,
  product_category TEXT DEFAULT NULL,
  product_subcategory TEXT DEFAULT NULL,
  delivery_location TEXT DEFAULT NULL,
  delivery_timeline INTEGER DEFAULT NULL,
  is_partial BOOLEAN DEFAULT false,
  coverage_pct NUMERIC DEFAULT 100
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lane_id UUID;
  existing_lane_id UUID;
  bid_record RECORD;
  capacity_lane_id UUID;
  current_capacity NUMERIC;
BEGIN
  -- SAFETY 1: Check if lane already exists for this bid (idempotency)
  SELECT id INTO existing_lane_id
  FROM public.demand_intelligence_signals
  WHERE awarded_bid_id = bid_id
  LIMIT 1;

  IF existing_lane_id IS NOT NULL THEN
    -- Return existing lane_id without creating duplicate
    RETURN existing_lane_id;
  END IF;

  -- SAFETY 2: Lock the bid row and verify it's valid for award
  SELECT b.id, b.status, b.total_amount, b.supplier_id
  INTO bid_record
  FROM public.bids b
  WHERE b.id = bid_id
  FOR UPDATE;

  IF bid_record.id IS NULL THEN
    RAISE EXCEPTION 'Bid not found: %', bid_id;
  END IF;

  -- SAFETY 3: Mark bid as accepted atomically (only if not already accepted)
  UPDATE public.bids
  SET status = 'accepted',
      awarded_at = now()
  WHERE id = bid_id
    AND status IS DISTINCT FROM 'accepted';

  IF NOT FOUND THEN
    -- Bid was already accepted - check if lane exists
    SELECT id INTO existing_lane_id
    FROM public.demand_intelligence_signals
    WHERE awarded_bid_id = bid_id
    LIMIT 1;
    
    IF existing_lane_id IS NOT NULL THEN
      RETURN existing_lane_id;
    END IF;
    
    RAISE EXCEPTION 'Bid already awarded or in invalid state: %', bid_id;
  END IF;

  -- Generate new lane ID
  lane_id := gen_random_uuid();

  -- Create the activated lane/signal
  INSERT INTO public.demand_intelligence_signals (
    id,
    signal_source,
    classification,
    lane_state,
    confidence_score,
    awarded_bid_id,
    awarded_supplier_id,
    awarded_value,
    awarded_quantity,
    is_partial_award,
    category,
    subcategory,
    delivery_location,
    delivery_timeline_days,
    activated_at,
    converted_to_rfq_id
  ) VALUES (
    lane_id,
    'rfq_award',
    'buy',
    'activated',
    LEAST(10, GREATEST(1, ROUND(coverage_pct / 10))),
    bid_id,
    supplier_id,
    awarded_value,
    awarded_quantity,
    is_partial,
    product_category,
    product_subcategory,
    delivery_location,
    delivery_timeline,
    now(),
    requirement_id
  );

  -- Try to find and update supplier capacity lane
  SELECT id, allocated_capacity_value
  INTO capacity_lane_id, current_capacity
  FROM public.supplier_capacity_lanes
  WHERE supplier_capacity_lanes.supplier_id = activate_lane_from_award.supplier_id
  FOR UPDATE
  LIMIT 1;

  IF capacity_lane_id IS NOT NULL THEN
    UPDATE public.supplier_capacity_lanes
    SET 
      allocated_capacity_value = COALESCE(current_capacity, 0) + awarded_value,
      allocated_quantity = COALESCE(allocated_quantity, 0) + COALESCE(awarded_quantity, 0),
      updated_at = now()
    WHERE id = capacity_lane_id;

    -- Link capacity lane to signal
    UPDATE public.demand_intelligence_signals
    SET 
      capacity_lane_id = capacity_lane_id,
      capacity_utilization_at_award = CASE 
        WHEN (SELECT max_capacity_value FROM public.supplier_capacity_lanes WHERE id = capacity_lane_id) > 0 
        THEN ((COALESCE(current_capacity, 0) + awarded_value) / (SELECT max_capacity_value FROM public.supplier_capacity_lanes WHERE id = capacity_lane_id)) * 100
        ELSE 0 
      END
    WHERE id = lane_id;
  END IF;

  -- Log the lane activation event
  INSERT INTO public.lane_events (
    signal_id,
    event_type,
    from_state,
    to_state,
    actor,
    metadata
  ) VALUES (
    lane_id,
    'lane_activated',
    'pending',
    'activated',
    'system',
    jsonb_build_object(
      'bid_id', bid_id,
      'requirement_id', requirement_id,
      'supplier_id', supplier_id,
      'awarded_value', awarded_value,
      'coverage_percentage', coverage_pct
    )
  );

  RETURN lane_id;
END;
$$;
