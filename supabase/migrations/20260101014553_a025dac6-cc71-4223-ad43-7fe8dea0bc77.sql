-- Add user_type column to supplier_email_logs to track emails for all user types
ALTER TABLE public.supplier_email_logs 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'supplier';

-- Add constraint to validate user_type
ALTER TABLE public.supplier_email_logs 
DROP CONSTRAINT IF EXISTS supplier_email_logs_user_type_check;

ALTER TABLE public.supplier_email_logs 
ADD CONSTRAINT supplier_email_logs_user_type_check 
CHECK (user_type IN ('supplier', 'buyer', 'logistics_partner'));

-- Rename supplier_id to user_id for clarity (but keep supplier_id as alias for backward compatibility)
-- First, add user_id column that mirrors supplier_id
ALTER TABLE public.supplier_email_logs 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update existing records to have user_id = supplier_id
UPDATE public.supplier_email_logs SET user_id = supplier_id WHERE user_id IS NULL;

-- Add logistics_requirement_id for logistics partner emails
ALTER TABLE public.supplier_email_logs 
ADD COLUMN IF NOT EXISTS logistics_requirement_id UUID REFERENCES public.logistics_requirements(id);

-- Create index for faster querying by user_type
CREATE INDEX IF NOT EXISTS idx_supplier_email_logs_user_type ON public.supplier_email_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_supplier_email_logs_user_id ON public.supplier_email_logs(user_id);

-- Add user_type to supplier_email_quotas table
ALTER TABLE public.supplier_email_quotas 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'supplier';

-- Add user_id column to quotas
ALTER TABLE public.supplier_email_quotas 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update existing records
UPDATE public.supplier_email_quotas SET user_id = supplier_id WHERE user_id IS NULL;