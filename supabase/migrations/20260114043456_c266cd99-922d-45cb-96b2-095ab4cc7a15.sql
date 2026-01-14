-- Drop the suboptimal index
DROP INDEX IF EXISTS idx_bids_req_active_l1;

-- Create the correct enterprise-safe partial index
-- Matches RPC condition exactly: status NOT IN ('rejected', 'withdrawn')
CREATE INDEX idx_bids_req_active_l1
ON bids (requirement_id, bid_amount)
WHERE status NOT IN ('rejected', 'withdrawn');