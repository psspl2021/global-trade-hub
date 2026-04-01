
-- 1. Add unique index on slug to prevent race-condition duplicates
CREATE UNIQUE INDEX IF NOT EXISTS demand_generated_slug_unique ON public.demand_generated(slug);

-- 2. Add generation status workflow column (pending → active → failed)
-- The column already exists with default 'active', so we just need to ensure it supports the workflow
-- Add a check via trigger for valid statuses
CREATE OR REPLACE FUNCTION public.validate_demand_generated_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'active', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be pending, active, or failed.', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_demand_generated_status ON public.demand_generated;
CREATE TRIGGER trg_validate_demand_generated_status
  BEFORE INSERT OR UPDATE ON public.demand_generated
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_demand_generated_status();
