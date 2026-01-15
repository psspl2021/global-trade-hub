-- Fix Security Definer View warnings for the newly created views
-- Convert views to use security_invoker = true (Postgres 15+)

-- Recreate anonymized_supplier_quotes with security invoker
DROP VIEW IF EXISTS public.anonymized_supplier_quotes;
CREATE VIEW public.anonymized_supplier_quotes 
WITH (security_invoker = true)
AS
SELECT 
  b.id as bid_id,
  b.requirement_id,
  b.supplier_id,
  b.bid_amount,
  b.buyer_visible_price,
  b.delivery_timeline_days,
  b.status as bid_status,
  b.created_at,
  b.terms_and_conditions,
  b.is_paid_bid,
  'SUP-' || UPPER(LEFT(b.supplier_id::text, 4)) as supplier_code,
  p.city as supplier_city,
  p.is_verified_supplier,
  COALESCE(p.supplier_categories, ARRAY[]::text[]) as supplier_categories
FROM public.bids b
LEFT JOIN public.profiles p ON p.id = b.supplier_id;

GRANT SELECT ON public.anonymized_supplier_quotes TO authenticated;

-- Recreate safe_supplier_profiles with security invoker
DROP VIEW IF EXISTS public.safe_supplier_profiles;
CREATE VIEW public.safe_supplier_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  city,
  state,
  country,
  is_verified_supplier,
  supplier_categories,
  created_at
FROM public.profiles;

GRANT SELECT ON public.safe_supplier_profiles TO authenticated;