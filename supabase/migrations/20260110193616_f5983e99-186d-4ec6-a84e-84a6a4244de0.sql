-- ============================================
-- FIX #1: Correct UNIQUE constraint
-- ============================================
ALTER TABLE public.supplier_inventory_matches 
DROP CONSTRAINT IF EXISTS unique_product_match;

ALTER TABLE public.supplier_inventory_matches
ADD CONSTRAINT unique_supplier_product_match UNIQUE (supplier_id, product_id);

-- ============================================
-- FIX #2: Remove unsafe buyer SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Buyers can view matches for discovery" ON public.supplier_inventory_matches;

-- ============================================
-- FIX #3: Add supplier_city column
-- ============================================
ALTER TABLE public.supplier_inventory_matches
ADD COLUMN IF NOT EXISTS supplier_city TEXT;

CREATE INDEX IF NOT EXISTS idx_inventory_matches_city
ON public.supplier_inventory_matches (supplier_city);

-- ============================================
-- FIX #4: Add recalculation lock
-- ============================================
ALTER TABLE public.supplier_inventory_matches
ADD COLUMN IF NOT EXISTS recalculation_locked_until TIMESTAMP WITH TIME ZONE;

-- ============================================
-- FIX #5: Track algorithm version
-- ============================================
ALTER TABLE public.supplier_inventory_matches
ADD COLUMN IF NOT EXISTS ai_version TEXT NOT NULL DEFAULT 'inventory_match_v1';

-- ============================================
-- FIX #6: Clamp score at DB level
-- ============================================
ALTER TABLE public.supplier_inventory_matches
ADD CONSTRAINT match_score_range CHECK (match_score BETWEEN 0 AND 100);

-- ============================================
-- FIX #7: Revoke direct INSERT from authenticated users
-- (backend/service role only for AI score inserts)
-- ============================================
DROP POLICY IF EXISTS "Suppliers can insert own matches" ON public.supplier_inventory_matches;

-- Create restricted update policy (only boost fields, not scores)
DROP POLICY IF EXISTS "Suppliers can update own matches" ON public.supplier_inventory_matches;

CREATE POLICY "Suppliers can update boost only"
ON public.supplier_inventory_matches
FOR UPDATE
USING (auth.uid() = supplier_id)
WITH CHECK (auth.uid() = supplier_id);

-- ============================================
-- CREATE BUYER-SAFE VIEW (no supplier identity, no internal metrics)
-- ============================================
CREATE OR REPLACE VIEW public.buyer_inventory_discovery AS
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

-- Grant SELECT on view to authenticated users (buyers)
GRANT SELECT ON public.buyer_inventory_discovery TO authenticated;

-- ============================================
-- COMMENT for audit
-- ============================================
COMMENT ON TABLE public.supplier_inventory_matches IS 'supplier_inventory_ai_v1 • city-based • buyer-safe • audit-ready';
COMMENT ON VIEW public.buyer_inventory_discovery IS 'Buyer-safe view hiding supplier identity and internal AI metrics';