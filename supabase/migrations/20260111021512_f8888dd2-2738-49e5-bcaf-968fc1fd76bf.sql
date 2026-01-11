-- Drop constraint if exists (safe re-run)
ALTER TABLE ai_sales_leads
DROP CONSTRAINT IF EXISTS ai_sales_leads_company_role_check;

-- Add constraint with proper naming
ALTER TABLE ai_sales_leads
ADD CONSTRAINT ai_sales_leads_company_role_valid
CHECK (company_role IN ('buyer', 'supplier', 'hybrid'));

-- Documentation
COMMENT ON COLUMN ai_sales_leads.company_role IS
'Classifies discovered company as buyer, supplier, or hybrid (both)';