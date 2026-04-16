CREATE OR REPLACE FUNCTION public.get_intelligence_action_details(
  p_user_id uuid,
  p_action_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_company_ids uuid[];
  v_team_ids uuid[];

  v_rows jsonb := '[]'::jsonb;
  v_total numeric := 0;
  v_count int := 0;
  v_base_currency text := 'INR';

  v_top_supplier_id uuid;
BEGIN
  -- Resolve role + companies
  SELECT role, array_agg(company_id)
  INTO v_role, v_company_ids
  FROM user_company_access
  WHERE user_id = p_user_id
  GROUP BY role
  LIMIT 1;

  IF v_company_ids IS NULL OR array_length(v_company_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'action_type', p_action_type,
      'base_currency', v_base_currency,
      'count', 0,
      'total_amount', 0,
      'rows', '[]'::jsonb
    );
  END IF;

  -- Manager team scope
  IF v_role = 'manager' THEN
    SELECT array_agg(purchaser_id)
    INTO v_team_ids
    FROM manager_team_mapping
    WHERE manager_id = p_user_id;
  END IF;

  -- 🔒 SINGLE SOURCE OF TRUTH (materialized as temp table for reuse across branches)
  DROP TABLE IF EXISTS _scoped_pos;
  CREATE TEMP TABLE _scoped_pos ON COMMIT DROP AS
  SELECT po.*
  FROM purchase_orders po
  WHERE
    po.buyer_company_id = ANY(v_company_ids)
    AND (
      (v_role IN ('ceo','cfo','hr'))
      OR (v_role = 'manager' AND v_team_ids IS NOT NULL AND po.created_by = ANY(v_team_ids))
      OR (v_role = 'purchaser' AND po.created_by = p_user_id)
    );

  -- =========================
  -- ACTION HANDLING
  -- =========================

  -- 1. CLEAR OVERDUE
  IF p_action_type = 'CLEAR_OVERDUE' THEN
    SELECT
      COALESCE(jsonb_agg(jsonb_build_object(
        'po_id', po.id,
        'po_number', po.po_number,
        'supplier_name', COALESCE(p.company_name, p.contact_person, LEFT(po.supplier_id::text,8), 'Unknown'),
        'amount', po.po_value_base_currency,
        'due_date', po.payment_due_date,
        'days_overdue', GREATEST(0, EXTRACT(EPOCH FROM (now() - po.payment_due_date))/86400)::int
      ) ORDER BY po.payment_due_date ASC), '[]'::jsonb),
      COALESCE(SUM(po.po_value_base_currency),0),
      COUNT(*)
    INTO v_rows, v_total, v_count
    FROM _scoped_pos po
    LEFT JOIN profiles p ON p.id = po.supplier_id
    WHERE po.payment_due_date < now()
      AND COALESCE(po.payment_status,'') <> 'paid';
  END IF;

  -- 2. DIVERSIFY SUPPLIERS
  IF p_action_type = 'DIVERSIFY_SUPPLIERS' THEN
    SELECT supplier_id INTO v_top_supplier_id
    FROM (
      SELECT supplier_id, SUM(po_value_base_currency) v
      FROM _scoped_pos
      WHERE supplier_id IS NOT NULL
      GROUP BY supplier_id
      ORDER BY v DESC NULLS LAST
      LIMIT 1
    ) t;

    IF v_top_supplier_id IS NOT NULL THEN
      SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
          'po_id', po.id,
          'po_number', po.po_number,
          'supplier_name', COALESCE(p.company_name, p.contact_person, LEFT(po.supplier_id::text,8), 'Unknown'),
          'amount', po.po_value_base_currency,
          'due_date', po.payment_due_date
        ) ORDER BY po.po_value_base_currency DESC NULLS LAST), '[]'::jsonb),
        COALESCE(SUM(po.po_value_base_currency),0),
        COUNT(*)
      INTO v_rows, v_total, v_count
      FROM _scoped_pos po
      LEFT JOIN profiles p ON p.id = po.supplier_id
      WHERE po.supplier_id = v_top_supplier_id;
    END IF;
  END IF;

  -- 3. PLAN CASHFLOW
  IF p_action_type = 'PLAN_CASHFLOW' THEN
    SELECT
      COALESCE(jsonb_agg(jsonb_build_object(
        'po_id', po.id,
        'po_number', po.po_number,
        'supplier_name', COALESCE(p.company_name, p.contact_person, LEFT(po.supplier_id::text,8), 'Unknown'),
        'amount', po.po_value_base_currency,
        'due_date', po.payment_due_date,
        'days_until_due', GREATEST(0, EXTRACT(EPOCH FROM (po.payment_due_date - now()))/86400)::int
      ) ORDER BY po.payment_due_date ASC), '[]'::jsonb),
      COALESCE(SUM(po.po_value_base_currency),0),
      COUNT(*)
    INTO v_rows, v_total, v_count
    FROM _scoped_pos po
    LEFT JOIN profiles p ON p.id = po.supplier_id
    WHERE po.payment_due_date >= now()
      AND po.payment_due_date <= now() + interval '7 days'
      AND COALESCE(po.payment_status,'') <> 'paid';
  END IF;

  RETURN jsonb_build_object(
    'action_type', p_action_type,
    'base_currency', v_base_currency,
    'count', COALESCE(v_count, 0),
    'total_amount', COALESCE(v_total, 0),
    'rows', COALESCE(v_rows, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_intelligence_action_details(uuid, text) TO authenticated;