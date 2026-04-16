DROP FUNCTION IF EXISTS public.get_company_intelligence_v2(uuid);

CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_currency text := 'INR';
  v_total numeric := 0;
  v_overdue numeric := 0;
  v_payable_7d numeric := 0;
  v_po_count int := 0;
  v_summary jsonb;
  v_insights jsonb := '{}'::jsonb;
  v_avg_delay numeric := 0;
  v_overdue_ratio numeric := 0;
  v_risk text := 'NORMAL';
  v_top_supplier_name text;
  v_top_supplier_value numeric := 0;
  v_supplier_share numeric := 0;
  v_supplier_risk text := 'NORMAL';
  v_upcoming jsonb := '[]'::jsonb;
  v_cash_pressure numeric := 0;
  v_priority text := 'STABLE';
  v_actions jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(base_currency, 'INR') INTO v_base_currency
  FROM buyer_companies WHERE id = p_company_id;

  SELECT
    COALESCE(SUM(po.total_amount), 0),
    COALESCE(SUM(CASE WHEN po.payment_due_date < CURRENT_DATE AND COALESCE(po.payment_status,'') <> 'paid' THEN po.total_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN po.payment_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND COALESCE(po.payment_status,'') <> 'paid' THEN po.total_amount ELSE 0 END), 0),
    COUNT(*)
  INTO v_total, v_overdue, v_payable_7d, v_po_count
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id;

  v_summary := jsonb_build_object(
    'total_payable', v_total,
    'overdue', v_overdue,
    'payable_7d', v_payable_7d,
    'po_count', v_po_count
  );

  SELECT COALESCE(AVG(GREATEST(0, EXTRACT(EPOCH FROM (po.paid_at - po.payment_due_date))/86400)), 0)
  INTO v_avg_delay
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.paid_at IS NOT NULL
    AND po.payment_due_date IS NOT NULL;

  v_overdue_ratio := CASE WHEN v_total > 0 THEN v_overdue / v_total ELSE 0 END;
  v_risk := CASE WHEN v_overdue_ratio > 0.2 THEN 'HIGH' ELSE 'NORMAL' END;

  SELECT supplier_name, supplier_value
  INTO v_top_supplier_name, v_top_supplier_value
  FROM (
    SELECT
      COALESCE(p.company_name, p.contact_person, LEFT(po.supplier_id::text, 8), 'Unknown') AS supplier_name,
      SUM(po.total_amount) AS supplier_value
    FROM purchase_orders po
    LEFT JOIN profiles p ON p.user_id = po.supplier_id
    WHERE po.buyer_company_id = p_company_id
    GROUP BY po.supplier_id, COALESCE(p.company_name, p.contact_person, LEFT(po.supplier_id::text, 8), 'Unknown')
    ORDER BY supplier_value DESC
    LIMIT 1
  ) t;

  v_supplier_share := CASE WHEN v_total > 0 THEN COALESCE(v_top_supplier_value,0) / v_total ELSE 0 END;
  v_supplier_risk := CASE WHEN v_supplier_share > 0.5 THEN 'DEPENDENCY_RISK' ELSE 'NORMAL' END;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'po_id', po.id,
    'po_number', po.po_number,
    'supplier_name', COALESCE(p.company_name, p.contact_person, LEFT(po.supplier_id::text,8), 'Unknown'),
    'amount', po.total_amount,
    'due_date', po.payment_due_date
  ) ORDER BY po.payment_due_date ASC), '[]'::jsonb)
  INTO v_upcoming
  FROM purchase_orders po
  LEFT JOIN profiles p ON p.user_id = po.supplier_id
  WHERE po.buyer_company_id = p_company_id
    AND po.payment_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND COALESCE(po.payment_status,'') <> 'paid';

  IF v_total > 0 THEN
    v_cash_pressure := LEAST(100,
      (v_overdue / v_total) * 50 +
      COALESCE((SELECT SUM((row->>'amount')::numeric) FROM jsonb_array_elements(v_upcoming) row), 0) / v_total * 30 +
      LEAST(v_avg_delay, 30) / 30 * 20
    );
  END IF;

  v_priority := CASE
    WHEN v_cash_pressure >= 70 THEN 'CRITICAL'
    WHEN v_cash_pressure >= 40 THEN 'WARNING'
    ELSE 'STABLE'
  END;

  v_actions := '[]'::jsonb;
  IF v_overdue > 0 THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'type', 'CLEAR_OVERDUE',
      'title', 'Clear overdue payables',
      'impact', ROUND((v_overdue / NULLIF(v_total,0) * 100)::numeric, 1),
      'description', 'Overdue exposure impacting supplier trust and credit cycle'
    ));
  END IF;
  IF v_supplier_share > 0.5 THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'type', 'DIVERSIFY_SUPPLIERS',
      'title', 'Reduce supplier dependency',
      'impact', ROUND((v_supplier_share * 100)::numeric, 1),
      'description', 'Single supplier concentration risk detected'
    ));
  END IF;
  IF jsonb_array_length(v_upcoming) > 3 THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'type', 'PLAN_CASHFLOW',
      'title', 'Plan upcoming payments',
      'impact', jsonb_array_length(v_upcoming),
      'description', 'Multiple payments due in next 7 days'
    ));
  END IF;
  v_actions := (
    SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
    FROM (SELECT value FROM jsonb_array_elements(v_actions) LIMIT 3) t
  );

  v_insights := COALESCE(v_insights, '{}'::jsonb) || jsonb_build_object(
    'overdue_ratio', v_overdue_ratio,
    'risk_level', v_risk,
    'avg_payment_delay_days', ROUND(v_avg_delay::numeric, 1),
    'supplier_risk', jsonb_build_object(
      'level', v_supplier_risk,
      'top_supplier', v_top_supplier_name,
      'top_supplier_value', COALESCE(v_top_supplier_value, 0),
      'concentration_pct', ROUND((v_supplier_share * 100)::numeric, 1)
    ),
    'upcoming_payments', COALESCE(v_upcoming, '[]'::jsonb),
    'cash_pressure_score', ROUND(COALESCE(v_cash_pressure, 0)::numeric, 1),
    'priority', COALESCE(v_priority, 'STABLE'),
    'actions', COALESCE(v_actions, '[]'::jsonb)
  );

  RETURN jsonb_build_object(
    'base_currency', v_base_currency,
    'summary', v_summary,
    'insights', v_insights
  );
END;
$$;