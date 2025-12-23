-- Create a function to get limited profile data for business relationships
-- This prevents exposing sensitive fields to users who only have a business relationship

CREATE OR REPLACE FUNCTION public.get_business_contact_profile(_profile_id uuid)
RETURNS TABLE (
  id uuid,
  company_name text,
  contact_person text,
  city text,
  state text,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.company_name,
    p.contact_person,
    p.city,
    p.state,
    p.country
  FROM profiles p
  WHERE p.id = _profile_id
    AND (
      -- Allow if viewing own profile
      auth.uid() = _profile_id
      -- Allow if admin
      OR has_role(auth.uid(), 'admin'::app_role)
      -- Allow if has business relationship (accepted bid)
      OR has_business_relationship(auth.uid(), _profile_id)
    );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_business_contact_profile(uuid) TO authenticated;

-- Add a comment explaining the purpose
COMMENT ON FUNCTION public.get_business_contact_profile IS 
'Returns limited profile fields for users with business relationships. 
Sensitive fields like email, phone, address, and GSTIN are excluded for non-owners.
Use this function when fetching profile data for business partners.';

-- Create an RPC to check if current user can view full profile (owner or admin)
CREATE OR REPLACE FUNCTION public.can_view_full_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    auth.uid() = _profile_id
    OR has_role(auth.uid(), 'admin'::app_role)
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_view_full_profile(uuid) TO authenticated;