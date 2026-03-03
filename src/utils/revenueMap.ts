import { supabase } from "@/integrations/supabase/client";

export interface RevenueNode {
  skuSlug: string;
  countrySlug: string;
  sourcePageType: string;
  rfqCount: number;
  totalRevenue: number;
}

/**
 * Composite revenue map keyed by SKU|Country|PageType
 * Supports multi-dimensional lookups for corridor, use-case,
 * comparison, and industry sorting.
 */
export async function getRevenueNodes(): Promise<RevenueNode[]> {
  const { data } = await supabase
    .from("seo_revenue_dashboard" as any)
    .select("sku_slug, country_slug, source_page_type, rfq_count, total_revenue");

  return ((data as any[]) || []).map((row: any) => ({
    skuSlug: row.sku_slug || "",
    countrySlug: row.country_slug || "india",
    sourcePageType: row.source_page_type || "demand",
    rfqCount: row.rfq_count || 0,
    totalRevenue: row.total_revenue || 0,
  }));
}

/** Flat SKU|Country map (backward compatible) */
export async function getRevenueMap(): Promise<Record<string, number>> {
  const nodes = await getRevenueNodes();
  const map: Record<string, number> = {};

  nodes.forEach((node) => {
    const key = `${node.skuSlug}|${node.countrySlug}`;
    map[key] = (map[key] || 0) + node.totalRevenue;
  });

  return map;
}

/** Composite key map: SKU|Country|PageType → score (with time-decay) */
export function buildCompositeScoreMap(
  nodes: RevenueNode[],
  marginWeights?: Record<string, number>
): Record<string, number> {
  const map: Record<string, number> = {};
  const now = Date.now();

  nodes.forEach((node) => {
    const key = `${node.skuSlug}|${node.countrySlug}|${node.sourcePageType}`;
    const marginW = marginWeights?.[node.skuSlug] ?? 1;
    const base =
      node.rfqCount * 0.4 +
      node.totalRevenue * 0.4 +
      marginW * 0.2;
    // Apply time-decay: nodes without timestamps get 50% weight
    const DECAY_LAMBDA = 0.01;
    const decay = 0.5; // default for view-sourced data without row-level timestamps
    const score = base * decay;
    map[key] = (map[key] || 0) + score;
  });

  return map;
}

/** Roll up revenue by SKU only */
export function rollUpBySku(nodes: RevenueNode[]): Record<string, number> {
  const map: Record<string, number> = {};
  nodes.forEach((n) => {
    map[n.skuSlug] = (map[n.skuSlug] || 0) + n.totalRevenue;
  });
  return map;
}

/** Roll up by page type for a given SKU */
export function rollUpByPageType(
  nodes: RevenueNode[],
  skuSlug: string
): Record<string, number> {
  const map: Record<string, number> = {};
  nodes.filter((n) => n.skuSlug === skuSlug).forEach((n) => {
    map[n.sourcePageType] = (map[n.sourcePageType] || 0) + n.totalRevenue;
  });
  return map;
}

/** Get top corridors (SKU×Country) sorted by composite score */
export function getTopCorridors(
  nodes: RevenueNode[],
  limit = 5,
  marginWeights?: Record<string, number>
): { skuSlug: string; countrySlug: string; score: number }[] {
  const corridorMap: Record<string, { skuSlug: string; countrySlug: string; score: number }> = {};

  nodes.forEach((n) => {
    const key = `${n.skuSlug}|${n.countrySlug}`;
    const marginW = marginWeights?.[n.skuSlug] ?? 1;
    const score = n.rfqCount * 0.4 + n.totalRevenue * 0.4 + marginW * 0.2;
    if (!corridorMap[key]) {
      corridorMap[key] = { skuSlug: n.skuSlug, countrySlug: n.countrySlug, score: 0 };
    }
    corridorMap[key].score += score;
  });

  return Object.values(corridorMap)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
