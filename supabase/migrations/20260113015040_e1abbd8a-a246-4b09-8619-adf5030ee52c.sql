-- ============================================
-- ANTI-FRAUD REFERRAL SYSTEM MIGRATION
-- ============================================

-- 1. Add fraud detection fields to referral_commissions table
ALTER TABLE public.referral_commissions 
ADD COLUMN IF NOT EXISTS fraud_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_review_status TEXT DEFAULT 'pending' CHECK (fraud_review_status IN ('pending', 'cleared', 'flagged', 'blocked')),
ADD COLUMN IF NOT EXISTS fraud_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fraud_reviewed_by UUID,
ADD COLUMN IF NOT EXISTS release_eligible_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS release_hold_reason TEXT;

-- 2. Add fraud detection fields to referrals table
ALTER TABLE public.referrals
ADD COLUMN IF NOT EXISTS is_self_referral BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fraud_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fraud_reason TEXT,
ADD COLUMN IF NOT EXISTS referrer_gstin TEXT,
ADD COLUMN IF NOT EXISTS referrer_phone TEXT,
ADD COLUMN IF NOT EXISTS referrer_email TEXT,
ADD COLUMN IF NOT EXISTS referrer_bank_account TEXT,
ADD COLUMN IF NOT EXISTS referred_gstin TEXT,
ADD COLUMN IF NOT EXISTS referred_phone TEXT,
ADD COLUMN IF NOT EXISTS referred_email TEXT,
ADD COLUMN IF NOT EXISTS referred_bank_account TEXT,
ADD COLUMN IF NOT EXISTS signup_ip_address TEXT,
ADD COLUMN IF NOT EXISTS referrer_signup_ip TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS referrer_device_fingerprint TEXT;

-- 3. Create affiliate_eligibility table to track who can earn commissions
CREATE TABLE IF NOT EXISTS public.affiliate_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_eligible BOOLEAN DEFAULT FALSE,
  eligibility_type TEXT NOT NULL CHECK (eligibility_type IN ('independent_promoter', 'consultant', 'agent', 'channel_partner', 'logistics_partner', 'disqualified')),
  disqualification_reason TEXT,
  max_commission_per_order NUMERIC DEFAULT 50000,
  monthly_payout_cap NUMERIC DEFAULT 500000,
  commission_tier TEXT DEFAULT 'standard' CHECK (commission_tier IN ('standard', 'silver', 'gold', 'platinum')),
  total_gmv_referred NUMERIC DEFAULT 0,
  kyc_verified BOOLEAN DEFAULT FALSE,
  kyc_verified_at TIMESTAMP WITH TIME ZONE,
  kyc_verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for affiliate_eligibility
ALTER TABLE public.affiliate_eligibility ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliate_eligibility
CREATE POLICY "Users can view their own eligibility" 
  ON public.affiliate_eligibility FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all eligibility records" 
  ON public.affiliate_eligibility FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create related_party_registry for tracking relationships
CREATE TABLE IF NOT EXISTS public.related_party_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL,
  user_id_2 UUID NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('same_gstin', 'same_phone', 'same_email', 'same_bank_account', 'same_ip', 'same_device', 'same_address', 'director_match', 'manual_link')),
  confidence_score INTEGER DEFAULT 100,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  is_confirmed BOOLEAN DEFAULT TRUE,
  notes TEXT,
  UNIQUE(user_id_1, user_id_2, relationship_type)
);

-- Enable RLS for related_party_registry
ALTER TABLE public.related_party_registry ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage related party records
CREATE POLICY "Only admins can manage related party registry" 
  ON public.related_party_registry FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Update commission status to add 'on_hold' and 'cancelled'
-- First, let's check and update the status values
UPDATE public.referral_commissions 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'paid', 'on_hold', 'cancelled', 'processing');

-- 6. Create function to detect self-referrals
CREATE OR REPLACE FUNCTION public.check_self_referral(
  p_referrer_id UUID,
  p_referred_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_referrer_profile RECORD;
  v_referred_profile RECORD;
  v_fraud_flags JSONB := '[]'::jsonb;
  v_fraud_score INTEGER := 0;
BEGIN
  -- Get referrer profile
  SELECT * INTO v_referrer_profile 
  FROM profiles 
  WHERE id = p_referrer_id;
  
  -- Get referred profile
  SELECT * INTO v_referred_profile 
  FROM profiles 
  WHERE id = p_referred_id;
  
  -- Check if same user
  IF p_referrer_id = p_referred_id THEN
    v_fraud_flags := v_fraud_flags || jsonb_build_array(jsonb_build_object('type', 'same_user', 'severity', 'critical', 'message', 'Referrer and referred are the same user'));
    v_fraud_score := v_fraud_score + 100;
  END IF;
  
  -- Check same email
  IF v_referrer_profile.email = v_referred_profile.email THEN
    v_fraud_flags := v_fraud_flags || jsonb_build_array(jsonb_build_object('type', 'same_email', 'severity', 'critical', 'message', 'Same email address'));
    v_fraud_score := v_fraud_score + 100;
  END IF;
  
  -- Check same phone
  IF v_referrer_profile.phone IS NOT NULL AND v_referrer_profile.phone = v_referred_profile.phone THEN
    v_fraud_flags := v_fraud_flags || jsonb_build_array(jsonb_build_object('type', 'same_phone', 'severity', 'critical', 'message', 'Same phone number'));
    v_fraud_score := v_fraud_score + 100;
  END IF;
  
  -- Check same GSTIN
  IF v_referrer_profile.gstin IS NOT NULL AND v_referrer_profile.gstin = v_referred_profile.gstin THEN
    v_fraud_flags := v_fraud_flags || jsonb_build_array(jsonb_build_object('type', 'same_gstin', 'severity', 'critical', 'message', 'Same GSTIN - likely same company'));
    v_fraud_score := v_fraud_score + 100;
  END IF;
  
  -- Check same bank account
  IF v_referrer_profile.bank_account_number IS NOT NULL 
     AND v_referrer_profile.bank_account_number = v_referred_profile.bank_account_number THEN
    v_fraud_flags := v_fraud_flags || jsonb_build_array(jsonb_build_object('type', 'same_bank_account', 'severity', 'critical', 'message', 'Same bank account'));
    v_fraud_score := v_fraud_score + 100;
  END IF;
  
  -- Check same company name (fuzzy match)
  IF v_referrer_profile.company_name IS NOT NULL 
     AND v_referred_profile.company_name IS NOT NULL
     AND LOWER(TRIM(v_referrer_profile.company_name)) = LOWER(TRIM(v_referred_profile.company_name)) THEN
    v_fraud_flags := v_fraud_flags || jsonb_build_array(jsonb_build_object('type', 'same_company', 'severity', 'high', 'message', 'Same company name'));
    v_fraud_score := v_fraud_score + 80;
  END IF;
  
  -- Check same address
  IF v_referrer_profile.address IS NOT NULL 
     AND v_referred_profile.address IS NOT NULL
     AND LOWER(TRIM(v_referrer_profile.address)) = LOWER(TRIM(v_referred_profile.address)) THEN
    v_fraud_flags := v_fraud_flags || jsonb_build_array(jsonb_build_object('type', 'same_address', 'severity', 'medium', 'message', 'Same registered address'));
    v_fraud_score := v_fraud_score + 50;
  END IF;
  
  RETURN jsonb_build_object(
    'fraud_detected', v_fraud_score >= 100,
    'fraud_score', v_fraud_score,
    'fraud_flags', v_fraud_flags,
    'recommendation', CASE 
      WHEN v_fraud_score >= 100 THEN 'block'
      WHEN v_fraud_score >= 50 THEN 'review'
      ELSE 'approve'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create function to calculate tiered commission
CREATE OR REPLACE FUNCTION public.calculate_tiered_commission(
  p_user_id UUID,
  p_base_commission NUMERIC,
  p_gmv NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_eligibility RECORD;
  v_effective_rate NUMERIC;
  v_capped_commission NUMERIC;
BEGIN
  -- Get user's eligibility record
  SELECT * INTO v_eligibility 
  FROM affiliate_eligibility 
  WHERE user_id = p_user_id;
  
  -- If not eligible or disqualified, return 0
  IF v_eligibility IS NULL OR v_eligibility.is_eligible = FALSE 
     OR v_eligibility.eligibility_type = 'disqualified' THEN
    RETURN 0;
  END IF;
  
  -- Calculate effective rate based on tier and total GMV
  -- Standard: 20% up to 10L, 15% for 10L-50L, 10% beyond
  v_effective_rate := CASE v_eligibility.commission_tier
    WHEN 'platinum' THEN 0.20  -- Fixed 20% for platinum
    WHEN 'gold' THEN 0.18
    WHEN 'silver' THEN 0.15
    ELSE -- standard tier with slabs
      CASE 
        WHEN v_eligibility.total_gmv_referred <= 1000000 THEN 0.20
        WHEN v_eligibility.total_gmv_referred <= 5000000 THEN 0.15
        ELSE 0.10
      END
  END;
  
  -- Apply rate to base commission
  v_capped_commission := p_base_commission * (v_effective_rate / 0.20);
  
  -- Apply per-order cap
  IF v_eligibility.max_commission_per_order IS NOT NULL 
     AND v_capped_commission > v_eligibility.max_commission_per_order THEN
    v_capped_commission := v_eligibility.max_commission_per_order;
  END IF;
  
  RETURN v_capped_commission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Create trigger function to auto-detect fraud on new referral commissions
CREATE OR REPLACE FUNCTION public.detect_referral_fraud()
RETURNS TRIGGER AS $$
DECLARE
  v_fraud_check JSONB;
  v_release_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Run fraud check
  v_fraud_check := check_self_referral(NEW.referrer_id, NEW.referred_id);
  
  -- Set 30-day hold period for commission release
  v_release_date := NOW() + INTERVAL '30 days';
  
  -- Update the new record with fraud detection results
  NEW.fraud_flags := v_fraud_check->>'fraud_flags';
  NEW.fraud_score := (v_fraud_check->>'fraud_score')::INTEGER;
  NEW.release_eligible_at := v_release_date;
  
  -- If fraud detected, put on hold or block
  IF (v_fraud_check->>'fraud_detected')::BOOLEAN = TRUE THEN
    NEW.status := 'on_hold';
    NEW.fraud_review_status := 'flagged';
    NEW.release_hold_reason := 'Auto-flagged: Related party detected';
  ELSIF NEW.fraud_score >= 50 THEN
    NEW.status := 'on_hold';
    NEW.fraud_review_status := 'pending';
    NEW.release_hold_reason := 'Manual review required: Potential related party';
  ELSE
    NEW.fraud_review_status := 'pending';
    NEW.release_hold_reason := 'Standard 30-day cooling period';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new referral commissions
DROP TRIGGER IF EXISTS trg_detect_referral_fraud ON public.referral_commissions;
CREATE TRIGGER trg_detect_referral_fraud
  BEFORE INSERT ON public.referral_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_referral_fraud();

-- 9. Create function to check eligibility before creating referral
CREATE OR REPLACE FUNCTION public.validate_referral_eligibility(
  p_referrer_id UUID,
  p_referred_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_eligible BOOLEAN;
  v_fraud_check JSONB;
BEGIN
  -- Check if referrer is eligible
  SELECT is_eligible INTO v_is_eligible 
  FROM affiliate_eligibility 
  WHERE user_id = p_referrer_id;
  
  -- If no eligibility record, check if they should be eligible
  -- (For now, allow all but flag for review)
  IF v_is_eligible IS NULL THEN
    v_is_eligible := TRUE;
  END IF;
  
  -- Run fraud check
  v_fraud_check := check_self_referral(p_referrer_id, p_referred_id);
  
  -- If critical fraud detected, reject
  IF (v_fraud_check->>'fraud_detected')::BOOLEAN = TRUE THEN
    RETURN FALSE;
  END IF;
  
  RETURN v_is_eligible;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Add index for fraud detection queries
CREATE INDEX IF NOT EXISTS idx_referral_commissions_fraud_status 
  ON public.referral_commissions(fraud_review_status, status);
  
CREATE INDEX IF NOT EXISTS idx_referral_commissions_release_date 
  ON public.referral_commissions(release_eligible_at) 
  WHERE status = 'on_hold';

CREATE INDEX IF NOT EXISTS idx_related_party_users 
  ON public.related_party_registry(user_id_1, user_id_2);

-- 11. Grant necessary permissions
GRANT SELECT ON public.affiliate_eligibility TO authenticated;
GRANT ALL ON public.affiliate_eligibility TO service_role;
GRANT ALL ON public.related_party_registry TO service_role;