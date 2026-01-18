import { supabase } from '@/integrations/supabase/client';

/**
 * Intent scoring values for page-level tracking
 * Stored in admin_signal_pages.intent_score
 */
const INTENT_SCORES = {
  PAGE_VIEW: 1,
  RFQ_MODAL_OPENED: 2,
  RFQ_SUBMITTED: 5,
};

/**
 * Track page-level intent score increment
 * NO UI CHANGE - background tracking only
 */
export async function trackIntentScore(
  signalPageId: string,
  event: 'page_view' | 'rfq_modal_opened' | 'rfq_submitted'
): Promise<void> {
  if (!signalPageId) return;

  const scoreMap = {
    page_view: INTENT_SCORES.PAGE_VIEW,
    rfq_modal_opened: INTENT_SCORES.RFQ_MODAL_OPENED,
    rfq_submitted: INTENT_SCORES.RFQ_SUBMITTED,
  };

  const scoreIncrement = scoreMap[event];

  try {
    // Get current score
    const { data: page } = await supabase
      .from('admin_signal_pages')
      .select('intent_score')
      .eq('id', signalPageId)
      .single();

    if (page) {
      const currentScore = page.intent_score || 0;
      await supabase
        .from('admin_signal_pages')
        .update({ 
          intent_score: currentScore + scoreIncrement,
          updated_at: new Date().toISOString()
        })
        .eq('id', signalPageId);
    }
  } catch (error) {
    // Silent fail - don't interrupt user flow
    console.error('[signalPageTracking] Intent score update failed:', error);
  }
}

/**
 * Increment RFQ submitted count on signal page
 */
export async function incrementRFQCount(signalPageId: string): Promise<void> {
  if (!signalPageId) return;

  try {
    const { data: page } = await supabase
      .from('admin_signal_pages')
      .select('rfqs_submitted')
      .eq('id', signalPageId)
      .single();

    if (page) {
      await supabase
        .from('admin_signal_pages')
        .update({ 
          rfqs_submitted: (page.rfqs_submitted || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', signalPageId);
    }
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
