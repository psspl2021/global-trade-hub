-- Fix trigger recursion: Remove UPDATE bids from activate_lane_from_award
-- The trigger already fires when status becomes 'accepted', so no need to update again

CREATE OR REPLACE FUNCTION public.activate_lane_from_award(
  bid_id UUID,
  requirement_id UUID,
  supplier_id UUID,
  awarded_value NUMERIC,
  awarded_quantity NUMERIC DEFAULT 0,
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
BEGIN
  -- One bid = one lane (idempotent)
  SELECT id INTO existing_lane_id
  FROM public.demand_intelligence_signals
  WHERE awarded_bid_id = bid_id;

  IF existing_lane_id IS NOT NULL THEN
    RETURN existing_lane_id;
  END IF;

  -- ❌ REMOVED: No UPDATE on bids here - prevents trigger recursion
  -- The trigger already fired because status became 'accepted'

  lane_id := gen_random_uuid();

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
    10,
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
    'detected',
    'activated',
    'system',
    jsonb_build_object(
      'bid_id', bid_id,
      'requirement_id', requirement_id,
      'supplier_id', supplier_id,
      'awarded_value', awarded_value
    )
  );

  RETURN lane_id;
END;
$$;