-- Create ai_seo_runs table for tracking AI SEO automation runs
CREATE TABLE public.ai_seo_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  category TEXT,
  country TEXT,
  company_role TEXT,
  keywords_discovered INTEGER DEFAULT 0,
  pages_audited INTEGER DEFAULT 0,
  pages_generated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create ai_sem_runs table for tracking AI SEM automation runs
CREATE TABLE public.ai_sem_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'optimizing')),
  category TEXT,
  country TEXT,
  company_role TEXT,
  campaigns_created INTEGER DEFAULT 0,
  ads_generated INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  cost_per_rfq DECIMAL(10,2),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add source tracking to ai_sales_leads if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_sales_leads' AND column_name = 'acquisition_source') THEN
    ALTER TABLE public.ai_sales_leads ADD COLUMN acquisition_source TEXT;
  END IF;
END $$;

-- Add source tracking to ai_sales_conversions if not exists  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_sales_conversions' AND column_name = 'source_type') THEN
    ALTER TABLE public.ai_sales_conversions ADD COLUMN source_type TEXT;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.ai_seo_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sem_runs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for ai_seo_runs
CREATE POLICY "Admins can view ai_seo_runs" ON public.ai_seo_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert ai_seo_runs" ON public.ai_seo_runs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update ai_seo_runs" ON public.ai_seo_runs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admin-only policies for ai_sem_runs
CREATE POLICY "Admins can view ai_sem_runs" ON public.ai_sem_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert ai_sem_runs" ON public.ai_sem_runs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update ai_sem_runs" ON public.ai_sem_runs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );