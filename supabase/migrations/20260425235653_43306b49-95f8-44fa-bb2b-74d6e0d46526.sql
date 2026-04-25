-- =====================================================================
-- 1. Fix sync trigger: REPLACE buyer-tier roles, not just append
-- =====================================================================
CREATE OR REPLACE FUNCTION public.sync_buyer_role_to_user_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_target_role public.app_role;
BEGIN
  -- Resolve the canonical app_role for this membership row.
  -- Unknown text values fall back to buyer_purchaser so the user never
  -- ends up roleless (which would break RLS for them).
  BEGIN
    v_target_role := NEW.role::public.app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_target_role := 'buyer_purchaser'::public.app_role;
  END;

  -- Deactivation path: strip all buyer-tier roles for this user.
  -- We only touch buyer_* roles so non-buyer roles (admin, supplier, etc.)
  -- on the same user are never affected.
  IF NEW.is_active IS DISTINCT FROM true THEN
    DELETE FROM public.user_roles
     WHERE user_id = NEW.user_id
       AND role::text LIKE 'buyer_%';
    RETURN NEW;
  END IF;

  -- Active path: replace any existing buyer-tier role with the current one.
  DELETE FROM public.user_roles
   WHERE user_id = NEW.user_id
     AND role::text LIKE 'buyer_%'
     AND role <> v_target_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, v_target_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync_buyer_role_to_user_roles failed for user %: %', NEW.user_id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Trigger already exists from the previous migration; re-create to ensure it
-- fires on the same events (INSERT or UPDATE of role/is_active).
DROP TRIGGER IF EXISTS trg_sync_buyer_role_to_user_roles ON public.buyer_company_members;
CREATE TRIGGER trg_sync_buyer_role_to_user_roles
AFTER INSERT OR UPDATE OF role, is_active ON public.buyer_company_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_buyer_role_to_user_roles();

-- =====================================================================
-- 2. Make handle_new_user stop writing user_roles directly.
--    The membership insert it performs will fire the sync trigger above,
--    which is now the single owner of user_roles for buyer-tier roles.
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

    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer_manager');
  END IF;

  -- Membership insert. This INSERT fires trg_sync_buyer_role_to_user_roles,
  -- which is now the SOLE writer of buyer_* rows in public.user_roles.
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
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;