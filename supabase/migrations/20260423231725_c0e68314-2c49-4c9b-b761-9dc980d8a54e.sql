-- ============================================================
-- CAPABILITY MATRIX HARDENING (Approach A)
-- Visibility: company-wide read for purchasers (explicit)
-- Control:    edit/approve/close/award gated by capability
-- Enforcement: hard checks in critical RPCs
-- ============================================================

-- 1) Define + grant new capabilities
INSERT INTO public.role_capabilities (role, capability, granted) VALUES
  -- Purchaser: explicit company-wide READ (matches recently-opened RPCs)
  ('buyer_purchaser', 'can_view_company_rfqs',     true),
  ('buyer_purchaser', 'can_view_company_auctions', true),
  ('buyer_purchaser', 'can_view_company_pos',      true),
  ('purchaser',       'can_view_company_rfqs',     true),
  ('purchaser',       'can_view_company_auctions', true),
  ('purchaser',       'can_view_company_pos',      true),

  -- Manager / Executives: explicit CONTROL capabilities
  ('buyer_manager',       'can_edit_any_rfq',     true),
  ('buyer_manager',       'can_close_auction',    true),
  ('buyer_manager',       'can_award_auction',    true),
  ('buyer_manager',       'can_view_company_rfqs',     true),
  ('buyer_manager',       'can_view_company_auctions', true),
  ('buyer_manager',       'can_view_company_pos',      true),

  ('manager',             'can_edit_any_rfq',     true),
  ('manager',             'can_close_auction',    true),
  ('manager',             'can_award_auction',    true),

  ('buyer_purchase_head', 'can_edit_any_rfq',     true),
  ('buyer_purchase_head', 'can_close_auction',    true),
  ('buyer_purchase_head', 'can_award_auction',    true),
  ('buyer_purchase_head', 'can_override_pricing', true),
  ('buyer_purchase_head', 'can_view_company_rfqs',     true),
  ('buyer_purchase_head', 'can_view_company_auctions', true),
  ('buyer_purchase_head', 'can_view_company_pos',      true),
  ('buyer_purchase_head', 'can_view_management_dashboard', true),
  ('buyer_purchase_head', 'can_view_purchaser_leaderboard', true),

  ('buyer_vp',            'can_edit_any_rfq',     true),
  ('buyer_vp',            'can_close_auction',    true),
  ('buyer_vp',            'can_award_auction',    true),
  ('buyer_vp',            'can_override_pricing', true),
  ('buyer_vp',            'can_view_company_rfqs',     true),
  ('buyer_vp',            'can_view_company_auctions', true),
  ('buyer_vp',            'can_view_company_pos',      true),
  ('buyer_vp',            'can_view_management_dashboard', true),
  ('buyer_vp',            'can_view_purchaser_leaderboard', true),

  ('buyer_ceo', 'can_edit_any_rfq',     true),
  ('buyer_ceo', 'can_close_auction',    true),
  ('buyer_ceo', 'can_award_auction',    true),
  ('buyer_ceo', 'can_override_pricing', true),
  ('buyer_ceo', 'can_view_company_rfqs',     true),
  ('buyer_ceo', 'can_view_company_auctions', true),
  ('buyer_ceo', 'can_view_company_pos',      true),

  ('buyer_cfo', 'can_view_company_rfqs',     true),
  ('buyer_cfo', 'can_view_company_auctions', true),
  ('buyer_cfo', 'can_view_company_pos',      true),
  ('buyer_cfo', 'can_override_pricing', true),

  ('ceo', 'can_edit_any_rfq',     true),
  ('ceo', 'can_close_auction',    true),
  ('ceo', 'can_award_auction',    true),
  ('ceo', 'can_override_pricing', true),

  ('cfo', 'can_override_pricing', true),

  ('admin',       'can_edit_any_rfq',     true),
  ('admin',       'can_close_auction',    true),
  ('admin',       'can_award_auction',    true),
  ('admin',       'can_override_pricing', true),
  ('buyer_admin', 'can_edit_any_rfq',     true),
  ('buyer_admin', 'can_close_auction',    true),
  ('buyer_admin', 'can_award_auction',    true)
ON CONFLICT (role, capability) DO UPDATE SET granted = EXCLUDED.granted;

-- 2) Harden award_reverse_auction with capability check
CREATE OR REPLACE FUNCTION public.award_reverse_auction(p_auction_id uuid, p_winner_supplier_id uuid)
 RETURNS reverse_auctions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.reverse_auctions;
  v_winning_price numeric;
  v_bid_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  -- Owner OR explicit capability holder may award
  IF NOT public.has_capability(auth.uid(), 'can_award_auction') THEN
    PERFORM public._assert_auction_owner(p_auction_id, auth.uid());
  END IF;

  SELECT id, bid_price INTO v_bid_id, v_winning_price
  FROM public.reverse_auction_bids
  WHERE auction_id = p_auction_id AND supplier_id = p_winner_supplier_id
  ORDER BY bid_price ASC
  LIMIT 1;

  IF v_bid_id IS NULL THEN
    RAISE EXCEPTION 'supplier_has_no_bid' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.reverse_auction_bids SET is_winning = true WHERE id = v_bid_id;

  UPDATE public.reverse_auctions
  SET winner_supplier_id = p_winner_supplier_id,
      winning_price = v_winning_price,
      status = 'completed',
      auction_end = now(),
      updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;