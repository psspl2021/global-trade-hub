-- Partial index for faster L1 lookups (excludes rejected bids)
-- Smaller index size, faster MIN(bid_amount) queries
CREATE INDEX IF NOT EXISTS idx_bids_req_active_l1
ON bids (requirement_id, bid_amount)
WHERE status != 'rejected';