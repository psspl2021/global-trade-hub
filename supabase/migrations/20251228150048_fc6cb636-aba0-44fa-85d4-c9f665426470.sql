-- Create table for premium bid pack payments
CREATE TABLE public.premium_bid_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 24950,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  cf_payment_id TEXT,
  payment_session_id TEXT,
  payment_method TEXT,
  bids_purchased INTEGER NOT NULL DEFAULT 50,
  bids_credited BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.premium_bid_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own premium bid payments"
ON public.premium_bid_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY "Users can create own premium bid payments"
ON public.premium_bid_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all premium bid payments"
ON public.premium_bid_payments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_premium_bid_payments_user_id ON public.premium_bid_payments(user_id);
CREATE INDEX idx_premium_bid_payments_order_id ON public.premium_bid_payments(order_id);
CREATE INDEX idx_premium_bid_payments_status ON public.premium_bid_payments(status);