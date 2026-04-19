-- Update get_scoped_auctions_by_purchaser to add observability for audit failures
CREATE OR REPLACE FUNCTION public.get_scoped_auctions_by_purchaser(
  p_user_id uuid,
  p_view_as_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  status text,
  total_po_amount numeric,
  currency text,
  delivery_timeline integer,
  created_at timestamp with time zone,
  bid_count integer,
  low_bid numeric,
  high_bid numeric,
  created_by uuid,
  purchaser_id uuid,
  company_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_purchaser uuid;
  v_is_manager boolean;
BEGIN
  -- Determine effective purchaser context
  IF p_view_as_purchaser IS NOT NULL THEN
    -- Verify caller is a manager of the target purchaser
    SELECT EXISTS(
      SELECT 1 FROM company_members cm1
      JOIN company_members cm2 ON cm1.company_id = cm2.company_id
      WHERE cm1.user_id = p_user_id
      AND cm1.role IN ('admin', 'manager')
      AND cm2.user_id = p_view_as_purchaser
    ) INTO v_is_manager;

    IF NOT v_is_manager THEN
      RAISE EXCEPTION 'Insufficient permissions to view as this purchaser';
    END IF;

    v_effective_purchaser := p_view_as_purchaser;
  ELSE
    v_effective_purchaser := p_user_id;
  END IF;

  -- Audit logging (wrapped - never breaks read path)
  BEGIN
    PERFORM public.log_impersonation_read(
      p_user_id,
      v_effective_purchaser,
      'auction'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Do NOT break read path, but record failure for observability
    RAISE LOG 'impersonation_audit_failed: function=%, caller=%, viewed=%, error=%', 
      'log_impersonation_read', 
      p_user_id, 
      v_effective_purchaser, 
      SQLERRM;
  END;

  -- Return auction data scoped strictly to the effective purchaser
  RETURN QUERY
  SELECT 
    po.id,
    po.title,
    po.description,
    po.status::text,
    po.total_amount,
    po.currency,
    po.delivery_timeline_days,
    po.created_at,
    (SELECT COUNT(*)::int FROM bids b WHERE b.requirement_id = req.id) as bid_count,
    (SELECT MIN(b.bid_amount) FROM bids b WHERE b.requirement_id = req.id) as low_bid,
    (SELECT MAX(b.bid_amount) FROM bids b WHERE b.requirement_id = req.id) as high_bid,
    po.created_by,
    pop.purchaser_id,
    po.buyer_company_id as company_id
  FROM purchase_orders po
  JOIN purchase_order_purchasers pop ON po.id = pop.purchase_order_id
  JOIN requirements req ON po.id = req.purchase_order_id
  WHERE pop.purchaser_id = v_effective_purchaser
  AND (p_status IS NULL OR po.status::text = p_status)
  ORDER BY 
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN po.created_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN po.created_at END ASC,
    CASE WHEN p_sort_by = 'total_amount' AND p_sort_order = 'desc' THEN po.total_amount END DESC,
    CASE WHEN p_sort_by = 'total_amount' AND p_sort_order = 'asc' THEN po.total_amount END ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;