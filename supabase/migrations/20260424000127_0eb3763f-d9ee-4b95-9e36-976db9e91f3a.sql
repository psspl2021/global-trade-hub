-- =====================================================================
-- HARDENING: state-transition guards + dependency-checked DELETE policies
-- Goal: provably safe under direct SQL (not just normal UI flow)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Helper: is the current call coming from a trusted RPC bypass?
-- Trusted iff: bypass GUC set true AND has explicit capability.
-- Belt-and-suspenders so a stray SET cannot escalate.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._is_trusted_state_mutation(_required_cap text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bypass text;
BEGIN
  v_bypass := current_setting('app.bypass_state_guard', true);
  IF v_bypass IS NULL OR v_bypass <> 'true' THEN
    RETURN false;
  END IF;
  -- Even with the bypass flag, the caller's auth.uid() must hold the capability.
  -- (RPCs run SECURITY DEFINER but auth.uid() is preserved.)
  RETURN public.has_capability(auth.uid(), _required_cap);
END;
$$;

-- ---------------------------------------------------------------------
-- 2) BIDS: block direct status flips outside award_reverse_auction
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._guard_bids_state_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction_status text;
BEGIN
  -- Allow no-op updates of unrelated columns
  IF NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.awarded_at IS NOT DISTINCT FROM OLD.awarded_at
     AND NEW.approved_by IS NOT DISTINCT FROM OLD.approved_by THEN
    RETURN NEW;
  END IF;

  -- Suppliers updating their own pending bid (price etc.) handled by RLS;
  -- but if status is changing, gate it.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Trusted RPC path?
    IF public._is_trusted_state_mutation('can_award_auction') THEN
      RETURN NEW;
    END IF;

    -- Explicit capability holder (manager+) may set status directly,
    -- but only via legal transitions.
    IF public.has_capability(auth.uid(), 'can_award_auction') THEN
      -- Legal transitions for managers without going through RPC:
      --   pending → rejected, pending → withdrawn
      -- Awarding ('accepted'/'awarded') MUST go through award_reverse_auction.
      IF OLD.status::text = 'pending' AND NEW.status::text IN ('rejected','withdrawn') THEN
        RETURN NEW;
      ELSE
        RAISE EXCEPTION 'forbidden_bid_transition: % → % must use award_reverse_auction RPC',
          OLD.status, NEW.status USING ERRCODE = '42501';
      END IF;
    END IF;

    -- Suppliers may only withdraw their own pending bid
    IF auth.uid() = OLD.supplier_id
       AND OLD.status::text = 'pending'
       AND NEW.status::text = 'withdrawn' THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'forbidden_bid_status_change' USING ERRCODE = '42501';
  END IF;

  -- awarded_at / approved_by may only be set via trusted RPC
  IF (NEW.awarded_at IS DISTINCT FROM OLD.awarded_at
      OR NEW.approved_by IS DISTINCT FROM OLD.approved_by)
     AND NOT public._is_trusted_state_mutation('can_award_auction') THEN
    RAISE EXCEPTION 'awarded_at/approved_by may only change via award RPC' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_bids_state ON public.bids;
CREATE TRIGGER trg_guard_bids_state
BEFORE UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public._guard_bids_state_transition();

-- ---------------------------------------------------------------------
-- 3) REVERSE_AUCTIONS: protect status / winner / winning_price / auction_end
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._guard_reverse_auctions_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Detect a "state-impacting" change
  IF NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.winner_supplier_id IS NOT DISTINCT FROM OLD.winner_supplier_id
     AND NEW.winning_price IS NOT DISTINCT FROM OLD.winning_price
     AND NEW.auction_end IS NOT DISTINCT FROM OLD.auction_end THEN
    RETURN NEW;
  END IF;

  -- Trusted RPC path (award/cancel/extend) wins
  IF public._is_trusted_state_mutation('can_award_auction')
     OR public._is_trusted_state_mutation('can_close_auction') THEN
    RETURN NEW;
  END IF;

  -- Validate transitions when status is changing
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status::text IN ('completed','cancelled') THEN
      RAISE EXCEPTION 'auction_terminal_state: cannot change status from %', OLD.status
        USING ERRCODE = '42501';
    END IF;
    -- Only owner OR capability holder may change status outside RPC,
    -- and only to non-terminal values (e.g. pause). Awarding/cancelling
    -- terminal states must go through the RPC.
    IF NEW.status::text IN ('completed','cancelled') THEN
      RAISE EXCEPTION 'use guarded RPC for terminal status %', NEW.status
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- winner / winning_price are RPC-only
  IF NEW.winner_supplier_id IS DISTINCT FROM OLD.winner_supplier_id
     OR NEW.winning_price IS DISTINCT FROM OLD.winning_price THEN
    RAISE EXCEPTION 'winner/winning_price may only change via award_reverse_auction'
      USING ERRCODE = '42501';
  END IF;

  -- auction_end may be changed by owner OR can_close_auction (extend RPC handles via bypass)
  IF NEW.auction_end IS DISTINCT FROM OLD.auction_end THEN
    IF auth.uid() = OLD.buyer_id
       OR public.has_capability(auth.uid(), 'can_close_auction') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'auction_end change requires owner or can_close_auction'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_reverse_auctions_state ON public.reverse_auctions;
CREATE TRIGGER trg_guard_reverse_auctions_state
BEFORE UPDATE ON public.reverse_auctions
FOR EACH ROW EXECUTE FUNCTION public._guard_reverse_auctions_state();

-- ---------------------------------------------------------------------
-- 4) PURCHASE_ORDERS: protect status, approval_status, approval columns
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._guard_po_state_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_protected_changed boolean;
BEGIN
  v_protected_changed :=
       NEW.status                IS DISTINCT FROM OLD.status
    OR NEW.po_status             IS DISTINCT FROM OLD.po_status
    OR NEW.approval_status       IS DISTINCT FROM OLD.approval_status
    OR NEW.manager_approved_by   IS DISTINCT FROM OLD.manager_approved_by
    OR NEW.manager_approved_at   IS DISTINCT FROM OLD.manager_approved_at
    OR NEW.director_approved_by  IS DISTINCT FROM OLD.director_approved_by
    OR NEW.director_approved_at  IS DISTINCT FROM OLD.director_approved_at
    OR NEW.cfo_approved_by       IS DISTINCT FROM OLD.cfo_approved_by
    OR NEW.cfo_approved_at       IS DISTINCT FROM OLD.cfo_approved_at
    OR NEW.ceo_override          IS DISTINCT FROM OLD.ceo_override
    OR NEW.ceo_override_by       IS DISTINCT FROM OLD.ceo_override_by
    OR NEW.ceo_override_reason   IS DISTINCT FROM OLD.ceo_override_reason
    OR NEW.ceo_override_at       IS DISTINCT FROM OLD.ceo_override_at
    OR NEW.rejected_by           IS DISTINCT FROM OLD.rejected_by
    OR NEW.rejected_at           IS DISTINCT FROM OLD.rejected_at;

  IF NOT v_protected_changed THEN
    RETURN NEW;  -- non-approval columns: let RLS handle
  END IF;

  -- Trusted approval RPC bypass
  IF public._is_trusted_state_mutation('can_edit_any_rfq')
     OR public._is_trusted_state_mutation('can_override_po_approval')
     OR public._is_trusted_state_mutation('can_override_pricing') THEN
    -- Still validate transitions even via RPC (audit-grade integrity)
    IF OLD.approval_status::text IN ('approved','rejected')
       AND NEW.approval_status::text NOT IN ('approved','rejected')
       AND NOT public.has_capability(auth.uid(), 'can_override_po_approval') THEN
      RAISE EXCEPTION 'cannot reopen finalized PO without can_override_po_approval'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- Direct (non-RPC) protected mutation: only CEO override capability
  IF public.has_capability(auth.uid(), 'can_override_po_approval') THEN
    -- Even CEO can't silently re-approve an approved PO without going through override RPC
    IF OLD.approval_status::text = 'approved'
       AND NEW.approval_status::text = 'approved'
       AND NEW.ceo_override IS NOT DISTINCT FROM OLD.ceo_override THEN
      RAISE EXCEPTION 'use ceo_override_approve_po RPC' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'PO approval columns may only change via approval RPCs'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_po_state ON public.purchase_orders;
CREATE TRIGGER trg_guard_po_state
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public._guard_po_state_transition();

-- ---------------------------------------------------------------------
-- 5) BID_ITEMS: minimal guard — block updates after auction closed/awarded
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._guard_bid_items_post_close()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid_status text;
BEGIN
  SELECT status::text INTO v_bid_status FROM public.bids WHERE id = NEW.bid_id;
  IF v_bid_status IN ('accepted','awarded','rejected','withdrawn','closed') THEN
    -- allow trusted RPC adjustments (e.g. dispatched_qty updates after award)
    IF public._is_trusted_state_mutation('can_award_auction')
       OR public._is_trusted_state_mutation('can_edit_any_rfq') THEN
      RETURN NEW;
    END IF;
    -- Allow dispatched_qty-only updates (operational, not pricing)
    IF NEW.unit_price IS NOT DISTINCT FROM OLD.unit_price
       AND NEW.supplier_unit_price IS NOT DISTINCT FROM OLD.supplier_unit_price
       AND NEW.quantity IS NOT DISTINCT FROM OLD.quantity
       AND NEW.total IS NOT DISTINCT FROM OLD.total THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'bid_items pricing locked after bid finalized (status=%)', v_bid_status
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_bid_items_post_close ON public.bid_items;
CREATE TRIGGER trg_guard_bid_items_post_close
BEFORE UPDATE ON public.bid_items
FOR EACH ROW EXECUTE FUNCTION public._guard_bid_items_post_close();

-- ---------------------------------------------------------------------
-- 6) DELETE policies — capability + dependency checks
-- ---------------------------------------------------------------------

-- requirements: can be deleted only by owner OR can_edit_any_rfq,
-- AND only if no downstream artifacts exist.
DROP POLICY IF EXISTS rfq_delete_safe ON public.requirements;
CREATE POLICY rfq_delete_safe ON public.requirements
FOR DELETE TO authenticated
USING (
  (
    auth.uid() = buyer_id
    OR public.has_capability(auth.uid(), 'can_edit_any_rfq')
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  AND NOT EXISTS (SELECT 1 FROM public.bids b WHERE b.requirement_id = requirements.id)
  AND NOT EXISTS (SELECT 1 FROM public.reverse_auctions ra WHERE ra.requirement_id = requirements.id)
  AND NOT EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.requirement_id = requirements.id)
);

-- reverse_auctions: only owner OR can_close_auction may delete,
-- and only if not in terminal state and no PO derived.
DROP POLICY IF EXISTS auction_delete_safe ON public.reverse_auctions;
CREATE POLICY auction_delete_safe ON public.reverse_auctions
FOR DELETE TO authenticated
USING (
  (
    auth.uid() = buyer_id
    OR public.has_capability(auth.uid(), 'can_close_auction')
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  AND status::text NOT IN ('completed','cancelled')
  AND NOT EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.auction_id = reverse_auctions.id)
);

-- purchase_orders: never deletable except by admin (financial record)
DROP POLICY IF EXISTS po_delete_admin_only ON public.purchase_orders;
CREATE POLICY po_delete_admin_only ON public.purchase_orders
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- bids: deletable only by supplier (own pending bid) or admin
DROP POLICY IF EXISTS bid_delete_safe ON public.bids;
CREATE POLICY bid_delete_safe ON public.bids
FOR DELETE TO authenticated
USING (
  (auth.uid() = supplier_id AND status::text = 'pending')
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ---------------------------------------------------------------------
-- 7) Make trusted RPCs set the bypass flag
-- ---------------------------------------------------------------------

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

  IF NOT public.has_capability(auth.uid(), 'can_award_auction') THEN
    PERFORM public._assert_auction_owner(p_auction_id, auth.uid());
  END IF;

  -- Trusted bypass for guard triggers (transaction-local)
  PERFORM set_config('app.bypass_state_guard', 'true', true);

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

  PERFORM set_config('app.bypass_state_guard', 'false', true);
  RETURN v_row;
END;
$function$;