-- Fix #1 & #3: Corrected trigger function with safe material price source
CREATE OR REPLACE FUNCTION public.calculate_bid_margin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade_type TEXT;
  v_pricing RECORD;
  v_material NUMERIC;
BEGIN
  -- Get trade type from requirement
  SELECT r.trade_type
  INTO v_trade_type
  FROM public.requirements r
  WHERE r.id = NEW.requirement_id;

  v_trade_type := COALESCE(v_trade_type, 'domestic');

  -- Normalize trade type
  IF v_trade_type IN ('domestic_india', 'domestic') THEN
    v_trade_type := 'domestic';
  END IF;

  -- Material price source (safe - prevents double counting)
  -- Rule: If split pricing exists, use it. Otherwise fall back to bid_amount.
  v_material :=
    CASE
      WHEN NEW.supplier_material_price IS NOT NULL
        THEN NEW.supplier_material_price
      ELSE NEW.bid_amount
    END;

  -- Apply margin calculation
  SELECT *
  INTO v_pricing
  FROM public.apply_platform_margin(
    COALESCE(v_material, 0),
    COALESCE(NEW.supplier_logistics_price, 0),
    v_trade_type
  );

  -- Update buyer-facing prices only
  NEW.buyer_material_price := v_pricing.buyer_material;
  NEW.buyer_logistics_price := v_pricing.buyer_logistics;
  NEW.buyer_visible_price := v_pricing.buyer_total;
  NEW.platform_margin := v_pricing.platform_profit;

  -- Note: Removed transaction_type assignment (column may not exist / not needed)

  RETURN NEW;
END;
$$;

-- Fix #2: Recreate trigger to only fire on supplier pricing fields, not bid_amount updates
DROP TRIGGER IF EXISTS trigger_calculate_bid_margin ON public.bids;

CREATE TRIGGER trigger_calculate_bid_margin
BEFORE INSERT OR UPDATE OF supplier_material_price, supplier_logistics_price
ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.calculate_bid_margin();

-- Add comment for documentation
COMMENT ON FUNCTION public.calculate_bid_margin IS 'ai_inventory_pricing_v1: Auto-applies platform margin on bid insert/update. Safe material price source prevents double counting. Only triggers on supplier pricing fields.';