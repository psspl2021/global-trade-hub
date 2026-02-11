import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CANONICAL_DOMAIN = 'https://www.procuresaathi.com';

// Routes that should NOT be indexed
const NOINDEX_ROUTES = ['/admin', '/dashboard', '/management', '/control-tower', '/login', '/signup', '/reset-password', '/supplier'];

// Category name to slug mapping for /browse?category= → /category/{slug} canonical
const categoryToSlug = (category: string): string => {
  return category.toLowerCase()
    .replace(/[&,()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Global SEO head manager.
 * - Enforces ONE canonical per page (www, no trailing slash)
 * - Handles query URLs: noindex + canonical to clean path
 * - Normalizes /categories/{slug} → canonical /category/{slug}
 * - Sets robots meta
 * - Sets og:url
 */
export function useSEOHead(options?: { title?: string; description?: string; noindex?: boolean }) {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const hasQueryParams = search.length > 0;

    // Determine if page should be noindexed
    const isNoindexRoute = NOINDEX_ROUTES.some(r => pathname.startsWith(r));
    const isQueryUrl = hasQueryParams;
    const isBrowsePath = pathname === '/browse' || pathname === '/browseproducts';
    const isNoindex = options?.noindex || isNoindexRoute || (isQueryUrl && isBrowsePath);

    // --- Robots meta ---
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = isNoindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';

    // --- Build canonical URL ---
    let canonicalPath = pathname;

    // Normalize /categories/{slug} → /category/{slug}
    if (canonicalPath.startsWith('/categories/')) {
      canonicalPath = canonicalPath.replace('/categories/', '/category/');
    }

    // For /browse?category=X or /browseproducts?category=X → canonical to /category/{slug}
    if (isBrowsePath && searchParams.has('category')) {
      const categoryName = searchParams.get('category') || '';
      canonicalPath = `/category/${categoryToSlug(categoryName)}`;
    } else if (isBrowsePath && hasQueryParams) {
      // Any other query on browse → canonical to /browseproducts (clean)
      canonicalPath = '/browseproducts';
    }

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
