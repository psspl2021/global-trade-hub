
-- RESET CONTRACT_SUMMARIES POLICIES
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contract_summaries') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contract_summaries;', r.policyname);
  END LOOP;
END $$;

CREATE POLICY contract_admin_full_access ON public.contract_summaries FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])))
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])));

CREATE POLICY contract_buyer_select ON public.contract_summaries FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY contract_supplier_select ON public.contract_summaries FOR SELECT USING (supplier_id = auth.uid());
CREATE POLICY contract_buyer_insert ON public.contract_summaries FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- RESET SIGNALS TABLE
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'demand_intelligence_signals') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.demand_intelligence_signals;', r.policyname);
  END LOOP;
END $$;

CREATE POLICY signals_admin_only ON public.demand_intelligence_signals FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

NOTIFY pgrst, 'reload schema';
