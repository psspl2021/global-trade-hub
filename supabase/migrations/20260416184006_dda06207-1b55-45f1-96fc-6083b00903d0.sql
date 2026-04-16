-- 1. Add RLS to existing manager_team_mapping (uses manager_id / purchaser_id)
ALTER TABLE public.manager_team_mapping ENABLE ROW LEVEL SECURITY;

-- 2. MULTI COMPANY ACCESS (PORTFOLIO)
CREATE TABLE IF NOT EXISTS public.user_company_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('ceo','cfo','manager','hr','purchaser')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id, role)
);

CREATE INDEX IF NOT EXISTS idx_uca_user ON public.user_company_access(user_id);
CREATE INDEX IF NOT EXISTS idx_uca_company ON public.user_company_access(company_id);

ALTER TABLE public.user_company_access ENABLE ROW LEVEL SECURITY;

-- Helper: does this user hold one of these roles in this company?
CREATE OR REPLACE FUNCTION public.user_has_company_role(_user_id uuid, _company_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_company_access
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = ANY(_roles)
  );
$$;

-- RLS: user_company_access
DROP POLICY IF EXISTS "uca_self_select" ON public.user_company_access;
CREATE POLICY "uca_self_select"
ON public.user_company_access
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.user_has_company_role(auth.uid(), company_id, ARRAY['ceo','cfo'])
);

DROP POLICY IF EXISTS "uca_admin_manage" ON public.user_company_access;
CREATE POLICY "uca_admin_manage"
ON public.user_company_access
FOR ALL
TO authenticated
USING (public.user_has_company_role(auth.uid(), company_id, ARRAY['ceo','cfo']))
WITH CHECK (public.user_has_company_role(auth.uid(), company_id, ARRAY['ceo','cfo']));

-- RLS: manager_team_mapping (existing columns: manager_id, purchaser_id, company_id)
DROP POLICY IF EXISTS "mtm_self_select" ON public.manager_team_mapping;
CREATE POLICY "mtm_self_select"
ON public.manager_team_mapping
FOR SELECT
TO authenticated
USING (
  manager_id = auth.uid()
  OR purchaser_id = auth.uid()
  OR public.user_has_company_role(auth.uid(), company_id, ARRAY['ceo','cfo','hr'])
);

DROP POLICY IF EXISTS "mtm_manager_manage" ON public.manager_team_mapping;
CREATE POLICY "mtm_manager_manage"
ON public.manager_team_mapping
FOR ALL
TO authenticated
USING (
  manager_id = auth.uid()
  OR public.user_has_company_role(auth.uid(), company_id, ARRAY['ceo','cfo'])
)
WITH CHECK (
  (manager_id = auth.uid()
    AND public.user_has_company_role(auth.uid(), company_id, ARRAY['manager']))
  OR public.user_has_company_role(auth.uid(), company_id, ARRAY['ceo','cfo'])
);

-- 3. UNIFIED INTELLIGENCE RPC (auto role resolution)
CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_company_ids uuid[];
  v_scope_users uuid[];
BEGIN
  -- 1. ROLE AUTO RESOLUTION (highest-privilege role wins)
  SELECT role INTO v_role
  FROM public.user_company_access
  WHERE user_id = p_user_id
  ORDER BY CASE role
    WHEN 'ceo' THEN 1
    WHEN 'cfo' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'hr' THEN 4
    WHEN 'purchaser' THEN 5
    ELSE 99
  END
  LIMIT 1;

  -- 2. COMPANY SCOPE (PORTFOLIO SUPPORT)
  SELECT ARRAY_AGG(DISTINCT company_id) INTO v_company_ids
  FROM public.user_company_access
  WHERE user_id = p_user_id;

  -- 3. USER SCOPE BASED ON ROLE
  IF v_role IN ('ceo','cfo') THEN
    v_scope_users := NULL; -- full access
  ELSIF v_role = 'manager' THEN
    SELECT ARRAY_AGG(DISTINCT purchaser_id) INTO v_scope_users
    FROM public.manager_team_mapping
    WHERE manager_id = p_user_id;
  ELSIF v_role = 'purchaser' THEN
    v_scope_users := ARRAY[p_user_id];
  ELSE
    v_scope_users := ARRAY[]::uuid[];
  END IF;

  -- 4. RETURN ROLE + SAFE-DEFAULT PAYLOAD
  RETURN jsonb_build_object(
    'role', v_role,
    'company_ids', COALESCE(v_company_ids, ARRAY[]::uuid[]),
    'scope_users', v_scope_users,
    'summary', jsonb_build_object(
      'total_payable', 0,
      'overdue', 0,
      'payable_7d', 0,
      'burn_30d', 0
    ),
    'kpis', jsonb_build_array(),
    'alerts', jsonb_build_array(),
    'actions', jsonb_build_array()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_intelligence_v2(uuid) TO authenticated;