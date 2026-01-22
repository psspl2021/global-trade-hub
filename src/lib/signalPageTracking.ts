import { supabase } from '@/integrations/supabase/client';

/**
 * Generate or retrieve session ID for throttling
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('ps_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('ps_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track page-level intent score increment using SAFE THROTTLED RPC
 * Prevents spam/bot abuse with 30-min cooldown per session/IP
 * NO UI CHANGE - background tracking only
 */
export async function trackSignalPromotion(
  signalPageId: string,
  isRfq: boolean = false
): Promise<void> {
  if (!signalPageId) return;

  const sessionId = getSessionId();

  try {
    // Use safe_promote_signal RPC with throttling
    await (supabase.rpc as any)('safe_promote_signal', {
      p_signal_page_id: signalPageId,
      p_session_id: sessionId,
      p_ip: '', // IP is captured server-side if needed
      p_is_rfq: isRfq
    });
  } catch (error) {
    // Silent fail - don't interrupt user flow
    console.error('[signalPageTracking] Safe promotion failed:', error);
  }
}

/**
 * Track page-level intent score increment using atomic RPC
 * @deprecated Use trackSignalPromotion with throttling instead
 * NO UI CHANGE - background tracking only
 */
export async function trackIntentScore(
  signalPageId: string,
  event: 'page_view' | 'rfq_modal_opened' | 'rfq_submitted'
): Promise<void> {
  if (!signalPageId) return;

  const scoreMap = {
    page_view: 1,
    rfq_modal_opened: 2,
    rfq_submitted: 5,
  };

  const delta = scoreMap[event];

  try {
    // Use atomic RPC function - lock-safe at scale
    await supabase.rpc('increment_intent_score', {
      page_id: signalPageId,
      delta
    });
  } catch (error) {
    // Silent fail - don't interrupt user flow
    console.error('[signalPageTracking] Intent score update failed:', error);
  }
}

/**
 * Increment page views using SAFE THROTTLED RPC
 * Replaces direct incrementPageViews with bot-protection
 */
export async function incrementPageViews(signalPageId: string): Promise<void> {
  if (!signalPageId) return;
  // Use throttled promotion instead
  await trackSignalPromotion(signalPageId, false);
}

/**
 * Increment RFQ submitted count using SAFE THROTTLED RPC
 */
export async function incrementRFQCount(signalPageId: string): Promise<void> {
  if (!signalPageId) return;
  // Use throttled promotion with RFQ flag
  await trackSignalPromotion(signalPageId, true);
}

interface DemandSignalData {
  signalPageId: string;
  signalPageCategory: string;
  subcategory?: string;
  industry?: string;
  estimatedValue?: number;
  deliveryLocation?: string;
  productDescription?: string;
  estimatedQuantity?: number;
  estimatedUnit?: string;
  country: string; // CRITICAL: Geo-specific demand intelligence
}

/**
 * Auto-create demand intelligence signal on RFQ submission
 * CRITICAL: Every RFQ must become AI-readable demand
 */
export async function createDemandSignal(data: DemandSignalData): Promise<string | null> {
  try {
    const { data: signal, error } = await supabase
      .from('demand_intelligence_signals')
      .insert({
        signal_source: 'signal_page',
        signal_page_id: data.signalPageId,
        category: data.signalPageCategory,
        subcategory: data.subcategory,
        industry: data.industry,
        estimated_value: data.estimatedValue,
        delivery_location: data.deliveryLocation,
        product_description: data.productDescription,
        estimated_quantity: data.estimatedQuantity,
        estimated_unit: data.estimatedUnit,
        country: data.country, // Geo-specific demand tracking
        buyer_type: 'unknown_external',
        classification: 'buy',
        decision_action: 'pending',
        confidence_score: 0.7, // Default confidence for signal page submissions
        discovered_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[signalPageTracking] Failed to create demand signal:', error);
      return null;
    }

    console.log('[signalPageTracking] Created demand signal:', signal?.id);
    return signal?.id || null;
  } catch (error) {
    console.error('[signalPageTracking] Error creating demand signal:', error);
    return null;
  }
}
