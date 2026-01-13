-- Fix search_path for promote_next_waitlisted_affiliate
CREATE OR REPLACE FUNCTION public.promote_next_waitlisted_affiliate()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_id UUID;
BEGIN
  SELECT id
  INTO v_next_id
  FROM public.affiliates
  WHERE status = 'WAITLISTED'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_next_id IS NOT NULL THEN
    PERFORM public.activate_affiliate_fifo(v_next_id);
  END IF;
END;
$$;

-- Fix search_path for handle_affiliate_deactivation
CREATE OR REPLACE FUNCTION public.handle_affiliate_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'ACTIVE'
     AND NEW.status IN ('SUSPENDED', 'REJECTED') THEN
    PERFORM public.promote_next_waitlisted_affiliate();
  END IF;

  RETURN NEW;
END;
$$;