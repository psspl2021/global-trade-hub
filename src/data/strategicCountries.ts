export interface StrategicCountry {
  name: string;
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  heroIntro: string;
  tradeIntelligence: string[];
  topExports: { hsCode: string; product: string }[];
  majorPorts: string[];
  tradeAgreementStatus: string;
  riskScore: "Low" | "Moderate" | "Elevated";
  relatedDemandSlugs: string[];
}

export const strategicCountriesData: StrategicCountry[] = [
  {
    name: "China",
    slug: "china",
    h1: "China Industrial Suppliers & Trade Intelligence",
    metaTitle: "China Industrial Suppliers | Steel, Polymers & EPC Procurement",
    metaDescription: "AI-driven sourcing intelligence for importing steel, polymers and industrial equipment from China to India.",
    heroIntro:
      "China is the world's largest industrial producer and a primary sourcing corridor for Indian EPC contractors and manufacturers. ProcureSaathi monitors price volatility, HS code trends, and compliance risk across Chinese export categories.",
    tradeIntelligence: [
      "Major export corridor for HR Coil, CR Coil, machinery and fabricated steel.",
      "Currency volatility impacts landed cost benchmarking.",
      "Anti-dumping duties may apply to select steel categories.",
      "Strong port infrastructure across Shanghai, Shenzhen and Ningbo."
    ],
    topExports: [
      { hsCode: "7208", product: "Hot Rolled Steel Coil" },
      { hsCode: "7210", product: "Coated Steel Products" },
      { hsCode: "8479", product: "Industrial Machinery" }
    ],
    majorPorts: ["Shanghai", "Shenzhen", "Ningbo"],
    tradeAgreementStatus: "No FTA with India. Subject to anti-dumping review in select categories.",
    riskScore: "Moderate",
    relatedDemandSlugs: ["hr-coil-india", "ms-plates-india", "structural-steel-india"]
  },
  {
    name: "UAE",
    slug: "uae",
    h1: "UAE Industrial Suppliers & Trade Intelligence",
    metaTitle: "UAE Industrial Suppliers | Steel, Petrochemicals & EPC Procurement",
    metaDescription: "AI-driven sourcing intelligence for importing steel, petrochemicals and industrial materials from UAE to India.",
    heroIntro:
      "The UAE serves as a critical re-export hub and direct supplier of petrochemical derivatives, steel, and aluminium to India. ProcureSaathi tracks Jebel Ali pricing, HS code movements, and GCC compliance frameworks.",
    tradeIntelligence: [
      "Jebel Ali Free Zone is Asia's largest re-export hub with direct India connectivity.",
      "Petrochemical and polymer derivatives dominate bilateral trade.",
      "CEPA (Comprehensive Economic Partnership Agreement) reduces tariffs on eligible goods.",
      "5–7 day average transit to Indian west coast ports."
    ],
    topExports: [
      { hsCode: "2710", product: "Petroleum Products" },
      { hsCode: "7601", product: "Aluminium Unwrought" },
      { hsCode: "3901", product: "Polymers of Ethylene" }
    ],
    majorPorts: ["Jebel Ali", "Khalifa Port", "Fujairah"],
    tradeAgreementStatus: "India-UAE CEPA active since May 2022. Tariff reductions on 80%+ of goods.",
    riskScore: "Low",
    relatedDemandSlugs: ["hr-coil-india", "ms-plates-india", "tmt-bars-india"]
  },
  {
    name: "Germany",
    slug: "germany",
    h1: "Germany Industrial Suppliers & Trade Intelligence",
    metaTitle: "Germany Industrial Suppliers | Machinery, Steel & Precision Engineering",
    metaDescription: "AI-driven sourcing intelligence for importing machinery, precision steel and engineering components from Germany to India.",
    heroIntro:
      "Germany is Europe's industrial powerhouse and a key supplier of precision machinery, specialty steel, and engineering components to India. ProcureSaathi monitors EU compliance standards, REACH regulations, and bilateral trade dynamics.",
    tradeIntelligence: [
      "Leading supplier of CNC machinery, automotive components and specialty alloys.",
      "EU CBAM (Carbon Border Adjustment Mechanism) may affect steel trade from 2026.",
      "High quality standards with TÜV and CE certification requirements.",
      "Hamburg and Bremerhaven are primary export ports to India."
    ],
    topExports: [
      { hsCode: "8456", product: "Machine Tools & CNC" },
      { hsCode: "7225", product: "Flat-Rolled Alloy Steel" },
      { hsCode: "8481", product: "Valves & Industrial Fittings" }
    ],
    majorPorts: ["Hamburg", "Bremerhaven", "Wilhelmshaven"],
    tradeAgreementStatus: "India-EU FTA under negotiation. Currently under MFN tariff framework.",
    riskScore: "Low",
    relatedDemandSlugs: ["structural-steel-india", "ms-plates-india"]
  },
  {
    name: "USA",
    slug: "usa",
    h1: "USA Industrial Suppliers & Trade Intelligence",
    metaTitle: "USA Industrial Suppliers | Steel, Chemicals & Heavy Equipment",
    metaDescription: "AI-driven sourcing intelligence for importing steel, chemicals and heavy equipment from USA to India.",
    heroIntro:
      "The United States is a strategic supplier of specialty steel, chemicals, and heavy industrial equipment. ProcureSaathi tracks Section 232 steel tariffs, ASTM compliance standards, and Indo-Pacific trade corridor dynamics.",
    tradeIntelligence: [
      "Specialty steel and high-grade alloy exports dominate bilateral industrial trade.",
      "Section 232 tariffs and export controls affect select categories.",
      "ASTM and ASME standards required for engineering-grade imports.",
      "West coast ports (LA, Long Beach) provide Pacific routing to India."
    ],
    topExports: [
      { hsCode: "7204", product: "Ferrous Waste & Scrap" },
      { hsCode: "2711", product: "Petroleum Gases (LNG)" },
      { hsCode: "8411", product: "Turbojets & Gas Turbines" }
    ],
    majorPorts: ["Los Angeles", "Houston", "New York/New Jersey"],
    tradeAgreementStatus: "No FTA with India. GSP benefits suspended. Bilateral trade framework applies.",
    riskScore: "Moderate",
    relatedDemandSlugs: ["structural-steel-india", "hr-coil-india"]
  },
  {
    name: "Japan",
    slug: "japan",
    h1: "Japan Industrial Suppliers & Trade Intelligence",
    metaTitle: "Japan Industrial Suppliers | Steel, Auto Components & Precision Parts",
    metaDescription: "AI-driven sourcing intelligence for importing steel, auto components and precision engineering from Japan to India.",
    heroIntro:
      "Japan is a premium supplier of high-tensile steel, automotive components, and precision engineering parts. ProcureSaathi leverages India-Japan CEPA tariff benefits and monitors JIS compliance standards.",
    tradeIntelligence: [
      "India-Japan CEPA provides preferential tariffs on 90%+ industrial categories.",
      "JIS standards are benchmark for high-quality steel and engineering goods.",
      "Japanese OEM supply chains increasingly source through India corridor.",
      "Kobe and Yokohama are primary steel export ports."
    ],
    topExports: [
      { hsCode: "7209", product: "Cold Rolled Steel Coil" },
      { hsCode: "8708", product: "Auto Components" },
      { hsCode: "8542", product: "Electronic Integrated Circuits" }
    ],
    majorPorts: ["Kobe", "Yokohama", "Nagoya"],
    tradeAgreementStatus: "India-Japan CEPA active since 2011. Tariff elimination on 90%+ of trade lines.",
    riskScore: "Low",
    relatedDemandSlugs: ["hr-coil-india", "tmt-bars-india", "structural-steel-india"]
  },
  {
    name: "South Korea",
    slug: "south-korea",
    h1: "South Korea Industrial Suppliers & Trade Intelligence",
    metaTitle: "South Korea Industrial Suppliers | Steel, Electronics & Petrochemicals",
    metaDescription: "AI-driven sourcing intelligence for importing steel, electronics and petrochemicals from South Korea to India.",
    heroIntro:
      "South Korea is a top-tier supplier of flat steel, petrochemicals, and electronic components. ProcureSaathi monitors POSCO supply corridors, KS standards, and India-Korea CEPA benefits.",
    tradeIntelligence: [
      "POSCO is one of the largest steel suppliers to Indian infrastructure projects.",
      "India-Korea CEPA provides duty-free access on eligible industrial goods.",
      "Korean petrochemical exports (PTA, MEG) are critical to Indian textile and polymer sectors.",
      "Busan is the primary export gateway to India."
    ],
    topExports: [
      { hsCode: "7210", product: "Coated Steel Products" },
      { hsCode: "2917", product: "Polycarboxylic Acids (PTA)" },
      { hsCode: "8541", product: "Semiconductor Devices" }
    ],
    majorPorts: ["Busan", "Incheon", "Ulsan"],
    tradeAgreementStatus: "India-Korea CEPA active since 2010. Currently under review for rebalancing.",
    riskScore: "Low",
    relatedDemandSlugs: ["hr-coil-india", "ms-plates-india", "tmt-bars-india"]
  },
  {
    name: "Saudi Arabia",
    slug: "saudi-arabia",
    h1: "Saudi Arabia Industrial Suppliers & Trade Intelligence",
    metaTitle: "Saudi Arabia Industrial Suppliers | Petrochemicals, Steel & Polymers",
    metaDescription: "AI-driven sourcing intelligence for importing petrochemicals, steel and polymers from Saudi Arabia to India.",
    heroIntro:
      "Saudi Arabia is India's largest crude oil supplier and a growing source of petrochemical derivatives, polymers, and fertilizers. ProcureSaathi tracks SABIC pricing, Vision 2030 industrial policy, and GCC trade dynamics.",
    tradeIntelligence: [
      "SABIC is one of the world's largest petrochemical manufacturers.",
      "Strong polymer and fertilizer export corridors to India.",
      "Vision 2030 diversifying Saudi industrial exports beyond hydrocarbons.",
      "Jubail and Yanbu are primary industrial export ports."
    ],
    topExports: [
      { hsCode: "2710", product: "Petroleum Products" },
      { hsCode: "3901", product: "Polymers of Ethylene" },
      { hsCode: "3102", product: "Mineral Fertilizers" }
    ],
    majorPorts: ["Jubail", "Jeddah", "Yanbu"],
    tradeAgreementStatus: "India-GCC FTA under negotiation. Bilateral trade framework applies.",
    riskScore: "Low",
    relatedDemandSlugs: ["ms-plates-india", "hr-coil-india"]
  },
  {
    name: "Vietnam",
    slug: "vietnam",
    h1: "Vietnam Industrial Suppliers & Trade Intelligence",
    metaTitle: "Vietnam Industrial Suppliers | Steel, Textiles & Manufacturing",
    metaDescription: "AI-driven sourcing intelligence for importing steel, textiles and manufactured goods from Vietnam to India.",
    heroIntro:
      "Vietnam is rapidly emerging as a competitive alternative to China for steel, textiles, and light manufacturing. ProcureSaathi monitors ASEAN-India FTA benefits, port logistics, and cost arbitrage opportunities.",
    tradeIntelligence: [
      "ASEAN-India FTA provides preferential tariffs on industrial goods.",
      "Emerging steel export corridor with competitive pricing.",
      "China+1 strategy driving manufacturing diversification to Vietnam.",
      "Ho Chi Minh City and Haiphong are primary export hubs."
    ],
    topExports: [
      { hsCode: "7208", product: "Hot Rolled Steel Products" },
      { hsCode: "6109", product: "T-Shirts & Knitted Garments" },
      { hsCode: "8471", product: "Electronic Data Processing Machines" }
    ],
    majorPorts: ["Ho Chi Minh City", "Haiphong", "Da Nang"],
    tradeAgreementStatus: "ASEAN-India FTA active. Tariff concessions on 80%+ of trade lines.",
    riskScore: "Moderate",
    relatedDemandSlugs: ["hr-coil-india", "structural-steel-india"]
  },
  {
    name: "Indonesia",
    slug: "indonesia",
    h1: "Indonesia Industrial Suppliers & Trade Intelligence",
    metaTitle: "Indonesia Industrial Suppliers | Palm Oil, Nickel & Coal",
    metaDescription: "AI-driven sourcing intelligence for importing palm oil, nickel and industrial commodities from Indonesia to India.",
    heroIntro:
      "Indonesia is a strategic supplier of palm oil, nickel, coal, and industrial raw materials to India. ProcureSaathi tracks ASEAN trade dynamics, commodity price signals, and Indonesian export policy shifts.",
    tradeIntelligence: [
      "World's largest palm oil and nickel ore producer.",
      "ASEAN-India FTA provides reduced tariffs on eligible commodities.",
      "Indonesia's nickel export ban (raw ore) impacts global EV supply chains.",
      "Tanjung Priok and Surabaya are primary export gateways."
    ],
    topExports: [
      { hsCode: "1511", product: "Palm Oil" },
      { hsCode: "2701", product: "Coal" },
      { hsCode: "7202", product: "Ferro-Alloys" }
    ],
    majorPorts: ["Tanjung Priok (Jakarta)", "Surabaya", "Balikpapan"],
    tradeAgreementStatus: "ASEAN-India FTA active. India-Indonesia bilateral talks ongoing for enhanced market access.",
    riskScore: "Moderate",
    relatedDemandSlugs: ["ms-plates-india", "structural-steel-india"]
  },
  {
    name: "Italy",
    slug: "italy",
    h1: "Italy Industrial Suppliers & Trade Intelligence",
    metaTitle: "Italy Industrial Suppliers | Machinery, Marble & Specialty Steel",
    metaDescription: "AI-driven sourcing intelligence for importing machinery, marble and specialty steel from Italy to India.",
    heroIntro:
      "Italy is renowned for precision machinery, marble, specialty steel, and industrial design. ProcureSaathi monitors EU trade compliance, REACH regulations, and Italian export corridor dynamics for Indian EPC and manufacturing procurement.",
    tradeIntelligence: [
      "Leading exporter of textile machinery, marble/granite, and food processing equipment.",
      "CE marking and REACH compliance mandatory for EU-origin industrial goods.",
      "Genoa and Trieste are key Mediterranean export gateways to India.",
      "Italy's Brescia region is a major specialty steel production cluster."
    ],
    topExports: [
      { hsCode: "8445", product: "Textile Machinery" },
      { hsCode: "6802", product: "Worked Monumental Stone (Marble)" },
      { hsCode: "7220", product: "Flat-Rolled Stainless Steel" }
    ],
    majorPorts: ["Genoa", "Trieste", "La Spezia"],
    tradeAgreementStatus: "India-EU FTA under negotiation. Currently under MFN tariff framework.",
    riskScore: "Low",
    relatedDemandSlugs: ["structural-steel-india", "ms-plates-india"]
  }
];

export function getStrategicCountry(slug: string): StrategicCountry | undefined {
  return strategicCountriesData.find(c => c.slug === slug.toLowerCase());
}
