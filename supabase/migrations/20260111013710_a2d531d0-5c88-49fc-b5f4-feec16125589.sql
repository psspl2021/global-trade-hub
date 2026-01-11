-- AI Sales Leads - discovered buyers
CREATE TABLE public.ai_sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  buyer_name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  city TEXT,
  category TEXT,
  buyer_type TEXT, -- manufacturer, trader, importer, etc.
  lead_source TEXT, -- google, trade_directory, linkedin, etc.
  confidence_score NUMERIC(3,2) DEFAULT 0.50, -- 0.00 - 1.00
  status TEXT DEFAULT 'new', -- new | contacted | rfq_created | closed | ignored
  enrichment_data JSONB, -- additional scraped/enriched data
  notes TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Sales Messages - outreach templates
CREATE TABLE public.ai_sales_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  channel TEXT NOT NULL, -- email | whatsapp | landing
  subject TEXT,
  message_body TEXT NOT NULL,
  tone TEXT DEFAULT 'professional', -- professional | aggressive | soft
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Sales Landing Pages - SEO entry pages
CREATE TABLE public.ai_sales_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  headline TEXT NOT NULL,
  subheadline TEXT,
  cta_text TEXT DEFAULT 'Get Instant Quotes',
  meta_title TEXT,
  meta_description TEXT,
  hero_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Sales Conversions - lead to RFQ tracking
CREATE TABLE public.ai_sales_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.ai_sales_leads(id) ON DELETE SET NULL,
  landing_page_id UUID REFERENCES public.ai_sales_landing_pages(id) ON DELETE SET NULL,
  rfq_id UUID REFERENCES public.requirements(id) ON DELETE SET NULL,
  conversion_type TEXT NOT NULL, -- ai_inventory | manual_rfq | landing_page
  source_channel TEXT, -- email | whatsapp | landing | direct
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deal_closed_at TIMESTAMP WITH TIME ZONE,
  deal_value NUMERIC(12,2)
);

-- AI Sales Discovery Jobs - track discovery runs
CREATE TABLE public.ai_sales_discovery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  buyer_type TEXT,
  status TEXT DEFAULT 'pending', -- pending | running | completed | failed
  leads_found INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS on all tables (admin-only access via edge functions)
ALTER TABLE public.ai_sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sales_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sales_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sales_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sales_discovery_jobs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (using user_roles table)
CREATE POLICY "Admins can manage ai_sales_leads"
ON public.ai_sales_leads FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage ai_sales_messages"
ON public.ai_sales_messages FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage ai_sales_landing_pages"
ON public.ai_sales_landing_pages FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage ai_sales_conversions"
ON public.ai_sales_conversions FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage ai_sales_discovery_jobs"
ON public.ai_sales_discovery_jobs FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Public read access for landing pages (for SEO)
CREATE POLICY "Anyone can view active landing pages"
ON public.ai_sales_landing_pages FOR SELECT
USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_ai_sales_leads_category ON public.ai_sales_leads(category);
CREATE INDEX idx_ai_sales_leads_country ON public.ai_sales_leads(country);
CREATE INDEX idx_ai_sales_leads_status ON public.ai_sales_leads(status);
CREATE INDEX idx_ai_sales_messages_category_country ON public.ai_sales_messages(category, country);
CREATE INDEX idx_ai_sales_landing_pages_slug ON public.ai_sales_landing_pages(slug);
CREATE INDEX idx_ai_sales_conversions_lead_id ON public.ai_sales_conversions(lead_id);

-- Admin metrics view
CREATE OR REPLACE VIEW public.admin_ai_sales_metrics AS
SELECT
  category,
  country,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE status = 'contacted') AS leads_contacted,
  COUNT(*) FILTER (WHERE status = 'rfq_created') AS rfqs_created,
  COUNT(*) FILTER (WHERE status = 'closed') AS deals_closed,
  COUNT(*) FILTER (WHERE status = 'ignored') AS leads_ignored,
  ROUND(AVG(confidence_score)::numeric, 2) AS avg_confidence,
  COUNT(*) FILTER (WHERE discovered_at > now() - interval '7 days') AS leads_last_7_days
FROM public.ai_sales_leads
GROUP BY category, country;

-- Landing page performance view
CREATE OR REPLACE VIEW public.admin_landing_page_metrics AS
SELECT
  lp.id,
  lp.category,
  lp.country,
  lp.slug,
  lp.headline,
  lp.view_count,
  lp.conversion_count,
  CASE WHEN lp.view_count > 0 
    THEN ROUND((lp.conversion_count::numeric / lp.view_count * 100), 2) 
    ELSE 0 
  END AS conversion_rate,
  lp.is_active,
  lp.created_at
FROM public.ai_sales_landing_pages lp;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_ai_sales_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_sales_leads_timestamp
BEFORE UPDATE ON public.ai_sales_leads
FOR EACH ROW EXECUTE FUNCTION public.update_ai_sales_timestamp();

CREATE TRIGGER update_ai_sales_messages_timestamp
BEFORE UPDATE ON public.ai_sales_messages
FOR EACH ROW EXECUTE FUNCTION public.update_ai_sales_timestamp();

CREATE TRIGGER update_ai_sales_landing_pages_timestamp
BEFORE UPDATE ON public.ai_sales_landing_pages
FOR EACH ROW EXECUTE FUNCTION public.update_ai_sales_timestamp();