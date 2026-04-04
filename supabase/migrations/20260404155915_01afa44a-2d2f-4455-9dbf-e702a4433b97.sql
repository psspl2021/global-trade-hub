
-- Add RFQ-style fields to reverse_auctions
ALTER TABLE public.reverse_auctions
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS rfq_type text DEFAULT 'domestic',
  ADD COLUMN IF NOT EXISTS destination_country text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS destination_state text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS certifications text,
  ADD COLUMN IF NOT EXISTS quality_standards text;

-- Create reverse_auction_items table for multi-item support
CREATE TABLE IF NOT EXISTS public.reverse_auction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES public.reverse_auctions(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  category text,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'MT',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reverse_auction_items ENABLE ROW LEVEL SECURITY;

-- Buyers can manage their auction items
CREATE POLICY "Buyers can manage their auction items"
  ON public.reverse_auction_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reverse_auctions ra
      WHERE ra.id = reverse_auction_items.auction_id
      AND ra.buyer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reverse_auctions ra
      WHERE ra.id = reverse_auction_items.auction_id
      AND ra.buyer_id = auth.uid()
    )
  );

-- Invited suppliers can view auction items
CREATE POLICY "Invited suppliers can view auction items"
  ON public.reverse_auction_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reverse_auction_suppliers ras
      WHERE ras.auction_id = reverse_auction_items.auction_id
      AND (ras.supplier_id = auth.uid() OR ras.supplier_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );
