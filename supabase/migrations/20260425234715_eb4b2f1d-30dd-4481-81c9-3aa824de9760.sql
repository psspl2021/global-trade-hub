-- =====================================================================
-- 1. Patch handle_new_user to also insert into user_roles
-- =====================================================================
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
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'contact_person',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, contact_person)
  VALUES (NEW.id, v_full_name)
  ON CONFLICT (id) DO NOTHING;

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

    -- First user of a brand-new company is the manager unless metadata says otherwise
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer_manager');
  END IF;

  -- Membership (existing behavior)
  INSERT INTO public.buyer_company_members (
    user_id, company_id, role, is_active
  )
  VALUES (NEW.id, v_company_id, v_role, true)
  ON CONFLICT (user_id, company_id) DO UPDATE
    SET is_active = true,
        role = EXCLUDED.role,
        updated_at = now();

  -- NEW: mirror role into user_roles (typed enum). Cast safely; if the text
  -- value isn't a valid app_role, fall back to buyer_purchaser so we never
  -- leave the user roleless. ON CONFLICT keeps this idempotent.
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN invalid_text_representation THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'buyer_purchaser'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- =====================================================================
-- 2. Keep user_roles in sync with buyer_company_members going forward
-- =====================================================================
CREATE OR REPLACE FUNCTION public.sync_buyer_role_to_user_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only mirror active memberships
  IF NEW.is_active IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Unknown role string: fall back so RLS still works
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'buyer_purchaser'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync_buyer_role_to_user_roles failed for user %: %', NEW.user_id, SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_buyer_role_to_user_roles ON public.buyer_company_members;
CREATE TRIGGER trg_sync_buyer_role_to_user_roles
AFTER INSERT OR UPDATE OF role, is_active ON public.buyer_company_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_buyer_role_to_user_roles();

-- =====================================================================
-- 3. Harden team_invites: token + expiry
-- =====================================================================
ALTER TABLE public.team_invites
  ADD COLUMN IF NOT EXISTS token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days');

-- Backfill: existing rows already have a default token from the ADD COLUMN,
-- but ensure uniqueness and add an index for lookup.
CREATE UNIQUE INDEX IF NOT EXISTS team_invites_token_key ON public.team_invites(token);
CREATE INDEX IF NOT EXISTS team_invites_email_status_idx ON public.team_invites(lower(email), status);

-- =====================================================================
-- 4. Backfill: insert user_roles for every active buyer member missing one
-- =====================================================================
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT m.user_id,
       CASE
         WHEN m.role IN (
           'buyer_ceo','buyer_cfo','buyer_hr','buyer_manager',
           'buyer_purchase_head','buyer_purchaser','buyer_vp','buyer'
         ) THEN m.role::public.app_role
         WHEN m.role IN ('purchaser') THEN 'buyer_purchaser'::public.app_role
         WHEN m.role IN ('manager') THEN 'buyer_manager'::public.app_role
         ELSE 'buyer_purchaser'::public.app_role
       END AS role
FROM public.buyer_company_members m
WHERE m.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = m.user_id
  )
ON CONFLICT (user_id, role) DO NOTHING;