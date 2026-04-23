-- =========================================================
-- 1. Auction cancel: owner OR can_close_auction
-- =========================================================
CREATE OR REPLACE FUNCTION public.cancel_reverse_auction(p_auction_id uuid)
RETURNS reverse_auctions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_row public.reverse_auctions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.has_capability(auth.uid(), 'can_close_auction') THEN
    PERFORM public._assert_auction_owner(p_auction_id, auth.uid());
  END IF;

  UPDATE public.reverse_auctions
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$function$;

-- =========================================================
-- 2. Auction extend end: owner OR can_close_auction
--    (extend is a control action; same authority class as close)
-- =========================================================
CREATE OR REPLACE FUNCTION public.extend_auction_end(p_auction_id uuid, p_new_end timestamp with time zone)
RETURNS reverse_auctions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_row public.reverse_auctions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.has_capability(auth.uid(), 'can_close_auction') THEN
    PERFORM public._assert_auction_owner(p_auction_id, auth.uid());
  END IF;

  UPDATE public.reverse_auctions
  SET auction_end = p_new_end, updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$function$;

-- =========================================================
-- 3. RFQ (requirements) edit by managers in same company
--    Existing "Buyers can manage own requirements" stays for self.
--    Add a capability-gated company-wide UPDATE policy.
-- =========================================================
DROP POLICY IF EXISTS "rfq_managers_can_edit_company" ON public.requirements;
CREATE POLICY "rfq_managers_can_edit_company"
ON public.requirements
FOR UPDATE
TO authenticated
USING (
  public.has_capability(auth.uid(), 'can_edit_any_rfq')
  AND EXISTS (
    SELECT 1
    FROM public.buyer_company_members caller
    JOIN public.buyer_company_members owner_m
      ON owner_m.company_id = caller.company_id
    WHERE caller.user_id = auth.uid()
      AND caller.is_active = true
      AND owner_m.user_id = requirements.buyer_id
      AND owner_m.is_active = true
  )
)
WITH CHECK (
  public.has_capability(auth.uid(), 'can_edit_any_rfq')
  AND EXISTS (
    SELECT 1
    FROM public.buyer_company_members caller
    JOIN public.buyer_company_members owner_m
      ON owner_m.company_id = caller.company_id
    WHERE caller.user_id = auth.uid()
      AND caller.is_active = true
      AND owner_m.user_id = requirements.buyer_id
      AND owner_m.is_active = true
  )
);

-- =========================================================
-- 4. Bids — managers can update status on company RFQs
--    Existing self policy ("Buyers can update bid status") stays.
-- =========================================================
DROP POLICY IF EXISTS "bids_managers_can_update_company" ON public.bids;
CREATE POLICY "bids_managers_can_update_company"
ON public.bids
FOR UPDATE
TO authenticated
USING (
  (
    public.has_capability(auth.uid(), 'can_award_auction')
    OR public.has_capability(auth.uid(), 'can_edit_any_rfq')
  )
  AND EXISTS (
    SELECT 1
    FROM public.requirements r
    JOIN public.buyer_company_members caller
      ON caller.user_id = auth.uid() AND caller.is_active = true
    JOIN public.buyer_company_members owner_m
      ON owner_m.user_id = r.buyer_id
     AND owner_m.company_id = caller.company_id
     AND owner_m.is_active = true
    WHERE r.id = bids.requirement_id
  )
)
WITH CHECK (
  (
    public.has_capability(auth.uid(), 'can_award_auction')
    OR public.has_capability(auth.uid(), 'can_edit_any_rfq')
  )
  AND EXISTS (
    SELECT 1
    FROM public.requirements r
    JOIN public.buyer_company_members caller
      ON caller.user_id = auth.uid() AND caller.is_active = true
    JOIN public.buyer_company_members owner_m
      ON owner_m.user_id = r.buyer_id
     AND owner_m.company_id = caller.company_id
     AND owner_m.is_active = true
    WHERE r.id = bids.requirement_id
  )
);

-- =========================================================
-- 5. Purchase orders — managers can update company POs
--    Defensive: the formal approval chain still uses RPCs.
-- =========================================================
DROP POLICY IF EXISTS "po_managers_can_update_company" ON public.purchase_orders;
CREATE POLICY "po_managers_can_update_company"
ON public.purchase_orders
FOR UPDATE
TO authenticated
USING (
  (
    public.has_capability(auth.uid(), 'can_edit_any_rfq')
    OR public.has_capability(auth.uid(), 'can_override_pricing')
    OR public.has_capability(auth.uid(), 'can_override_po_approval')
  )
  AND EXISTS (
    SELECT 1 FROM public.buyer_company_members m
    WHERE m.user_id = auth.uid()
      AND m.company_id = purchase_orders.buyer_company_id
      AND m.is_active = true
  )
)
WITH CHECK (
  (
    public.has_capability(auth.uid(), 'can_edit_any_rfq')
    OR public.has_capability(auth.uid(), 'can_override_pricing')
    OR public.has_capability(auth.uid(), 'can_override_po_approval')
  )
  AND EXISTS (
    SELECT 1 FROM public.buyer_company_members m
    WHERE m.user_id = auth.uid()
      AND m.company_id = purchase_orders.buyer_company_id
      AND m.is_active = true
  )
);