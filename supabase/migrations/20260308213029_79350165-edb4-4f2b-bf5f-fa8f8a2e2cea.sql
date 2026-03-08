
-- Module 1: GSC Query Intelligence Engine
CREATE TABLE public.gsc_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  ctr FLOAT DEFAULT 0,
  position FLOAT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(page_slug, query)
);

ALTER TABLE public.gsc_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gsc_queries" ON public.gsc_queries FOR SELECT TO anon, authenticated USING (true);

-- Module 2: RFQ Signals for Revenue Weighted Linking
CREATE TABLE public.rfq_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL UNIQUE,
  product_name TEXT,
  rfq_count INT DEFAULT 0,
  avg_order_size INT DEFAULT 0,
  top_industries TEXT[] DEFAULT '{}',
  price_trend TEXT DEFAULT 'Stable',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.rfq_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read rfq_signals" ON public.rfq_signals FOR SELECT TO anon, authenticated USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.gsc_queries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rfq_signals;
