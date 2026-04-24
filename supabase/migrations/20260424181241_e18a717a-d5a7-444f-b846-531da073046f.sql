CREATE TABLE IF NOT EXISTS public.integrity_alert_state (
  signal_key text PRIMARY KEY,
  last_alerted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integrity_alert_state ENABLE ROW LEVEL SECURITY;

-- No policies = no access for anon/authenticated; service role bypasses RLS.
CREATE POLICY "no_client_access_integrity_alert_state"
ON public.integrity_alert_state
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);