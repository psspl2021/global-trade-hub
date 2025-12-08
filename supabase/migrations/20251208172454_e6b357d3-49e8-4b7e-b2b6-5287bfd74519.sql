-- Add premium_bids_balance column to track lifetime premium bids
ALTER TABLE public.subscriptions 
ADD COLUMN premium_bids_balance INTEGER NOT NULL DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.subscriptions.premium_bids_balance IS 'Lifetime premium bids balance (₹24,950 for 50 bids, never expires)';