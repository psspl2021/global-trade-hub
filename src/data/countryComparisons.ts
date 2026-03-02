/**
 * Expanded country comparison data for /import/:slug routes
 */
export interface CountryComparisonEntry {
  slug: string;
  slugA: string;
  slugB: string;
  priceDelta: string;
  leadTimeDelta: string;
  dutyComparison: string;
  qualityRisk: string;
  currencyRisk: string;
  recommendedUseCase: string;
  antiImportA: string[];
  antiImportB: string[];
}

export const countryComparisons: Record<string, CountryComparisonEntry> = {
  "japan-vs-china": {
    slug: "japan-vs-china",
    slugA: "japan",
    slugB: "china",
    priceDelta: "Japan steel averages 12–18% higher than Chinese equivalents due to premium JIS-grade quality.",
    leadTimeDelta: "China delivers 15–25 days vs Japan's 20–35 days for similar steel categories.",
    dutyComparison: "Japan benefits from India-Japan CEPA (0–5% duty on eligible items). China faces anti-dumping duties of 10–30% on select steel categories.",
    qualityRisk: "Japanese suppliers maintain strict JIS compliance with lower defect rates. Chinese supply requires enhanced QC inspection protocols.",
    currencyRisk: "JPY is more volatile against INR than CNY. Hedging recommended for orders >₹1Cr from Japan.",
    recommendedUseCase: "Choose Japan for precision/high-tensile applications (auto, aerospace). Choose China for volume-driven infrastructure procurement.",
    antiImportA: [
      "Avoid Japan when budget is primary constraint — 12–18% premium may not justify for commodity grades",
      "Avoid for urgent orders under 20 days — Japan lead times are 20–35 days minimum",
      "Avoid during JPY appreciation cycles — landed cost becomes uncompetitive",
    ],
    antiImportB: [
      "Avoid China when anti-dumping duties are active on your HS code — check DGTR notifications",
      "Avoid for precision-grade applications without third-party QC — defect rates 2–5x higher",
      "Avoid during Chinese New Year (Jan-Feb) — production shutdowns cause 3–4 week delays",
    ],
  },
  "japan-vs-germany": {
    slug: "japan-vs-germany",
    slugA: "japan",
    slugB: "germany",
    priceDelta: "Germany averages 5–10% above Japan for equivalent specialty steel grades. DIN/EN certifications add compliance cost.",
    leadTimeDelta: "Japan: 20–35 days. Germany: 25–40 days via Hamburg/Bremerhaven.",
    dutyComparison: "Japan CEPA: 0–5% duty. Germany: MFN rates 5–15% (India-EU FTA pending).",
    qualityRisk: "Both maintain world-class quality. JIS (Japan) vs DIN/EN (Germany) — verify which standard your project requires.",
    currencyRisk: "EUR has broader correlation with global markets vs JPY's commodity-cycle sensitivity. Both require hedging for orders >₹2Cr.",
    recommendedUseCase: "Choose Japan for automotive/precision steel with CEPA benefits. Choose Germany for machinery-grade specialty alloys and CE-certified fabrication.",
    antiImportA: [
      "Avoid Japan for CE-marked projects requiring EN certification — re-certification costs negate savings",
      "Avoid for very thick plate (>100mm) — German mills have deeper capability",
    ],
    antiImportB: [
      "Avoid Germany when CEPA-eligible Japanese grades are available — 5–10% duty savings",
      "Avoid for high-volume commodity orders — German mills prioritize specialty over volume",
      "Avoid during EU CBAM transition period — carbon cost uncertainty affects pricing",
    ],
  },
  "china-vs-vietnam": {
    slug: "china-vs-vietnam",
    slugA: "china",
    slugB: "vietnam",
    priceDelta: "Vietnam is 5–12% above Chinese prices but with lower anti-dumping risk and ASEAN FTA benefits.",
    leadTimeDelta: "China: 15–25 days. Vietnam: 10–15 days to Indian east coast ports.",
    dutyComparison: "China: subject to anti-dumping duties 10–30%. Vietnam: ASEAN-India FTA provides reduced tariffs.",
    qualityRisk: "Chinese mills have deeper production capability. Vietnamese mills are newer but growing rapidly with Formosa Ha Tinh.",
    currencyRisk: "VND is relatively stable. CNY has managed float with less predictable movement for Indian importers.",
    recommendedUseCase: "Choose China for specialized grades and heavy volume. Choose Vietnam for China+1 diversification and ASEAN duty advantage.",
    antiImportA: [
      "Avoid China when DGTR anti-dumping investigation is active on your category",
      "Avoid for small orders under 100 MT — minimum order quantities are high",
      "Avoid during geopolitical tensions — supply chain disruption risk elevates",
    ],
    antiImportB: [
      "Avoid Vietnam for specialty alloy grades — limited mill capability vs China",
      "Avoid for thick plate >50mm — Formosa Ha Tinh focuses on flat products",
      "Avoid if your project requires Chinese GB standards — Vietnamese mills use different standards",
    ],
  },
  "uae-vs-saudi-arabia": {
    slug: "uae-vs-saudi-arabia",
    slugA: "uae",
    slugB: "saudi-arabia",
    priceDelta: "UAE re-export hub pricing is 3–6% higher than Saudi direct manufacturing prices.",
    leadTimeDelta: "UAE: 5–7 days transit. Saudi Arabia: 7–12 days transit to Indian west coast.",
    dutyComparison: "Both benefit from GCC frameworks. UAE has India-UAE CEPA with tariff reductions on 80%+ goods.",
    qualityRisk: "UAE serves as quality gateway with international certifications. Saudi SABIC products meet global petrochemical standards.",
    currencyRisk: "Both AED and SAR are pegged to USD, offering currency stability for Indian importers.",
    recommendedUseCase: "Choose UAE for diversified industrial goods and faster transit. Choose Saudi Arabia for bulk petrochemicals and polymers.",
    antiImportA: [
      "Avoid UAE for direct-from-manufacturer pricing — re-export markup adds 3–6%",
      "Avoid during Ramadan/Eid period — port processing delays expected",
    ],
    antiImportB: [
      "Avoid Saudi for urgent orders under 7 days — UAE transit is faster",
      "Avoid for non-petrochemical categories — Saudi industrial base is less diversified",
    ],
  },
  "saudi-vs-indonesia": {
    slug: "saudi-vs-indonesia",
    slugA: "saudi-arabia",
    slugB: "indonesia",
    priceDelta: "Indonesia offers 10–20% lower prices for ferro-alloys and base metals. Saudi is competitive on petrochemicals.",
    leadTimeDelta: "Saudi: 7–12 days. Indonesia: 12–18 days to Indian ports.",
    dutyComparison: "Indonesia: ASEAN-India FTA benefits. Saudi: GCC framework, India-GCC FTA pending.",
    qualityRisk: "SABIC (Saudi) products are globally certified. Indonesian metals require additional quality verification.",
    currencyRisk: "SAR is USD-pegged (stable). IDR is more volatile and requires hedging for large orders.",
    recommendedUseCase: "Choose Saudi for petrochemicals and polymers. Choose Indonesia for ferro-alloys, coal, and palm oil derivatives.",
    antiImportA: [
      "Avoid Saudi for ferro-alloys — limited production, Indonesia is 3–5x cheaper",
      "Avoid if your category doesn't benefit from GCC tariff framework",
    ],
    antiImportB: [
      "Avoid Indonesia for petrochemicals — SABIC has superior grade range and consistency",
      "Avoid during Indonesian export ban cycles on nickel/palm oil — policy shifts are sudden",
      "Avoid for time-sensitive orders — 12–18 day transit is slower than Gulf corridor",
    ],
  },
  "uae-vs-india": {
    slug: "uae-vs-india",
    slugA: "uae",
    slugB: "india",
    priceDelta: "Indian domestic procurement is 5–15% cheaper than UAE imports for steel, but UAE offers international-grade certifications.",
    leadTimeDelta: "India domestic: 3–10 days. UAE import: 5–7 days transit + customs clearance.",
    dutyComparison: "Domestic: no import duty. UAE: CEPA reduces duty to 0–5% on eligible goods.",
    qualityRisk: "Indian mills (Tata, JSW, SAIL) meet BIS standards. UAE re-exported goods carry international certifications.",
    currencyRisk: "Domestic: no currency risk. UAE: AED is USD-pegged, providing relative stability.",
    recommendedUseCase: "Choose domestic for standard BIS-grade procurement. Choose UAE when international certification or specific brands are required.",
    antiImportA: [
      "Avoid UAE import when domestic mills can supply the same grade at BIS standards",
      "Avoid for small quantities — import logistics overhead makes it uneconomical under 50 MT",
    ],
    antiImportB: [
      "Avoid domestic when international CE/ASTM certification is mandatory for export projects",
      "Avoid when domestic mills have capacity constraints — UAE provides backup corridor",
    ],
  },
};
