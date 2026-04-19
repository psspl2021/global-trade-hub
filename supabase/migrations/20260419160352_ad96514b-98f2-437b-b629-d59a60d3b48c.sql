-- Drop the two stale overloads of get_scoped_auctions_by_purchaser.
-- Only the canonical (p_user_id, p_selected_purchaser, p_status, p_from, p_to, p_has_winner, p_limit, p_offset)
-- signature is used by the codebase. Keeping the others forces PostgREST + Postgres to resolve overloads
-- on every call, adding latency and risking the wrong overload being chosen.

-- Stale overload #1: (p_user_id, p_view_as_purchaser, p_status, p_sort_by, p_sort_order, p_limit, p_offset)
DROP FUNCTION IF EXISTS public.get_scoped_auctions_by_purchaser(
  uuid, uuid, text, text, text, integer, integer
);

-- Stale overload #2: (p_user_id, p_acting_purchaser_id, p_status, p_search, p_from_date, p_to_date, p_limit, p_offset)
DROP FUNCTION IF EXISTS public.get_scoped_auctions_by_purchaser(
  uuid, uuid, text, text, timestamp with time zone, timestamp with time zone, integer, integer
);

-- Also harden the canonical RPC's audit call so it never blocks the read path
-- (previous migration only wrapped one of the two PERFORM sites).
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
  v_caller_role text;
  v_company_id uuid;
  v_effective_purchaser uuid;
  v_is_management boolean := false;
BEGIN
  SELECT m.company_id, m.role INTO v_company_id, v_caller_role
  FROM public.buyer_company_members m
  WHERE m.user_id = p_user_id AND m.is_active = true
  ORDER BY m.created_at ASC LIMIT 1;

  v_is_management := v_caller_role IN (
    'owner','admin','manager','director','cfo','buyer_admin',
    'buyer_manager','buyer_cfo','buyer_ceo','buyer_hr'
  );

  IF v_caller_role IN ('purchaser','buyer_purchaser') THEN
    v_effective_purchaser := p_user_id;
  ELSIF v_is_management THEN
    v_effective_purchaser := COALESCE(p_selected_purchaser, p_user_id);
  ELSE
    v_effective_purchaser := p_user_id;
  END IF;

  -- Non-blocking audit: never break or slow the read path
  IF v_effective_purchaser <> p_user_id
     AND v_caller_role NOT IN ('purchaser','buyer_purchaser') THEN
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
      (v_company_id IS NOT NULL AND a.company_id = v_company_id)
      OR (v_company_id IS NULL AND a.buyer_id = p_user_id)
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
$function$;