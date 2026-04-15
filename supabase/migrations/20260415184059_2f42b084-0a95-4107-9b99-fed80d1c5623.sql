
-- Step 1: Backfill existing POs — set po_value from total_amount where missing
UPDATE public.purchase_orders
SET po_value = total_amount,
    po_value_base_currency = total_amount
WHERE po_value IS NULL AND total_amount IS NOT NULL AND total_amount > 0;

-- Step 2: Backfill buyer_company_id using supplier_id match to buyer_company_members
UPDATE public.purchase_orders po
SET buyer_company_id = bcm.company_id
FROM public.buyer_company_members bcm
WHERE bcm.user_id = po.supplier_id
  AND bcm.is_active = true
  AND po.buyer_company_id IS NULL;

-- Step 3: Also try matching via created_by (for POs where created_by is set)
UPDATE public.purchase_orders po
SET buyer_company_id = bcm.company_id
FROM public.buyer_company_members bcm
WHERE bcm.user_id = po.created_by
  AND bcm.is_active = true
  AND po.buyer_company_id IS NULL;

-- Step 4: Auto-populate trigger for future POs
CREATE OR REPLACE FUNCTION public.auto_populate_po_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-set po_value from total_amount if not provided
  IF NEW.po_value IS NULL AND NEW.total_amount IS NOT NULL AND NEW.total_amount > 0 THEN
    NEW.po_value := NEW.total_amount;
  END IF;

  -- Auto-set po_value_base_currency (same as po_value for domestic, FX-adjusted for global)
  IF NEW.po_value_base_currency IS NULL AND NEW.po_value IS NOT NULL THEN
    IF NEW.exchange_rate IS NOT NULL AND NEW.exchange_rate > 0 THEN
      NEW.po_value_base_currency := NEW.po_value * NEW.exchange_rate;
    ELSE
      NEW.po_value_base_currency := NEW.po_value;
    END IF;
  END IF;

  -- Auto-set buyer_company_id from created_by user's company membership
  IF NEW.buyer_company_id IS NULL AND NEW.created_by IS NOT NULL THEN
    SELECT company_id INTO NEW.buyer_company_id
    FROM buyer_company_members
    WHERE user_id = NEW.created_by AND is_active = true
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_populate_po_fields ON public.purchase_orders;
CREATE TRIGGER trg_auto_populate_po_fields
  BEFORE INSERT OR UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_po_fields();
