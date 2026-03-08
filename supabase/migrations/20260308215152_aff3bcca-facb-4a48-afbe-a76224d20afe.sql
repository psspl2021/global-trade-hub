
CREATE TABLE IF NOT EXISTS public.query_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_slug TEXT NOT NULL,
  link_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rfq_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  organic_visits INT DEFAULT 0,
  rfqs INT DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read query_history" ON public.query_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin read internal_links" ON public.internal_links FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin read rfq_analytics" ON public.rfq_analytics FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
