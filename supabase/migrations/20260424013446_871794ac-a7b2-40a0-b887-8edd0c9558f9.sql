-- =========================================================
-- P0: Atomic, invite-aware membership provisioning
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_company_id uuid;
  v_role text;
  v_full_name text;
  v_company_name text;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'contact_person',
    split_part(NEW.email, '@', 1)
  );

  -- Insert profile (best effort)
  INSERT INTO public.profiles (id, contact_person)
  VALUES (NEW.id, v_full_name)
  ON CONFLICT (id) DO NOTHING;

  -- 1) Look for a pending invite for this email
  SELECT *
    INTO v_invite
  FROM public.team_invites
  WHERE lower(email) = lower(NEW.email)
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite.id IS NOT NULL THEN
    v_company_id := v_invite.company_id;
    v_role := COALESCE(v_invite.role, 'buyer_purchaser');

    -- Mark invite consumed
    UPDATE public.team_invites
       SET status = 'accepted',
           accepted_at = now(),
           accepted_by = NEW.id
     WHERE id = v_invite.id;
  ELSE
    -- 2) No invite → provision a new company for this user
    v_company_name := COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      v_full_name || '''s Company'
    );

    INSERT INTO public.buyer_companies (company_name)
    VALUES (v_company_name)
    RETURNING id INTO v_company_id;

    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer_purchaser');
  END IF;

  -- 3) Atomic membership insert with conflict guard
  INSERT INTO public.buyer_company_members (
    user_id, company_id, role, is_active
  )
  VALUES (NEW.id, v_company_id, v_role, true)
  ON CONFLICT (user_id, company_id) DO UPDATE
    SET is_active = true,
        role = EXCLUDED.role,
        updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup; log and continue
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- =========================================================
-- P0: Hard-fail get_user_scope for buyer-type users
--      without an active membership (prevents silent
--      empty-dashboard / partial-exposure failure modes)
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_user_scope()
RETURNS TABLE(company_id uuid, role text, assigned_categories text[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_found boolean := false;
  v_persona text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  FOR company_id, role, assigned_categories IN
    SELECT m.company_id, m.role, m.assigned_categories
    FROM public.buyer_company_members m
    WHERE m.user_id = v_uid
      AND m.is_active = true
  LOOP
    v_found := true;
    RETURN NEXT;
  END LOOP;

  IF NOT v_found THEN
    -- If this user has a buyer-type persona in user_roles but no
    -- active company membership, fail loud rather than silently
    -- returning an empty scope (which makes RLS unpredictable).
    SELECT ur.role::text INTO v_persona
    FROM public.user_roles ur
    WHERE ur.user_id = v_uid
      AND ur.role::text LIKE 'buyer_%'
    LIMIT 1;

    IF v_persona IS NOT NULL THEN
      RAISE EXCEPTION 'user_not_in_company'
        USING HINT = 'Buyer user has no active buyer_company_members row',
              ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN;
END;
$$;

-- =========================================================
-- Soft guard: known-values CHECK on role (non-breaking)
-- Replaces any prior version of this constraint.
-- Does NOT change column type; existing RLS untouched.
-- =========================================================

ALTER TABLE public.buyer_company_members
  DROP CONSTRAINT IF EXISTS role_known_values_check;

ALTER TABLE public.buyer_company_members
  ADD CONSTRAINT role_known_values_check
  CHECK (
    role IN (
      'buyer_purchaser','purchaser',
      'buyer_manager','manager',
      'buyer_admin','admin',
      'cfo','buyer_cfo',
      'ceo','buyer_ceo',
      'hr','buyer_hr',
      'director','vp','purchase_head',
      'operations_manager','finance_manager',
      'ps_admin'
    )
  ) NOT VALID;

-- Validate against existing rows; if this fails, we'll see
-- exactly which legacy role string needs to be added.
ALTER TABLE public.buyer_company_members
  VALIDATE CONSTRAINT role_known_values_check;