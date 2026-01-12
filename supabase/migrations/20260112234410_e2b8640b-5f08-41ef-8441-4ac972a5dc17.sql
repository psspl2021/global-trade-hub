-- Refined: Allow status transitions on SIGNED contracts, block field edits
CREATE OR REPLACE FUNCTION public.prevent_signed_contract_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.contract_status = 'SIGNED' THEN
    -- Allow status-only transitions (e.g., SIGNED → ACTIVE → TERMINATED)
    IF NEW.contract_status IS DISTINCT FROM OLD.contract_status
       AND (NEW.requirement_id IS NOT DISTINCT FROM OLD.requirement_id)
       AND (NEW.bid_id IS NOT DISTINCT FROM OLD.bid_id)
       AND (NEW.supplier_id IS NOT DISTINCT FROM OLD.supplier_id)
       AND (NEW.buyer_id IS NOT DISTINCT FROM OLD.buyer_id)
       AND (NEW.contract_type IS NOT DISTINCT FROM OLD.contract_type)
       AND (NEW.contract_value IS NOT DISTINCT FROM OLD.contract_value)
       AND (NEW.coverage_percentage IS NOT DISTINCT FROM OLD.coverage_percentage)
       AND (NEW.currency IS NOT DISTINCT FROM OLD.currency)
       AND (NEW.signed_at IS NOT DISTINCT FROM OLD.signed_at) THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION
      'Signed contracts are immutable except for status transitions. Contract %.',
      OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_signed_contract_edit() IS 
'Allows status transitions (SIGNED→ACTIVE→TERMINATED) but blocks all other field modifications on signed contracts. Enterprise-grade legal immutability.';