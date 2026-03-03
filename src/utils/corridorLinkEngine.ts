import { getSkuCountryOptions, countrySkuMapping, type CountrySkuEntry } from "@/data/countrySkuMapping";
import { getPriorityScore } from "@/data/skuPriority";
import type { RevenueNode } from "@/utils/revenueMap";

/**
 * Margin weights per SKU — blends with revenue for intelligent scoring.
 * Higher weight = higher margin corridor.
 */
export const skuMarginWeights: Record<string, number> = {
  "tmt-bars-india": 8,
  "structural-steel-india": 12,
  "hr-coil-india": 10,
  "ms-plates-india": 9,
  "aluminium-ingots-india": 7,
  "ferro-manganese-india": 11,
  "ferro-silicon-india": 10,
  "ferro-chrome-india": 12,
  "pp-granules-india": 7,
  "hdpe-granules-india": 6,
  "pvc-resin-india": 8,
  "abs-granules-india": 10,
};

/**
 * Composite corridor score:
 *   (RFQ_Count × 0.4) + (Revenue × 0.4) + (Margin_Weight × 0.2)
 */
function corridorScore(
  skuSlug: string,
  countrySlug: string,
  nodes: RevenueNode[]
): number {
  const matching = nodes.filter(
    (n) => n.skuSlug === skuSlug && n.countrySlug === countrySlug
  );
  const rfq = matching.reduce((s, n) => s + n.rfqCount, 0);
  const rev = matching.reduce((s, n) => s + n.totalRevenue, 0);
  const margin = skuMarginWeights[skuSlug] ?? 1;
  return rfq * 0.4 + rev * 0.4 + margin * 0.2;
}

/**
 * Sort SKU → Country corridors by composite revenue+margin score.
 */
export function sortCorridorsByRevenue(
  skuSlug: string,
  revenueNodes: RevenueNode[]
): CountrySkuEntry[] {
  const entries = getSkuCountryOptions(skuSlug);

  return [...entries].sort((a, b) => {
    const scoreA = corridorScore(skuSlug, a.countrySlug, revenueNodes);
    const scoreB = corridorScore(skuSlug, b.countrySlug, revenueNodes);
    return scoreB - scoreA;
  });
}

/**
 * Auto-generate ALL possible transactional import slugs
 * from the countrySkuMapping data — no hardcoding needed.
 */
export function generateAllImportSlugs(): { slug: string; skuSlug: string; countrySlug: string; skuLabel: string; country: string }[] {
  return countrySkuMapping.map((entry) => ({
    slug: `${entry.sku}-from-${entry.countrySlug}`,
    skuSlug: entry.sku,
    countrySlug: entry.countrySlug,
    skuLabel: entry.skuLabel,
    country: entry.bestCountry,
  }));
}

/**
 * Get top N corridors across all SKUs, sorted by composite score.
 */
export function getTopGlobalCorridors(
  revenueNodes: RevenueNode[],
  limit = 5
): (CountrySkuEntry & { score: number })[] {
  return countrySkuMapping
    .map((entry) => ({
      ...entry,
      score: corridorScore(entry.sku, entry.countrySlug, revenueNodes),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get top corridors filtered by SKU slugs (for industry pages).
 */
export function getTopCorridorsForSlugs(
  skuSlugs: string[],
  revenueNodes: RevenueNode[],
  limit = 5
): (CountrySkuEntry & { score: number })[] {
  const relevant = countrySkuMapping.filter((e) => skuSlugs.includes(e.sku));
  return relevant
    .map((entry) => ({
      ...entry,
      score: corridorScore(entry.sku, entry.countrySlug, revenueNodes),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
