import { supabase } from '@/integrations/supabase/client';

/**
 * Track page-level intent score increment using atomic RPC
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
 * Increment page views using atomic RPC (also adds +1 intent score)
 */
export async function incrementPageViews(signalPageId: string): Promise<void> {
  if (!signalPageId) return;

  try {
    await supabase.rpc('increment_page_views', {
      page_id: signalPageId
    });
  } catch (error) {
    console.error('[signalPageTracking] Page views increment failed:', error);
  }
}

/**
 * Increment RFQ submitted count using atomic RPC
 */
export async function incrementRFQCount(signalPageId: string): Promise<void> {
  if (!signalPageId) return;

  try {
    await supabase.rpc('increment_rfq_count', {
      page_id: signalPageId
    });
  } catch (error) {
    console.error('[signalPageTracking] RFQ count increment failed:', error);
  }
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
