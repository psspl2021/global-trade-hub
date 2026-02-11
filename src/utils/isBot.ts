/**
 * Bot Detection Utility
 * 
 * Detects search engine crawlers and bots to serve
 * static SEO-optimized content instead of SPA loaders.
 * 
 * CRITICAL: Must NEVER return true for real browsers.
 * False negatives (missing a bot) are acceptable.
 * False positives (flagging a real user) cause FOUC.
 */

const BOT_PATTERNS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandex',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'embedly',
  'showyoubot',
  'outbrain',
  'pinterest/0.',
  'pinterestbot',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'whatsapp',
  'applebot',
  'ia_archiver',
  'mediapartners-google',
  'adsbot-google',
  'teoma',
  'webcrawler',
  'petalbot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'rogerbot',
  'screaming frog',
];

/**
 * Check if the user agent is a bot/crawler
 * 
 * RULE: Default to FALSE (not a bot). Only return true
 * for KNOWN bot patterns. Never flag unknown/empty UAs as bots.
 */
export function isBot(userAgent?: string): boolean {
  const ua = (userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();
  
  // Empty or missing user agent → default to NOT a bot (safe for real users)
  if (!ua) return false;
  
  // Check against known bot patterns (exact match list, no generic 'bot' substring)
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

/**
 * Check if we should render static content for SEO
 */
export function shouldRenderStatic(): boolean {
  // SSR check - if window is undefined, we're on server
  if (typeof window === 'undefined') return false;
  
  // Check for prerender query param (for testing only)
  if (window.location.search.includes('_escaped_fragment_') || 
      window.location.search.includes('prerender=true')) {
    return true;
  }
  
  return isBot();
}

export default isBot;
