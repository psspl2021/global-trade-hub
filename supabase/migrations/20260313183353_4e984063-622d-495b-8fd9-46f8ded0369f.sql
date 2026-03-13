
-- TRIGGER 1: Enforce payment before auction creation
CREATE OR REPLACE FUNCTION public.enforce_auction_payment()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.auction_payments
    WHERE buyer_id = NEW.buyer_id
      AND payment_status = 'paid'
      AND auction_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Auction payment required before creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_auction_payment
  BEFORE INSERT ON public.reverse_auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_auction_payment();

-- TRIGGER 2: Enforce at least one invited supplier before auction goes live
CREATE OR REPLACE FUNCTION public.enforce_auction_suppliers()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS DISTINCT FROM 'live') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.reverse_auction_suppliers
      WHERE auction_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'At least one supplier must be invited before auction can go live';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_auction_suppliers
  BEFORE UPDATE ON public.reverse_auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_auction_suppliers();
