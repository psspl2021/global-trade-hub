/**
 * ============================================================
 * DEMAND SIGNAL CAPTURE SYSTEM
 * ============================================================
 * 
 * AI-powered demand intelligence that LEARNS from real user behavior.
 * SEO pages become AI sensors that track organic interest.
 * 
 * CRITICAL CONSTRAINTS:
 * - NO fake numbers
 * - NO internal scores exposed publicly
 * - Googlebot sees neutral content only
 * - Canonical URLs unchanged
 */

import { supabase } from '@/integrations/supabase/client';

// ============= TYPES =============

export type PageType = 'product' | 'category' | 'supplier' | 'hub' | 'signal';
export type SignalType = 'SEO_VISIT' | 'RFQ_INTEREST' | 'RFQ_SUBMITTED' | 'SUPPLIER_INQUIRY';
export type TrendDirection = 'emerging' | 'stable' | 'cooling';

export interface DemandSignalEvent {
  event_type: SignalType;
  source: 'organic' | 'direct' | 'referral' | 'paid';
  page_type: PageType;
  product_slug?: string;
  category_slug: string;
  subcategory_slug?: string;
  detected_country: string;
  detected_region: string;
  session_id: string;
  timestamp: string;
}

export interface DemandSignal {
  id?: string;
  country: string;
  country_code: string;
  category: string;
  subcategory?: string;
  month: string; // YYYY-MM format
  signal_type: SignalType;
  count: number;
  last_detected_at: string;
}

export interface MonthlyTrend {
  country: string;
  category: string;
  subcategory?: string;
  month: string;
  trend_direction: TrendDirection;
  previous_month_signals: number;
  current_month_signals: number;
}

// ============= SESSION MANAGEMENT =============

/**
 * Get or create a persistent session ID for signal tracking
 * Uses localStorage for persistence across page reloads
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr-session';
  
  const existingId = localStorage.getItem('ps_demand_session_id');
  if (existingId) return existingId;
  
  const newId = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem('ps_demand_session_id', newId);
  return newId;
}

/**
 * Check if user is a bot/crawler
 */
function isBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|crawl|spider|bot/i.test(userAgent);
}

/**
 * Get traffic source from referrer
 */
function getTrafficSource(): 'organic' | 'direct' | 'referral' | 'paid' {
  if (typeof document === 'undefined') return 'direct';
  
  const referrer = document.referrer.toLowerCase();
  
  if (!referrer) return 'direct';
  
  // Search engines = organic
  if (/google|bing|yahoo|duckduckgo|baidu|yandex/.test(referrer)) {
    return 'organic';
  }
  
  // Check for paid traffic markers
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('gclid') || urlParams.get('utm_medium') === 'cpc') {
    return 'paid';
  }
  
  return 'referral';
}

// ============= LOCAL SIGNAL STORAGE =============

/**
 * Store signal in localStorage for batching
 * Signals are aggregated and sent to server periodically
 */
function storeLocalSignal(signal: DemandSignalEvent): void {
  if (typeof localStorage === 'undefined') return;
  
  const key = 'ps_demand_signals';
  const existing = localStorage.getItem(key);
  const signals: DemandSignalEvent[] = existing ? JSON.parse(existing) : [];
  
  signals.push(signal);
  
  // Keep only last 50 signals to prevent storage bloat
  const trimmed = signals.slice(-50);
  localStorage.setItem(key, JSON.stringify(trimmed));
}

/**
 * Get locally stored signals for processing
 */
export function getLocalSignals(): DemandSignalEvent[] {
  if (typeof localStorage === 'undefined') return [];
  
  const key = 'ps_demand_signals';
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}

/**
 * Clear local signals after successful server sync
 */
export function clearLocalSignals(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('ps_demand_signals');
}

// ============= CORE CAPTURE FUNCTIONS =============

/**
 * Capture SEO page visit as demand signal
 * 
 * WHEN: User lands on any SEO page (category, product, supplier, buy page)
 * DO: Create internal event - NOT shown to user
 * RULE: Just mark \"Interest Detected\" - no numeric values
 */
export async function captureSEOVisit(params: {
  pageType: PageType;
  categorySlug: string;
  subcategorySlug?: string;
  productSlug?: string;
  detectedCountry: string;
  detectedCountryCode: string;
  detectedRegion: string;
}): Promise<void> {
  // Skip bots - they see neutral content only
  if (isBot()) return;
  
  const signal: DemandSignalEvent = {
    event_type: 'SEO_VISIT',
    source: getTrafficSource(),
    page_type: params.pageType,
    product_slug: params.productSlug,
    category_slug: params.categorySlug,
    subcategory_slug: params.subcategorySlug,
    detected_country: params.detectedCountry,
    detected_region: params.detectedRegion,
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
  };
  
  // Store locally first (fast, non-blocking)
  storeLocalSignal(signal);
  
  // Send to server (fire and forget)
  try {
    await sendSignalToServer(signal, params.detectedCountryCode);
  } catch (error) {
    // Silent fail - don't interrupt user flow
    console.warn('[DemandCapture] SEO visit signal failed:', error);
  }
}

/**
 * Capture RFQ interest (modal opened, CTA clicked)
 * This is a stronger signal than page view
 */
export async function captureRFQInterest(params: {
  categorySlug: string;
  subcategorySlug?: string;
  detectedCountry: string;
  detectedCountryCode: string;
  detectedRegion: string;
  sourcePageType: PageType;
}): Promise<void> {
  if (isBot()) return;
  
  const signal: DemandSignalEvent = {
    event_type: 'RFQ_INTEREST',
    source: getTrafficSource(),
    page_type: params.sourcePageType,
    category_slug: params.categorySlug,
    subcategory_slug: params.subcategorySlug,
    detected_country: params.detectedCountry,
    detected_region: params.detectedRegion,
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
  };
  
  storeLocalSignal(signal);
  
  try {
    await sendSignalToServer(signal, params.detectedCountryCode);
  } catch (error) {
    console.warn('[DemandCapture] RFQ interest signal failed:', error);
  }
}

/**
 * Capture successful RFQ submission
 * This is the strongest demand signal
 */
export async function captureRFQSubmission(params: {
  categorySlug: string;
  subcategorySlug?: string;
  detectedCountry: string;
  detectedCountryCode: string;
  detectedRegion: string;
  rfqId: string;
}): Promise<void> {
  if (isBot()) return;
  
  const signal: DemandSignalEvent = {
    event_type: 'RFQ_SUBMITTED',
    source: getTrafficSource(),
    page_type: 'product',
    category_slug: params.categorySlug,
    subcategory_slug: params.subcategorySlug,
    detected_country: params.detectedCountry,
    detected_region: params.detectedRegion,
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
  };
  
  storeLocalSignal(signal);
  
  try {
    await sendSignalToServer(signal, params.detectedCountryCode);
  } catch (error) {
    console.warn('[DemandCapture] RFQ submission signal failed:', error);
  }
}

// ============= SERVER SYNC =============

/**
 * Send signal to server via demand_intelligence_signals table
 * Uses existing table structure for compatibility
 */
async function sendSignalToServer(
  signal: DemandSignalEvent,
  countryCode: string
): Promise<void> {
  // Map signal type to classification
  const classificationMap: Record<SignalType, string> = {
    'SEO_VISIT': 'research',
    'RFQ_INTEREST': 'research',
    'RFQ_SUBMITTED': 'buy',
    'SUPPLIER_INQUIRY': 'research',
  };
  
  // Calculate intent score based on signal type
  const intentScoreMap: Record<SignalType, number> = {
    'SEO_VISIT': 0.2,
    'RFQ_INTEREST': 0.5,
    'RFQ_SUBMITTED': 0.9,
    'SUPPLIER_INQUIRY': 0.3,
  };
  
  await supabase.from('demand_intelligence_signals').insert({
    signal_source: signal.source,
    category: signal.category_slug,
    subcategory: signal.subcategory_slug,
    country: countryCode.toUpperCase(),
    buyer_type: 'unknown_external',
    classification: classificationMap[signal.event_type],
    intent_score: intentScoreMap[signal.event_type],
    confidence_score: 0.6, // Moderate confidence for organic signals
    decision_action: 'pending',
    discovered_at: signal.timestamp,
    lane_state: signal.event_type === 'RFQ_SUBMITTED' ? 'confirmed' : 'detected',
    product_description: signal.subcategory_slug || signal.category_slug,
    delivery_location: signal.detected_country,
  });
}

// ============= TREND CALCULATION =============

/**
 * Calculate monthly trend direction
 * Compares this month vs last month signals
 * 
 * OUTPUT ONLY DIRECTION - No numbers exposed
 * - ↑ Emerging (more RFQ than last month)
 * - → Stable (same activity)
 * - ↓ Cooling (less activity)
 */
export function calculateTrendDirection(
  currentMonthSignals: number,
  previousMonthSignals: number
): TrendDirection {
  if (previousMonthSignals === 0) {
    return currentMonthSignals > 0 ? 'emerging' : 'stable';
  }
  
  const changeRatio = currentMonthSignals / previousMonthSignals;
  
  if (changeRatio > 1.2) return 'emerging';
  if (changeRatio < 0.8) return 'cooling';
  return 'stable';
}

/**
 * Get trend emoji for display
 */
export function getTrendEmoji(direction: TrendDirection): string {
  switch (direction) {
    case 'emerging': return '↑';
    case 'stable': return '→';
    case 'cooling': return '↓';
    default: return '→';
  }
}

/**
 * Get trend label for display (GEO-safe language)
 */
export function getTrendLabel(direction: TrendDirection): string {
  switch (direction) {
    case 'emerging': return 'Emerging';
    case 'stable': return 'Stable';
    case 'cooling': return 'Cooling';
    default: return 'Monitoring';
  }
}

// ============= GRID STATE UPDATES =============

/**
 * Get grid state based on real signals
 * 
 * IF SEO_VISIT detected → State = \"Detected\"
 * IF RFQ_INTEREST detected → State = \"Confirmed\"
 * IF Repeated RFQs → Lane Recommendation = \"Activate Lane\"
 */
export type GridState = 'Detected' | 'Confirmed' | 'Active';
export type LaneRecommendation = 'No Lane' | 'Consider Activation' | 'Activate Lane' | 'Lane Active';

export function deriveGridState(signals: DemandSignalEvent[]): GridState {
  if (signals.length === 0) return 'Detected';
  
  const hasRFQSubmission = signals.some(s => s.event_type === 'RFQ_SUBMITTED');
  const hasRFQInterest = signals.some(s => s.event_type === 'RFQ_INTEREST');
  
  if (hasRFQSubmission) return 'Active';
  if (hasRFQInterest) return 'Confirmed';
  return 'Detected';
}

export function deriveLaneRecommendation(signals: DemandSignalEvent[]): LaneRecommendation {
  if (signals.length === 0) return 'No Lane';
  
  const rfqSubmissions = signals.filter(s => s.event_type === 'RFQ_SUBMITTED');
  const rfqInterests = signals.filter(s => s.event_type === 'RFQ_INTEREST');
  
  if (rfqSubmissions.length >= 3) return 'Activate Lane';
  if (rfqSubmissions.length >= 1 || rfqInterests.length >= 5) return 'Consider Activation';
  return 'No Lane';
}

// ============= DEV UTILITIES =============

/**
 * Log demand signal capture stats
 */
export function logDemandCaptureStats(): void {
  if (import.meta.env.DEV) {
    const localSignals = getLocalSignals();
    
    console.group('🧠 Demand Signal Capture System');
    console.log('Local signals pending:', localSignals.length);
    console.log('Session ID:', getSessionId());
    console.log('Is Bot:', isBot());
    console.log('Traffic Source:', getTrafficSource());
    console.groupEnd();
  }
}

/**
 * Get aggregate signal stats for a time period
 * Used for Monthly AI Demand Timeline
 */
export function aggregateSignalsByMonth(signals: DemandSignalEvent[]): Map<string, number> {
  const monthlyAggregates = new Map<string, number>();
  
  signals.forEach(signal => {
    const date = new Date(signal.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    monthlyAggregates.set(monthKey, (monthlyAggregates.get(monthKey) || 0) + 1);
  });
  
  return monthlyAggregates;
}

/**
 * Compare two months and return trend direction
 */
export function getMonthlyTrend(
  currentMonth: string,
  previousMonth: string,
  monthlyData: Map<string, number>
): TrendDirection {
  const currentCount = monthlyData.get(currentMonth) || 0;
  const previousCount = monthlyData.get(previousMonth) || 0;
  
  return calculateTrendDirection(currentCount, previousCount);
}

/**
 * Get current month key in YYYY-MM format
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get previous month key in YYYY-MM format
 */
export function getPreviousMonthKey(): string {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
