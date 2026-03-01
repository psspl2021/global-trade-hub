export interface SKUPriority {
  slug: string;
  rfqVolume: number;
  avgMargin: number;
  strategicMarketWeight: number;
}

export const skuPriorityData: SKUPriority[] = [
  { slug: "tmt-bars-india", rfqVolume: 95, avgMargin: 8, strategicMarketWeight: 9 },
  { slug: "structural-steel-india", rfqVolume: 80, avgMargin: 12, strategicMarketWeight: 10 },
  { slug: "hr-coil-india", rfqVolume: 65, avgMargin: 10, strategicMarketWeight: 8 },
  { slug: "ms-plates-india", rfqVolume: 70, avgMargin: 9, strategicMarketWeight: 8 },
];

export function getPriorityScore(slug: string): number {
  const sku = skuPriorityData.find(s => s.slug === slug);
  if (!sku) return 1;
  return sku.rfqVolume * sku.avgMargin * sku.strategicMarketWeight;
}
