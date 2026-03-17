
-- ============================================
-- FIX: Replace buggy supplier auction SELECT policy
-- Bug: ras.auction_id = ras.id (self-reference, never matches correctly)
-- ============================================
DROP POLICY IF EXISTS "Suppliers view invited auctions" ON reverse_auctions;

CREATE POLICY "Suppliers view invited auctions"
ON reverse_auctions
FOR SELECT
USING (
  public.can_supplier_access_auction(id, auth.uid(), auth.jwt() ->> 'email')
);

-- ============================================
-- FIX: Replace buggy supplier bid INSERT policy
-- Bug: ras.auction_id = ras.auction_id (always true, any supplier could bid!)
-- ============================================
DROP POLICY IF EXISTS "Suppliers place bids" ON reverse_auction_bids;

CREATE POLICY "Suppliers place bids"
ON reverse_auction_bids
FOR INSERT
WITH CHECK (
  supplier_id = auth.uid()
  AND public.can_supplier_access_auction(auction_id, auth.uid(), auth.jwt() ->> 'email')
);

-- ============================================
-- FIX: Replace supplier invite SELECT with cleaner version using function
-- ============================================
DROP POLICY IF EXISTS "Suppliers view own invitations" ON reverse_auction_suppliers;

CREATE POLICY "Suppliers view own invitations"
ON reverse_auction_suppliers
FOR SELECT
USING (
  supplier_id = auth.uid()
  OR supplier_email = auth.jwt() ->> 'email'
);
