
DROP POLICY IF EXISTS "Admins can view supplier profiles" ON public.supplier_ai_profiles;

CREATE POLICY supplier_profiles_admin_read
ON public.supplier_ai_profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])
    )
);
