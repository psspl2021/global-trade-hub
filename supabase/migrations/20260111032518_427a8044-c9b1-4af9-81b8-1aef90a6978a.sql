-- Add industry_segment column to ai_sales_leads table
ALTER TABLE public.ai_sales_leads
ADD COLUMN IF NOT EXISTS industry_segment TEXT;