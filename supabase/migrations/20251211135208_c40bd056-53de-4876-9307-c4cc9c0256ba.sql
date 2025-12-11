-- Create supplier leads table for CRM
CREATE TABLE public.supplier_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  expected_value NUMERIC,
  next_follow_up DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_leads ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own leads
CREATE POLICY "Suppliers can manage own leads"
  ON public.supplier_leads
  FOR ALL
  USING (auth.uid() = supplier_id);

-- Create index for faster queries
CREATE INDEX idx_supplier_leads_supplier_id ON public.supplier_leads(supplier_id);
CREATE INDEX idx_supplier_leads_status ON public.supplier_leads(status);

-- Add trigger for updated_at
CREATE TRIGGER update_supplier_leads_updated_at
  BEFORE UPDATE ON public.supplier_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();