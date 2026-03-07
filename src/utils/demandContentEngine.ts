/**
 * Demand Page Content Engine
 * Generates 1200+ word procurement authority content from product metadata.
 */
import type { DemandProduct } from '@/data/demandProducts';

export interface GeneratedContent {
  heroIntro: string;
  industryDemand: string;
  procurementSpecs: string;
  rfqSignals: string;
  useCases: string[];
  whyProcureSaathi: string;
}

export function generateDemandContent(product: DemandProduct): GeneratedContent {
  const { name, definition, industries, grades, specifications, applications, challenges, marketTrend, orderSizes, priceRange, standards } = product;
  
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

  return { heroIntro, industryDemand, procurementSpecs, rfqSignals, useCases, whyProcureSaathi };
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
  };
  return contexts[industry] || `core manufacturing and fabrication processes requiring reliable supply chain management`;
}
