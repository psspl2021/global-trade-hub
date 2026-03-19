CREATE INDEX IF NOT EXISTS idx_payment_identity_lookup
ON auction_credit_payments (buyer_id, buyer_email, buyer_phone, buyer_company);