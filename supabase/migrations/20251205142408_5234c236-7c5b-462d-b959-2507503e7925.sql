-- Create platform_invoices table for ProcureSaathi invoices
CREATE TABLE public.platform_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('subscription', 'service_fee', 'extra_bid')),
  amount NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 18,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  description TEXT,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  related_transaction_id UUID REFERENCES public.transactions(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY "Users can view own platform invoices"
ON public.platform_invoices
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all platform invoices
CREATE POLICY "Admins can view all platform invoices"
ON public.platform_invoices
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update platform invoices (mark as paid)
CREATE POLICY "Admins can update platform invoices"
ON public.platform_invoices
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert platform invoices (via triggers/functions)
CREATE POLICY "System can insert platform invoices"
ON public.platform_invoices
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_platform_invoices_updated_at
BEFORE UPDATE ON public.platform_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_platform_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'PS-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('platform_invoice_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS platform_invoice_seq START 1;

-- Create trigger for auto-generating invoice number
CREATE TRIGGER set_platform_invoice_number
BEFORE INSERT ON public.platform_invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
EXECUTE FUNCTION public.generate_platform_invoice_number();

-- Create function to auto-generate service fee invoice on bid acceptance
CREATE OR REPLACE FUNCTION public.create_service_fee_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_requirement requirements%ROWTYPE;
  v_trade_type TEXT;
  v_service_fee_percent NUMERIC;
  v_invoice_desc TEXT;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    SELECT * INTO v_requirement FROM requirements WHERE id = NEW.requirement_id;
    v_trade_type := COALESCE(v_requirement.trade_type, 'domestic_india');
    
    -- Determine service fee description based on trade type
    IF v_trade_type = 'domestic_india' THEN
      v_invoice_desc := 'Service Fee - Domestic Trade (0.5%)';
    ELSIF v_trade_type = 'import' THEN
      v_invoice_desc := 'Service Fee - Import Trade (1%)';
    ELSE
      v_invoice_desc := 'Service Fee - Export Trade (1%)';
    END IF;
    
    -- Insert platform invoice for supplier
    INSERT INTO platform_invoices (
      user_id,
      invoice_type,
      amount,
      tax_amount,
      total_amount,
      description,
      due_date,
      related_transaction_id,
      metadata
    )
    SELECT 
      NEW.supplier_id,
      'service_fee',
      NEW.service_fee,
      ROUND(NEW.service_fee * 0.18, 2),
      ROUND(NEW.service_fee * 1.18, 2),
      v_invoice_desc || ' for Bid #' || SUBSTRING(NEW.id::TEXT, 1, 8),
      CURRENT_DATE + INTERVAL '7 days',
      t.id,
      jsonb_build_object('bid_id', NEW.id, 'requirement_id', NEW.requirement_id, 'trade_type', v_trade_type)
    FROM transactions t
    WHERE t.bid_id = NEW.id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for service fee invoice
CREATE TRIGGER create_service_fee_invoice_trigger
AFTER UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.create_service_fee_invoice();