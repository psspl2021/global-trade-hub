-- Create referral commissions table to track payments for each accepted bid
CREATE TABLE public.referral_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  bid_amount NUMERIC NOT NULL,
  commission_percentage NUMERIC NOT NULL DEFAULT 1.0,
  commission_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bid_id)
);

-- Enable RLS
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all referral commissions"
ON public.referral_commissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own referral commissions as referrer"
ON public.referral_commissions FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view own referral commissions as referred"
ON public.referral_commissions FOR SELECT
USING (auth.uid() = referred_id);

-- Create trigger function to calculate referral commission on bid acceptance
CREATE OR REPLACE FUNCTION public.calculate_referral_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_commission_pct NUMERIC := 1.0; -- 1% commission
  v_commission_amt NUMERIC;
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
      -- Calculate commission (1% of bid amount)
      v_commission_amt := ROUND(NEW.bid_amount * (v_commission_pct / 100), 2);
      
      -- Insert commission record
      INSERT INTO referral_commissions (
        referral_id, bid_id, referrer_id, referred_id,
        bid_amount, commission_percentage, commission_amount
      )
      VALUES (
        v_referral.id, NEW.id, v_referral.referrer_id, NEW.supplier_id,
        NEW.bid_amount, v_commission_pct, v_commission_amt
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
        'You earned ₹' || v_commission_amt || ' commission from a bid by your referred account.',
        jsonb_build_object(
          'bid_id', NEW.id,
          'commission_amount', v_commission_amt,
          'referred_id', NEW.supplier_id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bids table
DROP TRIGGER IF EXISTS on_bid_accepted_calculate_commission ON public.bids;
CREATE TRIGGER on_bid_accepted_calculate_commission
AFTER UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.calculate_referral_commission();

-- Add trigger for updated_at
CREATE TRIGGER update_referral_commissions_updated_at
BEFORE UPDATE ON public.referral_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();