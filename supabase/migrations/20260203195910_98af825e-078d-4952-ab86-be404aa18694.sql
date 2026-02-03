-- ============================================================
-- FIX: Enable RLS on user_sessions and buyer_activity_logs tables
-- These tables were flagged as CRITICAL security vulnerabilities
-- ============================================================

-- 1. Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for user_sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Enable RLS on buyer_activity_logs
ALTER TABLE buyer_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for buyer_activity_logs
CREATE POLICY "Users can view own activity logs"
  ON buyer_activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
  ON buyer_activity_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert activity logs"
  ON buyer_activity_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own activity logs"
  ON buyer_activity_logs FOR UPDATE
  USING (auth.uid() = user_id);