-- Normalize industry_segment casing (prevents "Construction vs construction" bugs)
ALTER TABLE public.ai_sales_leads
DROP CONSTRAINT IF EXISTS ai_sales_leads_industry_lower;

ALTER TABLE public.ai_sales_leads
ADD CONSTRAINT ai_sales_leads_industry_lower
CHECK (industry_segment IS NULL OR industry_segment = lower(industry_segment));

-- Index for AI dashboards + filtering
CREATE INDEX IF NOT EXISTS idx_ai_sales_leads_industry_segment
ON public.ai_sales_leads(industry_segment);

-- Composite funnel index for analytics
CREATE INDEX IF NOT EXISTS idx_ai_sales_leads_industry_funnel
ON public.ai_sales_leads(category, industry_segment, country, company_role, status);