
-- Atomic credit consumption function
CREATE OR REPLACE FUNCTION consume_auction_credit(p_credit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE buyer_auction_credits
  SET used_credits = used_credits + 1,
      updated_at = now()
  WHERE id = p_credit_id
  AND (total_credits - used_credits) > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No credits available';
  END IF;
END;
$$;

-- DB-level starter uniqueness protection
CREATE UNIQUE INDEX IF NOT EXISTS idx_starter_once_per_identity
ON auction_credit_payments (buyer_email, buyer_phone, buyer_company)
WHERE status = 'paid' AND metadata->>'plan_name' ILIKE '%Starter%';
