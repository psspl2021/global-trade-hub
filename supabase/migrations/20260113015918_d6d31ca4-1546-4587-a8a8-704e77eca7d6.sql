-- ============================================
-- FIFO AFFILIATE SYSTEM + SELF-REFERRAL PREVENTION
-- ============================================

-- 1. Create affiliates table with FIFO enforcement
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'WAITLISTED', 'REJECTED', 'SUSPENDED')),
  queue_position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivation_reason TEXT,
  referral_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own affiliate status" 
  ON public.affiliates FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliates" 
  ON public.affiliates FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Unique index on user_id (prevents duplicate entries)
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_user ON public.affiliates(user_id);

-- 2. FIFO Registration Function (Concurrency-Safe)
CREATE OR REPLACE FUNCTION public.register_affiliate(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_active_count INT;
  v_existing_status TEXT;
  v_queue_position INT;
  v_max_affiliates INT := 50;
BEGIN
  -- Check if user is already an affiliate
  SELECT status INTO v_existing_status
  FROM public.affiliates
  WHERE user_id = p_user_id;

  IF v_existing_status IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', v_existing_status,
      'message', 'You have already applied to the affiliate program'
    );
  END IF;

  -- Lock table to avoid race conditions
  LOCK TABLE public.affiliates IN EXCLUSIVE MODE;

  -- Count current active affiliates
  SELECT COUNT(*)
  INTO v_active_count
  FROM public.affiliates
  WHERE status = 'ACTIVE';

  -- If slots available → ACTIVATE
  IF v_active_count < v_max_affiliates THEN
    INSERT INTO public.affiliates (user_id, status, activated_at, queue_position)
    VALUES (p_user_id, 'ACTIVE', now(), v_active_count + 1);

    RETURN jsonb_build_object(
      'success', true,
      'status', 'ACTIVE',
      'message', 'Congratulations! You are now an active affiliate partner.',
      'position', v_active_count + 1
    );
  END IF;

  -- Else → WAITLIST with position
  SELECT COALESCE(MAX(queue_position), v_max_affiliates) + 1 INTO v_queue_position
  FROM public.affiliates
  WHERE status = 'WAITLISTED';

  INSERT INTO public.affiliates (user_id, status, queue_position)
  VALUES (p_user_id, 'WAITLISTED', v_queue_position);

  RETURN jsonb_build_object(
    'success', true,
    'status', 'WAITLISTED',
    'message', 'All affiliate slots are currently filled. You have been added to the waiting list.',
    'position', v_queue_position
  );
END;
$$;

-- 3. FIFO Promotion Function
CREATE OR REPLACE FUNCTION public.promote_next_affiliate()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_next_user UUID;
  v_active_count INT;
  v_max_affiliates INT := 50;
BEGIN
  -- Check if there's room for promotion
  SELECT COUNT(*) INTO v_active_count
  FROM public.affiliates
  WHERE status = 'ACTIVE';

  IF v_active_count >= v_max_affiliates THEN
    RETURN;
  END IF;

  -- Find earliest waitlisted affiliate (FIFO)
  SELECT user_id
  INTO v_next_user
  FROM public.affiliates
  WHERE status = 'WAITLISTED'
  ORDER BY queue_position ASC, created_at ASC
  LIMIT 1;

  IF v_next_user IS NOT NULL THEN
    UPDATE public.affiliates
    SET status = 'ACTIVE',
        activated_at = now(),
        updated_at = now()
    WHERE user_id = v_next_user;
  END IF;
END;
$$;

-- 4. Auto-Promote Trigger
CREATE OR REPLACE FUNCTION public.handle_affiliate_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If an active affiliate is deactivated, promote next in queue
  IF OLD.status = 'ACTIVE' AND NEW.status != 'ACTIVE' THEN
    PERFORM public.promote_next_affiliate();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_affiliate_status_change ON public.affiliates;
CREATE TRIGGER trg_affiliate_status_change
AFTER UPDATE OF status ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.handle_affiliate_status_change();

-- 5. Enhanced Self-Referral Detection Function
CREATE OR REPLACE FUNCTION public.check_self_referral_v2(
  p_referrer_id UUID,
  p_user_id UUID,
  p_user_phone TEXT DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_referrer_profile RECORD;
  v_is_self_referral BOOLEAN := FALSE;
  v_reason TEXT := NULL;
BEGIN
  -- Same user ID check (critical)
  IF p_referrer_id = p_user_id THEN
    RETURN jsonb_build_object(
      'is_self_referral', true,
      'reason', 'SAME_USER_ID',
      'message', 'You cannot refer yourself'
    );
  END IF;
  
  -- Get referrer profile
  SELECT phone, email INTO v_referrer_profile 
  FROM profiles 
  WHERE id = p_referrer_id;
  
  -- Check same phone number
  IF p_user_phone IS NOT NULL AND v_referrer_profile.phone IS NOT NULL THEN
    IF REPLACE(REPLACE(v_referrer_profile.phone, '+', ''), ' ', '') = 
       REPLACE(REPLACE(p_user_phone, '+', ''), ' ', '') THEN
      RETURN jsonb_build_object(
        'is_self_referral', true,
        'reason', 'SAME_PHONE_NUMBER',
        'message', 'You cannot select a referrer with the same phone number'
      );
    END IF;
  END IF;
  
  -- Check same email
  IF p_user_email IS NOT NULL AND v_referrer_profile.email IS NOT NULL THEN
    IF LOWER(TRIM(v_referrer_profile.email)) = LOWER(TRIM(p_user_email)) THEN
      RETURN jsonb_build_object(
        'is_self_referral', true,
        'reason', 'SAME_EMAIL',
        'message', 'You cannot select a referrer with the same email address'
      );
    END IF;
  END IF;
  
  -- No self-referral detected
  RETURN jsonb_build_object(
    'is_self_referral', false,
    'reason', null,
    'message', 'Valid referral'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Function to block commission for self-referrals
CREATE OR REPLACE FUNCTION public.block_self_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_profile RECORD;
  v_referred_profile RECORD;
  v_is_self_referral BOOLEAN := FALSE;
BEGIN
  -- Get profiles
  SELECT phone, email INTO v_referrer_profile FROM profiles WHERE id = NEW.referrer_id;
  SELECT phone, email INTO v_referred_profile FROM profiles WHERE id = NEW.referred_id;
  
  -- Check same user ID
  IF NEW.referrer_id = NEW.referred_id THEN
    v_is_self_referral := TRUE;
  END IF;
  
  -- Check same phone (normalized)
  IF v_referrer_profile.phone IS NOT NULL AND v_referred_profile.phone IS NOT NULL THEN
    IF REPLACE(REPLACE(v_referrer_profile.phone, '+', ''), ' ', '') = 
       REPLACE(REPLACE(v_referred_profile.phone, '+', ''), ' ', '') THEN
      v_is_self_referral := TRUE;
    END IF;
  END IF;
  
  -- Check same email
  IF v_referrer_profile.email IS NOT NULL AND v_referred_profile.email IS NOT NULL THEN
    IF LOWER(TRIM(v_referrer_profile.email)) = LOWER(TRIM(v_referred_profile.email)) THEN
      v_is_self_referral := TRUE;
    END IF;
  END IF;
  
  -- If self-referral, zero out commission and flag it
  IF v_is_self_referral THEN
    NEW.commission_amount := 0;
    NEW.status := 'cancelled';
    NEW.fraud_review_status := 'blocked';
    NEW.fraud_score := 100;
    NEW.fraud_flags := jsonb_build_array(
      jsonb_build_object(
        'type', 'SELF_REFERRAL_ATTEMPT',
        'severity', 'critical',
        'message', 'Self-referral detected - commission blocked',
        'detected_at', now()
      )
    );
    NEW.release_hold_reason := 'Self-referral attempt - commission permanently blocked';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create/replace the trigger for self-referral blocking
DROP TRIGGER IF EXISTS trg_block_self_referral ON public.referral_commissions;
CREATE TRIGGER trg_block_self_referral
  BEFORE INSERT ON public.referral_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.block_self_referral_commission();

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION public.register_affiliate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_self_referral_v2(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT SELECT ON public.affiliates TO authenticated;