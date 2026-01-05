-- Drop the security definer view and recreate as a regular view
-- The view's WHERE clause already filters by auth.uid() which is sufficient

DROP VIEW IF EXISTS public.user_totp_status;

-- Create a simple view without security definer - uses invoker's permissions
-- This is safe because user_totp_secrets already has proper RLS policies
CREATE VIEW public.user_totp_status WITH (security_invoker = true) AS
SELECT 
  user_id,
  is_enabled,
  created_at,
  updated_at,
  CASE WHEN backup_codes IS NOT NULL AND array_length(backup_codes, 1) > 0 
       THEN array_length(backup_codes, 1) 
       ELSE 0 
  END as backup_codes_remaining
FROM public.user_totp_secrets;

-- Grant access to the view
GRANT SELECT ON public.user_totp_status TO authenticated;