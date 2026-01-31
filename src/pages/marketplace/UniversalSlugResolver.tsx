/**
 * Universal Slug Resolver
 * 
 * Handles single-segment URLs for marketplace pages:
 * - /buy-{product} → BuyPage
 * - /{product}-suppliers → SupplierPage
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

export default function UniversalSlugResolver() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  
  const pageType = useMemo(() => {
    if (!slug) return 'notfound';
    
    // Check if it's a BUY page: starts with "buy-"
    if (slug.startsWith('buy-')) {
      const productSlug = slug.replace(/^buy-/, '');
      const config = getBuyPageConfig(productSlug);
      if (config) return 'buy';
    }
    
    // Check if it's a SUPPLIER page: ends with "-suppliers"
    if (slug.endsWith('-suppliers')) {
      const config = getSupplierPageConfig(slug);
      if (config) return 'supplier';
    }
    
    return 'notfound';
  }, [slug]);
  
  return (
    <Suspense fallback={<PageLoader />}>
      {pageType === 'buy' && <BuyPage />}
      {pageType === 'supplier' && <SupplierPage />}
      {pageType === 'notfound' && <NotFound />}
    </Suspense>
  );
}
