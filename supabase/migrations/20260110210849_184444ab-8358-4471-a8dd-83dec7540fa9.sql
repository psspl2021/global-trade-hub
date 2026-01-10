-- Update apply_platform_margin to v3: Margin applies regardless of logistics presence
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
  -- Domestic trades → 0.5%
  IF p_trade_type IN ('domestic', 'domestic_india') THEN
    v_margin_rate := 0.005;

  -- Export / Import trades → 2%
  ELSIF p_trade_type IN ('export', 'import') THEN
    v_margin_rate := 0.02;
  END IF;

  buyer_material := ROUND(COALESCE(p_material, 0) * (1 + v_margin_rate), 2);
  buyer_logistics := ROUND(COALESCE(p_logistics, 0) * (1 + v_margin_rate), 2);
  buyer_total := buyer_material + buyer_logistics;

  platform_profit :=
    buyer_total - (COALESCE(p_material, 0) + COALESCE(p_logistics, 0));

  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION public.apply_platform_margin IS
'ai_inventory_pricing_v3: Applies 0.5% margin on domestic trades and 2% on export/import trades, independent of logistics presence. Backend enforced.';