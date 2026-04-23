-- Phase 1: Replace auto_provision_buyer_company with invite-first, deterministic logic.
-- Root cause being fixed: fallback "My Company" was created even when a valid pending invite existed,
-- because the previous lookup was case/whitespace sensitive or did not strictly block fallback.

CREATE OR REPLACE FUNCTION public.auto_provision_buyer_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email          text;
  v_invite         record;
  v_invite_exists  boolean;
  v_company_id     uuid;
  v_already_member boolean;
BEGIN
  -- Only act when a profile row first appears with an email; ignore unrelated updates.
  IF NEW.email IS NULL OR btrim(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  v_email := lower(btrim(NEW.email));

  -- Idempotency: if this user is already attached to ANY buyer company, do nothing.
  SELECT EXISTS (
    SELECT 1 FROM public.buyer_company_members WHERE user_id = NEW.id
  ) INTO v_already_member;

  IF v_already_member THEN
    RETURN NEW;
  END IF;

  -- 1) INVITE PATH (case- and whitespace-insensitive)
  SELECT *
    INTO v_invite
  FROM public.team_invites
  WHERE lower(btrim(email)) = v_email
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.buyer_company_members (user_id, company_id, role, is_active, assigned_categories)
    VALUES (
      NEW.id,
      v_invite.company_id,
      COALESCE(v_invite.role, 'buyer_purchaser'),
      true,
      COALESCE(v_invite.categories, ARRAY[]::text[])
    )
    ON CONFLICT (user_id, company_id) DO NOTHING;

    UPDATE public.team_invites
       SET status = 'accepted',
           updated_at = now()
     WHERE id = v_invite.id;

    RETURN NEW;
  END IF;

  -- 2) HARD BLOCK: if ANY pending invite exists for this email, never create a fallback company.
  --    (Defensive — covers race conditions where invite row appears mid-flight.)
  SELECT EXISTS (
    SELECT 1 FROM public.team_invites
    WHERE lower(btrim(email)) = v_email AND status = 'pending'
  ) INTO v_invite_exists;

  IF v_invite_exists THEN
    RETURN NEW;
  END IF;

  -- 3) FALLBACK: independent buyer — create their own company.
  INSERT INTO public.buyer_companies (company_name)
  VALUES (split_part(NEW.email, '@', 1) || '_company')
  RETURNING id INTO v_company_id;

  INSERT INTO public.buyer_company_members (user_id, company_id, role, is_active)
  VALUES (NEW.id, v_company_id, 'buyer_purchaser', true)
  ON CONFLICT (user_id, company_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Cleanup the corrupted state for the affected user so the next login resolves correctly.
-- Scoped strictly to user akpksbk1005@gmail.com — does NOT touch any other "My Company" row.
DO $$
DECLARE
  v_user_id uuid;
  v_bad_company_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'akpksbk1005@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Find the wrongly-attached company (the fallback one, NOT the invite's company)
    SELECT bcm.company_id
      INTO v_bad_company_id
    FROM public.buyer_company_members bcm
    JOIN public.buyer_companies bc ON bc.id = bcm.company_id
    WHERE bcm.user_id = v_user_id
      AND bc.company_name = 'My Company'
    LIMIT 1;

    -- Detach user from the bad company
    DELETE FROM public.buyer_company_members
     WHERE user_id = v_user_id
       AND company_id = v_bad_company_id;

    -- Delete the orphaned fallback company ONLY if no other members remain
    IF v_bad_company_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.buyer_company_members WHERE company_id = v_bad_company_id) THEN
      DELETE FROM public.buyer_companies WHERE id = v_bad_company_id;
    END IF;

    -- Re-attach via the still-pending invite (replays the corrected trigger logic)
    INSERT INTO public.buyer_company_members (user_id, company_id, role, is_active, assigned_categories)
    SELECT v_user_id, ti.company_id, COALESCE(ti.role, 'buyer_purchaser'), true, COALESCE(ti.categories, ARRAY[]::text[])
    FROM public.team_invites ti
    WHERE lower(btrim(ti.email)) = 'akpksbk1005@gmail.com'
      AND ti.status = 'pending'
    ORDER BY ti.created_at DESC
    LIMIT 1
    ON CONFLICT (user_id, company_id) DO NOTHING;

    UPDATE public.team_invites
       SET status = 'accepted', updated_at = now()
     WHERE lower(btrim(email)) = 'akpksbk1005@gmail.com'
       AND status = 'pending';
  END IF;
END $$;