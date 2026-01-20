-- Add proper bidding deadline timestamp column
ALTER TABLE public.requirements 
ADD COLUMN IF NOT EXISTS bidding_deadline_at timestamptz;

-- Populate from existing deadline (set to end of day IST = 23:59:59)
UPDATE public.requirements
SET bidding_deadline_at = 
  (deadline::date + time '23:59:59') AT TIME ZONE 'Asia/Kolkata'
WHERE bidding_deadline_at IS NULL AND deadline IS NOT NULL;

-- Auto-expire requirements past deadline
UPDATE public.requirements
SET status = 'expired'
WHERE bidding_deadline_at < now()
  AND status = 'active';

-- Create trigger to auto-expire requirements on deadline
CREATE OR REPLACE FUNCTION public.check_requirement_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a requirement is being read/updated, check if it should be expired
  IF NEW.status = 'active' AND NEW.bidding_deadline_at IS NOT NULL AND NEW.bidding_deadline_at < now() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on update
DROP TRIGGER IF EXISTS check_requirement_deadline_trigger ON public.requirements;
CREATE TRIGGER check_requirement_deadline_trigger
  BEFORE UPDATE ON public.requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.check_requirement_deadline();

-- Also set bidding_deadline_at automatically on insert if deadline is provided
CREATE OR REPLACE FUNCTION public.set_bidding_deadline_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.bidding_deadline_at IS NULL AND NEW.deadline IS NOT NULL THEN
    NEW.bidding_deadline_at := (NEW.deadline::date + time '23:59:59') AT TIME ZONE 'Asia/Kolkata';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_bidding_deadline_at_trigger ON public.requirements;
CREATE TRIGGER set_bidding_deadline_at_trigger
  BEFORE INSERT OR UPDATE ON public.requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_bidding_deadline_at();