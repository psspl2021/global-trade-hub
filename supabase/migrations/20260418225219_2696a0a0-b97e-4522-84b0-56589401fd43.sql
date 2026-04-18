DROP FUNCTION IF EXISTS public.get_scoped_rfqs_by_purchaser(uuid, uuid, text, timestamp with time zone, timestamp with time zone, integer, integer);

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
  id uuid,
  title text,
  description text,
  category text,
  product_category text,
  status text,
  buyer_id uuid,
  purchaser_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  quantity numeric,
  unit text,
  delivery_location text,
  deadline timestamp with time zone,
  bidding_deadline_at timestamp with time zone,
  trade_type text,
  budget_min numeric,
  budget_max numeric,
  target_price numeric,
  current_lowest_bid numeric,
  total_bidders integer,
  auction_type text,
  customer_name text,
  destination_country text,
  destination_state text,
  has_accepted_bid boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_role text;
  v_company_id uuid;
  v_effective_purchaser uuid;
  v_is_management boolean := false;
BEGIN
  SELECT bcm.role, bcm.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = p_user_id AND bcm.is_active = true
  LIMIT 1;

  v_is_management := v_caller_role IN ('owner','admin','manager','director','cfo','buyer_admin');

  IF v_caller_role IN ('purchaser','buyer_purchaser') THEN
    v_effective_purchaser := p_user_id;
  ELSIF v_is_management THEN
    v_effective_purchaser := COALESCE(p_selected_purchaser, p_user_id);
  ELSE
    v_effective_purchaser := p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.product_category::text AS category,
    r.product_category::text AS product_category,
    r.status::text,
    r.buyer_id,
    r.purchaser_id,
    r.created_at,
    r.updated_at,
    r.quantity,
    r.unit,
    r.delivery_location,
    r.deadline,
    r.bidding_deadline_at,
    r.trade_type,
    r.budget_min,
    r.budget_max,
    r.target_price,
    r.current_lowest_bid,
    r.total_bidders,
    r.auction_type,
    r.customer_name,
    r.destination_country,
    r.destination_state,
    EXISTS (SELECT 1 FROM public.bids b WHERE b.requirement_id = r.id AND b.status = 'accepted') AS has_accepted_bid
  FROM public.requirements r
  WHERE (
      (v_company_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.company_id = v_company_id AND m.user_id = r.buyer_id AND m.is_active = true
      ))
      OR r.buyer_id = p_user_id
      OR r.purchaser_id = p_user_id
    )
    AND (r.purchaser_id = v_effective_purchaser
         OR (r.purchaser_id IS NULL AND r.buyer_id = v_effective_purchaser))
    AND (p_status IS NULL OR r.status::text = p_status)
    AND (p_from   IS NULL OR r.created_at >= p_from)
    AND (p_to     IS NULL OR r.created_at <= p_to)
  ORDER BY r.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$function$;