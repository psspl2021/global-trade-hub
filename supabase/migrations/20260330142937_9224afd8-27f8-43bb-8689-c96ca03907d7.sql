CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_nudge_logs_user_id ON affiliate_nudge_logs(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_nudge_logs_sent_at ON affiliate_nudge_logs(sent_at DESC);