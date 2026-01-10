-- Add new columns for separate material/logistics pricing
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS supplier_material_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_logistics_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS buyer_material_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS buyer_logistics_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_margin NUMERIC DEFAULT 0;

-- Create the platform margin calculation function
CREATE OR REPLACE FUNCTION public.apply_platform_margin(
  p_material NUMERIC,
  p_logistics NUMERIC,
  p_trade_type TEXT
)
RETURNS TABLE (
  buyer_material NUMERIC,
  buyer_logistics NUMERIC,
  buyer_total NUMERIC,
  platform_profit NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_margin_rate NUMERIC := 0;
BEGIN
  -- Apply 0.5% margin ONLY for domestic trades with logistics
  IF p_trade_type = 'domestic' AND COALESCE(p_logistics, 0) > 0 THEN
    v_margin_rate := 0.005;
  END IF;

  buyer_material := ROUND(COALESCE(p_material, 0) * (1 + v_margin_rate), 2);
  buyer_logistics := ROUND(COALESCE(p_logistics, 0) * (1 + v_margin_rate), 2);
  buyer_total := buyer_material + buyer_logistics;
  platform_profit := buyer_total - (COALESCE(p_material, 0) + COALESCE(p_logistics, 0));

  RETURN NEXT;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.apply_platform_margin IS 'ai_inventory_pricing_v1: Applies 0.5% platform margin on domestic trades with logistics. Proportional split, backend enforced.';

-- Create trigger function to auto-apply margin on bid insert/update
CREATE OR REPLACE FUNCTION public.calculate_bid_margin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade_type TEXT;
  v_pricing RECORD;
BEGIN
  -- Get trade_type from the requirement
  SELECT r.trade_type INTO v_trade_type
  FROM public.requirements r
  WHERE r.id = NEW.requirement_id;
  
  -- Default to domestic if not set
  v_trade_type := COALESCE(v_trade_type, 'domestic_india');
  
  -- Normalize trade_type for margin calculation
  IF v_trade_type IN ('domestic', 'domestic_india') THEN
    v_trade_type := 'domestic';
  END IF;
  
  -- Apply margin calculation
  SELECT * INTO v_pricing
  FROM public.apply_platform_margin(
    COALESCE(NEW.supplier_material_price, NEW.bid_amount),
    COALESCE(NEW.supplier_logistics_price, 0),
    v_trade_type
  );
  
  -- Update buyer-facing prices
  NEW.buyer_material_price := v_pricing.buyer_material;
  NEW.buyer_logistics_price := v_pricing.buyer_logistics;
  NEW.buyer_visible_price := v_pricing.buyer_total;
  NEW.platform_margin := v_pricing.platform_profit;
  
  -- Store trade type for auditing
  NEW.transaction_type := v_trade_type;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bids table
DROP TRIGGER IF EXISTS trigger_calculate_bid_margin ON public.bids;
CREATE TRIGGER trigger_calculate_bid_margin
  BEFORE INSERT OR UPDATE OF supplier_material_price, supplier_logistics_price, bid_amount
  ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_bid_margin();

-- Add comment for trigger
COMMENT ON FUNCTION public.calculate_bid_margin IS 'Auto-applies platform margin when supplier submits bid. Stores both supplier and buyer prices separately.';