-- Fix the access control function to use correct column name
DROP FUNCTION IF EXISTS public.can_access_purchaser_rewards(UUID);

CREATE OR REPLACE FUNCTION public.can_access_purchaser_rewards(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_user_id
    AND p.business_type IN ('buyer', 'purchaser', 'enterprise')
  )
  OR public.has_role(p_user_id, 'admin');
$$;