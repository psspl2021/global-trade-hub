
CREATE TABLE public.auction_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  auction_id UUID REFERENCES public.reverse_auctions(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL DEFAULT 'domestic',
  base_fee NUMERIC NOT NULL,
  gst NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auction_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own auction payments"
  ON public.auction_payments FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can insert own auction payments"
  ON public.auction_payments FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update own auction payments"
  ON public.auction_payments FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid());
