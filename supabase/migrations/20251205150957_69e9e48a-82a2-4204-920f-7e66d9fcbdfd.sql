-- Drop the overly permissive stock visibility policy
DROP POLICY IF EXISTS "Authenticated users can view stock" ON stock_inventory;

-- Create restricted policy: suppliers see own stock, buyers see stock from accepted relationships
CREATE POLICY "Users can view relevant stock"
ON stock_inventory FOR SELECT
TO authenticated
USING (
  -- Supplier sees their own stock
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = stock_inventory.product_id
    AND p.supplier_id = auth.uid()
  )
  OR
  -- Buyers with ACCEPTED business relationship can see supplier stock
  EXISTS (
    SELECT 1 FROM products p
    JOIN bids b ON b.supplier_id = p.supplier_id
    JOIN requirements r ON r.id = b.requirement_id
    WHERE p.id = stock_inventory.product_id
    AND r.buyer_id = auth.uid()
    AND b.status = 'accepted'
  )
  OR
  -- Admins can view all stock
  has_role(auth.uid(), 'admin'::app_role)
);