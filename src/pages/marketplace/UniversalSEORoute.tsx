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
 * Now properly checks registry for both category and subcategory level pages
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
  }
  
  // Handle /buy-{slug} routes
  // The registry now includes BOTH category-level (buy-pharmaceuticals-drugs)
  // AND subcategory-level (buy-generic-medicines) pages
  if (cleanPath.startsWith('buy-')) {
    const productSlug = cleanPath.replace('buy-', '');
    const config = getBuyPageConfig(productSlug);
    if (config) {
      return { type: 'buy', slug: productSlug, productSlug };
    }
    // Even if not found, still try to render as buy page for fallback handling
    console.warn(`[UniversalSEORoute] BUY page slug not in registry: ${productSlug}`);
  }
  
  // Handle /{slug}-suppliers routes
  // The registry now includes BOTH category-level (pharmaceuticals-drugs-suppliers)
  // AND subcategory-level (generic-medicines-suppliers) pages
  if (cleanPath.endsWith('-suppliers')) {
    const fullSlug = cleanPath; // e.g., "pharmaceuticals-drugs-suppliers"
    const productSlug = cleanPath.replace(/-suppliers$/, '');
    const config = getSupplierPageConfig(fullSlug);
    if (config) {
      return { type: 'supplier', slug: fullSlug, productSlug };
    }
    // Even if not found, still try to render as supplier page for fallback handling
    console.warn(`[UniversalSEORoute] SUPPLIER page slug not in registry: ${fullSlug}`);
  }
  
  return { type: 'notfound', slug: cleanPath };
}

/**
 * Check if a path matches any marketplace route
 * Now properly checks registry for both category and subcategory level pages
 */
export function isMarketplacePath(pathname: string): boolean {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  
  // Check buy pages - now includes category-level and subcategory-level
  if (cleanPath.startsWith('buy-')) {
    const slug = cleanPath.replace('buy-', '');
    const config = getBuyPageConfig(slug);
    return config !== undefined;
  }
  
  // Check supplier pages - now includes category-level and subcategory-level
  if (cleanPath.endsWith('-suppliers')) {
    const config = getSupplierPageConfig(cleanPath);
    return config !== undefined;
  }
  
  // Check category hubs
  if (cleanPath.startsWith('categories/')) {
    const slug = cleanPath.replace('categories/', '');
    const config = getCategoryHubConfig(slug);
    return config !== undefined;
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
