
-- Add supplier_email and invited_by columns to reverse_auction_suppliers
ALTER TABLE public.reverse_auction_suppliers 
  ADD COLUMN IF NOT EXISTS supplier_email TEXT,
  ADD COLUMN IF NOT EXISTS invited_by UUID;

-- Make supplier_id nullable (for manual/email-only invites)
ALTER TABLE public.reverse_auction_suppliers 
  ALTER COLUMN supplier_id DROP NOT NULL;

-- Update RLS: suppliers can also see invitations by email
-- Drop old policies first
DROP POLICY IF EXISTS "Suppliers view own invitations" ON public.reverse_auction_suppliers;
DROP POLICY IF EXISTS "Suppliers update own invitation" ON public.reverse_auction_suppliers;

-- Recreate with email-based access
CREATE POLICY "Suppliers view own invitations" ON public.reverse_auction_suppliers
  FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers update own invitation" ON public.reverse_auction_suppliers
  FOR UPDATE TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());
