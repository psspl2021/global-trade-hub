-- =============================================
-- UPGRADE 1: Lane Capacity Auto-Reservation
-- =============================================

-- Create lane_capacity_events audit table (if not exists from failed attempt)
CREATE TABLE IF NOT EXISTS public.lane_capacity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id uuid REFERENCES public.demand_intelligence_signals(id) ON DELETE CASCADE,
  capacity_lane_id uuid,
  event_type text NOT NULL,
  quantity_delta numeric,
  value_delta numeric,
  previous_allocated numeric,
  new_allocated numeric,
  actor_id uuid,
  actor_type text DEFAULT 'system',
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (idempotent)
ALTER TABLE public.lane_capacity_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Admins can view capacity events" ON public.lane_capacity_events;
CREATE POLICY "Admins can view capacity events"
  ON public.lane_capacity_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Add allocated quantity column (value already exists as allocated_capacity_value)
ALTER TABLE public.supplier_capacity_lanes
ADD COLUMN IF NOT EXISTS allocated_quantity numeric DEFAULT 0;

-- Add computed utilization column using correct column name
ALTER TABLE public.supplier_capacity_lanes
ADD COLUMN IF NOT EXISTS utilization_percent numeric GENERATED ALWAYS AS (
  CASE WHEN monthly_capacity_value > 0 
    THEN LEAST((COALESCE(allocated_capacity_value, 0) / monthly_capacity_value) * 100, 100)
    ELSE 0 
  END
) STORED;

-- Add supplier_id column if missing
ALTER TABLE public.supplier_capacity_lanes
ADD COLUMN IF NOT EXISTS supplier_id uuid;

-- Add multi-award columns to demand_intelligence_signals
ALTER TABLE public.demand_intelligence_signals
ADD COLUMN IF NOT EXISTS awarded_bid_id uuid,
ADD COLUMN IF NOT EXISTS awarded_supplier_id uuid,
ADD COLUMN IF NOT EXISTS awarded_quantity numeric,
ADD COLUMN IF NOT EXISTS awarded_value numeric,
ADD COLUMN IF NOT EXISTS parent_lane_id uuid,
ADD COLUMN IF NOT EXISTS is_partial_award boolean DEFAULT false;

-- Add SLA columns to demand_intelligence_signals
ALTER TABLE public.demand_intelligence_signals
ADD COLUMN IF NOT EXISTS expected_delivery_at timestamptz,
ADD COLUMN IF NOT EXISTS actual_delivery_at timestamptz,
ADD COLUMN IF NOT EXISTS sla_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sla_breach_hours numeric,
ADD COLUMN IF NOT EXISTS sla_notes text;

-- Create unique constraint for multi-award tracking (drop first if exists)
DROP INDEX IF EXISTS idx_lane_per_award;
CREATE UNIQUE INDEX idx_lane_per_award 
ON public.demand_intelligence_signals(converted_to_rfq_id, awarded_bid_id) 
WHERE converted_to_rfq_id IS NOT NULL AND awarded_bid_id IS NOT NULL;

-- Create index for SLA monitoring
DROP INDEX IF EXISTS idx_lane_sla_status;
CREATE INDEX idx_lane_sla_status 
ON public.demand_intelligence_signals(sla_status, expected_delivery_at)
WHERE lane_state IN ('activated', 'fulfilling');

-- Add index for capacity utilization queries
DROP INDEX IF EXISTS idx_capacity_utilization;
CREATE INDEX idx_capacity_utilization 
ON public.supplier_capacity_lanes(country, category)
WHERE active = true;

-- Update activate_lane_from_award to reserve capacity (using correct column names)
CREATE OR REPLACE FUNCTION public.activate_lane_from_award(req_id uuid, bid_id uuid)
RETURNS uuid AS $$
DECLARE
  req_record RECORD;
  bid_record RECORD;
  lane_id uuid;
  capacity_lane RECORD;
  awarded_value numeric;
  awarded_qty numeric;
BEGIN
  -- Get requirement details
  SELECT id, category, subcategory, country, delivery_location, quantity, unit
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
    100,
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

  -- Find matching capacity lane and reserve (using correct column names)
  SELECT * INTO capacity_lane
  FROM public.supplier_capacity_lanes
  WHERE country = req_record.country
    AND category = req_record.category
    AND supplier_id = bid_record.supplier_id
    AND active = true
  LIMIT 1;

  IF capacity_lane.id IS NOT NULL THEN
    -- Reserve capacity using correct column names
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
    from_state,
    to_state,
    action,
    actor_type,
    metadata
  ) VALUES (
    lane_id,
    'pending',
    'activated',
    'award_accepted',
    'system',
    jsonb_build_object(
      'requirement_id', req_id,
      'bid_id', bid_id,
      'awarded_value', awarded_value,
      'awarded_quantity', awarded_qty,
      'capacity_reserved', capacity_lane.id IS NOT NULL
    )
  );

  RETURN lane_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle partial/split awards
CREATE OR REPLACE FUNCTION public.create_partial_lane(
  req_id uuid,
  bid_id uuid,
  coverage_percent numeric DEFAULT 100
)
RETURNS uuid AS $$
DECLARE
  lane_id uuid;
  parent_lane RECORD;
  req_record RECORD;
  bid_record RECORD;
  partial_qty numeric;
  partial_value numeric;
BEGIN
  -- Get requirement
  SELECT * INTO req_record FROM public.requirements WHERE id = req_id;
  
  -- Get bid
  SELECT b.*, 
         COALESCE((SELECT SUM(bi.quantity) FROM public.bid_items bi WHERE bi.bid_id = b.id), req_record.quantity) as total_qty
  INTO bid_record
  FROM public.bids b WHERE b.id = bid_id;

  -- Calculate partial amounts
  partial_qty := (COALESCE(bid_record.total_qty, req_record.quantity, 0) * coverage_percent) / 100;
  partial_value := (COALESCE(bid_record.buyer_visible_price, 0) * coverage_percent) / 100;

  -- Find parent lane
  SELECT id INTO parent_lane
  FROM public.demand_intelligence_signals
  WHERE converted_to_rfq_id = req_id
    AND parent_lane_id IS NULL
    AND awarded_bid_id IS NULL
  LIMIT 1;

  -- Create partial lane
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
    parent_lane_id,
    is_partial_award,
    expected_delivery_at,
    sla_status
  )
  VALUES (
    'rfq_partial_award',
    req_record.category,
    req_record.subcategory,
    req_record.country,
    req_record.delivery_location,
    'buy',
    100,
    'activated',
    now(),
    partial_value,
    partial_qty,
    req_record.unit,
    req_id,
    bid_id,
    bid_record.supplier_id,
    partial_qty,
    partial_value,
    parent_lane.id,
    true,
    now() + (COALESCE(bid_record.delivery_timeline_days, 7) || ' days')::interval,
    'on_track'
  )
  RETURNING id INTO lane_id;

  -- Reserve capacity for partial award (using correct column names)
  UPDATE public.supplier_capacity_lanes
  SET allocated_quantity = COALESCE(allocated_quantity, 0) + partial_qty,
      allocated_capacity_value = COALESCE(allocated_capacity_value, 0) + partial_value,
      updated_at = now()
  WHERE country = req_record.country
    AND category = req_record.category
    AND supplier_id = bid_record.supplier_id
    AND active = true;

  RETURN lane_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron function to update SLA statuses
CREATE OR REPLACE FUNCTION public.update_lane_sla_statuses()
RETURNS void AS $$
BEGIN
  UPDATE public.demand_intelligence_signals
  SET 
    sla_status = CASE
      WHEN actual_delivery_at IS NOT NULL THEN 'delivered'
      WHEN now() > expected_delivery_at THEN 'breached'
      WHEN now() > (expected_delivery_at - interval '24 hours') THEN 'at_risk'
      WHEN now() > (expected_delivery_at - interval '48 hours') THEN 'delayed'
      ELSE 'on_track'
    END,
    sla_breach_hours = CASE
      WHEN now() > expected_delivery_at 
      THEN EXTRACT(EPOCH FROM (now() - expected_delivery_at)) / 3600
      ELSE NULL
    END,
    updated_at = now()
  WHERE lane_state IN ('activated', 'fulfilling')
    AND expected_delivery_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release capacity when lane closes
CREATE OR REPLACE FUNCTION public.release_lane_capacity()
RETURNS trigger AS $$
BEGIN
  IF NEW.lane_state IN ('closed', 'lost') 
     AND OLD.lane_state NOT IN ('closed', 'lost') THEN
    
    -- Release capacity using correct column names
    UPDATE public.supplier_capacity_lanes
    SET allocated_quantity = GREATEST(0, COALESCE(allocated_quantity, 0) - COALESCE(NEW.awarded_quantity, 0)),
        allocated_capacity_value = GREATEST(0, COALESCE(allocated_capacity_value, 0) - COALESCE(NEW.awarded_value, 0)),
        updated_at = now()
    WHERE supplier_id = NEW.awarded_supplier_id
      AND country = NEW.country
      AND category = NEW.category;

    -- Log capacity release
    INSERT INTO public.lane_capacity_events (
      lane_id,
      event_type,
      quantity_delta,
      value_delta,
      actor_type,
      metadata
    ) VALUES (
      NEW.id,
      'released',
      -COALESCE(NEW.awarded_quantity, 0),
      -COALESCE(NEW.awarded_value, 0),
      'system',
      jsonb_build_object('lane_state', NEW.lane_state, 'reason', 'lane_closed')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS release_lane_capacity_trigger ON public.demand_intelligence_signals;
CREATE TRIGGER release_lane_capacity_trigger
  AFTER UPDATE ON public.demand_intelligence_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.release_lane_capacity();