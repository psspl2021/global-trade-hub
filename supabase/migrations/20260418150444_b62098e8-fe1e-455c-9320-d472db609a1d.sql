-- Store temp credentials for newly-created company users
CREATE TABLE IF NOT EXISTS public.purchaser_temp_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  company_id uuid NOT NULL REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  email text NOT NULL,
  temp_password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ptc_company ON public.purchaser_temp_credentials(company_id);
CREATE INDEX IF NOT EXISTS idx_ptc_created_by ON public.purchaser_temp_credentials(created_by);

ALTER TABLE public.purchaser_temp_credentials ENABLE ROW LEVEL SECURITY;

-- Block direct SELECT (we only expose via the security-definer helper below)
CREATE POLICY "ptc_no_direct_select"
ON public.purchaser_temp_credentials
FOR SELECT
USING (false);

-- Block all client-side mutations (only edge function with service role inserts/deletes)
CREATE POLICY "ptc_no_client_writes_insert"
ON public.purchaser_temp_credentials
FOR INSERT
WITH CHECK (false);

CREATE POLICY "ptc_no_client_writes_update"
ON public.purchaser_temp_credentials
FOR UPDATE
USING (false);

CREATE POLICY "ptc_no_client_writes_delete"
ON public.purchaser_temp_credentials
FOR DELETE
USING (false);

-- Helper: returns rows the caller is allowed to see (i.e. credentials they
-- created for users in their company who have NOT yet signed in).
CREATE OR REPLACE FUNCTION public.get_visible_temp_credentials(p_user_id uuid)
RETURNS TABLE(target_user_id uuid, email text, temp_password text, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
BEGIN
  SELECT company_id INTO v_company
  FROM public.buyer_company_members
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  IF v_company IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ptc.user_id AS target_user_id,
    ptc.email,
    ptc.temp_password,
    ptc.created_at
  FROM public.purchaser_temp_credentials ptc
  JOIN auth.users u ON u.id = ptc.user_id
  WHERE ptc.company_id = v_company
    AND ptc.created_by = p_user_id   -- only the creator sees them
    AND u.last_sign_in_at IS NULL;   -- hide once user has signed in
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_visible_temp_credentials(uuid) TO authenticated;

-- Auto-cleanup: when a user signs in for the first time, drop their temp creds.
CREATE OR REPLACE FUNCTION public.cleanup_temp_credentials_on_signin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.last_sign_in_at IS NOT NULL
     AND (OLD.last_sign_in_at IS NULL OR OLD.last_sign_in_at <> NEW.last_sign_in_at) THEN
    DELETE FROM public.purchaser_temp_credentials WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_temp_creds_on_signin ON auth.users;
CREATE TRIGGER trg_cleanup_temp_creds_on_signin
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_temp_credentials_on_signin();