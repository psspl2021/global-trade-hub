-- Create international_leads table for tracking global marketing leads
CREATE TABLE public.international_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT NOT NULL,
  company_name TEXT,
  interested_categories TEXT[],
  trade_interest TEXT NOT NULL DEFAULT 'import_from_india', -- 'import_from_india', 'export_to_india', 'both'
  monthly_volume TEXT,
  source TEXT, -- landing page URL, campaign name, etc.
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.international_leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit international lead" 
ON public.international_leads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all international leads" 
ON public.international_leads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update international leads" 
ON public.international_leads 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));