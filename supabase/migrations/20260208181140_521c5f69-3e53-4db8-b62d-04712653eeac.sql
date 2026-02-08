-- ============================================================
-- AUTO-PROVISION BUYER COMPANY ON FIRST LOGIN
-- ============================================================

-- Function to auto-create buyer company when a buyer first logs in
-- This ensures the dropdowns are visible immediately without manual DB seeding
CREATE OR REPLACE FUNCTION public.auto_provision_buyer_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_profile_record record;
  v_user_role text;
BEGIN
  -- Get the user's role from user_roles table
  SELECT role::text INTO v_user_role
  FROM public.user_roles
  WHERE user_id = NEW.id
  LIMIT 1;

  -- Only process buyer roles
  IF v_user_role IS NULL OR NOT (
    v_user_role LIKE 'buyer%' OR 
    v_user_role IN ('purchaser', 'cfo', 'ceo', 'manager', 'hr')
  ) THEN
    RETURN NEW;
  END IF;

  -- Check if user already has a company membership
  IF EXISTS (
    SELECT 1 FROM public.buyer_company_members 
    WHERE user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Get profile info for company creation
  SELECT company_name, contact_person, city, state, country, gstin
  INTO v_profile_record
  FROM public.profiles
  WHERE id = NEW.id;

  -- Create a new buyer company based on profile
  INSERT INTO public.buyer_companies (
    company_name,
    city,
    state,
    country,
    gstin
  ) VALUES (
    COALESCE(v_profile_record.company_name, 'My Company'),
    v_profile_record.city,
    v_profile_record.state,
    v_profile_record.country,
    v_profile_record.gstin
  )
  RETURNING id INTO v_company_id;

  -- Map the user as a company member with appropriate role
  INSERT INTO public.buyer_company_members (
    company_id,
    user_id,
    role,
    assigned_categories,
    is_active
  ) VALUES (
    v_company_id,
    NEW.id,
    CASE 
      WHEN v_user_role IN ('buyer_cfo', 'cfo') THEN 'cfo'
      WHEN v_user_role IN ('buyer_ceo', 'ceo') THEN 'ceo'
      WHEN v_user_role IN ('buyer_hr', 'hr') THEN 'hr'
      WHEN v_user_role IN ('buyer_manager', 'manager') THEN 'manager'
      ELSE 'purchaser'
    END,
    ARRAY[]::text[],
    true
  );

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_provision_buyer_company ON public.profiles;

-- Trigger on profile update/insert (fires after user completes profile)
CREATE TRIGGER trigger_auto_provision_buyer_company
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_provision_buyer_company();

-- ============================================================
-- FUNCTION TO ENSURE BUYER COMPANY EXISTS (callable)
-- ============================================================
-- This can be called explicitly to ensure a buyer has a company
CREATE OR REPLACE FUNCTION public.ensure_buyer_company(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_member_id uuid;
  v_profile_record record;
  v_user_role text;
  v_result json;
BEGIN
  -- Get the user's role
  SELECT role::text INTO v_user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;

  -- Check if already has company membership
  SELECT bcm.id, bcm.company_id INTO v_member_id, v_company_id
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = _user_id
  LIMIT 1;

  IF v_member_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'company_id', v_company_id,
      'member_id', v_member_id,
      'created', false
    );
  END IF;

  -- Get profile info
  SELECT company_name, contact_person, city, state, country, gstin
  INTO v_profile_record
  FROM public.profiles
  WHERE id = _user_id;

  -- Create company
  INSERT INTO public.buyer_companies (
    company_name,
    city,
    state,
    country,
    gstin
  ) VALUES (
    COALESCE(v_profile_record.company_name, 'My Company'),
    v_profile_record.city,
    v_profile_record.state,
    v_profile_record.country,
    v_profile_record.gstin
  )
  RETURNING id INTO v_company_id;

  -- Create membership
  INSERT INTO public.buyer_company_members (
    company_id,
    user_id,
    role,
    assigned_categories,
    is_active
  ) VALUES (
    v_company_id,
    _user_id,
    CASE 
      WHEN v_user_role IN ('buyer_cfo', 'cfo') THEN 'cfo'
      WHEN v_user_role IN ('buyer_ceo', 'ceo') THEN 'ceo'
      WHEN v_user_role IN ('buyer_hr', 'hr') THEN 'hr'
      WHEN v_user_role IN ('buyer_manager', 'manager') THEN 'manager'
      ELSE 'purchaser'
    END,
    ARRAY[]::text[],
    true
  )
  RETURNING id INTO v_member_id;

  RETURN json_build_object(
    'success', true,
    'company_id', v_company_id,
    'member_id', v_member_id,
    'created', true
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_buyer_company(uuid) TO authenticated;