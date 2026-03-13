
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
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF payment_id IS NULL THEN
    RAISE EXCEPTION 'Auction payment required before creation';
  END IF;

  UPDATE public.auction_payments
  SET auction_id = NEW.id
  WHERE id = payment_id
    AND auction_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment already used by another auction';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
