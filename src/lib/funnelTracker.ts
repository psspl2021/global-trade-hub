/**
 * Multi-step Funnel Attribution Tracker
 * Tracks: Landing → Scroll 50% → CTA Click → RFQ Form View → RFQ Submit
 * With page-level revenue attribution
 */
import { supabase } from '@/integrations/supabase/client';

function getSessionId(): string {
  let sid = sessionStorage.getItem('ps_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('ps_session_id', sid);
  }
  return sid;
}

function detectPageType(path: string): string {
  if (path.startsWith('/compare/')) return 'comparison';
  if (path.startsWith('/use-case/')) return 'use-case';
  if (path.startsWith('/demand/')) return 'demand';
  if (path.startsWith('/source/')) return 'country';
  if (path.startsWith('/import/')) return 'country-comparison';
  if (path.startsWith('/procurement/')) return 'signal';
  if (path === '/') return 'homepage';
  return 'other';
}

function extractSlug(path: string): { sku?: string; country?: string } {
  const demandMatch = path.match(/\/demand\/([^/?#]+)/);
  const compareMatch = path.match(/\/compare\/([^/?#]+)/);
  const useCaseMatch = path.match(/\/use-case\/([^/?#]+)/);
  const sourceMatch = path.match(/\/source\/([^/?#]+)/);
  const importMatch = path.match(/\/import\/([^/?#]+)/);

  return {
    sku: demandMatch?.[1] || compareMatch?.[1] || useCaseMatch?.[1],
    country: sourceMatch?.[1] || importMatch?.[1],
  };
}

export async function trackFunnelStep(
  step: 'landing' | 'scroll_50' | 'cta_click' | 'rfq_form_view' | 'rfq_submit',
  metadata?: { rfqId?: string }
) {
  try {
    const sessionId = getSessionId();
    const path = window.location.pathname;
    const pageType = detectPageType(path);
    const { sku, country } = extractSlug(path);

    if (step === 'landing') {
      // Create new funnel session
      await supabase.from('funnel_sessions').insert({
        session_id: sessionId,
        landing_page: path,
        source_page_type: pageType,
        sku_slug: sku || null,
        country_slug: country || null,
      } as any);
      return;
    }

    // Update existing funnel session
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (step === 'scroll_50') updateData.scroll_50_at = new Date().toISOString();
    if (step === 'cta_click') updateData.cta_click_at = new Date().toISOString();
    if (step === 'rfq_form_view') updateData.rfq_form_view_at = new Date().toISOString();
    if (step === 'rfq_submit') {
      updateData.rfq_submit_at = new Date().toISOString();
      if (metadata?.rfqId) updateData.rfq_id = metadata.rfqId;
    }

    await supabase
      .from('funnel_sessions')
      .update(updateData)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Funnel] Track failed:', err);
  }
}

export async function trackRevenueAttribution(
  rfqId: string,
  revenueValue?: number
) {
  try {
    const sessionId = getSessionId();
    const path = window.location.pathname;
    const pageType = detectPageType(path);
    const { sku, country } = extractSlug(path);

    await supabase.from('rfq_revenue_attribution').insert({
      rfq_id: rfqId,
      page_path: path,
      source_page_type: pageType,
      sku_slug: sku || null,
      country_slug: country || null,
      revenue_value: revenueValue || 0,
      session_id: sessionId,
    } as any);
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Revenue] Attribution failed:', err);
  }
}
