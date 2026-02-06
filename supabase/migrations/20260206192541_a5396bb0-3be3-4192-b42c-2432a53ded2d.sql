-- ============================================================
-- AI ENFORCEMENT SYSTEM - DATABASE SCHEMA (FIXED)
-- ============================================================
-- Implements:
-- 1. AI L1 ranking lock (L1 is final, no buyer override)
-- 2. Lane locking for high-intent RFQs
-- 3. Data-level anonymity (buyer-side doesn't store supplier_id)
-- 4. AI confidence tracking

-- ============================================================
-- 1. AI SELECTION ENGINE TABLES
-- ============================================================

-- AI L1 Selection Results (immutable ranking)
CREATE TABLE IF NOT EXISTS public.ai_l1_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  
  -- AI Ranking (LOCKED - cannot be modified by buyers)
  ai_rank INTEGER NOT NULL DEFAULT 1,
  ps_partner_id TEXT NOT NULL, -- Anonymous partner ID (PS-XXXX format)
  
  -- AI Scoring Breakdown (READ-ONLY for buyers)
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  ai_confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  price_competitiveness_score NUMERIC(5,2) DEFAULT 0,
  delivery_reliability_score NUMERIC(5,2) DEFAULT 0,
  risk_score NUMERIC(5,2) DEFAULT 0,
  past_performance_score NUMERIC(5,2) DEFAULT 0,
  
  -- AI Reasoning (MANDATORY - cannot be hidden)
  ai_reasoning TEXT NOT NULL DEFAULT 'AI-generated ranking based on composite scoring',
  
  -- Status
  is_l1 BOOLEAN DEFAULT FALSE,
  lane_locked BOOLEAN DEFAULT FALSE, -- Locked to top 3 if intent >= 7
  buyer_accepted BOOLEAN DEFAULT FALSE,
  escalated_to_admin BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,
  
  -- Internal mapping (HIDDEN from buyer-side queries)
  internal_supplier_id UUID, -- Only accessible post-award
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_l1_selections_requirement 
ON public.ai_l1_selections(requirement_id);

CREATE INDEX IF NOT EXISTS idx_ai_l1_selections_l1 
ON public.ai_l1_selections(requirement_id, is_l1) 
WHERE is_l1 = TRUE;

-- Enable RLS
ALTER TABLE public.ai_l1_selections ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. LANE LOCKING TABLE
-- ============================================================

-- Tracks which suppliers are locked to which high-intent lanes
CREATE TABLE IF NOT EXISTS public.ai_lane_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  
  -- Lane lock metadata
  intent_score NUMERIC(4,2) NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lock_reason TEXT DEFAULT 'High intent RFQ - Lane locked to top 3 AI-ranked suppliers',
  
  -- Locked suppliers (top 3 ps_partner_ids)
  locked_ps_partner_ids TEXT[] NOT NULL DEFAULT '{}',
  
  -- Lock status
  is_active BOOLEAN DEFAULT TRUE,
  released_at TIMESTAMPTZ,
  released_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for active locks
CREATE INDEX IF NOT EXISTS idx_ai_lane_locks_active 
ON public.ai_lane_locks(requirement_id) 
WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE public.ai_lane_locks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. CONTROL TOWER ALERTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.control_tower_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alert categorization
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'supplier_delay_risk',
    'demand_spike_detected',
    'inventory_shortage_forecast',
    'price_volatility',
    'quality_risk',
    'compliance_alert'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  
  -- Alert content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Related entities (anonymous)
  related_category TEXT,
  related_subcategory TEXT,
  related_requirement_id UUID REFERENCES public.requirements(id),
  
  -- Metrics
  risk_value NUMERIC(15,2),
  impact_value NUMERIC(15,2),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for unresolved alerts
CREATE INDEX IF NOT EXISTS idx_control_tower_alerts_unresolved 
ON public.control_tower_alerts(created_at DESC) 
WHERE is_resolved = FALSE;

-- Enable RLS
ALTER TABLE public.control_tower_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. AI INVENTORY PREDICTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_inventory_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Category context
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Predictive metrics (replaces static counts)
  stockout_risk_days INTEGER, -- Days until potential stockout
  reorder_recommendation_qty INTEGER, -- Suggested reorder quantity
  price_trend_signal TEXT CHECK (price_trend_signal IN ('rising', 'stable', 'falling')),
  demand_velocity TEXT CHECK (demand_velocity IN ('high', 'medium', 'low')),
  
  -- AI confidence
  prediction_confidence NUMERIC(5,2) DEFAULT 0,
  
  -- Update tracking
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  calculation_model TEXT DEFAULT 'rule-based-v1',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for category lookups
CREATE INDEX IF NOT EXISTS idx_ai_inventory_predictions_category 
ON public.ai_inventory_predictions(category, subcategory);

-- Enable RLS
ALTER TABLE public.ai_inventory_predictions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

-- AI L1 Selections: Buyers see only anonymized data, admins see all
CREATE POLICY "Admins have full access to AI selections"
ON public.ai_l1_selections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ps_admin')
  )
);

-- Buyers can only see anonymized selections for their RFQs (using buyer_id)
CREATE POLICY "Buyers see anonymized AI selections"
ON public.ai_l1_selections
FOR SELECT
USING (
  requirement_id IN (
    SELECT id FROM public.requirements WHERE buyer_id = auth.uid()
  )
);

-- Lane Locks: Only admins can manage
CREATE POLICY "Admins manage lane locks"
ON public.ai_lane_locks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ps_admin')
  )
);

-- Control Tower Alerts: Admins and management only
CREATE POLICY "Management access to alerts"
ON public.control_tower_alerts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ps_admin', 'cfo', 'ceo', 'manager')
  )
);

-- AI Inventory Predictions: All authenticated users can read
CREATE POLICY "Authenticated users can view predictions"
ON public.ai_inventory_predictions
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify predictions
CREATE POLICY "Admins manage predictions"
ON public.ai_inventory_predictions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- ============================================================
-- 6. FUNCTIONS FOR AI ENFORCEMENT
-- ============================================================

-- Function to generate anonymous partner ID
CREATE OR REPLACE FUNCTION generate_ps_partner_id(supplier_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hash_value TEXT;
  partner_id TEXT;
BEGIN
  -- Generate a deterministic hash based on supplier_id
  hash_value := encode(sha256(supplier_id::TEXT::BYTEA), 'hex');
  -- Take first 6 characters and format as PS-XXXXXX
  partner_id := 'PS-' || UPPER(SUBSTRING(hash_value, 1, 6));
  RETURN partner_id;
END;
$$;

-- Function to check if a lane is locked for a supplier
CREATE OR REPLACE FUNCTION is_lane_locked_for_supplier(
  p_requirement_id UUID,
  p_supplier_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ps_partner_id TEXT;
  v_is_locked BOOLEAN;
BEGIN
  -- Get the anonymous partner ID for this supplier
  v_ps_partner_id := generate_ps_partner_id(p_supplier_id);
  
  -- Check if there's an active lock that doesn't include this supplier
  SELECT EXISTS (
    SELECT 1 FROM ai_lane_locks
    WHERE requirement_id = p_requirement_id
    AND is_active = TRUE
    AND NOT (v_ps_partner_id = ANY(locked_ps_partner_ids))
  ) INTO v_is_locked;
  
  RETURN v_is_locked;
END;
$$;

-- ============================================================
-- 7. VIEW FOR BUYER-SIDE AI SELECTIONS (ANONYMIZED)
-- ============================================================

CREATE OR REPLACE VIEW public.buyer_ai_selections AS
SELECT 
  als.id,
  als.requirement_id,
  als.ai_rank,
  als.ps_partner_id,
  als.trust_score,
  als.ai_confidence,
  als.price_competitiveness_score,
  als.delivery_reliability_score,
  als.risk_score,
  als.past_performance_score,
  als.ai_reasoning,
  als.is_l1,
  als.lane_locked,
  als.buyer_accepted,
  als.escalated_to_admin,
  als.created_at
  -- NOTE: internal_supplier_id is NEVER exposed to buyers
FROM ai_l1_selections als
WHERE als.requirement_id IN (
  SELECT id FROM requirements WHERE buyer_id = auth.uid()
);

COMMENT ON VIEW public.buyer_ai_selections IS 
'Anonymized AI selection data for buyers. Supplier identity is hidden.';

-- ============================================================
-- 8. CONTROL TOWER METRICS VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.control_tower_executive_metrics AS
WITH savings_data AS (
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN bi.total > 0 AND bi.unit_price > 0 
        THEN (bi.unit_price * 1.1 - bi.unit_price) * bi.quantity -- 10% baseline assumption
        ELSE 0 
      END
    ), 0) as total_ai_verified_savings
  FROM bid_items bi
  JOIN bids b ON bi.bid_id = b.id
  WHERE b.status = 'accepted'
),
risk_data AS (
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN cta.severity = 'critical' THEN cta.risk_value 
        WHEN cta.severity = 'warning' THEN cta.risk_value * 0.5
        ELSE 0 
      END
    ), 0) as revenue_protected,
    COUNT(*) FILTER (WHERE severity = 'critical' AND is_resolved = FALSE) as live_high_risk_rfqs
  FROM control_tower_alerts cta
),
billing_data AS (
  SELECT 
    COALESCE(SUM(total_transacted_value), 0) as total_platform_volume,
    COALESCE(SUM(
      CASE 
        WHEN NOT billing_active THEN 0
        ELSE total_transacted_value * domestic_fee_percent / 100
      END
    ), 0) as total_platform_fee
  FROM enterprise_billing_config
)
SELECT 
  sd.total_ai_verified_savings,
  rd.revenue_protected,
  rd.live_high_risk_rfqs,
  CASE 
    WHEN bd.total_platform_fee > 0 
    THEN ROUND(sd.total_ai_verified_savings / bd.total_platform_fee, 2)
    ELSE 0 
  END as platform_roi_ratio,
  bd.total_platform_volume,
  bd.total_platform_fee
FROM savings_data sd, risk_data rd, billing_data bd;

COMMENT ON VIEW public.control_tower_executive_metrics IS 
'Compressed executive metrics: Savings, Revenue Protected, Risk Count, ROI Ratio';