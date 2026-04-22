-- Fix type mismatch: user_roles.role is app_role enum, role_permissions.role is text.
-- The join `ur.role = rp.role` triggers: operator does not exist: app_role = text.
-- Cast to text to make the comparison valid.

CREATE OR REPLACE FUNCTION public.check_permission(p_user_id uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role::text = rp.role
    WHERE ur.user_id = p_user_id
      AND rp.permission = p_permission
  );
END;
$function$;