-- ============================================================
-- DEMAND DISCOVERY ENGINE SCHEMA UPDATES
-- Transform SEO/SEM from marketing to buyer discovery
-- ============================================================

-- Add demand discovery columns to ai_seo_runs
ALTER TABLE ai_seo_runs 
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS industries_reached TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subcategories_covered TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rfqs_submitted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buyer_inquiries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qualified_leads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS industry_match_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_deal_size DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS intent_score DECIMAL(3,1) DEFAULT 0;

-- Add demand discovery columns to ai_sem_runs  
ALTER TABLE ai_sem_runs
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS target_industries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS buyer_type TEXT,
ADD COLUMN IF NOT EXISTS min_deal_size DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rfqs_submitted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qualified_leads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS industry_match_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_deal_size DECIMAL(15,2) DEFAULT 0;

-- Add subcategory and industry to settings for targeted runs
ALTER TABLE ai_seo_settings
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS target_industries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS min_deal_size DECIMAL(15,2) DEFAULT 500000;

ALTER TABLE ai_sem_settings
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS target_industries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS buyer_type TEXT DEFAULT 'industrial',
ADD COLUMN IF NOT EXISTS min_deal_size DECIMAL(15,2) DEFAULT 1000000;

-- Create demand_discovery_keywords table for taxonomy-driven keywords
CREATE TABLE IF NOT EXISTS demand_discovery_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  industry TEXT NOT NULL,
  keyword TEXT NOT NULL,
  intent_type TEXT NOT NULL CHECK (intent_type IN ('project', 'bulk', 'export', 'tender')),
  intent_score INTEGER DEFAULT 5 CHECK (intent_score BETWEEN 1 AND 10),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  rfqs_generated INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(category, subcategory, keyword)
);

-- Create admin_signal_pages table (RFQ-focused, not sales landing)
CREATE TABLE IF NOT EXISTS admin_signal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  target_country TEXT NOT NULL DEFAULT 'india',
  target_industries TEXT[] DEFAULT '{}',
  
  -- RFQ-focused content (not marketing)
  headline TEXT NOT NULL,
  subheadline TEXT,
  primary_cta TEXT DEFAULT 'Submit Project Requirement',
  secondary_cta TEXT DEFAULT 'Talk to Expert',
  
  -- Trust metrics
  verified_suppliers_count INTEGER DEFAULT 0,
  successful_deals_count INTEGER DEFAULT 0,
  
  -- Performance
  views INTEGER DEFAULT 0,
  rfqs_submitted INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE demand_discovery_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_signal_pages ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage discovery keywords"
ON demand_discovery_keywords
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage signal pages"
ON admin_signal_pages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Public read for active signal pages (for SEO)
CREATE POLICY "Public can view active signal pages"
ON admin_signal_pages
FOR SELECT
USING (is_active = true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discovery_keywords_category 
ON demand_discovery_keywords(category, subcategory);

CREATE INDEX IF NOT EXISTS idx_discovery_keywords_intent 
ON demand_discovery_keywords(intent_type, intent_score DESC);

CREATE INDEX IF NOT EXISTS idx_signal_pages_slug 
ON admin_signal_pages(slug);

CREATE INDEX IF NOT EXISTS idx_signal_pages_category 
ON admin_signal_pages(category, subcategory);

-- Comments for clarity
COMMENT ON TABLE demand_discovery_keywords IS 'Buyer intent keywords from taxonomy - NOT marketing keywords';
COMMENT ON TABLE admin_signal_pages IS 'RFQ intake pages - NOT sales landing pages';
COMMENT ON COLUMN ai_seo_runs.rfqs_submitted IS 'Primary success metric - RFQs not traffic';
COMMENT ON COLUMN ai_sem_runs.buyer_type IS 'epc_contractor, exporter, industrial, municipal, distributor';