-- Add conversion tracking column to affiliate_nudge_logs
ALTER TABLE public.affiliate_nudge_logs 
ADD COLUMN IF NOT EXISTS conversion_after_nudge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conversion_detected_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conversion_event_type TEXT DEFAULT NULL;

-- Create a SQL function to detect nudge conversions (within 48hrs of nudge)
CREATE OR REPLACE FUNCTION public.detect_nudge_conversions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark nudges as converted if the affiliate had a referral event within 48 hours
  UPDATE affiliate_nudge_logs nl
  SET 
    conversion_after_nudge = true,
    conversion_detected_at = now(),
    conversion_event_type = sub.event_type
  FROM (
    SELECT DISTINCT ON (nl2.id)
      nl2.id AS nudge_id,
      CASE
        WHEN r.status = 'rewarded' THEN 'rewarded'
        WHEN r.status = 'signed_up' THEN 'signed_up'
        ELSE 'referral'
      END AS event_type
    FROM affiliate_nudge_logs nl2
    JOIN referrals r ON r.referrer_id = nl2.affiliate_user_id
    WHERE nl2.conversion_after_nudge = false
      AND nl2.channel = 'whatsapp'
      AND nl2.sent_at IS NOT NULL
      AND r.created_at > nl2.sent_at
      AND r.created_at <= nl2.sent_at + interval '48 hours'
    ORDER BY nl2.id, 
      CASE r.status WHEN 'rewarded' THEN 1 WHEN 'signed_up' THEN 2 ELSE 3 END
  ) sub
  WHERE nl.id = sub.nudge_id;
END;
$$;

-- Create a view for nudge impact analytics
CREATE OR REPLACE VIEW public.nudge_impact_analytics AS
SELECT
  nudge_type,
  COUNT(*) AS total_sent,
  COUNT(*) FILTER (WHERE channel = 'whatsapp') AS delivered,
  COUNT(*) FILTER (WHERE conversion_after_nudge = true) AS converted,
  ROUND(
    COUNT(*) FILTER (WHERE conversion_after_nudge = true)::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE channel = 'whatsapp'), 0) * 100, 1
  ) AS conversion_rate,
  COUNT(*) FILTER (WHERE sent_at::date = CURRENT_DATE) AS sent_today,
  COUNT(*) FILTER (WHERE conversion_after_nudge = true AND conversion_detected_at::date = CURRENT_DATE) AS converted_today
FROM affiliate_nudge_logs
GROUP BY nudge_type;

-- Grant access
GRANT SELECT ON public.nudge_impact_analytics TO authenticated;