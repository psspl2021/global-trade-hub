
-- Update enforce_auction_payment with row locking for concurrency safety
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
  WHERE id = payment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unique index: one unlinked paid payment per buyer at a time
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_auction_per_payment
  ON public.auction_payments(buyer_id)
  WHERE auction_id IS NULL AND payment_status = 'paid';
