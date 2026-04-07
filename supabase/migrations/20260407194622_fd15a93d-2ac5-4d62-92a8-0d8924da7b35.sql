
DROP POLICY IF EXISTS "suppliers_can_view_items" ON reverse_auction_items;
DROP POLICY IF EXISTS "Allow any authenticated user to read reverse_auction_items" ON reverse_auction_items;

CREATE POLICY "suppliers_can_view_items"
ON reverse_auction_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM reverse_auction_suppliers ras
    WHERE ras.auction_id = reverse_auction_items.auction_id
      AND (
        ras.supplier_id = auth.uid()
        OR ras.supplier_email = auth.jwt() ->> 'email'
      )
  )
);
