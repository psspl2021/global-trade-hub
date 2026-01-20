-- ============================================================
-- MASTER MIGRATION: Deadline + Expiry Logic Fix
-- ============================================================

-- 1) FIX ALL EXISTING bidding_deadline_at VALUES
UPDATE public.requirements
SET bidding_deadline_at =
  (deadline::date + INTERVAL '1 day' - INTERVAL '1 second')
WHERE deadline IS NOT NULL;

-- 2) RE-ACTIVATE WRONGLY EXPIRED RFQs (STILL VALID TODAY)
UPDATE public.requirements
SET status = 'active'
WHERE status = 'expired'
  AND deadline IS NOT NULL
  AND deadline::date >= CURRENT_DATE;

-- 3) REPLACE: set_bidding_deadline_at TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.set_bidding_deadline_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deadline IS NOT NULL THEN
    NEW.bidding_deadline_at :=
      (NEW.deadline::date + INTERVAL '1 day' - INTERVAL '1 second');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_bidding_deadline_at_trigger ON public.requirements;

CREATE TRIGGER set_bidding_deadline_at_trigger
BEFORE INSERT OR UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.set_bidding_deadline_at();

-- 4) REPLACE: check_requirement_deadline TRIGGER FUNCTION
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

DROP TRIGGER IF EXISTS check_requirement_deadline_trigger ON public.requirements;

CREATE TRIGGER check_requirement_deadline_trigger
BEFORE UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.check_requirement_deadline();

-- 5) HARD GUARDRAIL: Ensures all future deadlines are end-of-day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bidding_deadline_must_be_end_of_day'
  ) THEN
    ALTER TABLE public.requirements
    ADD CONSTRAINT bidding_deadline_must_be_end_of_day
    CHECK (bidding_deadline_at::time = time '23:59:59');
  END IF;
END $$;