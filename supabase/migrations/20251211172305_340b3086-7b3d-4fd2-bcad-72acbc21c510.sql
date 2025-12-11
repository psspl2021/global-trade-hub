-- Update handle_new_user function to include referred_by fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- If supplier, create subscription
  IF (NEW.raw_user_meta_data->>'role') = 'supplier' THEN
    INSERT INTO public.subscriptions (user_id, tier, bids_limit)
    VALUES (NEW.id, 'free', 5);
  END IF;
  
  RETURN NEW;
END;
$function$;