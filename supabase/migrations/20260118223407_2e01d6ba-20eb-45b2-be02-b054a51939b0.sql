-- Add intent_score column to admin_signal_pages for page-level intent tracking
ALTER TABLE public.admin_signal_pages 
ADD COLUMN IF NOT EXISTS intent_score integer DEFAULT 0;

-- Add signal_page_id column to demand_intelligence_signals for linking signals to pages
ALTER TABLE public.demand_intelligence_signals 
ADD COLUMN IF NOT EXISTS signal_page_id uuid REFERENCES public.admin_signal_pages(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_demand_signals_signal_page ON public.demand_intelligence_signals(signal_page_id);
CREATE INDEX IF NOT EXISTS idx_signal_pages_views_rfqs ON public.admin_signal_pages(views, rfqs_submitted) WHERE is_active = true;