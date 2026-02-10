
-- =============================================
-- PHASE 1: AI Lead Scoring
-- =============================================
CREATE TABLE public.rfq_lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES public.requirements(id),
  session_id TEXT,
  lead_score TEXT NOT NULL CHECK (lead_score IN ('HOT', 'WARM', 'COLD')),
  confidence_score INTEGER NOT NULL DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  intent_strength TEXT,
  budget_confidence TEXT CHECK (budget_confidence IN ('LOW', 'MEDIUM', 'HIGH')),
  urgency TEXT CHECK (urgency IN ('IMMEDIATE', '30_DAYS', 'EXPLORATORY')),
  category_fit TEXT,
  ai_reason_summary TEXT,
  buyer_company TEXT,
  buyer_location TEXT,
  estimated_deal_value NUMERIC,
  category_slug TEXT,
  trade_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rfq_lead_scores ENABLE ROW LEVEL SECURITY;

-- Admins can read all
CREATE POLICY "Admins can read lead scores"
  ON public.rfq_lead_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_company_members
      WHERE user_id = auth.uid()
      AND role IN ('ps_admin', 'admin')
      AND is_active = true
    )
  );

-- System insert (anon for edge function)
CREATE POLICY "System can insert lead scores"
  ON public.rfq_lead_scores FOR INSERT
  WITH CHECK (true);

-- =============================================
-- PHASE 2: Sales Actions
-- =============================================
CREATE TABLE public.sales_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_score_id UUID NOT NULL REFERENCES public.rfq_lead_scores(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('assign_sales', 'mark_contacted', 'mark_lost')),
  assigned_to TEXT,
  loss_reason TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sales actions"
  ON public.sales_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_company_members
      WHERE user_id = auth.uid()
      AND role IN ('ps_admin', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "System can insert sales actions"
  ON public.sales_actions FOR INSERT
  WITH CHECK (true);

-- =============================================
-- PHASE 3: Category Price Benchmarks
-- =============================================
CREATE TABLE public.category_price_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  subcategory TEXT,
  unit TEXT NOT NULL DEFAULT 'MT',
  region TEXT NOT NULL DEFAULT 'India',
  benchmark_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  set_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.category_price_benchmarks ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage benchmarks"
  ON public.category_price_benchmarks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_company_members
      WHERE user_id = auth.uid()
      AND role IN ('ps_admin', 'admin')
      AND is_active = true
    )
  );

-- CFO/CEO can read benchmarks
CREATE POLICY "Executives can read benchmarks"
  ON public.category_price_benchmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_company_members
      WHERE user_id = auth.uid()
      AND role IN ('cfo', 'buyer_cfo', 'ceo', 'buyer_ceo', 'manager', 'buyer_manager')
      AND is_active = true
    )
  );

-- Purchasers can read benchmarks (read-only savings view)
CREATE POLICY "Purchasers can read benchmarks"
  ON public.category_price_benchmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_company_members
      WHERE user_id = auth.uid()
      AND role IN ('purchaser', 'buyer_purchaser', 'buyer')
      AND is_active = true
    )
  );
