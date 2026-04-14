-- 1. Fix the broken ERP trigger to use correct enum value
CREATE OR REPLACE FUNCTION trigger_erp_sync_on_payment_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'payment_done' AND (OLD.status IS DISTINCT FROM 'payment_done') THEN
    INSERT INTO erp_sync_queue (entity_type, entity_id, sync_action, payload)
    VALUES (
      'purchase_order',
      NEW.id,
      'payment_confirmed',
      jsonb_build_object(
        'po_number', NEW.po_number,
        'total_amount', NEW.total_amount,
        'currency', NEW.currency,
        'paid_at', now()
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Add trigger-maintained effective_due_date
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS effective_due_date TIMESTAMPTZ;

-- 3. Backfill
UPDATE purchase_orders
SET effective_due_date = COALESCE(payment_due_date, expected_delivery_date);

-- 4. Sync trigger
CREATE OR REPLACE FUNCTION sync_effective_due_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.effective_due_date := COALESCE(NEW.payment_due_date, NEW.expected_delivery_date);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_effective_due_date ON purchase_orders;
CREATE TRIGGER trg_sync_effective_due_date
BEFORE INSERT OR UPDATE OF payment_due_date, expected_delivery_date
ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION sync_effective_due_date();

-- 5. Performance index
CREATE INDEX IF NOT EXISTS idx_po_effective_due_date
ON purchase_orders (effective_due_date)
WHERE payment_workflow_status != 'payment_confirmed'
  AND status != 'cancelled';

-- 6. Supplier lookup index
CREATE INDEX IF NOT EXISTS idx_po_supplier_id ON purchase_orders(supplier_id);

-- 7. Updated RPC with proper enum values + supplier joins
CREATE OR REPLACE FUNCTION get_global_buyer_dashboard(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary JSONB;
  v_active JSONB;
  v_overdue JSONB;
  v_compliance JSONB;
BEGIN
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
    ORDER BY po.created_at DESC LIMIT 20
  ) t;

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
    ORDER BY po.effective_due_date ASC LIMIT 15
  ) t;

  SELECT jsonb_build_object(
    'missing_incoterms', COUNT(*) FILTER (WHERE incoterms IS NULL AND region_type = 'international'),
    'missing_payment_terms', COUNT(*) FILTER (WHERE payment_terms IS NULL),
    'total_active', COUNT(*)
  ) INTO v_compliance
  FROM purchase_orders
  WHERE buyer_company_id = p_company_id
    AND status NOT IN ('delivered','cancelled','closed','payment_done');

  RETURN jsonb_build_object(
    'summary', v_summary, 'active_pos', v_active,
    'overdue_pos', v_overdue, 'compliance', v_compliance
  );
END;
$$;