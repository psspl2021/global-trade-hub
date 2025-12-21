-- Add 'expired' status to the requirement_status enum
ALTER TYPE requirement_status ADD VALUE IF NOT EXISTS 'expired';

-- Create a function to auto-expire requirements with passed deadlines
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
    AND deadline < now();
END;
$$;

-- Create a trigger function that checks expiry on update
CREATE OR REPLACE FUNCTION public.check_and_expire_requirement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If requirement is active but deadline passed, mark as expired
  IF NEW.status = 'active'::requirement_status AND NEW.deadline < now() THEN
    NEW.status := 'expired'::requirement_status;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger before update to check expiry
DROP TRIGGER IF EXISTS check_requirement_expiry ON requirements;
CREATE TRIGGER check_requirement_expiry
  BEFORE UPDATE ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION check_and_expire_requirement();