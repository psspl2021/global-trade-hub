-- Add buyer-controlled closure column to logistics_requirements
ALTER TABLE public.logistics_requirements
ADD COLUMN IF NOT EXISTS buyer_closure_status TEXT
CHECK (buyer_closure_status IN ('open', 'closed'))
DEFAULT 'open';

-- Set existing logistics requirements to 'open' if null
UPDATE public.logistics_requirements
SET buyer_closure_status = 'open'
WHERE buyer_closure_status IS NULL;

-- Add bidding_deadline_at column for logistics (mirrors delivery_deadline with time)
ALTER TABLE public.logistics_requirements
ADD COLUMN IF NOT EXISTS bidding_deadline_at TIMESTAMPTZ;

-- Backfill bidding_deadline_at from delivery_deadline (end of day)
UPDATE public.logistics_requirements
SET bidding_deadline_at = (delivery_deadline::date + INTERVAL '1 day' - INTERVAL '1 second')
WHERE bidding_deadline_at IS NULL AND delivery_deadline IS NOT NULL;

-- Create the canonical effective state resolver function for logistics
CREATE OR REPLACE FUNCTION public.get_effective_logistics_state(r public.logistics_requirements)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  -- Buyer explicitly closed → always closed
  IF r.buyer_closure_status = 'closed' THEN
    RETURN 'closed';
  END IF;

  -- Awarded (status = 'closed' in old logic means awarded)
  IF r.status = 'closed' THEN
    RETURN 'awarded';
  END IF;

  -- Expired but buyer still open → soft-expired (can re-open)
  IF r.status = 'expired' AND r.buyer_closure_status = 'open' THEN
    RETURN 'expired_soft';
  END IF;

  -- Active + buyer open → tradable
  IF r.status = 'active' AND r.buyer_closure_status = 'open' THEN
    RETURN 'active';
  END IF;

  -- Fallback to system status
  RETURN r.status::TEXT;
END;
$$;

-- Create trigger function to prevent awards if buyer closed logistics requirement
CREATE OR REPLACE FUNCTION public.prevent_logistics_award_if_buyer_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'closed'
     AND OLD.buyer_closure_status = 'closed' THEN
    RAISE EXCEPTION 'Cannot award logistics requirement: buyer has closed this requirement';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS prevent_logistics_award_if_buyer_closed_trigger ON public.logistics_requirements;

CREATE TRIGGER prevent_logistics_award_if_buyer_closed_trigger
BEFORE UPDATE ON public.logistics_requirements
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM 'closed')
EXECUTE FUNCTION public.prevent_logistics_award_if_buyer_closed();

-- Create logistics_requirement_events table for audit logging
CREATE TABLE IF NOT EXISTS public.logistics_requirement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid REFERENCES public.logistics_requirements(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  old_buyer_closure_status TEXT,
  new_buyer_closure_status TEXT,
  actor TEXT, -- 'buyer' | 'system' | 'admin'
  notes TEXT,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on logistics_requirement_events
ALTER TABLE public.logistics_requirement_events ENABLE ROW LEVEL SECURITY;

-- Buyers can view events for their own logistics requirements
CREATE POLICY "Buyers can view their logistics requirement events"
ON public.logistics_requirement_events
FOR SELECT
USING (
  requirement_id IN (
    SELECT id FROM public.logistics_requirements WHERE customer_id = auth.uid()
  )
);

-- Buyers can insert events for their own logistics requirements
CREATE POLICY "Buyers can log events for their logistics requirements"
ON public.logistics_requirement_events
FOR INSERT
WITH CHECK (
  requirement_id IN (
    SELECT id FROM public.logistics_requirements WHERE customer_id = auth.uid()
  )
);

-- Create trigger function to auto-log logistics requirement state changes
CREATE OR REPLACE FUNCTION public.log_logistics_requirement_state_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if status or buyer_closure_status changed
  IF (OLD.status IS DISTINCT FROM NEW.status) OR 
     (OLD.buyer_closure_status IS DISTINCT FROM NEW.buyer_closure_status) THEN
    INSERT INTO public.logistics_requirement_events (
      requirement_id,
      old_status,
      new_status,
      old_buyer_closure_status,
      new_buyer_closure_status,
      actor,
      notes
    ) VALUES (
      NEW.id,
      OLD.status::TEXT,
      NEW.status::TEXT,
      OLD.buyer_closure_status,
      NEW.buyer_closure_status,
      CASE 
        WHEN auth.uid() IS NOT NULL THEN 'buyer'
        ELSE 'system'
      END,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-logging
DROP TRIGGER IF EXISTS log_logistics_requirement_state_change_trigger ON public.logistics_requirements;

CREATE TRIGGER log_logistics_requirement_state_change_trigger
AFTER UPDATE ON public.logistics_requirements
FOR EACH ROW
EXECUTE FUNCTION public.log_logistics_requirement_state_change();