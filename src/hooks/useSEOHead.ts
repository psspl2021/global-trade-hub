import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DOMAIN = 'https://procuresaathi.com';

// Routes that should NOT be indexed
const NOINDEX_ROUTES = ['/admin', '/dashboard', '/management', '/control-tower', '/login', '/signup', '/reset-password', '/supplier'];

/**
 * Global SEO head manager.
 * Ensures every page has canonical, robots meta, and OG tags.
 * Individual pages can override via react-helmet or manual DOM manipulation.
 */
export function useSEOHead(options?: { title?: string; description?: string; noindex?: boolean }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const isNoindex = options?.noindex || NOINDEX_ROUTES.some(r => pathname.startsWith(r));

    // Robots meta
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = isNoindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

    // Canonical — always non-www, no trailing slash (except root)
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    canonical.href = `${DOMAIN}${cleanPath}`;

    // OG URL
    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = `${DOMAIN}${cleanPath}`;

  }, [pathname, options?.noindex]);
}

export default useSEOHead;
