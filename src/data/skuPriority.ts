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
  // Non-ferrous
  { slug: "aluminium-ingots-india", rfqVolume: 40, avgMargin: 7, strategicMarketWeight: 6 },
  // Ferro-alloys
  { slug: "ferro-manganese-india", rfqVolume: 30, avgMargin: 11, strategicMarketWeight: 5 },
  { slug: "ferro-silicon-india", rfqVolume: 25, avgMargin: 10, strategicMarketWeight: 5 },
  { slug: "ferro-chrome-india", rfqVolume: 20, avgMargin: 12, strategicMarketWeight: 4 },
  // Polymers
  { slug: "pp-granules-india", rfqVolume: 45, avgMargin: 7, strategicMarketWeight: 7 },
  { slug: "hdpe-granules-india", rfqVolume: 50, avgMargin: 6, strategicMarketWeight: 7 },
  { slug: "pvc-resin-india", rfqVolume: 40, avgMargin: 8, strategicMarketWeight: 6 },
  { slug: "abs-granules-india", rfqVolume: 20, avgMargin: 10, strategicMarketWeight: 5 },
];

export function getPriorityScore(slug: string): number {
  const sku = skuPriorityData.find(s => s.slug === slug);
  if (!sku) return 1;
  return sku.rfqVolume * sku.avgMargin * sku.strategicMarketWeight;
}
