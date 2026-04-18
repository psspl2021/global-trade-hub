-- Update handle_new_user to inherit company_name from team_invites for invited members.
-- This prevents the placeholder 'Company' value that triggers the ProfileCompletionModal.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_phone TEXT;
  v_email TEXT;
  v_role app_role;
  v_logistics_type logistics_partner_type;
  v_location TEXT;
  v_invite_company_name TEXT;
  v_invite_city TEXT;
  v_invite_state TEXT;
  v_invite_country TEXT;
  v_invite_address TEXT;
  v_invite_gstin TEXT;
  v_company_name TEXT;
BEGIN
  v_phone := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''), NEW.id::TEXT || '_nophone');
  v_email := NEW.email;

  BEGIN
    v_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '')::app_role, 'buyer');
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'buyer';
  END;

  BEGIN
    v_logistics_type := NULLIF(TRIM(NEW.raw_user_meta_data->>'logistics_partner_type'), '')::logistics_partner_type;
  EXCEPTION WHEN invalid_text_representation THEN
    v_logistics_type := NULL;
  END;

  v_location := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'location'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'address'), '')
  );

  -- Look up invite to inherit company details (so invitees skip the profile completion modal)
  SELECT
    bc.company_name,
    bc.city,
    bc.state,
    bc.country,
    bc.address,
    bc.gstin
  INTO
    v_invite_company_name,
    v_invite_city,
    v_invite_state,
    v_invite_country,
    v_invite_address,
    v_invite_gstin
  FROM public.team_invites ti
  JOIN public.buyer_companies bc ON bc.id = ti.company_id
  WHERE lower(ti.email) = lower(v_email)
    AND ti.status IN ('pending', 'accepted')
    AND ti.company_id IS NOT NULL
  ORDER BY ti.created_at DESC
  LIMIT 1;

  -- Prefer invite company name, then user metadata, then fallback
  v_company_name := COALESCE(
    v_invite_company_name,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''),
    'Company'
  );

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, company_name, contact_person, email, phone, referred_by_name, referred_by_phone, logistics_partner_type, address, gstin, city, state)
  VALUES (
    NEW.id,
    v_company_name,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'contact_person'), ''), 'Contact'),
    v_email,
    v_phone,
    NEW.raw_user_meta_data->>'referred_by_name',
    NEW.raw_user_meta_data->>'referred_by_phone',
    v_logistics_type,
    COALESCE(v_location, v_invite_address),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'gstin'), ''), v_invite_gstin),
    v_invite_city,
    v_invite_state
  )
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role);
  END IF;

  IF v_role IN ('supplier', 'logistics_partner') THEN
    INSERT INTO public.subscriptions (user_id, tier, bids_limit)
    VALUES (NEW.id, 'free', 5)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  BEGIN
    INSERT INTO public.profiles (id, company_name, contact_person, email, phone, referred_by_name, referred_by_phone, logistics_partner_type, address, gstin)
    VALUES (
      NEW.id,
      v_company_name,
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'contact_person'), ''), 'Contact'),
      v_email,
      NEW.id::TEXT || '_dup',
      NEW.raw_user_meta_data->>'referred_by_name',
      NEW.raw_user_meta_data->>'referred_by_phone',
      v_logistics_type,
      v_location,
      NULLIF(TRIM(NEW.raw_user_meta_data->>'gstin'), '')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, v_role);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  IF v_role IN ('supplier', 'logistics_partner') THEN
    BEGIN
      INSERT INTO public.subscriptions (user_id, tier, bids_limit)
      VALUES (NEW.id, 'free', 5)
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill: fix already-affected invited users whose profile shows placeholder 'Company'
UPDATE public.profiles p
SET 
  company_name = bc.company_name,
  city = COALESCE(NULLIF(TRIM(p.city), ''), bc.city),
  state = COALESCE(NULLIF(TRIM(p.state), ''), bc.state),
  address = COALESCE(NULLIF(TRIM(p.address), ''), bc.address),
  gstin = COALESCE(NULLIF(TRIM(p.gstin), ''), bc.gstin)
FROM public.buyer_company_members bcm
JOIN public.buyer_companies bc ON bc.id = bcm.company_id
WHERE bcm.user_id = p.id
  AND bcm.is_active = true
  AND (p.company_name IS NULL OR TRIM(p.company_name) IN ('', 'Company', 'My Company'));

-- Safeguard: prevent duplicate active memberships per user/company
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_buyer_membership
  ON public.buyer_company_members(user_id, company_id)
  WHERE is_active = true;