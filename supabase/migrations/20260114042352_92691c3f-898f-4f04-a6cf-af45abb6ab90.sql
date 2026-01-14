-- Performance index for L1 price lookups at scale
CREATE INDEX IF NOT EXISTS idx_bids_req_status_amount
ON bids (requirement_id, status, bid_amount);

-- Performance index for supplier category lookups
CREATE INDEX IF NOT EXISTS idx_profiles_supplier_categories
ON profiles USING GIN (supplier_categories);