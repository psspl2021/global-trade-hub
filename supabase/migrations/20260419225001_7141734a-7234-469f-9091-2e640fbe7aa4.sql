
-- =====================================================================
-- Fix infinite recursion (42P17) between reverse_auctions
-- and reverse_auction_suppliers RLS, and broaden bid/message visibility
-- to all members of the buyer company (managers/directors/purchasers).
-- =====================================================================

-- 1) SECURITY DEFINER helpers (bypass RLS, no recursion)
CREATE OR REPLACE FUNCTION public.is_auction_buyer(_auction_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reverse_auctions ra
    WHERE ra.id = _auction_id AND ra.buyer_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_auction_invited_supplier(_auction_id uuid, _user_id uuid, _user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reverse_auction_suppliers ras
    WHERE ras.auction_id = _auction_id
      AND (
        ras.supplier_id = _user_id
        OR (ras.supplier_email IS NOT NULL AND ras.supplier_email = _user_email)
      )
  );
$$;

-- Returns true if _user_id belongs to the same buyer_company as the
-- auction's owner (covers managers/directors/other purchasers viewing
-- a teammate's auction).
CREATE OR REPLACE FUNCTION public.user_shares_auction_company(_auction_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reverse_auctions ra
    JOIN public.buyer_company_members owner_m
      ON owner_m.user_id = ra.buyer_id AND owner_m.is_active = true
    JOIN public.buyer_company_members viewer_m
      ON viewer_m.company_id = owner_m.company_id
     AND viewer_m.user_id = _user_id
     AND viewer_m.is_active = true
    WHERE ra.id = _auction_id
  );
$$;

-- =====================================================================
-- 2) reverse_auctions: replace recursive supplier-invite SELECT policy
-- =====================================================================
DROP POLICY IF EXISTS "supplier_can_view_invited_auctions" ON public.reverse_auctions;

CREATE POLICY "supplier_can_view_invited_auctions"
  ON public.reverse_auctions
  FOR SELECT
  TO authenticated
  USING (public.is_auction_invited_supplier(id, auth.uid(), (auth.jwt() ->> 'email')));

-- Allow company teammates to read auctions owned by a teammate
DROP POLICY IF EXISTS "company_members_view_team_auctions" ON public.reverse_auctions;
CREATE POLICY "company_members_view_team_auctions"
  ON public.reverse_auctions
  FOR SELECT
  TO authenticated
  USING (public.user_shares_auction_company(id, auth.uid()));

-- =====================================================================
-- 3) reverse_auction_suppliers: replace recursive policies w/ helper
-- =====================================================================
DROP POLICY IF EXISTS "Buyer manages auction suppliers" ON public.reverse_auction_suppliers;

CREATE POLICY "Buyer manages auction suppliers"
  ON public.reverse_auction_suppliers
  FOR ALL
  TO authenticated
  USING (
    public.is_auction_buyer(auction_id, auth.uid())
    OR public.user_shares_auction_company(auction_id, auth.uid())
  )
  WITH CHECK (
    public.is_auction_buyer(auction_id, auth.uid())
    OR public.user_shares_auction_company(auction_id, auth.uid())
  );

-- =====================================================================
-- 4) reverse_auction_bids: use helper + add company-scope visibility
-- =====================================================================
DROP POLICY IF EXISTS "Buyer views auction bids" ON public.reverse_auction_bids;

CREATE POLICY "Buyer views auction bids"
  ON public.reverse_auction_bids
  FOR SELECT
  TO authenticated
  USING (
    public.is_auction_buyer(auction_id, auth.uid())
    OR public.user_shares_auction_company(auction_id, auth.uid())
  );

-- =====================================================================
-- 5) auction_messages: use helpers + add company-scope visibility
-- =====================================================================
DROP POLICY IF EXISTS "Auction participants can view messages" ON public.auction_messages;

CREATE POLICY "Auction participants can view messages"
  ON public.auction_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR public.is_auction_buyer(auction_id, auth.uid())
    OR public.user_shares_auction_company(auction_id, auth.uid())
    OR public.is_auction_invited_supplier(auction_id, auth.uid(), (auth.jwt() ->> 'email'))
  );

-- =====================================================================
-- 6) auction_counter_offers: extend SELECT to company teammates
-- =====================================================================
DROP POLICY IF EXISTS "Participants can view counter offers" ON public.auction_counter_offers;

CREATE POLICY "Participants can view counter offers"
  ON public.auction_counter_offers
  FOR SELECT
  TO authenticated
  USING (
    supplier_id = auth.uid()
    OR buyer_id = auth.uid()
    OR public.user_shares_auction_company(auction_id, auth.uid())
  );
