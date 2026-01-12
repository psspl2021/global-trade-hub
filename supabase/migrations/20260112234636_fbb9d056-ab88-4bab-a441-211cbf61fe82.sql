-- Enhanced: One-way contract lifecycle enforcement
CREATE OR REPLACE FUNCTION public.prevent_signed_contract_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Terminated contracts are fully immutable (no changes at all)
  IF OLD.contract_status = 'TERMINATED' THEN
    RAISE EXCEPTION 'Terminated contracts are fully immutable. Contract %.', OLD.id;
  END IF;

  -- Prevent backward lifecycle movement
  IF OLD.contract_status = 'SIGNED' AND NEW.contract_status = 'DRAFT' THEN
    RAISE EXCEPTION 'Cannot revert SIGNED contract to DRAFT. Contract %.', OLD.id;
  END IF;

  IF OLD.contract_status = 'ACTIVE' AND NEW.contract_status IN ('DRAFT', 'SENT') THEN
    RAISE EXCEPTION 'Cannot revert ACTIVE contract to earlier state. Contract %.', OLD.id;
  END IF;

  -- For SIGNED contracts: allow status-only transitions, block field edits
  IF OLD.contract_status = 'SIGNED' THEN
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
'Enforces one-way contract lifecycle: DRAFT→SENT→SIGNED→ACTIVE→TERMINATED. Blocks backward transitions and field modifications on signed contracts. Audit-safe.';