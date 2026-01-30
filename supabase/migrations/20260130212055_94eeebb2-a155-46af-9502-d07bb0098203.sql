-- Add destination country and state columns to requirements table
-- These fields are used for AI-powered supplier matching and international RFQ filtering
-- They do NOT create new SEO URLs - purely for internal matching logic

ALTER TABLE public.requirements
ADD COLUMN IF NOT EXISTS destination_country TEXT,
ADD COLUMN IF NOT EXISTS destination_state TEXT;

-- Add index for efficient matching queries
CREATE INDEX IF NOT EXISTS idx_requirements_destination_country 
ON public.requirements(destination_country) 
WHERE destination_country IS NOT NULL;

COMMENT ON COLUMN public.requirements.destination_country IS 'ISO country code for destination (e.g., US, AE, IN)';
COMMENT ON COLUMN public.requirements.destination_state IS 'State/region name for destination matching';