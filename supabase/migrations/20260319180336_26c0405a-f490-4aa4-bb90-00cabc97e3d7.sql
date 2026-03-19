
-- 1. Add idempotency_key column
ALTER TABLE auction_credit_payments ADD COLUMN IF NOT EXISTS idempotency_key text;

-- 2. Unique index on idempotency_key (prevents duplicate orders)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_idempotency_key
ON auction_credit_payments (idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- 3. Partial index for paid-only identity lookups (replaces full index)
DROP INDEX IF EXISTS idx_payment_identity_ci;
CREATE INDEX IF NOT EXISTS idx_payment_identity_paid_only
ON auction_credit_payments (
  lower(buyer_email),
  buyer_phone,
  lower(buyer_company)
)
WHERE status = 'paid';
