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
    AND r.created_at >= nl.sent_at
    AND r.created_at <= nl.sent_at + interval '48 hours'
    AND r.status IN ('signed_up', 'rewarded')
    AND nl.conversion_after_nudge IS DISTINCT FROM true
    AND nl.channel = 'whatsapp';
END;
$$;

CREATE OR REPLACE VIEW public.nudge_impact_analytics AS
SELECT
  nudge_type,
  COUNT(*) AS total_sent,
  COUNT(*) FILTER (WHERE channel = 'whatsapp') AS delivered,
  COUNT(*) FILTER (WHERE channel = 'whatsapp_failed') AS failed,
  COUNT(*) FILTER (WHERE conversion_after_nudge = true) AS converted,
  ROUND(
    COUNT(*) FILTER (WHERE conversion_after_nudge = true)::numeric
    / NULLIF(COUNT(*) FILTER (WHERE channel = 'whatsapp'), 0) * 100, 1
  ) AS conversion_rate,
  COUNT(*) FILTER (WHERE sent_at >= CURRENT_DATE) AS sent_today,
  COUNT(*) FILTER (WHERE conversion_after_nudge = true AND sent_at >= CURRENT_DATE) AS converted_today,
  COUNT(*) FILTER (WHERE channel = 'whatsapp_failed' AND sent_at >= CURRENT_DATE) AS failed_today,
  ROUND(
    (COUNT(*) FILTER (WHERE conversion_after_nudge = true)::numeric
     / NULLIF(COUNT(*) FILTER (WHERE channel = 'whatsapp'), 0) * 100)
    * LN(COUNT(*) + 1)::numeric, 2
  ) AS effectiveness_score
FROM affiliate_nudge_logs
GROUP BY nudge_type;