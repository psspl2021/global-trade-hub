/**
 * Universal SEO Route Handler
 * 
 * Catches ALL marketplace slugs and routes them to the correct page:
 * - /buy-{product} → BuyPage
 * - /{product}-suppliers → SupplierPage
 * - /categories/{category} → CategoryHub
 * 
 * This ensures all 1213+ auto-generated SEO pages resolve correctly.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useMemo } from 'react';
import { 
  getBuyPageConfig, 
  getSupplierPageConfig, 
  getCategoryHubConfig,
  getAllBuyPageSlugs,
  getAllSupplierPageSlugs,
  getAllCategoryHubSlugs
} from '@/data/marketplacePages';

// Lazy load the actual page components
const BuyPage = lazy(() => import('./BuyPage'));
const SupplierPage = lazy(() => import('./SupplierPage'));
const CategoryHub = lazy(() => import('./CategoryHub'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Simple loader
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export type PageType = 'buy' | 'supplier' | 'category' | 'notfound';

export interface ResolvedRoute {
  type: PageType;
  slug: string;
  productSlug?: string;
}

/**
 * Resolves a URL path to the correct page type and slug
 * Now properly handles both registry and fallback pages
 * KEY: All sitemap patterns render, even without registry entry
 */
export function resolveMarketplaceRoute(pathname: string): ResolvedRoute {
  // Clean the pathname
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  
  // Handle /categories/{slug} routes
  if (cleanPath.startsWith('categories/')) {
    const categorySlug = cleanPath.replace('categories/', '');
    const config = getCategoryHubConfig(categorySlug);
    if (config) {
      return { type: 'category', slug: categorySlug };
    }
    // Fallback - still render category hub even without config
    return { type: 'category', slug: categorySlug };
  }
  
  // Handle /buy-{slug} routes
  // Always render BUY pages for any buy- pattern (fallback handles missing configs)
  if (cleanPath.startsWith('buy-')) {
    const productSlug = cleanPath.replace('buy-', '');
    return { type: 'buy', slug: productSlug, productSlug };
  }
  
  // Handle /{slug}-suppliers routes
  // Always render SUPPLIER pages for any -suppliers pattern
  if (cleanPath.endsWith('-suppliers')) {
    const fullSlug = cleanPath;
    const productSlug = cleanPath.replace(/-suppliers$/, '');
    return { type: 'supplier', slug: fullSlug, productSlug };
  }
  
  return { type: 'notfound', slug: cleanPath };
}

/**
 * Check if a path matches any marketplace route pattern
 * Returns true for any valid SEO page pattern (not just registry matches)
 */
export function isMarketplacePath(pathname: string): boolean {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  
  // Check buy pages pattern
  if (cleanPath.startsWith('buy-')) {
    return true;
  }
  
  // Check supplier pages pattern
  if (cleanPath.endsWith('-suppliers')) {
    return true;
  }
  
  // Check category hubs
  if (cleanPath.startsWith('categories/')) {
    return true;
  }
  
  return false;
}

/**
 * Universal SEO Route Component
 * Renders the appropriate page based on the slug pattern
 */
export default function UniversalSEORoute() {
  const { '*': splat } = useParams();
  const pathname = `/${splat || ''}`;
  
  const resolved = useMemo(() => resolveMarketplaceRoute(pathname), [pathname]);
  
  return (
    <Suspense fallback={<PageLoader />}>
      {resolved.type === 'buy' && <BuyPage />}
      {resolved.type === 'supplier' && <SupplierPage />}
      {resolved.type === 'category' && <CategoryHub />}
      {resolved.type === 'notfound' && <NotFound />}
    </Suspense>
  );
}

/**
 * Get all marketplace URLs for sitemap generation
 */
export function getAllMarketplaceUrls(): string[] {
  const urls: string[] = [];
  
  // Add all buy pages
  getAllBuyPageSlugs().forEach(slug => {
    urls.push(`/buy-${slug}`);
  });
  
  // Add all supplier pages
  getAllSupplierPageSlugs().forEach(slug => {
    urls.push(`/${slug}`);
  });
  
  // Add all category hubs
  getAllCategoryHubSlugs().forEach(slug => {
    urls.push(`/categories/${slug}`);
  });
  
  return urls;
}
