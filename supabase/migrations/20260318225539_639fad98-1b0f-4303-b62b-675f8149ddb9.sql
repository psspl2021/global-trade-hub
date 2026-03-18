
-- Auction Pricing Plans (bulk purchase options)
CREATE TABLE public.auction_pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  auctions_count int NOT NULL,
  price numeric NOT NULL,
  price_per_auction numeric NOT NULL,
  gst_rate numeric NOT NULL DEFAULT 0.18,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Seed pricing plans
INSERT INTO public.auction_pricing_plans (name, auctions_count, price, price_per_auction, sort_order, description)
VALUES
  ('Starter Pack', 5, 12500, 2500, 1, 'Perfect for first-time buyers. 50% discount on first 5 auctions.'),
  ('Pro Pack', 20, 80000, 4000, 2, 'Best for regular procurement. Save 20% per auction.'),
  ('Enterprise Pack', 50, 175000, 3500, 3, 'Maximum savings for high-volume buyers. Save 30% per auction.');

-- Buyer Auction Credits (wallet system)
CREATE TABLE public.buyer_auction_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  total_credits int NOT NULL DEFAULT 0,
  used_credits int NOT NULL DEFAULT 0,
  plan_id uuid REFERENCES public.auction_pricing_plans(id),
  payment_order_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.buyer_auction_credits ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own credits
CREATE POLICY "Users can view own credits"
  ON public.buyer_auction_credits
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Auction credit payments table
CREATE TABLE public.auction_credit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  plan_id uuid REFERENCES public.auction_pricing_plans(id),
  order_id text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  gst_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'pending',
  payment_session_id text,
  cf_payment_id text,
  payment_method text,
  credits_purchased int NOT NULL,
  credits_credited boolean DEFAULT false,
  paid_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.auction_credit_payments ENABLE ROW LEVEL SECURITY;

-- Buyers can view own payments
CREATE POLICY "Users can view own auction credit payments"
  ON public.auction_credit_payments
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Anyone can read pricing plans
CREATE POLICY "Anyone can read active pricing plans"
  ON public.auction_pricing_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);
