-- Helper: returns the active company_ids for a user, bypassing RLS to avoid recursion.
CREATE OR REPLACE FUNCTION public.get_user_company_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company_id
  FROM public.buyer_company_members
  WHERE user_id = p_user_id AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_company_ids(uuid) TO authenticated;

-- Helper: does this user have a management role in the given company?
CREATE OR REPLACE FUNCTION public.is_company_manager(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.buyer_company_members
    WHERE user_id = p_user_id
      AND company_id = p_company_id
      AND is_active = true
      AND role = ANY (ARRAY['buyer_cfo','buyer_ceo','buyer_manager'])
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_company_manager(uuid, uuid) TO authenticated;

-- Drop the recursive / duplicate policies
DROP POLICY IF EXISTS "Members can view company members" ON public.buyer_company_members;
DROP POLICY IF EXISTS "Users can view company members" ON public.buyer_company_members;
DROP POLICY IF EXISTS "CFO/CEO can manage company members" ON public.buyer_company_members;
DROP POLICY IF EXISTS "Management can update members" ON public.buyer_company_members;

-- Recreate non-recursive policies using SECURITY DEFINER helpers
CREATE POLICY "Members can view company members"
ON public.buyer_company_members
FOR SELECT
TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

CREATE POLICY "Management can manage company members"
ON public.buyer_company_members
FOR ALL
TO authenticated
USING (public.is_company_manager(auth.uid(), company_id))
WITH CHECK (public.is_company_manager(auth.uid(), company_id));