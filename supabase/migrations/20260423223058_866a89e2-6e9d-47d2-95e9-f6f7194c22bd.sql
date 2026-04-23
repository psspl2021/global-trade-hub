
-- 1. Add company_id column
ALTER TABLE public.buyer_role_security
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.buyer_companies(id) ON DELETE CASCADE;

-- 2. Backfill company_id from existing user_id
UPDATE public.buyer_role_security brs
SET company_id = bcm.company_id
FROM public.buyer_company_members bcm
WHERE bcm.user_id = brs.user_id
  AND bcm.is_active = true
  AND brs.company_id IS NULL;

-- 3. Drop rows that couldn't be backfilled (orphan PINs - user not in any company)
DELETE FROM public.buyer_role_security WHERE company_id IS NULL;

-- 4. Deduplicate: keep only ONE PIN per (company_id, role) — most recently updated wins
DELETE FROM public.buyer_role_security a
USING public.buyer_role_security b
WHERE a.company_id = b.company_id
  AND a.role = b.role
  AND a.id <> b.id
  AND (a.updated_at, a.id) < (b.updated_at, b.id);

-- 5. Make company_id NOT NULL
ALTER TABLE public.buyer_role_security ALTER COLUMN company_id SET NOT NULL;

-- 6. Drop old per-user unique constraint, add company-wide unique
ALTER TABLE public.buyer_role_security DROP CONSTRAINT IF EXISTS buyer_role_security_user_id_role_key;
ALTER TABLE public.buyer_role_security DROP CONSTRAINT IF EXISTS buyer_role_security_company_role_unique;
ALTER TABLE public.buyer_role_security
  ADD CONSTRAINT buyer_role_security_company_role_unique UNIQUE (company_id, role);

CREATE INDEX IF NOT EXISTS idx_buyer_role_security_company_role
  ON public.buyer_role_security(company_id, role);

-- 7. RLS policies — company members only
DROP POLICY IF EXISTS "Users can view own role security" ON public.buyer_role_security;
DROP POLICY IF EXISTS "Users can manage own role security" ON public.buyer_role_security;
DROP POLICY IF EXISTS "Company members can view role security" ON public.buyer_role_security;
DROP POLICY IF EXISTS "Company members can manage role security" ON public.buyer_role_security;

CREATE POLICY "Company members can view role security"
ON public.buyer_role_security FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.buyer_company_members bcm
    WHERE bcm.user_id = auth.uid()
      AND bcm.company_id = buyer_role_security.company_id
      AND bcm.is_active = true
  )
);

CREATE POLICY "Company members can manage role security"
ON public.buyer_role_security FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.buyer_company_members bcm
    WHERE bcm.user_id = auth.uid()
      AND bcm.company_id = buyer_role_security.company_id
      AND bcm.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.buyer_company_members bcm
    WHERE bcm.user_id = auth.uid()
      AND bcm.company_id = buyer_role_security.company_id
      AND bcm.is_active = true
  )
);

-- 8. Update has_role_pin: resolve user's company, check company-wide PIN
CREATE OR REPLACE FUNCTION public.has_role_pin(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.buyer_role_security brs
    JOIN public.buyer_company_members bcm
      ON bcm.company_id = brs.company_id
    WHERE bcm.user_id = _user_id
      AND bcm.is_active = true
      AND brs.role = _role
  );
$function$;

-- 9. Update set_role_pin: write company-wide
CREATE OR REPLACE FUNCTION public.set_role_pin(_user_id uuid, _role text, _pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_hash text;
  v_company_id uuid;
BEGIN
  IF length(_pin) < 4 OR length(_pin) > 8 OR _pin !~ '^\d+$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_pin_format',
      'message', 'PIN must be 4-8 digits'
    );
  END IF;

  -- Resolve user's active company
  SELECT company_id INTO v_company_id
  FROM public.buyer_company_members
  WHERE user_id = _user_id AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'no_company',
      'message', 'User is not part of any company.'
    );
  END IF;

  v_hash := extensions.crypt(_pin, extensions.gen_salt('bf'));

  INSERT INTO public.buyer_role_security (company_id, user_id, role, role_pin_hash, updated_at)
  VALUES (v_company_id, _user_id, _role, v_hash, now())
  ON CONFLICT (company_id, role)
  DO UPDATE SET role_pin_hash = v_hash, user_id = excluded.user_id, updated_at = now();

  RETURN json_build_object(
    'success', true,
    'message', 'PIN set successfully (company-wide)'
  );
END;
$function$;

-- 10. Update verify_role_pin: company-wide lookup + per-user audit
CREATE OR REPLACE FUNCTION public.verify_role_pin(_user_id uuid, _role text, _pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_stored_hash text;
  v_company_id uuid;
  v_is_valid boolean;
  v_log_id uuid;
BEGIN
  -- Resolve user's company
  SELECT company_id INTO v_company_id
  FROM public.buyer_company_members
  WHERE user_id = _user_id AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO public.role_verification_logs (user_id, target_role, action, metadata)
    VALUES (_user_id, _role, 'unlock_failure', '{"reason": "no_company"}'::jsonb);
    RETURN json_build_object('success', false, 'error', 'no_company', 'message', 'User has no company.');
  END IF;

  SELECT role_pin_hash INTO v_stored_hash
  FROM public.buyer_role_security
  WHERE company_id = v_company_id AND role = _role;

  IF v_stored_hash IS NULL THEN
    INSERT INTO public.role_verification_logs (user_id, target_role, action, metadata)
    VALUES (_user_id, _role, 'unlock_failure', '{"reason": "no_pin_configured"}'::jsonb);

    RETURN json_build_object(
      'success', false,
      'error', 'no_pin_configured',
      'message', 'No PIN configured for this role in your company. Please set up a PIN first.'
    );
  END IF;

  v_is_valid := (v_stored_hash = extensions.crypt(_pin, v_stored_hash));

  IF v_is_valid THEN
    UPDATE public.buyer_role_security
    SET last_verified_at = now(), updated_at = now()
    WHERE company_id = v_company_id AND role = _role;

    INSERT INTO public.role_verification_logs (user_id, target_role, action, metadata)
    VALUES (_user_id, _role, 'unlock_success', jsonb_build_object('company_id', v_company_id))
    RETURNING id INTO v_log_id;

    RETURN json_build_object(
      'success', true,
      'verified_at', now(),
      'log_id', v_log_id
    );
  ELSE
    INSERT INTO public.role_verification_logs (user_id, target_role, action, metadata)
    VALUES (_user_id, _role, 'unlock_failure', jsonb_build_object('reason', 'invalid_pin', 'company_id', v_company_id));

    RETURN json_build_object(
      'success', false,
      'error', 'invalid_pin',
      'message', 'Invalid PIN. Please try again.'
    );
  END IF;
END;
$function$;
