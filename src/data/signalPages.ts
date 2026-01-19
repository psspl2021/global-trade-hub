// Signal Page Configuration - Demand Intelligence Entry Points
// Each page = Demand Capture → AI Structuring → Managed Fulfilment
// NOT a marketplace. NOT a lead form.

export interface SignalPageConfig {
  slug: string;
  // Canonical redirect - if set, this slug is an alias that redirects to the canonical
  canonicalSlug?: string;
  
  // Page Copy
  h1: string;
  subheading: string;
  bodyText: string;
  useCases: string[];
  whatBuyerGets: string[];
  specifications?: string[];
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  intentKeywords: string[];
  
  // AI Signal Mapping (feeds Demand Intelligence)
  signalMapping: {
    category: string;
    subcategory: string;
    industry: string;
    buyer_type: string;
    estimated_value_band: 'low' | 'medium' | 'medium_high' | 'high' | 'very_high';
    urgency?: string;
    signal_source: 'signal_page';
  };
  
  // Stats (for trust)
  verifiedSuppliersCount: number;
  successfulDealsCount: number;
  typicalDealRange: { min: number; max: number };
  deliveryTimeline: string;
}

export const signalPagesConfig: SignalPageConfig[] = [
  // PAGE 1: Structural Steel Infrastructure
  {
    slug: 'structural-steel-infrastructure',
    h1: 'Structural Steel Procurement for Infrastructure Projects',
    subheading: 'Managed sourcing, pricing, and fulfilment — handled entirely by ProcureSaathi.',
    bodyText: `ProcureSaathi acts as a single procurement counterparty for infrastructure-grade structural steel requirements.

We manage sourcing, supplier allocation, logistics, quality control, and delivery timelines internally.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'Bridges, metro, highways',
      'EPC & government projects',
      'Time-bound bulk procurement'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'Assured delivery timelines',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['I-Beam (ISMB, ISJB)', 'H-Beam (ISHB, UC, UB)', 'Channels (ISMC)', 'Angles (ISA)', 'Plates (IS 2062)', 'WPB & NPB Sections'],
    metaTitle: 'Structural Steel Procurement India | Infrastructure & EPC Projects',
    metaDescription: 'Managed structural steel procurement for infrastructure & EPC projects. Single contract. Verified fulfilment.',
    intentKeywords: ['structural steel procurement India', 'infrastructure steel supply', 'EPC steel sourcing', 'bridge steel procurement', 'metro project steel'],
    signalMapping: {
      category: 'steel',
      subcategory: 'structural_steel',
      industry: 'infrastructure',
      buyer_type: 'epc',
      estimated_value_band: 'high',
      urgency: 'project_based',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 85,
    successfulDealsCount: 127,
    typicalDealRange: { min: 5000000, max: 500000000 },
    deliveryTimeline: '15-45 days'
  },

  // PAGE 2: TMT Bars EPC
  {
    slug: 'tmt-bars-epc-projects',
    h1: 'TMT Bars Procurement for EPC & Government Projects',
    subheading: 'Bulk TMT bar procurement with assured quality and project-wise allocation.',
    bodyText: `ProcureSaathi manages bulk TMT bar procurement for large-scale infrastructure and government works.

All sourcing, pricing, and logistics are coordinated internally to ensure continuity and compliance.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'Government infrastructure projects',
      'Road & bridge construction',
      'Housing & real estate development',
      'Industrial construction'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'Project-wise allocation',
      'BIS certified grades only',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['Fe500', 'Fe500D', 'Fe550', 'Fe550D', '8mm to 40mm diameter'],
    metaTitle: 'TMT Bars Bulk Procurement | EPC & Government Projects India',
    metaDescription: 'Managed bulk TMT bar procurement for EPC & government projects. Fe500/Fe550 grades. Single contract fulfilment.',
    intentKeywords: ['bulk TMT procurement', 'EPC TMT supply', 'government project steel', 'TMT bars for infrastructure', 'Fe500D bulk order'],
    signalMapping: {
      category: 'steel',
      subcategory: 'tmt_bars',
      industry: 'government_infra',
      buyer_type: 'government_epc',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 120,
    successfulDealsCount: 312,
    typicalDealRange: { min: 2000000, max: 200000000 },
    deliveryTimeline: '7-21 days'
  },

  // PAGE 3: Hot Rolled Coil
  {
    slug: 'hot-rolled-coil-industrial',
    h1: 'Hot Rolled Coil Procurement for Industrial Manufacturing',
    subheading: 'Aggregated supply, managed pricing risk, and assured delivery timelines.',
    bodyText: `ProcureSaathi provides managed procurement of Hot Rolled Coils for OEMs, fabricators, and industrial buyers.

We aggregate supply, manage pricing risk, and ensure delivery timelines.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'OEM manufacturing',
      'Fabrication units',
      'Auto component manufacturing',
      'PEB structures'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'Domestic & import sourcing',
      'Mill test certificates',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['IS 2062 E250/E350', 'ASTM A36', 'SAE 1008/1010', '1.6mm - 25mm thickness', '900mm - 2000mm width'],
    metaTitle: 'Hot Rolled Coil Procurement | Industrial Manufacturing India',
    metaDescription: 'Managed HRC procurement for OEMs & fabricators. IS 2062/ASTM grades. Domestic & import sourcing.',
    intentKeywords: ['hot rolled coil procurement', 'HRC bulk supply India', 'industrial steel coil', 'manufacturing steel supply'],
    signalMapping: {
      category: 'steel',
      subcategory: 'hot_rolled_coil',
      industry: 'manufacturing',
      buyer_type: 'industrial',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 65,
    successfulDealsCount: 189,
    typicalDealRange: { min: 3000000, max: 100000000 },
    deliveryTimeline: '10-30 days'
  },

  // PAGE 4: PEB Steel Structures
  {
    slug: 'peb-steel-structures',
    h1: 'PEB Steel Procurement for Warehouses & Industrial Buildings',
    subheading: 'Complete design-to-delivery solution for pre-engineered buildings.',
    bodyText: `ProcureSaathi manages end-to-end PEB steel procurement for warehouses, factories, and industrial facilities.

We coordinate design, fabrication, logistics, and erection support through our verified partner network.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'Warehouse development',
      'Factory buildings',
      'Logistics parks',
      'Cold storage facilities'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'Turnkey project capability',
      'Erection support available',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['Primary Frames', 'Secondary Members', 'Purlins & Girts', 'Roof Sheeting', 'Wall Cladding'],
    metaTitle: 'PEB Steel Procurement | Warehouses & Industrial Buildings India',
    metaDescription: 'Managed PEB steel procurement for warehouses & factories. Turnkey solution. Verified fabricators.',
    intentKeywords: ['PEB steel procurement', 'warehouse steel structure', 'pre-engineered building India', 'industrial shed construction'],
    signalMapping: {
      category: 'steel',
      subcategory: 'peb_structures',
      industry: 'warehousing',
      buyer_type: 'developer',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 45,
    successfulDealsCount: 78,
    typicalDealRange: { min: 10000000, max: 300000000 },
    deliveryTimeline: '30-60 days'
  },

  // PAGE 5: Colour Coated Steel
  {
    slug: 'colour-coated-steel',
    h1: 'Colour Coated Steel Procurement for Roofing & Cladding',
    subheading: 'PPGL, PPGI, and roofing sheets with export quality available.',
    bodyText: `ProcureSaathi manages colour coated steel procurement for roofing, cladding, and construction applications.

We source from verified manufacturers with complete quality documentation.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'Industrial sheds',
      'Commercial buildings',
      'Export projects',
      'Residential roofing'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'RAL colour matching',
      'Profile cutting to length',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['PPGL (Pre-painted Galvalume)', 'PPGI (Pre-painted Galvanized)', '0.35mm - 0.80mm', 'AZ50-AZ150 coating'],
    metaTitle: 'Colour Coated Steel Procurement | PPGL PPGI Roofing India',
    metaDescription: 'Managed colour coated steel procurement. PPGL/PPGI roofing sheets. Export quality. Single contract.',
    intentKeywords: ['colour coated steel procurement', 'PPGL PPGI bulk', 'roofing sheets India', 'industrial roofing supply'],
    signalMapping: {
      category: 'steel',
      subcategory: 'colour_coated',
      industry: 'construction',
      buyer_type: 'contractor',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 55,
    successfulDealsCount: 145,
    typicalDealRange: { min: 1000000, max: 50000000 },
    deliveryTimeline: '10-25 days'
  },

  // PAGE 6: Aluminium Industrial Export
  {
    slug: 'aluminium-industrial-export',
    h1: 'Aluminium Procurement for Industrial & Export Applications',
    subheading: 'AMS/ASTM grades with complete export documentation support.',
    bodyText: `ProcureSaathi manages aluminium procurement for automotive, aerospace, and export requirements.

We handle grade matching, documentation, and logistics for both domestic and international delivery.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'Automotive manufacturing',
      'Aerospace components',
      'Export orders',
      'Electronics OEMs'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'International grade matching',
      'Export documentation',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['6061-T6', '6063-T5', '7075-T6', '5052-H32', 'Sheets, plates, extrusions'],
    metaTitle: 'Aluminium Procurement India | Industrial & Export Grades',
    metaDescription: 'Managed aluminium procurement for industrial & export. 6061/7075 grades. AMS/ASTM certified.',
    intentKeywords: ['aluminium procurement India', 'industrial aluminium supply', 'aluminium export', '6061 7075 bulk'],
    signalMapping: {
      category: 'non_ferrous',
      subcategory: 'aluminium',
      industry: 'export_industrial',
      buyer_type: 'oem',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 92,
    typicalDealRange: { min: 2000000, max: 150000000 },
    deliveryTimeline: '15-40 days'
  },

  // PAGE 7: Copper & Non-Ferrous
  {
    slug: 'non-ferrous-metals',
    h1: 'Copper & Non-Ferrous Metals Procurement',
    subheading: 'LME-linked pricing with consistent quality supply.',
    bodyText: `ProcureSaathi manages copper and non-ferrous metal procurement for electrical, power, and manufacturing industries.

We aggregate demand, manage pricing volatility, and ensure quality consistency.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'Electrical equipment manufacturing',
      'Power equipment OEMs',
      'Cable & wire manufacturers',
      'Transformer production'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'LME-linked pricing options',
      'Custom sizes and forms',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['Copper Cathode (Grade A)', 'ETP Copper Rods', 'Copper Strips', 'Brass Sheets', 'Phosphor Bronze'],
    metaTitle: 'Copper & Non-Ferrous Metals Procurement India',
    metaDescription: 'Managed copper & non-ferrous metals procurement. LME Grade A. Electrical & power industries.',
    intentKeywords: ['copper procurement India', 'non-ferrous metals bulk', 'copper cathode supply', 'electrical copper'],
    signalMapping: {
      category: 'non_ferrous',
      subcategory: 'copper',
      industry: 'electrical_power',
      buyer_type: 'manufacturer',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 67,
    typicalDealRange: { min: 5000000, max: 200000000 },
    deliveryTimeline: '10-30 days'
  },

  // PAGE 8: Cement Bulk Infra
  {
    slug: 'cement-bulk-infra',
    h1: 'Cement Procurement for Infrastructure & Bulk Buyers',
    subheading: 'Project-based pricing with pan-India logistics network.',
    bodyText: `ProcureSaathi manages bulk cement procurement for infrastructure projects and RMC plants.

We coordinate multi-brand supply, logistics, and project-wise delivery scheduling.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'Infrastructure projects',
      'RMC plants',
      'Real estate development',
      'Government contracts'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'Multi-brand availability',
      'Pan-India delivery',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['OPC 43 Grade', 'OPC 53 Grade', 'PPC', 'PSC', 'All major brands'],
    metaTitle: 'Bulk Cement Procurement India | Infrastructure & RMC',
    metaDescription: 'Managed bulk cement procurement for infrastructure & RMC. All major brands. Project-based pricing.',
    intentKeywords: ['bulk cement procurement', 'cement supply infrastructure', 'RMC cement order', 'project cement India'],
    signalMapping: {
      category: 'cement',
      subcategory: 'bulk_cement',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 75,
    successfulDealsCount: 234,
    typicalDealRange: { min: 1000000, max: 100000000 },
    deliveryTimeline: '3-15 days'
  },

  // PAGE 9: Industrial Pipes & Tubes
  {
    slug: 'industrial-pipes-tubes',
    h1: 'Industrial Pipes & Tubes Procurement',
    subheading: 'ASTM/API specifications with project timeline delivery.',
    bodyText: `ProcureSaathi manages industrial pipe procurement for oil & gas, water, and process industries.

We handle specification matching, third-party inspection, and project-aligned delivery.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'Oil & gas projects',
      'Water infrastructure',
      'Process industries',
      'Petrochemical plants'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'Third-party inspection support',
      'IBR approved options',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['MS ERW Pipes', 'GI Pipes', 'Seamless Pipes', 'API 5L Grade B/X42/X52', 'SS Pipes (ASTM A312)'],
    metaTitle: 'Industrial Pipes & Tubes Procurement India | Oil Gas Water',
    metaDescription: 'Managed industrial pipes procurement. MS/GI/Seamless. ASTM/API specs. Oil & gas, water projects.',
    intentKeywords: ['industrial pipes procurement', 'oil gas pipes India', 'seamless pipe supply', 'API 5L bulk order'],
    signalMapping: {
      category: 'pipes',
      subcategory: 'industrial_pipes',
      industry: 'oil_gas_water',
      buyer_type: 'project_contractor',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 60,
    successfulDealsCount: 156,
    typicalDealRange: { min: 2000000, max: 150000000 },
    deliveryTimeline: '15-45 days'
  },

  // PAGE 10: Export Procurement Desk
  {
    slug: 'export-industrial-materials',
    h1: 'Export Procurement Desk – India to Global',
    subheading: 'Complete export support with CIF/FOB terms and LC handling.',
    bodyText: `ProcureSaathi operates as your India procurement desk for international buyers.

We manage sourcing, export documentation, quality inspection, and port clearance for steel, metals, and industrial materials.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: [
      'GCC construction projects',
      'African infrastructure',
      'International traders',
      'EPCs outside India'
    ],
    whatBuyerGets: [
      'Single consolidated price',
      'CIF/FOB terms',
      'LC/BG handling',
      'Contract with ProcureSaathi Pvt Ltd'
    ],
    specifications: ['TMT Bars', 'HRC/CRC Coils', 'Structural Steel', 'Pipes & Tubes', 'Aluminium Products'],
    metaTitle: 'India Export Procurement | Steel & Industrial Materials to GCC Africa',
    metaDescription: 'India export procurement desk. Steel, metals, industrial materials. CIF/FOB. GCC & Africa delivery.',
    intentKeywords: ['India export steel', 'GCC procurement from India', 'CIF FOB steel', 'Africa steel import India', 'export procurement desk'],
    signalMapping: {
      category: 'export',
      subcategory: 'industrial_materials',
      industry: 'international_trade',
      buyer_type: 'international_buyer',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 50,
    successfulDealsCount: 89,
    typicalDealRange: { min: 10000000, max: 500000000 },
    deliveryTimeline: '30-60 days'
  },

  // ALIAS PAGES - SEO keyword capture with canonical redirects
  // These redirect to canonical pages but capture high-volume search terms
  
  // Alias: steel-tmt-bar → tmt-bars-epc-projects
  {
    slug: 'steel-tmt-bar',
    canonicalSlug: 'tmt-bars-epc-projects',
    h1: 'TMT Bars Procurement for EPC & Government Projects',
    subheading: 'Bulk TMT bar procurement with assured quality and project-wise allocation.',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Steel TMT Bar Procurement India',
    metaDescription: 'Managed steel TMT bar procurement. Bulk orders. EPC projects.',
    intentKeywords: ['steel tmt bar', 'tmt bar procurement', 'steel tmt bar bulk'],
    signalMapping: {
      category: 'steel',
      subcategory: 'tmt_bars',
      industry: 'government_infra',
      buyer_type: 'government_epc',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 120,
    successfulDealsCount: 312,
    typicalDealRange: { min: 2000000, max: 200000000 },
    deliveryTimeline: '7-21 days'
  },

  // ============================
  // NEW CANONICAL PAGES (11-15)
  // ============================

  // 11) Cold Rolled Coil — Manufacturing
  {
    slug: 'cold-rolled-coil-manufacturing',
    h1: 'Cold Rolled Coil Procurement for Manufacturing Units',
    subheading: 'Precision-grade CRC sourcing with managed pricing and assured delivery.',
    bodyText: `ProcureSaathi manages cold rolled coil procurement for OEMs, appliance manufacturers, and precision fabricators.

We aggregate CRC supply, manage mill allocations, and ensure thickness and surface finish compliance.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Appliance manufacturing', 'Auto components', 'Precision fabrication'],
    whatBuyerGets: ['Single consolidated price', 'Guaranteed thickness tolerance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['IS 513', 'EN 10130', '0.4mm–3mm thickness'],
    metaTitle: 'Cold Rolled Coil Procurement India | CRC Bulk Supply',
    metaDescription: 'Managed CRC procurement for OEMs & manufacturers. IS 513 / EN grades. Single contract fulfilment.',
    intentKeywords: ['cold rolled coil procurement', 'CRC bulk supply', 'IS 513 CRC India'],
    signalMapping: {
      category: 'steel',
      subcategory: 'cold_rolled_coil',
      industry: 'manufacturing',
      buyer_type: 'oem',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 45,
    successfulDealsCount: 134,
    typicalDealRange: { min: 3000000, max: 120000000 },
    deliveryTimeline: '10–30 days'
  },

  // 12) Galvanized Steel Coils
  {
    slug: 'galvanized-steel-coils',
    h1: 'Galvanized Steel Coil Procurement for Construction & Industry',
    subheading: 'GI coils with coating compliance and project-wise delivery.',
    bodyText: `ProcureSaathi manages galvanized steel coil procurement for construction, fabrication, and industrial buyers.

We handle coating specifications, mill sourcing, and delivery scheduling.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Roofing sheets', 'Fabrication units', 'Infrastructure projects'],
    whatBuyerGets: ['Single consolidated price', 'Coating compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['IS 277', 'ASTM A653', 'Z120–Z275 coating'],
    metaTitle: 'Galvanized Steel Coil Procurement India | GI Coil Supply',
    metaDescription: 'Managed GI coil procurement. IS 277 / ASTM grades. Roofing & fabrication supply.',
    intentKeywords: ['galvanized steel coil procurement', 'GI coil bulk', 'roofing steel coils'],
    signalMapping: {
      category: 'steel',
      subcategory: 'galvanized_coils',
      industry: 'construction',
      buyer_type: 'fabricator',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 60,
    successfulDealsCount: 178,
    typicalDealRange: { min: 2000000, max: 150000000 },
    deliveryTimeline: '10–25 days'
  },

  // 13) Steel Plates — Heavy Engineering
  {
    slug: 'steel-plates-heavy',
    h1: 'Steel Plate Procurement for Heavy Engineering Projects',
    subheading: 'Thick plates with controlled chemistry and inspection support.',
    bodyText: `ProcureSaathi manages heavy steel plate procurement for pressure vessels, bridges, and heavy fabrication.

We handle grade matching, UT inspection, and logistics.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Pressure vessels', 'Bridges', 'Heavy structures'],
    whatBuyerGets: ['Single consolidated price', 'UT inspection support', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['IS 2062', 'ASTM A516', 'EN 10025'],
    metaTitle: 'Steel Plate Procurement India | Heavy Engineering',
    metaDescription: 'Managed steel plate procurement for heavy engineering. UT inspected plates.',
    intentKeywords: ['steel plate procurement', 'heavy plate supply', 'pressure vessel steel'],
    signalMapping: {
      category: 'steel',
      subcategory: 'plates',
      industry: 'heavy_engineering',
      buyer_type: 'fabricator',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 96,
    typicalDealRange: { min: 5000000, max: 250000000 },
    deliveryTimeline: '15–45 days'
  },

  // 14) Steel Wire Rods
  {
    slug: 'steel-wire-rods',
    h1: 'Steel Wire Rod Procurement for Manufacturing',
    subheading: 'Consistent chemistry wire rods for fasteners and wires.',
    bodyText: `ProcureSaathi manages steel wire rod procurement for fastener manufacturers and wire drawing units.

We ensure chemistry control and mill compliance.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Fasteners', 'Wire drawing', 'Spring manufacturing'],
    whatBuyerGets: ['Single consolidated price', 'Chemistry compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['SAE 1006–1080', 'IS 7887'],
    metaTitle: 'Steel Wire Rod Procurement India | Fastener Industry',
    metaDescription: 'Managed wire rod procurement. SAE grades. Fastener manufacturing supply.',
    intentKeywords: ['wire rod procurement', 'steel wire rod bulk', 'fastener steel rods'],
    signalMapping: {
      category: 'steel',
      subcategory: 'wire_rods',
      industry: 'manufacturing',
      buyer_type: 'manufacturer',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 112,
    typicalDealRange: { min: 1500000, max: 80000000 },
    deliveryTimeline: '7–21 days'
  },

  // 15) Chequered Plates
  {
    slug: 'chequered-plates',
    h1: 'Chequered Plate Procurement for Industrial Flooring',
    subheading: 'Anti-slip plates for platforms and walkways.',
    bodyText: `ProcureSaathi manages chequered plate procurement for industrial and infrastructure projects.

We handle plate sizing, thickness compliance, and logistics.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Industrial platforms', 'Staircases', 'Walkways'],
    whatBuyerGets: ['Single consolidated price', 'Thickness compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['IS 3502', 'ASTM A36'],
    metaTitle: 'Chequered Plate Procurement India',
    metaDescription: 'Managed chequered plate procurement for industrial flooring.',
    intentKeywords: ['chequered plate procurement', 'anti slip steel plates'],
    signalMapping: {
      category: 'steel',
      subcategory: 'chequered_plates',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 30,
    successfulDealsCount: 88,
    typicalDealRange: { min: 1000000, max: 40000000 },
    deliveryTimeline: '7–20 days'
  }
];

export function getSignalPageBySlug(slug: string): SignalPageConfig | undefined {
  const page = signalPagesConfig.find(p => p.slug === slug);
  if (!page) return undefined;

  // Handle canonical redirects with loop protection
  if (page.canonicalSlug) {
    const canonical = signalPagesConfig.find(p => p.slug === page.canonicalSlug);

    if (!canonical) {
      console.warn(`[SignalPages] Canonical slug not found: ${page.canonicalSlug}`);
      return page; // fail open, not closed
    }

    // Prevent nested canonical chains (alias → alias → alias)
    if (canonical.canonicalSlug) {
      console.error(`[SignalPages] Nested canonical not allowed: ${slug} → ${page.canonicalSlug}`);
      return canonical; // resolve to first canonical, don't chain
    }

    return canonical;
  }

  return page;
}

export function getAllSignalPageSlugs(): string[] {
  return signalPagesConfig.map(page => page.slug);
}
