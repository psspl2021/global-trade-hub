-- Fix the trigger function with correct RAISE syntax
CREATE OR REPLACE FUNCTION validate_split_award_coverage()
RETURNS trigger AS $$
DECLARE
  total_coverage NUMERIC;
BEGIN
  -- Calculate total coverage including this new/updated row
  SELECT COALESCE(SUM(
    CASE 
      WHEN id = NEW.id THEN NEW.award_coverage_percentage
      ELSE award_coverage_percentage
    END
  ), 0)
  INTO total_coverage
  FROM public.bids
  WHERE requirement_id = NEW.requirement_id
    AND award_type = 'PARTIAL'
    AND (id = NEW.id OR award_coverage_percentage IS NOT NULL);

  IF total_coverage > 100 THEN
    RAISE EXCEPTION 'Total awarded coverage exceeds 100%% for requirement. Current total: %', total_coverage;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for split award validation
DROP TRIGGER IF EXISTS trg_validate_split_award ON public.bids;

CREATE TRIGGER trg_validate_split_award
BEFORE INSERT OR UPDATE ON public.bids
FOR EACH ROW
WHEN (NEW.award_type = 'PARTIAL')
EXECUTE FUNCTION validate_split_award_coverage();

-- Add index for efficient coverage queries
CREATE INDEX IF NOT EXISTS idx_bids_requirement_award_coverage
ON public.bids (requirement_id, award_type)
WHERE award_type IS NOT NULL;