-- Drop existing trigger and function
DROP TRIGGER IF EXISTS auto_activate_lane_on_award_trigger ON public.bids;
DROP FUNCTION IF EXISTS public.auto_activate_lane_on_award();

-- Recreate activate_lane_from_award function
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
  SELECT id INTO existing_lane_id
  FROM public.demand_intelligence_signals
  WHERE awarded_bid_id = bid_id;

  IF existing_lane_id IS NOT NULL THEN
    RETURN existing_lane_id;
  END IF;

  UPDATE public.bids
  SET status = 'accepted',
      awarded_at = now()
  WHERE id = bid_id
    AND status IS DISTINCT FROM 'accepted';

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

-- FIXED: Use product_category instead of non-existent category/subcategory columns
CREATE OR REPLACE FUNCTION public.auto_activate_lane_on_award()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN

    -- CORRECT: Use product_category (not category/subcategory)
    SELECT product_category, delivery_location
    INTO req
    FROM public.requirements
    WHERE id = NEW.requirement_id;

    PERFORM public.activate_lane_from_award(
      NEW.id,
      NEW.requirement_id,
      NEW.supplier_id,
      COALESCE(NEW.buyer_visible_price, NEW.total_amount, 0),
      COALESCE(NEW.dispatched_qty, 0),
      req.product_category,
      req.product_category,
      req.delivery_location,
      NEW.delivery_timeline_days,
      COALESCE(NEW.award_type = 'PARTIAL', false),
      COALESCE(NEW.award_coverage_percentage, 100)
    );

  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER auto_activate_lane_on_award_trigger
AFTER UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.auto_activate_lane_on_award();