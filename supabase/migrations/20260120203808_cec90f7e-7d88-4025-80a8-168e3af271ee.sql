-- FIX: Timezone double-shift bug in deadline calculation
-- Use simple interval math instead of AT TIME ZONE gymnastics

-- 1. Fix the set_bidding_deadline_at trigger function
CREATE OR REPLACE FUNCTION public.set_bidding_deadline_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.bidding_deadline_at IS NULL AND NEW.deadline IS NOT NULL THEN
    -- End of deadline day: 23:59:59 (no timezone conversion)
    NEW.bidding_deadline_at :=
      (NEW.deadline::date + INTERVAL '1 day' - INTERVAL '1 second');
  END IF;

  RETURN NEW;
END;
$$;

-- 2. The check_requirement_deadline function stays the same (already correct)
CREATE OR REPLACE FUNCTION public.check_requirement_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active'
     AND NEW.bidding_deadline_at IS NOT NULL
     AND NEW.bidding_deadline_at < now() THEN
    NEW.status := 'expired';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Backfill all existing requirements with correct deadline calculation
UPDATE public.requirements
SET bidding_deadline_at =
  (deadline::date + INTERVAL '1 day' - INTERVAL '1 second')
WHERE deadline IS NOT NULL;