-- Create admin activity logs table for audit purposes
CREATE TABLE public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  target_details jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.admin_activity_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert activity logs (for edge functions)
CREATE POLICY "Service role can insert activity logs"
ON public.admin_activity_logs FOR INSERT
WITH CHECK (true);

-- Indexes for fast queries
CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX idx_admin_activity_logs_action_type ON public.admin_activity_logs(action_type);
CREATE INDEX idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);