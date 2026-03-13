
-- Drop existing triggers and functions to recreate
DROP TRIGGER IF EXISTS check_auction_payment ON public.reverse_auctions;
DROP TRIGGER IF EXISTS check_auction_suppliers ON public.reverse_auctions;
DROP FUNCTION IF EXISTS public.enforce_auction_payment();
DROP FUNCTION IF EXISTS public.enforce_auction_suppliers();

-- TRIGGER 1: Enforce payment + auto-link payment to auction
CREATE OR REPLACE FUNCTION public.enforce_auction_payment()
RETURNS trigger AS $$
DECLARE
  payment_id uuid;
BEGIN
  SELECT id INTO payment_id
  FROM public.auction_payments
  WHERE buyer_id = NEW.buyer_id
    AND payment_status = 'paid'
    AND auction_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF payment_id IS NULL THEN
    RAISE EXCEPTION 'Auction payment required before creation';
  END IF;

  UPDATE public.auction_payments
  SET auction_id = NEW.id
  WHERE id = payment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_auction_payment
  BEFORE INSERT ON public.reverse_auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_auction_payment();

-- TRIGGER 2: Enforce suppliers before going live
CREATE OR REPLACE FUNCTION public.enforce_auction_suppliers()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'live' AND OLD.status <> 'live' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.reverse_auction_suppliers
      WHERE auction_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot start auction without invited suppliers';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_auction_suppliers
  BEFORE UPDATE ON public.reverse_auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_auction_suppliers();
