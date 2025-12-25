-- Add customer_name column to requirements table for admin users
-- This allows admin (ProcureSaathi) to post requirements on behalf of customers they're buying from
ALTER TABLE public.requirements 
ADD COLUMN customer_name text DEFAULT NULL;

-- Add comment to explain the purpose
COMMENT ON COLUMN public.requirements.customer_name IS 'Customer name for whom admin is creating the requirement (used when ProcureSaathi acts as a commodity trader)';