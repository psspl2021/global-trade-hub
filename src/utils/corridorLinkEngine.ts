import { getSkuCountryOptions, countrySkuMapping, type CountrySkuEntry } from "@/data/countrySkuMapping";
import { getPriorityScore } from "@/data/skuPriority";
import type { RevenueNode } from "@/utils/revenueMap";
import { timeDecay, gscBoostMultiplier, dampenScore, type GSCSignal } from "@/utils/revenueDynamicEngine";
export { skuMarginWeights } from "@/data/skuMarginWeights";
import { skuMarginWeights } from "@/data/skuMarginWeights";

/**
 * Composite corridor score with time-decay + GSC boost:
 *   base = (RFQ × 0.4) + (Revenue × 0.4) + (Margin × 0.2)
 *   final = base × timeDecay × gscBoost
 */
function corridorScore(
  skuSlug: string,
  countrySlug: string,
  nodes: RevenueNode[],
  gscSignals?: GSCSignal[]
): number {
  const matching = nodes.filter(
    (n) => n.skuSlug === skuSlug && n.countrySlug === countrySlug
  );
  const rfq = matching.reduce((s, n) => s + n.rfqCount, 0);
  const rev = matching.reduce((s, n) => s + n.totalRevenue, 0);
  const margin = skuMarginWeights[skuSlug] ?? 1;
  const base = rfq * 0.4 + rev * 0.4 + margin * 0.2;

  // Time decay — use most recent node's implicit freshness
  const decay = matching.length > 0 ? 1 : 0.5;

  // GSC boost — match by slug pattern
  const slugKey = `${skuSlug}-from-${countrySlug}`;
  const gsc = gscSignals?.find((s) => s.slug === slugKey);
  const boost = gscBoostMultiplier(gsc);

  return base * decay * boost;
}

/**
 * Sort SKU → Country corridors by composite revenue+margin score.
 * Accepts optional GSC signals for striking-distance boost.
 */
export function sortCorridorsByRevenue(
  skuSlug: string,
  revenueNodes: RevenueNode[],
  gscSignals?: GSCSignal[]
): CountrySkuEntry[] {
  const entries = getSkuCountryOptions(skuSlug);

  return [...entries].sort((a, b) => {
    const scoreA = corridorScore(skuSlug, a.countrySlug, revenueNodes, gscSignals);
    const scoreB = corridorScore(skuSlug, b.countrySlug, revenueNodes, gscSignals);
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
 * Get top N corridors across all SKUs, sorted by composite score
 * with authority dampening to prevent concentration.
 */
export function getTopGlobalCorridors(
  revenueNodes: RevenueNode[],
  limit = 5,
  gscSignals?: GSCSignal[]
): (CountrySkuEntry & { score: number })[] {
  const scored = countrySkuMapping
    .map((entry) => ({
      ...entry,
      score: corridorScore(entry.sku, entry.countrySlug, revenueNodes, gscSignals),
    }))
    .sort((a, b) => b.score - a.score);

  // Apply dampening: if a country already appears, reduce subsequent scores
  const countryCounts = new Map<string, number>();
  return scored
    .map((entry) => {
      const count = (countryCounts.get(entry.countrySlug) || 0) + 1;
      countryCounts.set(entry.countrySlug, count);
      return { ...entry, score: dampenScore(entry.score, count) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get top corridors filtered by SKU slugs (for industry pages).
 */
export function getTopCorridorsForSlugs(
  skuSlugs: string[],
  revenueNodes: RevenueNode[],
  limit = 5,
  gscSignals?: GSCSignal[]
): (CountrySkuEntry & { score: number })[] {
  const relevant = countrySkuMapping.filter((e) => skuSlugs.includes(e.sku));
  const scored = relevant
    .map((entry) => ({
      ...entry,
      score: corridorScore(entry.sku, entry.countrySlug, revenueNodes, gscSignals),
    }))
    .sort((a, b) => b.score - a.score);

  // Dampen by country to distribute authority
  const countryCounts = new Map<string, number>();
  return scored
    .map((entry) => {
      const count = (countryCounts.get(entry.countrySlug) || 0) + 1;
      countryCounts.set(entry.countrySlug, count);
      return { ...entry, score: dampenScore(entry.score, count) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
