-- Fix SECURITY DEFINER view issue - recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.buyer_inventory_discovery;

CREATE VIEW public.buyer_inventory_discovery
WITH (security_invoker = true)
AS
SELECT
  sim.product_id,
  p.name AS product_name,
  p.category,
  si.quantity AS available_quantity,
  si.unit,
  CASE
    WHEN sim.match_score >= 70 THEN 'high'
    WHEN sim.match_score >= 40 THEN 'medium'
    ELSE 'low'
  END AS match_strength,
  CASE WHEN sim.is_boosted AND sim.boost_expires_at > now() THEN true ELSE false END AS is_featured
FROM public.supplier_inventory_matches sim
JOIN public.products p ON p.id = sim.product_id
JOIN public.stock_inventory si ON si.product_id = sim.product_id
WHERE p.is_active = true
  AND si.quantity > 0;

-- Grant SELECT on view to authenticated users
GRANT SELECT ON public.buyer_inventory_discovery TO authenticated;

COMMENT ON VIEW public.buyer_inventory_discovery IS 'Buyer-safe view (SECURITY INVOKER) hiding supplier identity and internal AI metrics';