/**
 * Marketplace Page Trace Utility
 * 
 * LEVEL-1 SOURCE OF TRUTH for all auto-generated marketplace pages.
 * Developer-only utility for auditing and debugging page generation.
 * 
 * Usage:
 *   import { getMarketplacePageMap, logMarketplacePages } from '@/utils/marketplacePageTrace';
 *   const pageMap = getMarketplacePageMap();
 *   logMarketplacePages(); // DEV-only console output
 */

import {
  getAllBuyPageSlugs,
  getAllSupplierPageSlugs,
  getAllCategoryHubSlugs,
} from '@/data/marketplacePages';

export interface MarketplacePageMap {
  total: number;
  buyPages: {
    count: number;
    slugs: string[];
  };
  supplierPages: {
    count: number;
    slugs: string[];
  };
  categoryPages: {
    count: number;
    slugs: string[];
  };
}

/**
 * Returns the complete map of all auto-generated marketplace pages.
 * Single source of truth for page tracing and auditing.
 */
export const getMarketplacePageMap = (): MarketplacePageMap => {
  const buySlugs = getAllBuyPageSlugs();
  const supplierSlugs = getAllSupplierPageSlugs();
  const categorySlugs = getAllCategoryHubSlugs();

  return {
    total: buySlugs.length + supplierSlugs.length + categorySlugs.length,
    buyPages: {
      count: buySlugs.length,
      slugs: buySlugs,
    },
    supplierPages: {
      count: supplierSlugs.length,
      slugs: supplierSlugs,
    },
    categoryPages: {
      count: categorySlugs.length,
      slugs: categorySlugs,
    },
  };
};

/**
 * Logs the marketplace page map to console.
 * Only executes in DEV mode (import.meta.env.DEV).
 */
export const logMarketplacePages = (): void => {
  if (import.meta.env.DEV) {
    const pageMap = getMarketplacePageMap();

    console.group('📦 Marketplace Pages – SOURCE OF TRUTH');
    console.log('BUY Pages:', pageMap.buyPages.count, pageMap.buyPages.slugs);
    console.log('SUPPLIER Pages:', pageMap.supplierPages.count, pageMap.supplierPages.slugs);
    console.log('CATEGORY Pages:', pageMap.categoryPages.count, pageMap.categoryPages.slugs);
    console.log('TOTAL Pages:', pageMap.total);
    console.groupEnd();
  }
};
