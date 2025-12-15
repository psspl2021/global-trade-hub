-- Fix the handle_new_user function to use ON CONFLICT for subscriptions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, contact_person, email, phone, referred_by_name, referred_by_phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'contact_person', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'referred_by_name',
    NEW.raw_user_meta_data->>'referred_by_phone'
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'buyer'));
  
  -- If supplier or logistics_partner, create subscription with ON CONFLICT to avoid duplicate key errors
  -- The check_early_adopter_subscription trigger may have already created one
  IF (NEW.raw_user_meta_data->>'role') IN ('supplier', 'logistics_partner') THEN
    INSERT INTO public.subscriptions (user_id, tier, bids_limit)
    VALUES (NEW.id, 'free', 5)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;