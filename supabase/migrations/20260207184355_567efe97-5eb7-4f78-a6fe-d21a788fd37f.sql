-- ============================================================
-- MIGRATION 2: ADD BUYER DASHBOARD ACCESS FUNCTIONS
-- ============================================================

-- Drop and recreate check_governance_access with updated signature
DROP FUNCTION IF EXISTS public.check_governance_access(uuid);

-- Create function to check buyer management roles
CREATE OR REPLACE FUNCTION public.is_buyer_management(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('buyer_cfo', 'buyer_ceo', 'buyer_manager', 'cfo', 'ceo', 'manager')
  )
$$;

-- Create function to check if user is operational purchaser
CREATE OR REPLACE FUNCTION public.is_buyer_purchaser(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('buyer_purchaser', 'purchaser', 'buyer')
  )
$$;

-- Create function to get buyer dashboard type
CREATE OR REPLACE FUNCTION public.get_buyer_dashboard_type(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role::text INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role::text
      WHEN 'buyer_ceo' THEN 1
      WHEN 'ceo' THEN 1
      WHEN 'buyer_cfo' THEN 2
      WHEN 'cfo' THEN 2
      WHEN 'buyer_manager' THEN 3
      WHEN 'manager' THEN 3
      WHEN 'buyer_purchaser' THEN 4
      WHEN 'purchaser' THEN 4
      WHEN 'buyer' THEN 5
      ELSE 6
    END
  LIMIT 1;

  -- Return dashboard type based on role
  IF user_role IN ('buyer_ceo', 'ceo', 'buyer_cfo', 'cfo', 'buyer_manager', 'manager') THEN
    RETURN 'management';
  ELSIF user_role IN ('buyer_purchaser', 'purchaser', 'buyer') THEN
    RETURN 'purchaser';
  ELSE
    RETURN 'none';
  END IF;
END;
$$;

-- Recreate check_governance_access with updated logic for buyer sub-roles
CREATE FUNCTION public.check_governance_access(p_user_id uuid)
RETURNS TABLE(
  primary_role text,
  can_view_purchaser_dashboard boolean,
  can_view_management_dashboard boolean,
  can_edit_incentives boolean,
  can_toggle_rewards boolean,
  is_read_only boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Get highest priority role
  SELECT ur.role::text INTO v_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id
  ORDER BY 
    CASE ur.role::text
      WHEN 'ceo' THEN 1
      WHEN 'buyer_ceo' THEN 1
      WHEN 'cfo' THEN 2
      WHEN 'buyer_cfo' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'buyer_manager' THEN 3
      WHEN 'ps_admin' THEN 4
      WHEN 'admin' THEN 5
      WHEN 'purchaser' THEN 6
      WHEN 'buyer_purchaser' THEN 6
      WHEN 'buyer' THEN 7
      WHEN 'supplier' THEN 8
      WHEN 'logistics_partner' THEN 9
      WHEN 'affiliate' THEN 10
      WHEN 'external_guest' THEN 11
      ELSE 12
    END
  LIMIT 1;

  RETURN QUERY SELECT
    v_role,
    -- Can view purchaser dashboard: purchaser, buyer_purchaser, buyer roles only
    v_role IN ('purchaser', 'buyer_purchaser', 'buyer'),
    -- Can view management dashboard: management roles (CFO, CEO, Manager variants)
    v_role IN ('cfo', 'buyer_cfo', 'ceo', 'buyer_ceo', 'manager', 'buyer_manager'),
    -- Can edit incentives: only CFO/CEO
    v_role IN ('cfo', 'buyer_cfo', 'ceo', 'buyer_ceo'),
    -- Can toggle rewards: only CFO/CEO
    v_role IN ('cfo', 'buyer_cfo', 'ceo', 'buyer_ceo'),
    -- Is read-only: purchaser, buyer, ps_admin
    v_role IN ('purchaser', 'buyer_purchaser', 'buyer', 'ps_admin');
END;
$$;