-- Fix get_ceo_auctions: use correct column names (auction_start, auction_end)
-- and stop logging noisy list-view actions on every page load.

CREATE OR REPLACE FUNCTION public.get_ceo_auctions()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_company_id uuid;
  v_result jsonb;
BEGIN
  IF v_actor IS NULL OR NOT public.has_capability(v_actor, 'can_view_all_auctions') THEN
    RETURN jsonb_build_object('error', 'FORBIDDEN');
  END IF;

  SELECT company_id INTO v_company_id
  FROM public.buyer_company_members
  WHERE user_id = v_actor AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ra.id,
    'title', ra.title,
    'status', ra.status,
    'starts_at', ra.auction_start,
    'ends_at', ra.auction_end,
    'reserve_price', ra.reserve_price,
    'current_lowest_bid', ra.current_price,
    'total_bids', (SELECT COUNT(*) FROM public.auction_bids ab WHERE ab.auction_id = ra.id),
    'unique_suppliers', (SELECT COUNT(DISTINCT supplier_id) FROM public.auction_bids ab WHERE ab.auction_id = ra.id)
  ) ORDER BY ra.auction_start DESC NULLS LAST), '[]'::jsonb)
  INTO v_result
  FROM public.reverse_auctions ra
  WHERE ra.company_id = v_company_id
     OR ra.buyer_id IN (SELECT user_id FROM public.buyer_company_members WHERE company_id = v_company_id AND is_active = true);

  RETURN v_result;
END;
$function$;

-- Remove noisy list-view logging from get_ceo_rfqs (still logs sensitive actions elsewhere)
CREATE OR REPLACE FUNCTION public.get_ceo_rfqs()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_company_id uuid;
  v_result jsonb;
BEGIN
  IF v_actor IS NULL OR NOT public.has_capability(v_actor, 'can_view_all_quotes') THEN
    RETURN jsonb_build_object('error', 'FORBIDDEN');
  END IF;

  SELECT company_id INTO v_company_id
  FROM public.buyer_company_members
  WHERE user_id = v_actor AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'title', r.title,
    'category', r.product_category,
    'status', r.status,
    'created_at', r.created_at,
    'bid_count', (SELECT COUNT(*) FROM public.bids b WHERE b.requirement_id = r.id),
    'lowest_bid', (SELECT MIN(b.buyer_visible_price) FROM public.bids b WHERE b.requirement_id = r.id),
    'highest_bid', (SELECT MAX(b.buyer_visible_price) FROM public.bids b WHERE b.requirement_id = r.id),
    'awarded', EXISTS (SELECT 1 FROM public.bids b WHERE b.requirement_id = r.id AND b.awarded_at IS NOT NULL)
  ) ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO v_result
  FROM public.requirements r
  WHERE r.buyer_id IN (
    SELECT user_id FROM public.buyer_company_members
    WHERE company_id = v_company_id AND is_active = true
  );

  RETURN v_result;
END;
$function$;