-- Add SEM tracking columns to page_visits table
ALTER TABLE public.page_visits 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS gclid TEXT;

-- Create index for SEM analytics queries
CREATE INDEX IF NOT EXISTS idx_page_visits_utm_source ON public.page_visits(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_visits_utm_campaign ON public.page_visits(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_visits_gclid ON public.page_visits(gclid) WHERE gclid IS NOT NULL;