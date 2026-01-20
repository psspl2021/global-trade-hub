-- Add buyer-controlled closure column
ALTER TABLE public.requirements
ADD COLUMN IF NOT EXISTS buyer_closure_status TEXT
CHECK (buyer_closure_status IN ('open', 'closed'))
DEFAULT 'open';

-- Set existing requirements to 'open' if null
UPDATE public.requirements
SET buyer_closure_status = 'open'
WHERE buyer_closure_status IS NULL;

-- Create the canonical effective state resolver function
CREATE OR REPLACE FUNCTION public.get_effective_requirement_state(r public.requirements)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Buyer explicitly closed → always closed
  IF r.buyer_closure_status = 'closed' THEN
    RETURN 'closed';
  END IF;

  -- Awarded → terminal
  IF r.status = 'awarded' THEN
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
  RETURN r.status;
END;
$$;

-- Create trigger function to prevent awards if buyer closed
CREATE OR REPLACE FUNCTION public.prevent_award_if_buyer_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'awarded'
     AND OLD.buyer_closure_status = 'closed' THEN
    RAISE EXCEPTION 'Cannot award RFQ: buyer has closed this requirement';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS prevent_award_if_buyer_closed_trigger ON public.requirements;

CREATE TRIGGER prevent_award_if_buyer_closed_trigger
BEFORE UPDATE ON public.requirements
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM 'awarded')
EXECUTE FUNCTION public.prevent_award_if_buyer_closed();

-- Add requirement_events table for audit logging
CREATE TABLE IF NOT EXISTS public.requirement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid REFERENCES public.requirements(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  old_buyer_closure_status TEXT,
  new_buyer_closure_status TEXT,
  actor TEXT, -- 'buyer' | 'system' | 'admin' | 'ai'
  notes TEXT,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on requirement_events
ALTER TABLE public.requirement_events ENABLE ROW LEVEL SECURITY;

-- Buyers can view events for their own requirements
CREATE POLICY "Buyers can view their requirement events"
ON public.requirement_events
FOR SELECT
USING (
  requirement_id IN (
    SELECT id FROM public.requirements WHERE buyer_id = auth.uid()
  )
);

-- Buyers can insert events for their own requirements
CREATE POLICY "Buyers can log events for their requirements"
ON public.requirement_events
FOR INSERT
WITH CHECK (
  requirement_id IN (
    SELECT id FROM public.requirements WHERE buyer_id = auth.uid()
  )
);

-- Create trigger function to auto-log requirement state changes
CREATE OR REPLACE FUNCTION public.log_requirement_state_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if status or buyer_closure_status changed
  IF (OLD.status IS DISTINCT FROM NEW.status) OR 
     (OLD.buyer_closure_status IS DISTINCT FROM NEW.buyer_closure_status) THEN
    INSERT INTO public.requirement_events (
      requirement_id,
      old_status,
      new_status,
      old_buyer_closure_status,
      new_buyer_closure_status,
      actor,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
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
DROP TRIGGER IF EXISTS log_requirement_state_change_trigger ON public.requirements;

CREATE TRIGGER log_requirement_state_change_trigger
AFTER UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.log_requirement_state_change();