-- Defense-in-depth: refuse scoped reads when caller has no company membership.
-- Affects: get_scoped_auctions_by_purchaser, get_scoped_rfqs_by_purchaser,
--          get_scoped_pos_by_purchaser, get_scoped_logistics_by_purchaser.

CREATE OR REPLACE FUNCTION public.get_scoped_auctions_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL::uuid,
  p_status text DEFAULT NULL::text,
  p_from timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_to timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_has_winner boolean DEFAULT NULL::boolean,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS SETOF reverse_auctions
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_scope record;
  v_effective_purchaser uuid;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  -- HARD GUARD: no company membership → no data, no fallback.
  IF v_scope.company_id IS NULL THEN
    RAISE EXCEPTION 'user_not_in_company'
      USING HINT = 'Caller has no active buyer_company_members row.';
  END IF;

  IF v_scope.is_self_only THEN
    v_effective_purchaser := p_user_id;
  ELSIF v_scope.is_management THEN
    v_effective_purchaser := COALESCE(p_selected_purchaser, p_user_id);
  ELSE
    v_effective_purchaser := p_user_id;
  END IF;

  IF v_effective_purchaser <> p_user_id AND NOT v_scope.is_self_only THEN
    BEGIN
      PERFORM public.log_impersonation_read(p_user_id, v_effective_purchaser, 'auction');
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'impersonation_audit_failed (auction): caller=%, viewed=%, error=%',
        p_user_id, v_effective_purchaser, SQLERRM;
    END;
  END IF;

  RETURN QUERY
  SELECT a.* FROM public.reverse_auctions a
  WHERE a.company_id = v_scope.company_id
    AND a.purchaser_id = v_effective_purchaser
    AND (p_status IS NULL OR a.status = p_status)
    AND (p_from IS NULL OR a.created_at >= p_from)
    AND (p_to IS NULL OR a.created_at <= p_to)
    AND (p_has_winner IS NULL
         OR (p_has_winner = true AND a.winner_supplier_id IS NOT NULL)
         OR (p_has_winner = false AND a.winner_supplier_id IS NULL))
  ORDER BY a.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_scoped_rfqs_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL::uuid,
  p_status text DEFAULT NULL::text,
  p_from timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_to timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, title text, description text, category text, product_category text,
  status text, buyer_id uuid, purchaser_id uuid, created_at timestamp with time zone,
  updated_at timestamp with time zone, quantity numeric, unit text,
  delivery_location text, deadline timestamp with time zone,
  bidding_deadline_at timestamp with time zone, trade_type text,
  budget_min numeric, budget_max numeric, target_price numeric,
  current_lowest_bid numeric, total_bidders integer, auction_type text,
  customer_name text, destination_country text, destination_state text,
  has_accepted_bid boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_scope record;
  v_effective_purchaser uuid;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  IF v_scope.company_id IS NULL THEN
    RAISE EXCEPTION 'user_not_in_company'
      USING HINT = 'Caller has no active buyer_company_members row.';
  END IF;

  IF v_scope.is_self_only THEN
    v_effective_purchaser := p_user_id;
  ELSIF v_scope.is_management THEN
    v_effective_purchaser := COALESCE(p_selected_purchaser, p_user_id);
  ELSE
    v_effective_purchaser := p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    r.id, r.title, r.description,
    r.product_category::text, r.product_category::text,
    r.status::text, r.buyer_id, r.purchaser_id,
    r.created_at, r.updated_at,
    r.quantity, r.unit, r.delivery_location,
    r.deadline, r.bidding_deadline_at,
    r.trade_type, r.budget_min, r.budget_max, r.target_price,
    r.current_lowest_bid, r.total_bidders, r.auction_type,
    r.customer_name, r.destination_country, r.destination_state,
    EXISTS (SELECT 1 FROM public.bids b WHERE b.requirement_id = r.id AND b.status = 'accepted')
  FROM public.requirements r
  WHERE EXISTS (
      SELECT 1 FROM public.buyer_company_members m
      WHERE m.company_id = v_scope.company_id
        AND m.user_id = r.buyer_id
        AND m.is_active = true
    )
    AND (r.purchaser_id = v_effective_purchaser
         OR (r.purchaser_id IS NULL AND r.buyer_id = v_effective_purchaser))
    AND (p_status IS NULL OR r.status::text = p_status)
    AND (p_from IS NULL OR r.created_at >= p_from)
    AND (p_to IS NULL OR r.created_at <= p_to)
  ORDER BY r.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_scoped_pos_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL::uuid
)
RETURNS SETOF purchase_orders
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_scope record;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  -- HARD GUARD: PO data is company-scoped. No company → no data.
  IF v_scope.company_id IS NULL THEN
    RAISE EXCEPTION 'user_not_in_company'
      USING HINT = 'Caller has no active buyer_company_members row.';
  END IF;

  IF v_scope.is_self_only THEN
    RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE po.purchaser_id = p_user_id
        AND EXISTS (
          SELECT 1 FROM public.buyer_company_members m
          WHERE m.user_id = po.purchaser_id
            AND m.company_id = v_scope.company_id
            AND m.is_active = true
        )
      ORDER BY po.created_at DESC;
    RETURN;
  END IF;

  IF p_selected_purchaser IS NOT NULL THEN
    RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE po.purchaser_id = p_selected_purchaser
        AND EXISTS (
          SELECT 1 FROM public.buyer_company_members m
          WHERE m.user_id = po.purchaser_id
            AND m.company_id = v_scope.company_id
            AND m.is_active = true
        )
      ORDER BY po.created_at DESC;
  ELSE
    RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.user_id = po.purchaser_id
          AND m.company_id = v_scope.company_id
          AND m.is_active = true
      )
      ORDER BY po.created_at DESC;
  END IF;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_scoped_logistics_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL::uuid,
  p_status text DEFAULT NULL::text,
  p_from timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_to timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, po_number text, vendor_name text, status text,
  total_amount numeric, currency text, order_date timestamp with time zone,
  buyer_id uuid, purchaser_id uuid, created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_scope record;
  v_effective_purchaser uuid;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  IF v_scope.company_id IS NULL THEN
    RAISE EXCEPTION 'user_not_in_company'
      USING HINT = 'Caller has no active buyer_company_members row.';
  END IF;

  IF v_scope.is_self_only THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.po_number, p.vendor_name, p.status,
    p.total_amount, COALESCE(p.currency, 'INR') AS currency,
    p.order_date, p.buyer_id, p.purchaser_id,
    p.created_at, p.updated_at
  FROM public.purchase_orders p
  WHERE EXISTS (
      SELECT 1 FROM public.buyer_company_members m
      WHERE m.company_id = v_scope.company_id
        AND m.user_id = p.buyer_id
        AND m.is_active = true
    )
    AND (v_effective_purchaser IS NULL
         OR p.purchaser_id = v_effective_purchaser
         OR (p.purchaser_id IS NULL AND p.buyer_id = v_effective_purchaser))
    AND (p_status IS NULL OR p.status = p_status)
    AND (p_from IS NULL OR p.created_at >= p_from)
    AND (p_to IS NULL OR p.created_at <= p_to)
  ORDER BY p.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$function$;