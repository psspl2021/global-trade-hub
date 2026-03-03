/**
 * Dynamic Revenue Weight Engine
 *
 * Blends static SKU priority with live revenue + margin data
 * for intelligent corridor and link scoring.
 *
 * Includes:
 *  - Exponential time-decay (prevents stale data dominance)
 *  - GSC striking-distance boost (aligns SEO opportunity with revenue)
 *  - Authority dampening (prevents corridor concentration)
 */

import { skuMarginWeights } from "@/data/skuMarginWeights";
import type { RevenueNode } from "@/utils/revenueMap";

/* ─── Types ─────────────────────────────────────────── */

export interface RevenueMetric {
  slug: string;
  rfqSubmissions: number;
  avgDealValue: number;
  conversionRate: number;
  /** ISO date string of last revenue event */
  lastUpdated?: string;
}

export interface GSCSignal {
  slug: string;
  position: number;
  impressions: number;
}

/* ─── 1️⃣  Time-Decay ──────────────────────────────────
 *  Score × e^(-λ × age_in_days)
 *  λ = 0.01  →  half-life ≈ 69 days
 *  After ~6 months a score retains only ~16 % of its original weight.
 */
const DECAY_LAMBDA = 0.01;

export function timeDecay(lastUpdated: string | undefined): number {
  if (!lastUpdated) return 0.5; // unknown age → 50 % weight
  const ageDays =
    (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-DECAY_LAMBDA * Math.max(ageDays, 0));
}

/* ─── 2️⃣  GSC Striking-Distance Boost ────────────────
 *  Pages ranking 6-15 get a 15 % multiplier.
 *  Outside that window → no boost.
 */
export function gscBoostMultiplier(signal?: GSCSignal): number {
  if (!signal) return 1;
  if (signal.position >= 6 && signal.position <= 15) return 1.15;
  return 1;
}

/* ─── 3️⃣  Authority Dampening ─────────────────────────
 *  If a corridor already appears N times in a prominence set,
 *  each additional appearance is dampened:
 *    multiplier = 1 / (1 + log2(occurrences))
 *  This distributes link equity and avoids unnatural concentration.
 */
export function dampenScore(
  score: number,
  currentOccurrences: number
): number {
  if (currentOccurrences <= 1) return score;
  return score / (1 + Math.log2(currentOccurrences));
}

/**
 * Track corridor occurrences for dampening across a render pass.
 */
export function createDampeningTracker() {
  const counts = new Map<string, number>();
  return {
    /** Record a corridor appearance and return the dampened score. */
    apply(corridorKey: string, rawScore: number): number {
      const current = (counts.get(corridorKey) || 0) + 1;
      counts.set(corridorKey, current);
      return dampenScore(rawScore, current);
    },
    getCount(corridorKey: string): number {
      return counts.get(corridorKey) || 0;
    },
  };
}

/* ─── Core Scoring ─────────────────────────────────── */

/**
 * Composite dynamic score with decay + GSC boost:
 *   base = (RFQ × 0.4) + (Revenue × 0.4) + (Margin × 0.2)
 *   final = base × timeDecay × gscBoost
 */
export function calculateDynamicScore(
  metric: RevenueMetric,
  gscSignal?: GSCSignal
): number {
  const marginW = skuMarginWeights[metric.slug] ?? 1;
  const base =
    metric.rfqSubmissions * 0.4 +
    metric.avgDealValue * metric.conversionRate * 0.4 +
    marginW * 0.2;
  const decay = timeDecay(metric.lastUpdated);
  const boost = gscBoostMultiplier(gscSignal);
  return base * decay * boost;
}

/**
 * Blend static priority with live dynamic metrics.
 * Factor controls how much dynamic data overrides static:
 *   0 = fully static, 1 = fully dynamic.
 */
export function blendScores(
  staticScore: number,
  dynamicMetric: RevenueMetric | undefined,
  factor = 0.5,
  gscSignal?: GSCSignal
): number {
  if (!dynamicMetric) return staticScore;
  const dynamicScore = calculateDynamicScore(dynamicMetric, gscSignal);
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
