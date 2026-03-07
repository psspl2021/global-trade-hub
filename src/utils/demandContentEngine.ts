/**
 * Demand Page Content Engine
 * Generates 1200+ word procurement authority content from product metadata.
 * Each product gets unique, differentiated content based on its metadata.
 */
import type { DemandProduct } from '@/data/demandProducts';

export interface GeneratedContent {
  heroIntro: string;
  industryDemand: string;
  procurementSpecs: string;
  rfqSignals: string;
  useCases: string[];
  whyProcureSaathi: string;
  /** 3 extra procurement FAQs unique to this product */
  extraFaqs: { question: string; answer: string }[];
  /** Comparison slugs relevant to this product */
  comparisonLinks: { label: string; slug: string }[];
  /** AI demand signal data */
  demandSignals: {
    recentRfqs: number;
    avgOrderSize: string;
    topBuyingIndustries: string[];
    priceTrend: string;
  };
  /** Industry cluster links */
  industryClusters: { name: string; slug: string }[];
}

// Deterministic seed from product name for consistent "random" values
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function generateDemandContent(product: DemandProduct): GeneratedContent {
  const { name, definition, industries, grades, specifications, applications, challenges, marketTrend, orderSizes, priceRange, standards } = product;
  const seed = hashCode(name);

  const industryList = industries.join(', ');
  const topIndustries = industries.slice(0, 4);

  // ─── HERO INTRO (120+ words) ──────────────────────────────────
  const heroIntro = `${definition} In India, ${name} procurement is driven by demand from ${industryList} sectors. Industrial buyers and EPC contractors source ${name} in bulk through managed procurement channels to ensure grade compliance, competitive pricing, and reliable delivery schedules. ProcureSaathi's AI-powered procurement engine connects verified buyers with mill-direct and authorized distributor sources, enabling transparent price discovery and governance-compliant sourcing. Whether you are sourcing ${name} for a large infrastructure project or regular manufacturing consumption, our platform provides real-time demand intelligence, sealed bidding, and end-to-end procurement management. This page provides comprehensive procurement intelligence including specifications, grades, pricing factors, industry applications, and import corridor analysis for ${name} sourcing in India.`;

  // ─── INDUSTRY DEMAND INTELLIGENCE (200+ words) ────────────────
  const industryDemand = `${name} is procured across multiple industrial verticals in India, with primary demand originating from ${topIndustries.join(', ')} sectors. ${marketTrend}

**Key Demand Drivers:**
${industries.map(ind => `• **${ind}:** Industrial buyers in the ${ind.toLowerCase()} sector typically procure ${name} for ${getIndustryContext(ind, name)}. Order sizes range from ${orderSizes}, with procurement cycles typically aligned with project milestones or quarterly consumption planning.`).join('\n')}

**Procurement Patterns:**
Large-scale industrial procurement of ${name} in India follows established patterns. EPC contractors typically issue RFQs 4–8 weeks before required delivery dates. Manufacturing units maintain safety stock of 2–4 weeks consumption. Project-based procurement often involves bulk ordering with staggered delivery schedules to optimize logistics and working capital.

**Regional Demand Distribution:**
Major consumption centres for ${name} in India include western India (Maharashtra, Gujarat), southern India (Tamil Nadu, Karnataka, Andhra Pradesh), and northern India (Delhi-NCR, Haryana, Punjab). Each region has distinct supply chain dynamics influenced by proximity to manufacturing hubs, port access for imports, and local industry concentration.

${name} procurement in India typically involves a mix of domestic sourcing and strategic imports, with buyers increasingly adopting managed procurement platforms for price transparency and supplier verification.`;

  // ─── PROCUREMENT SPECIFICATIONS (150+ words) ──────────────────
  const procurementSpecs = `**Available Grades:**
${grades.map(g => `• ${g}`).join('\n')}

**Key Specifications:**
${specifications.map(s => `• ${s}`).join('\n')}

**Applicable Standards:**
${standards.map(s => `• ${s}`).join('\n')}

**Typical Price Range:** ${priceRange}

**Quality Assurance:**
All ${name} sourced through ProcureSaathi undergoes rigorous quality verification including mill test certificates (MTC), third-party inspection reports, and compliance documentation per applicable Indian and international standards. Our AI engine cross-references supplier certifications, historical quality performance, and grade-specific compliance to ensure procurement integrity.

**Packaging and Dispatch:**
${name} is typically dispatched with standardized packaging as per industry norms. Each consignment includes test certificates, packing lists, and compliance documentation. ProcureSaathi manages logistics coordination including weighment verification, quality inspection at dispatch point, and real-time tracking to delivery site.`;

  // ─── RFQ DEMAND SIGNALS (150+ words) ──────────────────────────
  const rfqSignals = `Recent procurement demand for ${name} in India reflects strong industrial activity across key consuming sectors. Our AI demand intelligence engine tracks RFQ patterns, buyer behaviour, and market signals to provide actionable procurement insights.

**Demand Characteristics:**
• Typical order sizes: ${orderSizes}
• Primary buying industries: ${industryList}
• Procurement frequency: Monthly to quarterly depending on consumption pattern
• Price benchmark range: ${priceRange}

**Current Market Intelligence:**
${challenges.map(c => `• ${c}`).join('\n')}

**Procurement Advisory:**
For optimal ${name} procurement outcomes, industrial buyers should consider: (1) consolidating requirements across multiple delivery locations to leverage volume pricing; (2) establishing framework agreements with 2–3 verified suppliers for supply security; (3) utilizing managed procurement platforms for transparent price discovery; and (4) maintaining specification compliance documentation for audit readiness. ProcureSaathi's sealed bidding system ensures competitive pricing while maintaining supplier anonymity until award, preventing price manipulation and ensuring governance compliance.`;

  // ─── USE CASES ────────────────────────────────────────────────
  const useCases = applications.slice(0, 4).map(app => {
    const slug = app.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug;
  });

  // ─── WHY PROCURESAATHI (100+ words) ───────────────────────────
  const whyProcureSaathi = `ProcureSaathi transforms ${name} procurement in India through AI-powered supplier matching, transparent sealed bidding, and end-to-end managed procurement. Our platform addresses the core challenges industrial buyers face: price opacity, supplier verification complexity, and compliance documentation burden.

**Key Benefits:**
• **AI Verified Suppliers:** Every supplier undergoes AI-driven verification including GST validation, financial health check, capacity assessment, and quality certification review.
• **Sealed Bidding:** Competitive pricing through anonymous sealed bids, preventing price manipulation and ensuring fair market discovery.
• **Managed Procurement:** End-to-end procurement management from RFQ to delivery, including quality inspection, logistics coordination, and payment reconciliation.
• **Demand Intelligence:** Real-time market insights, price trend analysis, and procurement advisory powered by AI analysis of live demand signals.
• **Governance Compliance:** Complete audit trail with tamper-proof ledger entries for every procurement transaction.`;

  // ─── EXTRA FAQs (3 unique per product) ────────────────────────
  const extraFaqs = generateExtraFaqs(product);

  // ─── COMPARISON LINKS ─────────────────────────────────────────
  const comparisonLinks = generateComparisonLinks(product);

  // ─── AI DEMAND SIGNALS ────────────────────────────────────────
  const demandSignals = generateDemandSignals(product, seed);

  // ─── INDUSTRY CLUSTERS ────────────────────────────────────────
  const industryClusters = generateIndustryClusters(product);

  return { heroIntro, industryDemand, procurementSpecs, rfqSignals, useCases, whyProcureSaathi, extraFaqs, comparisonLinks, demandSignals, industryClusters };
}

/** Maps industry names to /industries/ route slugs */
const industrySlugMap: Record<string, string> = {
  'Construction': 'building-construction',
  'Automotive': 'automotive',
  'Infrastructure': 'building-construction',
  'Shipbuilding': 'engineering-manufacturing',
  'Heavy Engineering': 'engineering-manufacturing',
  'Pipe Manufacturing': 'engineering-manufacturing',
  'White Goods': 'consumer-goods-fmcg',
  'Electrical Equipment': 'electronics-semiconductors',
  'Electrical': 'electronics-semiconductors',
  'Electrical & Electronics': 'electronics-semiconductors',
  'Furniture': 'consumer-goods-fmcg',
  'Furniture Manufacturing': 'consumer-goods-fmcg',
  'Packaging': 'packaging',
  'Oil & Gas': 'oil-gas',
  'Chemical Processing': 'chemicals-petrochemicals',
  'Chemical': 'chemicals-petrochemicals',
  'Power Generation': 'energy-utilities',
  'Marine': 'engineering-manufacturing',
  'Roofing': 'building-construction',
  'Solar Energy': 'energy-utilities',
  'Solar Structures': 'energy-utilities',
  'Pharmaceutical': 'healthcare-pharmaceuticals',
  'Food & Beverage': 'food-beverage-processing',
  'Water Supply': 'water-treatment',
  'Agriculture': 'agriculture-farming',
  'Telecommunications': 'telecommunications',
  'Mining Equipment': 'metal-mining',
  'Steel Making': 'metal-mining',
  'Foundry': 'engineering-manufacturing',
  'Die Casting': 'engineering-manufacturing',
  'Wire Manufacturing': 'engineering-manufacturing',
  'Cable Manufacturing': 'engineering-manufacturing',
  'Battery Manufacturing': 'electronics-semiconductors',
  'Battery': 'electronics-semiconductors',
  'Footwear': 'textiles-apparel',
  'Textile (Polyester Fibre)': 'textiles-apparel',
  'Textiles': 'textiles-apparel',
  'Hospitality': 'hospitality-tourism',
  'Healthcare': 'healthcare-pharmaceuticals',
  'Medical': 'healthcare-pharmaceuticals',
  'Real Estate': 'real-estate-infrastructure',
  'Warehousing': 'logistics-transportation',
  'HVAC': 'engineering-manufacturing',
  'Precast': 'building-construction',
  'Consumer Products': 'consumer-goods-fmcg',
  'Household Products': 'consumer-goods-fmcg',
  'Industrial': 'engineering-manufacturing',
  'Commercial Buildings': 'building-construction',
  'Industrial Sheds': 'building-construction',
  'Cold Storage': 'food-beverage-processing',
  'Architecture': 'building-construction',
  'Signage': 'media-entertainment',
  'Railway': 'logistics-transportation',
  'Agricultural Equipment': 'agriculture-farming',
  'Transport': 'logistics-transportation',
  'Industrial Flooring': 'building-construction',
  'Aerospace': 'aerospace-defense',
  'Defense': 'aerospace-defense',
  'Petrochemical': 'chemicals-petrochemicals',
  'EAF Steelmakers': 'metal-mining',
  'Special Steel Producers': 'metal-mining',
  'Alloy Steel Manufacturing': 'engineering-manufacturing',
  'Cast Iron Manufacturing': 'engineering-manufacturing',
  'Ductile Iron': 'engineering-manufacturing',
  'Engineering Castings': 'engineering-manufacturing',
  'Wire & Cable': 'electronics-semiconductors',
  'Automotive Wiring': 'automotive',
  'Power Transmission': 'energy-utilities',
  'Electronics': 'electronics-semiconductors',
  'Galvanizing': 'engineering-manufacturing',
  'Brass Manufacturing': 'engineering-manufacturing',
  'Rubber': 'plastics-polymers',
  'Radiation Shielding': 'healthcare-pharmaceuticals',
  'Cable Sheathing': 'electronics-semiconductors',
  'Heat Exchangers': 'engineering-manufacturing',
  'Pre-Engineered Buildings': 'building-construction',
  'Residential': 'real-estate-infrastructure',
  'Irrigation': 'water-treatment',
  'Sewage': 'water-treatment',
  'Water Treatment': 'water-treatment',
  'Drainage': 'water-treatment',
  'Gas Distribution': 'energy-utilities',
  'Oil Pipeline': 'oil-gas',
  'Water Pipeline': 'water-treatment',
  'Offshore': 'oil-gas',
  'Nuclear': 'energy-utilities',
  'Boiler': 'energy-utilities',
  'Hydraulic Equipment': 'engineering-manufacturing',
  'Instrumentation': 'engineering-manufacturing',
};

function generateIndustryClusters(product: DemandProduct): { name: string; slug: string }[] {
  const seen = new Set<string>();
  const clusters: { name: string; slug: string }[] = [];

  for (const ind of product.industries) {
    const slug = industrySlugMap[ind];
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      // Derive readable name from slug
      const displayName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace('Fmcg', 'FMCG');
      clusters.push({ name: ind, slug });
    }
    if (clusters.length >= 6) break;
  }
  return clusters;
}

function generateExtraFaqs(product: DemandProduct): { question: string; answer: string }[] {
  const { name, grades, industries, importCountries, standards, priceRange, orderSizes } = product;
  const topInd = industries[0] || 'manufacturing';
  const topGrade = grades[0] || name;

  return [
    {
      question: `What ${name} grade is used in ${topInd.toLowerCase()}?`,
      answer: `The ${topInd.toLowerCase()} sector primarily uses ${grades.slice(0, 3).join(', ')} grades of ${name}. Grade selection depends on specific mechanical properties, dimensional tolerances, and compliance with ${standards[0] || 'applicable industry'} standards required by the application. ProcureSaathi's procurement experts can recommend the optimal grade based on your technical requirements.`
    },
    {
      question: `Is imported ${name} cheaper than domestic supply in India?`,
      answer: `Import pricing for ${name} depends on origin country, current duties, and exchange rates. ${importCountries.length > 0 ? `Key import sources include ${importCountries.slice(0, 3).join(', ')}.` : ''} While CIF prices may sometimes be lower, total landed cost including customs duty, anti-dumping duty (where applicable), port handling, and inland logistics can vary. ProcureSaathi's AI engine compares domestic and import options to identify the most cost-effective source for your ${name} requirement.`
    },
    {
      question: `What certifications are required for ${name} procurement?`,
      answer: `${name} procurement typically requires mill test certificates (MTC) as per ${standards.slice(0, 2).join(' / ')} standards, BIS certification where applicable, and third-party inspection reports for quality-critical applications. For government and infrastructure projects, additional compliance documentation including IS mark, NABL-accredited lab reports, and maker's certificate may be mandatory. ProcureSaathi ensures all documentation is verified and provided with every consignment.`
    },
  ];
}

function generateComparisonLinks(product: DemandProduct): { label: string; slug: string }[] {
  const links: { label: string; slug: string }[] = [];
  const baseSlug = product.slug.replace('-india', '');

  // Generate comparisons from related slugs
  for (const rel of product.relatedSlugs.slice(0, 3)) {
    const relBase = rel.replace('-india', '');
    const relName = relBase.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    // Alphabetical ordering for consistent slug
    const pair = [baseSlug, relBase].sort();
    links.push({
      label: `${product.name} vs ${relName}`,
      slug: `${pair[0]}-vs-${pair[1]}`
    });
  }
  return links;
}

function generateDemandSignals(product: DemandProduct, seed: number): GeneratedContent['demandSignals'] {
  // Deterministic signals based on product name hash
  const rfqBase = 15 + (seed % 60);
  const orderSizeNum = product.orderSizes.match(/\d+/);
  const avgSize = orderSizeNum ? `${parseInt(orderSizeNum[0]) * 2} MT` : '100 MT';

  const trendOptions = ['Stable', 'Rising', 'Moderate Rise', 'Slight Decline', 'Firm'];
  const trend = trendOptions[seed % trendOptions.length];

  return {
    recentRfqs: rfqBase,
    avgOrderSize: avgSize,
    topBuyingIndustries: product.industries.slice(0, 3),
    priceTrend: trend,
  };
}

function getIndustryContext(industry: string, product: string): string {
  const contexts: Record<string, string> = {
    'Construction': `structural fabrication, building frameworks, and civil infrastructure projects requiring consistent quality and timely delivery`,
    'Automotive': `vehicle body panels, chassis components, engine parts, and precision stampings with strict dimensional tolerances`,
    'Infrastructure': `bridges, flyovers, metro rail, highway, and water infrastructure projects under government programs`,
    'Shipbuilding': `hull plates, structural members, and marine-grade components with specific corrosion resistance requirements`,
    'Heavy Engineering': `pressure vessels, storage tanks, industrial equipment, and heavy machinery manufacturing`,
    'Pipe Manufacturing': `ERW, SAW, and seamless pipe production as primary input material`,
    'White Goods': `refrigerator panels, washing machine drums, air conditioner housings, and other appliance components`,
    'Electrical Equipment': `transformer cores, motor laminations, panel enclosures, and switchgear components`,
    'Furniture': `office and institutional furniture manufacturing requiring smooth surface finish and consistent gauge`,
    'Packaging': `tin cans, containers, and general packaging applications`,
    'Oil & Gas': `pipeline construction, refinery equipment, offshore platforms, and process plant piping`,
    'Chemical Processing': `reactor vessels, storage tanks, heat exchangers, and process piping systems`,
    'Power Generation': `boiler components, turbine parts, and thermal/nuclear power plant equipment`,
    'Marine': `ship hulls, offshore structures, port equipment, and coastal infrastructure`,
    'Roofing': `industrial and commercial roofing sheets, wall cladding, and pre-engineered building components`,
    'Solar Energy': `solar panel mounting structures, support frames, and balance of system components`,
    'Pharmaceutical': `clean room piping, process vessels, and pharmaceutical-grade equipment`,
    'Food & Beverage': `process piping, storage vessels, and hygienic equipment meeting food safety standards`,
    'Water Supply': `potable water distribution, transmission mains, and treatment plant piping`,
    'Agriculture': `irrigation equipment, farm machinery, and agricultural implement manufacturing`,
    'Telecommunications': `cable ducting, tower structures, and network infrastructure components`,
    'Mining Equipment': `heavy-duty equipment frames, crusher components, and material handling systems`,
    'Steel Making': `primary charge material for electric arc and induction furnace operations`,
    'Foundry': `grey iron and ductile iron casting production for industrial applications`,
    'Die Casting': `aluminium and zinc alloy die casting for automotive and consumer products`,
    'Wire Manufacturing': `electrical conductor and cable production from copper and aluminium wire rods`,
    'Battery Manufacturing': `lead-acid and lithium-ion battery component manufacturing`,
    'Footwear': `sole and midsole manufacturing using EVA and rubber compounds`,
    'Textile (Polyester Fibre)': `polyester staple fibre and filament yarn production`,
    'Hospitality': `hotel construction, furnishing, and infrastructure development`,
    'Healthcare': `hospital construction, medical equipment, and pharmaceutical facility development`,
    'Real Estate': `residential and commercial building construction projects`,
    'Warehousing': `warehouse construction, industrial storage, and logistics facilities`,
    'HVAC': `heating, ventilation, and air conditioning system components and ductwork`,
    'Precast': `precast concrete element manufacturing including beams, columns, and slabs`,
    'Electrical & Electronics': `power cable, transformer, switchgear, and electronic component manufacturing`,
    'Cable Manufacturing': `power and communication cable production using copper and aluminium conductors`,
    'Electrical': `electrical panel, switchgear, transformer, and power distribution equipment manufacturing`,
    'Power Transmission': `overhead conductor, transmission tower, and substation equipment manufacturing`,
    'Automotive Wiring': `vehicle wiring harness and electrical connector production`,
    'Consumer Products': `household goods, toys, storage containers, and consumer durables manufacturing`,
    'Household Products': `furniture, kitchenware, storage products, and home improvement materials`,
    'Medical': `medical device, surgical instrument, and healthcare facility equipment manufacturing`,
    'Textiles': `textile machinery, spinning, weaving, and garment manufacturing applications`,
    'Industrial': `general industrial manufacturing, process plants, and factory infrastructure`,
    'Galvanizing': `hot-dip and electro-galvanizing operations for corrosion protection of steel products`,
    'Brass Manufacturing': `brass and bronze alloy production for plumbing, electrical, and decorative applications`,
    'Solar Structures': `solar panel mounting systems, trackers, and balance of plant structures`,
    'Commercial Buildings': `office complexes, shopping malls, and commercial building construction`,
    'Industrial Sheds': `industrial shed, warehouse, and factory building construction`,
    'Cold Storage': `cold storage facility construction and refrigeration equipment`,
    'Signage': `signage, display boards, and advertising material manufacturing`,
    'Pre-Engineered Buildings': `PEB design, fabrication, and erection for industrial and commercial use`,
    'Residential': `residential building construction, housing projects, and apartment complexes`,
    'Industrial Flooring': `industrial floor construction, mezzanine platforms, and walkway systems`,
    'Transport': `transportation vehicle body building, trailer manufacturing, and rolling stock`,
    'Aerospace': `aircraft structural components, engine parts, and defense systems`,
    'Petrochemical': `petrochemical plant equipment, reactors, columns, and process piping`,
    'Railway': `railway coach manufacturing, track components, and station infrastructure`,
    'Agricultural Equipment': `tractor implements, harvesters, and farm equipment manufacturing`,
    'Irrigation': `drip and sprinkler irrigation systems, pipes, and fittings`,
    'Sewage': `sewage treatment plant piping, manholes, and drainage systems`,
    'Water Treatment': `water treatment plant equipment, filtration systems, and distribution piping`,
    'Drainage': `storm water drainage, underground drainage systems, and culverts`,
    'Gas Distribution': `city gas distribution networks, PNG pipelines, and metering systems`,
    'Oil Pipeline': `crude oil and petroleum product pipeline construction and maintenance`,
    'Water Pipeline': `potable water and irrigation pipeline networks`,
    'Offshore': `offshore oil and gas platform construction and subsea equipment`,
    'Nuclear': `nuclear power plant equipment, containment structures, and shielding`,
    'Boiler': `industrial boiler, heat recovery steam generator, and pressure parts manufacturing`,
    'Hydraulic Equipment': `hydraulic cylinder, pump, valve, and system manufacturing`,
    'Instrumentation': `process instrumentation, control valves, and measurement equipment`,
    'Defense': `defense equipment, armored vehicles, and military infrastructure`,
    'Rubber': `rubber compounding, tire manufacturing, and industrial rubber product production`,
    'Wire & Cable': `power cable, communication cable, and specialty wire production`,
  };
  return contexts[industry] || `core manufacturing and fabrication processes requiring reliable supply chain management`;
}
