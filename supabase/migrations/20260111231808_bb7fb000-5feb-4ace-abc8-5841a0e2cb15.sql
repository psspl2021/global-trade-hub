-- Add subcategory column to ai_sales_leads
ALTER TABLE public.ai_sales_leads 
ADD COLUMN IF NOT EXISTS subcategory text;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_ai_sales_leads_subcategory ON public.ai_sales_leads(subcategory);

-- Update unique constraint to include subcategory in fingerprint logic
-- (fingerprint itself will be regenerated in code)