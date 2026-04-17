-- =========================================================
-- Phase 1: Capabilities + Audit Foundation
-- =========================================================

-- 1.1 role_capabilities table
CREATE TABLE IF NOT EXISTS public.role_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  capability text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, capability)
);

ALTER TABLE public.role_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_capabilities readable by authenticated"
  ON public.role_capabilities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "role_capabilities admin write"
  ON public.role_capabilities FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 1.2 Seed CEO capabilities
INSERT INTO public.role_capabilities (role, capability) VALUES
  ('ceo', 'can_view_all_auctions'),
  ('ceo', 'can_view_all_quotes'),
  ('ceo', 'can_override_po_approval'),
  ('ceo', 'can_view_full_supplier_identity'),
  ('ceo', 'can_view_all_pos'),
  ('cfo', 'can_view_all_pos'),
  ('cfo', 'can_view_all_quotes'),
  ('manager', 'can_view_all_pos'),
  ('admin', 'can_view_all_auctions'),
  ('admin', 'can_view_all_quotes'),
  ('admin', 'can_override_po_approval'),
  ('admin', 'can_view_full_supplier_identity'),
  ('admin', 'can_view_all_pos')
ON CONFLICT (role, capability) DO NOTHING;

-- 1.3 has_capability RPC (single source of truth)
CREATE OR REPLACE FUNCTION public.has_capability(p_user_id uuid, p_capability text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_company_access uca
    JOIN public.role_capabilities rc
      ON LOWER(rc.role) = LOWER(uca.role)
    WHERE uca.user_id = p_user_id
      AND rc.capability = p_capability
      AND rc.granted = true
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_capabilities rc
      ON LOWER(rc.role) = LOWER(ur.role::text)
    WHERE ur.user_id = p_user_id
      AND rc.capability = p_capability
      AND rc.granted = true
  );
$$;

-- Helper to read all capabilities for caller
CREATE OR REPLACE FUNCTION public.get_my_capabilities()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT rc.capability), ARRAY[]::text[])
  FROM public.role_capabilities rc
  WHERE rc.granted = true
    AND (
      LOWER(rc.role) IN (
        SELECT LOWER(role) FROM public.user_company_access WHERE user_id = auth.uid()
      )
      OR LOWER(rc.role) IN (
        SELECT LOWER(role::text) FROM public.user_roles WHERE user_id = auth.uid()
      )
    );
$$;

-- 1.4 governance_audit_log
CREATE TABLE IF NOT EXISTS public.governance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_role text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gov_audit_actor ON public.governance_audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_audit_entity ON public.governance_audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_audit_action ON public.governance_audit_log (action, created_at DESC);

ALTER TABLE public.governance_audit_log ENABLE ROW LEVEL SECURITY;

-- Self-read + admin-read; no direct INSERT/UPDATE/DELETE for any user
CREATE POLICY "gov_audit self read"
  ON public.governance_audit_log FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

CREATE POLICY "gov_audit admin read all"
  ON public.governance_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No INSERT policy → only SECURITY DEFINER function can write

-- 1.5 log_governance_action wrapper
CREATE OR REPLACE FUNCTION public.log_governance_action(
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_role text;
  v_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'log_governance_action: no authenticated actor';
  END IF;

  SELECT LOWER(role) INTO v_role
  FROM public.user_company_access
  WHERE user_id = v_actor
  LIMIT 1;

  IF v_role IS NULL THEN
    SELECT LOWER(role::text) INTO v_role
    FROM public.user_roles
    WHERE user_id = v_actor
    LIMIT 1;
  END IF;

  INSERT INTO public.governance_audit_log
    (actor_id, actor_role, action, entity_type, entity_id, reason, metadata)
  VALUES
    (v_actor, v_role, p_action, p_entity_type, p_entity_id, p_reason, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- updated_at trigger for role_capabilities
CREATE OR REPLACE FUNCTION public.touch_role_capabilities()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_role_capabilities_touch ON public.role_capabilities;
CREATE TRIGGER trg_role_capabilities_touch
BEFORE UPDATE ON public.role_capabilities
FOR EACH ROW EXECUTE FUNCTION public.touch_role_capabilities();