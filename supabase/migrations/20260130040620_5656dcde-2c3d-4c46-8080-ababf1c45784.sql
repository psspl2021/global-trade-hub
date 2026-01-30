-- FIX: Remove overly permissive public profile policy that exposes sensitive PII
-- The policy "Anyone can view supplier company names" currently exposes ALL profile columns
-- including email, phone, address, GSTIN, bank account details to anonymous users

-- Drop the problematic policy that exposes sensitive data
DROP POLICY IF EXISTS "Anyone can view supplier company names" ON public.profiles;

-- Create a more restrictive policy that only allows viewing profiles through accepted business relationships
-- This ensures competitors cannot scrape contact details
CREATE POLICY "Authenticated users can view profiles with accepted relationships"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- User can view their own profile
      auth.uid() = id
      -- OR user is an admin
      OR has_role(auth.uid(), 'admin'::app_role)
      -- OR user has an accepted business relationship with this profile
      OR has_business_relationship(auth.uid(), id)
    )
  );

-- Note: For public supplier discovery, the application should use the safe_supplier_profiles view
-- which only exposes: id, is_verified_supplier, created_at, city, state, country, supplier_categories
-- This view already exists and does NOT expose sensitive PII