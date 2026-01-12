-- Fix the trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.validate_split_award_coverage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;