import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CANONICAL_DOMAIN = 'https://www.procuresaathi.com';

// Routes that should NOT be indexed
const NOINDEX_ROUTES = ['/admin', '/dashboard', '/management', '/control-tower', '/login', '/signup', '/reset-password', '/supplier', '/browseproducts', '/enterprise', '/affiliate', '/invoice-generator'];

// Duplicate page patterns that must be noindexed (authority lives elsewhere)
const NOINDEX_PATTERNS = [
  /^\/buy-/,          // /buy-* → authority is /demand/*
  /\-suppliers$/,     // /*-suppliers → duplicate supplier intent
];

/**
 * Remap duplicate URLs to their canonical authority path.
 * This tells Google: "the real page lives HERE".
 */
function remapCanonical(pathname: string): string {
  // /buy-{slug} → /demand/{slug}
  if (pathname.startsWith('/buy-')) {
    const productSlug = pathname.replace('/buy-', '');
    return `/demand/${productSlug}`;
  }

  // /{slug}-suppliers → noindex (no canonical remap, just noindex)
  // These pages have no single authority target

  // /categories/{slug} → /industries (consolidated)
  if (pathname.startsWith('/categories/')) {
    return pathname.replace('/categories/', '/industries/');
  }
  if (pathname === '/categories') {
    return '/industries';
  }

  return pathname;
}

/**
 * Global SEO head manager.
 * - Enforces ONE canonical per page (www, no trailing slash)
 * - Remaps duplicate patterns to authority canonical
 * - Noindexes all query-param URLs and duplicate page types
 * - Sets robots meta + og:url
 */
export function useSEOHead(options?: { title?: string; description?: string; noindex?: boolean }) {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const hasQueryParams = search.length > 0;

    // Determine if page should be noindexed
    const isNoindexRoute = NOINDEX_ROUTES.some(r => pathname.startsWith(r));
    const isNoindexPattern = NOINDEX_PATTERNS.some(p => p.test(pathname));
    // ALL query param URLs + duplicate patterns get noindexed
    const isNoindex = options?.noindex || isNoindexRoute || isNoindexPattern || hasQueryParams;

    // --- Robots meta ---
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = isNoindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';

    // --- Build canonical URL (remap duplicates) ---
    let canonicalPath = remapCanonical(pathname);

    // Clean: no trailing slash except root
    const cleanPath = canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '');
    const canonicalHref = `${CANONICAL_DOMAIN}${cleanPath}`;

    // --- Canonical: ensure exactly ONE ---
    const allCanonicals = document.querySelectorAll('link[rel="canonical"]');
    if (allCanonicals.length > 1) {
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

  }, [pathname, search, options?.noindex]);
}

export default useSEOHead;
