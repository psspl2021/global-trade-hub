
-- 1. Supplier Auction Stats (for recommendation + performance tracking)
CREATE TABLE public.supplier_auction_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  category TEXT NOT NULL,
  total_participations INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  win_rate NUMERIC(5,4) DEFAULT 0,
  avg_bid_delta NUMERIC(10,2) DEFAULT 0,
  avg_price_competitiveness NUMERIC(5,4) DEFAULT 0,
  last_participated_at TIMESTAMPTZ,
  total_bid_value NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, category)
);

ALTER TABLE public.supplier_auction_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supplier stats"
  ON public.supplier_auction_stats FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "System can manage supplier stats"
  ON public.supplier_auction_stats FOR ALL
  TO authenticated USING (supplier_id = auth.uid());

-- 2. Reverse Auction Bid Items (multi-item bidding)
CREATE TABLE public.reverse_auction_bid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES public.reverse_auction_bids(id) ON DELETE CASCADE,
  auction_item_id UUID NOT NULL REFERENCES public.reverse_auction_items(id) ON DELETE CASCADE,
  unit_price NUMERIC(14,2) NOT NULL,
  quantity NUMERIC(14,2) NOT NULL,
  line_total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reverse_auction_bid_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can insert own bid items"
  ON public.reverse_auction_bid_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reverse_auction_bids b
      WHERE b.id = bid_id AND b.supplier_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can view bid items"
  ON public.reverse_auction_bid_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Suppliers can update own bid items"
  ON public.reverse_auction_bid_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reverse_auction_bids b
      WHERE b.id = bid_id AND b.supplier_id = auth.uid()
    )
  );

-- 3. RFQ Templates table
CREATE TABLE public.rfq_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  template_name TEXT NOT NULL,
  default_items JSONB NOT NULL DEFAULT '[]',
  default_specs JSONB DEFAULT '{}',
  quality_standards TEXT,
  certifications TEXT,
  payment_terms TEXT,
  unit TEXT DEFAULT 'MT',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rfq_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON public.rfq_templates FOR SELECT
  TO authenticated USING (is_active = true);

-- Enable realtime for bid items
ALTER PUBLICATION supabase_realtime ADD TABLE public.reverse_auction_bid_items;
