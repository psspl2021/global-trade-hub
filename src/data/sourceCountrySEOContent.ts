/**
 * Unique SEO content for /source/{country} pages.
 * Each entry provides 250–300 words of trade-focused, procurement-relevant content.
 * No sales fluff. Focused on export/import relevance and trade categories.
 */

export interface SourceCountrySEOContent {
  heading: string;
  content: string;
  tradeCategories: string[];
}

const sourceContent: Record<string, SourceCountrySEOContent> = {
  usa: {
    heading: 'India–USA B2B Trade & Procurement Overview',
    content: `The United States is India's largest trading partner with bilateral merchandise trade exceeding $120 billion annually. Indian exports to the USA span pharmaceuticals (generic drugs under ANDA approvals), textiles and garments, gems and jewelry, IT services, organic chemicals, and agricultural commodities. Key compliance requirements include FDA registration for food and drug products, CPSC compliance for consumer goods, and USDA/APHIS clearance for agricultural shipments. Indian suppliers serving US buyers typically hold ISO 9001, FDA cGMP, or ASTM certifications. The India–US trade relationship benefits from established shipping corridors (JNPT to Los Angeles/New York, typically 22–28 days transit), dollar-denominated invoicing norms, and mature letter-of-credit banking channels through SBI, ICICI, and Axis Bank US branches. ProcureSaathi facilitates this corridor by connecting US importers with pre-verified Indian manufacturers who understand FDA documentation, HS code classification for US Customs, and Anti-Dumping Duty considerations on categories like steel and shrimp. Procurement teams can raise RFQs specifying FOB/CIF terms, request supplier capability assessments, and access trade compliance documentation through the managed fulfillment desk.`,
    tradeCategories: ['Pharmaceuticals & APIs', 'Textiles & Garments', 'Gems & Jewelry', 'Auto Components', 'Organic Chemicals', 'Agricultural Products']
  },
  uae: {
    heading: 'India–UAE B2B Trade & Procurement Overview',
    content: `The UAE is India's third-largest trading partner and the gateway to the wider GCC market, with bilateral trade exceeding $85 billion. India's exports to the UAE include petroleum products, gold and jewelry, food products (rice, spices, tea), textiles, machinery, and chemicals. The India–UAE CEPA (Comprehensive Economic Partnership Agreement), effective since May 2022, provides preferential tariff access on over 80% of Indian exports. Key compliance requirements include HALAL certification through Emirates Authority for Standardization (ESMA), FIRS product registration, and Municipality approval for food items. Indian suppliers serving UAE buyers benefit from short transit times (4–7 days via JNPT or Mundra to Jebel Ali), established rupee-dirham exchange mechanisms, and a large Indian business diaspora facilitating trade relationships. ProcureSaathi connects UAE importers with HALAL-certified, ISO-compliant Indian manufacturers, enabling competitive sourcing through structured RFQs with FOB Jebel Ali pricing, quality documentation, and re-export packaging for GCC distribution.`,
    tradeCategories: ['Food Products & Spices', 'Textiles', 'Machinery', 'Chemicals', 'Gems & Jewelry', 'Steel & Metals']
  },
  uk: {
    heading: 'India–UK B2B Trade & Procurement Overview',
    content: `UK–India bilateral trade exceeds $35 billion, with ongoing Free Trade Agreement negotiations expected to significantly boost trade flows. Indian exports to the UK include textiles and garments, pharmaceuticals, gems and jewelry, engineering goods, IT services, and leather products. Post-Brexit, UK importers now require UKCA (UK Conformity Assessment) marking in addition to or instead of CE marking for certain product categories. Indian pharmaceutical suppliers serving the UK market require MHRA (Medicines and Healthcare products Regulatory Agency) compliance. Indian textile exporters benefit from GSP (Generalised Scheme of Preferences) tariff concessions. Shipping corridors from Indian ports to Felixstowe and Southampton typically operate on 18–22 day transit times. ProcureSaathi facilitates India–UK trade by connecting British procurement teams with UKCA-aware, ISO-certified Indian manufacturers, supporting structured RFQs with transparent CIF UK pricing, quality certifications, and customs documentation aligned to UK Border Force requirements.`,
    tradeCategories: ['Textiles & Garments', 'Pharmaceuticals', 'Gems & Jewelry', 'Engineering Goods', 'Leather Products', 'IT Services']
  },
  germany: {
    heading: 'India–Germany B2B Trade & Procurement Overview',
    content: `Germany is India's largest trading partner in the European Union, with bilateral trade exceeding €28 billion. Indian exports to Germany include auto components, textiles, chemicals, pharmaceuticals, machinery, and IT services. German procurement standards demand CE marking, TÜV certification, REACH compliance for chemical substances, and DIN/EN standards adherence. Indian manufacturers serving the German market typically maintain ISO 9001/14001, IATF 16949 (automotive), and GMP certifications. The Indo-German trade relationship benefits from strong bilateral institutional frameworks including the Indo-German Chamber of Commerce (AHK) and established logistics corridors through Hamburg and Bremerhaven ports with 20–25 day transit times from India. ProcureSaathi connects German industrial buyers with CE-marked, TÜV-audited Indian manufacturers, enabling competitive procurement through structured RFQs with DDP/DAP pricing, technical documentation in English/German, and quality assurance aligned to German engineering standards.`,
    tradeCategories: ['Auto Components', 'Machinery', 'Chemicals', 'Textiles', 'Pharmaceuticals', 'Engineering Services']
  },
  australia: {
    heading: 'India–Australia B2B Trade & Procurement Overview',
    content: `India–Australia bilateral trade exceeds $25 billion, boosted by the India–Australia Economic Cooperation and Trade Agreement (ECTA) effective since December 2022. ECTA eliminates tariffs on over 85% of Australian imports from India, making Indian goods significantly more competitive. Key Indian exports to Australia include pharmaceuticals, textiles, gems and jewelry, petroleum products, machinery, and agricultural commodities. Australian compliance requirements include TGA (Therapeutic Goods Administration) for pharmaceuticals and medical devices, ACCC product safety standards, and quarantine clearances through the Department of Agriculture. Shipping routes from India to Sydney and Melbourne operate on 14–18 day transit times via direct and transshipment services. ProcureSaathi facilitates India–Australia trade by connecting Australian importers with ECTA-eligible, quality-certified Indian manufacturers, enabling preferential tariff utilization through properly documented Certificates of Origin and structured RFQ processes.`,
    tradeCategories: ['Pharmaceuticals', 'Textiles', 'Gems & Jewelry', 'Machinery', 'Spices & Food', 'Engineering Goods']
  },
  japan: {
    heading: 'India–Japan B2B Trade & Procurement Overview',
    content: `India–Japan bilateral trade exceeds $22 billion, underpinned by the India–Japan CEPA (Comprehensive Economic Partnership Agreement) providing preferential market access. Japanese procurement standards are among the world's most stringent, requiring JIS (Japanese Industrial Standards) compliance, PMDA certification for pharmaceuticals, and JAS organic certification for food products. Indian exports to Japan include petroleum products, pharmaceuticals, seafood, textiles, gems and jewelry, and organic chemicals. The trade corridor benefits from established shipping routes (15–20 days from JNPT to Yokohama/Kobe) and strong institutional support through JETRO and JICA initiatives promoting Indian manufacturing capabilities. ProcureSaathi connects Japanese procurement teams with JIS-aware, ISO-certified Indian manufacturers, facilitating structured RFQs with quality standards aligned to Japanese expectations, test reports conforming to PMDA or JAS requirements, and trade documentation meeting Japanese customs protocols.`,
    tradeCategories: ['Pharmaceuticals', 'Seafood', 'Textiles', 'Organic Chemicals', 'IT Services', 'Auto Components']
  },
  canada: {
    heading: 'India–Canada B2B Trade & Procurement Overview',
    content: `India–Canada bilateral trade exceeds $12 billion with negotiations ongoing for a Comprehensive Economic Partnership Agreement (CEPA) to further reduce trade barriers. Indian exports to Canada include pharmaceuticals, textiles, gems and jewelry, organic chemicals, machinery, and food products. Canadian compliance requirements include Health Canada authorization for pharmaceutical and food products, CSA (Canadian Standards Association) certification for electrical and industrial equipment, and CFIA (Canadian Food Inspection Agency) clearance for agricultural imports. Shipping corridors from Indian ports to Vancouver and Montreal operate on 25–30 day transit times. The Indian pharmaceutical industry is a significant supplier to Canada's generic drug market. ProcureSaathi facilitates India–Canada trade by connecting Canadian importers with Health Canada-aware, CSA-compatible Indian manufacturers, enabling competitive procurement through structured RFQs with CIF Canadian port pricing and regulatory documentation support.`,
    tradeCategories: ['Pharmaceuticals', 'Textiles', 'Gems & Jewelry', 'Machinery', 'IT Services', 'Food Products']
  },
  africa: {
    heading: 'India–Africa B2B Trade & Procurement Overview',
    content: `India–Africa bilateral trade exceeds $98 billion, making Africa a strategically critical export destination for Indian manufacturers across pharmaceuticals, machinery, agricultural equipment, textiles, vehicles, and consumer goods. India is Africa's fourth-largest trading partner, with established trade corridors to major ports including Lagos (Nigeria), Mombasa (Kenya), Durban (South Africa), Dar es Salaam (Tanzania), and Casablanca (Morocco). Key certifications include SONCAP for Nigeria, KEBS for Kenya, SABS for South Africa, and WHO-GMP for pharmaceutical exports under government tender programs. Indian pharmaceutical companies supply over 60% of Africa's generic medicine requirements. Transit times vary from 12–15 days (East Africa) to 18–25 days (West and Southern Africa). ProcureSaathi facilitates India–Africa trade by connecting African importers with WHO-GMP certified, export-experienced Indian manufacturers, supporting structured RFQs with CIF African port pricing, pre-shipment inspection coordination (SGS, Bureau Veritas), and documentation aligned to destination country import regulations.`,
    tradeCategories: ['Pharmaceuticals', 'Agricultural Machinery', 'Textiles', 'Vehicles', 'Rice & Grains', 'Consumer Electronics']
  },
  nepal: {
    heading: 'India–Nepal B2B Trade & Procurement Overview',
    content: `India is Nepal's largest trading partner, with bilateral trade exceeding $10 billion. The open border between India and Nepal enables seamless overland trade through established border points at Birgunj-Raxaul, Bhairahawa-Sunauli, and Biratnagar-Jogbani. Indian exports to Nepal include petroleum products, vehicles, machinery, pharmaceuticals, steel, rice, and consumer goods. The India–Nepal Treaty of Trade provides preferential market access and simplified customs procedures. Most trade is conducted in Indian rupees with established banking channels. Nepali importers benefit from short transit times (1–3 days for border states, 3–7 days for other regions) and absence of ocean freight costs. ProcureSaathi facilitates India–Nepal trade by connecting Nepali buyers with verified Indian manufacturers offering competitive pricing, BIS-certified products, and delivery coordination through border clearing agents.`,
    tradeCategories: ['Petroleum Products', 'Vehicles', 'Machinery', 'Pharmaceuticals', 'Steel', 'Consumer Goods']
  },
  malaysia: {
    heading: 'India–Malaysia B2B Trade & Procurement Overview',
    content: `India–Malaysia bilateral trade exceeds $20 billion, supported by the India–Malaysia CECA (Comprehensive Economic Cooperation Agreement) providing preferential tariff access. Malaysian procurement emphasizes HALAL certification through JAKIM, SIRIM quality marks, and MeSTI compliance for food products. Indian exports to Malaysia include petroleum products, machinery, pharmaceuticals, textiles, gems, and food products. The shipping corridor from Indian ports to Port Klang and Penang operates on 7–10 day transit times with frequent vessel availability. The large Indian diaspora in Malaysia facilitates business relationships and cultural alignment. ProcureSaathi connects Malaysian importers with HALAL-certified, CECA-eligible Indian manufacturers, enabling competitive procurement through structured RFQs with CECA Certificate of Origin documentation and quality certifications aligned to Malaysian standards.`,
    tradeCategories: ['Petroleum Products', 'Machinery', 'Pharmaceuticals', 'Textiles', 'Gems & Jewelry', 'Food Products']
  },
  russia: {
    heading: 'India–Russia B2B Trade & Procurement Overview',
    content: `India–Russia bilateral trade has expanded significantly, with growing use of the International North–South Transport Corridor (INSTC) via Iran as an alternative to traditional shipping routes. Indian exports to Russia include pharmaceuticals (a major growth segment), tea and coffee, textiles, machinery, marine products, and chemicals. Trade is increasingly conducted in Indian rupees and Russian rubles, bypassing traditional dollar-denominated channels. The INSTC route reduces transit times from 40+ days (via Suez) to approximately 25 days. Russian compliance requirements include EAC (Eurasian Conformity) marking and GOST certification for industrial products. ProcureSaathi facilitates India–Russia trade by connecting Russian importers with EAC-aware Indian manufacturers, supporting structured RFQs with rupee-ruble pricing, INSTC logistics coordination, and documentation aligned to Eurasian Economic Union import regulations.`,
    tradeCategories: ['Pharmaceuticals', 'Tea & Coffee', 'Textiles', 'Machinery', 'Marine Products', 'Chemicals']
  },
};

/**
 * Get SEO content for a source country page.
 * Returns undefined if no specific content exists for the country.
 */
export function getSourceCountrySEOContent(countryKey: string): SourceCountrySEOContent | undefined {
  return sourceContent[countryKey.toLowerCase()];
}

/**
 * Generate fallback SEO content for countries without specific entries.
 */
export function getFallbackSourceSEOContent(countryName: string): SourceCountrySEOContent {
  return {
    heading: `India–${countryName} B2B Trade & Procurement Overview`,
    content: `India maintains active trade relationships with ${countryName}, exporting a diverse range of products including pharmaceuticals, textiles, machinery, agricultural commodities, and chemicals. Indian manufacturers are recognized globally for competitive pricing, quality certifications (ISO, BIS, WHO-GMP), and the ability to meet international compliance requirements. ProcureSaathi facilitates India–${countryName} trade by connecting importers with pre-verified Indian suppliers, enabling structured RFQ processes with transparent pricing, quality documentation, and managed logistics coordination. Whether sourcing for industrial projects, commercial distribution, or institutional procurement, buyers from ${countryName} can access India's manufacturing capabilities through competitive bidding and AI-matched supplier discovery.`,
    tradeCategories: ['Pharmaceuticals', 'Textiles', 'Machinery', 'Chemicals', 'Food Products', 'Consumer Goods']
  };
}
