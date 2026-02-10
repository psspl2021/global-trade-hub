
-- Conversion funnel events table for tracking Page → RFQ Start → RFQ Submit
CREATE TABLE public.rfq_conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'cta_click', 'rfq_start', 'rfq_generated', 'rfq_submit')),
  page_url TEXT,
  category_slug TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rfq_conversion_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (anonymous tracking before login)
CREATE POLICY "Anyone can insert conversion events"
ON public.rfq_conversion_events
FOR INSERT
WITH CHECK (true);

-- Only admins can read events
CREATE POLICY "Admins can read conversion events"
ON public.rfq_conversion_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Index for funnel analysis
CREATE INDEX idx_rfq_conversion_session ON public.rfq_conversion_events(session_id, created_at);
CREATE INDEX idx_rfq_conversion_type ON public.rfq_conversion_events(event_type, created_at);
