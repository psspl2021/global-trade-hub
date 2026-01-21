-- Add 'expired' to the logistics_requirement_status enum
ALTER TYPE public.logistics_requirement_status ADD VALUE IF NOT EXISTS 'expired';

-- Add effective_state column to requirements
ALTER TABLE public.requirements
ADD COLUMN IF NOT EXISTS effective_state TEXT;

-- Add effective_state column to logistics_requirements
ALTER TABLE public.logistics_requirements
ADD COLUMN IF NOT EXISTS effective_state TEXT;

-- Create indexes for fast filtering on effective_state
CREATE INDEX IF NOT EXISTS idx_requirements_effective_state ON public.requirements(effective_state);
CREATE INDEX IF NOT EXISTS idx_logistics_requirements_effective_state ON public.logistics_requirements(effective_state);

-- Create function to compute and update effective_state for requirements
CREATE OR REPLACE FUNCTION public.update_requirement_effective_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.effective_state := CASE 
    WHEN NEW.buyer_closure_status = 'closed' THEN 'closed'
    WHEN NEW.status = 'awarded' THEN 'awarded'
    WHEN NEW.status = 'expired' AND NEW.buyer_closure_status = 'open' THEN 'expired_soft'
    WHEN NEW.status = 'active' AND NEW.buyer_closure_status = 'open' THEN 'active'
    ELSE NEW.status::TEXT
  END;
  RETURN NEW;
END;
$$;

-- Create function to compute and update effective_state for logistics
CREATE OR REPLACE FUNCTION public.update_logistics_requirement_effective_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.effective_state := CASE 
    WHEN NEW.buyer_closure_status = 'closed' THEN 'closed'
    WHEN NEW.status::TEXT = 'closed' THEN 'awarded'
    WHEN NEW.status::TEXT = 'expired' AND NEW.buyer_closure_status = 'open' THEN 'expired_soft'
    WHEN NEW.status::TEXT = 'active' AND NEW.buyer_closure_status = 'open' THEN 'active'
    ELSE NEW.status::TEXT
  END;
  RETURN NEW;
END;
$$;

-- Create triggers for automatic effective_state updates
DROP TRIGGER IF EXISTS update_requirement_effective_state_trigger ON public.requirements;
CREATE TRIGGER update_requirement_effective_state_trigger
BEFORE INSERT OR UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_requirement_effective_state();

DROP TRIGGER IF EXISTS update_logistics_requirement_effective_state_trigger ON public.logistics_requirements;
CREATE TRIGGER update_logistics_requirement_effective_state_trigger
BEFORE INSERT OR UPDATE ON public.logistics_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_logistics_requirement_effective_state();

-- Backfill effective_state for existing rows
UPDATE public.requirements
SET effective_state = CASE 
  WHEN buyer_closure_status = 'closed' THEN 'closed'
  WHEN status = 'awarded' THEN 'awarded'
  WHEN status = 'expired' AND buyer_closure_status = 'open' THEN 'expired_soft'
  WHEN status = 'active' AND buyer_closure_status = 'open' THEN 'active'
  ELSE status::TEXT
END
WHERE effective_state IS NULL;

UPDATE public.logistics_requirements
SET effective_state = CASE 
  WHEN buyer_closure_status = 'closed' THEN 'closed'
  WHEN status::TEXT = 'closed' THEN 'awarded'
  WHEN status::TEXT = 'expired' AND buyer_closure_status = 'open' THEN 'expired_soft'
  WHEN status::TEXT = 'active' AND buyer_closure_status = 'open' THEN 'active'
  ELSE status::TEXT
END
WHERE effective_state IS NULL;

-- Admin hard kill switch function (for fraud/abuse cases)
CREATE OR REPLACE FUNCTION public.admin_force_close_requirement(
  p_requirement_id UUID,
  p_reason TEXT DEFAULT 'Admin action'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Force close the requirement
  UPDATE public.requirements
  SET 
    buyer_closure_status = 'closed',
    status = 'cancelled'
  WHERE id = p_requirement_id;

  -- Log the event
  INSERT INTO public.requirement_events (
    requirement_id,
    old_status,
    new_status,
    old_buyer_closure_status,
    new_buyer_closure_status,
    actor,
    notes
  )
  SELECT 
    id,
    status,
    'cancelled',
    buyer_closure_status,
    'closed',
    'admin',
    p_reason
  FROM public.requirements
  WHERE id = p_requirement_id;
END;
$$;

-- Admin hard kill switch function for logistics
CREATE OR REPLACE FUNCTION public.admin_force_close_logistics_requirement(
  p_requirement_id UUID,
  p_reason TEXT DEFAULT 'Admin action'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Force close the logistics requirement
  UPDATE public.logistics_requirements
  SET 
    buyer_closure_status = 'closed',
    status = 'cancelled'
  WHERE id = p_requirement_id;

  -- Log the event
  INSERT INTO public.logistics_requirement_events (
    requirement_id,
    old_status,
    new_status,
    old_buyer_closure_status,
    new_buyer_closure_status,
    actor,
    notes
  )
  SELECT 
    id,
    status::TEXT,
    'cancelled',
    buyer_closure_status,
    'closed',
    'admin',
    p_reason
  FROM public.logistics_requirements
  WHERE id = p_requirement_id;
END;
$$;