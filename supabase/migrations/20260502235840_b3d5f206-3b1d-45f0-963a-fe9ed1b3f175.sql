ALTER TABLE public.auction_credit_logs
  ADD COLUMN IF NOT EXISTS request_id text;

CREATE INDEX IF NOT EXISTS idx_auction_credit_logs_request_id
  ON public.auction_credit_logs (request_id);

CREATE OR REPLACE FUNCTION public.consume_auction_credit(
  p_credit_id uuid,
  p_idempotency_key text DEFAULT NULL::text,
  p_request_id text DEFAULT NULL::text
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

  -- Idempotency short-circuit
  IF p_idempotency_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.auction_credit_logs WHERE idempotency_key = p_idempotency_key
  ) THEN
    RETURN;
  END IF;

  UPDATE public.buyer_auction_credits
  SET used_credits = used_credits + 1, updated_at = now()
  WHERE id = p_credit_id;

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.auction_credit_logs (credit_id, buyer_id, idempotency_key, request_id)
    VALUES (p_credit_id, v_owner, p_idempotency_key, p_request_id)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
END;
$function$;