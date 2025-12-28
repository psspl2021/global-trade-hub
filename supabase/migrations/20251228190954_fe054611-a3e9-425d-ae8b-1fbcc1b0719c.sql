-- Create table for subscription payment invoices
CREATE TABLE public.subscription_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  payment_type TEXT NOT NULL, -- 'email_subscription' or 'premium_pack'
  payment_id TEXT NOT NULL, -- order_id from the payment
  
  -- Company details (PSSPL)
  company_name TEXT NOT NULL DEFAULT 'PROCURESAATHI SOLUTIONS PRIVATE LIMITED',
  company_address TEXT NOT NULL DEFAULT 'METRO PILLAR NUMBER 564 14/3 MATHURA ROAD, SECTOR 31, FARIDABAD, Haryana',
  company_gstin TEXT NOT NULL DEFAULT '06AAMCP4662L1ZW',
  
  -- Customer details
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_gstin TEXT,
  
  -- Item details
  description TEXT NOT NULL,
  hsn_sac_code TEXT DEFAULT '998314', -- SAC code for online marketplace services
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  
  -- Tax details
  tax_rate NUMERIC DEFAULT 18,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  
  -- Totals
  subtotal NUMERIC NOT NULL,
  total_tax NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  
  -- Metadata
  place_of_supply TEXT DEFAULT 'Haryana (06)',
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- PDF storage
  pdf_url TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_subscription_invoices_user_id ON public.subscription_invoices(user_id);
CREATE INDEX idx_subscription_invoices_payment_id ON public.subscription_invoices(payment_id);

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS subscription_invoice_seq START WITH 1;

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_subscription_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'PSSPL/' || TO_CHAR(NOW(), 'YYYY-MM') || '/' || LPAD(NEXTVAL('subscription_invoice_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating invoice number
CREATE TRIGGER set_subscription_invoice_number
  BEFORE INSERT ON public.subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_subscription_invoice_number();

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_invoices_updated_at
  BEFORE UPDATE ON public.subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY "Users can view their own subscription invoices" 
ON public.subscription_invoices 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admin can view all invoices
CREATE POLICY "Admins can view all subscription invoices" 
ON public.subscription_invoices 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service role can manage subscription invoices" 
ON public.subscription_invoices 
FOR ALL 
USING (true)
WITH CHECK (true);