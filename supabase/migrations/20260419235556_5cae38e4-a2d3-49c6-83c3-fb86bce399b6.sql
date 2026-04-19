CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_company_ids uuid[];
  v_base_currency text;
  v_pos jsonb;
  v_po_count int;
  v_total_payable numeric;
  v_overdue numeric;
  v_payable_7d numeric;
  v_overdue_count int;
  v_supplier_risk jsonb;
  v_upcoming jsonb;
  v_root_causes jsonb := '{"sufficient_sample": false, "sample_size": 0, "min_sample_required": 3, "purchasers": [], "suppliers": [], "categories": []}'::jsonb;
  v_top_supplier_pct numeric := 0;
  v_top_supplier_name text := NULL;
BEGIN
  WITH picked AS (
    SELECT role FROM (VALUES ('ceo',1),('cfo',2),('manager',3),('hr',4),('purchaser',5)) AS r(role,prio)
    WHERE EXISTS (SELECT 1 FROM public.user_company_access uca WHERE uca.user_id = p_user_id AND LOWER(uca.role) = r.role)
    ORDER BY prio LIMIT 1
  )
  SELECT p.role, ARRAY_AGG(DISTINCT r.company_id)
  INTO v_role, v_company_ids
  FROM picked p
  JOIN public.user_company_access r
    ON r.user_id = p_user_id AND r.role = p.role
  GROUP BY p.role;

  IF v_role IS NULL OR v_company_ids IS NULL THEN
    RETURN jsonb_build_object(
      'role', NULL, 'error', 'NO_ROLE',
      'summary', jsonb_build_object('po_count',0,'total_payable',0,'overdue',0,'payable_7d',0)
    );
  END IF;

  SELECT COALESCE(bc.base_currency, 'INR') INTO v_base_currency
  FROM public.buyer_companies bc
  WHERE bc.id = v_company_ids[1] LIMIT 1;

  WITH base AS (
    SELECT
      po.id, po.po_number, po.po_value_base_currency, po.payment_due_date,
      po.payment_status, po.created_at, po.created_by, po.ceo_override,
      po.supplier_id, po.spend_category,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid') AS is_overdue,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND COALESCE(po.payment_status,'') <> 'paid') AS due_7d,
      (COALESCE(po.payment_status,'') <> 'paid') AS is_payable,
      public.get_po_lifecycle_stage(
        po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
      ) AS lifecycle_stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'po_id', id,
      'po_number', po_number,
      'amount', po_value_base_currency,
      'due_date', payment_due_date,
      'stage', lifecycle_stage,
      'purchasers', public.get_po_purchasers(id),
      'creator_id', created_by,
      'is_overdue', is_overdue,
      'ceo_override', ceo_override
    ) ORDER BY created_at DESC), '[]'::jsonb),
    COUNT(*),
    COALESCE(SUM(po_value_base_currency), 0),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE is_payable), 0),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE due_7d), 0),
    COUNT(*) FILTER (WHERE is_overdue)
  INTO v_pos, v_po_count, v_total_payable, v_overdue, v_payable_7d, v_overdue_count
  FROM base;

  -- Supplier risk (concentration)
  WITH sup AS (
    SELECT
      po.supplier_id,
      public._resolve_supplier_name(po.supplier_id) AS name,
      SUM(po.po_value_base_currency) AS amount
    FROM public.get_scoped_purchase_orders(p_user_id) po
    WHERE po.supplier_id IS NOT NULL
    GROUP BY po.supplier_id
  ),
  totals AS (SELECT NULLIF(SUM(amount),0) AS total FROM sup)
  SELECT (s.amount / t.total) * 100, s.name
  INTO v_top_supplier_pct, v_top_supplier_name
  FROM sup s, totals t
  ORDER BY s.amount DESC NULLS LAST
  LIMIT 1;

  v_supplier_risk := jsonb_build_object(
    'top_supplier', v_top_supplier_name,
    'top_supplier_pct', COALESCE(ROUND(v_top_supplier_pct,1),0),
    'level', CASE
      WHEN v_top_supplier_pct >= 70 THEN 'DEPENDENCY_RISK'
      WHEN v_top_supplier_pct >= 40 THEN 'ELEVATED'
      ELSE 'OK'
    END
  );

  -- Upcoming payments (next 7 days)
  WITH up AS (
    SELECT
      po.id AS po_id, po.po_number,
      po.po_value_base_currency AS amount,
      po.payment_due_date AS due_date,
      public._resolve_supplier_name(po.supplier_id) AS supplier
    FROM public.get_scoped_purchase_orders(p_user_id) po
    LEFT JOIN public.buyer_suppliers bs ON bs.id = po.supplier_id
    WHERE po.payment_due_date IS NOT NULL
      AND po.payment_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND COALESCE(po.payment_status,'') <> 'paid'
    ORDER BY po.payment_due_date ASC
    LIMIT 25
  )
  SELECT COALESCE(jsonb_agg(row_to_json(up)), '[]'::jsonb) INTO v_upcoming FROM up;

  -- Root causes
  IF v_overdue_count >= 3 THEN
    WITH overdue_pos AS (
      SELECT
        po.id, po.supplier_id, po.spend_category, po.po_value_base_currency
      FROM public.get_scoped_purchase_orders(p_user_id) po
      WHERE po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid'
    ),
    by_purchaser AS (
      SELECT
        pop.user_id::text AS id,
        COALESCE(pr.company_name, pr.contact_person, 'User ' || LEFT(pop.user_id::text,6)) AS name,
        SUM(o.po_value_base_currency) AS amount,
        COUNT(*)::int AS count
      FROM overdue_pos o
      JOIN public.purchase_order_purchasers pop ON pop.po_id = o.id
      LEFT JOIN public.profiles pr ON pr.id = pop.user_id
      GROUP BY pop.user_id, pr.company_name, pr.contact_person
      ORDER BY SUM(o.po_value_base_currency) DESC NULLS LAST
      LIMIT 5
    ),
    by_supplier AS (
      SELECT
        o.supplier_id::text AS id,
        public._resolve_supplier_name(o.supplier_id) AS name,
        SUM(o.po_value_base_currency) AS amount,
        COUNT(*)::int AS count
      FROM overdue_pos o
      WHERE o.supplier_id IS NOT NULL
      GROUP BY o.supplier_id
      ORDER BY SUM(o.po_value_base_currency) DESC NULLS LAST
      LIMIT 5
    ),
    by_category AS (
      SELECT
        COALESCE(o.spend_category,'uncategorized') AS id,
        COALESCE(o.spend_category,'Uncategorized') AS name,
        SUM(o.po_value_base_currency) AS amount,
        COUNT(*)::int AS count
      FROM overdue_pos o
      GROUP BY o.spend_category
      ORDER BY SUM(o.po_value_base_currency) DESC NULLS LAST
      LIMIT 5
    )
    SELECT jsonb_build_object(
      'sufficient_sample', true,
      'sample_size', v_overdue_count,
      'min_sample_required', 3,
      'purchasers', COALESCE((SELECT jsonb_agg(row_to_json(by_purchaser)) FROM by_purchaser), '[]'::jsonb),
      'suppliers',  COALESCE((SELECT jsonb_agg(row_to_json(by_supplier))  FROM by_supplier),  '[]'::jsonb),
      'categories', COALESCE((SELECT jsonb_agg(row_to_json(by_category))  FROM by_category),  '[]'::jsonb)
    ) INTO v_root_causes;
  ELSE
    v_root_causes := jsonb_build_object(
      'sufficient_sample', false,
      'sample_size', v_overdue_count,
      'min_sample_required', 3,
      'purchasers', '[]'::jsonb, 'suppliers', '[]'::jsonb, 'categories', '[]'::jsonb
    );
  END IF;

  RETURN jsonb_build_object(
    'role', v_role,
    'company_ids', v_company_ids,
    'base_currency', v_base_currency,
    'summary', jsonb_build_object(
      'po_count', v_po_count,
      'total_payable', v_total_payable,
      'overdue', v_overdue,
      'payable_7d', v_payable_7d,
      'overdue_count', v_overdue_count
    ),
    'pos', v_pos,
    'insights', jsonb_build_object(
      'supplier_risk', v_supplier_risk,
      'upcoming_payments', v_upcoming,
      'root_causes', v_root_causes
    )
  );
END;
$$;