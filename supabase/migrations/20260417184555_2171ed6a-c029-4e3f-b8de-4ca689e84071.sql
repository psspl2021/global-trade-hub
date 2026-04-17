CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_company_ids uuid[];
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
  v_rc_purchasers jsonb := '[]'::jsonb;
  v_rc_suppliers jsonb := '[]'::jsonb;
  v_overdue_ratio numeric := 0;
  v_overdue_pct numeric := 0;
BEGIN
  SELECT LOWER(role), array_agg(company_id)
  INTO v_role, v_company_ids
  FROM user_company_access
  WHERE user_id = p_user_id
  GROUP BY LOWER(role)
  ORDER BY LOWER(role)
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object(
      'role', NULL,
      'error', 'NO_ROLE',
      'company_ids', '[]'::jsonb,
      'summary', jsonb_build_object('po_count', 0, 'total_payable', 0, 'overdue', 0, 'payable_7d', 0, 'base_currency', 'INR'),
      'insights', '{}'::jsonb,
      'actions', '[]'::jsonb,
      'upcoming_payments', '[]'::jsonb,
      'empty', true
    );
  END IF;

  CREATE TEMP TABLE _scoped_pos ON COMMIT DROP AS
  SELECT * FROM public.get_scoped_purchase_orders(p_user_id);

  SELECT
    COALESCE(SUM(po.po_value_base_currency), 0),
    COALESCE(SUM(CASE WHEN po.payment_due_date < now() AND COALESCE(po.payment_status,'') <> 'paid' THEN po.po_value_base_currency ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN po.payment_due_date <= now() + interval '7 days' AND po.payment_due_date >= now() AND COALESCE(po.payment_status,'') <> 'paid' THEN po.po_value_base_currency ELSE 0 END), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE po.payment_due_date < now() AND COALESCE(po.payment_status,'') <> 'paid'),
    COALESCE(AVG(CASE WHEN po.payment_due_date < now() AND COALESCE(po.payment_status,'') <> 'paid' THEN EXTRACT(EPOCH FROM (now() - po.payment_due_date))/86400 END), 0)
  INTO v_total, v_overdue, v_payable_7d, v_po_count, v_overdue_count, v_avg_delay
  FROM _scoped_pos po;

  v_overdue_ratio := CASE WHEN v_total > 0 THEN v_overdue / v_total ELSE 0 END;
  v_overdue_pct := ROUND(v_overdue_ratio * 100, 1);

  SELECT
    COALESCE(pr.company_name, pr.contact_person, LEFT(t.supplier_id::text,8), 'Unknown'),
    t.v,
    CASE WHEN v_total > 0 THEN ROUND((t.v / v_total) * 100, 1) ELSE 0 END
  INTO v_top_supplier_name, v_top_supplier_value, v_top_supplier_share
  FROM (
    SELECT supplier_id, SUM(po_value_base_currency) v FROM _scoped_pos
    WHERE supplier_id IS NOT NULL GROUP BY supplier_id
    ORDER BY v DESC NULLS LAST, supplier_id LIMIT 1
  ) t LEFT JOIN profiles pr ON pr.id = t.supplier_id;

  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'po_id', po.id, 'po_number', po.po_number,
      'supplier_name', COALESCE(p.company_name, p.contact_person, LEFT(po.supplier_id::text,8), 'Unknown'),
      'amount', po.po_value_base_currency, 'due_date', po.payment_due_date
    ) ORDER BY po.payment_due_date ASC, po.id), '[]'::jsonb),
    COUNT(*)
  INTO v_upcoming, v_upcoming_count
  FROM _scoped_pos po LEFT JOIN profiles p ON p.id = po.supplier_id
  WHERE po.payment_due_date >= now() AND po.payment_due_date <= now() + interval '7 days'
    AND COALESCE(po.payment_status,'') <> 'paid';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', agg.purchaser_id,
    'name', COALESCE(NULLIF(pr.contact_person, ''), NULLIF(pr.company_name, ''), LEFT(agg.purchaser_id::text,8), 'Unknown'),
    'amount', agg.amount,
    'share_pct', CASE WHEN v_overdue > 0 THEN ROUND((agg.amount / v_overdue) * 100, 1) ELSE 0 END,
    'count', agg.cnt
  ) ORDER BY agg.amount DESC NULLS LAST, agg.purchaser_id), '[]'::jsonb)
  INTO v_rc_purchasers
  FROM (
    SELECT po.created_by AS purchaser_id, SUM(po.po_value_base_currency) AS amount, COUNT(*) AS cnt
    FROM _scoped_pos po
    WHERE po.payment_due_date < now() AND COALESCE(po.payment_status,'') <> 'paid' AND po.created_by IS NOT NULL
    GROUP BY po.created_by ORDER BY amount DESC NULLS LAST, po.created_by LIMIT 3
  ) agg LEFT JOIN profiles pr ON pr.id = agg.purchaser_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', agg.supplier_id,
    'name', COALESCE(p.company_name, p.contact_person, LEFT(agg.supplier_id::text,8), 'Unknown'),
    'amount', agg.amount,
    'share_pct', CASE WHEN v_overdue > 0 THEN ROUND((agg.amount / v_overdue) * 100, 1) ELSE 0 END,
    'count', agg.cnt
  ) ORDER BY agg.amount DESC NULLS LAST, agg.supplier_id), '[]'::jsonb)
  INTO v_rc_suppliers
  FROM (
    SELECT po.supplier_id, SUM(po.po_value_base_currency) AS amount, COUNT(*) AS cnt
    FROM _scoped_pos po
    WHERE po.payment_due_date < now() AND COALESCE(po.payment_status,'') <> 'paid' AND po.supplier_id IS NOT NULL
    GROUP BY po.supplier_id ORDER BY amount DESC NULLS LAST, po.supplier_id LIMIT 3
  ) agg LEFT JOIN profiles p ON p.id = agg.supplier_id;

  v_summary := jsonb_build_object(
    'total_payable', v_total, 'overdue', v_overdue, 'overdue_amount', v_overdue,
    'payable_7d', v_payable_7d, 'po_count', v_po_count, 'base_currency', 'INR'
  );

  v_insights := jsonb_build_object(
    'overdue_ratio', ROUND(COALESCE(v_overdue_ratio, 0), 4),
    'overdue_pct', COALESCE(v_overdue_pct, 0),
    'overdue_count', v_overdue_count,
    'avg_payment_delay_days', ROUND(v_avg_delay, 1),
    'risk_level', CASE WHEN v_overdue_ratio >= 0.2 THEN 'HIGH' ELSE 'NORMAL' END,
    'priority', CASE WHEN v_overdue_ratio >= 0.3 THEN 'CRITICAL' WHEN v_overdue_ratio >= 0.1 THEN 'WARNING' ELSE 'STABLE' END,
    'cash_pressure_score', LEAST(100, ROUND((v_overdue_ratio * 60) + (CASE WHEN v_total > 0 THEN (v_payable_7d / v_total) * 40 ELSE 0 END))),
    'supplier_risk', jsonb_build_object(
      'level', CASE WHEN v_top_supplier_share >= 60 THEN 'DEPENDENCY_RISK' ELSE 'NORMAL' END,
      'top_supplier', v_top_supplier_name,
      'top_supplier_value', v_top_supplier_value,
      'concentration_pct', v_top_supplier_share
    ),
    'upcoming_count', v_upcoming_count,
    'root_causes', jsonb_build_object(
      'denominator', 'overdue',
      'unit', jsonb_build_object('share', 'percentage', 'amount', 'currency'),
      'purchasers', COALESCE(v_rc_purchasers, '[]'::jsonb),
      'suppliers', COALESCE(v_rc_suppliers, '[]'::jsonb),
      'categories', '[]'::jsonb
    )
  );

  v_actions := '[]'::jsonb;
  IF v_overdue > 0 THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object('type','CLEAR_OVERDUE','title','Clear overdue payables','description','Overdue exposure impacting supplier trust and credit cycle','impact',v_overdue_pct));
  END IF;
  IF v_top_supplier_share >= 60 THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object('type','DIVERSIFY_SUPPLIERS','title','Reduce supplier dependency','description','Single supplier concentration risk detected','impact',v_top_supplier_share));
  END IF;
  IF v_payable_7d > 0 THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object('type','PLAN_CASHFLOW','title','Plan upcoming cashflow','description','Payments due in next 7 days','impact',v_upcoming_count));
  END IF;

  SELECT COALESCE(jsonb_agg(value), '[]'::jsonb) INTO v_actions
  FROM (SELECT value FROM jsonb_array_elements(v_actions) LIMIT 3) t;

  RETURN jsonb_build_object(
    'role', v_role,
    'company_ids', COALESCE(to_jsonb(v_company_ids), '[]'::jsonb),
    'summary', v_summary,
    'insights', v_insights,
    'actions', v_actions,
    'upcoming_payments', v_upcoming,
    'empty', (v_po_count = 0)
  );
END;
$function$;