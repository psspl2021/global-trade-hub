-- Add new pricing columns for markup-based model
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS supplier_net_price numeric,
ADD COLUMN IF NOT EXISTS buyer_visible_price numeric,
ADD COLUMN IF NOT EXISTS markup_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS transaction_type text DEFAULT 'domestic_india';

-- Update existing bids: set supplier_net_price = bid_amount (backward compatibility)
UPDATE public.bids 
SET supplier_net_price = bid_amount,
    buyer_visible_price = bid_amount
WHERE supplier_net_price IS NULL;

-- Make supplier_net_price NOT NULL after migration
ALTER TABLE public.bids 
ALTER COLUMN supplier_net_price SET NOT NULL,
ALTER COLUMN buyer_visible_price SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bids.supplier_net_price IS 'The actual price submitted by supplier - this is what supplier gets paid';
COMMENT ON COLUMN public.bids.buyer_visible_price IS 'Price shown to buyer including platform markup';
COMMENT ON COLUMN public.bids.markup_percentage IS 'Platform markup percentage (0.5% domestic, 2.5% cross-border)';
COMMENT ON COLUMN public.bids.markup_amount IS 'Calculated markup amount (buyer_visible_price - supplier_net_price)';
COMMENT ON COLUMN public.bids.transaction_type IS 'domestic_india or cross_border based on geography';

-- Create function to calculate markup based on geography
CREATE OR REPLACE FUNCTION public.calculate_bid_markup(
  p_buyer_country text,
  p_ship_to_country text,
  p_supplier_country text,
  p_supplier_net_price numeric
)
RETURNS TABLE(
  transaction_type text,
  markup_percentage numeric,
  markup_amount numeric,
  buyer_visible_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_type text;
  v_markup_pct numeric;
  v_markup_amt numeric;
  v_buyer_price numeric;
BEGIN
  -- Determine transaction type based on geography
  IF LOWER(COALESCE(p_buyer_country, 'india')) = 'india' 
     AND LOWER(COALESCE(p_ship_to_country, 'india')) = 'india' 
     AND LOWER(COALESCE(p_supplier_country, 'india')) = 'india' THEN
    v_transaction_type := 'domestic_india';
    v_markup_pct := 0.5; -- 0.5% for domestic
  ELSE
    v_transaction_type := 'cross_border';
    v_markup_pct := 2.5; -- 2.5% for export/import
  END IF;
  
  -- Calculate markup
  v_markup_amt := ROUND(p_supplier_net_price * (v_markup_pct / 100), 2);
  v_buyer_price := p_supplier_net_price + v_markup_amt;
  
  RETURN QUERY SELECT v_transaction_type, v_markup_pct, v_markup_amt, v_buyer_price;
END;
$$;

-- Create secure function for buyers to view bids (hides supplier identity)
CREATE OR REPLACE FUNCTION public.get_bids_for_buyer(p_requirement_id uuid)
RETURNS TABLE(
  bid_id uuid,
  supplier_name text,
  bid_amount numeric,
  delivery_timeline_days integer,
  status text,
  created_at timestamptz,
  terms_and_conditions text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id as bid_id,
    'ProcureSaathi Solutions Pvt. Ltd.'::text as supplier_name,
    b.buyer_visible_price as bid_amount,
    b.delivery_timeline_days,
    b.status::text,
    b.created_at,
    b.terms_and_conditions
  FROM bids b
  JOIN requirements r ON r.id = b.requirement_id
  WHERE b.requirement_id = p_requirement_id
    AND r.buyer_id = auth.uid()
  ORDER BY b.buyer_visible_price ASC;
$$;

-- Create secure function for suppliers to view their bids (hides markup)
CREATE OR REPLACE FUNCTION public.get_bids_for_supplier(p_supplier_id uuid)
RETURNS TABLE(
  bid_id uuid,
  requirement_id uuid,
  requirement_title text,
  bid_amount numeric,
  delivery_timeline_days integer,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id as bid_id,
    b.requirement_id,
    r.title as requirement_title,
    b.supplier_net_price as bid_amount, -- Supplier sees their net price only
    b.delivery_timeline_days,
    b.status::text,
    b.created_at
  FROM bids b
  JOIN requirements r ON r.id = b.requirement_id
  WHERE b.supplier_id = p_supplier_id
    AND b.supplier_id = auth.uid()
  ORDER BY b.created_at DESC;
$$;