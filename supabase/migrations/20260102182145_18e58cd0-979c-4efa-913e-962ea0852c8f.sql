-- Update referral_commissions table to include platform fee breakdown
ALTER TABLE public.referral_commissions 
ADD COLUMN IF NOT EXISTS platform_fee_percentage NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC,
ADD COLUMN IF NOT EXISTS referral_share_percentage NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS platform_net_revenue NUMERIC;

-- Update the trigger function with correct commission logic
CREATE OR REPLACE FUNCTION public.calculate_referral_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_platform_fee_pct NUMERIC := 0.5; -- 0.5% platform fee
  v_referral_share_pct NUMERIC := 20; -- 20% of platform fee goes to referrer
  v_platform_fee_amt NUMERIC;
  v_commission_pct NUMERIC;
  v_commission_amt NUMERIC;
  v_platform_net NUMERIC;
  v_referrer_profile profiles%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Check if this supplier was referred
    SELECT * INTO v_referral 
    FROM referrals 
    WHERE referred_id = NEW.supplier_id 
    LIMIT 1;
    
    IF FOUND THEN
      -- Calculate platform fee (0.5% of bid amount)
      v_platform_fee_amt := ROUND(NEW.bid_amount * (v_platform_fee_pct / 100), 2);
      
      -- Calculate referral commission (20% of platform fee = 0.1% of order value)
      v_commission_pct := v_platform_fee_pct * (v_referral_share_pct / 100); -- 0.1%
      v_commission_amt := ROUND(v_platform_fee_amt * (v_referral_share_pct / 100), 2);
      
      -- Calculate platform net revenue after referral payout
      v_platform_net := v_platform_fee_amt - v_commission_amt;
      
      -- Insert commission record with full breakdown
      INSERT INTO referral_commissions (
        referral_id, bid_id, referrer_id, referred_id,
        bid_amount, platform_fee_percentage, platform_fee_amount,
        referral_share_percentage, commission_percentage, commission_amount,
        platform_net_revenue
      )
      VALUES (
        v_referral.id, NEW.id, v_referral.referrer_id, NEW.supplier_id,
        NEW.bid_amount, v_platform_fee_pct, v_platform_fee_amt,
        v_referral_share_pct, v_commission_pct, v_commission_amt,
        v_platform_net
      )
      ON CONFLICT (bid_id) DO NOTHING;
      
      -- Get referrer profile for notification
      SELECT * INTO v_referrer_profile FROM profiles WHERE id = v_referral.referrer_id;
      
      -- Create notification for referrer
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        v_referral.referrer_id,
        'referral_commission',
        'Referral Commission Earned!',
        'You earned ₹' || v_commission_amt || ' (20% of platform fee) from an order by your referred account.',
        jsonb_build_object(
          'bid_id', NEW.id,
          'order_value', NEW.bid_amount,
          'platform_fee', v_platform_fee_amt,
          'commission_amount', v_commission_amt,
          'referred_id', NEW.supplier_id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update existing records to have correct default values
UPDATE public.referral_commissions 
SET 
  platform_fee_percentage = 0.5,
  referral_share_percentage = 20,
  commission_percentage = 0.1,
  platform_fee_amount = ROUND(bid_amount * 0.005, 2),
  commission_amount = ROUND(bid_amount * 0.001, 2),
  platform_net_revenue = ROUND(bid_amount * 0.004, 2)
WHERE platform_fee_amount IS NULL;