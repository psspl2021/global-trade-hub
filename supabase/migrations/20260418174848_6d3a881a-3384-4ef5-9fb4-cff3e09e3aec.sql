-- 1. RFQ ownership: backfill + enforce NOT NULL
UPDATE public.requirements SET purchaser_id = buyer_id WHERE purchaser_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.requirements WHERE purchaser_id IS NULL) THEN
    ALTER TABLE public.requirements ALTER COLUMN purchaser_id SET NOT NULL;
  END IF;
END $$;

-- 2. Add ownership columns to reverse_auctions
ALTER TABLE public.reverse_auctions
  ADD COLUMN IF NOT EXISTS requirement_id uuid,
  ADD COLUMN IF NOT EXISTS purchaser_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='reverse_auctions'
      AND constraint_type='FOREIGN KEY'
      AND constraint_name='reverse_auctions_requirement_id_fkey'
  ) THEN
    ALTER TABLE public.reverse_auctions
      ADD CONSTRAINT reverse_auctions_requirement_id_fkey
      FOREIGN KEY (requirement_id) REFERENCES public.requirements(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Backfill purchaser_id on legacy auctions, then enforce NOT NULL
UPDATE public.reverse_auctions SET purchaser_id = buyer_id WHERE purchaser_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.reverse_auctions WHERE purchaser_id IS NULL) THEN
    ALTER TABLE public.reverse_auctions ALTER COLUMN purchaser_id SET NOT NULL;
  END IF;
END $$;

-- 4. Trigger: inherit purchaser from RFQ when linked
CREATE OR REPLACE FUNCTION public.enforce_auction_ownership_from_rfq()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_rfq_purchaser uuid;
BEGIN
  IF NEW.requirement_id IS NOT NULL THEN
    SELECT r.purchaser_id INTO v_rfq_purchaser
    FROM public.requirements r WHERE r.id = NEW.requirement_id;

    IF v_rfq_purchaser IS NULL THEN
      RAISE EXCEPTION 'Linked requirement % has no purchaser', NEW.requirement_id;
    END IF;

    NEW.purchaser_id := v_rfq_purchaser;
  ELSIF NEW.purchaser_id IS NULL THEN
    NEW.purchaser_id := NEW.buyer_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_auction_ownership_from_rfq ON public.reverse_auctions;
CREATE TRIGGER trg_enforce_auction_ownership_from_rfq
BEFORE INSERT OR UPDATE OF requirement_id, purchaser_id, buyer_id
ON public.reverse_auctions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_auction_ownership_from_rfq();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_requirements_id_purchaser
  ON public.requirements(id, purchaser_id);

CREATE INDEX IF NOT EXISTS idx_auctions_company_purchaser_created
  ON public.reverse_auctions(company_id, purchaser_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auctions_winner_only
  ON public.reverse_auctions(company_id, created_at DESC)
  WHERE winner_supplier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auctions_requirement
  ON public.reverse_auctions(requirement_id) WHERE requirement_id IS NOT NULL;

-- 6. Drop stale overloads + recreate canonical RPCs
DROP FUNCTION IF EXISTS public.get_scoped_auctions_by_purchaser(uuid, uuid, text, timestamptz, timestamptz, boolean, integer, integer);
DROP FUNCTION IF EXISTS public.get_scoped_auction_metrics(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_scoped_auction_metrics(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_scoped_auction_metrics(uuid, uuid, text, timestamptz, timestamptz);

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
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_caller_role text;
  v_company_id uuid;
  v_effective_purchaser uuid;
BEGIN
  SELECT m.company_id, m.role INTO v_company_id, v_caller_role
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id AND m.is_active = true
  ORDER BY m.created_at ASC LIMIT 1;

  IF v_caller_role = 'purchaser' THEN
    v_effective_purchaser := p_user_id;
  ELSE
    v_effective_purchaser := p_selected_purchaser;
  END IF;

  IF v_effective_purchaser IS NOT NULL
     AND v_effective_purchaser <> p_user_id
     AND COALESCE(v_caller_role, '') <> 'purchaser' THEN
    PERFORM public.log_impersonation_read(p_user_id, v_effective_purchaser, 'auction');
  END IF;

  RETURN QUERY
  SELECT a.* FROM public.reverse_auctions a
  WHERE
    (
      (v_company_id IS NOT NULL AND a.company_id = v_company_id)
      OR (v_company_id IS NULL AND a.buyer_id = p_user_id)
    )
    AND (v_effective_purchaser IS NULL OR a.purchaser_id = v_effective_purchaser)
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

CREATE OR REPLACE FUNCTION public.get_scoped_auction_metrics(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL,
  p_recent_months integer DEFAULT 6
)
RETURNS TABLE(
  total_auctions bigint,
  completed_auctions bigint,
  total_savings numeric,
  recent_auctions bigint,
  recent_completed bigint,
  recent_savings numeric,
  avg_savings_pct numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_caller_role text;
  v_company_id uuid;
  v_effective_purchaser uuid;
  v_recent_from timestamptz;
BEGIN
  SELECT m.role, m.company_id INTO v_caller_role, v_company_id
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id AND m.is_active = true
  ORDER BY m.created_at ASC LIMIT 1;

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
      a.starting_price, a.winning_price, a.winner_supplier_id,
      CASE WHEN a.winner_supplier_id IS NOT NULL
            AND a.starting_price IS NOT NULL
            AND a.winning_price IS NOT NULL
            AND a.starting_price > a.winning_price
           THEN a.starting_price - a.winning_price ELSE 0 END AS realized_savings,
      CASE WHEN a.winner_supplier_id IS NOT NULL
            AND a.starting_price IS NOT NULL
            AND a.starting_price > 0
            AND a.winning_price IS NOT NULL
           THEN ((a.starting_price - a.winning_price) / a.starting_price) * 100
           ELSE NULL END AS savings_pct
    FROM public.reverse_auctions a
    WHERE
      (
        (v_company_id IS NOT NULL AND a.company_id = v_company_id)
        OR (v_company_id IS NULL AND a.buyer_id = p_user_id)
      )
      AND (v_effective_purchaser IS NULL OR a.purchaser_id = v_effective_purchaser)
  )
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE winner_supplier_id IS NOT NULL)::bigint,
    COALESCE(SUM(realized_savings), 0)::numeric,
    COUNT(*) FILTER (WHERE created_at >= v_recent_from)::bigint,
    COUNT(*) FILTER (WHERE created_at >= v_recent_from AND winner_supplier_id IS NOT NULL)::bigint,
    COALESCE(SUM(realized_savings) FILTER (WHERE created_at >= v_recent_from), 0)::numeric,
    COALESCE(AVG(savings_pct), 0)::numeric
  FROM scoped;
END;
$$;