
-- Analytics table for demand-generated SEO pages
CREATE TABLE public.demand_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'view',
  session_id TEXT,
  referrer TEXT,
  country_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast aggregation queries
CREATE INDEX idx_dpa_slug ON public.demand_page_analytics(slug);
CREATE INDEX idx_dpa_event_type ON public.demand_page_analytics(event_type);
CREATE INDEX idx_dpa_created_at ON public.demand_page_analytics(created_at DESC);

-- Materialized summary view for dashboard queries
CREATE OR REPLACE VIEW public.demand_page_performance AS
SELECT
  slug,
  COUNT(*) FILTER (WHERE event_type = 'view') AS views,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'view') AS unique_visitors,
  COUNT(*) FILTER (WHERE event_type = 'rfq_click') AS rfq_clicks,
  CASE
    WHEN COUNT(*) FILTER (WHERE event_type = 'view') > 0
    THEN ROUND((COUNT(*) FILTER (WHERE event_type = 'rfq_click')::numeric / COUNT(*) FILTER (WHERE event_type = 'view')) * 100, 2)
    ELSE 0
  END AS conversion_rate,
  MAX(created_at) AS last_activity_at
FROM public.demand_page_analytics
GROUP BY slug;

-- RLS: allow public inserts (anonymous tracking), admin reads
ALTER TABLE public.demand_page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
  ON public.demand_page_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read analytics"
  ON public.demand_page_analytics
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ps_admin')
  );
