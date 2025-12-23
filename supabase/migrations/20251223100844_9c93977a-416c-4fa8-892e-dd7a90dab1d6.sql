-- Update handle_new_user function to handle edge cases better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_email TEXT;
  v_role app_role;
BEGIN
  -- Get phone with fallback
  v_phone := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''), NEW.id::TEXT || '_nophone');
  v_email := NEW.email;
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'buyer');
  
  -- Check if profile already exists (handles race conditions)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Insert profile with conflict handling
  INSERT INTO public.profiles (id, company_name, contact_person, email, phone, referred_by_name, referred_by_phone, logistics_partner_type, address, gstin)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''), 'Company'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'contact_person'), ''), 'Contact'),
    v_email,
    v_phone,
    NEW.raw_user_meta_data->>'referred_by_name',
    NEW.raw_user_meta_data->>'referred_by_phone',
    (NEW.raw_user_meta_data->>'logistics_partner_type')::logistics_partner_type,
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'gstin'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Check if user role already exists
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role);
  END IF;
  
  -- If supplier or logistics_partner, create subscription
  IF v_role IN ('supplier', 'logistics_partner') THEN
    INSERT INTO public.subscriptions (user_id, tier, bids_limit)
    VALUES (NEW.id, 'free', 5)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;