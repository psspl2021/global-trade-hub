-- Fix auto_expire_requirements to expire at end of day (11:59:59 PM)
CREATE OR REPLACE FUNCTION public.auto_expire_requirements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE requirements
  SET status = 'expired'::requirement_status, updated_at = now()
  WHERE status = 'active'::requirement_status 
    AND (deadline + interval '1 day' - interval '1 second') < now();
END;
$$;

-- Fix check_and_expire_requirement trigger to expire at end of day
CREATE OR REPLACE FUNCTION public.check_and_expire_requirement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If requirement is active but deadline passed (end of day), mark as expired
  IF NEW.status = 'active'::requirement_status AND (NEW.deadline + interval '1 day' - interval '1 second') < now() THEN
    NEW.status := 'expired'::requirement_status;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;