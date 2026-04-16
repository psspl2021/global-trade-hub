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
  v_base_currency text := 'INR';
  v_top_supplier_id uuid;
  v_rows jsonb := '[]'::jsonb;
  v_total numeric := 0;
  v_count int := 0;
BEGIN
  SELECT role, array_agg(company_id)
  INTO v_role, v_company_ids
  FROM user_company_access
  WHERE user_id = p_user_id
  GROUP BY role
  LIMIT 1;

  IF v_role IS NULL OR v_role NOT IN ('ceo','cfo') OR v_company_ids IS NULL THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  SELECT COALESCE(MAX(bc.base_currency), 'INR')
  INTO v_base_currency
  FROM buyer_companies bc
  WHERE bc.id = ANY(v_company_ids);

  IF p_action_type = 'CLEAR_OVERDUE' THEN
    SELECT
      COALESCE(jsonb_agg(jsonb_build_object(
        'po_id', po.id,
        'po_number', po.po_number,
        'supplier_name', COALESCE(p.company_name, p.contact_person, po.vendor_name, LEFT(po.supplier_id::text,8), 'Unknown'),
        'amount', po.po_value_base_currency,
        'due_date', po.payment_due_date,
        'days_overdue', GREATEST(0, EXTRACT(EPOCH FROM (now() - po.payment_due_date))/86400)::int,
        'status', po.po_status,
        'payment_status', po.payment_status
      ) ORDER BY po.payment_due_date ASC), '[]'::jsonb),
      COALESCE(SUM(po.po_value_base_currency), 0),
      COUNT(*)
    INTO v_rows, v_total, v_count
    FROM purchase_orders po
    LEFT JOIN profiles p ON p.id = po.supplier_id
    WHERE po.buyer_company_id = ANY(v_company_ids)
      AND po.payment_due_date < now()
      AND COALESCE(po.payment_status,'') <> 'paid';

  ELSIF p_action_type = 'DIVERSIFY_SUPPLIERS' THEN
    SELECT supplier_id INTO v_top_supplier_id
    FROM (
      SELECT po.supplier_id, SUM(po.po_value_base_currency) AS sv
      FROM purchase_orders po
      WHERE po.buyer_company_id = ANY(v_company_ids)
      GROUP BY po.supplier_id
      ORDER BY sv DESC NULLS LAST
      LIMIT 1
    ) t;

    SELECT
      COALESCE(jsonb_agg(jsonb_build_object(
        'po_id', po.id,
        'po_number', po.po_number,
        'supplier_name', COALESCE(p.company_name, p.contact_person, po.vendor_name, LEFT(po.supplier_id::text,8), 'Unknown'),
        'amount', po.po_value_base_currency,
        'due_date', po.payment_due_date,
        'order_date', po.order_date,
        'status', po.po_status,
        'payment_status', po.payment_status
      ) ORDER BY po.order_date DESC NULLS LAST), '[]'::jsonb),
      COALESCE(SUM(po.po_value_base_currency), 0),
      COUNT(*)
    INTO v_rows, v_total, v_count
    FROM purchase_orders po
    LEFT JOIN profiles p ON p.id = po.supplier_id
    WHERE po.buyer_company_id = ANY(v_company_ids)
      AND po.supplier_id = v_top_supplier_id;

  ELSIF p_action_type = 'PLAN_CASHFLOW' THEN
    SELECT
      COALESCE(jsonb_agg(jsonb_build_object(
        'po_id', po.id,
        'po_number', po.po_number,
        'supplier_name', COALESCE(p.company_name, p.contact_person, po.vendor_name, LEFT(po.supplier_id::text,8), 'Unknown'),
        'amount', po.po_value_base_currency,
        'due_date', po.payment_due_date,
        'days_until_due', GREATEST(0, EXTRACT(EPOCH FROM (po.payment_due_date - now()))/86400)::int,
        'status', po.po_status,
        'payment_status', po.payment_status
      ) ORDER BY po.payment_due_date ASC), '[]'::jsonb),
      COALESCE(SUM(po.po_value_base_currency), 0),
      COUNT(*)
    INTO v_rows, v_total, v_count
    FROM purchase_orders po
    LEFT JOIN profiles p ON p.id = po.supplier_id
    WHERE po.buyer_company_id = ANY(v_company_ids)
      AND po.payment_due_date >= now()
      AND po.payment_due_date <= now() + interval '7 days'
      AND COALESCE(po.payment_status,'') <> 'paid';

  ELSE
    RETURN jsonb_build_object('error','unknown_action');
  END IF;

  RETURN jsonb_build_object(
    'action_type', p_action_type,
    'base_currency', v_base_currency,
    'count', v_count,
    'total_amount', v_total,
    'rows', v_rows
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_intelligence_action_details(uuid, text) TO authenticated;