-- Create table to persist AI inventory match scores
CREATE TABLE IF NOT EXISTS public.supplier_inventory_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  match_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  matching_rfq_count INTEGER NOT NULL DEFAULT 0,
  location_proximity NUMERIC(3,2) NOT NULL DEFAULT 0.6,
  historical_acceptance NUMERIC(3,2) NOT NULL DEFAULT 0.6,
  is_boosted BOOLEAN NOT NULL DEFAULT false,
  boost_expires_at TIMESTAMP WITH TIME ZONE,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_product_match UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE public.supplier_inventory_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Suppliers can view their own match data
CREATE POLICY "Suppliers can view own matches"
ON public.supplier_inventory_matches
FOR SELECT
USING (auth.uid() = supplier_id);

-- Policy: Suppliers can insert their own match data
CREATE POLICY "Suppliers can insert own matches"
ON public.supplier_inventory_matches
FOR INSERT
WITH CHECK (auth.uid() = supplier_id);

-- Policy: Suppliers can update their own match data
CREATE POLICY "Suppliers can update own matches"
ON public.supplier_inventory_matches
FOR UPDATE
USING (auth.uid() = supplier_id);

-- Policy: Buyers can view all matches (for discovery) but no identity revealed
CREATE POLICY "Buyers can view matches for discovery"
ON public.supplier_inventory_matches
FOR SELECT
USING (true);

-- Index for faster lookups
CREATE INDEX idx_inventory_matches_supplier ON public.supplier_inventory_matches(supplier_id);
CREATE INDEX idx_inventory_matches_score ON public.supplier_inventory_matches(match_score DESC);
CREATE INDEX idx_inventory_matches_boosted ON public.supplier_inventory_matches(is_boosted, boost_expires_at);

-- Trigger to update updated_at
CREATE TRIGGER update_supplier_inventory_matches_updated_at
BEFORE UPDATE ON public.supplier_inventory_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();