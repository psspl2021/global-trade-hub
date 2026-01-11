-- Add lead_fingerprint column for duplicate prevention
ALTER TABLE ai_sales_leads
ADD COLUMN IF NOT EXISTS lead_fingerprint text;

-- Create unique index on lead_fingerprint (allows NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_sales_leads_fingerprint 
ON ai_sales_leads(lead_fingerprint) 
WHERE lead_fingerprint IS NOT NULL;