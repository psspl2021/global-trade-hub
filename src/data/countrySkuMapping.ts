/**
 * Country-to-SKU Procurement Intelligence Matrix
 * Maps which country is best for each SKU with cost/lead time data
 */
export interface CountrySkuEntry {
  sku: string;
  skuLabel: string;
  bestCountry: string;
  countrySlug: string;
  costAdvantage: string;
  leadTimeDays: string;
  notes: string;
}

export const countrySkuMapping: CountrySkuEntry[] = [
  {
    sku: "tmt-bars-india",
    skuLabel: "TMT Bars",
    bestCountry: "Japan",
    countrySlug: "japan",
    costAdvantage: "12–18% premium but JIS-certified quality",
    leadTimeDays: "20–35",
    notes: "CEPA tariff benefits. Best for seismic-grade Fe 500D.",
  },
  {
    sku: "tmt-bars-india",
    skuLabel: "TMT Bars",
    bestCountry: "UAE",
    countrySlug: "uae",
    costAdvantage: "3–6% below Japan, re-export pricing",
    leadTimeDays: "5–7",
    notes: "Fast transit. CEPA tariff reductions.",
  },
  {
    sku: "structural-steel-india",
    skuLabel: "Structural Steel",
    bestCountry: "China",
    countrySlug: "china",
    costAdvantage: "15–25% below Indian mills for volume",
    leadTimeDays: "15–25",
    notes: "Anti-dumping duty risk. QC inspection mandatory.",
  },
  {
    sku: "structural-steel-india",
    skuLabel: "Structural Steel",
    bestCountry: "Germany",
    countrySlug: "germany",
    costAdvantage: "Premium 20–30% but DIN/EN certified",
    leadTimeDays: "25–40",
    notes: "Best for precision fabrication. CE marked.",
  },
  {
    sku: "hr-coil-india",
    skuLabel: "HR Coil",
    bestCountry: "South Korea",
    countrySlug: "south-korea",
    costAdvantage: "8–12% below domestic for POSCO grades",
    leadTimeDays: "12–18",
    notes: "CEPA duty-free. POSCO quality benchmark.",
  },
  {
    sku: "hr-coil-india",
    skuLabel: "HR Coil",
    bestCountry: "Vietnam",
    countrySlug: "vietnam",
    costAdvantage: "10–20% below China with lower duty risk",
    leadTimeDays: "10–15",
    notes: "ASEAN-India FTA benefits. China+1 alternative.",
  },
  {
    sku: "ms-plates-india",
    skuLabel: "MS Plates",
    bestCountry: "China",
    countrySlug: "china",
    costAdvantage: "20–30% below domestic for thick plates",
    leadTimeDays: "15–25",
    notes: "Best for >25mm thick plates. Verify anti-dumping status.",
  },
  {
    sku: "ms-plates-india",
    skuLabel: "MS Plates",
    bestCountry: "Indonesia",
    countrySlug: "indonesia",
    costAdvantage: "10–15% below China, ASEAN tariff benefit",
    leadTimeDays: "12–18",
    notes: "Krakatau Steel supply. ASEAN FTA eligible.",
  },
];

export function getSkuCountryOptions(skuSlug: string): CountrySkuEntry[] {
  return countrySkuMapping.filter(e => e.sku === skuSlug);
}

export function getCountrySkuOptions(countrySlug: string): CountrySkuEntry[] {
  return countrySkuMapping.filter(e => e.countrySlug === countrySlug);
}
