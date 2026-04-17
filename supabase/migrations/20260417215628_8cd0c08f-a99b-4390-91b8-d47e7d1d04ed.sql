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
  v_min_sample int := 3;
  v_pos jsonb := '[]'::jsonb;
  v_stage_counts jsonb := '{}'::jsonb;
  v_top_purchasers jsonb := '[]'::jsonb;
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
      'role', NULL, 'error', 'NO_ROLE',
      'company_ids', '[]'::jsonb,
      'summary', jsonb_build_object('po_count', 0, 'total_payable', 0, 'overdue', 0, 'payable_7d', 0, 'base_currency', 'INR'),
      'insights', '{}'::jsonb, 'actions', '[]'::jsonb,
      'upcoming_payments', '[]'::jsonb, 'pos', '[]'::jsonb, 'empty', true
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
    COALESCE(
      NULLIF(pr.company_name, ''),
      NULLIF(pr.contact_person, ''),
      NULLIF(t.vendor_name, ''),
      'Vendor ' || LEFT(t.supplier_id::text, 6)
    ),
    t.v,
    CASE WHEN v_total > 0 THEN ROUND((t.v / v_total) * 100, 1) ELSE 0 END
  INTO v_top_supplier_name, v_top_supplier_value, v_top_supplier_share
  FROM (
    SELECT supplier_id, MAX(vendor_name) AS vendor_name, SUM(po_value_base_currency) v
    FROM _scoped_pos
    WHERE supplier_id IS NOT NULL
    GROUP BY supplier_id
    ORDER BY v DESC NULLS LAST, supplier_id LIMIT 1
  ) t LEFT JOIN profiles pr ON pr.id = t.supplier_id;

  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'po_id', po.id, 'po_number', po.po_number,
      'supplier_name', COALESCE(
        NULLIF(p.company_name, ''),
        NULLIF(p.contact_person, ''),
        NULLIF(po.vendor_name, ''),
        'Vendor ' || LEFT(po.supplier_id::text, 6)
      ),
      'amount', po.po_value_base_currency, 'due_date', po.payment_due_date
    ) ORDER BY po.payment_due_date ASC, po.id), '[]'::jsonb),
    COUNT(*)
  INTO v_upcoming, v_upcoming_count
  FROM _scoped_pos po LEFT JOIN profiles p ON p.id = po.supplier_id
  WHERE po.payment_due_date >= now() AND po.payment_due_date <= now() + interval '7 days'
    AND COALESCE(po.payment_status,'') <> 'paid';

  IF v_overdue_count >= v_min_sample THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', agg.purchaser_id,
      'name', COALESCE(
        NULLIF(pr.contact_person, ''),
        NULLIF(pr.company_name, ''),
        'User ' || LEFT(agg.purchaser_id::text, 6)
      ),
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
      'name', COALESCE(
        NULLIF(p.company_name, ''),
        NULLIF(p.contact_person, ''),
        NULLIF(agg.vendor_name, ''),
        'Vendor ' || LEFT(agg.supplier_id::text, 6)
      ),
      'amount', agg.amount,
      'share_pct', CASE WHEN v_overdue > 0 THEN ROUND((agg.amount / v_overdue) * 100, 1) ELSE 0 END,
      'count', agg.cnt
    ) ORDER BY agg.amount DESC NULLS LAST, agg.supplier_id), '[]'::jsonb)
    INTO v_rc_suppliers
    FROM (
      SELECT po.supplier_id, MAX(po.vendor_name) AS vendor_name, SUM(po.po_value_base_currency) AS amount, COUNT(*) AS cnt
      FROM _scoped_pos po
      WHERE po.payment_due_date < now() AND COALESCE(po.payment_status,'') <> 'paid' AND po.supplier_id IS NOT NULL
      GROUP BY po.supplier_id ORDER BY amount DESC NULLS LAST, po.supplier_id LIMIT 3
    ) agg LEFT JOIN profiles p ON p.id = agg.supplier_id;
  END IF;

  -- ===== NEW: PO lifecycle + purchaser attribution =====
  WITH staged AS (
    SELECT
      po.id, po.po_number, po.po_value_base_currency, po.payment_due_date,
      po.payment_status, po.approval_status, po.ceo_override, po.manager_ack_at,
      po.created_at, po.created_by,
      COALESCE(NULLIF(pr.contact_person,''), NULLIF(pr.company_name,''),
               'User ' || LEFT(po.created_by::text,6)) AS purchaser_name,
      CASE
        WHEN po.payment_status = 'paid' THEN 'PAID'
        WHEN po.manager_ack_at IS NOT NULL THEN 'FINALIZED'
        WHEN po.ceo_override = true AND po.approval_status = 'pending_ack' THEN 'PENDING_ACK'
        WHEN po.ceo_override = true THEN 'CEO_OVERRIDE'
        WHEN po.approval_status = 'flagged_for_review' THEN 'FLAGGED'
        WHEN po.approval_status = 'pending_ack' THEN 'PENDING_APPROVAL'
        WHEN po.approval_status = 'force_closed' THEN 'FORCE_CLOSED'
        ELSE 'PO_CREATED'
      END AS lifecycle_stage,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid') AS is_overdue
    FROM _scoped_pos po
    LEFT JOIN profiles pr ON pr.id = po.created_by
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'po_id', id, 'po_number', po_number,
      'amount', po_value_base_currency, 'due_date', payment_due_date,
      'created_at', created_at, 'stage', lifecycle_stage,
      'purchaser_id', created_by, 'purchaser', purchaser_name,
      'is_overdue', is_overdue, 'ceo_override', ceo_override
    ) ORDER BY created_at DESC), '[]'::jsonb)
  INTO v_pos
  FROM staged;

  SELECT COALESCE(jsonb_object_agg(stage, cnt), '{}'::jsonb)
  INTO v_stage_counts
  FROM (
    SELECT (elem->>'stage') AS stage, COUNT(*) AS cnt
    FROM jsonb_array_elements(v_pos) elem
    GROUP BY 1
  ) s;

  SELECT COALESCE(jsonb_agg(row_to_json(p)), '[]'::jsonb)
  INTO v_top_purchasers
  FROM (
    SELECT
      (elem->>'purchaser_id') AS purchaser_id,
      (elem->>'purchaser') AS purchaser,
      COUNT(*)::int AS total_pos,
      SUM(COALESCE((elem->>'amount')::numeric,0)) AS total_value,
      SUM(CASE WHEN (elem->>'is_overdue')::boolean THEN 1 ELSE 0 END)::int AS overdue_count,
      SUM(CASE WHEN (elem->>'stage') IN ('PENDING_ACK','PENDING_APPROVAL','FLAGGED') THEN 1 ELSE 0 END)::int AS stuck_count,
      SUM(CASE WHEN (elem->>'ceo_override')::boolean THEN 1 ELSE 0 END)::int AS override_count
    FROM jsonb_array_elements(v_pos) elem
    WHERE (elem->>'purchaser_id') IS NOT NULL
    GROUP BY 1, 2
    ORDER BY stuck_count DESC, overdue_count DESC, total_value DESC
    LIMIT 10
  ) p;
  -- ===== END NEW =====

  v_summary := jsonb_build_object(
    'total_payable', v_total, 'overdue', v_overdue, 'overdue_amount', v_overdue,
    'payable_7d', v_payable_7d, 'po_count', v_po_count, 'base_currency', 'INR',
    'stage_counts', v_stage_counts
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
    'top_purchasers', v_top_purchasers,
    'stage_counts', v_stage_counts,
    'root_causes', jsonb_build_object(
      'denominator', 'overdue',
      'unit', jsonb_build_object('share', 'percentage', 'amount', 'currency'),
      'sample_size', v_overdue_count,
      'min_sample_required', v_min_sample,
      'sufficient_sample', (v_overdue_count >= v_min_sample),
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
    'pos', v_pos,
    'empty', (v_po_count = 0)
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_company_intelligence_v2(uuid) TO authenticated;