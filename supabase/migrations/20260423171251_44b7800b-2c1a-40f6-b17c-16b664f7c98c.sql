-- =========================================
-- PHASE 1: HARDENED IDENTITY + MEMBERSHIP (v6)
-- profiles UNIQUE: id, email, phone, lower(company_name)
-- =========================================

-- 1️⃣ Unique membership index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename='buyer_company_members'
      AND indexname='buyer_company_members_user_company_unique'
  ) THEN
    CREATE UNIQUE INDEX buyer_company_members_user_company_unique
    ON public.buyer_company_members (user_id, company_id);
  END IF;
END $$;


-- 2️⃣ Role normalization
UPDATE public.buyer_company_members
SET role = CASE
  WHEN role IN ('purchase_head','buyer_purchase_head','vp','buyer_director','buyer_vp','buyer_admin') THEN 'buyer_manager'
  WHEN role IN ('purchaser','buyer') THEN 'buyer_purchaser'
  ELSE role
END
WHERE role NOT IN ('buyer_purchaser','buyer_cfo','buyer_ceo','buyer_hr','buyer_manager');


-- 3️⃣ Profile auto-create with full collision-safe placeholders
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_id_short text := substr(NEW.id::text, 1, 8);
  v_email text := COALESCE(NULLIF(NEW.email,''), 'user-'||v_id_short||'@placeholder.local');
  v_phone text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone',''), 'pending-'||v_id_short);
  v_name text := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'contact_person',''),
    NULLIF(NEW.raw_user_meta_data->>'full_name',''),
    split_part(v_email,'@',1)
  );
  v_company text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name',''), split_part(v_email,'@',1));
BEGIN
  INSERT INTO public.profiles (id, email, company_name, contact_person, phone)
  VALUES (NEW.id, v_email, v_company, v_name, v_phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- Any UNIQUE collision (email/phone/company_name) → use id-suffixed values
  INSERT INTO public.profiles (id, email, company_name, contact_person, phone)
  VALUES (
    NEW.id,
    'user-'||v_id_short||'@placeholder.local',
    v_company||' ('||v_id_short||')',
    v_name,
    'pending-'||v_id_short
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$fn$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='auth' AND c.relname='users'
      AND (t.tgname ILIKE '%handle_new_user%' OR t.tgname ILIKE '%profile%')
      AND NOT t.tgisinternal
  ) THEN
    DROP TRIGGER IF EXISTS ensure_profile_exists_trigger ON auth.users;
    CREATE TRIGGER ensure_profile_exists_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_profile_exists();
  END IF;
END $$;


-- 4️⃣ Invite-first company resolution
CREATE OR REPLACE FUNCTION public.auto_provision_buyer_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_invite record;
  v_company_id uuid;
  v_invite_role text;
  has_updated_at boolean;
  v_user_email text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.buyer_company_members WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.id;
  IF v_user_email IS NULL THEN v_user_email := NEW.email; END IF;

  SELECT * INTO v_invite
  FROM public.team_invites
  WHERE lower(btrim(email)) = lower(btrim(v_user_email))
    AND status = 'pending'
  ORDER BY created_at DESC LIMIT 1;

  IF FOUND THEN
    v_invite_role := CASE
      WHEN v_invite.role IN ('buyer_purchaser','buyer_cfo','buyer_ceo','buyer_hr','buyer_manager') THEN v_invite.role
      WHEN v_invite.role IN ('purchaser','buyer') THEN 'buyer_purchaser'
      WHEN v_invite.role IN ('purchase_head','buyer_purchase_head','vp','buyer_director','buyer_vp','buyer_admin') THEN 'buyer_manager'
      ELSE 'buyer_purchaser'
    END;

    INSERT INTO public.buyer_company_members (user_id, company_id, role, is_active)
    VALUES (NEW.id, v_invite.company_id, v_invite_role, true)
    ON CONFLICT DO NOTHING;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='team_invites' AND column_name='updated_at'
    ) INTO has_updated_at;

    IF has_updated_at THEN
      UPDATE public.team_invites SET status='accepted', updated_at=now() WHERE id=v_invite.id;
    ELSE
      UPDATE public.team_invites SET status='accepted' WHERE id=v_invite.id;
    END IF;
    RETURN NEW;
  END IF;

  INSERT INTO public.buyer_companies (id, company_name)
  VALUES (
    gen_random_uuid(),
    split_part(COALESCE(v_user_email,'user'),'@',1)||'_company_'||substr(gen_random_uuid()::text,1,6)
  )
  RETURNING id INTO v_company_id;

  INSERT INTO public.buyer_company_members (user_id, company_id, role, is_active)
  VALUES (NEW.id, v_company_id, 'buyer_manager', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS auto_provision_trigger ON public.profiles;
CREATE TRIGGER auto_provision_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_provision_buyer_company();


-- 5️⃣ Backfill missing profiles (membership handled by trigger)
DO $$
DECLARE
  u RECORD;
  v_email text;
  v_phone text;
  v_name text;
  v_company text;
  v_id_short text;
BEGIN
  FOR u IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL AND au.email IS NOT NULL
  LOOP
    v_id_short := substr(u.id::text, 1, 8);
    v_email := COALESCE(NULLIF(u.email,''), 'user-'||v_id_short||'@placeholder.local');
    v_phone := COALESCE(NULLIF(u.raw_user_meta_data->>'phone',''), 'pending-'||v_id_short);
    v_name := COALESCE(
      NULLIF(u.raw_user_meta_data->>'contact_person',''),
      NULLIF(u.raw_user_meta_data->>'full_name',''),
      split_part(v_email,'@',1)
    );
    v_company := COALESCE(NULLIF(u.raw_user_meta_data->>'company_name',''), split_part(v_email,'@',1));

    BEGIN
      INSERT INTO public.profiles (id, email, company_name, contact_person, phone)
      VALUES (u.id, v_email, v_company, v_name, v_phone)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN unique_violation THEN
      INSERT INTO public.profiles (id, email, company_name, contact_person, phone)
      VALUES (u.id, 'user-'||v_id_short||'@placeholder.local', v_company||' ('||v_id_short||')', v_name, 'pending-'||v_id_short)
      ON CONFLICT (id) DO NOTHING;
    END;
  END LOOP;
END $$;


-- 6️⃣ Backfill membership for users with profile but no company
DO $$
DECLARE
  u RECORD;
  v_invite record;
  v_company_id uuid;
  v_role text;
BEGIN
  FOR u IN
    SELECT p.id, p.email
    FROM public.profiles p
    LEFT JOIN public.buyer_company_members bcm ON bcm.user_id = p.id
    WHERE bcm.user_id IS NULL AND p.email IS NOT NULL
  LOOP
    SELECT * INTO v_invite
    FROM public.team_invites
    WHERE lower(btrim(email))=lower(btrim(u.email)) AND status='pending'
    ORDER BY created_at DESC LIMIT 1;

    IF FOUND THEN
      v_role := CASE
        WHEN v_invite.role IN ('buyer_purchaser','buyer_cfo','buyer_ceo','buyer_hr','buyer_manager') THEN v_invite.role
        WHEN v_invite.role IN ('purchaser','buyer') THEN 'buyer_purchaser'
        WHEN v_invite.role IN ('purchase_head','buyer_purchase_head','vp','buyer_director','buyer_vp','buyer_admin') THEN 'buyer_manager'
        ELSE 'buyer_purchaser'
      END;
      v_company_id := v_invite.company_id;
      UPDATE public.team_invites SET status='accepted'
      WHERE lower(btrim(email))=lower(btrim(u.email)) AND status='pending';
    ELSE
      INSERT INTO public.buyer_companies (id, company_name)
      VALUES (gen_random_uuid(), split_part(u.email,'@',1)||'_company_'||substr(gen_random_uuid()::text,1,6))
      RETURNING id INTO v_company_id;
      v_role := 'buyer_manager';
    END IF;

    INSERT INTO public.buyer_company_members (user_id, company_id, role, is_active)
    VALUES (u.id, v_company_id, v_role, true)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;


-- 7️⃣ Clean orphan companies
DELETE FROM public.buyer_companies bc
WHERE NOT EXISTS (
  SELECT 1 FROM public.buyer_company_members bcm WHERE bcm.company_id = bc.id
);