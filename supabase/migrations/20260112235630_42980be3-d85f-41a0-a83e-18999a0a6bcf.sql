-- Enhance existing purchase_orders table with contract linkage
-- Add contract_id and related columns (nullable for backward compatibility)
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS requirement_id UUID REFERENCES public.requirements(id),
ADD COLUMN IF NOT EXISTS po_value NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS po_status TEXT DEFAULT 'CREATED',
ADD COLUMN IF NOT EXISTS delivery_due_date DATE,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_po_contract ON public.purchase_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_po_requirement ON public.purchase_orders(requirement_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(po_status);

-- PO Audit Logs (for contract-linked POs)
CREATE TABLE IF NOT EXISTS public.po_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.po_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and recreate
DROP POLICY IF EXISTS "Admins view PO audit logs" ON public.po_audit_logs;
CREATE POLICY "Admins view PO audit logs"
ON public.po_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND business_type = 'admin'
  )
);

-- Validate PO Against Contract (only for contract-linked POs)
CREATE OR REPLACE FUNCTION public.validate_po_against_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_contract_value NUMERIC;
  v_contract_status TEXT;
  v_used_value NUMERIC;
BEGIN
  -- Skip validation if no contract_id (legacy POs)
  IF NEW.contract_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch contract details
  SELECT contract_value, contract_status
  INTO v_contract_value, v_contract_status
  FROM public.contracts
  WHERE id = NEW.contract_id;

  -- Contract must exist
  IF v_contract_status IS NULL THEN
    RAISE EXCEPTION 'Contract not found: %', NEW.contract_id;
  END IF;

  -- Contract must be ACTIVE
  IF v_contract_status != 'ACTIVE' THEN
    RAISE EXCEPTION 'POs can only be created against ACTIVE contracts. Contract status: %', v_contract_status;
  END IF;

  -- Calculate used value (exclude current PO if updating)
  SELECT COALESCE(SUM(COALESCE(po_value, total_amount)), 0)
  INTO v_used_value
  FROM public.purchase_orders
  WHERE contract_id = NEW.contract_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Check remaining balance
  IF v_used_value + COALESCE(NEW.po_value, NEW.total_amount) > v_contract_value THEN
    RAISE EXCEPTION
      'PO value exceeds remaining contract balance. Remaining: %, Requested: %',
      v_contract_value - v_used_value, COALESCE(NEW.po_value, NEW.total_amount);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_po_against_contract() IS 
'Validates contract-linked POs: contract must be ACTIVE, total PO value cannot exceed contract value. Skips validation for legacy POs without contract_id.';

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS trg_validate_po ON public.purchase_orders;
CREATE TRIGGER trg_validate_po
BEFORE INSERT OR UPDATE OF po_value, total_amount, contract_id ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_po_against_contract();

-- Prevent PO Edits After Fulfillment
CREATE OR REPLACE FUNCTION public.prevent_fulfilled_po_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Check both old status column and new po_status
  IF OLD.po_status IN ('FULFILLED', 'CANCELLED') THEN
    RAISE EXCEPTION 'PO is finalized and cannot be modified. PO %.', OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_final_po ON public.purchase_orders;
CREATE TRIGGER trg_lock_final_po
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
WHEN (OLD.po_status IS NOT NULL)
EXECUTE FUNCTION public.prevent_fulfilled_po_edit();

COMMENT ON FUNCTION public.prevent_fulfilled_po_edit() IS 
'Prevents modifications to FULFILLED or CANCELLED purchase orders.';

-- Log PO Status Changes
CREATE OR REPLACE FUNCTION public.log_po_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.po_status IS DISTINCT FROM NEW.po_status AND NEW.po_status IS NOT NULL THEN
    INSERT INTO public.po_audit_logs (po_id, action, metadata, created_by)
    VALUES (
      NEW.id,
      'STATUS_CHANGE',
      jsonb_build_object(
        'old_status', OLD.po_status,
        'new_status', NEW.po_status,
        'timestamp', now()
      ),
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_po_status ON public.purchase_orders;
CREATE TRIGGER trg_log_po_status
AFTER UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.log_po_status_change();

COMMENT ON FUNCTION public.log_po_status_change() IS 
'Logs all PO status transitions for audit trail.';