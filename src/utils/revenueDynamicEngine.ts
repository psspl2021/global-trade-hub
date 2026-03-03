/**
 * Dynamic Revenue Weight Engine
 *
 * Blends static SKU priority with live revenue + margin data
 * for intelligent corridor and link scoring.
 */

import { skuMarginWeights } from "@/utils/corridorLinkEngine";
import type { RevenueNode } from "@/utils/revenueMap";

export interface RevenueMetric {
  slug: string;
  rfqSubmissions: number;
  avgDealValue: number;
  conversionRate: number;
}

/**
 * Composite dynamic score:
 *   (RFQ × 0.4) + (Revenue × 0.4) + (Margin × 0.2)
 */
export function calculateDynamicScore(metric: RevenueMetric): number {
  const marginW = skuMarginWeights[metric.slug] ?? 1;
  return (
    metric.rfqSubmissions * 0.4 +
    metric.avgDealValue * metric.conversionRate * 0.4 +
    marginW * 0.2
  );
}

/**
 * Blend static priority with live dynamic metrics.
 * Factor controls how much dynamic data overrides static:
 *   0 = fully static, 1 = fully dynamic.
 */
export function blendScores(
  staticScore: number,
  dynamicMetric: RevenueMetric | undefined,
  factor = 0.5
): number {
  if (!dynamicMetric) return staticScore;
  const dynamicScore = calculateDynamicScore(dynamicMetric);
  return staticScore * (1 - factor) + dynamicScore * factor;
}

/**
 * Build RevenueMetric from revenue nodes for a given SKU.
 */
export function buildMetricFromNodes(
  skuSlug: string,
  nodes: RevenueNode[]
): RevenueMetric | undefined {
  const matching = nodes.filter((n) => n.skuSlug === skuSlug);
  if (matching.length === 0) return undefined;

  const totalRfq = matching.reduce((s, n) => s + n.rfqCount, 0);
  const totalRev = matching.reduce((s, n) => s + n.totalRevenue, 0);

  return {
    slug: skuSlug,
    rfqSubmissions: totalRfq,
    avgDealValue: totalRfq > 0 ? totalRev / totalRfq : 0,
    conversionRate: 1, // placeholder until funnel data flows
  };
}
