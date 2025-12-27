-- Create supplier email logs table to track every email sent
CREATE TABLE public.supplier_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  requirement_id UUID,
  brevo_message_id TEXT,
  email_type TEXT NOT NULL DEFAULT 'requirement_notification',
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  bounce_reason TEXT,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier subscription history table
CREATE TABLE public.supplier_subscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free',
  amount_paid NUMERIC DEFAULT 0,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  plan_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  emails_allowed INTEGER NOT NULL DEFAULT 60,
  emails_used INTEGER NOT NULL DEFAULT 0,
  admin_notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_supplier_email_logs_supplier ON supplier_email_logs(supplier_id);
CREATE INDEX idx_supplier_email_logs_brevo_id ON supplier_email_logs(brevo_message_id);
CREATE INDEX idx_supplier_email_logs_sent_at ON supplier_email_logs(sent_at);
CREATE INDEX idx_subscription_history_supplier ON supplier_subscription_history(supplier_id);

-- Enable RLS
ALTER TABLE public.supplier_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for email logs
CREATE POLICY "Admins can view all email logs"
  ON supplier_email_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email logs"
  ON supplier_email_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update email logs"
  ON supplier_email_logs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Suppliers can view own email logs"
  ON supplier_email_logs FOR SELECT
  USING (auth.uid() = supplier_id);

-- Allow service role / edge functions to insert logs
CREATE POLICY "Service can insert email logs"
  ON supplier_email_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update email logs"
  ON supplier_email_logs FOR UPDATE
  USING (true);

-- RLS policies for subscription history
CREATE POLICY "Admins can view all subscription history"
  ON supplier_subscription_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage subscription history"
  ON supplier_subscription_history FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Suppliers can view own subscription history"
  ON supplier_subscription_history FOR SELECT
  USING (auth.uid() = supplier_id);

-- Function to get supplier email stats for admin
CREATE OR REPLACE FUNCTION public.get_supplier_email_stats(p_supplier_id UUID DEFAULT NULL)
RETURNS TABLE (
  supplier_id UUID,
  total_sent INTEGER,
  total_delivered INTEGER,
  total_opened INTEGER,
  total_clicked INTEGER,
  total_bounced INTEGER,
  delivery_rate NUMERIC,
  open_rate NUMERIC,
  click_rate NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sel.supplier_id,
    COUNT(*)::INTEGER as total_sent,
    COUNT(*) FILTER (WHERE sel.status = 'delivered' OR sel.delivered_at IS NOT NULL)::INTEGER as total_delivered,
    COUNT(*) FILTER (WHERE sel.opened_at IS NOT NULL)::INTEGER as total_opened,
    COUNT(*) FILTER (WHERE sel.clicked_at IS NOT NULL)::INTEGER as total_clicked,
    COUNT(*) FILTER (WHERE sel.status = 'bounced' OR sel.bounced_at IS NOT NULL)::INTEGER as total_bounced,
    ROUND(
      COUNT(*) FILTER (WHERE sel.status = 'delivered' OR sel.delivered_at IS NOT NULL)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 2
    ) as delivery_rate,
    ROUND(
      COUNT(*) FILTER (WHERE sel.opened_at IS NOT NULL)::NUMERIC / 
      NULLIF(COUNT(*) FILTER (WHERE sel.status = 'delivered' OR sel.delivered_at IS NOT NULL), 0) * 100, 2
    ) as open_rate,
    ROUND(
      COUNT(*) FILTER (WHERE sel.clicked_at IS NOT NULL)::NUMERIC / 
      NULLIF(COUNT(*) FILTER (WHERE sel.opened_at IS NOT NULL), 0) * 100, 2
    ) as click_rate
  FROM supplier_email_logs sel
  WHERE (p_supplier_id IS NULL OR sel.supplier_id = p_supplier_id)
  GROUP BY sel.supplier_id;
$$;

-- Function to log email and increment quota
CREATE OR REPLACE FUNCTION public.log_email_sent(
  p_supplier_id UUID,
  p_requirement_id UUID,
  p_brevo_message_id TEXT,
  p_recipient_email TEXT,
  p_subject TEXT,
  p_email_type TEXT DEFAULT 'requirement_notification'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Insert email log
  INSERT INTO supplier_email_logs (
    supplier_id, requirement_id, brevo_message_id, 
    recipient_email, subject, email_type, status
  )
  VALUES (
    p_supplier_id, p_requirement_id, p_brevo_message_id,
    p_recipient_email, p_subject, p_email_type, 'sent'
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function for admin to adjust quota
CREATE OR REPLACE FUNCTION public.admin_adjust_supplier_quota(
  p_supplier_id UUID,
  p_daily_adjustment INTEGER DEFAULT 0,
  p_monthly_adjustment INTEGER DEFAULT 0,
  p_set_subscription BOOLEAN DEFAULT FALSE,
  p_subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can adjust quotas';
  END IF;
  
  -- Update quota
  UPDATE supplier_email_quotas
  SET 
    daily_emails_sent = GREATEST(0, daily_emails_sent + p_daily_adjustment),
    monthly_emails_sent = GREATEST(0, monthly_emails_sent + p_monthly_adjustment),
    has_email_subscription = COALESCE(p_set_subscription, has_email_subscription),
    subscription_expires_at = COALESCE(p_subscription_expires_at, subscription_expires_at),
    updated_at = now()
  WHERE supplier_id = p_supplier_id;
  
  -- Create subscription history record if upgrading
  IF p_set_subscription = TRUE AND p_subscription_expires_at IS NOT NULL THEN
    INSERT INTO supplier_subscription_history (
      supplier_id, plan_type, plan_started_at, plan_expires_at, 
      emails_allowed, created_by
    )
    VALUES (
      p_supplier_id, 'premium', now(), p_subscription_expires_at,
      500, auth.uid()
    );
  END IF;
  
  RETURN TRUE;
END;
$$;