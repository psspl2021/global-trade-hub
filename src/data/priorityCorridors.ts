/**
 * Strategic Priority Corridors
 * 
 * These 10 corridors are the initial SEO rollout targets.
 * They receive:
 * - Priority 1.0 in sitemap
 * - Full prerender HTML for bots
 * - Authority content depth
 * 
 * Format: {country_iso}-{category_slug}
 */

export interface PriorityCorridor {
  slug: string;
  country: string;
  countryCode: string;
  category: string;
  categoryDisplay: string;
  marketOverview: string;
}

export const priorityCorridors: PriorityCorridor[] = [
  {
    slug: 'in-metals-ferrous-steel-iron',
    country: 'India',
    countryCode: 'IN',
    category: 'metals-ferrous-steel-iron',
    categoryDisplay: 'Metals – Ferrous (Steel & Iron)',
    marketOverview: `India is the world's second-largest steel producer, with crude steel output exceeding 140 million tonnes annually. The domestic steel market is driven by infrastructure megaprojects under the National Infrastructure Pipeline, including highways, metro rail, smart cities, and industrial corridors. Key demand drivers include real estate, automotive manufacturing, and heavy engineering. Steel pricing remains volatile due to global commodity cycles, iron ore availability, and energy costs. Indian steel mills—both integrated and secondary—compete on quality certifications (IS 2062, IS 1786) and delivery reliability. ProcureSaathi's AI-driven procurement engine aggregates live intent signals from EPC contractors, fabricators, and project developers to match them with verified mill-direct suppliers. The platform's sealed bidding ensures price transparency, while the immutable audit ledger guarantees governance compliance for large-ticket infrastructure procurement.`
  },
  {
    slug: 'sa-metals-ferrous-steel-iron',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    category: 'metals-ferrous-steel-iron',
    categoryDisplay: 'Metals – Ferrous (Steel & Iron)',
    marketOverview: `Saudi Arabia's Vision 2030 has catalyzed unprecedented demand for structural steel, rebar, and flat products across NEOM, The Red Sea Project, and Riyadh Metro expansion. The kingdom imports over 60% of its steel requirements, creating massive procurement corridors from India, Turkey, and China. Saudi buyers prioritize SASO-certified products, competitive CIF pricing, and reliable delivery schedules aligned with mega-project timelines. ProcureSaathi connects Indian steel exporters with Saudi EPC contractors and construction firms through AI-matched RFQs, export documentation support, and managed logistics corridors. The platform's demand intelligence tracks real-time import patterns and price benchmarks across GCC markets.`
  },
  {
    slug: 'ae-polymers-resins',
    country: 'UAE',
    countryCode: 'AE',
    category: 'polymers-resins',
    categoryDisplay: 'Polymers & Resins',
    marketOverview: `The UAE serves as the Middle East's polymer trading hub, with Jebel Ali Free Zone handling significant volumes of polyethylene, polypropylene, and specialty resins. Demand is driven by packaging, construction, and automotive industries across the GCC. UAE-based converters and traders source from SABIC, Borouge, and Indian petrochemical producers. ProcureSaathi facilitates cross-border polymer procurement by matching buyer specifications with verified resin suppliers, providing real-time pricing intelligence, and managing export logistics from Indian ports. The platform tracks grade-specific demand signals—from HDPE blow molding to engineering-grade nylon—to enable precise supplier matching.`
  },
  {
    slug: 'de-chemicals-raw-materials',
    country: 'Germany',
    countryCode: 'DE',
    category: 'chemicals-raw-materials',
    categoryDisplay: 'Chemicals & Raw Materials',
    marketOverview: `Germany's chemical industry—the largest in Europe and third-largest globally—generates over €200 billion in annual revenue. German manufacturers require a diverse range of industrial chemicals, specialty chemicals, and raw materials for automotive, pharmaceutical, and electronics production. Supply chain disruptions and rising energy costs have pushed German buyers to diversify sourcing beyond traditional European suppliers. ProcureSaathi enables German chemical buyers to access India's vast chemical manufacturing base—from bulk solvents and intermediates to specialty surfactants and water treatment chemicals—through AI-verified supplier matching, REACH-compliant documentation support, and managed procurement workflows.`
  },
  {
    slug: 'us-machinery-equipment',
    country: 'United States',
    countryCode: 'US',
    category: 'machinery-equipment',
    categoryDisplay: 'Machinery & Equipment',
    marketOverview: `The US industrial machinery market exceeds $400 billion, with strong demand for CNC machines, material handling equipment, pumps, valves, and process equipment. American manufacturers and project developers increasingly source from India and Southeast Asia to optimize cost-performance ratios. ProcureSaathi's AI procurement engine connects US buyers with verified Indian machinery manufacturers, providing technical specification matching, quality certification verification (ISO, ASME, API), and end-to-end managed logistics including customs clearance. The platform's demand intelligence tracks machinery procurement patterns across oil & gas, food processing, and infrastructure sectors.`
  },
  {
    slug: 'gb-textiles-fabrics',
    country: 'United Kingdom',
    countryCode: 'GB',
    category: 'textiles-fabrics',
    categoryDisplay: 'Textiles & Fabrics',
    marketOverview: `The UK textile and garment industry imports over £10 billion annually, with India being a top-five sourcing origin for cotton fabrics, technical textiles, and home furnishings. Post-Brexit trade realignment and sustainability mandates are reshaping UK textile procurement. British retailers and brands increasingly seek certified, traceable textile supply chains. ProcureSaathi bridges UK textile buyers with verified Indian mills and exporters, providing fabric quality matching, sustainability certification verification (OEKO-TEX, GOTS), and managed export logistics from Indian textile hubs like Surat, Tirupur, and Panipat.`
  },
  {
    slug: 'qa-pipes-tubes',
    country: 'Qatar',
    countryCode: 'QA',
    category: 'pipes-tubes',
    categoryDisplay: 'Pipes & Tubes',
    marketOverview: `Qatar's infrastructure expansion—driven by FIFA World Cup legacy projects, LNG expansion, and smart city development—has created sustained demand for industrial pipes and tubes. The market requires API-grade line pipes, ERW structural tubes, stainless steel pipes, and HDPE systems for water infrastructure. Indian pipe manufacturers, particularly from the Mandideep-Dewas corridor and Mumbai-Pune belt, are major exporters to Qatar. ProcureSaathi facilitates specification-grade pipe procurement with technical matching against QP (QatarEnergy) and Ashghal standards, AI-verified supplier scoring, and managed FOB/CIF logistics.`
  },
  {
    slug: 'ng-food-beverages',
    country: 'Nigeria',
    countryCode: 'NG',
    category: 'food-beverages',
    categoryDisplay: 'Food & Beverages',
    marketOverview: `Nigeria—Africa's largest economy with 220+ million population—imports significant volumes of food commodities including rice, wheat flour, sugar, edible oils, and processed foods. The country's food import bill exceeds $10 billion annually, with India being a key supplier of rice, spices, and food ingredients. Nigerian food importers face challenges in supplier verification, quality consistency, and logistics reliability. ProcureSaathi's managed procurement corridor connects Nigerian food buyers with verified Indian exporters, providing FSSAI/NAFDAC documentation support, AI-driven price benchmarking, and containerized logistics management from Indian ports to Lagos and Apapa.`
  },
  {
    slug: 'sg-electronic-components',
    country: 'Singapore',
    countryCode: 'SG',
    category: 'electronic-components',
    categoryDisplay: 'Electronic Components',
    marketOverview: `Singapore serves as Southeast Asia's electronics hub, with the semiconductor and electronics industry contributing over 7% of GDP. The city-state's electronics manufacturers require steady supply of passive components, connectors, PCBs, and semiconductor packages. Supply chain resilience has become critical post-pandemic, driving diversification from sole-source dependencies. ProcureSaathi enables Singapore electronics buyers to access verified component suppliers across India's growing electronics manufacturing ecosystem, providing BOM-level matching, quality certification verification, and just-in-time delivery management for high-mix low-volume procurement patterns.`
  },
  {
    slug: 'ke-pharmaceuticals-drugs',
    country: 'Kenya',
    countryCode: 'KE',
    category: 'pharmaceuticals-drugs',
    categoryDisplay: 'Pharmaceuticals & Drugs',
    marketOverview: `Kenya is East Africa's pharmaceutical gateway, with a healthcare market growing at 10%+ annually. The country imports over 70% of its pharmaceutical needs, with India supplying the majority of generic medicines, APIs, and formulations. Kenyan pharmaceutical distributors, hospitals, and government procurement agencies require WHO-prequalified products with proper PPB (Pharmacy and Poisons Board) documentation. ProcureSaathi connects Kenyan pharmaceutical buyers with verified Indian pharma exporters, providing drug master file matching, WHO-GMP certification verification, and temperature-controlled logistics management for sensitive pharmaceutical shipments via Mombasa and Nairobi.`
  }
];

export const priorityCorridorSlugs = priorityCorridors.map(c => c.slug);

export function isPriorityCorridor(slug: string): boolean {
  return priorityCorridorSlugs.includes(slug);
}

export function getPriorityCorridorBySlug(slug: string): PriorityCorridor | undefined {
  return priorityCorridors.find(c => c.slug === slug);
}
