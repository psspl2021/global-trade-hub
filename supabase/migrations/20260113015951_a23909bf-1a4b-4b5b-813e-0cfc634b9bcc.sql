-- Fix function search path for handle_affiliate_status_change
CREATE OR REPLACE FUNCTION public.handle_affiliate_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If an active affiliate is deactivated, promote next in queue
  IF OLD.status = 'ACTIVE' AND NEW.status != 'ACTIVE' THEN
    PERFORM public.promote_next_affiliate();
  END IF;

  RETURN NEW;
END;
$$;