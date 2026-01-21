
-- =============================================================
-- CRITICAL FIX #1 & #2: Race-safe capacity reservation with lock
-- UPGRADE B: Capacity snapshot in lanes
-- =============================================================

-- Add capacity snapshot columns to demand_intelligence_signals (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'demand_intelligence_signals' 
                 AND column_name = 'capacity_lane_id') THEN
    ALTER TABLE public.demand_intelligence_signals
    ADD COLUMN capacity_lane_id uuid REFERENCES public.supplier_capacity_lanes(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'demand_intelligence_signals' 
                 AND column_name = 'capacity_utilization_at_award') THEN
    ALTER TABLE public.demand_intelligence_signals
    ADD COLUMN capacity_utilization_at_award numeric;
  END IF;
END $$;

-- Drop and recreate the function with FOR UPDATE lock and capacity check
CREATE OR REPLACE FUNCTION public.activate_lane_from_award()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_record RECORD;
  bid_record RECORD;
  awarded_value numeric;
  awarded_qty numeric;
  capacity_lane RECORD;
  remaining_capacity numeric;
BEGIN
  -- Only trigger on award status changes
  IF NEW.status = 'awarded' AND (OLD.status IS NULL OR OLD.status != 'awarded') THEN
    
    -- Get requirement details
    SELECT * INTO req_record FROM public.requirements WHERE id = NEW.requirement_id;
    
    -- Get bid details
    SELECT * INTO bid_record FROM public.bids WHERE id = NEW.id;
    
    -- Calculate awarded value and quantity
    awarded_value := COALESCE(NEW.buyer_visible_price, NEW.total_amount, 0);
    awarded_qty := COALESCE(NEW.dispatched_qty, 0);
    
    -- Find and LOCK the capacity lane (CRITICAL: FOR UPDATE prevents race conditions)
    SELECT * INTO capacity_lane
    FROM public.supplier_capacity_lanes
    WHERE country = req_record.country
      AND category = req_record.category
      AND supplier_id = NEW.supplier_id
      AND active = true
    FOR UPDATE
    LIMIT 1;
    
    IF capacity_lane.id IS NOT NULL THEN
      -- Calculate remaining capacity
      remaining_capacity := COALESCE(capacity_lane.monthly_capacity_value, 0) 
                          - COALESCE(capacity_lane.allocated_capacity_value, 0);
      
      -- CRITICAL FIX #2: Block if insufficient capacity
      IF remaining_capacity < awarded_value THEN
        RAISE EXCEPTION 'Insufficient capacity for supplier % in % / %. Remaining: %, Required: %',
          NEW.supplier_id, req_record.country, req_record.category, remaining_capacity, awarded_value;
      END IF;
      
      -- Reserve capacity
      UPDATE public.supplier_capacity_lanes
      SET 
        allocated_capacity_value = COALESCE(allocated_capacity_value, 0) + awarded_value,
        allocated_quantity = COALESCE(allocated_quantity, 0) + awarded_qty,
        utilization_percent = CASE 
          WHEN COALESCE(monthly_capacity_value, 0) > 0 
          THEN ROUND(((COALESCE(allocated_capacity_value, 0) + awarded_value) / monthly_capacity_value) * 100, 2)
          ELSE 0 
        END,
        updated_at = now()
      WHERE id = capacity_lane.id;
      
      -- Log the capacity event
      INSERT INTO public.lane_capacity_events (
        lane_id,
        capacity_lane_id,
        event_type,
        previous_allocated,
        new_allocated,
        quantity_delta,
        value_delta,
        actor_type,
        actor_id,
        metadata
      ) VALUES (
        NULL,
        capacity_lane.id,
        'reservation',
        capacity_lane.allocated_capacity_value,
        COALESCE(capacity_lane.allocated_capacity_value, 0) + awarded_value,
        awarded_qty,
        awarded_value,
        'system',
        NEW.supplier_id,
        jsonb_build_object(
          'bid_id', NEW.id,
          'requirement_id', NEW.requirement_id,
          'awarded_value', awarded_value,
          'awarded_qty', awarded_qty,
          'remaining_after', remaining_capacity - awarded_value
        )
      );
    END IF;
    
    -- Update any linked demand intelligence signal with capacity snapshot
    UPDATE public.demand_intelligence_signals
    SET 
      lane_state = 'activated',
      activated_at = now(),
      awarded_bid_id = NEW.id,
      awarded_supplier_id = NEW.supplier_id,
      awarded_value = awarded_value,
      awarded_quantity = awarded_qty,
      capacity_lane_id = capacity_lane.id,
      capacity_utilization_at_award = capacity_lane.utilization_percent,
      updated_at = now()
    WHERE converted_to_rfq_id = NEW.requirement_id
      AND lane_state IN ('discovered', 'qualified', 'rfq_sent');
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- =============================================================
-- UPGRADE A: Unique constraint - one active lane per supplier/market
-- =============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_capacity_lane
ON public.supplier_capacity_lanes(supplier_id, country, category)
WHERE active = true;
