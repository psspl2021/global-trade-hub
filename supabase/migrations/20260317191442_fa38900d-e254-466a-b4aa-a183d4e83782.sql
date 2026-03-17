
-- STEP 1: Secure function with safe search_path
CREATE OR REPLACE FUNCTION public.can_supplier_access_auction(
  p_auction_id uuid,
  p_supplier_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
  SELECT 1
  FROM public.reverse_auction_suppliers ras
  WHERE ras.auction_id = p_auction_id
  AND (
    ras.supplier_id = p_supplier_id
    OR ras.supplier_email = p_email
  )
);
$$;

-- STEP 2: Lock function access
REVOKE ALL ON FUNCTION public.can_supplier_access_auction(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_supplier_access_auction(uuid, uuid, text) TO authenticated;

-- STEP 3: Ensure RLS enabled
ALTER TABLE reverse_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reverse_auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE reverse_auction_suppliers ENABLE ROW LEVEL SECURITY;

-- STEP 4: Force RLS (no bypass even for owners)
ALTER TABLE reverse_auctions FORCE ROW LEVEL SECURITY;
ALTER TABLE reverse_auction_bids FORCE ROW LEVEL SECURITY;
ALTER TABLE reverse_auction_suppliers FORCE ROW LEVEL SECURITY;

-- STEP 5: Replace policies with hardened versions
DROP POLICY IF EXISTS "Suppliers view invited auctions" ON reverse_auctions;
DROP POLICY IF EXISTS "Suppliers access auctions" ON reverse_auctions;
CREATE POLICY "Suppliers access auctions"
ON reverse_auctions FOR SELECT
USING (public.can_supplier_access_auction(id, auth.uid(), auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Suppliers place bids" ON reverse_auction_bids;
CREATE POLICY "Suppliers place bids"
ON reverse_auction_bids FOR INSERT
WITH CHECK (
  supplier_id = auth.uid()
  AND public.can_supplier_access_auction(auction_id, auth.uid(), auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Suppliers view own invitations" ON reverse_auction_suppliers;
CREATE POLICY "Suppliers view own invitations"
ON reverse_auction_suppliers FOR SELECT
USING (
  supplier_id = auth.uid()
  OR supplier_email = auth.jwt() ->> 'email'
);
