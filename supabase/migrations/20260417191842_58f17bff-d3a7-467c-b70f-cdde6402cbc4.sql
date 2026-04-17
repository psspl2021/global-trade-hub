-- ============================================================
-- CEO PO list: pending approvals + recent overrides
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ceo_purchase_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_company_ids uuid[];
BEGIN
  IF v_actor IS NULL OR NOT public.has_capability(v_actor, 'can_view_all_pos') THEN
    RETURN jsonb_build_object('error', 'FORBIDDEN');
  END IF;

  SELECT array_agg(company_id)
  INTO v_company_ids
  FROM public.user_company_access
  WHERE user_id = v_actor;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', po.id,
      'po_number', po.po_number,
      'po_value', po.po_value_base_currency,
      'currency', 'INR',
      'created_at', po.created_at,
      'payment_due_date', po.payment_due_date,
      'payment_status', po.payment_status,
      'approval_status', po.approval_status,
      'approval_required', po.approval_required,
      'manager_approved_at', po.manager_approved_at,
      'manager_approved_by', po.manager_approved_by,
      'ceo_override', COALESCE(po.ceo_override, false),
      'ceo_override_by', po.ceo_override_by,
      'ceo_override_reason', po.ceo_override_reason,
      'ceo_override_at', po.ceo_override_at,
      'manager_ack_at', po.manager_ack_at,
      'supplier_name', COALESCE(
        NULLIF(p.company_name,''), NULLIF(p.contact_person,''),
        NULLIF(po.vendor_name,''), 'Vendor ' || LEFT(po.supplier_id::text,6)
      ),
      'created_by_name', COALESCE(
        NULLIF(c.contact_person,''), NULLIF(c.company_name,''),
        'User ' || LEFT(po.created_by::text,6)
      )
    ) ORDER BY po.created_at DESC)
    FROM public.purchase_orders po
    LEFT JOIN public.profiles p ON p.id = po.supplier_id
    LEFT JOIN public.profiles c ON c.id = po.created_by
    WHERE po.buyer_company_id = ANY(v_company_ids)
  ), '[]'::jsonb);
END;
$$;

-- ============================================================
-- CEO auctions: list all with leaderboard summary
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ceo_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_actor IS NULL OR NOT public.has_capability(v_actor, 'can_view_all_auctions') THEN
    RETURN jsonb_build_object('error', 'FORBIDDEN');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ra.id,
    'title', ra.title,
    'status', ra.status,
    'starts_at', ra.starts_at,
    'ends_at', ra.ends_at,
    'reserve_price', ra.reserve_price,
    'current_lowest_bid', ra.current_lowest_bid,
    'total_bids', (SELECT COUNT(*) FROM public.auction_bids ab WHERE ab.auction_id = ra.id),
    'unique_suppliers', (SELECT COUNT(DISTINCT supplier_id) FROM public.auction_bids ab WHERE ab.auction_id = ra.id)
  ) ORDER BY ra.starts_at DESC NULLS LAST), '[]'::jsonb)
  INTO v_result
  FROM public.reverse_auctions ra;

  PERFORM public.log_governance_action('view_auction_list', 'auction_list', NULL, NULL, '{}'::jsonb);

  RETURN v_result;
END;
$$;

-- ============================================================
-- CEO RFQs: list all forward RFQs with quote summary
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ceo_rfqs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_actor IS NULL OR NOT public.has_capability(v_actor, 'can_view_all_quotes') THEN
    RETURN jsonb_build_object('error', 'FORBIDDEN');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'title', r.title,
    'category', r.category,
    'status', r.status,
    'created_at', r.created_at,
    'bid_count', (SELECT COUNT(*) FROM public.bids b WHERE b.requirement_id = r.id),
    'lowest_bid', (SELECT MIN(b.buyer_visible_price) FROM public.bids b WHERE b.requirement_id = r.id),
    'highest_bid', (SELECT MAX(b.buyer_visible_price) FROM public.bids b WHERE b.requirement_id = r.id),
    'awarded', EXISTS (SELECT 1 FROM public.bids b WHERE b.requirement_id = r.id AND b.status = 'awarded')
  ) ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO v_result
  FROM public.requirements r;

  PERFORM public.log_governance_action('view_rfq_list', 'rfq_list', NULL, NULL, '{}'::jsonb);

  RETURN v_result;
END;
$$;