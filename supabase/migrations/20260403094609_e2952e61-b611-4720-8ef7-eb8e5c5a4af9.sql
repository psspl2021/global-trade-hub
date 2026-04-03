
CREATE OR REPLACE FUNCTION public.enforce_auction_payment()
RETURNS trigger AS $$
DECLARE
  payment_id uuid;
  has_trial_credits boolean;
BEGIN
  -- Check if buyer has available trial credits (plan_id IS NULL = trial pack)
  SELECT EXISTS(
    SELECT 1
    FROM public.buyer_auction_credits
    WHERE buyer_id = NEW.buyer_id
      AND plan_id IS NULL
      AND (total_credits - used_credits) > 0
  ) INTO has_trial_credits;

  -- If buyer has trial credits, skip payment requirement
  IF has_trial_credits THEN
    RETURN NEW;
  END IF;

  -- For non-trial users, require a paid payment record
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
