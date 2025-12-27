-- Create supplier email quotas table to track daily/monthly email usage
CREATE TABLE public.supplier_email_quotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL UNIQUE,
  daily_emails_sent INTEGER NOT NULL DEFAULT 0,
  monthly_emails_sent INTEGER NOT NULL DEFAULT 0,
  last_daily_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_monthly_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  has_email_subscription BOOLEAN NOT NULL DEFAULT false,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_email_quotas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own email quotas"
ON public.supplier_email_quotas
FOR SELECT
USING (auth.uid() = supplier_id);

CREATE POLICY "Users can update own email quotas"
ON public.supplier_email_quotas
FOR UPDATE
USING (auth.uid() = supplier_id);

CREATE POLICY "System can insert email quotas"
ON public.supplier_email_quotas
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all email quotas"
ON public.supplier_email_quotas
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all email quotas"
ON public.supplier_email_quotas
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_supplier_email_quotas_updated_at
BEFORE UPDATE ON public.supplier_email_quotas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check and increment email quota
CREATE OR REPLACE FUNCTION public.check_and_increment_email_quota(p_supplier_id UUID)
RETURNS TABLE(can_send BOOLEAN, remaining_daily INTEGER, remaining_monthly INTEGER, is_subscribed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota supplier_email_quotas%ROWTYPE;
  v_daily_limit INTEGER := 2;
  v_monthly_limit INTEGER := 500;
  v_can_send BOOLEAN := false;
  v_remaining_daily INTEGER := 0;
  v_remaining_monthly INTEGER := 0;
  v_is_subscribed BOOLEAN := false;
BEGIN
  -- Get or create quota record
  SELECT * INTO v_quota FROM supplier_email_quotas WHERE supplier_id = p_supplier_id;
  
  IF NOT FOUND THEN
    INSERT INTO supplier_email_quotas (supplier_id)
    VALUES (p_supplier_id)
    RETURNING * INTO v_quota;
  END IF;
  
  -- Reset daily counter if new day
  IF v_quota.last_daily_reset::date < CURRENT_DATE THEN
    UPDATE supplier_email_quotas 
    SET daily_emails_sent = 0, last_daily_reset = now()
    WHERE supplier_id = p_supplier_id
    RETURNING * INTO v_quota;
  END IF;
  
  -- Reset monthly counter if new month
  IF DATE_TRUNC('month', v_quota.last_monthly_reset) < DATE_TRUNC('month', CURRENT_TIMESTAMP) THEN
    UPDATE supplier_email_quotas 
    SET monthly_emails_sent = 0, last_monthly_reset = now()
    WHERE supplier_id = p_supplier_id
    RETURNING * INTO v_quota;
  END IF;
  
  -- Check subscription validity
  v_is_subscribed := v_quota.has_email_subscription AND 
                     v_quota.subscription_expires_at IS NOT NULL AND 
                     v_quota.subscription_expires_at > now();
  
  -- Calculate limits based on subscription status
  IF v_is_subscribed THEN
    v_remaining_daily := v_monthly_limit; -- No daily limit for subscribers
    v_remaining_monthly := v_monthly_limit - v_quota.monthly_emails_sent;
    v_can_send := v_remaining_monthly > 0;
  ELSE
    v_remaining_daily := v_daily_limit - v_quota.daily_emails_sent;
    v_remaining_monthly := v_daily_limit; -- Free users limited by daily quota
    v_can_send := v_remaining_daily > 0;
  END IF;
  
  -- Increment counters if can send
  IF v_can_send THEN
    UPDATE supplier_email_quotas 
    SET daily_emails_sent = daily_emails_sent + 1,
        monthly_emails_sent = monthly_emails_sent + 1,
        updated_at = now()
    WHERE supplier_id = p_supplier_id;
  END IF;
  
  RETURN QUERY SELECT v_can_send, 
                      GREATEST(0, v_remaining_daily - CASE WHEN v_can_send THEN 1 ELSE 0 END),
                      GREATEST(0, v_remaining_monthly - CASE WHEN v_can_send THEN 1 ELSE 0 END),
                      v_is_subscribed;
END;
$$;

-- Function to get email quota status without incrementing
CREATE OR REPLACE FUNCTION public.get_email_quota_status(p_supplier_id UUID)
RETURNS TABLE(daily_sent INTEGER, monthly_sent INTEGER, daily_limit INTEGER, monthly_limit INTEGER, is_subscribed BOOLEAN, subscription_expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota supplier_email_quotas%ROWTYPE;
  v_is_subscribed BOOLEAN := false;
BEGIN
  SELECT * INTO v_quota FROM supplier_email_quotas WHERE supplier_id = p_supplier_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, 2, 2, false, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Check subscription validity
  v_is_subscribed := v_quota.has_email_subscription AND 
                     v_quota.subscription_expires_at IS NOT NULL AND 
                     v_quota.subscription_expires_at > now();
  
  -- Reset counters for display if needed
  IF v_quota.last_daily_reset::date < CURRENT_DATE THEN
    RETURN QUERY SELECT 0, 
                        CASE WHEN DATE_TRUNC('month', v_quota.last_monthly_reset) < DATE_TRUNC('month', CURRENT_TIMESTAMP) 
                             THEN 0 ELSE v_quota.monthly_emails_sent END,
                        CASE WHEN v_is_subscribed THEN 500 ELSE 2 END,
                        CASE WHEN v_is_subscribed THEN 500 ELSE 2 END,
                        v_is_subscribed,
                        v_quota.subscription_expires_at;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT v_quota.daily_emails_sent, 
                      v_quota.monthly_emails_sent,
                      CASE WHEN v_is_subscribed THEN 500 ELSE 2 END,
                      CASE WHEN v_is_subscribed THEN 500 ELSE 2 END,
                      v_is_subscribed,
                      v_quota.subscription_expires_at;
END;
$$;