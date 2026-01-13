-- Drop existing triggers that we'll recreate
DROP TRIGGER IF EXISTS trg_po_lifecycle ON public.purchase_orders;
DROP TRIGGER IF EXISTS trg_enforce_contract_po_limit ON public.purchase_orders;

-- 1. HARD contract balance enforcement trigger (prevents race conditions)
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
  -- Skip if no contract_id or no po_value
  IF NEW.contract_id IS NULL OR NEW.po_value IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT contract_value
  INTO contract_limit
  FROM contracts
  WHERE id = NEW.contract_id;

  IF contract_limit IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  SELECT COALESCE(SUM(po_value), 0)
  INTO total_po_value
  FROM purchase_orders
  WHERE contract_id = NEW.contract_id
  AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF total_po_value + NEW.po_value > contract_limit THEN
    RAISE EXCEPTION
      'PO value exceeds contract limit. Remaining: %',
      contract_limit - total_po_value;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_contract_po_limit
BEFORE INSERT OR UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_contract_po_limit();

-- 2. PO lifecycle immutability trigger (works with text column)
CREATE OR REPLACE FUNCTION public.prevent_po_backward_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if po_status hasn't changed
  IF OLD.po_status = NEW.po_status THEN
    RETURN NEW;
  END IF;

  -- Validate status values
  IF NEW.po_status NOT IN ('CREATED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Invalid PO status: %', NEW.po_status;
  END IF;

  IF OLD.po_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Closed PO is immutable';
  END IF;

  IF OLD.po_status = 'DELIVERED'
     AND NEW.po_status NOT IN ('DELIVERED', 'CLOSED') THEN
    RAISE EXCEPTION 'Cannot revert DELIVERED PO';
  END IF;

  IF OLD.po_status = 'CONFIRMED'
     AND NEW.po_status = 'CREATED' THEN
    RAISE EXCEPTION 'Cannot revert CONFIRMED PO';
  END IF;

  IF OLD.po_status = 'DISPATCHED'
     AND NEW.po_status IN ('CREATED', 'CONFIRMED') THEN
    RAISE EXCEPTION 'Cannot revert DISPATCHED PO';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_po_lifecycle
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_po_backward_transition();

-- 3. Add CHECK constraint for po_value if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'purchase_orders' AND constraint_name = 'chk_po_value_positive'
  ) THEN
    ALTER TABLE public.purchase_orders 
    ADD CONSTRAINT chk_po_value_positive CHECK (po_value IS NULL OR po_value > 0);
  END IF;
END$$;