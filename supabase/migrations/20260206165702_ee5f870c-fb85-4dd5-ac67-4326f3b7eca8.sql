-- ============================================================
-- ENTERPRISE BILLING GOVERNANCE
-- ============================================================
-- Platform fee is a quarterly governance fee to BUYER ORGANISATION
-- NOT commission, NOT per RFQ, NOT supplier-paid

-- Enterprise Billing Configuration Table
CREATE TABLE IF NOT EXISTS public.enterprise_billing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL,
  enterprise_name TEXT,
  onboarding_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  onboarding_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days')::DATE,
  billing_active BOOLEAN NOT NULL DEFAULT false,
  domestic_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 0.5,
  import_export_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 2.0,
  billing_cycle TEXT NOT NULL DEFAULT 'quarterly',
  total_transacted_value DECIMAL(18,2) DEFAULT 0,
  total_verified_savings DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_fee_percent CHECK (domestic_fee_percent >= 0 AND domestic_fee_percent <= 10),
  CONSTRAINT valid_import_fee_percent CHECK (import_export_fee_percent >= 0 AND import_export_fee_percent <= 10),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('quarterly', 'annual'))
);

-- Enable RLS
ALTER TABLE public.enterprise_billing_config ENABLE ROW LEVEL SECURITY;

-- Only admins and enterprise management can view billing config
CREATE POLICY "Only admins can manage billing config"
  ON public.enterprise_billing_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.business_type IN ('buyer', 'enterprise')
    )
  );

-- Enterprise Billing History Table (quarterly invoices)
CREATE TABLE IF NOT EXISTS public.enterprise_billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES public.enterprise_billing_config(id) ON DELETE CASCADE,
  quarter_start DATE NOT NULL,
  quarter_end DATE NOT NULL,
  domestic_volume DECIMAL(18,2) DEFAULT 0,
  import_export_volume DECIMAL(18,2) DEFAULT 0,
  domestic_fee DECIMAL(18,2) DEFAULT 0,
  import_export_fee DECIMAL(18,2) DEFAULT 0,
  total_fee DECIMAL(18,2) DEFAULT 0,
  is_onboarding_quarter BOOLEAN DEFAULT false,
  invoice_status TEXT DEFAULT 'pending',
  invoice_generated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_invoice_status CHECK (invoice_status IN ('pending', 'generated', 'paid', 'waived'))
);

-- Enable RLS
ALTER TABLE public.enterprise_billing_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view billing history
CREATE POLICY "Only admins can manage billing history"
  ON public.enterprise_billing_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Function to calculate enterprise platform fee
CREATE OR REPLACE FUNCTION public.calculate_enterprise_platform_fee(
  p_enterprise_id UUID,
  p_quarter_start DATE,
  p_quarter_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config enterprise_billing_config%ROWTYPE;
  v_domestic_volume DECIMAL(18,2) := 0;
  v_import_export_volume DECIMAL(18,2) := 0;
  v_domestic_fee DECIMAL(18,2) := 0;
  v_import_export_fee DECIMAL(18,2) := 0;
  v_total_fee DECIMAL(18,2) := 0;
  v_is_onboarding BOOLEAN := false;
BEGIN
  -- Get enterprise billing config
  SELECT * INTO v_config
  FROM enterprise_billing_config
  WHERE id = p_enterprise_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enterprise billing config not found'
    );
  END IF;

  -- Check if still in onboarding period (Q1 free)
  IF p_quarter_end <= v_config.onboarding_end_date THEN
    v_is_onboarding := true;
    v_domestic_fee := 0;
    v_import_export_fee := 0;
    v_total_fee := 0;
  ELSE
    -- Calculate fees based on transacted volume
    -- In a real implementation, this would query actual transaction data
    v_domestic_fee := v_domestic_volume * (v_config.domestic_fee_percent / 100);
    v_import_export_fee := v_import_export_volume * (v_config.import_export_fee_percent / 100);
    v_total_fee := v_domestic_fee + v_import_export_fee;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'enterprise_id', p_enterprise_id,
    'quarter_start', p_quarter_start,
    'quarter_end', p_quarter_end,
    'is_onboarding_quarter', v_is_onboarding,
    'domestic_volume', v_domestic_volume,
    'import_export_volume', v_import_export_volume,
    'domestic_fee_percent', v_config.domestic_fee_percent,
    'import_export_fee_percent', v_config.import_export_fee_percent,
    'domestic_fee', v_domestic_fee,
    'import_export_fee', v_import_export_fee,
    'total_fee', v_total_fee,
    'billing_active', v_config.billing_active,
    'onboarding_end_date', v_config.onboarding_end_date
  );
END;
$$;

-- Function to check if enterprise is in onboarding period
CREATE OR REPLACE FUNCTION public.is_enterprise_onboarding(p_enterprise_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_onboarding_end DATE;
BEGIN
  SELECT onboarding_end_date INTO v_onboarding_end
  FROM enterprise_billing_config
  WHERE id = p_enterprise_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN true; -- Default to onboarding if no config
  END IF;

  RETURN CURRENT_DATE <= v_onboarding_end;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_enterprise_billing_config_updated_at
  BEFORE UPDATE ON public.enterprise_billing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for enterprise lookups
CREATE INDEX IF NOT EXISTS idx_enterprise_billing_config_enterprise_id 
  ON public.enterprise_billing_config(enterprise_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_billing_history_enterprise_id 
  ON public.enterprise_billing_history(enterprise_id);