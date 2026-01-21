-- =====================================================
-- UPGRADE 1: Award Window Lock (Prevents Last-Second Chaos)
-- =====================================================

-- Add award_locked column to requirements
ALTER TABLE public.requirements
ADD COLUMN IF NOT EXISTS award_locked boolean DEFAULT false;

-- Add award_locked column to logistics_requirements
ALTER TABLE public.logistics_requirements
ADD COLUMN IF NOT EXISTS award_locked boolean DEFAULT false;

-- Create index for fast filtering
CREATE INDEX IF NOT EXISTS idx_requirements_award_locked 
ON public.requirements(award_locked) WHERE award_locked = true;

CREATE INDEX IF NOT EXISTS idx_logistics_requirements_award_locked 
ON public.logistics_requirements(award_locked) WHERE award_locked = true;

-- Guard function: Prevent awarding if RFQ is locked
CREATE OR REPLACE FUNCTION public.prevent_award_if_locked()
RETURNS trigger AS $$
BEGIN
  -- Only check when status is changing to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    IF (SELECT award_locked FROM public.requirements WHERE id = NEW.requirement_id) THEN
      RAISE EXCEPTION 'Awarding is locked while RFQ is being modified. Please wait for the buyer to unlock awarding.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Guard function for logistics bids
CREATE OR REPLACE FUNCTION public.prevent_logistics_award_if_locked()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    IF (SELECT award_locked FROM public.logistics_requirements WHERE id = NEW.logistics_requirement_id) THEN
      RAISE EXCEPTION 'Awarding is locked while load is being modified. Please wait for the buyer to unlock awarding.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach triggers to bids tables
DROP TRIGGER IF EXISTS prevent_award_if_locked_trigger ON public.bids;
CREATE TRIGGER prevent_award_if_locked_trigger
BEFORE UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.prevent_award_if_locked();

DROP TRIGGER IF EXISTS prevent_logistics_award_if_locked_trigger ON public.logistics_bids;
CREATE TRIGGER prevent_logistics_award_if_locked_trigger
BEFORE UPDATE ON public.logistics_bids
FOR EACH ROW EXECUTE FUNCTION public.prevent_logistics_award_if_locked();

-- Function to lock awarding (called when extending/reopening)
CREATE OR REPLACE FUNCTION public.lock_requirement_awarding(req_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.requirements
  SET award_locked = true, updated_at = now()
  WHERE id = req_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.lock_logistics_awarding(req_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.logistics_requirements
  SET award_locked = true, updated_at = now()
  WHERE id = req_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to unlock awarding (called when new bids come in or buyer unlocks)
CREATE OR REPLACE FUNCTION public.unlock_requirement_awarding(req_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.requirements
  SET award_locked = false, updated_at = now()
  WHERE id = req_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.unlock_logistics_awarding(req_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.logistics_requirements
  SET award_locked = false, updated_at = now()
  WHERE id = req_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-unlock when new bid is submitted
CREATE OR REPLACE FUNCTION public.auto_unlock_on_new_bid()
RETURNS trigger AS $$
BEGIN
  -- When a new bid comes in, unlock awarding if it was locked
  UPDATE public.requirements
  SET award_locked = false
  WHERE id = NEW.requirement_id AND award_locked = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_unlock_on_new_logistics_bid()
RETURNS trigger AS $$
BEGIN
  UPDATE public.logistics_requirements
  SET award_locked = false
  WHERE id = NEW.logistics_requirement_id AND award_locked = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS auto_unlock_on_new_bid_trigger ON public.bids;
CREATE TRIGGER auto_unlock_on_new_bid_trigger
AFTER INSERT ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.auto_unlock_on_new_bid();

DROP TRIGGER IF EXISTS auto_unlock_on_new_logistics_bid_trigger ON public.logistics_bids;
CREATE TRIGGER auto_unlock_on_new_logistics_bid_trigger
AFTER INSERT ON public.logistics_bids
FOR EACH ROW EXECUTE FUNCTION public.auto_unlock_on_new_logistics_bid();

-- =====================================================
-- UPGRADE 2: Lane Activation from Award
-- =====================================================

-- Function to activate a demand lane when a bid is awarded
CREATE OR REPLACE FUNCTION public.activate_lane_from_award(req_id uuid, bid_id uuid)
RETURNS uuid AS $$
DECLARE
  lane_id uuid;
  req_record RECORD;
BEGIN
  -- Get requirement details
  SELECT id, country, category, subcategory, title, budget
  INTO req_record
  FROM public.requirements
  WHERE id = req_id;

  IF req_record IS NULL THEN
    RAISE EXCEPTION 'Requirement not found: %', req_id;
  END IF;

  -- Check if a lane already exists for this requirement
  SELECT id INTO lane_id
  FROM public.demand_intelligence_signals
  WHERE converted_to_rfq_id = req_id;

  IF lane_id IS NOT NULL THEN
    -- Update existing lane to activated state
    UPDATE public.demand_intelligence_signals
    SET 
      lane_state = 'activated',
      activated_at = now(),
      updated_at = now()
    WHERE id = lane_id;
  ELSE
    -- Create a new lane from the awarded requirement
    INSERT INTO public.demand_intelligence_signals (
      signal_source,
      classification,
      lane_state,
      country,
      category,
      subcategory,
      product_description,
      estimated_value,
      confidence_score,
      converted_to_rfq_id,
      converted_at,
      activated_at,
      created_at,
      updated_at
    ) VALUES (
      'rfq_award',
      'buy',
      'activated',
      req_record.country,
      req_record.category,
      req_record.subcategory,
      req_record.title,
      req_record.budget,
      100, -- High confidence since it's a real award
      req_id,
      now(),
      now(),
      now(),
      now()
    )
    RETURNING id INTO lane_id;
  END IF;

  -- Log the lane activation event
  INSERT INTO public.lane_events (
    signal_id,
    from_state,
    to_state,
    action,
    actor,
    actor_id,
    metadata,
    created_at
  ) VALUES (
    lane_id,
    'pending',
    'activated',
    'award_accepted',
    'system',
    bid_id,
    jsonb_build_object(
      'requirement_id', req_id,
      'bid_id', bid_id,
      'category', req_record.category,
      'country', req_record.country
    ),
    now()
  );

  RETURN lane_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to activate logistics lane from award
CREATE OR REPLACE FUNCTION public.activate_logistics_lane_from_award(req_id uuid, bid_id uuid)
RETURNS uuid AS $$
DECLARE
  lane_id uuid;
  req_record RECORD;
BEGIN
  SELECT id, pickup_city, delivery_city, material_type
  INTO req_record
  FROM public.logistics_requirements
  WHERE id = req_id;

  IF req_record IS NULL THEN
    RAISE EXCEPTION 'Logistics requirement not found: %', req_id;
  END IF;

  -- Create a lane entry for logistics (using demand_intelligence_signals)
  INSERT INTO public.demand_intelligence_signals (
    signal_source,
    classification,
    lane_state,
    country,
    category,
    product_description,
    confidence_score,
    converted_to_rfq_id,
    converted_at,
    activated_at,
    created_at,
    updated_at
  ) VALUES (
    'logistics_award',
    'logistics',
    'activated',
    'India', -- Default for logistics
    'Logistics',
    req_record.pickup_city || ' → ' || req_record.delivery_city || ' (' || req_record.material_type || ')',
    100,
    req_id,
    now(),
    now(),
    now(),
    now()
  )
  RETURNING id INTO lane_id;

  RETURN lane_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-activate lane when bid is accepted
CREATE OR REPLACE FUNCTION public.auto_activate_lane_on_award()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    PERFORM public.activate_lane_from_award(NEW.requirement_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_activate_logistics_lane_on_award()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    PERFORM public.activate_logistics_lane_from_award(NEW.logistics_requirement_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS auto_activate_lane_on_award_trigger ON public.bids;
CREATE TRIGGER auto_activate_lane_on_award_trigger
AFTER UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.auto_activate_lane_on_award();

DROP TRIGGER IF EXISTS auto_activate_logistics_lane_on_award_trigger ON public.logistics_bids;
CREATE TRIGGER auto_activate_logistics_lane_on_award_trigger
AFTER UPDATE ON public.logistics_bids
FOR EACH ROW EXECUTE FUNCTION public.auto_activate_logistics_lane_on_award();