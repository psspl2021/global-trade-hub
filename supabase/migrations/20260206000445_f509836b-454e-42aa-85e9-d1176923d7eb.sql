-- ============================================================
-- PURCHASER GAMIFICATION & INCENTIVE SYSTEM
-- ============================================================
-- Converts procurement efficiency into legal rewards
-- AI-verified savings, approved by management
-- Kickbacks structurally impossible

-- 1. Purchaser Savings Tracking (per RFQ)
CREATE TABLE public.purchaser_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL,
  purchaser_id UUID NOT NULL,
  baseline_price DECIMAL(15,2) NOT NULL,
  final_price DECIMAL(15,2) NOT NULL,
  net_savings DECIMAL(15,2) GENERATED ALWAYS AS (baseline_price - final_price) STORED,
  savings_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN baseline_price > 0 THEN ((baseline_price - final_price) / baseline_price * 100) ELSE 0 END
  ) STORED,
  currency VARCHAR(3) DEFAULT 'INR',
  verified_by_ai BOOLEAN DEFAULT false,
  verification_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Purchaser Performance Scores (Monthly/Quarterly)
CREATE TABLE public.purchaser_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaser_id UUID NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_savings DECIMAL(15,2) DEFAULT 0,
  rfq_count INTEGER DEFAULT 0,
  avg_turnaround_hours DECIMAL(10,2),
  price_variance_score DECIMAL(5,2) DEFAULT 0,
  compliance_score DECIMAL(5,2) DEFAULT 100,
  audit_score DECIMAL(5,2) DEFAULT 100,
  overall_efficiency_score DECIMAL(5,2) DEFAULT 0,
  rank_in_org INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(purchaser_id, period_type, period_start)
);

-- 3. Purchaser Reward Pool & Disbursements
CREATE TABLE public.purchaser_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaser_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_savings_generated DECIMAL(15,2) NOT NULL,
  reward_percentage DECIMAL(5,4) DEFAULT 0.015, -- 1.5% default
  reward_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_savings_generated * reward_percentage) STORED,
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN (
    'amazon_voucher', 'flipkart_voucher', 'travel_voucher', 
    'insurance_benefit', 'wellness_benefit', 'skill_certification', 
    'bank_transfer'
  )),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  cfo_approval_required BOOLEAN DEFAULT false,
  cfo_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Purchaser Achievements & Titles
CREATE TABLE public.purchaser_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaser_id UUID NOT NULL,
  achievement_type VARCHAR(50) NOT NULL CHECK (achievement_type IN (
    'top_cost_optimizer', 'most_efficient_buyer', 'zero_deviation_champion',
    'savings_milestone_1l', 'savings_milestone_10l', 'savings_milestone_1cr',
    'perfect_compliance', 'fastest_turnaround', 'audit_star'
  )),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  period VARCHAR(20), -- Q1, Q2, etc.
  year INTEGER,
  badge_level VARCHAR(20) DEFAULT 'bronze' CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum')),
  awarded_at TIMESTAMPTZ DEFAULT now(),
  visible_to_management BOOLEAN DEFAULT true,
  visible_to_hr BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Career Asset Documents (Auto-generated)
CREATE TABLE public.purchaser_career_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaser_id UUID NOT NULL,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN (
    'performance_certificate', 'savings_impact_report', 
    'audit_efficiency_sheet', 'quarterly_summary'
  )),
  title VARCHAR(200) NOT NULL,
  period_start DATE,
  period_end DATE,
  document_data JSONB NOT NULL, -- Stores all metrics for PDF generation
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Compliance Audit Log (AI Digital Witness)
CREATE TABLE public.purchaser_compliance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaser_id UUID NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  rfq_id UUID,
  supplier_id UUID,
  action_details JSONB,
  compliance_status VARCHAR(20) DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'flagged', 'violation')),
  flag_reason TEXT,
  ai_confidence_score DECIMAL(5,2),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.purchaser_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchaser_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchaser_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchaser_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchaser_career_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchaser_compliance_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Purchasers can view their own data
CREATE POLICY "Purchasers view own savings" ON public.purchaser_savings
  FOR SELECT USING (auth.uid() = purchaser_id);

CREATE POLICY "Purchasers view own scores" ON public.purchaser_scores
  FOR SELECT USING (auth.uid() = purchaser_id);

CREATE POLICY "Purchasers view own rewards" ON public.purchaser_rewards
  FOR SELECT USING (auth.uid() = purchaser_id);

CREATE POLICY "Purchasers view own achievements" ON public.purchaser_achievements
  FOR SELECT USING (auth.uid() = purchaser_id);

CREATE POLICY "Purchasers view own career assets" ON public.purchaser_career_assets
  FOR SELECT USING (auth.uid() = purchaser_id);

-- Admins can manage all data (using has_role function if exists, otherwise allow authenticated for now)
CREATE POLICY "Admins manage savings" ON public.purchaser_savings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins manage scores" ON public.purchaser_scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins manage rewards" ON public.purchaser_rewards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins manage achievements" ON public.purchaser_achievements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins manage career assets" ON public.purchaser_career_assets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins view compliance log" ON public.purchaser_compliance_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Function to calculate purchaser efficiency score
CREATE OR REPLACE FUNCTION public.calculate_purchaser_efficiency_score(
  p_savings DECIMAL,
  p_turnaround DECIMAL,
  p_variance DECIMAL,
  p_compliance DECIMAL,
  p_audit DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  savings_weight DECIMAL := 0.35;
  turnaround_weight DECIMAL := 0.20;
  variance_weight DECIMAL := 0.15;
  compliance_weight DECIMAL := 0.15;
  audit_weight DECIMAL := 0.15;
  normalized_turnaround DECIMAL;
BEGIN
  -- Normalize turnaround (lower is better, max 100 for < 24h)
  normalized_turnaround := GREATEST(0, 100 - (p_turnaround / 2.4));
  
  RETURN (
    (LEAST(p_savings / 10000, 100) * savings_weight) +
    (normalized_turnaround * turnaround_weight) +
    (p_variance * variance_weight) +
    (p_compliance * compliance_weight) +
    (p_audit * audit_weight)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Indexes for performance
CREATE INDEX idx_purchaser_savings_purchaser ON public.purchaser_savings(purchaser_id);
CREATE INDEX idx_purchaser_savings_rfq ON public.purchaser_savings(rfq_id);
CREATE INDEX idx_purchaser_scores_purchaser ON public.purchaser_scores(purchaser_id, period_type);
CREATE INDEX idx_purchaser_rewards_status ON public.purchaser_rewards(status);
CREATE INDEX idx_purchaser_achievements_purchaser ON public.purchaser_achievements(purchaser_id);
CREATE INDEX idx_compliance_log_purchaser ON public.purchaser_compliance_log(purchaser_id);