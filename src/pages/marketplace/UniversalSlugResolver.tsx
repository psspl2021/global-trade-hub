/**
 * Universal Slug Resolver
 * 
 * Handles single-segment URLs for marketplace pages:
 * - /buy-{product} → BuyPage (includes category-level AND subcategory-level)
 * - /{product}-suppliers → SupplierPage (includes category-level AND subcategory-level)
 * 
 * This resolver ensures ALL sitemap URLs resolve correctly by checking
 * both category-level and subcategory-level slugs in the page registry.
 */

import { useParams, useLocation } from 'react-router-dom';
import { Suspense, lazy, useMemo } from 'react';
import { getBuyPageConfig, getSupplierPageConfig } from '@/data/marketplacePages';

// Lazy load pages
const BuyPage = lazy(() => import('./BuyPage'));
const SupplierPage = lazy(() => import('./SupplierPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export type ResolvedPageType = 'buy' | 'supplier' | 'notfound';

export interface ResolvedSlug {
  type: ResolvedPageType;
  slug: string;
  productSlug?: string;
}

/**
 * Resolve a URL slug to the correct page type
 * Checks the actual registry to ensure the page exists
 * Falls back to rendering pages even for unknown slugs that match SEO patterns
 */
export function resolveSlug(slug: string): ResolvedSlug {
  if (!slug) {
    return { type: 'notfound', slug: '' };
  }
  
  // Check if it's a BUY page: starts with "buy-"
  if (slug.startsWith('buy-')) {
    const productSlug = slug.replace(/^buy-/, '');
    
    // Check if this slug exists in the registry
    const config = getBuyPageConfig(productSlug);
    if (config) {
      return { type: 'buy', slug: productSlug, productSlug };
    }
    
    // FALLBACK: Even if not in registry, render as buy page
    // This handles sitemap URLs that may not be in registry yet
    // The BuyPage component will handle displaying appropriate content
    console.warn(`[UniversalSlugResolver] BUY page slug not in registry, using fallback: ${productSlug}`);
    return { type: 'buy', slug: productSlug, productSlug };
  }
  
  // Check if it's a SUPPLIER page: ends with "-suppliers"
  if (slug.endsWith('-suppliers')) {
    // Full slug format: product-name-suppliers
    const config = getSupplierPageConfig(slug);
    if (config) {
      const productSlug = slug.replace(/-suppliers$/, '');
      return { type: 'supplier', slug, productSlug };
    }
    
    // FALLBACK: Even if not in registry, render as supplier page
    console.warn(`[UniversalSlugResolver] SUPPLIER page slug not in registry, using fallback: ${slug}`);
    const productSlug = slug.replace(/-suppliers$/, '');
    return { type: 'supplier', slug, productSlug };
  }
  
  // Not a marketplace page pattern
  return { type: 'notfound', slug };
}

export default function UniversalSlugResolver() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  
  const resolved = useMemo(() => {
    // Use the full path segment for resolution
    const pathSlug = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    return resolveSlug(pathSlug);
  }, [location.pathname]);
  
  return (
    <Suspense fallback={<PageLoader />}>
      {resolved.type === 'buy' && <BuyPage />}
      {resolved.type === 'supplier' && <SupplierPage />}
      {resolved.type === 'notfound' && <NotFound />}
    </Suspense>
  );
}
