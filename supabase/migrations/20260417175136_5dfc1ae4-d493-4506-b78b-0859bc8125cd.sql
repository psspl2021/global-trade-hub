CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_rc_purchasers jsonb := '[]'::jsonb;
  v_rc_suppliers jsonb := '[]'::jsonb;
BEGIN
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

  -- =========================
  -- ROOT CAUSE: OVERDUE DRIVERS
  -- =========================
  -- Purchasers (created_by)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', agg.purchaser_id,
    'name', COALESCE(pr.company_name, pr.contact_person, LEFT(agg.purchaser_id::text,8), 'Unknown'),
    'amount', agg.amount,
    'share_pct', CASE WHEN v_overdue > 0 THEN ROUND((agg.amount / v_overdue) * 100, 1) ELSE 0 END,
    'count', agg.cnt
  ) ORDER BY agg.amount DESC NULLS LAST), '[]'::jsonb)
  INTO v_rc_purchasers
  FROM (
    SELECT po.created_by AS purchaser_id,
           SUM(po.po_value_base_currency) AS amount,
           COUNT(*) AS cnt
    FROM public.get_scoped_purchase_orders(p_user_id) po
    WHERE po.payment_due_date < now()
      AND COALESCE(po.payment_status,'') <> 'paid'
      AND po.created_by IS NOT NULL
    GROUP BY po.created_by
    ORDER BY amount DESC NULLS LAST
    LIMIT 3
  ) agg
  LEFT JOIN profiles pr ON pr.id = agg.purchaser_id;

  -- Suppliers
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', agg.supplier_id,
    'name', COALESCE(p.company_name, p.contact_person, LEFT(agg.supplier_id::text,8), 'Unknown'),
    'amount', agg.amount,
    'share_pct', CASE WHEN v_overdue > 0 THEN ROUND((agg.amount / v_overdue) * 100, 1) ELSE 0 END,
    'count', agg.cnt
  ) ORDER BY agg.amount DESC NULLS LAST), '[]'::jsonb)
  INTO v_rc_suppliers
  FROM (
    SELECT po.supplier_id,
           SUM(po.po_value_base_currency) AS amount,
           COUNT(*) AS cnt
    FROM public.get_scoped_purchase_orders(p_user_id) po
    WHERE po.payment_due_date < now()
      AND COALESCE(po.payment_status,'') <> 'paid'
      AND po.supplier_id IS NOT NULL
    GROUP BY po.supplier_id
    ORDER BY amount DESC NULLS LAST
    LIMIT 3
  ) agg
  LEFT JOIN profiles p ON p.id = agg.supplier_id;

  v_summary := jsonb_build_object(
    'total_payable', v_total,
    'overdue', v_overdue,
    'overdue_amount', v_overdue,
    'payable_7d', v_payable_7d,
    'po_count', v_po_count,
    'base_currency', 'INR'
  );

  v_insights := jsonb_build_object(
    'overdue_ratio', CASE WHEN v_total > 0 THEN ROUND((v_overdue / v_total)::numeric, 4) ELSE 0 END,
    'overdue_count', v_overdue_count,
    'avg_payment_delay_days', ROUND(v_avg_delay, 1),
    'risk_level', CASE WHEN v_total > 0 AND (v_overdue / v_total) >= 0.2 THEN 'HIGH' ELSE 'NORMAL' END,
    'priority', CASE
      WHEN v_total > 0 AND (v_overdue / v_total) >= 0.3 THEN 'CRITICAL'
      WHEN v_total > 0 AND (v_overdue / v_total) >= 0.1 THEN 'WARNING'
      ELSE 'STABLE'
    END,
    'cash_pressure_score', LEAST(100, ROUND(
      (CASE WHEN v_total > 0 THEN (v_overdue / v_total) * 60 ELSE 0 END) +
      (CASE WHEN v_total > 0 THEN (v_payable_7d / v_total) * 40 ELSE 0 END)
    )),
    'supplier_risk', jsonb_build_object(
      'level', CASE WHEN v_top_supplier_share >= 60 THEN 'DEPENDENCY_RISK' ELSE 'NORMAL' END,
      'top_supplier', v_top_supplier_name,
      'top_supplier_value', v_top_supplier_value,
      'concentration_pct', v_top_supplier_share
    ),
    'upcoming_count', v_upcoming_count,
    'root_causes', jsonb_build_object(
      'purchasers', COALESCE(v_rc_purchasers, '[]'::jsonb),
      'suppliers', COALESCE(v_rc_suppliers, '[]'::jsonb),
      'categories', '[]'::jsonb
    )
  );

  v_actions := '[]'::jsonb;

  IF v_overdue > 0 THEN
    v_actions := v_actions || jsonb_build_array(
      jsonb_build_object(
        'type', 'CLEAR_OVERDUE',
        'title', 'Clear overdue payables',
        'description', 'Overdue exposure impacting supplier trust and credit cycle',
        'impact', (CASE WHEN v_total > 0 THEN ROUND((v_overdue / v_total) * 100, 1) ELSE 0 END)
      )
    );
  END IF;

  IF v_top_supplier_share >= 60 THEN
    v_actions := v_actions || jsonb_build_array(
      jsonb_build_object(
        'type', 'DIVERSIFY_SUPPLIERS',
        'title', 'Reduce supplier dependency',
        'description', 'Single supplier concentration risk detected',
        'impact', v_top_supplier_share
      )
    );
  END IF;

  IF v_payable_7d > 0 THEN
    v_actions := v_actions || jsonb_build_array(
      jsonb_build_object(
        'type', 'PLAN_CASHFLOW',
        'title', 'Plan upcoming cashflow',
        'description', 'Payments due in next 7 days',
        'impact', v_upcoming_count
      )
    );
  END IF;

  SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
  INTO v_actions
  FROM (
    SELECT value FROM jsonb_array_elements(v_actions) LIMIT 3
  ) t;

  RETURN jsonb_build_object(
    'summary', v_summary,
    'insights', v_insights,
    'actions', v_actions,
    'upcoming_payments', v_upcoming
  );
END;
$function$;