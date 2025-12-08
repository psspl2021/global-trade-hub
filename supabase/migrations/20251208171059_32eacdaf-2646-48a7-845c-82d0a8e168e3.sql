-- Create bid_items table for per-line-item bidding
CREATE TABLE public.bid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  requirement_item_id UUID NOT NULL REFERENCES requirement_items(id) ON DELETE CASCADE,
  unit_price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bid_items ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own bid items
CREATE POLICY "Suppliers can manage own bid items"
ON public.bid_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM bids WHERE bids.id = bid_items.bid_id AND bids.supplier_id = auth.uid()
));

-- Buyers can view bid items for bids on their requirements
CREATE POLICY "Buyers can view bid items for their requirements"
ON public.bid_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM bids b
  JOIN requirements r ON r.id = b.requirement_id
  WHERE b.id = bid_items.bid_id AND r.buyer_id = auth.uid()
));

-- Admins can view all bid items
CREATE POLICY "Admins can view all bid items"
ON public.bid_items FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));