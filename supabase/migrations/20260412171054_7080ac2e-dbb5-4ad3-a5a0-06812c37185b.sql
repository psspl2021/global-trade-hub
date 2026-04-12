
-- 1. Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ops_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_manager';

-- 2. Create permission enforcement function (security definer)
CREATE OR REPLACE FUNCTION public.check_admin_permission(
  _user_id UUID,
  _action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
BEGIN
  -- Get the user's role as text
  SELECT ur.role::text INTO _role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  ORDER BY 
    CASE ur.role::text
      WHEN 'ps_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'ceo' THEN 3
      WHEN 'ops_manager' THEN 4
      WHEN 'sales_manager' THEN 5
      ELSE 10
    END
  LIMIT 1;

  IF _role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Admin/ps_admin have full access
  IF _role IN ('admin', 'ps_admin') THEN
    RETURN TRUE;
  END IF;

  -- CEO permissions
  IF _role = 'ceo' AND _action IN (
    'read_analytics', 'read_revenue', 'read_demand', 'read_invoices', 'read_visitors'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Ops Manager permissions
  IF _role = 'ops_manager' AND _action IN (
    'read_analytics', 'manage_rfq', 'manage_bids', 'verify_docs', 'verify_vehicles',
    'manage_logistics', 'view_l1', 'manage_auctions', 'progress_po', 'manage_supplier_selection'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Sales Manager permissions
  IF _role = 'sales_manager' AND _action IN (
    'read_analytics', 'manage_leads', 'run_campaigns', 'manage_blogs',
    'manage_premium_bids', 'manage_referrals', 'read_visitors', 'manage_credits', 'manage_email'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;
