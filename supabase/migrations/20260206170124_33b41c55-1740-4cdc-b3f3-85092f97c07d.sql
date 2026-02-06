-- ============================================================
-- PURCHASER INCENTIVE DECLARATIONS
-- ============================================================
-- ProcureSaathi does NOT pay incentives
-- Buyer organisation declares, approves, and pays
-- ProcureSaathi only MEASURES, DISPLAYS, and AUDITS

-- Approval role enum
DO $$ BEGIN
  CREATE TYPE public.incentive_approval_role AS ENUM ('cfo', 'ceo', 'admin', 'hr');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Incentive status enum
DO $$ BEGIN
  CREATE TYPE public.incentive_status AS ENUM ('declared', 'approved', 'paid', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Purchaser Incentive Declarations Table
CREATE TABLE IF NOT EXISTS public.purchaser_incentive_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL,
  purchaser_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  incentive_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  incentive_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  total_savings_basis DECIMAL(18,2) DEFAULT 0,
  approved_by UUID,
  approval_role incentive_approval_role,
  approved_at TIMESTAMPTZ,
  incentive_status incentive_status NOT NULL DEFAULT 'declared',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_percentage CHECK (incentive_percentage >= 0 AND incentive_percentage <= 100),
  CONSTRAINT valid_amount CHECK (incentive_amount >= 0),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Enable RLS
ALTER TABLE public.purchaser_incentive_declarations ENABLE ROW LEVEL SECURITY;

-- Purchasers can READ ONLY their own incentives
CREATE POLICY "Purchasers can view own incentives"
  ON public.purchaser_incentive_declarations
  FOR SELECT
  USING (purchaser_id = auth.uid());

-- CFO/CEO/Enterprise Admins can manage incentives for their enterprise
CREATE POLICY "Enterprise admins can manage incentives"
  ON public.purchaser_incentive_declarations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.business_type IN ('buyer', 'enterprise')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.business_type IN ('buyer', 'enterprise')
    )
  );

-- ProcureSaathi Admins can READ ONLY (for audit)
CREATE POLICY "ProcureSaathi admins can view all incentives"
  ON public.purchaser_incentive_declarations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Function to get purchaser's incentive summary
CREATE OR REPLACE FUNCTION public.get_purchaser_incentive_summary(p_purchaser_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_declared DECIMAL(18,2) := 0;
  v_total_approved DECIMAL(18,2) := 0;
  v_total_paid DECIMAL(18,2) := 0;
  v_current_quarter RECORD;
BEGIN
  -- Calculate totals
  SELECT 
    COALESCE(SUM(CASE WHEN incentive_status = 'declared' THEN incentive_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN incentive_status = 'approved' THEN incentive_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN incentive_status = 'paid' THEN incentive_amount ELSE 0 END), 0)
  INTO v_total_declared, v_total_approved, v_total_paid
  FROM purchaser_incentive_declarations
  WHERE purchaser_id = p_purchaser_id;

  -- Get current quarter incentive
  SELECT * INTO v_current_quarter
  FROM purchaser_incentive_declarations
  WHERE purchaser_id = p_purchaser_id
    AND period_start <= CURRENT_DATE
    AND period_end >= CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'purchaser_id', p_purchaser_id,
    'total_declared', v_total_declared,
    'total_approved', v_total_approved,
    'total_paid', v_total_paid,
    'current_quarter', CASE WHEN v_current_quarter IS NOT NULL THEN
      jsonb_build_object(
        'id', v_current_quarter.id,
        'percentage', v_current_quarter.incentive_percentage,
        'amount', v_current_quarter.incentive_amount,
        'currency', v_current_quarter.currency,
        'status', v_current_quarter.incentive_status,
        'period_start', v_current_quarter.period_start,
        'period_end', v_current_quarter.period_end
      )
    ELSE NULL END
  );
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_purchaser_incentive_declarations_updated_at
  BEFORE UPDATE ON public.purchaser_incentive_declarations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchaser_incentive_declarations_purchaser 
  ON public.purchaser_incentive_declarations(purchaser_id);

CREATE INDEX IF NOT EXISTS idx_purchaser_incentive_declarations_enterprise 
  ON public.purchaser_incentive_declarations(enterprise_id);

CREATE INDEX IF NOT EXISTS idx_purchaser_incentive_declarations_status 
  ON public.purchaser_incentive_declarations(incentive_status);

CREATE INDEX IF NOT EXISTS idx_purchaser_incentive_declarations_period 
  ON public.purchaser_incentive_declarations(period_start, period_end);