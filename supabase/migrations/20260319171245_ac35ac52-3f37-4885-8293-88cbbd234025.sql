
DROP INDEX IF EXISTS idx_payment_identity_lookup;
DROP INDEX IF EXISTS idx_payment_identity_fast;

CREATE INDEX idx_payment_identity_fast
ON auction_credit_payments (status, buyer_id, buyer_email, buyer_phone, buyer_company);
