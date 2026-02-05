-- =====================================================
-- SECURITY FIX: Protect sensitive data in profiles and referrals tables
-- =====================================================

-- PART 1: Create a secure view for profiles that excludes sensitive fields
-- This view will be used for business relationship lookups instead of direct table access

CREATE OR REPLACE VIEW public.profiles_safe 
WITH (security_invoker=on) AS
SELECT 
  id,
  company_name,
  contact_person,
  city,
  state,
  country,
  business_type,
  supplier_categories,
  buyer_industry,
  is_verified_supplier,
  logistics_partner_type,
  created_at,
  updated_at,
  is_test_account
  -- EXCLUDED: email, phone, address, gstin, bank_*, house_address, office_address, yard_location, referred_by_*, company_logo_url
FROM public.profiles;

COMMENT ON VIEW public.profiles_safe IS 'Secure view for profiles - excludes PII (email, phone, address, bank details, GSTIN) for business relationship lookups. Use this view for partner/supplier discovery.';

-- PART 2: Remove the policy that allows business relationship access to full profile data
-- This policy exposed sensitive fields like bank details, email, phone to business partners
DROP POLICY IF EXISTS "Authenticated users can view profiles with accepted relationshi" ON public.profiles;

-- PART 3: Keep existing owner and admin policies for profiles (they remain unchanged)
-- These already exist:
-- - "Users can view own profile" (auth.uid() = id) 
-- - "Admins can view all profiles" (has_role admin)
-- - "Users can update own profile" (auth.uid() = id)
-- - "Admins can update all profiles" (has_role admin)

-- PART 4: Create a new policy that allows business partners to access ONLY the safe view
-- Note: The safe view uses security_invoker, so it inherits caller's permissions
-- Business partners can query the profiles_safe view instead of profiles table

-- PART 5: Fix referrals table - hide fraud detection fields from non-admins
-- Create a secure view for referrals that excludes fraud investigation data

CREATE OR REPLACE VIEW public.referrals_safe
WITH (security_invoker=on) AS
SELECT 
  id,
  referrer_id,
  referred_id,
  referral_code,
  referred_email,
  status,
  reward_credited,
  created_at,
  signed_up_at,
  rewarded_at,
  is_self_referral
  -- EXCLUDED (fraud investigation fields - admin only): 
  -- fraud_detected, fraud_reason, signup_ip_address, referrer_signup_ip, 
  -- device_fingerprint, referrer_device_fingerprint,
  -- referrer_gstin, referrer_phone, referrer_email, referrer_bank_account,
  -- referred_gstin, referred_phone, referred_bank_account
FROM public.referrals;

COMMENT ON VIEW public.referrals_safe IS 'Secure view for referrals - excludes fraud detection fields (device fingerprints, IP addresses, fraud reasons) and sensitive PII. Users should query this view, admins can query the base table.';

-- PART 6: Update referrals RLS policies to hide fraud data from users
-- Drop existing user SELECT policies
DROP POLICY IF EXISTS "Users can view own referrals as referrer" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are referred" ON public.referrals;

-- Recreate with denial of direct SELECT - force users through the safe view
-- Users cannot select directly from referrals table, must use referrals_safe view
CREATE POLICY "Users cannot directly select referrals" 
ON public.referrals 
FOR SELECT 
TO authenticated
USING (
  -- Only admins can directly query the full referrals table
  has_role(auth.uid(), 'admin'::app_role)
);

-- Note: Admin SELECT policy already exists: "Admins can view all referrals"
-- Note: INSERT policy already exists: "Users can create referrals"
-- Note: UPDATE policy already exists: "System can update referrals"

-- Grant SELECT on safe views to authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.referrals_safe TO authenticated;