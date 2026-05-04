-- Fix #1: Zombie RLS on early_access_windows (RLS enabled, no policies → fail-closed)
-- Add an admin-only policy so the table is governed; still inaccessible to regular users.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relname='early_access_windows') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins manage early access windows" ON public.early_access_windows';
    EXECUTE $p$CREATE POLICY "Admins manage early access windows"
      ON public.early_access_windows
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role))$p$;
  END IF;
END $$;

-- Fix #2: process-email-queue cron is failing because vault secret app.settings.cron_secret is NULL
-- and no email domain is configured. Unschedule until email infra is properly set up.
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname='process-email-queue';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;