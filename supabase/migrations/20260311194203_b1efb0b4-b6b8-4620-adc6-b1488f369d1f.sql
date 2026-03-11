
-- Reverse Auctions: Buyer-created price discovery tool
CREATE TABLE public.reverse_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  title TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'MT',
  starting_price NUMERIC NOT NULL,
  current_price NUMERIC,
  reserve_price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'INR',
  minimum_bid_step_pct NUMERIC NOT NULL DEFAULT 0.25,
  auction_start TIMESTAMPTZ,
  auction_end TIMESTAMPTZ,
  anti_snipe_seconds INT NOT NULL DEFAULT 60,
  anti_snipe_threshold_seconds INT NOT NULL DEFAULT 30,
  transaction_type TEXT NOT NULL DEFAULT 'domestic',
  status TEXT NOT NULL DEFAULT 'scheduled',
  winner_supplier_id UUID,
  winning_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invited suppliers for each auction
CREATE TABLE public.reverse_auction_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ,
  floor_price NUMERIC,
  UNIQUE(auction_id, supplier_id)
);

-- Bids in a reverse auction
CREATE TABLE public.reverse_auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  bid_price NUMERIC NOT NULL,
  is_winning BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reverse_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverse_auction_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverse_auction_bids ENABLE ROW LEVEL SECURITY;

-- RLS: reverse_auctions
-- Buyers can see and manage their own auctions
CREATE POLICY "Buyers manage own auctions" ON public.reverse_auctions
  FOR ALL TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Suppliers can see auctions they're invited to
CREATE POLICY "Suppliers view invited auctions" ON public.reverse_auctions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reverse_auction_suppliers ras
      WHERE ras.auction_id = id AND ras.supplier_id = auth.uid()
    )
  );

-- Admins can see all auctions
CREATE POLICY "Admins view all auctions" ON public.reverse_auctions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'ps_admin')
    )
  );

-- RLS: reverse_auction_suppliers
-- Buyer who owns the auction can manage invitations
CREATE POLICY "Buyer manages auction suppliers" ON public.reverse_auction_suppliers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reverse_auctions ra
      WHERE ra.id = auction_id AND ra.buyer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reverse_auctions ra
      WHERE ra.id = auction_id AND ra.buyer_id = auth.uid()
    )
  );

-- Suppliers can see their own invitations
CREATE POLICY "Suppliers view own invitations" ON public.reverse_auction_suppliers
  FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

-- Suppliers can update their own invitation (join, set floor price)
CREATE POLICY "Suppliers update own invitation" ON public.reverse_auction_suppliers
  FOR UPDATE TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

-- RLS: reverse_auction_bids
-- Suppliers can insert their own bids
CREATE POLICY "Suppliers place own bids" ON public.reverse_auction_bids
  FOR INSERT TO authenticated
  WITH CHECK (supplier_id = auth.uid());

-- Suppliers can see their own bids
CREATE POLICY "Suppliers view own bids" ON public.reverse_auction_bids
  FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

-- Buyer who owns the auction can see all bids (anonymous supplier IDs enforced in app layer)
CREATE POLICY "Buyer views auction bids" ON public.reverse_auction_bids
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reverse_auctions ra
      WHERE ra.id = auction_id AND ra.buyer_id = auth.uid()
    )
  );

-- Admins can see all bids
CREATE POLICY "Admins view all bids" ON public.reverse_auction_bids
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'ps_admin')
    )
  );

-- Enable realtime for live auction updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.reverse_auction_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reverse_auctions;
