-- BACKFILL bid_items for legacy bids that don't have line items
-- This enables admin editing and proper L1 calculations

-- For bids with single-item requirements: create bid_item from bid amount + first requirement_item
INSERT INTO bid_items (
  bid_id,
  requirement_item_id,
  quantity,
  supplier_unit_price,
  unit_price,
  total
)
SELECT 
  b.id as bid_id,
  ri.id as requirement_item_id,
  ri.quantity,
  -- Calculate unit price from supplier_net_price
  ROUND(b.supplier_net_price / NULLIF(ri.quantity, 0), 2) as supplier_unit_price,
  -- Buyer visible price with ~3% markup
  ROUND((b.supplier_net_price / NULLIF(ri.quantity, 0)) * 1.03, 2) as unit_price,
  -- Total = quantity * unit_price
  ROUND(b.supplier_net_price * 1.03, 2) as total
FROM bids b
JOIN requirements r ON r.id = b.requirement_id
JOIN requirement_items ri ON ri.requirement_id = r.id
WHERE NOT EXISTS (
  SELECT 1 FROM bid_items bi WHERE bi.bid_id = b.id
)
AND ri.id = (
  -- Pick the first requirement_item for this requirement (ordered by created_at)
  SELECT ri2.id 
  FROM requirement_items ri2 
  WHERE ri2.requirement_id = r.id 
  ORDER BY ri2.created_at 
  LIMIT 1
)
ON CONFLICT DO NOTHING;