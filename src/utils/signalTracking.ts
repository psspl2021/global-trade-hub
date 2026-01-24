/**
 * ================================================================
 * SAFE SIGNAL PROMOTION UTILITY
 * ================================================================
 * 
 * This utility handles throttled signal promotion to prevent
 * bot abuse and ensure the demand heatmap stays accurate.
 * 
 * Uses the safe_promote_signal RPC with 30-min cooldown per session/IP.
 * ================================================================
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Get or create a persistent session ID for signal tracking
 * Uses localStorage for persistence across page reloads
 */
function getSessionId(): string {
  const existingId = localStorage.getItem("ps_session_id");
  if (existingId) return existingId;
  
  const newId = crypto.randomUUID();
  localStorage.setItem("ps_session_id", newId);
  return newId;
}

/**
 * Safely promote a signal page view or RFQ submission with throttling
 * 
 * @param signalPageId - The UUID of the signal page
 * @param isRFQ - Whether this is an RFQ submission (higher weight)
 * 
 * Features:
 * - 30-minute cooldown per session/IP
 * - Bot protection via RPC validation
 * - Silent failure to prevent UX disruption
 */
export async function promoteSignalSafely(
  signalPageId: string,
  isRFQ: boolean = false
): Promise<void> {
  if (!signalPageId) return;

  try {
    const sessionId = getSessionId();

    // Call the safe_promote_signal RPC with throttling (RPC exists in DB)
    await supabase.rpc("safe_promote_signal", {
      p_signal_page_id: signalPageId,
      p_session_id: sessionId,
      p_ip: "client", // Backend captures actual IP from headers
      p_is_rfq: isRFQ,
    });
  } catch (err) {
    // Silent fail - don't interrupt user flow
    console.warn("[signalTracking] Signal promotion skipped / throttled:", err);
  }
}

/**
 * Track a page view with throttled signal promotion
 */
export async function trackPageView(signalPageId: string): Promise<void> {
  await promoteSignalSafely(signalPageId, false);
}

/**
 * Track an RFQ submission with throttled signal promotion
 */
export async function trackRFQSubmission(signalPageId: string): Promise<void> {
  await promoteSignalSafely(signalPageId, true);
}
