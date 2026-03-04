/**
 * Demand Graph Scoring Engine v2
 * Composite scoring: RFQ × Revenue × Margin × Time-Decay × GSC-Boost
 */
import { skuMarginWeights } from "@/data/skuMarginWeights";

export interface DemandNode {
  skuSlug: string;
  countrySlug: string;
  rfq: number;
  revenue: number;
  gscPosition?: number;
  lastUpdated?: string;
}

const DECAY_LAMBDA = 0.01; // ~69 day half-life

function timeDecay(date?: string): number {
  if (!date) return 0.5;
  const ageInDays = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-DECAY_LAMBDA * Math.max(0, ageInDays));
}

function gscBoost(position?: number): number {
  if (!position) return 1;
  if (position >= 6 && position <= 15) return 1.15;
  return 1;
}

export function calculateCompositeScore(node: DemandNode): number {
  const margin = skuMarginWeights[node.skuSlug] ?? 1;

  const base =
    node.rfq * 0.4 +
    node.revenue * 0.4 +
    margin * 0.2;

  return base * timeDecay(node.lastUpdated) * gscBoost(node.gscPosition);
}

export function rankNodes(nodes: DemandNode[]): DemandNode[] {
  return [...nodes].sort(
    (a, b) => calculateCompositeScore(b) - calculateCompositeScore(a)
  );
}
