
-- 1. GSC Striking Distance auto-detection table
CREATE TABLE public.gsc_striking_distance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  query TEXT NOT NULL,
  position NUMERIC NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  boosted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(page_slug, query)
);

ALTER TABLE public.gsc_striking_distance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gsc_striking_distance" ON public.gsc_striking_distance FOR SELECT USING (true);
CREATE POLICY "Service role insert gsc_striking_distance" ON public.gsc_striking_distance FOR INSERT WITH CHECK (false);
CREATE POLICY "Service role update gsc_striking_distance" ON public.gsc_striking_distance FOR UPDATE USING (false);

-- 2. RFQ Revenue Attribution table
CREATE TABLE public.rfq_revenue_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID,
  page_path TEXT NOT NULL,
  source_page_type TEXT NOT NULL DEFAULT 'unknown',
  sku_slug TEXT,
  country_slug TEXT,
  revenue_value NUMERIC DEFAULT 0,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rfq_revenue_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert rfq_revenue_attribution" ON public.rfq_revenue_attribution FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read rfq_revenue_attribution" ON public.rfq_revenue_attribution FOR SELECT USING (true);

-- 3. Funnel sessions for multi-step attribution
CREATE TABLE public.funnel_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  landing_page TEXT,
  scroll_50_at TIMESTAMPTZ,
  cta_click_at TIMESTAMPTZ,
  rfq_form_view_at TIMESTAMPTZ,
  rfq_submit_at TIMESTAMPTZ,
  rfq_id UUID,
  source_page_type TEXT,
  sku_slug TEXT,
  country_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.funnel_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert funnel_sessions" ON public.funnel_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update funnel_sessions" ON public.funnel_sessions FOR UPDATE USING (true);
CREATE POLICY "Public read funnel_sessions" ON public.funnel_sessions FOR SELECT USING (true);

CREATE INDEX idx_funnel_sessions_session ON public.funnel_sessions(session_id);
CREATE INDEX idx_gsc_striking_active ON public.gsc_striking_distance(is_active) WHERE is_active = true;
CREATE INDEX idx_rfq_revenue_page ON public.rfq_revenue_attribution(page_path);
