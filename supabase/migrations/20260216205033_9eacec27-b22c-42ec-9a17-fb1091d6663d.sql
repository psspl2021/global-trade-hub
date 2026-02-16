
-- =====================================================
-- ENTERPRISE ENFORCEMENT LAYER
-- =====================================================

-- 0️⃣ Add missing 'category' column to contract_summaries
ALTER TABLE public.contract_summaries
ADD COLUMN IF NOT EXISTS category text;

-- 1️⃣ Ensure governance_rules is admin-only
ALTER TABLE public.governance_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS governance_admin_only ON public.governance_rules;
CREATE POLICY governance_admin_only
ON public.governance_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- 2️⃣ ENFORCEMENT FUNCTION (uses platform_margin instead of margin_percent)
CREATE OR REPLACE FUNCTION public.enforce_governance_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_margin numeric;
  max_credit integer;
BEGIN
  -- Fetch governance limits for category
  SELECT margin_cap
  INTO max_margin
  FROM public.governance_rules
  WHERE category = NEW.category
  AND is_active = true
  LIMIT 1;

  -- If governance rule exists, enforce margin
  IF max_margin IS NOT NULL AND NEW.platform_margin IS NOT NULL THEN
    IF NEW.platform_margin > max_margin THEN
      RAISE EXCEPTION
      'Governance violation: margin %% exceeds allowed cap (Allowed: %, Provided: %)',
      max_margin, NEW.platform_margin;
    END IF;
  END IF;

  -- Credit days hard safety (global enterprise cap)
  max_credit := 90;
  IF NEW.credit_days IS NOT NULL AND NEW.credit_days > max_credit THEN
    RAISE EXCEPTION
    'Governance violation: credit days exceed enterprise cap (Max: %, Provided: %)',
    max_credit, NEW.credit_days;
  END IF;

  RETURN NEW;
END;
$$;

-- 3️⃣ ATTACH TRIGGER TO CONTRACTS
DROP TRIGGER IF EXISTS governance_enforcement_trigger ON public.contract_summaries;
CREATE TRIGGER governance_enforcement_trigger
BEFORE INSERT OR UPDATE
ON public.contract_summaries
FOR EACH ROW
EXECUTE FUNCTION public.enforce_governance_rules();

-- 4️⃣ PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_contracts_buyer ON public.contract_summaries (buyer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_supplier ON public.contract_summaries (supplier_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON public.contract_summaries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON public.contract_summaries (category);

-- 5️⃣ HARDEN DEMAND SIGNALS (ADMIN ONLY)
ALTER TABLE public.demand_intelligence_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS signals_admin_only ON public.demand_intelligence_signals;
CREATE POLICY signals_admin_only
ON public.demand_intelligence_signals
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

NOTIFY pgrst, 'reload schema';
