/**
 * Dynamic Revenue Weight Engine
 *
 * Designed to replace static priority scores with live metrics
 * once GSC + conversion data flows from the database.
 *
 * Until live data is available, the static skuPriority model is used.
 */

export interface RevenueMetric {
  slug: string;
  rfqSubmissions: number;
  avgDealValue: number;
  conversionRate: number;
}

export function calculateDynamicScore(metric: RevenueMetric): number {
  return metric.rfqSubmissions * metric.avgDealValue * metric.conversionRate;
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
