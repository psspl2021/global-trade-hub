CREATE OR REPLACE FUNCTION public.detect_nudge_conversions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_nudge_logs nl
  SET
    conversion_after_nudge = true,
    conversion_detected_at = r.created_at,
    conversion_event_type = 'referral_' || r.status
  FROM referrals r
  WHERE r.referrer_id = nl.affiliate_user_id
    AND r.created_at > nl.sent_at
    AND r.created_at <= nl.sent_at + interval '48 hours'
    AND r.status IN ('signed_up', 'rewarded')
    AND nl.conversion_after_nudge IS DISTINCT FROM true;
END;
$$;