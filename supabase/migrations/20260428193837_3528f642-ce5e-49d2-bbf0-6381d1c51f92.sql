
DROP FUNCTION IF EXISTS public.get_email_quota_status(uuid);
DROP FUNCTION IF EXISTS public.check_and_increment_email_quota(uuid);

ALTER TABLE public.supplier_email_quotas
  ADD COLUMN IF NOT EXISTS emails_remaining INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_emails_purchased INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_pack_activated_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS supplier_email_quotas_supplier_id_uq
  ON public.supplier_email_quotas(supplier_id);

UPDATE public.supplier_email_quotas
SET emails_remaining = 200,
    lifetime_emails_purchased = GREATEST(lifetime_emails_purchased, 200),
    last_pack_activated_at = COALESCE(last_pack_activated_at, now())
WHERE has_email_subscription = true
  AND subscription_expires_at IS NOT NULL
  AND subscription_expires_at > now()
  AND emails_remaining = 0;

CREATE FUNCTION public.get_email_quota_status(p_supplier_id uuid)
RETURNS TABLE(
  daily_sent integer,
  daily_limit integer,
  emails_remaining integer,
  lifetime_purchased integer,
  has_premium_pack boolean,
  last_pack_activated_at timestamp with time zone
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_quota supplier_email_quotas%ROWTYPE; v_daily_sent INTEGER := 0;
BEGIN
  SELECT * INTO v_quota FROM supplier_email_quotas WHERE supplier_id = p_supplier_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 2, 0, 0, false, NULL::TIMESTAMP WITH TIME ZONE; RETURN;
  END IF;
  v_daily_sent := CASE WHEN v_quota.last_daily_reset::date < CURRENT_DATE THEN 0 ELSE v_quota.daily_emails_sent END;
  RETURN QUERY SELECT v_daily_sent, 2, v_quota.emails_remaining, v_quota.lifetime_emails_purchased,
    (v_quota.emails_remaining > 0), v_quota.last_pack_activated_at;
END; $$;

CREATE FUNCTION public.check_and_increment_email_quota(p_supplier_id uuid)
RETURNS TABLE(can_send boolean, remaining_daily integer, emails_remaining integer, used_premium boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_quota supplier_email_quotas%ROWTYPE; v_daily_limit INTEGER := 2;
        v_can_send BOOLEAN := false; v_used_premium BOOLEAN := false;
BEGIN
  SELECT * INTO v_quota FROM supplier_email_quotas WHERE supplier_id = p_supplier_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO supplier_email_quotas (supplier_id) VALUES (p_supplier_id) RETURNING * INTO v_quota;
  END IF;
  IF v_quota.last_daily_reset::date < CURRENT_DATE THEN
    UPDATE supplier_email_quotas SET daily_emails_sent = 0, last_daily_reset = now()
      WHERE supplier_id = p_supplier_id RETURNING * INTO v_quota;
  END IF;
  IF v_quota.daily_emails_sent < v_daily_limit THEN
    UPDATE supplier_email_quotas SET daily_emails_sent = daily_emails_sent + 1, updated_at = now()
      WHERE supplier_id = p_supplier_id RETURNING * INTO v_quota;
    v_can_send := true; v_used_premium := false;
  ELSIF v_quota.emails_remaining > 0 THEN
    UPDATE supplier_email_quotas SET emails_remaining = emails_remaining - 1, updated_at = now()
      WHERE supplier_id = p_supplier_id RETURNING * INTO v_quota;
    v_can_send := true; v_used_premium := true;
  END IF;
  RETURN QUERY SELECT v_can_send,
    GREATEST(0, v_daily_limit - v_quota.daily_emails_sent),
    v_quota.emails_remaining, v_used_premium;
END; $$;

CREATE OR REPLACE FUNCTION public.activate_email_pack(
  p_supplier_id uuid, p_emails_to_add integer DEFAULT 200, p_order_id text DEFAULT NULL
) RETURNS TABLE(emails_remaining integer, lifetime_purchased integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_quota supplier_email_quotas%ROWTYPE;
BEGIN
  IF p_emails_to_add <= 0 THEN RAISE EXCEPTION 'p_emails_to_add must be positive'; END IF;
  IF p_order_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM email_subscription_payments WHERE order_id = p_order_id AND status = 'credited'
  ) THEN
    SELECT * INTO v_quota FROM supplier_email_quotas WHERE supplier_id = p_supplier_id;
    RETURN QUERY SELECT COALESCE(v_quota.emails_remaining, 0), COALESCE(v_quota.lifetime_emails_purchased, 0);
    RETURN;
  END IF;
  INSERT INTO supplier_email_quotas (supplier_id, emails_remaining, lifetime_emails_purchased, last_pack_activated_at)
  VALUES (p_supplier_id, p_emails_to_add, p_emails_to_add, now())
  ON CONFLICT (supplier_id) DO UPDATE
    SET emails_remaining = supplier_email_quotas.emails_remaining + EXCLUDED.emails_remaining,
        lifetime_emails_purchased = supplier_email_quotas.lifetime_emails_purchased + EXCLUDED.emails_remaining,
        last_pack_activated_at = now(), updated_at = now()
  RETURNING * INTO v_quota;
  IF p_order_id IS NOT NULL THEN
    UPDATE email_subscription_payments SET status = 'credited', paid_at = COALESCE(paid_at, now())
      WHERE order_id = p_order_id;
  END IF;
  RETURN QUERY SELECT v_quota.emails_remaining, v_quota.lifetime_emails_purchased;
END; $$;
