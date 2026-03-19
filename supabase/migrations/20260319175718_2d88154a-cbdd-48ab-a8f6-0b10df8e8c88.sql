CREATE INDEX IF NOT EXISTS idx_payment_identity_ci
ON auction_credit_payments (
  lower(buyer_email),
  buyer_phone,
  lower(buyer_company),
  status
);