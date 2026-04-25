-- ============================================================
-- PART 1: Backfill missing user_roles for existing 78 members
-- ============================================================
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT m.user_id, m.role::text::app_role
FROM public.buyer_company_members m
LEFT JOIN public.user_roles r
  ON r.user_id = m.user_id
 AND r.role::text = m.role::text
WHERE r.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- PART 2: Auto-sync trigger — buyer_company_members → user_roles
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_buyer_member_role_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role::text::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Role changed: remove old, add new
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      DELETE FROM public.user_roles
      WHERE user_id = OLD.user_id
        AND role::text = OLD.role::text;

      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, NEW.role::text::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    -- User reassigned (rare): clean up old user_id
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      DELETE FROM public.user_roles
      WHERE user_id = OLD.user_id
        AND role::text = OLD.role::text;

      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, NEW.role::text::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

  ELSIF (TG_OP = 'DELETE') THEN
    -- Only drop the matching role (not other roles user may have)
    DELETE FROM public.user_roles
    WHERE user_id = OLD.user_id
      AND role::text = OLD.role::text;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_buyer_member_role ON public.buyer_company_members;

CREATE TRIGGER trg_sync_buyer_member_role
AFTER INSERT OR UPDATE OR DELETE ON public.buyer_company_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_buyer_member_role_to_user_roles();