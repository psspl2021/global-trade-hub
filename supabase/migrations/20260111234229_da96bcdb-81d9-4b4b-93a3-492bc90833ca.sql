-- Add unique constraint on lead_fingerprint if not exists
-- This is required for upsert with onConflict to work
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ai_sales_leads_lead_fingerprint_key'
    ) THEN
        ALTER TABLE public.ai_sales_leads 
        ADD CONSTRAINT ai_sales_leads_lead_fingerprint_key UNIQUE (lead_fingerprint);
    END IF;
END $$;