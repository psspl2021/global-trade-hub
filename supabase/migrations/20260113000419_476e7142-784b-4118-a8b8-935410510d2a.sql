-- Fix search_path for get_po_amount helper
CREATE OR REPLACE FUNCTION public.get_po_amount(po public.purchase_orders)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
SET search_path = 'public'
AS $$
  SELECT COALESCE(po.po_value, po.total_amount);
$$;