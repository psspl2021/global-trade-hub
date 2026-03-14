
-- Refinement #1: Add consumed_at for audit/revenue reporting
ALTER TABLE public.auction_payments
ADD COLUMN IF NOT EXISTS consumed_at timestamptz;

-- Refinement #2: Lifecycle constraint
ALTER TABLE public.auction_payments
DROP CONSTRAINT IF EXISTS valid_payment_lifecycle;

ALTER TABLE public.auction_payments
ADD CONSTRAINT valid_payment_lifecycle
CHECK (payment_status IN ('pending', 'paid', 'consumed'));

-- Update trigger to set consumed_at
CREATE OR REPLACE FUNCTION public.enforce_auction_payment()
RETURNS trigger AS $$
DECLARE
  payment_id uuid;
BEGIN
  SELECT id INTO payment_id
  FROM public.auction_payments
  WHERE buyer_id = NEW.buyer_id
    AND payment_status = 'paid'
    AND transaction_type = 'reverse_auction'
    AND auction_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF payment_id IS NULL THEN
    RAISE EXCEPTION 'Auction payment required before creation';
  END IF;

  UPDATE public.auction_payments
  SET auction_id = NEW.id,
      payment_status = 'consumed',
      consumed_at = now()
  WHERE id = payment_id
    AND auction_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction payment already used';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
