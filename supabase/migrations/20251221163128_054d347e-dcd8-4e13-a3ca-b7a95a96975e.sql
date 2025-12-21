-- Add time_spent_seconds column to page_visits table
ALTER TABLE public.page_visits ADD COLUMN IF NOT EXISTS time_spent_seconds integer DEFAULT NULL;

-- Create an index for efficient querying
CREATE INDEX IF NOT EXISTS idx_page_visits_time_spent ON public.page_visits(time_spent_seconds) WHERE time_spent_seconds IS NOT NULL;