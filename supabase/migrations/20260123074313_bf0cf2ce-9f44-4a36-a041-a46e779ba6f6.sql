-- Fix the activate_lane_from_award function - confidence_score must be between 0 and 10
CREATE OR REPLACE FUNCTION public.activate_lane_from_award(req_id uuid, bid_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_record RECORD;
  bid_record RECORD;
  lane_id uuid;
  capacity_lane RECORD;
  awarded_value numeric;
  awarded_qty numeric;
BEGIN
  -- Get requirement details
  SELECT id, product_category as category, product_category as subcategory, 'India' as country, delivery_location, quantity, unit
  INTO req_record
  FROM public.requirements
  WHERE id = req_id;

  -- Get bid details  
  SELECT b.id, b.supplier_id, b.buyer_visible_price, b.bid_amount, b.delivery_timeline_days,
         COALESCE((SELECT SUM(bi.quantity) FROM public.bid_items bi WHERE bi.bid_id = b.id), req_record.quantity) as total_qty
  INTO bid_record
  FROM public.bids b
  WHERE b.id = bid_id;

  awarded_value := COALESCE(bid_record.buyer_visible_price, bid_record.bid_amount, 0);
  awarded_qty := COALESCE(bid_record.total_qty, req_record.quantity, 0);

  -- Create demand intelligence signal as activated lane
  -- NOTE: confidence_score has CHECK constraint requiring value between 0 and 10
  INSERT INTO public.demand_intelligence_signals (
    signal_source,
    category,
    subcategory,
    country,
    delivery_location,
    classification,
    confidence_score,
    lane_state,
    activated_at,
    estimated_value,
    estimated_quantity,
    estimated_unit,
    converted_to_rfq_id,
    awarded_bid_id,
    awarded_supplier_id,
    awarded_quantity,
    awarded_value,
    expected_delivery_at,
    sla_status
  )
  VALUES (
    'rfq_award',
    req_record.category,
    req_record.subcategory,
    req_record.country,
    req_record.delivery_location,
    'buy',
    10,  -- Maximum allowed by CHECK constraint (0-10)
    'activated',
    now(),
    awarded_value,
    awarded_qty,
    req_record.unit,
    req_id,
    bid_id,
    bid_record.supplier_id,
    awarded_qty,
    awarded_value,
    now() + (COALESCE(bid_record.delivery_timeline_days, 7) || ' days')::interval,
    'on_track'
  )
  RETURNING id INTO lane_id;

  -- Find matching capacity lane
  SELECT * INTO capacity_lane
  FROM public.supplier_capacity_lanes
  WHERE country = req_record.country
    AND category = req_record.category
    AND supplier_id = bid_record.supplier_id
    AND active = true
  LIMIT 1;

  IF capacity_lane.id IS NOT NULL THEN
    -- Reserve capacity
    UPDATE public.supplier_capacity_lanes
    SET allocated_quantity = COALESCE(allocated_quantity, 0) + awarded_qty,
        allocated_capacity_value = COALESCE(allocated_capacity_value, 0) + awarded_value,
        updated_at = now()
    WHERE id = capacity_lane.id;

    -- Log capacity event
    INSERT INTO public.lane_capacity_events (
      lane_id,
      capacity_lane_id,
      event_type,
      quantity_delta,
      value_delta,
      previous_allocated,
      new_allocated,
      actor_type,
      metadata
    ) VALUES (
      lane_id,
      capacity_lane.id,
      'reserved',
      awarded_qty,
      awarded_value,
      COALESCE(capacity_lane.allocated_capacity_value, 0),
      COALESCE(capacity_lane.allocated_capacity_value, 0) + awarded_value,
      'system',
      jsonb_build_object(
        'requirement_id', req_id,
        'bid_id', bid_id,
        'supplier_id', bid_record.supplier_id
      )
    );
  END IF;

  -- Log lane activation event
  INSERT INTO public.lane_events (
    lane_id,
    event_type,
    old_state,
    new_state,
    category,
    country,
    actor_type,
    metadata
  ) VALUES (
    lane_id,
    'lane_activated',
    NULL,
    'activated',
    req_record.category,
    req_record.country,
    'system',
    jsonb_build_object(
      'source', 'rfq_award',
      'requirement_id', req_id,
      'bid_id', bid_id
    )
  );

  RETURN lane_id;
END;
$$;