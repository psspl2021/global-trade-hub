-- 1. Contract balance + ACTIVE enforcement (corrected)
CREATE OR REPLACE FUNCTION public.enforce_contract_po_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_po_value numeric;
  contract_limit numeric;
BEGIN
  IF NEW.contract_id IS NULL OR NEW.po_value IS NULL THEN
    RETURN NEW;
  END IF;

  -- Enforce ACTIVE contract
  IF NOT EXISTS (
    SELECT 1
    FROM contracts
    WHERE id = NEW.contract_id
      AND contract_status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION
      'POs can only be created or updated for ACTIVE contracts';
  END IF;

  SELECT contract_value
  INTO contract_limit
  FROM contracts
  WHERE id = NEW.contract_id;

  SELECT COALESCE(SUM(po_value), 0)
  INTO total_po_value
  FROM purchase_orders
  WHERE contract_id = NEW.contract_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Adjust for UPDATE (subtract old value when updating same contract)
  IF TG_OP = 'UPDATE' AND OLD.contract_id = NEW.contract_id THEN
    total_po_value := total_po_value - COALESCE(OLD.po_value, 0);
  END IF;

  IF total_po_value + NEW.po_value > contract_limit THEN
    RAISE EXCEPTION
      'PO value exceeds contract limit. Remaining: %',
      contract_limit - total_po_value;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. PO lifecycle immutability (corrected - CANCELLED is now terminal)
CREATE OR REPLACE FUNCTION public.prevent_po_backward_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.po_status = NEW.po_status THEN
    RETURN NEW;
  END IF;

  -- Validate status values
  IF NEW.po_status NOT IN ('CREATED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Invalid PO status: %', NEW.po_status;
  END IF;

  -- Terminal states - CLOSED and CANCELLED are immutable
  IF OLD.po_status IN ('CLOSED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Terminal PO is immutable (status: %)', OLD.po_status;
  END IF;

  -- Prevent backward transitions
  IF OLD.po_status = 'DELIVERED'
     AND NEW.po_status NOT IN ('DELIVERED', 'CLOSED') THEN
    RAISE EXCEPTION 'Cannot revert DELIVERED PO';
  END IF;

  IF OLD.po_status = 'DISPATCHED'
     AND NEW.po_status IN ('CREATED', 'CONFIRMED') THEN
    RAISE EXCEPTION 'Cannot revert DISPATCHED PO';
  END IF;

  IF OLD.po_status = 'CONFIRMED'
     AND NEW.po_status = 'CREATED' THEN
    RAISE EXCEPTION 'Cannot revert CONFIRMED PO';
  END IF;

  RETURN NEW;
END;
$$;