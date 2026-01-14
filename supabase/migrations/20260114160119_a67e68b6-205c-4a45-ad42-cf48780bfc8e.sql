-- Add attribution columns to requirements table for tracking RFQ sources
ALTER TABLE public.requirements 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS source_run_id UUID REFERENCES public.ai_seo_runs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS signal_page_id UUID REFERENCES public.admin_signal_pages(id) ON DELETE SET NULL;

-- Create index for efficient querying by source
CREATE INDEX IF NOT EXISTS idx_requirements_source ON public.requirements(source);
CREATE INDEX IF NOT EXISTS idx_requirements_source_run_id ON public.requirements(source_run_id);
CREATE INDEX IF NOT EXISTS idx_requirements_signal_page_id ON public.requirements(signal_page_id);

-- Add comment explaining the source values
COMMENT ON COLUMN public.requirements.source IS 'RFQ source: direct, buyer_intelligence, signal_page, admin_created';
COMMENT ON COLUMN public.requirements.source_run_id IS 'Links to ai_seo_runs.id when RFQ came from a Buyer Intelligence scan';
COMMENT ON COLUMN public.requirements.signal_page_id IS 'Links to admin_signal_pages.id when RFQ came via a signal page';