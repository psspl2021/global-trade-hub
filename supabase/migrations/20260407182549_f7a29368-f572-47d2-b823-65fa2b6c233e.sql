
-- 1. Unique constraint to prevent duplicate bids per supplier per auction
ALTER TABLE public.reverse_auction_bids
ADD CONSTRAINT unique_supplier_auction_bid UNIQUE (auction_id, supplier_id);

-- 2. Trigger to auto-resolve supplier_id from email on invitation insert
CREATE OR REPLACE FUNCTION public.sync_supplier_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.supplier_id IS NULL AND NEW.supplier_email IS NOT NULL THEN
    SELECT id INTO NEW.supplier_id
    FROM public.profiles
    WHERE lower(email) = lower(NEW.supplier_email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_supplier_id
BEFORE INSERT ON public.reverse_auction_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.sync_supplier_id();
