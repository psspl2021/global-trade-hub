-- Add dispatched_qty column to referral_commissions so we don't need to join with bids
ALTER TABLE public.referral_commissions 
ADD COLUMN IF NOT EXISTS dispatched_qty numeric DEFAULT 0;