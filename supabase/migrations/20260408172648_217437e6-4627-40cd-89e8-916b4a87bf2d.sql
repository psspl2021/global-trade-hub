CREATE OR REPLACE FUNCTION public.sync_supplier_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.supplier_email IS NOT NULL THEN
    IF NEW.supplier_id IS NULL THEN
      SELECT id, company_name
      INTO NEW.supplier_id, NEW.supplier_company_name
      FROM public.profiles
      WHERE lower(email) = lower(NEW.supplier_email)
      LIMIT 1;
    ELSIF NEW.supplier_company_name IS NULL THEN
      SELECT company_name
      INTO NEW.supplier_company_name
      FROM public.profiles
      WHERE id = NEW.supplier_id
      LIMIT 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;