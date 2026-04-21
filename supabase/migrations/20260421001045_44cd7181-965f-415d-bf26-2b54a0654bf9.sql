ALTER TABLE public.reverse_auction_bids
  ADD COLUMN IF NOT EXISTS bid_currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS fx_rate_to_inr numeric(18,8) DEFAULT 1.0;
COMMENT ON COLUMN public.reverse_auction_bids.bid_currency IS 'Currency supplier entered the bid in (bid_price is always INR-normalized).';
COMMENT ON COLUMN public.reverse_auction_bids.fx_rate_to_inr IS 'FX rate snapshot at bid time: 1 unit of bid_currency = N INR.';