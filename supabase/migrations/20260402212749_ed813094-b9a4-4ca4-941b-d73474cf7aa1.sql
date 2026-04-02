DROP POLICY IF EXISTS "Admin read query_history" ON public.query_history;
CREATE POLICY "Admin read query_history" ON public.query_history
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ps_admin'::app_role));

DROP POLICY IF EXISTS "Admin read internal_links" ON public.internal_links;
CREATE POLICY "Admin read internal_links" ON public.internal_links
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ps_admin'::app_role));

DROP POLICY IF EXISTS "Admin read rfq_analytics" ON public.rfq_analytics;
CREATE POLICY "Admin read rfq_analytics" ON public.rfq_analytics
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ps_admin'::app_role));