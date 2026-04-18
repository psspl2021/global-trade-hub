-- Harden RPC: when no purchaser is selected, default scope to caller (self).
-- Prevents accidental "all company RFQs" leak during context bootstrap.
-- Also covers buyer_purchaser role (the actual role string, not 'purchaser').

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
  id uuid, title text, description text, category text, status text,
  buyer_id uuid, purchaser_id uuid, created_at timestamptz, updated_at timestamptz,
  has_accepted_bid boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
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

  -- Management roles may pick a purchaser to view as.
  -- Purchaser roles (incl. legacy 'purchaser' and current 'buyer_purchaser') are forced to self.
  v_is_management := v_caller_role IN ('owner','admin','manager','director','cfo','buyer_admin');

  IF v_caller_role IN ('purchaser','buyer_purchaser') THEN
    -- Hard override: purchasers can only see their own RFQs.
    v_effective_purchaser := p_user_id;
  ELSIF v_is_management THEN
    -- Management may impersonate; if none selected, default to self (no leak).
    v_effective_purchaser := COALESCE(p_selected_purchaser, p_user_id);
  ELSE
    -- Unknown role / no membership: scope to self.
    v_effective_purchaser := p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    r.id, r.title, r.description, r.product_category::text AS category, r.status::text,
    r.buyer_id, r.purchaser_id, r.created_at, r.updated_at,
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
$$;