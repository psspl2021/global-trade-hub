
-- Indexes for RPC performance
CREATE INDEX IF NOT EXISTS idx_ras_auction_id ON reverse_auction_suppliers(auction_id);
CREATE INDEX IF NOT EXISTS idx_rab_auction_id ON reverse_auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_ra_buyer_id ON reverse_auctions(buyer_id);

-- Upgrade RPC with NULL safety and SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_buyer_network_supplier_ids(p_buyer_id uuid)
RETURNS TABLE(supplier_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ras.supplier_id
  FROM reverse_auction_suppliers ras
  JOIN reverse_auctions ra ON ra.id = ras.auction_id
  WHERE ra.buyer_id = p_buyer_id
    AND ras.supplier_id IS NOT NULL
  UNION
  SELECT DISTINCT rab.supplier_id
  FROM reverse_auction_bids rab
  JOIN reverse_auctions ra ON ra.id = rab.auction_id
  WHERE ra.buyer_id = p_buyer_id
    AND rab.supplier_id IS NOT NULL;
$$;
