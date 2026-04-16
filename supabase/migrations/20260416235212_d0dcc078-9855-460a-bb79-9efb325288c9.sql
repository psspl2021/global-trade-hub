-- Prevent a user from being a member of more than one buyer company.
-- This is the structural guarantee that independent buyers cannot be
-- silently absorbed into another organization.

CREATE OR REPLACE FUNCTION public.enforce_single_buyer_company_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_company_id uuid;
BEGIN
  -- Only enforce on INSERT or when company_id changes on UPDATE
  IF TG_OP = 'UPDATE' AND NEW.company_id = OLD.company_id THEN
    RETURN NEW;
  END IF;

  SELECT company_id INTO v_existing_company_id
  FROM public.buyer_company_members
  WHERE user_id = NEW.user_id
    AND company_id <> NEW.company_id
  LIMIT 1;

  IF v_existing_company_id IS NOT NULL THEN
    RAISE EXCEPTION
      'User % already belongs to buyer company %. A user cannot be a member of more than one buyer company. Use the support flow to transfer organizations.',
      NEW.user_id, v_existing_company_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_buyer_company_membership ON public.buyer_company_members;

CREATE TRIGGER trg_enforce_single_buyer_company_membership
BEFORE INSERT OR UPDATE OF company_id, user_id
ON public.buyer_company_members
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_buyer_company_membership();