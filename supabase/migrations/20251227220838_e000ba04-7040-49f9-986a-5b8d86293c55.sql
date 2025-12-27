-- Create table to track email subscription payments
CREATE TABLE public.email_subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  payment_session_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 300,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  cf_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.email_subscription_payments ENABLE ROW LEVEL SECURITY;

-- Suppliers can view their own payments
CREATE POLICY "Suppliers can view own payments"
  ON public.email_subscription_payments
  FOR SELECT
  USING (auth.uid() = supplier_id);

-- Suppliers can create their own payments
CREATE POLICY "Suppliers can create own payments"
  ON public.email_subscription_payments
  FOR INSERT
  WITH CHECK (auth.uid() = supplier_id);

-- Create index for faster lookups
CREATE INDEX idx_email_subscription_payments_supplier ON public.email_subscription_payments(supplier_id);
CREATE INDEX idx_email_subscription_payments_order ON public.email_subscription_payments(order_id);