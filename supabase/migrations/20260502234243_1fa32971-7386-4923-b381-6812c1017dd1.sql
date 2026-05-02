
-- Idempotency ledger for credit consumption
CREATE TABLE IF NOT EXISTS public.auction_credit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id uuid NOT NULL REFERENCES public.buyer_auction_credits(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_idempotency
  ON public.auction_credit_logs (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_credit_logs_buyer
  ON public.auction_credit_logs (buyer_id, created_at DESC);

ALTER TABLE public.auction_credit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own credit logs"
  ON public.auction_credit_logs
  FOR SELECT
  USING (auth.uid() = buyer_id);

-- Updated RPC with idempotency support (backwards-compatible: key optional)
CREATE OR REPLACE FUNCTION public.consume_auction_credit(
  p_credit_id uuid,
  p_idempotency_key text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_caller uuid := auth.uid();
  v_allowed boolean;
BEGIN
  SELECT buyer_id INTO v_owner FROM public.buyer_auction_credits WHERE id = p_credit_id FOR UPDATE;
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

  -- Idempotency short-circuit: if key already processed, return success without re-deducting
  IF p_idempotency_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.auction_credit_logs WHERE idempotency_key = p_idempotency_key
  ) THEN
    RETURN;
  END IF;

  UPDATE public.buyer_auction_credits
  SET used_credits = used_credits + 1, updated_at = now()
  WHERE id = p_credit_id;

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.auction_credit_logs (credit_id, buyer_id, idempotency_key)
    VALUES (p_credit_id, v_owner, p_idempotency_key)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
END;
$function$;
