-- Index for faster bid aggregation (savings calculation)
CREATE INDEX IF NOT EXISTS idx_reverse_auction_bids_auction
ON public.reverse_auction_bids(auction_id, bid_price);

-- Index for faster payment analytics
CREATE INDEX IF NOT EXISTS idx_auction_payments_status
ON public.auction_payments(payment_status);
