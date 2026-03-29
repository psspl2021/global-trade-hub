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
  COUNT(*) FILTER (WHERE sent_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata')) AS sent_today,
  COUNT(*) FILTER (WHERE conversion_after_nudge = true AND sent_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata')) AS converted_today,
  COUNT(*) FILTER (WHERE channel = 'whatsapp_failed' AND sent_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata')) AS failed_today,
  ROUND(
    (COUNT(*) FILTER (WHERE conversion_after_nudge = true)::numeric
     / NULLIF(COUNT(*) FILTER (WHERE channel = 'whatsapp'), 0) * 100)
    * LN(COUNT(*) + 1)::numeric, 2
  ) AS effectiveness_score,
  COUNT(*) FILTER (WHERE channel = 'whatsapp' AND conversion_after_nudge IS NOT TRUE) AS no_conversion
FROM affiliate_nudge_logs
GROUP BY nudge_type;