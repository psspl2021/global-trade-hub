-- ============================================================
-- FIX: Enable RLS on buyer_activation_signals table
-- This table stores user behavior tracking data that should not be publicly accessible
-- ============================================================

-- Enable Row Level Security
ALTER TABLE public.buyer_activation_signals ENABLE ROW LEVEL SECURITY;

-- Admins can view all activation signals for analytics purposes
CREATE POLICY "Admins can view activation signals"
  ON public.buyer_activation_signals
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete activation signals if needed
CREATE POLICY "Admins can delete activation signals"
  ON public.buyer_activation_signals
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow inserts from any role (needed for analytics tracking via service role)
-- The actual insertion is done via service role or RPC
CREATE POLICY "Allow insert for analytics tracking"
  ON public.buyer_activation_signals
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own activation signals (if user_id is set)
CREATE POLICY "Users can view own activation signals"
  ON public.buyer_activation_signals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());