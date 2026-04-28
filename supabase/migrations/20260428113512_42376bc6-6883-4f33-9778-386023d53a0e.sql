-- 1. Fix the trigger so non-buyer signups don't get a buyer company + buyer_manager role
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

  -- Skip buyer-company creation for non-buyer personas.
  -- Their role is provisioned elsewhere (supplier/logistics signup paths).
  IF v_signup_role IN ('supplier', 'logistics_partner', 'transporter', 'affiliate') THEN
    RETURN NEW;
  END IF;

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

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2. Clean up existing dual-role pollution:
--    Remove buyer_manager rows from any user that is actually a supplier or logistics_partner.
DELETE FROM public.user_roles ur
WHERE ur.role = 'buyer_manager'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = ur.user_id
      AND ur2.role IN ('supplier', 'logistics_partner')
  );

-- 3. Deactivate the auto-created buyer company memberships for those users
--    so the sync trigger cannot re-add the buyer_manager role.
UPDATE public.buyer_company_members bcm
SET is_active = false,
    updated_at = now()
WHERE bcm.is_active = true
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = bcm.user_id
      AND ur.role IN ('supplier', 'logistics_partner')
  );