-- Composite index for company + status + recency filtering
CREATE INDEX IF NOT EXISTS idx_auctions_company_status_created
  ON public.reverse_auctions(company_id, status, created_at DESC);

-- =====================================================================
-- Fixed: get_scoped_auctions_by_purchaser
-- Auction → purchaser ownership flows through requirements (RFQ).
-- Strict company boundary: no buyer_id fallback when company_id exists.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_scoped_auctions_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_has_winner boolean DEFAULT NULL,
  p_limit int DEFAULT 200,
  p_offset int DEFAULT 0
)
RETURNS SETOF public.reverse_auctions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_company_id uuid;
  v_effective_purchaser uuid;
BEGIN
  -- Resolve caller's company + role
  SELECT m.company_id, m.role
    INTO v_company_id, v_caller_role
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id
    AND m.is_active = true
  ORDER BY m.created_at ASC
  LIMIT 1;

  -- DB-enforced: purchasers can only ever see themselves
  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  -- Audit only when a manager views someone else's data (not on every poll)
  IF v_effective_purchaser IS NOT NULL
     AND v_effective_purchaser <> p_user_id
     AND v_caller_role <> 'purchaser' THEN
    PERFORM public.log_impersonation_read(
      p_user_id,
      v_effective_purchaser,
      'auction'
    );
  END IF;

  RETURN QUERY
  SELECT a.*
  FROM public.reverse_auctions a
  WHERE
    -- Strict company boundary
    (
      (v_company_id IS NOT NULL AND a.company_id = v_company_id)
      OR
      -- Only used when user has no company membership at all (solo buyer)
      (v_company_id IS NULL AND a.buyer_id = p_user_id)
    )
    -- Purchaser scope flows through RFQ ownership
    AND (
      v_effective_purchaser IS NULL
      OR EXISTS (
        SELECT 1 FROM public.requirements r
        WHERE r.id = a.requirement_id
          AND r.purchaser_id = v_effective_purchaser
      )
    )
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

-- =====================================================================
-- Fixed: get_scoped_auctions_count (mirror scoping rules)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_scoped_auctions_count(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_has_winner boolean DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_company_id uuid;
  v_effective_purchaser uuid;
  v_count bigint;
BEGIN
  SELECT m.company_id, m.role
    INTO v_company_id, v_caller_role
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id
    AND m.is_active = true
  ORDER BY m.created_at ASC
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  SELECT COUNT(*)
    INTO v_count
  FROM public.reverse_auctions a
  WHERE
    (
      (v_company_id IS NOT NULL AND a.company_id = v_company_id)
      OR
      (v_company_id IS NULL AND a.buyer_id = p_user_id)
    )
    AND (
      v_effective_purchaser IS NULL
      OR EXISTS (
        SELECT 1 FROM public.requirements r
        WHERE r.id = a.requirement_id
          AND r.purchaser_id = v_effective_purchaser
      )
    )
    AND (p_status IS NULL OR a.status = p_status)
    AND (p_from IS NULL OR a.created_at >= p_from)
    AND (p_to IS NULL OR a.created_at <= p_to)
    AND (p_has_winner IS NULL
         OR (p_has_winner = true AND a.winner_supplier_id IS NOT NULL)
         OR (p_has_winner = false AND a.winner_supplier_id IS NULL));

  RETURN v_count;
END;
$$;

-- =====================================================================
-- Fixed: get_scoped_auction_metrics
-- Savings only counted on COMPLETED auctions with a real winner.
-- No mixing of live current_price with final winning_price.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_scoped_auction_metrics(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_window text DEFAULT 'all'
)
RETURNS TABLE (
  total_auctions bigint,
  total_savings numeric,
  recent_auctions bigint,
  recent_savings numeric,
  avg_savings_pct numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_company_id uuid;
  v_effective_purchaser uuid;
  v_recent_cutoff timestamptz := now() - interval '6 months';
BEGIN
  SELECT m.company_id, m.role
    INTO v_company_id, v_caller_role
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id
    AND m.is_active = true
  ORDER BY m.created_at ASC
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  RETURN QUERY
  WITH scoped AS (
    SELECT
      a.id,
      a.created_at,
      a.status,
      a.starting_price,
      a.winning_price,
      a.winner_supplier_id,
      -- Only realized savings on completed auctions
      CASE
        WHEN a.winner_supplier_id IS NOT NULL
             AND a.starting_price IS NOT NULL
             AND a.winning_price IS NOT NULL
             AND a.starting_price > a.winning_price
        THEN a.starting_price - a.winning_price
        ELSE 0
      END AS realized_savings,
      CASE
        WHEN a.winner_supplier_id IS NOT NULL
             AND a.starting_price IS NOT NULL
             AND a.starting_price > 0
             AND a.winning_price IS NOT NULL
        THEN ((a.starting_price - a.winning_price) / a.starting_price) * 100
        ELSE NULL
      END AS savings_pct
    FROM public.reverse_auctions a
    WHERE
      (
        (v_company_id IS NOT NULL AND a.company_id = v_company_id)
        OR
        (v_company_id IS NULL AND a.buyer_id = p_user_id)
      )
      AND (
        v_effective_purchaser IS NULL
        OR EXISTS (
          SELECT 1 FROM public.requirements r
          WHERE r.id = a.requirement_id
            AND r.purchaser_id = v_effective_purchaser
        )
      )
  )
  SELECT
    COUNT(*)::bigint                                            AS total_auctions,
    COALESCE(SUM(realized_savings), 0)::numeric                 AS total_savings,
    COUNT(*) FILTER (WHERE created_at >= v_recent_cutoff)::bigint
                                                                AS recent_auctions,
    COALESCE(SUM(realized_savings)
             FILTER (WHERE created_at >= v_recent_cutoff), 0)::numeric
                                                                AS recent_savings,
    COALESCE(AVG(savings_pct), 0)::numeric                      AS avg_savings_pct
  FROM scoped;
END;
$$;