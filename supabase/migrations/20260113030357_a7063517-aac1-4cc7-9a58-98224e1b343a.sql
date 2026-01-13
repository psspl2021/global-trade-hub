-- Function to promote next waitlisted affiliate
CREATE OR REPLACE FUNCTION public.promote_next_waitlisted_affiliate()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Trigger function to auto-promote on deactivation
CREATE OR REPLACE FUNCTION public.handle_affiliate_deactivation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'ACTIVE'
     AND NEW.status IN ('SUSPENDED', 'REJECTED') THEN
    PERFORM public.promote_next_waitlisted_affiliate();
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_affiliate_deactivation ON public.affiliates;
CREATE TRIGGER trg_affiliate_deactivation
AFTER UPDATE OF status ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.handle_affiliate_deactivation();

-- Add constraint to prevent direct ACTIVE updates without activated_at
ALTER TABLE public.affiliates
DROP CONSTRAINT IF EXISTS no_direct_active_update;

ALTER TABLE public.affiliates
ADD CONSTRAINT no_direct_active_update
CHECK (
  status != 'ACTIVE'
  OR activated_at IS NOT NULL
);