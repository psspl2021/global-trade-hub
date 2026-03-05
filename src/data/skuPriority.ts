export interface SKUPriority {
  slug: string;
  rfqVolume: number;
  avgMargin: number;
  strategicMarketWeight: number;
}

export const skuPriorityData: SKUPriority[] = [
  // Ferrous — highest volume
  { slug: "tmt-bars-india", rfqVolume: 95, avgMargin: 8, strategicMarketWeight: 9 },
  { slug: "structural-steel-india", rfqVolume: 80, avgMargin: 12, strategicMarketWeight: 10 },
  { slug: "ms-plates-india", rfqVolume: 70, avgMargin: 9, strategicMarketWeight: 8 },
  { slug: "hr-coil-india", rfqVolume: 65, avgMargin: 10, strategicMarketWeight: 8 },
  { slug: "cr-coil-india", rfqVolume: 55, avgMargin: 9, strategicMarketWeight: 7 },
  { slug: "gi-pipes-india", rfqVolume: 50, avgMargin: 8, strategicMarketWeight: 7 },
  { slug: "ms-pipes-india", rfqVolume: 45, avgMargin: 8, strategicMarketWeight: 7 },
  // Non-ferrous
  { slug: "aluminium-ingots-india", rfqVolume: 40, avgMargin: 7, strategicMarketWeight: 6 },
  { slug: "copper-cathodes-india", rfqVolume: 35, avgMargin: 6, strategicMarketWeight: 7 },
  { slug: "zinc-ingots-india", rfqVolume: 28, avgMargin: 7, strategicMarketWeight: 6 },
  { slug: "lead-ingots-india", rfqVolume: 20, avgMargin: 6, strategicMarketWeight: 5 },
  // Ferro-alloys
  { slug: "ferro-manganese-india", rfqVolume: 30, avgMargin: 11, strategicMarketWeight: 5 },
  { slug: "ferro-silicon-india", rfqVolume: 25, avgMargin: 10, strategicMarketWeight: 5 },
  { slug: "ferro-chrome-india", rfqVolume: 20, avgMargin: 12, strategicMarketWeight: 4 },
  // Polymers
  { slug: "pp-granules-india", rfqVolume: 45, avgMargin: 7, strategicMarketWeight: 7 },
  { slug: "hdpe-granules-india", rfqVolume: 50, avgMargin: 6, strategicMarketWeight: 7 },
  { slug: "pvc-resin-india", rfqVolume: 40, avgMargin: 8, strategicMarketWeight: 6 },
  { slug: "abs-granules-india", rfqVolume: 20, avgMargin: 10, strategicMarketWeight: 5 },
  // Industrial Supplies
  { slug: "structural-fasteners-india", rfqVolume: 35, avgMargin: 9, strategicMarketWeight: 6 },
  { slug: "high-tensile-bolts-india", rfqVolume: 30, avgMargin: 10, strategicMarketWeight: 6 },
  { slug: "bitumen-vg30-india", rfqVolume: 40, avgMargin: 7, strategicMarketWeight: 7 },
  { slug: "industrial-valves-india", rfqVolume: 35, avgMargin: 11, strategicMarketWeight: 7 },
];

export function getPriorityScore(slug: string): number {
  const sku = skuPriorityData.find(s => s.slug === slug);
  if (!sku) return 1;
  return sku.rfqVolume * sku.avgMargin * sku.strategicMarketWeight;
}
