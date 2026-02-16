
-- =====================================================
-- ENTERPRISE CLEANUP + APPROVAL + FINANCE ENFORCEMENT
-- =====================================================

-- =====================================================
-- 1️⃣ CLEAN DUPLICATE / PERMISSIVE GOVERNANCE POLICIES
-- =====================================================
DROP POLICY IF EXISTS admin_full_access_governance ON public.governance_rules;
DROP POLICY IF EXISTS governance_admin_only ON public.governance_rules;
DROP POLICY IF EXISTS "Admins can manage governance_rules" ON public.governance_rules;
DROP POLICY IF EXISTS "Buyers can view own governance_rules" ON public.governance_rules;
DROP POLICY IF EXISTS "Management can view governance_rules" ON public.governance_rules;

-- Strict Admin-only governance access
CREATE POLICY governance_admin_full_access
ON public.governance_rules
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])
    )
);

ALTER TABLE public.governance_rules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2️⃣ APPROVAL WORKFLOW ENGINE
-- =====================================================
ALTER TABLE public.contract_summaries
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.enforce_approval_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.approval_status = 'approved' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = ANY (ARRAY['admin'::app_role, 'cfo'::app_role])
        ) THEN
            RAISE EXCEPTION 'Only finance/admin can approve contracts';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS approval_workflow_trigger ON public.contract_summaries;
CREATE TRIGGER approval_workflow_trigger
BEFORE UPDATE ON public.contract_summaries
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approval_workflow();

-- =====================================================
-- 3️⃣ FINANCE ROUTING ENFORCEMENT
-- =====================================================
CREATE OR REPLACE FUNCTION public.enforce_finance_routing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    max_credit INTEGER;
BEGIN
    SELECT gr.max_credit_days
    INTO max_credit
    FROM public.governance_rules gr
    WHERE gr.category = NEW.category
    LIMIT 1;

    IF max_credit IS NOT NULL AND NEW.credit_days > max_credit THEN
        RAISE EXCEPTION 'Finance routing blocked: credit exceeds approved governance cap';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS finance_routing_trigger ON public.contract_summaries;
CREATE TRIGGER finance_routing_trigger
BEFORE INSERT OR UPDATE ON public.contract_summaries
FOR EACH ROW
EXECUTE FUNCTION public.enforce_finance_routing();

-- =====================================================
-- 4️⃣ HARDEN contract_summaries RLS
-- =====================================================
DROP POLICY IF EXISTS contract_admin_full_access ON public.contract_summaries;
CREATE POLICY contract_admin_full_access
ON public.contract_summaries
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])
    )
);

-- =====================================================
-- 5️⃣ SECURITY HARDENING BASELINE
-- =====================================================
ALTER TABLE public.contract_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_intelligence_signals ENABLE ROW LEVEL SECURITY;

ALTER FUNCTION public.enforce_governance_rules()
SET search_path = public;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
