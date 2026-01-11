/**
 * AI Inventory Analytics Tracking
 * Tracks key conversion metrics for the AI inventory discovery flow
 */

import { supabase } from '@/integrations/supabase/client';

export interface ImpressionData {
  buyer_id: string;
  product_id: string;
  supplier_id?: string;
  city_match: boolean;
  match_strength: 'high' | 'medium' | 'low';
  source: 'discovery_card' | 'post_rfq' | 'requirement_detail' | 'browse';
}

export interface RFQConversionData {
  buyer_id: string;
  product_id: string;
  requirement_id: string;
  source: 'ai_inventory' | 'manual';
  match_strength?: 'high' | 'medium' | 'low';
  city_match?: boolean;
  quantity_requested: number;
  quantity_available: number;
}

export interface DealClosureData {
  requirement_id: string;
  bid_id: string;
  source: 'ai_inventory' | 'manual';
  time_to_bid_ms: number;
  time_to_closure_ms: number;
}

// Generate unique session-based key to prevent duplicate tracking
const getSessionKey = (type: string, id: string): string => {
  return `ai_inv_${type}_${id}_${Date.now().toString(36)}`;
};

// Check if already tracked this session
const isAlreadyTracked = (type: string, id: string): boolean => {
  const key = `ai_inv_tracked_${type}_${id}`;
  return !!sessionStorage.getItem(key);
};

// Mark as tracked
const markAsTracked = (type: string, id: string): void => {
  const key = `ai_inv_tracked_${type}_${id}`;
  sessionStorage.setItem(key, '1');
};

/**
 * Track AI Inventory Impression
 * Event: ai_inventory_impression
 */
export async function trackAIInventoryImpression(data: ImpressionData): Promise<void> {
  // Dedupe within session
  if (isAlreadyTracked('impression', data.product_id)) {
    return;
  }

  try {
    await supabase.from('page_visits').insert({
      visitor_id: data.buyer_id,
      session_id: getSessionKey('imp', data.product_id),
      page_path: '/ai-inventory/impression',
      source: data.source,
      utm_content: data.product_id,
      utm_medium: data.match_strength,
      utm_campaign: data.city_match ? 'same_city' : 'different_city',
    });

    markAsTracked('impression', data.product_id);
  } catch (error) {
    console.error('Failed to track impression:', error);
  }
}

/**
 * Track AI Inventory RFQ Conversion
 * Event: ai_inventory_rfq_created
 */
export async function trackAIInventoryRFQCreated(data: RFQConversionData): Promise<void> {
  try {
    await supabase.from('page_visits').insert({
      visitor_id: data.buyer_id,
      session_id: getSessionKey('rfq', data.requirement_id),
      page_path: '/ai-inventory/rfq-created',
      source: data.source,
      utm_content: data.product_id,
      utm_medium: data.match_strength || 'unknown',
      utm_campaign: data.city_match ? 'same_city' : 'different_city',
      utm_term: `qty_${data.quantity_requested}_of_${data.quantity_available}`,
    });
  } catch (error) {
    console.error('Failed to track RFQ creation:', error);
  }
}

/**
 * Track Deal Closure Speed
 * Event: ai_inventory_deal_closed
 */
export async function trackDealClosure(data: DealClosureData): Promise<void> {
  try {
    await supabase.from('page_visits').insert({
      visitor_id: data.requirement_id,
      session_id: getSessionKey('deal', data.bid_id),
      page_path: '/ai-inventory/deal-closed',
      source: data.source,
      utm_medium: `bid_time_${Math.round(data.time_to_bid_ms / 1000 / 60)}min`,
      utm_campaign: `closure_time_${Math.round(data.time_to_closure_ms / 1000 / 60 / 60)}hr`,
    });
  } catch (error) {
    console.error('Failed to track deal closure:', error);
  }
}

/**
 * Calculate AI vs Manual Usage Ratio for dashboard
 */
export async function getAIVsManualRatio(userId?: string): Promise<{ aiCount: number; manualCount: number; ratio: number }> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from('requirements')
      .select('rfq_source')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (userId) {
      query = query.eq('buyer_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const aiCount = (data || []).filter(r => r.rfq_source === 'ai_inventory').length;
    const manualCount = (data || []).filter(r => r.rfq_source !== 'ai_inventory').length;
    const total = aiCount + manualCount;
    const ratio = total > 0 ? (aiCount / total) * 100 : 0;

    return { aiCount, manualCount, ratio };
  } catch (error) {
    console.error('Failed to calculate AI/Manual ratio:', error);
    return { aiCount: 0, manualCount: 0, ratio: 0 };
  }
}
