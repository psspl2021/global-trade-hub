
-- =====================================================
-- ENTERPRISE MULTI-TENANT SECURITY LOCK
-- =====================================================

-- 1️⃣ Ensure RLS is enabled
ALTER TABLE public.contract_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_intelligence_signals ENABLE ROW LEVEL SECURITY;

-- 2️⃣ DROP OLD POLICIES (contract_summaries)
DROP POLICY IF EXISTS admin_full_access_contracts ON public.contract_summaries;
DROP POLICY IF EXISTS buyer_isolation_policy ON public.contract_summaries;
DROP POLICY IF EXISTS buyer_insert_policy ON public.contract_summaries;
DROP POLICY IF EXISTS supplier_isolation_policy ON public.contract_summaries;
DROP POLICY IF EXISTS admin_full_access_policy ON public.contract_summaries;

-- DROP OLD POLICIES (demand_intelligence_signals)
DROP POLICY IF EXISTS demand_signal_buyer_policy ON public.demand_intelligence_signals;
DROP POLICY IF EXISTS demand_signal_admin_policy ON public.demand_intelligence_signals;

-- 3️⃣ BUYER — SELECT own contracts
CREATE POLICY buyer_isolation_policy
ON public.contract_summaries FOR SELECT
USING (buyer_id = auth.uid());

-- BUYER — INSERT own records
CREATE POLICY buyer_insert_policy
ON public.contract_summaries FOR INSERT
WITH CHECK (buyer_id = auth.uid());

-- 4️⃣ SUPPLIER — SELECT own contracts
CREATE POLICY supplier_isolation_policy
ON public.contract_summaries FOR SELECT
USING (supplier_id = auth.uid());

-- 5️⃣ ADMIN — full access via has_role()
CREATE POLICY admin_full_access_policy
ON public.contract_summaries FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6️⃣ DEMAND SIGNALS — admin-only (no buyer_id column exists)
CREATE POLICY demand_signal_admin_policy
ON public.demand_intelligence_signals FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
