import { getSkuCountryOptions, type CountrySkuEntry } from "@/data/countrySkuMapping";

/**
 * Sort SKU → Country corridors by revenue performance.
 * Falls back to static order if no revenue data exists.
 */
export function sortCorridorsByRevenue(
  skuSlug: string,
  revenueMap: Record<string, number>
): CountrySkuEntry[] {
  const entries = getSkuCountryOptions(skuSlug);

  return [...entries].sort((a, b) => {
    const keyA = `${skuSlug}|${a.countrySlug}`;
    const keyB = `${skuSlug}|${b.countrySlug}`;
    return (revenueMap[keyB] || 0) - (revenueMap[keyA] || 0);
  });
}
