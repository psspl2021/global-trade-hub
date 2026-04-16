-- 1. Shared scoping function (single source of truth)
CREATE OR REPLACE FUNCTION public.get_scoped_purchase_orders(p_user_id uuid)
RETURNS SETOF public.purchase_orders
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_company_ids uuid[];
  v_team_ids uuid[];
BEGIN
  SELECT role, array_agg(company_id)
  INTO v_role, v_company_ids
  FROM user_company_access
  WHERE user_id = p_user_id
  GROUP BY role
  LIMIT 1;

  IF v_company_ids IS NULL OR array_length(v_company_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'manager' THEN
    SELECT array_agg(purchaser_id)
    INTO v_team_ids
    FROM manager_team_mapping
    WHERE manager_id = p_user_id;
  END IF;

  RETURN QUERY
  SELECT po.*
  FROM purchase_orders po
  WHERE
    po.buyer_company_id = ANY(v_company_ids)
    AND (
      (v_role IN ('ceo','cfo','hr'))
      OR (v_role = 'manager' AND v_team_ids IS NOT NULL AND po.created_by = ANY(v_team_ids))
      OR (v_role = 'purchaser' AND po.created_by = p_user_id)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_scoped_purchase_orders(uuid) TO authenticated;


-- 2. Refactor drilldown to use shared function
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
  v_rows jsonb := '[]'::jsonb;
  v_total numeric := 0;
  v_count int := 0;
  v_base_currency text := 'INR';
  v_top_supplier_id uuid;
BEGIN
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
    FROM public.get_scoped_purchase_orders(p_user_id) po
    LEFT JOIN profiles p ON p.id = po.supplier_id
    WHERE po.payment_due_date < now()
      AND COALESCE(po.payment_status,'') <> 'paid';

  ELSIF p_action_type = 'DIVERSIFY_SUPPLIERS' THEN
    SELECT supplier_id INTO v_top_supplier_id
    FROM (
      SELECT supplier_id, SUM(po_value_base_currency) v
      FROM public.get_scoped_purchase_orders(p_user_id)
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
      FROM public.get_scoped_purchase_orders(p_user_id) po
      LEFT JOIN profiles p ON p.id = po.supplier_id
      WHERE po.supplier_id = v_top_supplier_id;
    END IF;

  ELSIF p_action_type = 'PLAN_CASHFLOW' THEN
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
    FROM public.get_scoped_purchase_orders(p_user_id) po
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


-- 3. Refactor main intelligence RPC to consume shared function
CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric := 0;
  v_overdue numeric := 0;
  v_payable_7d numeric := 0;
  v_po_count int := 0;
  v_overdue_count int := 0;
  v_avg_delay numeric := 0;
  v_top_supplier_name text;
  v_top_supplier_share numeric := 0;
  v_top_supplier_value numeric := 0;
  v_upcoming jsonb := '[]'::jsonb;
  v_upcoming_count int := 0;
  v_summary jsonb;
  v_insights jsonb := '{}'::jsonb;
  v_actions jsonb := '[]'::jsonb;
BEGIN
  -- Summary aggregates
  SELECT
    COALESCE(SUM(po.po_value_base_currency), 0),
    COALESCE(SUM(CASE WHEN po.payment_due_date < now()
          AND COALESCE(po.payment_status,'') <> 'paid'
          THEN po.po_value_base_currency ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN po.payment_due_date <= now() + interval '7 days'
          AND po.payment_due_date >= now()
          AND COALESCE(po.payment_status,'') <> 'paid'
          THEN po.po_value_base_currency ELSE 0 END), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE po.payment_due_date < now() AND COALESCE(po.payment_status,'') <> 'paid'),
    COALESCE(AVG(CASE WHEN po.payment_due_date < now() AND COALESCE(po.payment_status,'') <> 'paid'
          THEN EXTRACT(EPOCH FROM (now() - po.payment_due_date))/86400
          END), 0)
  INTO v_total, v_overdue, v_payable_7d, v_po_count, v_overdue_count, v_avg_delay
  FROM public.get_scoped_purchase_orders(p_user_id) po;

  -- Top supplier concentration
  SELECT
    COALESCE(pr.company_name, pr.contact_person, LEFT(t.supplier_id::text,8), 'Unknown'),
    t.v,
    CASE WHEN v_total > 0 THEN ROUND((t.v / v_total) * 100, 1) ELSE 0 END
  INTO v_top_supplier_name, v_top_supplier_value, v_top_supplier_share
  FROM (
    SELECT supplier_id, SUM(po_value_base_currency) v
    FROM public.get_scoped_purchase_orders(p_user_id)
    WHERE supplier_id IS NOT NULL
    GROUP BY supplier_id
    ORDER BY v DESC NULLS LAST
    LIMIT 1
  ) t
  LEFT JOIN profiles pr ON pr.id = t.supplier_id;

  -- Upcoming payments (7d)
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'po_id', po.id,
      'po_number', po.po_number,
      'supplier_name', COALESCE(p.company_name, p.contact_person, LEFT(po.supplier_id::text,8), 'Unknown'),
      'amount', po.po_value_base_currency,
      'due_date', po.payment_due_date
    ) ORDER BY po.payment_due_date ASC), '[]'::jsonb),
    COUNT(*)
  INTO v_upcoming, v_upcoming_count
  FROM public.get_scoped_purchase_orders(p_user_id) po
  LEFT JOIN profiles p ON p.id = po.supplier_id
  WHERE po.payment_due_date >= now()
    AND po.payment_due_date <= now() + interval '7 days'
    AND COALESCE(po.payment_status,'') <> 'paid';

  v_summary := jsonb_build_object(
    'total_payable', v_total,
    'overdue_amount', v_overdue,
    'payable_7d', v_payable_7d,
    'po_count', v_po_count,
    'base_currency', 'INR'
  );

  -- Insights (merge-safe)
  v_insights := COALESCE(v_insights, '{}'::jsonb) || jsonb_build_object(
    'overdue_ratio', CASE WHEN v_total > 0 THEN ROUND((v_overdue / v_total) * 100, 1) ELSE 0 END,
    'overdue_count', v_overdue_count,
    'avg_delay_days', ROUND(v_avg_delay, 1),
    'top_supplier_name', v_top_supplier_name,
    'top_supplier_share', v_top_supplier_share,
    'top_supplier_value', v_top_supplier_value,
    'upcoming_count', v_upcoming_count
  );

  -- Recommended actions
  IF v_overdue > 0 THEN
    v_actions := v_actions || jsonb_build_object(
      'type', 'CLEAR_OVERDUE',
      'title', 'Clear overdue payables',
      'reason', 'Overdue exposure impacting supplier trust and credit cycle',
      'metric', (CASE WHEN v_total > 0 THEN ROUND((v_overdue / v_total) * 100, 1) ELSE 0 END)::text || '%'
    );
  END IF;

  IF v_top_supplier_share >= 60 THEN
    v_actions := v_actions || jsonb_build_object(
      'type', 'DIVERSIFY_SUPPLIERS',
      'title', 'Reduce supplier dependency',
      'reason', 'Single supplier concentration risk detected',
      'metric', v_top_supplier_share::text || '%'
    );
  END IF;

  IF v_payable_7d > 0 THEN
    v_actions := v_actions || jsonb_build_object(
      'type', 'PLAN_CASHFLOW',
      'title', 'Plan upcoming cashflow',
      'reason', 'Payments due in next 7 days',
      'metric', v_upcoming_count::text || ' POs'
    );
  END IF;

  RETURN jsonb_build_object(
    'summary', v_summary,
    'insights', v_insights,
    'actions', v_actions,
    'upcoming_payments', v_upcoming
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_intelligence_v2(uuid) TO authenticated;