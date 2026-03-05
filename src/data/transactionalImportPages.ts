/**
 * Transactional Import Corridor Pages
 * Direct-intent pages for specific SKU-from-Country corridors
 */
export interface TransactionalImportEntry {
  slug: string;
  skuLabel: string;
  skuSlug: string;
  country: string;
  countrySlug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  pricingInsight: string;
  dutyStructure: string;
  leadTime: string;
  riskFactors: string[];
  antiImportReasons: string[];
  recommendedFor: string[];
}

export const transactionalImportPages: TransactionalImportEntry[] = [
  {
    slug: "ms-plates-india-from-japan",
    skuLabel: "MS Plates",
    skuSlug: "ms-plates-india",
    country: "Japan",
    countrySlug: "japan",
    h1: "Import MS Plates from Japan to India — Pricing, Duty & Risk Analysis",
    metaTitle: "Import MS Plates from Japan to India — Duty, Pricing & Lead Time | ProcureSaathi",
    metaDescription: "Complete sourcing corridor analysis for importing MS Plates from Japan to India. JIS-certified quality, CEPA duty benefits, 20–35 day lead time. AI-verified suppliers.",
    pricingInsight: "Japanese MS Plates command a 12–18% premium over Indian domestic prices but deliver JIS G3101 SS400/SM490 certified quality that exceeds IS 2062 E250. For projects requiring seismic-grade or export-specification plates, the premium is justified by zero-defect certification and superior flatness tolerance.",
    dutyStructure: "India-Japan CEPA provides preferential tariff rates of 0–5% on eligible steel products under HS 7208. Certificate of Origin (CoO) from Japanese mills required. Anti-dumping duty NOT applicable on Japanese steel (unlike China). GST 18% applies on landed value.",
    leadTime: "20–35 days from Japanese port (Kobe, Nagoya, Yokohama) to Indian west coast ports (JNPT, Mundra). Add 5–7 days for east coast delivery (Visakhapatnam, Kolkata). Mill-direct orders require 45–60 day advance booking for rolling schedule allocation.",
    riskFactors: [
      "JPY/INR volatility — hedge orders exceeding ₹1Cr with forward contracts",
      "Mill-direct MOQ typically 50–100 MT per grade/size combination",
      "JIS-to-IS standard conversion may require additional testing for BIS-mandated projects",
      "Shipping capacity constraints during peak export seasons (Oct–Mar)",
    ],
    antiImportReasons: [
      "Avoid when budget is primary constraint — 12–18% premium over domestic mills",
      "Avoid for urgent orders under 20 days — minimum transit 20 days",
      "Avoid during JPY appreciation cycles — landed cost spikes 5–8%",
      "Avoid for standard E250 grade applications where Indian mills suffice",
    ],
    recommendedFor: [
      "Export-oriented EPC projects requiring international certifications",
      "Seismic-grade structural steel for Zone IV/V applications",
      "Precision fabrication requiring tight thickness tolerance (±0.3mm)",
      "Japanese OEM supply chain requirements (automotive, machinery)",
    ],
  },
  {
    slug: "ms-plates-india-from-china",
    skuLabel: "MS Plates",
    skuSlug: "ms-plates-india",
    country: "China",
    countrySlug: "china",
    h1: "Import MS Plates from China to India — Anti-Dumping, Pricing & QC Guide",
    metaTitle: "Import MS Plates from China to India — Duty, Anti-Dumping & QC | ProcureSaathi",
    metaDescription: "Sourcing MS Plates from China to India: 20–30% cost advantage with anti-dumping duty risks. Complete QC inspection protocol and HS code analysis.",
    pricingInsight: "Chinese MS Plates are 20–30% below Indian domestic prices for thick plates (>25mm). However, anti-dumping duties of 10–30% may apply depending on HS code classification. Net landed cost advantage is typically 5–15% after duties, making China viable only for large-volume orders where the savings justify QC overhead.",
    dutyStructure: "Basic customs duty 15% + anti-dumping duty 0–30% (check DGTR notification for specific HS code). Safeguard duties may apply periodically. BIS certification (ISI mark) mandatory for structural steel imports since QCO 2020. GST 18% on landed value.",
    leadTime: "15–25 days from Chinese ports (Shanghai, Tianjin, Qingdao) to Indian ports. Faster than Japan but requires 7–10 day buffer for customs clearance with anti-dumping duty assessment.",
    riskFactors: [
      "Anti-dumping duty status changes without advance notice — verify current DGTR notifications",
      "Quality consistency varies significantly between Chinese mills — third-party QC mandatory",
      "BIS certification requirement may block import of non-certified grades",
      "Geopolitical risk factor — trade policy shifts can disrupt corridor overnight",
    ],
    antiImportReasons: [
      "Avoid when active anti-dumping investigation is pending on your HS code",
      "Avoid for BIS-mandated projects without pre-verified mill certification",
      "Avoid for precision applications — Chinese plates have wider thickness tolerance",
      "Avoid during Chinese New Year (Jan–Feb) — 3–4 week production shutdown",
    ],
    recommendedFor: [
      "Large-volume infrastructure orders (>500 MT) where cost arbitrage exceeds duty impact",
      "Thick plates (>50mm) where Indian mill capacity is limited",
      "Non-structural applications not covered by BIS Quality Control Orders",
      "Repeat procurement from verified Chinese mills with established QC protocols",
    ],
  },
  {
    slug: "hr-coil-india-from-indonesia",
    skuLabel: "HR Coil",
    skuSlug: "hr-coil-india",
    country: "Indonesia",
    countrySlug: "indonesia",
    h1: "Import HR Coil from Indonesia to India — ASEAN FTA & Pricing Guide",
    metaTitle: "Import HR Coil from Indonesia to India — ASEAN Duty & Lead Time | ProcureSaathi",
    metaDescription: "Source HR Coils from Indonesia (Krakatau Steel) with ASEAN-India FTA benefits. 10–15% below China pricing with lower anti-dumping risk.",
    pricingInsight: "Indonesian HR Coils (primarily from Krakatau Steel and Gunung Garuda) offer 10–15% savings vs domestic Indian pricing. Positioned as a China+1 alternative with ASEAN-India FTA tariff benefits. Quality is comparable to Indian mills for standard commercial grades.",
    dutyStructure: "ASEAN-India FTA provides reduced tariff rates (0–5%) for eligible steel products. No anti-dumping duty applicable on Indonesian steel. Certificate of Origin under AIFTA required. GST 18% on landed value.",
    leadTime: "12–18 days from Indonesian ports (Tanjung Priok, Cilegon) to Indian east coast ports. 15–22 days to west coast. Shorter transit than China for eastern India delivery.",
    riskFactors: [
      "Limited grade range compared to Chinese or Japanese mills",
      "IDR currency fluctuation — less liquid forex market than CNY or JPY",
      "Krakatau Steel production capacity constraints during maintenance shutdowns",
      "Indonesian export policy changes (nickel ore ban precedent) could affect steel exports",
    ],
    antiImportReasons: [
      "Avoid for specialty alloy grades — limited Indonesian mill capability",
      "Avoid for very thin gauge (<1.6mm) — better served by Indian or Korean mills",
      "Avoid during Indonesian monsoon season — port congestion increases lead time",
    ],
    recommendedFor: [
      "China+1 sourcing strategy for procurement diversification",
      "Commercial-grade HR Coils for pipe manufacturing and general fabrication",
      "East coast Indian buyers — shorter transit than China or Middle East",
      "ASEAN FTA-eligible procurement to maximize duty savings",
    ],
  },
  {
    slug: "tmt-bars-india-from-vietnam",
    skuLabel: "TMT Bars",
    skuSlug: "tmt-bars-india",
    country: "Vietnam",
    countrySlug: "vietnam",
    h1: "Import TMT Bars from Vietnam to India — ASEAN FTA & Quality Analysis",
    metaTitle: "Import TMT Bars from Vietnam to India — Pricing, Duty & Quality | ProcureSaathi",
    metaDescription: "Source TMT Bars from Vietnam (Formosa Ha Tinh, Hoa Phat) with ASEAN-India FTA benefits. 8–15% below domestic with growing mill quality.",
    pricingInsight: "Vietnamese TMT Bars from Formosa Ha Tinh Steel and Hoa Phat Group offer 8–15% savings over Indian domestic prices. Vietnam has rapidly expanded steel capacity and now produces IS 1786-equivalent grades. Quality has improved significantly with Japanese technology transfer to Formosa Ha Tinh.",
    dutyStructure: "ASEAN-India FTA provides preferential tariff rates. No anti-dumping duty on Vietnamese TMT bars. BIS certification requirement applies — verify Vietnamese mill BIS license status before ordering. GST 18% on landed value.",
    leadTime: "10–15 days from Vietnamese ports (Hai Phong, Ho Chi Minh City) to Indian ports. Among the shortest transit corridors for imported steel.",
    riskFactors: [
      "BIS certification status — not all Vietnamese mills hold valid BIS license for TMT",
      "IS 1786 equivalence must be verified through independent testing",
      "Vietnamese mills prioritize domestic market during construction season peaks",
      "Quality consistency still developing vs established Indian brands (Tata Tiscon, JSW NeoSteel)",
    ],
    antiImportReasons: [
      "Avoid for government tenders mandating specific Indian mill brands",
      "Avoid if Vietnamese mill lacks valid BIS certification for TMT bars",
      "Avoid for seismic-grade Fe 550D — limited Vietnamese mill capability",
      "Avoid for small quantities (<100 MT) — logistics overhead negates savings",
    ],
    recommendedFor: [
      "Large private construction projects prioritising cost over brand preference",
      "China+1 diversification for TMT bar procurement",
      "East coast and southern India buyers — shortest transit from Vietnam",
      "Projects where ASEAN FTA duty savings create meaningful landed cost advantage",
    ],
  },
  {
    slug: "structural-steel-india-from-japan",
    skuLabel: "Structural Steel",
    skuSlug: "structural-steel-india",
    country: "Japan",
    countrySlug: "japan",
    h1: "Import Structural Steel from Japan to India — JIS Certified & CEPA Benefits",
    metaTitle: "Import Structural Steel from Japan — CEPA Duty & JIS Quality | ProcureSaathi",
    metaDescription: "Source JIS-certified structural steel sections from Japan with India-Japan CEPA tariff benefits. Premium quality for seismic and high-rise applications.",
    pricingInsight: "Japanese structural steel (Nippon Steel, JFE) commands 15–25% premium over Indian equivalents but delivers JIS G3101/G3106 certification with tighter dimensional tolerances. For high-rise, seismic, and export-specification projects, Japanese structural sections are the gold standard.",
    dutyStructure: "India-Japan CEPA provides 0–5% preferential tariff on structural steel sections. Certificate of Origin required from Japanese manufacturers. No anti-dumping risk. GST 18% on landed value.",
    leadTime: "20–35 days from Japanese steel ports to Indian ports. Mill-direct orders for non-standard sections may require 60–90 day lead time for rolling programme scheduling.",
    riskFactors: [
      "High MOQ requirements — Japanese mills typically require 100+ MT per section size",
      "JPY/INR exchange rate volatility impacts landed cost predictability",
      "Non-standard Indian sections (ISMB/ISHB) not directly available — JIS sections differ",
      "Long lead times for mill-direct orders during peak Japanese construction season",
    ],
    antiImportReasons: [
      "Avoid for standard IS 2062 E250 applications where Indian mills are adequate",
      "Avoid when project requires Indian standard sections (ISMB, ISHB, ISMC) — JIS sections differ",
      "Avoid for urgent requirements under 25 days",
      "Avoid for cost-sensitive projects where 15–25% premium is not justifiable",
    ],
    recommendedFor: [
      "High-rise buildings requiring SN 490B/SN 490C seismic-grade steel",
      "Export projects requiring JIS or international structural steel certification",
      "Japanese-invested industrial projects in India specifying JIS standards",
      "Bridge and infrastructure projects with stringent impact test requirements",
    ],
  },
  {
    slug: "hr-coil-india-from-japan",
    skuLabel: "HR Coil",
    skuSlug: "hr-coil-india",
    country: "Japan",
    countrySlug: "japan",
    h1: "Import HR Coil from Japan to India — CEPA Duty, JIS Quality & Pricing",
    metaTitle: "Import HR Coil from Japan to India — CEPA Duty & JIS Quality | ProcureSaathi",
    metaDescription: "Source JIS G3131-certified HR Coils from Japan with India-Japan CEPA tariff benefits. Nippon Steel and JFE quality for automotive and precision applications.",
    pricingInsight: "Japanese HR Coils (Nippon Steel, JFE) command 10–15% premium over Indian domestic but deliver JIS G3131 SPHC/SPHD certification with superior surface quality and tighter gauge tolerance. Ideal for automotive stamping and appliance manufacturing where surface finish is critical.",
    dutyStructure: "India-Japan CEPA provides 0–5% preferential tariff for eligible HR coil HS codes (7208). Certificate of Origin required. No anti-dumping duty on Japanese steel. GST 18% on landed value.",
    leadTime: "20–35 days from Japanese ports (Kobe, Nagoya) to Indian west coast. Add 5–7 days for east coast. Mill-direct coil orders require 45–60 day booking window.",
    riskFactors: [
      "JPY/INR volatility — hedge orders exceeding ₹1Cr",
      "Mill-direct MOQ typically 100–200 MT per grade/gauge combination",
      "JIS-to-IS specification mapping required for Indian end-use",
      "Coil width and gauge availability varies by mill rolling schedule",
    ],
    antiImportReasons: [
      "Avoid for commodity-grade applications where Indian mills suffice",
      "Avoid for urgent orders under 25 days",
      "Avoid during JPY appreciation cycles",
      "Avoid for thin gauge (<1.2mm) — Indian CR+annealing may be cheaper",
    ],
    recommendedFor: [
      "Automotive stamping requiring superior surface finish",
      "Appliance manufacturing with strict gauge tolerance requirements",
      "Export-specification pipe manufacturing",
      "Japanese OEM supply chain specifications",
    ],
  },
  {
    slug: "ms-plates-india-from-indonesia",
    skuLabel: "MS Plates",
    skuSlug: "ms-plates-india",
    country: "Indonesia",
    countrySlug: "indonesia",
    h1: "Import MS Plates from Indonesia to India — ASEAN FTA & Krakatau Steel",
    metaTitle: "Import MS Plates from Indonesia to India — ASEAN Duty & Pricing | ProcureSaathi",
    metaDescription: "Source MS Plates from Indonesia (Krakatau Steel) with ASEAN-India FTA benefits. 10–15% below China pricing with no anti-dumping risk.",
    pricingInsight: "Indonesian MS Plates from Krakatau Steel offer 10–15% savings vs Indian domestic pricing, positioned as a China+1 alternative with ASEAN-India FTA tariff benefits. Quality is comparable for standard commercial grades.",
    dutyStructure: "ASEAN-India FTA provides reduced tariff rates (0–5%) for eligible steel. No anti-dumping duty applicable on Indonesian steel. Certificate of Origin under AIFTA required. GST 18% on landed value.",
    leadTime: "12–18 days from Indonesian ports (Cilegon, Tanjung Priok) to Indian ports. Among the shortest transit corridors for imported plates.",
    riskFactors: [
      "Limited grade range compared to Japanese or Chinese mills",
      "Krakatau Steel capacity constraints during maintenance shutdowns",
      "IDR currency fluctuation — less liquid forex market",
      "Indonesian export policy changes could affect availability",
    ],
    antiImportReasons: [
      "Avoid for specialty grades requiring tight tolerance",
      "Avoid for very thick plates (>80mm) — limited Indonesian mill capability",
      "Avoid during Indonesian monsoon season — port congestion risk",
    ],
    recommendedFor: [
      "China+1 sourcing strategy for cost diversification",
      "Standard commercial-grade plates for general fabrication",
      "East coast Indian buyers — shorter transit than China",
      "ASEAN FTA-eligible procurement for duty savings",
    ],
  },
  {
    slug: "structural-steel-india-from-vietnam",
    skuLabel: "Structural Steel",
    skuSlug: "structural-steel-india",
    country: "Vietnam",
    countrySlug: "vietnam",
    h1: "Import Structural Steel from Vietnam to India — ASEAN FTA & Pricing Guide",
    metaTitle: "Import Structural Steel from Vietnam — ASEAN Duty & Quality | ProcureSaathi",
    metaDescription: "Source structural steel sections from Vietnam (Hoa Phat, Formosa Ha Tinh) with ASEAN-India FTA benefits. 8–15% below domestic pricing.",
    pricingInsight: "Vietnamese structural steel from Hoa Phat Group and Formosa Ha Tinh offers 8–15% savings over Indian domestic pricing. Vietnam has rapidly expanded its steel production capacity with Japanese technology transfer, delivering improving quality standards.",
    dutyStructure: "ASEAN-India FTA provides preferential tariff rates (0–5%). No anti-dumping duty on Vietnamese structural steel. BIS certification may apply for certain sections. GST 18% on landed value.",
    leadTime: "10–15 days from Vietnamese ports (Hai Phong, HCMC) to Indian ports. Among the shortest transit corridors for imported steel.",
    riskFactors: [
      "BIS certification requirements — verify Vietnamese mill compliance",
      "Section sizes may differ from Indian IS standards",
      "Vietnamese mills prioritize domestic during construction season peaks",
      "Quality consistency still developing vs established Indian mills",
    ],
    antiImportReasons: [
      "Avoid for sections requiring exact IS 808 dimensional compliance",
      "Avoid for government tenders mandating specific Indian mill brands",
      "Avoid for small quantities (<100 MT) — logistics cost negates savings",
    ],
    recommendedFor: [
      "Private industrial construction projects prioritizing cost",
      "China+1 structural steel diversification",
      "Southern India buyers — shortest transit from Vietnam",
      "Pre-engineered building (PEB) projects with standard section requirements",
    ],
  },
];
export function getTransactionalImportPage(slug: string): TransactionalImportEntry | undefined {
  return transactionalImportPages.find(p => p.slug === slug);
}

export function getTransactionalImportSlugs(): string[] {
  return transactionalImportPages.map(p => p.slug);
}
