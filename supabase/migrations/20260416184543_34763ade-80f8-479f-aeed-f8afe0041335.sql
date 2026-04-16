-- Mapping helper: legacy buyer role -> canonical intelligence role
CREATE OR REPLACE FUNCTION public.map_buyer_role_to_intel(_buyer_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(_buyer_role, ''))
    WHEN 'buyer_ceo' THEN 'ceo'
    WHEN 'ceo' THEN 'ceo'
    WHEN 'buyer_cfo' THEN 'cfo'
    WHEN 'cfo' THEN 'cfo'
    WHEN 'buyer_manager' THEN 'manager'
    WHEN 'manager' THEN 'manager'
    WHEN 'procurement_head' THEN 'manager'
    WHEN 'buyer_hr' THEN 'hr'
    WHEN 'hr' THEN 'hr'
    WHEN 'buyer_purchaser' THEN 'purchaser'
    WHEN 'purchaser' THEN 'purchaser'
    WHEN 'admin' THEN 'ceo'
    WHEN 'owner' THEN 'ceo'
    ELSE NULL
  END;
$$;

-- Backfill existing active members
INSERT INTO public.user_company_access (user_id, company_id, role)
SELECT bcm.user_id, bcm.company_id, public.map_buyer_role_to_intel(bcm.role)
FROM public.buyer_company_members bcm
WHERE bcm.is_active = true
  AND public.map_buyer_role_to_intel(bcm.role) IS NOT NULL
ON CONFLICT (user_id, company_id, role) DO NOTHING;

-- Sync trigger
CREATE OR REPLACE FUNCTION public.sync_user_company_access_from_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_role text;
  v_old_role text;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_old_role := public.map_buyer_role_to_intel(OLD.role);
    IF v_old_role IS NOT NULL THEN
      DELETE FROM public.user_company_access
      WHERE user_id = OLD.user_id
        AND company_id = OLD.company_id
        AND role = v_old_role;
    END IF;
    RETURN OLD;
  END IF;

  v_new_role := public.map_buyer_role_to_intel(NEW.role);

  IF (TG_OP = 'UPDATE') THEN
    v_old_role := public.map_buyer_role_to_intel(OLD.role);
    IF v_old_role IS DISTINCT FROM v_new_role AND v_old_role IS NOT NULL THEN
      DELETE FROM public.user_company_access
      WHERE user_id = OLD.user_id
        AND company_id = OLD.company_id
        AND role = v_old_role;
    END IF;
  END IF;

  IF NEW.is_active = true AND v_new_role IS NOT NULL THEN
    INSERT INTO public.user_company_access (user_id, company_id, role)
    VALUES (NEW.user_id, NEW.company_id, v_new_role)
    ON CONFLICT (user_id, company_id, role) DO NOTHING;
  ELSIF NEW.is_active = false AND v_new_role IS NOT NULL THEN
    DELETE FROM public.user_company_access
    WHERE user_id = NEW.user_id
      AND company_id = NEW.company_id
      AND role = v_new_role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_company_access ON public.buyer_company_members;
CREATE TRIGGER trg_sync_user_company_access
AFTER INSERT OR UPDATE OR DELETE ON public.buyer_company_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_company_access_from_member();