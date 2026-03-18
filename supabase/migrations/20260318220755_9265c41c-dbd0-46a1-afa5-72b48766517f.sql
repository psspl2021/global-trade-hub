CREATE UNIQUE INDEX IF NOT EXISTS idx_single_winner_per_auction
ON reverse_auction_bids(auction_id)
WHERE is_winning = true;