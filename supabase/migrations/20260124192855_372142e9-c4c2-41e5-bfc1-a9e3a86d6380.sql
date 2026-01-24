
-- Backfill bid_items for ALL bids that are missing them
-- This repairs legacy bids created before atomic insertion was enforced

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
  -- Calculate supplier unit price from supplier_net_price / quantity
  CASE 
    WHEN ri.quantity > 0 THEN ROUND(b.supplier_net_price / ri.quantity, 2)
    ELSE b.supplier_net_price
  END as supplier_unit_price,
  -- Calculate buyer-visible unit price with markup from bid
  CASE 
    WHEN ri.quantity > 0 THEN ROUND(b.buyer_visible_price / ri.quantity, 2)
    ELSE b.buyer_visible_price
  END as unit_price,
  -- Total = buyer_visible_price (whole bid total for single item)
  b.buyer_visible_price as total
FROM bids b
INNER JOIN requirement_items ri ON ri.requirement_id = b.requirement_id
WHERE NOT EXISTS (
  SELECT 1 FROM bid_items bi WHERE bi.bid_id = b.id
)
-- Pick only the first requirement_item per requirement to avoid duplicates
AND ri.id = (
  SELECT ri2.id 
  FROM requirement_items ri2 
  WHERE ri2.requirement_id = b.requirement_id 
  ORDER BY ri2.created_at 
  LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Create trigger to ensure bid_items always exist after bid insert
-- This is a safety net for any direct inserts that bypass the RPC

CREATE OR REPLACE FUNCTION public.ensure_bid_items_exist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_count INTEGER;
  v_requirement_item_id UUID;
BEGIN
  -- Check if bid_items exist for this bid
  SELECT COUNT(*) INTO v_item_count
  FROM bid_items
  WHERE bid_id = NEW.id;
  
  -- If no items exist, create one from requirement_items
  IF v_item_count = 0 THEN
    -- Get the first requirement_item for this requirement
    SELECT id INTO v_requirement_item_id
    FROM requirement_items
    WHERE requirement_id = NEW.requirement_id
    ORDER BY created_at
    LIMIT 1;
    
    -- If requirement_item exists, create bid_item
    IF v_requirement_item_id IS NOT NULL THEN
      INSERT INTO bid_items (
        bid_id,
        requirement_item_id,
        quantity,
        supplier_unit_price,
        unit_price,
        total
      )
      SELECT 
        NEW.id,
        ri.id,
        ri.quantity,
        CASE WHEN ri.quantity > 0 THEN ROUND(NEW.supplier_net_price / ri.quantity, 2) ELSE NEW.supplier_net_price END,
        CASE WHEN ri.quantity > 0 THEN ROUND(NEW.buyer_visible_price / ri.quantity, 2) ELSE NEW.buyer_visible_price END,
        NEW.buyer_visible_price
      FROM requirement_items ri
      WHERE ri.id = v_requirement_item_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after bid insert (deferred to allow RPC to insert items first)
DROP TRIGGER IF EXISTS ensure_bid_items_on_insert ON bids;
CREATE TRIGGER ensure_bid_items_on_insert
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION ensure_bid_items_exist();
