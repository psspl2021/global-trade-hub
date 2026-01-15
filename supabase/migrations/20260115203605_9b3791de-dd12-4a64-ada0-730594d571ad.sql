-- ================================================================
-- ENTERPRISE RLS FOR bid_items (CORRECTED)
-- Protects supplier pricing at database level
-- ================================================================

-- Drop and recreate buyer policy with correct column name
DROP POLICY IF EXISTS "buyer_read_bid_items" ON bid_items;

CREATE POLICY "buyer_read_bid_items"
ON bid_items FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM requirements r
    JOIN bids b ON b.requirement_id = r.id
    WHERE b.id = bid_items.bid_id
      AND r.buyer_id = auth.uid()
  )
);

-- Recreate the secure view with correct column
DROP VIEW IF EXISTS public.buyer_bid_items_view;
CREATE VIEW public.buyer_bid_items_view
WITH (security_invoker = on) AS
SELECT
  bi.id,
  bi.bid_id,
  bi.requirement_item_id,
  bi.quantity,
  bi.unit_price,
  bi.total,
  bi.dispatched_qty,
  bi.created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM bids b WHERE b.id = bi.bid_id AND b.supplier_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
    THEN bi.supplier_unit_price
    ELSE NULL
  END AS supplier_unit_price
FROM bid_items bi;

GRANT SELECT ON public.buyer_bid_items_view TO authenticated;

-- Add indexes for efficient RLS checks
CREATE INDEX IF NOT EXISTS idx_bids_supplier_lookup
ON bids (id, supplier_id);

CREATE INDEX IF NOT EXISTS idx_bids_requirement_lookup
ON bids (id, requirement_id);

CREATE INDEX IF NOT EXISTS idx_requirements_buyer_lookup
ON requirements (id, buyer_id);