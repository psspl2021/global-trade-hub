ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS last_nudged_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS last_nudge_type TEXT DEFAULT NULL;

-- Create auto_nudge_log table to track all nudges
CREATE TABLE IF NOT EXISTS public.affiliate_nudge_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  nudge_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_nudge_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage nudge logs" ON public.affiliate_nudge_logs
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_nudge_logs_affiliate ON public.affiliate_nudge_logs(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_nudge_logs_created ON public.affiliate_nudge_logs(created_at DESC);