-- Add no-op guard to prevent pointless updates
CREATE OR REPLACE FUNCTION public.enforce_boost_only_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- GUARD: Prevent no-op updates (spam protection, audit clarity)
  IF
    NEW.is_boosted = OLD.is_boosted
    AND NEW.boost_expires_at IS NOT DISTINCT FROM OLD.boost_expires_at
  THEN
    RETURN OLD; -- Skip update entirely
  END IF;

  -- Allow changes only to boost fields
  -- Revert any attempted changes to protected AI fields
  NEW.match_score := OLD.match_score;
  NEW.location_proximity := OLD.location_proximity;
  NEW.historical_acceptance := OLD.historical_acceptance;
  NEW.ai_version := OLD.ai_version;
  NEW.matching_rfq_count := OLD.matching_rfq_count;
  NEW.supplier_city := OLD.supplier_city;
  NEW.last_calculated_at := OLD.last_calculated_at;
  NEW.recalculation_locked_until := OLD.recalculation_locked_until;
  NEW.product_id := OLD.product_id;
  NEW.supplier_id := OLD.supplier_id;
  NEW.created_at := OLD.created_at;
  
  -- Only these can change: is_boosted, boost_expires_at, updated_at
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_boost_only_update IS 'Prevents suppliers from modifying AI-calculated fields and blocks no-op updates';