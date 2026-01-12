-- Hardening: Prevent mixing FULL + PARTIAL awards on the same requirement
-- This ensures award type consistency per requirement

CREATE OR REPLACE FUNCTION public.prevent_mixed_award_types()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only check if this bid is being awarded
  IF NEW.award_type IS NOT NULL THEN
    -- Check if trying to add FULL when PARTIAL exists
    IF NEW.award_type = 'FULL' AND EXISTS (
      SELECT 1 FROM public.bids
      WHERE requirement_id = NEW.requirement_id
        AND award_type = 'PARTIAL'
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot grant FULL award when PARTIAL awards already exist for requirement %', NEW.requirement_id;
    END IF;

    -- Check if trying to add PARTIAL when FULL exists
    IF NEW.award_type = 'PARTIAL' AND EXISTS (
      SELECT 1 FROM public.bids
      WHERE requirement_id = NEW.requirement_id
        AND award_type = 'FULL'
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot grant PARTIAL award when a FULL award already exists for requirement %', NEW.requirement_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to enforce award type consistency
DROP TRIGGER IF EXISTS trg_prevent_mixed_award_types ON public.bids;
CREATE TRIGGER trg_prevent_mixed_award_types
  BEFORE INSERT OR UPDATE OF award_type ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_mixed_award_types();

-- Add comment for documentation
COMMENT ON FUNCTION public.prevent_mixed_award_types() IS 'Prevents mixing FULL and PARTIAL award types on the same requirement for procurement integrity';