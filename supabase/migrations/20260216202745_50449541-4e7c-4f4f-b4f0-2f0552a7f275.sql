
-- CLEAN CONTRACT_SUMMARIES POLICIES
DROP POLICY IF EXISTS "Admins can manage contract_summaries" ON public.contract_summaries;
DROP POLICY IF EXISTS admin_full_access_policy ON public.contract_summaries;
DROP POLICY IF EXISTS buyer_isolation_policy ON public.contract_summaries;
DROP POLICY IF EXISTS supplier_isolation_policy ON public.contract_summaries;

CREATE POLICY contract_admin_full_access
ON public.contract_summaries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])
  )
);

CREATE POLICY contract_buyer_select
ON public.contract_summaries
FOR SELECT
USING (buyer_id = auth.uid());

CREATE POLICY contract_supplier_select
ON public.contract_summaries
FOR SELECT
USING (supplier_id = auth.uid());

CREATE POLICY contract_buyer_insert
ON public.contract_summaries
FOR INSERT
WITH CHECK (buyer_id = auth.uid());

-- CLEAN DEMAND_INTELLIGENCE_SIGNALS POLICIES
DROP POLICY IF EXISTS demand_signal_buyer_policy ON public.demand_intelligence_signals;
DROP POLICY IF EXISTS demand_signal_admin_policy ON public.demand_intelligence_signals;
DROP POLICY IF EXISTS "Admin full access to signals" ON public.demand_intelligence_signals;

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
