-- 1. Unique index on idempotency_key to prevent duplicate Cashfree orders
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_idempotency
ON auction_credit_payments (idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- 2. Enable realtime for buyer_auction_credits
ALTER PUBLICATION supabase_realtime ADD TABLE public.buyer_auction_credits;