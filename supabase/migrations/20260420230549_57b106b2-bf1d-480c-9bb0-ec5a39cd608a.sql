CREATE OR REPLACE FUNCTION public.sync_profile_to_buyer_suppliers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone_digits text := regexp_replace(coalesce(NEW.phone, ''), '\D', '', 'g');
  v_company text := lower(trim(coalesce(NEW.company_name, '')));
  v_gstin text := upper(trim(coalesce(NEW.gstin, '')));
  v_email text := lower(trim(coalesce(NEW.email, '')));
  v_categories text := NULLIF(array_to_string(coalesce(NEW.supplier_categories, ARRAY[]::text[]), ', '), '');
BEGIN
  UPDATE public.buyer_suppliers bs
     SET is_onboarded = TRUE,
         category = COALESCE(v_categories, bs.category),
         updated_at = now()
   WHERE (
          (v_email <> '' AND lower(bs.email) = v_email)
       OR (length(v_phone_digits) >= 7
           AND regexp_replace(coalesce(bs.phone, ''), '\D', '', 'g') = v_phone_digits)
       OR (v_gstin <> '' AND upper(trim(coalesce(bs.gstin, ''))) = v_gstin)
       OR (v_company <> '' AND (
              lower(trim(coalesce(bs.company_name, ''))) = v_company
           OR lower(trim(coalesce(bs.supplier_name, ''))) = v_company
          ))
     )
     AND (bs.is_onboarded = FALSE OR v_categories IS NOT NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_sync_buyer_suppliers ON public.profiles;
CREATE TRIGGER trg_profile_sync_buyer_suppliers
AFTER INSERT OR UPDATE OF email, phone, gstin, company_name, supplier_categories ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_buyer_suppliers();

-- Backfill categories for existing matches
UPDATE public.buyer_suppliers bs
   SET category = array_to_string(p.supplier_categories, ', '),
       updated_at = now()
  FROM public.profiles p
 WHERE p.supplier_categories IS NOT NULL
   AND array_length(p.supplier_categories, 1) > 0
   AND (
        (coalesce(p.email,'') <> '' AND lower(bs.email) = lower(p.email))
     OR (length(regexp_replace(coalesce(p.phone,''), '\D', '', 'g')) >= 7
         AND regexp_replace(coalesce(bs.phone,''), '\D', '', 'g')
           = regexp_replace(coalesce(p.phone,''), '\D', '', 'g'))
     OR (coalesce(p.gstin,'') <> ''
         AND upper(trim(coalesce(bs.gstin,''))) = upper(trim(p.gstin)))
     OR (coalesce(p.company_name,'') <> '' AND (
            lower(trim(coalesce(bs.company_name,''))) = lower(trim(p.company_name))
         OR lower(trim(coalesce(bs.supplier_name,''))) = lower(trim(p.company_name))
        ))
   );