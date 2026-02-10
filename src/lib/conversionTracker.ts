/**
 * Conversion Event Tracker
 * Tracks Page → CTA Click → RFQ Start → RFQ Generated → RFQ Submit
 * Works for anonymous users (pre-login)
 */
import { supabase } from '@/integrations/supabase/client';

// Session ID persists across page navigations within a tab
function getSessionId(): string {
  let sid = sessionStorage.getItem('ps_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('ps_session_id', sid);
  }
  return sid;
}

export type ConversionEventType = 'page_view' | 'cta_click' | 'rfq_start' | 'rfq_generated' | 'rfq_submit';

export async function trackConversionEvent(
  eventType: ConversionEventType,
  metadata?: Record<string, unknown>
) {
  try {
    const sessionId = getSessionId();
    
    await supabase.from('rfq_conversion_events').insert({
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.pathname,
      metadata: metadata || null,
    } as any);
    
    if (import.meta.env.DEV) {
      console.log(`[Conversion] ${eventType}`, metadata);
    }
  } catch (err) {
    // Silent fail — never block UX for analytics
    if (import.meta.env.DEV) console.warn('[Conversion] Track failed:', err);
  }
}
