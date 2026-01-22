-- Fix supplier shortlist function using correct column names from profiles table
DROP FUNCTION IF EXISTS public.get_supplier_shortlist(text, text);

CREATE OR REPLACE FUNCTION public.get_supplier_shortlist(
  p_country text,
  p_category text
)
RETURNS TABLE (
  supplier_id uuid,
  company_name text,
  supplier_country text,
  is_verified boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.company_name,
    p.country,
    COALESCE(p.is_verified_supplier, false)
  FROM public.profiles p
  WHERE p.business_type = 'supplier'
    AND (p.country ILIKE p_country OR p.supplier_categories && ARRAY[p_category])
  ORDER BY p.is_verified_supplier DESC NULLS LAST, p.created_at DESC
  LIMIT 5;
$$;