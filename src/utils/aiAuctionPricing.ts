/**
 * AI Auction Pricing Utility
 * Suggests optimal starting prices based on RFQ analytics / benchmark data
 */

export interface RFQSignal {
  product_slug: string;
  avg_price: number;
  min_price?: number;
  max_price?: number;
}

/**
 * Returns a suggested starting price based on market benchmark data.
 * Adds a 2% premium to the average price to allow room for bidding down.
 */
export function getSuggestedStartingPrice(
  productSlug: string,
  rfqData: RFQSignal[]
): number | null {
  if (!productSlug || !rfqData || rfqData.length === 0) return null;

  const slug = productSlug.toLowerCase().replace(/\s+/g, '-');
  const productData = rfqData.find(
    (p) => p.product_slug.toLowerCase() === slug
  );

  if (!productData || !productData.avg_price) return null;

  // Add 2% premium above market average as optimal starting ceiling
  return Math.round(productData.avg_price * 1.02);
}

/**
 * Returns the market benchmark (average) price for display purposes.
 */
export function getMarketBenchmark(
  productSlug: string,
  rfqData: RFQSignal[]
): number | null {
  if (!productSlug || !rfqData || rfqData.length === 0) return null;

  const slug = productSlug.toLowerCase().replace(/\s+/g, '-');
  const productData = rfqData.find(
    (p) => p.product_slug.toLowerCase() === slug
  );

  return productData?.avg_price ?? null;
}
