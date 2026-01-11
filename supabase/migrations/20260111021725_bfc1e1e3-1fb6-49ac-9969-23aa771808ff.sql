-- Add index for company_role filtering (dashboards & funnel routing)
CREATE INDEX IF NOT EXISTS idx_ai_sales_leads_company_role
ON ai_sales_leads(company_role);