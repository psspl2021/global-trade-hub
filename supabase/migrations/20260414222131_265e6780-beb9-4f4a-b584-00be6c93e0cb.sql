
-- 1. Update get_global_buyer_dashboard with pagination support
CREATE OR REPLACE FUNCTION get_global_buyer_dashboard(
  p_company_id uuid,
  p_active_offset int DEFAULT 0,
  p_active_limit int DEFAULT 20,
  p_overdue_offset int DEFAULT 0,
  p_overdue_limit int DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary JSONB;
  v_active JSONB;
  v_overdue JSONB;
  v_compliance JSONB;
  v_active_total int;
  v_overdue_total int;
BEGIN
  -- Summary (always live for accuracy)
  SELECT jsonb_build_object(
    'total_pos', COUNT(*),
    'open_pos', COUNT(*) FILTER (WHERE status NOT IN ('delivered','cancelled','closed','payment_done')),
    'total_value', COALESCE(SUM(po_value), 0),
    'open_payables', COALESCE(SUM(po_value) FILTER (WHERE payment_workflow_status NOT IN ('payment_confirmed','paid')), 0),
    'overdue_count', COUNT(*) FILTER (WHERE effective_due_date < now() AND status NOT IN ('delivered','cancelled','closed','payment_done')),
    'overdue_value', COALESCE(SUM(po_value) FILTER (WHERE effective_due_date < now() AND status NOT IN ('delivered','cancelled','closed','payment_done')), 0),
    'completed_count', COUNT(*) FILTER (WHERE status IN ('delivered','payment_done','closed')),
    'avg_po_value', COALESCE(AVG(po_value), 0)
  ) INTO v_summary
  FROM purchase_orders WHERE buyer_company_id = p_company_id;

  -- Active POs count
  SELECT COUNT(*) INTO v_active_total
  FROM purchase_orders
  WHERE buyer_company_id = p_company_id
    AND status NOT IN ('delivered','cancelled','closed','payment_done');

  -- Active POs with pagination
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_active
  FROM (
    SELECT po.id, po.po_number, po.status::text, po.total_amount, po.currency,
      COALESCE(bs.supplier_name, 'Unknown Supplier') as supplier_name,
      po.created_at, po.expected_delivery_date, po.payment_due_date,
      (po.effective_due_date < now() AND po.status NOT IN ('delivered','cancelled','closed','payment_done')) as is_overdue
    FROM purchase_orders po
    LEFT JOIN buyer_suppliers bs ON bs.id = po.supplier_id
    WHERE po.buyer_company_id = p_company_id
      AND po.status NOT IN ('delivered','cancelled','closed','payment_done')
    ORDER BY po.created_at DESC
    LIMIT p_active_limit OFFSET p_active_offset
  ) t;

  -- Overdue POs count
  SELECT COUNT(*) INTO v_overdue_total
  FROM purchase_orders
  WHERE buyer_company_id = p_company_id
    AND payment_workflow_status != 'payment_confirmed'
    AND status != 'cancelled'
    AND effective_due_date < now();

  -- Overdue POs with pagination
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_overdue
  FROM (
    SELECT po.id, po.po_number, po.status::text, po.total_amount, po.currency,
      COALESCE(bs.supplier_name, 'Unknown Supplier') as supplier_name,
      po.effective_due_date as due_date,
      EXTRACT(DAY FROM now() - po.effective_due_date)::int as days_overdue
    FROM purchase_orders po
    LEFT JOIN buyer_suppliers bs ON bs.id = po.supplier_id
    WHERE po.buyer_company_id = p_company_id
      AND po.payment_workflow_status != 'payment_confirmed'
      AND po.status != 'cancelled'
      AND po.effective_due_date < now()
    ORDER BY po.effective_due_date ASC
    LIMIT p_overdue_limit OFFSET p_overdue_offset
  ) t;

  -- Compliance
  SELECT jsonb_build_object(
    'missing_incoterms', COUNT(*) FILTER (WHERE incoterms IS NULL AND region_type = 'international'),
    'missing_payment_terms', COUNT(*) FILTER (WHERE payment_terms IS NULL),
    'total_active', COUNT(*)
  ) INTO v_compliance
  FROM purchase_orders
  WHERE buyer_company_id = p_company_id
    AND status NOT IN ('delivered','cancelled','closed','payment_done');

  RETURN jsonb_build_object(
    'summary', v_summary,
    'active_pos', v_active,
    'active_pos_total', v_active_total,
    'active_pos_has_more', (p_active_offset + p_active_limit) < v_active_total,
    'overdue_pos', v_overdue,
    'overdue_pos_total', v_overdue_total,
    'overdue_pos_has_more', (p_overdue_offset + p_overdue_limit) < v_overdue_total,
    'compliance', v_compliance
  );
END;
$$;

-- 2. Create a fast KPI function that prefers snapshots
CREATE OR REPLACE FUNCTION get_dashboard_kpi_summary(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot RECORD;
  v_result JSONB;
BEGIN
  -- Try recent snapshot (within last hour)
  SELECT * INTO v_snapshot
  FROM cfo_metrics_snapshots
  WHERE company_id = p_company_id
    AND snapshot_date >= now() - interval '1 hour'
  ORDER BY snapshot_date DESC
  LIMIT 1;

  IF v_snapshot IS NOT NULL THEN
    RETURN jsonb_build_object(
      'source', 'snapshot',
      'snapshot_date', v_snapshot.snapshot_date,
      'total_payable', v_snapshot.total_payable,
      'total_paid', v_snapshot.total_paid,
      'overdue_amount', v_snapshot.overdue_amount,
      'overdue_count', v_snapshot.overdue_count,
      'burn_30d', v_snapshot.burn_30d,
      'vendor_concentration_pct', v_snapshot.vendor_concentration_pct,
      'runway_days', v_snapshot.runway_days
    );
  END IF;

  -- Fallback to live query
  SELECT jsonb_build_object(
    'source', 'live',
    'total_payable', COALESCE(SUM(po_value_base_currency) FILTER (WHERE payment_workflow_status NOT IN ('payment_confirmed','cancelled')), 0),
    'total_paid', COALESCE(SUM(po_value_base_currency) FILTER (WHERE payment_workflow_status = 'payment_confirmed'), 0),
    'overdue_amount', COALESCE(SUM(po_value_base_currency) FILTER (WHERE effective_due_date < now() AND payment_workflow_status NOT IN ('payment_confirmed','cancelled')), 0),
    'overdue_count', COUNT(*) FILTER (WHERE effective_due_date < now() AND payment_workflow_status NOT IN ('payment_confirmed','cancelled'))
  ) INTO v_result
  FROM purchase_orders
  WHERE buyer_company_id = p_company_id;

  RETURN v_result;
END;
$$;
