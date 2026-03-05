/**
 * Margin weights per SKU — blends with revenue for intelligent scoring.
 * Higher weight = higher margin corridor.
 * Extracted to avoid circular dependency between engines.
 */
export const skuMarginWeights: Record<string, number> = {
  "tmt-bars-india": 8,
  "structural-steel-india": 12,
  "hr-coil-india": 10,
  "ms-plates-india": 9,
  "cr-coil-india": 9,
  "gi-pipes-india": 8,
  "aluminium-ingots-india": 7,
  "copper-cathodes-india": 6,
  "zinc-ingots-india": 7,
  "lead-ingots-india": 6,
  "ferro-manganese-india": 11,
  "ferro-silicon-india": 10,
  "ferro-chrome-india": 12,
  "pp-granules-india": 7,
  "hdpe-granules-india": 6,
  "pvc-resin-india": 8,
  "abs-granules-india": 10,
  "ms-pipes-india": 8,
  "structural-fasteners-india": 9,
  "high-tensile-bolts-india": 10,
  "bitumen-vg30-india": 7,
  "industrial-valves-india": 11,
};
