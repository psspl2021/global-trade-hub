
-- Grant company-wide READ access to ALL company members (including buyer_purchaser).
-- WRITE accountability is preserved separately: new RFQs/auctions are still stamped
-- with the actual creator's purchaser_id at insert time. This change ONLY widens
-- the read scope so every company member sees the full company picture by default.

CREATE OR REPLACE FUNCTION public.get_scoped_rfqs_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL::uuid,
  p_status text DEFAULT NULL::text,
  p_from timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_to timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(id uuid, title text, description text, category text, product_category text, status text, buyer_id uuid, purchaser_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, quantity numeric, unit text, delivery_location text, deadline timestamp with time zone, bidding_deadline_at timestamp with time zone, trade_type text, budget_min numeric, budget_max numeric, target_price numeric, current_lowest_bid numeric, total_bidders integer, auction_type text, customer_name text, destination_country text, destination_state text, has_accepted_bid boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_scope record;
  v_effective_purchaser uuid;
  v_company_wide boolean := false;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  IF v_scope.company_id IS NULL THEN
    RAISE EXCEPTION 'user_not_in_company'
      USING HINT = 'Caller has no active buyer_company_members row.';
  END IF;

  -- All company members (including purchasers) get company-wide view when
  -- no specific purchaser is selected. Filtering by a specific purchaser
  -- still works for any role.
  IF p_selected_purchaser IS NULL THEN
    v_company_wide := true;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
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
    AND (
      v_company_wide
      OR r.purchaser_id = v_effective_purchaser
      OR (r.purchaser_id IS NULL AND r.buyer_id = v_effective_purchaser)
    )
    AND (p_status IS NULL OR r.status::text = p_status)
    AND (p_from IS NULL OR r.created_at >= p_from)
    AND (p_to IS NULL OR r.created_at <= p_to)
  ORDER BY r.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$function$;


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
  v_company_wide boolean := false;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  IF v_scope.company_id IS NULL THEN
    RAISE EXCEPTION 'user_not_in_company'
      USING HINT = 'Caller has no active buyer_company_members row.';
  END IF;

  -- All company members get company-wide read when no purchaser filter is set
  IF p_selected_purchaser IS NULL THEN
    v_company_wide := true;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  -- Audit only when filtering to view a specific other purchaser's data
  IF NOT v_company_wide AND v_effective_purchaser <> p_user_id THEN
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
    AND (v_company_wide OR a.purchaser_id = v_effective_purchaser)
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
