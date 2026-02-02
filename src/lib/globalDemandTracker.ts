/**
 * ============================================================
 * GLOBAL DEMAND TRACKER
 * ============================================================
 * 
 * AI-powered global demand tracking for ALL ~1200 SEO pages.
 * Automatically captures page visits, classifies page types,
 * extracts categories, and calculates intent scores.
 * 
 * This single tracker replaces per-page tracking and works for:
 * - /buy-{product} pages
 * - /{product}-suppliers pages
 * - /procurement/{category} pages
 * - /categories/{category} pages
 * - All other SEO pages
 */

import { supabase } from '@/integrations/supabase/client';

// ============= TYPES =============

export type SEOPageType = 'BUY' | 'SUPPLIER' | 'PROCUREMENT' | 'CATEGORY' | 'GEO' | 'GUIDE' | 'OTHER';

export interface GlobalDemandEvent {
  path: string;
  referrer: string;
  country: string;
  countryCode: string;
  timestamp: number;
  pageType: SEOPageType;
  category: string;
  scrollDepth?: number;
  hasRFQ?: boolean;
}

// ============= PAGE CLASSIFICATION =============

/**
 * Auto-classify page type from URL path
 * CRITICAL: This enables AI to understand intent from URL structure
 */
export function classifyPage(path: string): SEOPageType {
  const normalizedPath = path.toLowerCase().replace(/^\/+/, '');
  
  if (normalizedPath.startsWith('buy-')) return 'BUY';
  if (normalizedPath.endsWith('-suppliers')) return 'SUPPLIER';
  if (normalizedPath.startsWith('procurement/')) return 'PROCUREMENT';
  if (normalizedPath.startsWith('categories/')) return 'CATEGORY';
  if (normalizedPath.match(/^(usa|uk|europe|germany|singapore|uae|saudi)\//)) return 'GEO';
  if (normalizedPath.includes('guide') || normalizedPath.includes('how-to')) return 'GUIDE';
  
  return 'OTHER';
}

/**
 * Extract category/product from URL path
 * Works across all SEO page patterns
 */
export function extractCategory(path: string): string {
  const normalizedPath = path.toLowerCase().replace(/^\/+/, '').replace(/\/+$/, '');
  
  // /buy-steel-pipes → steel-pipes
  if (normalizedPath.startsWith('buy-')) {
    return normalizedPath.replace('buy-', '');
  }
  
  // /procurement/textile-fabrics → textile-fabrics
  if (normalizedPath.startsWith('procurement/')) {
    return normalizedPath.replace('procurement/', '').split('/')[0];
  }
  
  // /steel-pipes-suppliers → steel-pipes
  if (normalizedPath.endsWith('-suppliers')) {
    return normalizedPath.replace('-suppliers', '');
  }
  
  // /categories/steel → steel
  if (normalizedPath.startsWith('categories/')) {
    return normalizedPath.replace('categories/', '').split('/')[0];
  }
  
  // GEO pages: /usa/procurement/steel → steel
  const geoMatch = normalizedPath.match(/^(usa|uk|europe|germany|singapore|uae|saudi)\/procurement\/(.+)/);
  if (geoMatch) {
    return geoMatch[2];
  }
  
  // Fallback: use first path segment
  return normalizedPath.split('/')[0] || 'general';
}

/**
 * Extract country from GEO pages
 */
export function extractGeoCountry(path: string): string | null {
  const geoMatch = path.toLowerCase().match(/^\/(usa|uk|europe|germany|singapore|uae|saudi)\//);
  if (geoMatch) {
    const countryMap: Record<string, string> = {
      usa: 'United States',
      uk: 'United Kingdom',
      europe: 'Europe',
      germany: 'Germany',
      singapore: 'Singapore',
      uae: 'United Arab Emirates',
      saudi: 'Saudi Arabia',
    };
    return countryMap[geoMatch[1]] || null;
  }
  return null;
}

// ============= INTENT SCORING =============

/**
 * Calculate intent score based on page type and user behavior
 * Higher scores = stronger buying intent
 */
export function calculateIntentScore(event: {
  pageType: SEOPageType;
  hasRFQ?: boolean;
  scrollDepth?: number;
}): number {
  let score = 1;
  
  // Page type scoring
  switch (event.pageType) {
    case 'BUY':
      score += 3;  // High intent - looking to buy
      break;
    case 'PROCUREMENT':
      score += 3;  // High intent - active procurement
      break;
    case 'SUPPLIER':
      score += 2;  // Medium intent - researching suppliers
      break;
    case 'CATEGORY':
      score += 1;  // Lower intent - browsing
      break;
    case 'GEO':
      score += 2;  // Medium intent - geo-specific
      break;
    default:
      score += 0;
  }
  
  // RFQ interaction (strongest signal)
  if (event.hasRFQ) {
    score += 5;
  }
  
  // Deep scroll engagement
  if ((event.scrollDepth ?? 0) > 70) {
    score += 1;
  }
  
  return Math.min(score, 10); // Cap at 10
}

// ============= SESSION MANAGEMENT =============

/**
 * Get or create session ID for throttling
 */
function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr-session';
  
  let sessionId = sessionStorage.getItem('ps_global_session_id');
  if (!sessionId) {
    sessionId = `gds_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('ps_global_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Check if page was already tracked in this session
 * Prevents duplicate signals per page per session
 */
function wasPageTracked(path: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  
  const tracked = sessionStorage.getItem('ps_tracked_pages');
  const trackedPages: string[] = tracked ? JSON.parse(tracked) : [];
  return trackedPages.includes(path);
}

/**
 * Mark page as tracked in this session
 */
function markPageTracked(path: string): void {
  if (typeof sessionStorage === 'undefined') return;
  
  const tracked = sessionStorage.getItem('ps_tracked_pages');
  const trackedPages: string[] = tracked ? JSON.parse(tracked) : [];
  
  if (!trackedPages.includes(path)) {
    trackedPages.push(path);
    // Keep only last 50 to prevent bloat
    sessionStorage.setItem('ps_tracked_pages', JSON.stringify(trackedPages.slice(-50)));
  }
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
 * Get traffic source from referrer and URL params
 */
function getTrafficSource(): 'organic' | 'direct' | 'referral' | 'paid' {
  if (typeof document === 'undefined') return 'direct';
  
  const referrer = document.referrer.toLowerCase();
  
  if (!referrer) return 'direct';
  
  // Check for paid traffic markers
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gclid') || urlParams.get('utm_medium') === 'cpc') {
      return 'paid';
    }
  }
  
  // Search engines = organic
  if (/google|bing|yahoo|duckduckgo|baidu|yandex/.test(referrer)) {
    return 'organic';
  }
  
  return 'referral';
}

// ============= CORE TRACKING FUNCTION =============

/**
 * Main tracking function - called on every page navigation
 * Auto-tracks all ~1200 SEO pages without per-page setup
 */
export async function trackGlobalDemand(params: {
  path: string;
  referrer: string;
  country: string;
  countryCode: string;
  timestamp: number;
  scrollDepth?: number;
  hasRFQ?: boolean;
}): Promise<void> {
  // Skip bots
  if (isBot()) {
    if (import.meta.env.DEV) {
      console.log('[GlobalDemandTracker] Skipping bot');
    }
    return;
  }
  
  // Skip non-SEO pages
  const pageType = classifyPage(params.path);
  if (pageType === 'OTHER') {
    // Still track non-SEO pages but with lower priority
    if (import.meta.env.DEV) {
      console.log('[GlobalDemandTracker] Non-SEO page:', params.path);
    }
  }
  
  // Skip already tracked pages in this session (unless RFQ)
  if (!params.hasRFQ && wasPageTracked(params.path)) {
    if (import.meta.env.DEV) {
      console.log('[GlobalDemandTracker] Already tracked:', params.path);
    }
    return;
  }
  
  // Extract intelligence
  const category = extractCategory(params.path);
  const geoCountry = extractGeoCountry(params.path);
  const intentScore = calculateIntentScore({
    pageType,
    hasRFQ: params.hasRFQ,
    scrollDepth: params.scrollDepth,
  });
  
  // Mark as tracked
  markPageTracked(params.path);
  
  // Log in dev mode
  if (import.meta.env.DEV) {
    console.log('[GlobalDemandTracker] 🧠 AI Signal:', {
      path: params.path,
      pageType,
      category,
      country: geoCountry || params.country,
      intentScore,
      source: getTrafficSource(),
    });
  }
  
  // Send to database (fire and forget)
  try {
    await sendDemandSignal({
      path: params.path,
      pageType,
      category,
      country: params.country,
      countryCode: params.countryCode,
      geoCountry,
      intentScore,
      hasRFQ: params.hasRFQ || false,
      source: getTrafficSource(),
      sessionId: getSessionId(),
      timestamp: new Date(params.timestamp).toISOString(),
    });
  } catch (error) {
    // Silent fail - don't interrupt user flow
    console.warn('[GlobalDemandTracker] Signal failed:', error);
  }
}

/**
 * Track RFQ click/submission from any page
 * Call this when user clicks "Get Quotes", "Post RFQ", etc.
 */
export async function trackRFQInterest(path: string, country: string, countryCode: string): Promise<void> {
  if (isBot()) return;
  
  const pageType = classifyPage(path);
  const category = extractCategory(path);
  const intentScore = calculateIntentScore({ pageType, hasRFQ: true });
  
  if (import.meta.env.DEV) {
    console.log('[GlobalDemandTracker] 🎯 RFQ Interest:', {
      path,
      pageType,
      category,
      country,
      intentScore,
    });
  }
  
  try {
    await sendDemandSignal({
      path,
      pageType,
      category,
      country,
      countryCode,
      geoCountry: extractGeoCountry(path),
      intentScore,
      hasRFQ: true,
      source: getTrafficSource(),
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[GlobalDemandTracker] RFQ signal failed:', error);
  }
}

// ============= DATABASE SYNC =============

/**
 * Send demand signal to database
 */
async function sendDemandSignal(params: {
  path: string;
  pageType: SEOPageType;
  category: string;
  country: string;
  countryCode: string;
  geoCountry: string | null;
  intentScore: number;
  hasRFQ: boolean;
  source: string;
  sessionId: string;
  timestamp: string;
}): Promise<void> {
  // Map page type to classification
  const classificationMap: Record<SEOPageType, string> = {
    'BUY': 'buy',
    'PROCUREMENT': 'buy',
    'SUPPLIER': 'research',
    'CATEGORY': 'research',
    'GEO': 'buy',
    'GUIDE': 'research',
    'OTHER': 'research',
  };
  
  // Determine lane state
  let laneState = 'detected';
  if (params.hasRFQ) {
    laneState = 'confirmed';
  } else if (params.pageType === 'BUY' || params.pageType === 'PROCUREMENT') {
    laneState = 'detected';
  }
  
  // Normalize intent score to 0-1 range for database
  const normalizedIntent = params.intentScore / 10;
  
  await supabase.from('demand_intelligence_signals').insert({
    signal_source: `seo_${params.pageType.toLowerCase()}`,
    category: params.category,
    country: params.countryCode.toUpperCase() || 'GLOBAL',
    buyer_type: 'unknown_external',
    classification: classificationMap[params.pageType],
    intent_score: normalizedIntent,
    confidence_score: params.hasRFQ ? 0.9 : 0.6,
    decision_action: 'pending',
    discovered_at: params.timestamp,
    lane_state: laneState,
    product_description: params.category,
    delivery_location: params.geoCountry || params.country,
    external_source_url: params.path,
  });
}

// ============= SCROLL TRACKING =============

/**
 * Track scroll depth for engagement scoring
 * Returns scroll percentage (0-100)
 */
export function getScrollDepth(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  
  if (docHeight === 0) return 100;
  return Math.round((scrollTop / docHeight) * 100);
}

// ============= STATS & DEBUG =============

/**
 * Log global demand tracker stats (dev only)
 */
export function logGlobalDemandStats(): void {
  if (!import.meta.env.DEV) return;
  
  const tracked = sessionStorage.getItem('ps_tracked_pages');
  const trackedPages: string[] = tracked ? JSON.parse(tracked) : [];
  
  console.group('🌍 Global Demand Tracker');
  console.log('Session ID:', getSessionId());
  console.log('Is Bot:', isBot());
  console.log('Traffic Source:', getTrafficSource());
  console.log('Pages Tracked This Session:', trackedPages.length);
  console.log('Tracked Pages:', trackedPages);
  console.groupEnd();
}
