
-- ============================================================
-- 1. Add company_id to reverse_auctions
-- ============================================================
ALTER TABLE public.reverse_auctions
  ADD COLUMN IF NOT EXISTS company_id uuid;

UPDATE public.reverse_auctions ra
SET company_id = m.company_id
FROM public.buyer_company_members m
WHERE ra.company_id IS NULL
  AND m.user_id = ra.buyer_id
  AND m.is_active = true;

CREATE OR REPLACE FUNCTION public.set_auction_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL AND NEW.buyer_id IS NOT NULL THEN
    SELECT m.company_id INTO NEW.company_id
    FROM public.buyer_company_members m
    WHERE m.user_id = NEW.buyer_id AND m.is_active = true
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_auction_company_id ON public.reverse_auctions;
CREATE TRIGGER trg_set_auction_company_id
BEFORE INSERT OR UPDATE OF buyer_id ON public.reverse_auctions
FOR EACH ROW EXECUTE FUNCTION public.set_auction_company_id();

-- ============================================================
-- 2. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_auctions_company_created
  ON public.reverse_auctions(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auctions_buyer_created
  ON public.reverse_auctions(buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auctions_status_created
  ON public.reverse_auctions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auctions_winner
  ON public.reverse_auctions(winner_supplier_id)
  WHERE winner_supplier_id IS NOT NULL;

-- ============================================================
-- 3. Impersonation audit table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.impersonation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  viewed_purchaser_id uuid,
  entity text NOT NULL,
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impersonation_audit_actor
  ON public.impersonation_audit(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_company
  ON public.impersonation_audit(company_id, created_at DESC);

ALTER TABLE public.impersonation_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view impersonation audit" ON public.impersonation_audit;
CREATE POLICY "Admins can view impersonation audit"
  ON public.impersonation_audit FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "System can insert impersonation audit" ON public.impersonation_audit;
CREATE POLICY "System can insert impersonation audit"
  ON public.impersonation_audit FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 4. Audit logger helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_impersonation_read(
  p_actor uuid,
  p_viewed_purchaser uuid,
  p_entity text,
  p_company uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_viewed_purchaser IS NOT NULL AND p_viewed_purchaser <> p_actor THEN
    INSERT INTO public.impersonation_audit
      (actor_user_id, viewed_purchaser_id, entity, company_id)
    VALUES (p_actor, p_viewed_purchaser, p_entity, p_company);
  END IF;
END;
$$;

-- ============================================================
-- 5. Hardened auctions RPC (replaces existing signature)
-- ============================================================
DROP FUNCTION IF EXISTS public.get_scoped_auctions_by_purchaser(uuid, uuid, text, timestamptz, timestamptz, int, int);

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
  SELECT m.role, m.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id AND m.is_active = true
  ORDER BY m.created_at ASC
  LIMIT 1;

  -- HARD BOUNDARY
  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  PERFORM public.log_impersonation_read(
    p_user_id, v_effective_purchaser, 'auction', v_company_id
  );

  RETURN QUERY
  SELECT a.*
  FROM public.reverse_auctions a
  WHERE
    -- Company boundary (cheap, indexed); fall back to identity if no company
    (
      (v_company_id IS NOT NULL AND a.company_id = v_company_id)
      OR (v_company_id IS NULL AND a.buyer_id = p_user_id)
    )
    -- Purchaser scope: auctions are buyer-owned; map purchaser→buyer
    AND (v_effective_purchaser IS NULL OR a.buyer_id = v_effective_purchaser)
    AND (p_status IS NULL OR a.status = p_status)
    AND (p_from IS NULL OR a.created_at >= p_from)
    AND (p_to IS NULL OR a.created_at <= p_to)
    AND (p_has_winner IS NULL
         OR (p_has_winner = true  AND a.winner_supplier_id IS NOT NULL)
         OR (p_has_winner = false AND a.winner_supplier_id IS NULL))
  ORDER BY a.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ============================================================
-- 6. Count RPC
-- ============================================================
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
  SELECT m.role, m.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id AND m.is_active = true
  ORDER BY m.created_at ASC
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.reverse_auctions a
  WHERE
    (
      (v_company_id IS NOT NULL AND a.company_id = v_company_id)
      OR (v_company_id IS NULL AND a.buyer_id = p_user_id)
    )
    AND (v_effective_purchaser IS NULL OR a.buyer_id = v_effective_purchaser)
    AND (p_status IS NULL OR a.status = p_status)
    AND (p_from IS NULL OR a.created_at >= p_from)
    AND (p_to IS NULL OR a.created_at <= p_to)
    AND (p_has_winner IS NULL
         OR (p_has_winner = true  AND a.winner_supplier_id IS NOT NULL)
         OR (p_has_winner = false AND a.winner_supplier_id IS NULL));

  RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================================
-- 7. Consolidated metrics (lifetime + recent in one call)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_scoped_auction_metrics(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_recent_months int DEFAULT 6
)
RETURNS TABLE (
  total_auctions bigint,
  completed_auctions bigint,
  total_savings numeric,
  recent_auctions bigint,
  recent_completed bigint,
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
  v_recent_from timestamptz;
BEGIN
  SELECT m.role, m.company_id
    INTO v_caller_role, v_company_id
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id AND m.is_active = true
  ORDER BY m.created_at ASC
  LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  v_recent_from := now() - (p_recent_months || ' months')::interval;

  RETURN QUERY
  WITH scoped AS (
    SELECT
      a.id, a.status, a.created_at,
      a.starting_price, a.winning_price, a.current_price,
      a.winner_supplier_id
    FROM public.reverse_auctions a
    WHERE
      (
        (v_company_id IS NOT NULL AND a.company_id = v_company_id)
        OR (v_company_id IS NULL AND a.buyer_id = p_user_id)
      )
      AND (v_effective_purchaser IS NULL OR a.buyer_id = v_effective_purchaser)
  ),
  enriched AS (
    SELECT
      s.*,
      COALESCE(s.winning_price, s.current_price) AS final_price,
      CASE
        WHEN s.starting_price IS NOT NULL
         AND COALESCE(s.winning_price, s.current_price) IS NOT NULL
         AND s.starting_price > COALESCE(s.winning_price, s.current_price)
        THEN s.starting_price - COALESCE(s.winning_price, s.current_price)
        ELSE 0
      END AS savings,
      CASE
        WHEN s.starting_price IS NOT NULL AND s.starting_price > 0
         AND COALESCE(s.winning_price, s.current_price) IS NOT NULL
         AND s.starting_price > COALESCE(s.winning_price, s.current_price)
        THEN ((s.starting_price - COALESCE(s.winning_price, s.current_price)) / s.starting_price) * 100
      END AS savings_pct
    FROM scoped s
  )
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE status IN ('completed','closed') OR winner_supplier_id IS NOT NULL)::bigint,
    COALESCE(SUM(savings), 0)::numeric,
    COUNT(*) FILTER (WHERE created_at >= v_recent_from)::bigint,
    COUNT(*) FILTER (WHERE created_at >= v_recent_from
                     AND (status IN ('completed','closed') OR winner_supplier_id IS NOT NULL))::bigint,
    COALESCE(SUM(savings) FILTER (WHERE created_at >= v_recent_from), 0)::numeric,
    COALESCE(AVG(savings_pct), 0)::numeric
  FROM enriched;
END;
$$;
