
-- 1. Skip free trial credits for users who join via invite (shared company model)
CREATE OR REPLACE FUNCTION public.provision_free_auction_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_invite boolean;
  v_email text;
BEGIN
  -- Look up email for this profile
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;

  -- If user has a pending/accepted invite, they join an existing company
  -- and should NOT receive a separate trial wallet.
  SELECT EXISTS (
    SELECT 1 FROM public.team_invites
    WHERE lower(email) = lower(v_email)
      AND status IN ('pending', 'accepted')
      AND company_id IS NOT NULL
  ) INTO v_has_invite;

  IF v_has_invite THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.buyer_auction_credits (buyer_id, total_credits, used_credits)
  VALUES (NEW.id, 5, 0)
  ON CONFLICT (buyer_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. RPC: get the shared company auction credits row (owner = first/admin member)
CREATE OR REPLACE FUNCTION public.get_company_auction_credits(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  buyer_id uuid,
  total_credits integer,
  used_credits integer,
  plan_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_owner_id uuid;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.buyer_company_members
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    -- Standalone user — return their own row
    RETURN QUERY
    SELECT bac.id, bac.buyer_id, bac.total_credits, bac.used_credits, bac.plan_id
    FROM public.buyer_auction_credits bac
    WHERE bac.buyer_id = p_user_id
    LIMIT 1;
    RETURN;
  END IF;

  -- Find oldest active member of the company (the owner) and return their wallet
  SELECT bcm.user_id INTO v_owner_id
  FROM public.buyer_company_members bcm
  JOIN public.buyer_auction_credits bac ON bac.buyer_id = bcm.user_id
  WHERE bcm.company_id = v_company_id AND bcm.is_active = true
  ORDER BY bcm.created_at ASC
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT bac.id, bac.buyer_id, bac.total_credits, bac.used_credits, bac.plan_id
  FROM public.buyer_auction_credits bac
  WHERE bac.buyer_id = v_owner_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_auction_credits(uuid) TO authenticated;

-- 3. RLS: allow team members to read the company-owner's credits row
DROP POLICY IF EXISTS "Team members can view company credits" ON public.buyer_auction_credits;
CREATE POLICY "Team members can view company credits"
  ON public.buyer_auction_credits
  FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.buyer_company_members me
      JOIN public.buyer_company_members owner
        ON owner.company_id = me.company_id
      WHERE me.user_id = auth.uid()
        AND me.is_active = true
        AND owner.user_id = buyer_auction_credits.buyer_id
        AND owner.is_active = true
    )
  );

-- 4. Update consume_auction_credit to allow any active team member to consume the company wallet
CREATE OR REPLACE FUNCTION public.consume_auction_credit(p_credit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_company uuid;
  v_caller uuid := auth.uid();
  v_allowed boolean;
BEGIN
  SELECT buyer_id INTO v_owner FROM public.buyer_auction_credits WHERE id = p_credit_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Credit row not found';
  END IF;

  IF v_owner = v_caller THEN
    v_allowed := true;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM public.buyer_company_members me
      JOIN public.buyer_company_members owner
        ON owner.company_id = me.company_id
      WHERE me.user_id = v_caller
        AND me.is_active = true
        AND owner.user_id = v_owner
        AND owner.is_active = true
    ) INTO v_allowed;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to consume this credit';
  END IF;

  UPDATE public.buyer_auction_credits
  SET used_credits = used_credits + 1, updated_at = now()
  WHERE id = p_credit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_auction_credit(uuid) TO authenticated;

-- 5. Cleanup: remove duplicate trial wallets created for invitees who already had a company
DELETE FROM public.buyer_auction_credits bac
WHERE bac.plan_id IS NULL
  AND bac.used_credits = 0
  AND EXISTS (
    SELECT 1
    FROM public.buyer_company_members me
    WHERE me.user_id = bac.buyer_id
      AND me.is_active = true
      AND me.created_at > (
        SELECT MIN(bcm2.created_at)
        FROM public.buyer_company_members bcm2
        WHERE bcm2.company_id = me.company_id AND bcm2.is_active = true
      )
  );
