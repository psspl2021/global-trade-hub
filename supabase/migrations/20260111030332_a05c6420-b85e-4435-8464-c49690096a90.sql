-- =============================================
-- IDEMPOTENT SQL HARDENING FOR AI SALES ENGINE
-- =============================================

-- A️⃣ STATUS CONSTRAINTS (safe redeploys)

-- ai_seo_runs status constraint
ALTER TABLE ai_seo_runs
DROP CONSTRAINT IF EXISTS ai_seo_runs_status_valid;

ALTER TABLE ai_seo_runs
ADD CONSTRAINT ai_seo_runs_status_valid
CHECK (status IN ('pending', 'running', 'completed', 'failed'));

-- ai_sem_runs status constraint
ALTER TABLE ai_sem_runs
DROP CONSTRAINT IF EXISTS ai_sem_runs_status_valid;

ALTER TABLE ai_sem_runs
ADD CONSTRAINT ai_sem_runs_status_valid
CHECK (status IN ('pending', 'running', 'optimizing', 'completed', 'failed'));

-- B️⃣ NORMALIZE CASING (prevent analytics bugs)

-- Country normalization for ai_seo_runs
ALTER TABLE ai_seo_runs
DROP CONSTRAINT IF EXISTS ai_seo_runs_country_lower;

ALTER TABLE ai_seo_runs
ADD CONSTRAINT ai_seo_runs_country_lower
CHECK (country = lower(country));

-- Country normalization for ai_sem_runs
ALTER TABLE ai_sem_runs
DROP CONSTRAINT IF EXISTS ai_sem_runs_country_lower;

ALTER TABLE ai_sem_runs
ADD CONSTRAINT ai_sem_runs_country_lower
CHECK (country = lower(country));

-- Category normalization
ALTER TABLE ai_seo_runs
DROP CONSTRAINT IF EXISTS ai_seo_runs_category_lower;

ALTER TABLE ai_seo_runs
ADD CONSTRAINT ai_seo_runs_category_lower
CHECK (category = lower(category));

ALTER TABLE ai_sem_runs
DROP CONSTRAINT IF EXISTS ai_sem_runs_category_lower;

ALTER TABLE ai_sem_runs
ADD CONSTRAINT ai_sem_runs_category_lower
CHECK (category = lower(category));

-- C️⃣ INDEXES FOR ADMIN DASHBOARDS (non-negotiable at scale)

CREATE INDEX IF NOT EXISTS idx_ai_seo_runs_created_at
ON ai_seo_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_sem_runs_created_at
ON ai_sem_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_sem_runs_status
ON ai_sem_runs(status);

CREATE INDEX IF NOT EXISTS idx_ai_seo_runs_status
ON ai_seo_runs(status);

-- D️⃣ ATTRIBUTION GUARDS (investor-safe)

ALTER TABLE ai_sales_conversions
DROP CONSTRAINT IF EXISTS ai_sales_conversions_source_valid;

ALTER TABLE ai_sales_conversions
ADD CONSTRAINT ai_sales_conversions_source_valid
CHECK (source_channel IN ('ai_sem', 'ai_seo', 'ai_discovery', 'manual', NULL));

ALTER TABLE ai_sales_leads
DROP CONSTRAINT IF EXISTS ai_sales_leads_acq_source_valid;

ALTER TABLE ai_sales_leads
ADD CONSTRAINT ai_sales_leads_acq_source_valid
CHECK (acquisition_source IN ('ai_sem', 'ai_seo', 'ai_discovery', 'manual', NULL));

-- =============================================
-- AUTO-RUN BACKEND LOCK (REAL AUTONOMY)
-- =============================================

-- AI SEO Settings table
CREATE TABLE IF NOT EXISTS ai_seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  country TEXT,
  company_role TEXT CHECK (company_role IN ('buyer', 'supplier', 'hybrid', NULL)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI SEM Settings table
CREATE TABLE IF NOT EXISTS ai_sem_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  frequency TEXT CHECK (frequency IN ('hourly', 'daily')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  country TEXT,
  company_role TEXT CHECK (company_role IN ('buyer', 'supplier', 'hybrid', NULL)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on settings tables
ALTER TABLE ai_seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sem_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for settings
DROP POLICY IF EXISTS "Admin full access to ai_seo_settings" ON ai_seo_settings;
CREATE POLICY "Admin full access to ai_seo_settings" ON ai_seo_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin full access to ai_sem_settings" ON ai_sem_settings;
CREATE POLICY "Admin full access to ai_sem_settings" ON ai_sem_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Insert default settings rows (one per engine)
INSERT INTO ai_seo_settings (enabled, frequency)
VALUES (false, 'daily')
ON CONFLICT DO NOTHING;

INSERT INTO ai_sem_settings (enabled, frequency)
VALUES (false, 'hourly')
ON CONFLICT DO NOTHING;