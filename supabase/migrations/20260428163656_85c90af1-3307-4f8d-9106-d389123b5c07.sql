-- ============================================================
-- 1. Rewrite handle_new_user: signup role = source of truth
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_invite RECORD;
  v_company_id uuid;
  v_role text;
  v_full_name text;
  v_company_name text;
  v_signup_role text;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'contact_person',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, contact_person)
  VALUES (NEW.id, v_full_name)
  ON CONFLICT (id) DO NOTHING;

  v_signup_role := lower(COALESCE(NEW.raw_user_meta_data->>'role', ''));

  -- ─────────────────────────────────────────────────────────
  -- Non-buyer personas: assign their app_role and STOP.
  -- No buyer company, no buyer role contamination.
  -- ─────────────────────────────────────────────────────────
  IF v_signup_role = 'supplier' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'supplier'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
  END IF;

  IF v_signup_role = 'logistics_partner' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'logistics_partner'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
  END IF;

  IF v_signup_role = 'transporter' THEN
    -- Transporter app_role may not exist in every env; fall back to logistics_partner.
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'transporter'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'logistics_partner'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END;
    RETURN NEW;
  END IF;

  IF v_signup_role = 'affiliate' THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'affiliate'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- affiliate enum value missing → silently skip
    END;
    RETURN NEW;
  END IF;

  -- ─────────────────────────────────────────────────────────
  -- Buyer path (default). Honor team-invite if present.
  -- ─────────────────────────────────────────────────────────
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

    UPDATE public.team_invites
       SET status = 'accepted',
           accepted_at = now(),
           accepted_by = NEW.id
     WHERE id = v_invite.id;
  ELSE
    v_company_name := COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      v_full_name || '''s Company'
    );

    INSERT INTO public.buyer_companies (company_name)
    VALUES (v_company_name)
    RETURNING id INTO v_company_id;

    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer_manager');
  END IF;

  INSERT INTO public.buyer_company_members (
    user_id, company_id, role, is_active
  )
  VALUES (NEW.id, v_company_id, v_role, true)
  ON CONFLICT (user_id, company_id) DO UPDATE
    SET is_active = true,
        role = EXCLUDED.role,
        updated_at = now();

  -- Mirror the buyer role into user_roles so admin/RBAC views work.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- 2. Stop creating ghost placeholder profiles on collision.
--    If profile insert collides, just skip — no synthetic
--    `user-<short>@placeholder.local` rows that pollute the UI.
-- ============================================================
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text := NULLIF(NEW.email, '');
  v_phone text := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  v_name text := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'contact_person', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(COALESCE(v_email, ''), '@', 1)
  );
  v_company text := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    split_part(COALESCE(v_email, ''), '@', 1)
  );
BEGIN
  -- Only insert if we have real identifying data. Otherwise skip
  -- (handle_new_user already handles the canonical profile insert).
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, company_name, contact_person, phone)
  VALUES (NEW.id, v_email, v_company, v_name, v_phone)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- Email/phone/company collision → do NOT create a ghost row.
  -- Surface the issue silently; the actual signup will still succeed
  -- because the auth.users row is independent.
  RAISE WARNING 'ensure_profile_exists collision for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;