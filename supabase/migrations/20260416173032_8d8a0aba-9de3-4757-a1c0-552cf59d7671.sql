
-- =====================================================
-- 1. Manager → Team mapping table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.manager_team_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL,
  purchaser_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(manager_id, purchaser_id)
);

ALTER TABLE public.manager_team_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view team mappings for their company"
  ON public.manager_team_mapping FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT bcm.company_id FROM public.buyer_company_members bcm
      WHERE bcm.user_id = auth.uid() AND bcm.is_active = true
    )
  );

CREATE POLICY "Admins can manage team mappings"
  ON public.manager_team_mapping FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'ps_admin')
    )
  );

CREATE POLICY "Managers can manage their own team mappings"
  ON public.manager_team_mapping FOR ALL TO authenticated
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

CREATE INDEX idx_manager_team_mapping_manager ON public.manager_team_mapping(manager_id);
CREATE INDEX idx_manager_team_mapping_purchaser ON public.manager_team_mapping(purchaser_id);
CREATE INDEX idx_manager_team_mapping_company ON public.manager_team_mapping(company_id);

-- =====================================================
-- 2. Universal Company Intelligence RPC
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_company_intelligence(
  p_company_id uuid,
  p_user_id uuid,
  p_view text DEFAULT NULL -- 'CEO' | 'MANAGER' | 'HR' | NULL (auto-detect)
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_categories text[];
  v_team_users uuid[];
  v_total_payable numeric := 0;
  v_overdue numeric := 0;
  v_payable_7d numeric := 0;
  v_currency text;
  v_currency_symbol text;
  v_region_type text;
  v_result jsonb;
BEGIN
  -- =====================================================
  -- STEP 1: Resolve role from buyer_company_members
  -- =====================================================
  SELECT 
    UPPER(bcm.role),
    bcm.assigned_categories,
    COALESCE(bc.base_currency, 'INR'),
    COALESCE(bc.region_type, 'india')
  INTO v_role, v_categories, v_currency, v_region_type
  FROM buyer_company_members bcm
  JOIN buyer_companies bc ON bc.id = bcm.company_id
  WHERE bcm.user_id = p_user_id
    AND bcm.company_id = p_company_id
    AND bcm.is_active = true
  LIMIT 1;

  -- Fallback to requested view if no membership found
  v_role := COALESCE(v_role, UPPER(p_view), 'PURCHASER');

  -- Map role aliases
  v_role := CASE
    WHEN v_role IN ('CEO', 'BUYER_CEO') THEN 'CEO'
    WHEN v_role IN ('CFO', 'BUYER_CFO') THEN 'CEO' -- CFO sees CEO-level data
    WHEN v_role IN ('MANAGER', 'BUYER_MANAGER') THEN 'MANAGER'
    WHEN v_role IN ('HR', 'BUYER_HR') THEN 'HR'
    ELSE 'PURCHASER'
  END;

  -- Currency symbol
  v_currency_symbol := CASE v_currency
    WHEN 'INR' THEN '₹' WHEN 'USD' THEN '$' WHEN 'EUR' THEN '€'
    WHEN 'GBP' THEN '£' WHEN 'AED' THEN 'د.إ' WHEN 'SAR' THEN '﷼'
    WHEN 'SGD' THEN 'S$' WHEN 'AUD' THEN 'A$' WHEN 'CAD' THEN 'C$'
    WHEN 'JPY' THEN '¥' WHEN 'CNY' THEN '¥' WHEN 'KRW' THEN '₩'
    ELSE v_currency || ' '
  END;

  -- =====================================================
  -- STEP 2: Resolve team scope (for managers)
  -- =====================================================
  IF v_role = 'MANAGER' THEN
    SELECT array_agg(purchaser_id) INTO v_team_users
    FROM manager_team_mapping
    WHERE manager_id = p_user_id
      AND company_id = p_company_id;
  END IF;

  -- =====================================================
  -- STEP 3: Role-scoped data retrieval
  -- =====================================================

  -- ==================== CEO VIEW ====================
  IF v_role = 'CEO' THEN
    SELECT 
      COALESCE(SUM(po.po_value_base_currency), 0),
      COALESCE(SUM(CASE WHEN po.effective_due_date < now() THEN po.po_value_base_currency ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN po.effective_due_date BETWEEN now() AND now() + interval '7 days' THEN po.po_value_base_currency ELSE 0 END), 0)
    INTO v_total_payable, v_overdue, v_payable_7d
    FROM purchase_orders po
    WHERE po.buyer_company_id = p_company_id
      AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled');

  -- ==================== MANAGER VIEW ====================
  ELSIF v_role = 'MANAGER' THEN
    SELECT 
      COALESCE(SUM(po.po_value_base_currency), 0),
      COALESCE(SUM(CASE WHEN po.effective_due_date < now() THEN po.po_value_base_currency ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN po.effective_due_date BETWEEN now() AND now() + interval '7 days' THEN po.po_value_base_currency ELSE 0 END), 0)
    INTO v_total_payable, v_overdue, v_payable_7d
    FROM purchase_orders po
    WHERE po.buyer_company_id = p_company_id
      AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled')
      AND (
        po.created_by = ANY(v_team_users)
        OR po.spend_category = ANY(v_categories)
      );

  -- ==================== HR VIEW ====================
  ELSIF v_role = 'HR' THEN
    v_result := jsonb_build_object(
      'role', 'HR',
      'type', 'hr_insights',
      'currency', v_currency,
      'currency_symbol', v_currency_symbol,
      'summary', jsonb_build_object(
        'team_size', (SELECT COUNT(*) FROM buyer_company_members WHERE company_id = p_company_id AND is_active = true),
        'active_purchasers', (SELECT COUNT(*) FROM buyer_company_members WHERE company_id = p_company_id AND is_active = true AND UPPER(role) IN ('PURCHASER', 'BUYER_PURCHASER')),
        'active_managers', (SELECT COUNT(*) FROM buyer_company_members WHERE company_id = p_company_id AND is_active = true AND UPPER(role) IN ('MANAGER', 'BUYER_MANAGER'))
      ),
      'access_scope', jsonb_build_object(
        'categories', v_categories,
        'team_size', 0
      )
    );
    RETURN v_result;

  -- ==================== PURCHASER VIEW ====================
  ELSE
    SELECT 
      COALESCE(SUM(po.po_value_base_currency), 0),
      COALESCE(SUM(CASE WHEN po.effective_due_date < now() THEN po.po_value_base_currency ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN po.effective_due_date BETWEEN now() AND now() + interval '7 days' THEN po.po_value_base_currency ELSE 0 END), 0)
    INTO v_total_payable, v_overdue, v_payable_7d
    FROM purchase_orders po
    WHERE po.buyer_company_id = p_company_id
      AND po.created_by = p_user_id
      AND po.payment_workflow_status NOT IN ('payment_confirmed', 'cancelled');
  END IF;

  -- =====================================================
  -- STEP 4: Common output (CEO / Manager / Purchaser)
  -- =====================================================
  v_result := jsonb_build_object(
    'role', v_role,
    'currency', v_currency,
    'currency_symbol', v_currency_symbol,
    'region_type', v_region_type,
    'summary', jsonb_build_object(
      'total_payable', v_total_payable,
      'overdue', v_overdue,
      'payable_7d', v_payable_7d
    ),
    'access_scope', jsonb_build_object(
      'categories', v_categories,
      'team_size', COALESCE(array_length(v_team_users, 1), 0)
    )
  );

  RETURN v_result;
END;
$$;
