-- Gap 1: Validate purchaser belongs to same company as buyer
CREATE OR REPLACE FUNCTION public.validate_rfq_purchaser()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_company uuid;
  v_purchaser_company uuid;
BEGIN
  -- Allow if purchaser equals buyer (self-attribution always valid)
  IF NEW.purchaser_id = NEW.buyer_id THEN
    RETURN NEW;
  END IF;

  -- Resolve buyer's company (first active membership)
  SELECT company_id INTO v_buyer_company
  FROM public.buyer_company_members
  WHERE user_id = NEW.buyer_id
    AND is_active = true
  LIMIT 1;

  -- If buyer has no company membership, allow (solo buyer case)
  IF v_buyer_company IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verify purchaser belongs to same company
  SELECT company_id INTO v_purchaser_company
  FROM public.buyer_company_members
  WHERE user_id = NEW.purchaser_id
    AND company_id = v_buyer_company
    AND is_active = true
  LIMIT 1;

  IF v_purchaser_company IS NULL THEN
    RAISE EXCEPTION 'Invalid purchaser selection: purchaser % does not belong to company %', NEW.purchaser_id, v_buyer_company;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_rfq_purchaser ON public.requirements;
CREATE TRIGGER trg_validate_rfq_purchaser
BEFORE INSERT OR UPDATE OF purchaser_id ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.validate_rfq_purchaser();

-- Gap 3: Defensive DB-layer default (purchaser falls back to buyer via existing trg_rfq_purchaser_default trigger)
-- Already handled by trg_rfq_purchaser_default — no SQL DEFAULT possible since it references another column.

-- Gap 4: Audit clarity
COMMENT ON COLUMN public.requirements.buyer_id IS 'User who created the RFQ (system origin / identity)';
COMMENT ON COLUMN public.requirements.purchaser_id IS 'User responsible for execution and operational ownership (acting purchaser)';
COMMENT ON COLUMN public.purchase_orders.purchaser_id IS 'Inherited from parent RFQ — operational owner of this PO';