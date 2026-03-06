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
  /** Higher = more demand. Used for sorting in UI and sitemap priority. */
  demandRank?: number;
}

export const countrySkuMapping: CountrySkuEntry[] = [
  // ─── STEEL ──────────────────────────────────────────────────────
  { sku: "hr-coil-india", skuLabel: "HR Coil", bestCountry: "South Korea", countrySlug: "south-korea", costAdvantage: "8–12% below domestic for POSCO grades", leadTimeDays: "12–18", notes: "CEPA duty-free. POSCO quality benchmark.", demandRank: 95 },
  { sku: "hr-coil-india", skuLabel: "HR Coil", bestCountry: "Vietnam", countrySlug: "vietnam", costAdvantage: "10–20% below China with lower duty risk", leadTimeDays: "10–15", notes: "ASEAN-India FTA benefits. China+1 alternative.", demandRank: 88 },
  { sku: "hr-coil-india", skuLabel: "HR Coil", bestCountry: "Japan", countrySlug: "japan", costAdvantage: "10–15% premium but JIS G3131 certified", leadTimeDays: "20–35", notes: "CEPA duty benefits. Nippon Steel, JFE quality.", demandRank: 80 },
  { sku: "hr-coil-india", skuLabel: "HR Coil", bestCountry: "Indonesia", countrySlug: "indonesia", costAdvantage: "10–15% below domestic, ASEAN FTA", leadTimeDays: "12–18", notes: "Krakatau Steel. China+1 corridor.", demandRank: 72 },
  { sku: "tmt-bars-india", skuLabel: "TMT Bars", bestCountry: "Japan", countrySlug: "japan", costAdvantage: "12–18% premium but JIS-certified quality", leadTimeDays: "20–35", notes: "CEPA tariff benefits. Best for seismic-grade Fe 500D.", demandRank: 90 },
  { sku: "tmt-bars-india", skuLabel: "TMT Bars", bestCountry: "UAE", countrySlug: "uae", costAdvantage: "3–6% below Japan, re-export pricing", leadTimeDays: "5–7", notes: "Fast transit. CEPA tariff reductions.", demandRank: 82 },
  { sku: "tmt-bars-india", skuLabel: "TMT Bars", bestCountry: "Vietnam", countrySlug: "vietnam", costAdvantage: "8–15% below domestic", leadTimeDays: "10–15", notes: "ASEAN FTA. Formosa Ha Tinh, Hoa Phat.", demandRank: 70 },
  { sku: "structural-steel-india", skuLabel: "Structural Steel", bestCountry: "China", countrySlug: "china", costAdvantage: "15–25% below Indian mills for volume", leadTimeDays: "15–25", notes: "Anti-dumping duty risk. QC inspection mandatory.", demandRank: 85 },
  { sku: "structural-steel-india", skuLabel: "Structural Steel", bestCountry: "Germany", countrySlug: "germany", costAdvantage: "Premium 20–30% but DIN/EN certified", leadTimeDays: "25–40", notes: "Best for precision fabrication. CE marked.", demandRank: 75 },
  { sku: "structural-steel-india", skuLabel: "Structural Steel", bestCountry: "Vietnam", countrySlug: "vietnam", costAdvantage: "8–15% below domestic, ASEAN duty advantage", leadTimeDays: "10–15", notes: "Hoa Phat / Formosa Ha Tinh. Growing quality.", demandRank: 68 },
  { sku: "structural-steel-india", skuLabel: "Structural Steel", bestCountry: "Japan", countrySlug: "japan", costAdvantage: "15–25% premium, JIS certified", leadTimeDays: "20–35", notes: "CEPA 0–5% duty. Seismic-grade SN490.", demandRank: 65 },
  { sku: "ms-plates-india", skuLabel: "MS Plates", bestCountry: "China", countrySlug: "china", costAdvantage: "20–30% below domestic for thick plates", leadTimeDays: "15–25", notes: "Best for >25mm thick plates. Verify anti-dumping status.", demandRank: 80 },
  { sku: "ms-plates-india", skuLabel: "MS Plates", bestCountry: "Indonesia", countrySlug: "indonesia", costAdvantage: "10–15% below China, ASEAN tariff benefit", leadTimeDays: "12–18", notes: "Krakatau Steel supply. ASEAN FTA eligible.", demandRank: 70 },
  { sku: "ms-plates-india", skuLabel: "MS Plates", bestCountry: "Japan", countrySlug: "japan", costAdvantage: "12–18% premium, JIS G3101 certified", leadTimeDays: "20–35", notes: "CEPA benefits. Zero-defect certification.", demandRank: 60 },
  // ─── NON-FERROUS METALS ─────────────────────────────────────────
  { sku: "aluminium-ingots-india", skuLabel: "Aluminium Ingots", bestCountry: "UAE", countrySlug: "uae", costAdvantage: "LME-linked, competitive freight", leadTimeDays: "7–12", notes: "EGA supply. India-UAE CEPA benefits.", demandRank: 78 },
  { sku: "aluminium-ingots-india", skuLabel: "Aluminium Ingots", bestCountry: "China", countrySlug: "china", costAdvantage: "5–10% below LME for volume", leadTimeDays: "15–25", notes: "Verify anti-dumping status. Chalco, Hongqiao.", demandRank: 65 },
  { sku: "copper-cathodes-india", skuLabel: "Copper Cathodes", bestCountry: "Chile", countrySlug: "chile", costAdvantage: "LME benchmark, Grade A quality", leadTimeDays: "30–45", notes: "Codelco supply. LME Grade A registered.", demandRank: 82 },
  { sku: "copper-cathodes-india", skuLabel: "Copper Cathodes", bestCountry: "Japan", countrySlug: "japan", costAdvantage: "LME+premium, highest purity", leadTimeDays: "20–30", notes: "Sumitomo, Mitsubishi. CEPA benefits.", demandRank: 72 },
  { sku: "zinc-ingots-india", skuLabel: "Zinc Ingots", bestCountry: "South Korea", countrySlug: "south-korea", costAdvantage: "LME-linked, SHG 99.995%", leadTimeDays: "12–18", notes: "Korea Zinc. CEPA duty benefits.", demandRank: 70 },
  // ─── POLYMERS ───────────────────────────────────────────────────
  { sku: "pp-granules-india", skuLabel: "PP Granules", bestCountry: "UAE", countrySlug: "uae", costAdvantage: "5–10% below domestic for copolymer", leadTimeDays: "7–12", notes: "Borouge supply. CEPA duty benefits.", demandRank: 75 },
  { sku: "pp-granules-india", skuLabel: "PP Granules", bestCountry: "South Korea", countrySlug: "south-korea", costAdvantage: "Competitive for specialty grades", leadTimeDays: "15–20", notes: "LG Chem, Lotte Chemical. CEPA eligible.", demandRank: 62 },
  { sku: "hdpe-granules-india", skuLabel: "HDPE Granules", bestCountry: "UAE", countrySlug: "uae", costAdvantage: "8–12% below domestic for pipe grades", leadTimeDays: "7–12", notes: "Borouge PE 100. CEPA benefits.", demandRank: 74 },
  { sku: "pvc-resin-india", skuLabel: "PVC Resin", bestCountry: "Japan", countrySlug: "japan", costAdvantage: "Premium but consistent K-value", leadTimeDays: "20–30", notes: "Shin-Etsu, Kaneka. CEPA eligible.", demandRank: 68 },
];

export function getSkuCountryOptions(skuSlug: string): CountrySkuEntry[] {
  return countrySkuMapping.filter(e => e.sku === skuSlug);
}

export function getCountrySkuOptions(countrySlug: string): CountrySkuEntry[] {
  return countrySkuMapping.filter(e => e.countrySlug === countrySlug);
}
