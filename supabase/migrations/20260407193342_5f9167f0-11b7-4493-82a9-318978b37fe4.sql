CREATE OR REPLACE FUNCTION public.get_company_names(user_ids uuid[])
RETURNS TABLE(id uuid, company_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.company_name
  FROM public.profiles p
  WHERE p.id = ANY(user_ids);
$$;