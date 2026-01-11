-- Add company_role column to classify leads as buyer/supplier/hybrid
ALTER TABLE ai_sales_leads
ADD COLUMN company_role TEXT DEFAULT 'buyer'
CHECK (company_role IN ('buyer', 'supplier', 'hybrid'));