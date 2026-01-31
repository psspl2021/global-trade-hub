/**
 * Bot Detection Utility
 * 
 * Detects search engine crawlers and bots to serve
 * static SEO-optimized content instead of SPA loaders.
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
  'pinterest',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'whatsapp',
  'applebot',
  'crawler',
  'spider',
  'bot',
  'ia_archiver',
  'mediapartners-google',
  'adsbot',
  'teoma',
  'webcrawler',
];

/**
 * Check if the user agent is a bot/crawler
 * 
 * @param userAgent - Optional user agent string (defaults to navigator.userAgent)
 * @returns true if the user agent matches a known bot pattern
 */
export function isBot(userAgent?: string): boolean {
  const ua = (userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();
  
  // Empty user agent is suspicious - treat as potential bot
  if (!ua) return true;
  
  // Check against known bot patterns
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

/**
 * Check if we should render static content for SEO
 * 
 * @returns true if static content should be rendered
 */
export function shouldRenderStatic(): boolean {
  // SSR check - if window is undefined, we're on server
  if (typeof window === 'undefined') return true;
  
  // Check for prerender query param (for testing)
  if (window.location.search.includes('_escaped_fragment_') || 
      window.location.search.includes('prerender=true')) {
    return true;
  }
  
  return isBot();
}

export default isBot;
