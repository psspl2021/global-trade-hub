
-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_credited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'signed_up', 'rewarded'))
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own referrals as referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are referred"
ON public.referrals FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can update referrals"
ON public.referrals FOR UPDATE
USING (true);

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate code: PS- + first 4 chars of user_id + 4 random chars
    code := 'PS-' || UPPER(SUBSTRING(user_id::TEXT, 1, 4)) || UPPER(SUBSTRING(md5(random()::text), 1, 4));
    
    -- Check if code exists
    SELECT COUNT(*) INTO exists_count FROM referrals WHERE referral_code = code;
    
    IF exists_count = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Create function to handle referral reward when bid is accepted
CREATE OR REPLACE FUNCTION public.handle_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Check if this supplier was referred and reward not yet credited
    SELECT * INTO v_referral 
    FROM referrals 
    WHERE referred_id = NEW.supplier_id 
      AND status = 'signed_up' 
      AND reward_credited = FALSE
    LIMIT 1;
    
    IF FOUND THEN
      -- Credit referrer with +1 premium bid
      UPDATE subscriptions 
      SET premium_bids_balance = premium_bids_balance + 1,
          updated_at = NOW()
      WHERE user_id = v_referral.referrer_id;
      
      -- Update referral status
      UPDATE referrals 
      SET status = 'rewarded',
          reward_credited = TRUE,
          rewarded_at = NOW()
      WHERE id = v_referral.id;
      
      -- Create notification for referrer
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        v_referral.referrer_id,
        'referral_reward',
        'Referral Reward Earned!',
        'You earned 1 free bid! Your referred user just had their bid accepted.',
        jsonb_build_object('referral_id', v_referral.id, 'referred_id', NEW.supplier_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for supplier bids
CREATE TRIGGER on_bid_accepted_referral_reward
AFTER UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_referral_reward();

-- Create similar function for logistics bids
CREATE OR REPLACE FUNCTION public.handle_logistics_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Check if this transporter was referred and reward not yet credited
    SELECT * INTO v_referral 
    FROM referrals 
    WHERE referred_id = NEW.transporter_id 
      AND status = 'signed_up' 
      AND reward_credited = FALSE
    LIMIT 1;
    
    IF FOUND THEN
      -- Credit referrer with +1 premium bid
      UPDATE subscriptions 
      SET premium_bids_balance = premium_bids_balance + 1,
          updated_at = NOW()
      WHERE user_id = v_referral.referrer_id;
      
      -- Update referral status
      UPDATE referrals 
      SET status = 'rewarded',
          reward_credited = TRUE,
          rewarded_at = NOW()
      WHERE id = v_referral.id;
      
      -- Create notification for referrer
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        v_referral.referrer_id,
        'referral_reward',
        'Referral Reward Earned!',
        'You earned 1 free bid! Your referred user just had their bid accepted.',
        jsonb_build_object('referral_id', v_referral.id, 'referred_id', NEW.transporter_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for logistics bids
CREATE TRIGGER on_logistics_bid_accepted_referral_reward
AFTER UPDATE ON public.logistics_bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_logistics_referral_reward();

-- Create index for faster lookups
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
