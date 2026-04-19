-- Audit table for cross-user reads (impersonation / "view as")
CREATE TABLE IF NOT EXISTS public.impersonation_read_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL,
  viewed_user_id uuid NOT NULL,
  entity text NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.impersonation_read_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read this audit log
DROP POLICY IF EXISTS "Admins read impersonation logs" ON public.impersonation_read_logs;
CREATE POLICY "Admins read impersonation logs"
  ON public.impersonation_read_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Helper used by scoped RPCs to audit cross-user reads
CREATE OR REPLACE FUNCTION public.log_impersonation_read(
  p_caller uuid,
  p_viewed uuid,
  p_entity text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.impersonation_read_logs (caller_id, viewed_user_id, entity)
  VALUES (p_caller, p_viewed, p_entity);
EXCEPTION WHEN OTHERS THEN
  -- Never fail the parent query because of audit issues
  NULL;
END;
$$;