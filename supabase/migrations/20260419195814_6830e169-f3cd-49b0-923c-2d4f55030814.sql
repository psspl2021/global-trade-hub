-- =============================================================
-- PHASE 1: Multi-actor governance hardening
-- =============================================================

-- ---------------------------------------------------------------
-- 1) Centralized scope helper — single source of truth for role
--    classification. Every scoped RPC uses this from now on.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_scope(p_user_id uuid)
RETURNS TABLE (
  company_id uuid,
  role text,
  is_self_only boolean,
  is_management boolean,
  is_executive boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
  v_role text;
BEGIN
  SELECT m.company_id, m.role
    INTO v_company, v_role
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id
    AND m.is_active = true
  ORDER BY m.created_at ASC
  LIMIT 1;

  RETURN QUERY SELECT
    v_company,
    v_role,
    (LOWER(COALESCE(v_role,'')) IN ('purchaser','buyer_purchaser','buyer'))                       AS is_self_only,
    (LOWER(COALESCE(v_role,'')) IN (
       'owner','admin','manager','director','cfo','ceo','hr',
       'buyer_admin','buyer_manager','buyer_director','buyer_cfo','buyer_ceo','buyer_hr'
     ))                                                                                            AS is_management,
    (LOWER(COALESCE(v_role,'')) IN ('owner','ceo','buyer_ceo','admin','buyer_admin'))             AS is_executive;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_scope(uuid) TO authenticated;

-- ---------------------------------------------------------------
-- 2) Drop duplicate 4-arg approve_po_step overload
--    (postgres was returning ambiguous-function errors when both
--    the 4-arg and 6-arg versions existed). The 6-arg version is
--    canonical and remains.
-- ---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.approve_po_step(uuid, text, uuid, text);

-- ---------------------------------------------------------------
-- 3) Refactor scoped RPCs to use get_user_scope.
--    BEHAVIOUR IS PRESERVED. Only the role classification logic
--    is centralized — every WHERE clause and column list is identical
--    to the existing implementation.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_scoped_auctions_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_has_winner boolean DEFAULT NULL,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.reverse_auctions
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_scope record;
  v_effective_purchaser uuid;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  IF v_scope.is_self_only THEN
    v_effective_purchaser := p_user_id;
  ELSIF v_scope.is_management THEN
    v_effective_purchaser := COALESCE(p_selected_purchaser, p_user_id);
  ELSE
    v_effective_purchaser := p_user_id;
  END IF;

  -- Non-blocking impersonation audit
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
  WHERE (
      (v_scope.company_id IS NOT NULL AND a.company_id = v_scope.company_id)
      OR (v_scope.company_id IS NULL AND a.buyer_id = p_user_id)
    )
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
$$;

CREATE OR REPLACE FUNCTION public.get_scoped_rfqs_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid, title text, description text, category text, product_category text,
  status text, buyer_id uuid, purchaser_id uuid,
  created_at timestamptz, updated_at timestamptz,
  quantity numeric, unit text, delivery_location text,
  deadline timestamptz, bidding_deadline_at timestamptz,
  trade_type text, budget_min numeric, budget_max numeric, target_price numeric,
  current_lowest_bid numeric, total_bidders integer, auction_type text,
  customer_name text, destination_country text, destination_state text,
  has_accepted_bid boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_scope record;
  v_effective_purchaser uuid;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

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
  WHERE (
      (v_scope.company_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.company_id = v_scope.company_id AND m.user_id = r.buyer_id AND m.is_active = true
      ))
      OR r.buyer_id = p_user_id
      OR r.purchaser_id = p_user_id
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
$$;

CREATE OR REPLACE FUNCTION public.get_scoped_logistics_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid, po_number text, vendor_name text, status text,
  total_amount numeric, currency text, order_date timestamptz,
  buyer_id uuid, purchaser_id uuid,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_scope record;
  v_effective_purchaser uuid;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  IF v_scope.is_self_only THEN
    v_effective_purchaser := p_user_id;
  ELSE
    -- Logistics: management can leave purchaser unselected to see all
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.po_number, p.vendor_name, p.status,
    p.total_amount, COALESCE(p.currency, 'INR') AS currency,
    p.order_date, p.buyer_id, p.purchaser_id,
    p.created_at, p.updated_at
  FROM public.purchase_orders p
  WHERE (
      (v_scope.company_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.company_id = v_scope.company_id
          AND m.user_id = p.buyer_id
          AND m.is_active = true
      ))
      OR p.buyer_id = p_user_id
      OR p.purchaser_id = p_user_id
      OR p.supplier_id = p_user_id
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
$$;

CREATE OR REPLACE FUNCTION public.get_scoped_pos_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL
)
RETURNS SETOF public.purchase_orders
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_scope record;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  -- No company → solo buyer, only own POs
  IF v_scope.company_id IS NULL THEN
    RETURN QUERY
      SELECT * FROM public.purchase_orders
      WHERE purchaser_id = p_user_id
      ORDER BY created_at DESC;
    RETURN;
  END IF;

  -- Self-only role → forced self
  IF v_scope.is_self_only THEN
    RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE po.purchaser_id = p_user_id
      ORDER BY po.created_at DESC;
    RETURN;
  END IF;

  -- Management → optional purchaser filter
  IF p_selected_purchaser IS NOT NULL THEN
    RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE po.purchaser_id = p_selected_purchaser
        AND EXISTS (
          SELECT 1 FROM public.buyer_company_members m
          WHERE m.user_id = po.purchaser_id
            AND m.company_id = v_scope.company_id
        )
      ORDER BY po.created_at DESC;
  ELSE
    RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.user_id = po.purchaser_id
          AND m.company_id = v_scope.company_id
      )
      ORDER BY po.created_at DESC;
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- 4) Purchaser leaderboard — management-only intelligence layer
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_purchaser_leaderboard(
  p_user_id uuid,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  purchaser_id uuid,
  display_name text,
  role text,
  total_auctions bigint,
  completed_auctions bigint,
  total_savings numeric,
  avg_savings_pct numeric,
  total_pos bigint,
  avg_quality_score numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_scope record;
BEGIN
  SELECT * INTO v_scope FROM public.get_user_scope(p_user_id);

  IF v_scope.company_id IS NULL THEN
    RAISE EXCEPTION 'no_company';
  END IF;

  IF NOT v_scope.is_management THEN
    RAISE EXCEPTION 'forbidden: leaderboard requires management role';
  END IF;

  RETURN QUERY
  WITH members AS (
    SELECT m.user_id, m.role,
           COALESCE(NULLIF(p.contact_person,''), NULLIF(p.company_name,''), p.email, 'Unknown') AS display_name
    FROM public.buyer_company_members m
    LEFT JOIN public.profiles p ON p.id = m.user_id
    WHERE m.company_id = v_scope.company_id
      AND m.is_active = true
  ),
  auc AS (
    SELECT
      a.purchaser_id,
      COUNT(*)::bigint AS total_auctions,
      COUNT(*) FILTER (WHERE a.winner_supplier_id IS NOT NULL)::bigint AS completed_auctions,
      COALESCE(SUM(
        CASE WHEN a.winner_supplier_id IS NOT NULL AND a.starting_price IS NOT NULL AND a.winning_price IS NOT NULL
             THEN GREATEST(a.starting_price - a.winning_price, 0)
             ELSE 0 END
      ), 0)::numeric AS total_savings,
      AVG(
        CASE WHEN a.winner_supplier_id IS NOT NULL AND a.starting_price > 0 AND a.winning_price IS NOT NULL
             THEN ((a.starting_price - a.winning_price) / a.starting_price) * 100.0
             ELSE NULL END
      )::numeric AS avg_savings_pct
    FROM public.reverse_auctions a
    WHERE a.company_id = v_scope.company_id
      AND a.purchaser_id IS NOT NULL
      AND (p_from IS NULL OR a.created_at >= p_from)
      AND (p_to   IS NULL OR a.created_at <= p_to)
    GROUP BY a.purchaser_id
  ),
  pos AS (
    SELECT
      po.purchaser_id,
      COUNT(*)::bigint AS total_pos,
      AVG(po.auction_quality_score)::numeric AS avg_quality_score
    FROM public.purchase_orders po
    WHERE po.purchaser_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.user_id = po.purchaser_id
          AND m.company_id = v_scope.company_id
      )
      AND (p_from IS NULL OR po.created_at >= p_from)
      AND (p_to   IS NULL OR po.created_at <= p_to)
    GROUP BY po.purchaser_id
  )
  SELECT
    mem.user_id AS purchaser_id,
    mem.display_name,
    mem.role,
    COALESCE(auc.total_auctions, 0)     AS total_auctions,
    COALESCE(auc.completed_auctions, 0) AS completed_auctions,
    COALESCE(auc.total_savings, 0)      AS total_savings,
    COALESCE(auc.avg_savings_pct, 0)    AS avg_savings_pct,
    COALESCE(pos.total_pos, 0)          AS total_pos,
    COALESCE(pos.avg_quality_score, 0)  AS avg_quality_score
  FROM members mem
  LEFT JOIN auc ON auc.purchaser_id = mem.user_id
  LEFT JOIN pos ON pos.purchaser_id = mem.user_id
  ORDER BY COALESCE(auc.total_savings, 0) DESC, COALESCE(auc.total_auctions, 0) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_purchaser_leaderboard(uuid, timestamptz, timestamptz) TO authenticated;

-- ---------------------------------------------------------------
-- 5) Seed missing capabilities for governance UI gating
-- ---------------------------------------------------------------
INSERT INTO public.role_capabilities (role, capability, granted) VALUES
  -- Leaderboard
  ('ceo','can_view_purchaser_leaderboard',true),
  ('cfo','can_view_purchaser_leaderboard',true),
  ('director','can_view_purchaser_leaderboard',true),
  ('manager','can_view_purchaser_leaderboard',true),
  ('admin','can_view_purchaser_leaderboard',true),
  ('buyer_ceo','can_view_purchaser_leaderboard',true),
  ('buyer_cfo','can_view_purchaser_leaderboard',true),
  ('buyer_manager','can_view_purchaser_leaderboard',true),
  ('buyer_admin','can_view_purchaser_leaderboard',true),
  -- Purchaser switcher
  ('ceo','can_switch_purchaser',true),
  ('cfo','can_switch_purchaser',true),
  ('director','can_switch_purchaser',true),
  ('manager','can_switch_purchaser',true),
  ('admin','can_switch_purchaser',true),
  ('hr','can_switch_purchaser',true),
  ('buyer_ceo','can_switch_purchaser',true),
  ('buyer_cfo','can_switch_purchaser',true),
  ('buyer_manager','can_switch_purchaser',true),
  ('buyer_admin','can_switch_purchaser',true),
  ('buyer_hr','can_switch_purchaser',true),
  -- Management dashboard
  ('ceo','can_view_management_dashboard',true),
  ('cfo','can_view_management_dashboard',true),
  ('director','can_view_management_dashboard',true),
  ('manager','can_view_management_dashboard',true),
  ('admin','can_view_management_dashboard',true),
  ('hr','can_view_management_dashboard',true),
  ('buyer_ceo','can_view_management_dashboard',true),
  ('buyer_cfo','can_view_management_dashboard',true),
  ('buyer_manager','can_view_management_dashboard',true),
  ('buyer_admin','can_view_management_dashboard',true),
  ('buyer_hr','can_view_management_dashboard',true)
ON CONFLICT (role, capability) DO UPDATE SET granted = EXCLUDED.granted;