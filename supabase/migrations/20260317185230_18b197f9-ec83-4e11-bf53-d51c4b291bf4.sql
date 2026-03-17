
-- Add unique constraints to prevent duplicate invites
-- Unique on (auction_id, supplier_id) when supplier_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_ras_unique_supplier 
  ON public.reverse_auction_suppliers (auction_id, supplier_id) 
  WHERE supplier_id IS NOT NULL;

-- Unique on (auction_id, supplier_email) when supplier_email is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_ras_unique_email 
  ON public.reverse_auction_suppliers (auction_id, supplier_email) 
  WHERE supplier_email IS NOT NULL;

-- Add source tracking columns to reverse_auction_suppliers
ALTER TABLE public.reverse_auction_suppliers
  ADD COLUMN IF NOT EXISTS supplier_source TEXT DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS supplier_company_name TEXT;

-- Update RLS: allow suppliers to view auctions they're invited to by email
-- First update the reverse_auctions SELECT policy for suppliers
DROP POLICY IF EXISTS "Suppliers view invited auctions" ON public.reverse_auctions;
CREATE POLICY "Suppliers view invited auctions" ON public.reverse_auctions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reverse_auction_suppliers ras
      WHERE ras.auction_id = id 
        AND (
          ras.supplier_id = auth.uid()
          OR ras.supplier_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    )
  );

-- Update reverse_auction_suppliers: suppliers can view by email too
DROP POLICY IF EXISTS "Suppliers view own invitations" ON public.reverse_auction_suppliers;
CREATE POLICY "Suppliers view own invitations" ON public.reverse_auction_suppliers
  FOR SELECT TO authenticated
  USING (
    supplier_id = auth.uid()
    OR supplier_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Update reverse_auction_suppliers: suppliers can update by email too
DROP POLICY IF EXISTS "Suppliers update own invitation" ON public.reverse_auction_suppliers;
CREATE POLICY "Suppliers update own invitation" ON public.reverse_auction_suppliers
  FOR UPDATE TO authenticated
  USING (
    supplier_id = auth.uid()
    OR supplier_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    supplier_id = auth.uid()
    OR supplier_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Update reverse_auction_bids: allow bidding if invited by email
DROP POLICY IF EXISTS "Suppliers place bids" ON public.reverse_auction_bids;
CREATE POLICY "Suppliers place bids" ON public.reverse_auction_bids
  FOR INSERT TO authenticated
  WITH CHECK (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reverse_auction_suppliers ras
      WHERE ras.auction_id = auction_id
        AND (
          ras.supplier_id = auth.uid()
          OR ras.supplier_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    )
  );
