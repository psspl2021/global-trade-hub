-- When a supplier profile is created/updated, auto-mark matching buyer_suppliers entries as onboarded (active)
CREATE OR REPLACE FUNCTION public.sync_profile_to_buyer_suppliers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.buyer_suppliers
       SET is_onboarded = TRUE,
           updated_at = now()
     WHERE lower(email) = lower(NEW.email)
       AND is_onboarded = FALSE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_sync_buyer_suppliers ON public.profiles;
CREATE TRIGGER trg_profile_sync_buyer_suppliers
AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_buyer_suppliers();

-- Backfill: mark already-onboarded existing entries
UPDATE public.buyer_suppliers bs
   SET is_onboarded = TRUE,
       updated_at = now()
  FROM public.profiles p
 WHERE lower(bs.email) = lower(p.email)
   AND bs.is_onboarded = FALSE;