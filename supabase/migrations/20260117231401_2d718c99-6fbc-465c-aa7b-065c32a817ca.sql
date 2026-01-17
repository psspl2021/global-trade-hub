-- ============================================================
-- EXTERNAL DEMAND INTELLIGENCE ENGINE
-- Transform AI SEO into revenue-grade intelligence layer
-- ============================================================

-- 1. Add signal classification and scoring columns to ai_seo_runs
ALTER TABLE ai_seo_runs
ADD COLUMN IF NOT EXISTS signal_classification TEXT CHECK (signal_classification IN ('buy', 'research', 'noise')) DEFAULT 'research',
ADD COLUMN IF NOT EXISTS urgency_score DECIMAL(3,1) DEFAULT 0 CHECK (urgency_score >= 0 AND urgency_score <= 10),
ADD COLUMN IF NOT EXISTS estimated_order_value DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fulfilment_confidence DECIMAL(3,1) DEFAULT 0 CHECK (fulfilment_confidence >= 0 AND fulfilment_confidence <= 10),
ADD COLUMN IF NOT EXISTS available_suppliers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS decision_action TEXT CHECK (decision_action IN ('auto_rfq', 'admin_review', 'ignore')) DEFAULT 'admin_review',
ADD COLUMN IF NOT EXISTS auto_rfq_id UUID REFERENCES requirements(id) ON DELETE SET NULL;

-- 2. Create demand_intelligence_signals table for tracking individual signals
CREATE TABLE IF NOT EXISTS demand_intelligence_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES ai_seo_runs(id) ON DELETE CASCADE,
  
  -- Signal Source
  signal_source TEXT NOT NULL CHECK (signal_source IN ('keyword_scan', 'signal_page', 'external_api', 'manual')),
  external_source_url TEXT,
  
  -- Signal Classification
  classification TEXT NOT NULL CHECK (classification IN ('buy', 'research', 'noise')) DEFAULT 'research',
  confidence_score DECIMAL(3,1) NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 10),
  
  -- Multi-dimensional Scoring
  intent_score DECIMAL(3,1) DEFAULT 0,
  urgency_score DECIMAL(3,1) DEFAULT 0,
  value_score DECIMAL(3,1) DEFAULT 0,
  feasibility_score DECIMAL(3,1) DEFAULT 0,
  overall_score DECIMAL(3,1) GENERATED ALWAYS AS (
    ROUND((intent_score + urgency_score + value_score + feasibility_score) / 4, 1)
  ) STORED,
  
  -- Demand Details
  category TEXT,
  subcategory TEXT,
  industry TEXT,
  product_description TEXT,
  estimated_quantity DECIMAL(15,2),
  estimated_unit TEXT,
  estimated_value DECIMAL(15,2),
  delivery_location TEXT,
  delivery_timeline_days INTEGER,
  buyer_type TEXT,
  
  -- Fulfilment Feasibility
  matching_suppliers_count INTEGER DEFAULT 0,
  best_supplier_match_score DECIMAL(3,1) DEFAULT 0,
  fulfilment_feasible BOOLEAN DEFAULT false,
  
  -- Decision Tracking
  decision_action TEXT CHECK (decision_action IN ('auto_rfq', 'admin_review', 'ignore', 'pending')) DEFAULT 'pending',
  decision_made_at TIMESTAMPTZ,
  decision_made_by UUID,
  decision_notes TEXT,
  
  -- RFQ Link (if converted)
  converted_to_rfq_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  
  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_di_signals_classification ON demand_intelligence_signals(classification);
CREATE INDEX IF NOT EXISTS idx_di_signals_decision_action ON demand_intelligence_signals(decision_action);
CREATE INDEX IF NOT EXISTS idx_di_signals_overall_score ON demand_intelligence_signals(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_di_signals_category ON demand_intelligence_signals(category);
CREATE INDEX IF NOT EXISTS idx_di_signals_run_id ON demand_intelligence_signals(run_id);
CREATE INDEX IF NOT EXISTS idx_di_signals_pending ON demand_intelligence_signals(decision_action) WHERE decision_action = 'pending';

-- 4. Add scoring fields to demand_discovery_keywords
ALTER TABLE demand_discovery_keywords
ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 5 CHECK (urgency_score BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS value_score INTEGER DEFAULT 5 CHECK (value_score BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS feasibility_score INTEGER DEFAULT 5 CHECK (feasibility_score BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS classification TEXT CHECK (classification IN ('buy', 'research', 'noise')) DEFAULT 'research',
ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMPTZ;

-- 5. Create demand_intelligence_settings table for configuration
CREATE TABLE IF NOT EXISTS demand_intelligence_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auto-RFQ Thresholds (conservative = 8.0)
  auto_rfq_min_score DECIMAL(3,1) DEFAULT 8.0,
  admin_review_min_score DECIMAL(3,1) DEFAULT 5.0,
  
  -- Signal Classification Thresholds
  buy_classification_min_score DECIMAL(3,1) DEFAULT 7.0,
  research_classification_max_score DECIMAL(3,1) DEFAULT 7.0,
  
  -- Fulfilment Requirements
  require_supplier_availability BOOLEAN DEFAULT true,
  min_matching_suppliers INTEGER DEFAULT 1,
  min_supplier_match_score DECIMAL(3,1) DEFAULT 6.0,
  
  -- Categories to scan
  enabled_categories TEXT[] DEFAULT '{}',
  enabled_countries TEXT[] DEFAULT '{"india"}',
  
  -- Auto-run config
  enabled BOOLEAN DEFAULT false,
  frequency TEXT CHECK (frequency IN ('hourly', 'daily', 'weekly')) DEFAULT 'daily',
  last_run_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create view for admin command center
CREATE OR REPLACE VIEW demand_intelligence_dashboard AS
SELECT 
  s.id,
  s.classification,
  s.signal_source,
  s.category,
  s.subcategory,
  s.industry,
  s.product_description,
  s.estimated_value,
  s.delivery_location,
  s.delivery_timeline_days,
  s.intent_score,
  s.urgency_score,
  s.value_score,
  s.feasibility_score,
  s.overall_score,
  s.matching_suppliers_count,
  s.fulfilment_feasible,
  s.decision_action,
  s.converted_to_rfq_id,
  s.discovered_at,
  -- Calculated fields
  CASE 
    WHEN s.overall_score >= 8.0 AND s.fulfilment_feasible THEN 'high_priority'
    WHEN s.overall_score >= 6.0 THEN 'medium_priority'
    ELSE 'low_priority'
  END as priority_level,
  CASE 
    WHEN s.converted_to_rfq_id IS NOT NULL THEN 'converted'
    WHEN s.decision_action = 'ignore' THEN 'ignored'
    WHEN s.decision_action = 'auto_rfq' THEN 'auto_converted'
    WHEN s.decision_action = 'admin_review' THEN 'pending_review'
    ELSE 'new'
  END as status
FROM demand_intelligence_signals s
ORDER BY s.overall_score DESC, s.discovered_at DESC;

-- 7. Enable RLS on new tables
ALTER TABLE demand_intelligence_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_intelligence_settings ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for admin access only
CREATE POLICY "Admin full access to signals" ON demand_intelligence_signals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admin full access to settings" ON demand_intelligence_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- 9. Insert default settings if not exists
INSERT INTO demand_intelligence_settings (
  auto_rfq_min_score,
  admin_review_min_score,
  require_supplier_availability,
  min_matching_suppliers,
  enabled_categories,
  enabled
)
SELECT 8.0, 5.0, true, 1, ARRAY['steel', 'chemicals', 'polymers'], false
WHERE NOT EXISTS (SELECT 1 FROM demand_intelligence_settings);

-- 10. Add trigger to update timestamps
CREATE OR REPLACE FUNCTION update_di_signal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_di_signals_updated_at
BEFORE UPDATE ON demand_intelligence_signals
FOR EACH ROW
EXECUTE FUNCTION update_di_signal_timestamp();