-- ============================================
-- FIX #1: Column-restricted UPDATE policy
-- Suppliers can ONLY update boost fields, not AI scores
-- ============================================
DROP POLICY IF EXISTS "Suppliers can update boost only" ON public.supplier_inventory_matches;

-- Create a trigger-based approach since Postgres RLS doesn't support OLD/NEW comparison
-- Instead, use a BEFORE UPDATE trigger to enforce column restrictions

CREATE OR REPLACE FUNCTION public.enforce_boost_only_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow changes only to boost fields
  -- Revert any attempted changes to protected AI fields
  NEW.match_score := OLD.match_score;
  NEW.location_proximity := OLD.location_proximity;
  NEW.historical_acceptance := OLD.historical_acceptance;
  NEW.ai_version := OLD.ai_version;
  NEW.matching_rfq_count := OLD.matching_rfq_count;
  NEW.supplier_city := OLD.supplier_city;
  NEW.last_calculated_at := OLD.last_calculated_at;
  NEW.recalculation_locked_until := OLD.recalculation_locked_until;
  NEW.product_id := OLD.product_id;
  NEW.supplier_id := OLD.supplier_id;
  NEW.created_at := OLD.created_at;
  
  -- Only these can change: is_boosted, boost_expires_at, updated_at
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_boost_only ON public.supplier_inventory_matches;

CREATE TRIGGER trigger_enforce_boost_only
BEFORE UPDATE ON public.supplier_inventory_matches
FOR EACH ROW
EXECUTE FUNCTION public.enforce_boost_only_update();

-- Simple UPDATE policy (trigger handles field restrictions)
CREATE POLICY "Suppliers can update own matches"
ON public.supplier_inventory_matches
FOR UPDATE
USING (auth.uid() = supplier_id)
WITH CHECK (auth.uid() = supplier_id);

-- ============================================
-- FIX #2: Aggregate stock to prevent duplicates
-- ============================================
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
JOIN (
  SELECT
    product_id,
    SUM(quantity) AS quantity,
    MAX(unit) AS unit
  FROM public.stock_inventory
  GROUP BY product_id
) si ON si.product_id = sim.product_id
WHERE p.is_active = true
  AND si.quantity > 0;

-- Grant SELECT on view to authenticated users
GRANT SELECT ON public.buyer_inventory_discovery TO authenticated;

COMMENT ON VIEW public.buyer_inventory_discovery IS 'Buyer-safe view (SECURITY INVOKER) with aggregated stock, hiding supplier identity';
COMMENT ON FUNCTION public.enforce_boost_only_update IS 'Prevents suppliers from modifying AI-calculated fields via direct updates';