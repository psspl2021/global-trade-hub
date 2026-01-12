-- 1️⃣ Prevent NULL coverage for PARTIAL contracts
ALTER TABLE public.contracts
ADD CONSTRAINT chk_partial_requires_coverage CHECK (
  contract_type = 'FULL' OR coverage_percentage IS NOT NULL
);

-- 2️⃣ Enforce immutability after SIGNED
CREATE OR REPLACE FUNCTION public.prevent_signed_contract_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.contract_status = 'SIGNED' THEN
    RAISE EXCEPTION 'Signed contracts are immutable. Cannot modify contract %.', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_signed_contract_edit
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_signed_contract_edit();

COMMENT ON FUNCTION public.prevent_signed_contract_edit() IS 
'Prevents any modification to contracts once they reach SIGNED status. Ensures legal immutability.';