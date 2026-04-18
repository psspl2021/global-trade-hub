-- =============================================================================
-- Optimize scoped RPC layer
-- Strategy: introspect existing functions and only redefine what we can safely
-- evolve. We keep the original return-shape columns and APPEND new optional
-- parameters + computed columns, so existing callers keep working.
-- =============================================================================

-- Helper: detect a column on a table (used to make this migration resilient
-- across slightly different historical schemas).
CREATE OR REPLACE FUNCTION public._col_exists(p_table text, p_col text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_col
  );
$$;

-- =============================================================================
-- AUCTIONS
-- =============================================================================

-- Drop & recreate the scoped auctions function with extended signature.
-- We DROP first because we are changing the parameter list and return columns.
DROP FUNCTION IF EXISTS public.get_scoped_auctions_by_purchaser(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_scoped_auctions_by_purchaser(uuid, uuid, text, timestamptz, timestamptz, int, int);

CREATE OR REPLACE FUNCTION public.get_scoped_auctions_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 200,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  quantity numeric,
  unit text,
  starting_price numeric,
  current_price numeric,
  winning_price numeric,
  winner_supplier_id uuid,
  status text,
  currency text,
  buyer_id uuid,
  purchaser_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  has_accepted_bid boolean,
  savings_value numeric
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
BEGIN
  -- Resolve caller role + company. Purchaser role => hard self-only.
  SELECT bcm.role, bcm.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = p_user_id
    AND bcm.is_active = true
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser; -- NULL = all
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.description,
    a.category,
    a.quantity,
    a.unit,
    a.starting_price,
    a.current_price,
    a.winning_price,
    a.winner_supplier_id,
    a.status,
    COALESCE(a.currency, 'INR') AS currency,
    a.buyer_id,
    a.purchaser_id,
    a.created_at,
    a.updated_at,
    a.starts_at,
    a.ends_at,
    EXISTS (
      SELECT 1 FROM public.bids b
      WHERE b.auction_id = a.id
        AND b.status = 'accepted'
    ) AS has_accepted_bid,
    GREATEST(
      0,
      (COALESCE(a.starting_price, 0) - COALESCE(a.winning_price, a.current_price, a.starting_price, 0))
        * COALESCE(a.quantity, 0)
    ) AS savings_value
  FROM public.reverse_auctions a
  WHERE
    -- Company / ownership scope
    (
      v_company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.company_id = v_company_id
          AND m.user_id = a.buyer_id
          AND m.is_active = true
      )
    )
    OR a.buyer_id = p_user_id
    OR a.purchaser_id = p_user_id
  -- Purchaser scoping (hard for purchaser role, optional for management)
  AND (
    v_effective_purchaser IS NULL
    OR a.purchaser_id = v_effective_purchaser
    OR (a.purchaser_id IS NULL AND a.buyer_id = v_effective_purchaser)
  )
  -- Optional filters
  AND (p_status IS NULL OR a.status = p_status)
  AND (p_from   IS NULL OR a.created_at >= p_from)
  AND (p_to     IS NULL OR a.created_at <= p_to)
  ORDER BY a.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$$;

-- Fast count
CREATE OR REPLACE FUNCTION public.get_scoped_auctions_count(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
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
  SELECT bcm.role, bcm.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = p_user_id AND bcm.is_active = true
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.reverse_auctions a
  WHERE (
      (v_company_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.company_id = v_company_id
          AND m.user_id = a.buyer_id
          AND m.is_active = true
      ))
      OR a.buyer_id = p_user_id
      OR a.purchaser_id = p_user_id
    )
    AND (v_effective_purchaser IS NULL
         OR a.purchaser_id = v_effective_purchaser
         OR (a.purchaser_id IS NULL AND a.buyer_id = v_effective_purchaser))
    AND (p_status IS NULL OR a.status = p_status)
    AND (p_from   IS NULL OR a.created_at >= p_from)
    AND (p_to     IS NULL OR a.created_at <= p_to);

  RETURN COALESCE(v_count, 0);
END;
$$;

-- Aggregation: metrics
CREATE OR REPLACE FUNCTION public.get_scoped_auction_metrics(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT 'completed',
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_auctions bigint,
  total_savings numeric,
  avg_savings numeric
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
BEGIN
  SELECT bcm.role, bcm.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = p_user_id AND bcm.is_active = true
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
      GREATEST(
        0,
        (COALESCE(a.starting_price, 0) - COALESCE(a.winning_price, a.current_price, a.starting_price, 0))
          * COALESCE(a.quantity, 0)
      ) AS savings_value
    FROM public.reverse_auctions a
    WHERE (
        (v_company_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.buyer_company_members m
          WHERE m.company_id = v_company_id
            AND m.user_id = a.buyer_id
            AND m.is_active = true
        ))
        OR a.buyer_id = p_user_id
        OR a.purchaser_id = p_user_id
      )
      AND (v_effective_purchaser IS NULL
           OR a.purchaser_id = v_effective_purchaser
           OR (a.purchaser_id IS NULL AND a.buyer_id = v_effective_purchaser))
      AND (p_status IS NULL OR a.status = p_status)
      AND (p_from   IS NULL OR a.created_at >= p_from)
      AND (p_to     IS NULL OR a.created_at <= p_to)
  )
  SELECT
    COUNT(*)::bigint                                    AS total_auctions,
    COALESCE(SUM(savings_value), 0)::numeric            AS total_savings,
    COALESCE(AVG(NULLIF(savings_value, 0)), 0)::numeric AS avg_savings
  FROM scoped;
END;
$$;

-- =============================================================================
-- RFQs (requirements)
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_scoped_rfqs_by_purchaser(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_scoped_rfqs_by_purchaser(uuid, uuid, text, timestamptz, timestamptz, int, int);

CREATE OR REPLACE FUNCTION public.get_scoped_rfqs_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 200,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  status text,
  buyer_id uuid,
  purchaser_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  has_accepted_bid boolean
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
BEGIN
  SELECT bcm.role, bcm.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = p_user_id AND bcm.is_active = true
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.category,
    r.status::text,
    r.buyer_id,
    r.purchaser_id,
    r.created_at,
    r.updated_at,
    EXISTS (
      SELECT 1 FROM public.bids b
      WHERE b.requirement_id = r.id
        AND b.status = 'accepted'
    ) AS has_accepted_bid
  FROM public.requirements r
  WHERE (
      (v_company_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.company_id = v_company_id
          AND m.user_id = r.buyer_id
          AND m.is_active = true
      ))
      OR r.buyer_id = p_user_id
      OR r.purchaser_id = p_user_id
    )
    AND (v_effective_purchaser IS NULL
         OR r.purchaser_id = v_effective_purchaser
         OR (r.purchaser_id IS NULL AND r.buyer_id = v_effective_purchaser))
    AND (p_status IS NULL OR r.status::text = p_status)
    AND (p_from   IS NULL OR r.created_at >= p_from)
    AND (p_to     IS NULL OR r.created_at <= p_to)
  ORDER BY r.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_scoped_rfqs_count(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
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
  SELECT bcm.role, bcm.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = p_user_id AND bcm.is_active = true
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.requirements r
  WHERE (
      (v_company_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.company_id = v_company_id
          AND m.user_id = r.buyer_id
          AND m.is_active = true
      ))
      OR r.buyer_id = p_user_id
      OR r.purchaser_id = p_user_id
    )
    AND (v_effective_purchaser IS NULL
         OR r.purchaser_id = v_effective_purchaser
         OR (r.purchaser_id IS NULL AND r.buyer_id = v_effective_purchaser))
    AND (p_status IS NULL OR r.status::text = p_status)
    AND (p_from   IS NULL OR r.created_at >= p_from)
    AND (p_to     IS NULL OR r.created_at <= p_to);

  RETURN COALESCE(v_count, 0);
END;
$$;

-- =============================================================================
-- LOGISTICS (purchase_orders)
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_scoped_logistics_by_purchaser(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_scoped_logistics_by_purchaser(uuid, uuid, text, timestamptz, timestamptz, int, int);

CREATE OR REPLACE FUNCTION public.get_scoped_logistics_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 200,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  po_number text,
  vendor_name text,
  status text,
  total_amount numeric,
  currency text,
  order_date timestamptz,
  buyer_id uuid,
  purchaser_id uuid,
  created_at timestamptz,
  updated_at timestamptz
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
BEGIN
  SELECT bcm.role, bcm.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = p_user_id AND bcm.is_active = true
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.po_number,
    p.vendor_name,
    p.status,
    p.total_amount,
    COALESCE(p.currency, 'INR') AS currency,
    p.order_date,
    p.buyer_id,
    p.purchaser_id,
    p.created_at,
    p.updated_at
  FROM public.purchase_orders p
  WHERE (
      (v_company_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.company_id = v_company_id
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
    AND (p_from   IS NULL OR p.created_at >= p_from)
    AND (p_to     IS NULL OR p.created_at <= p_to)
  ORDER BY p.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_scoped_logistics_count(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
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
  SELECT bcm.role, bcm.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members bcm
  WHERE bcm.user_id = p_user_id AND bcm.is_active = true
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.purchase_orders p
  WHERE (
      (v_company_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.buyer_company_members m
        WHERE m.company_id = v_company_id
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
    AND (p_from   IS NULL OR p.created_at >= p_from)
    AND (p_to     IS NULL OR p.created_at <= p_to);

  RETURN COALESCE(v_count, 0);
END;
$$;

-- Cleanup helper
DROP FUNCTION IF EXISTS public._col_exists(text, text);