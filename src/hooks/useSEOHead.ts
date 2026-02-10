import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CANONICAL_DOMAIN = 'https://procuresaathi.com';

// Routes that should NOT be indexed
const NOINDEX_ROUTES = ['/admin', '/dashboard', '/management', '/control-tower', '/login', '/signup', '/reset-password', '/supplier'];

/**
 * Global SEO head manager.
 * - Enforces ONE canonical per page (non-www, no trailing slash)
 * - Removes duplicate canonical tags
 * - Sets robots meta (does NOT noindex www — lets canonical handle dedup)
 * - Sets og:url
 */
export function useSEOHead(options?: { title?: string; description?: string; noindex?: boolean }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const isNoindex = options?.noindex || NOINDEX_ROUTES.some(r => pathname.startsWith(r));

    // --- Robots meta ---
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = isNoindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

    // --- Build canonical URL: always non-www, no trailing slash except root ---
    const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const canonicalHref = `${CANONICAL_DOMAIN}${cleanPath}`;

    // --- Canonical: ensure exactly ONE ---
    const allCanonicals = document.querySelectorAll('link[rel="canonical"]');
    if (allCanonicals.length > 1) {
      if (import.meta.env.DEV) {
        console.warn(`[SEO] Found ${allCanonicals.length} canonical tags — removing extras`);
      }
      // Keep only the first, remove the rest
      for (let i = 1; i < allCanonicals.length; i++) {
        allCanonicals[i].remove();
      }
    }

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;

    // --- OG URL ---
    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = canonicalHref;

  }, [pathname, options?.noindex]);
}

export default useSEOHead;
