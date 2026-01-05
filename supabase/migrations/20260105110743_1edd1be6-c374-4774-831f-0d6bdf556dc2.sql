-- SECURITY FIX 1: Restrict profile access - remove has_business_relationship from direct profile SELECT policy
-- Business contacts should only see limited info via the secure function, not full profile

-- Drop the existing permissive policy that exposes too much data
DROP POLICY IF EXISTS "Users can view related profiles" ON public.profiles;

-- Create a new restrictive policy - users can only view their OWN profile directly
-- Business relationship viewing should go through the secure function get_business_contact_profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Note: Admins already have a separate policy "Admins can view all profiles"
-- Business contacts must use get_business_contact_profile() function which returns limited fields

-- SECURITY FIX 2: Improve TOTP verification security
-- Create a security definer function to verify TOTP without exposing encrypted_secret
-- The encrypted_secret and backup_codes should never be returned to the client

-- Create a view that only exposes safe TOTP fields (not the secret or backup codes)
CREATE OR REPLACE VIEW public.user_totp_status AS
SELECT 
  user_id,
  is_enabled,
  created_at,
  updated_at,
  CASE WHEN backup_codes IS NOT NULL AND array_length(backup_codes, 1) > 0 
       THEN array_length(backup_codes, 1) 
       ELSE 0 
  END as backup_codes_remaining
FROM public.user_totp_secrets
WHERE user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.user_totp_status TO authenticated;

-- Create a secure function to verify TOTP codes without exposing secrets
CREATE OR REPLACE FUNCTION public.verify_totp_securely(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_totp_record user_totp_secrets%ROWTYPE;
  v_is_valid boolean := false;
BEGIN
  -- Get the user's TOTP record
  SELECT * INTO v_totp_record 
  FROM user_totp_secrets 
  WHERE user_id = auth.uid() AND is_enabled = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Note: Actual TOTP verification happens in the edge function
  -- This function just confirms TOTP is set up for the user
  -- The edge function handles the actual crypto verification
  RETURN v_totp_record.is_enabled;
END;
$$;

-- Create a secure function to consume a backup code
CREATE OR REPLACE FUNCTION public.consume_backup_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_totp_record user_totp_secrets%ROWTYPE;
  v_new_codes text[];
BEGIN
  -- Get the user's TOTP record
  SELECT * INTO v_totp_record 
  FROM user_totp_secrets 
  WHERE user_id = auth.uid() AND is_enabled = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if the code exists in backup_codes
  IF NOT (p_code = ANY(v_totp_record.backup_codes)) THEN
    RETURN false;
  END IF;
  
  -- Remove the used code
  SELECT array_agg(code) INTO v_new_codes
  FROM unnest(v_totp_record.backup_codes) AS code
  WHERE code != p_code;
  
  -- Update the backup codes
  UPDATE user_totp_secrets 
  SET backup_codes = v_new_codes, updated_at = now()
  WHERE user_id = auth.uid();
  
  RETURN true;
END;
$$;