-- ============================================================
-- FINAL GOVERNANCE & BILLING LOCK - PART 2: TABLES & FUNCTIONS
-- ============================================================

-- Step 1: Create purchaser_rewards_settings table if not exists (for kill switch)
CREATE TABLE IF NOT EXISTS public.purchaser_rewards_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rewards_enabled BOOLEAN NOT NULL DEFAULT true,
  paused_reason TEXT,
  paused_by UUID REFERENCES auth.users(id),
  paused_at TIMESTAMPTZ,
  compliance_tier VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings if table is empty
INSERT INTO public.purchaser_rewards_settings (rewards_enabled, compliance_tier)
SELECT true, 'enterprise'
WHERE NOT EXISTS (SELECT 1 FROM public.purchaser_rewards_settings);

-- Enable RLS on purchaser_rewards_settings
ALTER TABLE public.purchaser_rewards_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can manage rewards settings" ON public.purchaser_rewards_settings;
DROP POLICY IF EXISTS "Authorized users can read rewards settings" ON public.purchaser_rewards_settings;

-- Allow only ps_admin to update rewards settings
CREATE POLICY "Admin can manage rewards settings"
ON public.purchaser_rewards_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ps_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ps_admin'));

-- Allow authorized roles to read settings
CREATE POLICY "Authorized users can read rewards settings"
ON public.purchaser_rewards_settings
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'buyer') OR
  public.has_role(auth.uid(), 'purchaser') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'cfo') OR
  public.has_role(auth.uid(), 'ceo') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'ps_admin')
);

-- Step 2: Create purchaser_rewards_access_log if not exists
CREATE TABLE IF NOT EXISTS public.purchaser_rewards_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchaser_rewards_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert own access logs" ON public.purchaser_rewards_access_log;
CREATE POLICY "Insert own access logs"
ON public.purchaser_rewards_access_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can read all logs" ON public.purchaser_rewards_access_log;
CREATE POLICY "Admin can read all logs"
ON public.purchaser_rewards_access_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ps_admin'));

-- Step 3: Add CFO confirmation tracking to incentive declarations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchaser_incentive_declarations' 
    AND column_name = 'cfo_ethics_confirmed'
  ) THEN
    ALTER TABLE public.purchaser_incentive_declarations 
    ADD COLUMN cfo_ethics_confirmed BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchaser_incentive_declarations' 
    AND column_name = 'cfo_confirmation_text'
  ) THEN
    ALTER TABLE public.purchaser_incentive_declarations 
    ADD COLUMN cfo_confirmation_text TEXT DEFAULT 'I confirm this incentive is funded from internal corporate budgets and complies with our HR/Ethics policy.';
  END IF;
END $$;

-- Step 4: Create helper function for governance access control
CREATE OR REPLACE FUNCTION public.check_governance_access(p_user_id UUID)
RETURNS TABLE (
  can_view_purchaser_dashboard BOOLEAN,
  can_view_management_dashboard BOOLEAN,
  can_edit_incentives BOOLEAN,
  can_toggle_rewards BOOLEAN,
  is_read_only BOOLEAN,
  primary_role TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles TEXT[];
  v_primary_role TEXT;
  v_is_supplier BOOLEAN := false;
  v_is_external BOOLEAN := false;
  v_is_purchaser BOOLEAN := false;
  v_is_manager BOOLEAN := false;
  v_is_cfo BOOLEAN := false;
  v_is_ceo BOOLEAN := false;
  v_is_ps_admin BOOLEAN := false;
  v_is_buyer BOOLEAN := false;
BEGIN
  -- Get all roles for user
  SELECT array_agg(role::TEXT) INTO v_roles
  FROM public.user_roles
  WHERE user_id = p_user_id;

  -- Check each role
  v_is_supplier := 'supplier' = ANY(v_roles);
  v_is_external := 'external_guest' = ANY(v_roles);
  v_is_purchaser := 'purchaser' = ANY(v_roles);
  v_is_manager := 'manager' = ANY(v_roles);
  v_is_cfo := 'cfo' = ANY(v_roles);
  v_is_ceo := 'ceo' = ANY(v_roles);
  v_is_ps_admin := 'ps_admin' = ANY(v_roles) OR 'admin' = ANY(v_roles);
  v_is_buyer := 'buyer' = ANY(v_roles);

  -- Determine primary role (priority order)
  IF v_is_ceo THEN v_primary_role := 'ceo';
  ELSIF v_is_cfo THEN v_primary_role := 'cfo';
  ELSIF v_is_manager THEN v_primary_role := 'manager';
  ELSIF v_is_ps_admin THEN v_primary_role := 'ps_admin';
  ELSIF v_is_purchaser THEN v_primary_role := 'purchaser';
  ELSIF v_is_buyer THEN v_primary_role := 'buyer';
  ELSIF v_is_supplier THEN v_primary_role := 'supplier';
  ELSIF v_is_external THEN v_primary_role := 'external_guest';
  ELSE v_primary_role := 'unknown';
  END IF;

  RETURN QUERY SELECT
    -- can_view_purchaser_dashboard: NOT for supplier or external
    NOT (v_is_supplier OR v_is_external) AS can_view_purchaser_dashboard,
    -- can_view_management_dashboard: ONLY for cfo, ceo, manager
    (v_is_cfo OR v_is_ceo OR v_is_manager) AS can_view_management_dashboard,
    -- can_edit_incentives: ONLY cfo/ceo (manager can view but not edit)
    (v_is_cfo OR v_is_ceo) AS can_edit_incentives,
    -- can_toggle_rewards: ONLY ps_admin
    v_is_ps_admin AS can_toggle_rewards,
    -- is_read_only: purchasers and ps_admin are read-only
    (v_is_purchaser OR v_is_ps_admin) AS is_read_only,
    -- primary_role
    v_primary_role AS primary_role;
END;
$$;

-- Step 5: Create function to get default landing route based on role
CREATE OR REPLACE FUNCTION public.get_default_landing_route(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access RECORD;
BEGIN
  SELECT * INTO v_access FROM public.check_governance_access(p_user_id);
  
  IF v_access.primary_role IN ('cfo', 'ceo', 'manager') THEN
    RETURN '/management-dashboard';
  ELSIF v_access.primary_role IN ('purchaser', 'buyer') THEN
    RETURN '/purchaser-dashboard';
  ELSIF v_access.primary_role = 'ps_admin' THEN
    RETURN '/admin/audit';
  ELSIF v_access.primary_role = 'supplier' THEN
    RETURN '/supplier-dashboard';
  ELSE
    RETURN '/';
  END IF;
END;
$$;

-- Step 6: Update can_access_purchaser_rewards to use new roles
CREATE OR REPLACE FUNCTION public.can_access_purchaser_rewards(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access RECORD;
BEGIN
  SELECT * INTO v_access FROM public.check_governance_access(p_user_id);
  RETURN v_access.can_view_purchaser_dashboard;
END;
$$;