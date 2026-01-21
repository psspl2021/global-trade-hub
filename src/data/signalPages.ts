// Signal Page Configuration - Demand Intelligence Entry Points
// Each page = Demand Capture → AI Structuring → Managed Fulfilment
// NOT a marketplace. NOT a lead form.

import { getCountryByCode, DEFAULT_COUNTRY, type SupportedCountry } from './supportedCountries';

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

// Country-enriched config for geo-specific pages
export interface CountryEnrichedSignalPageConfig extends SignalPageConfig {
  countryInfo: SupportedCountry;
  countryMetaTitle: string;
  countryMetaDescription: string;
  logisticsLine: string;
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
  },

  // 16) Ready Mix Concrete (RMC)
  {
    slug: 'ready-mix-concrete-rmc',
    h1: 'Ready Mix Concrete Procurement for Infrastructure Projects',
    subheading: 'Project-based RMC supply with grade assurance and scheduled pours.',
    bodyText: `ProcureSaathi manages RMC procurement for infrastructure and real estate projects.

We coordinate plant allocation, grade compliance, and pour schedules.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Infrastructure projects', 'High-rise buildings', 'Industrial foundations'],
    whatBuyerGets: ['Single consolidated price', 'Grade compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['M20–M60 grades', 'IS 4926'],
    metaTitle: 'Ready Mix Concrete Procurement India | RMC Bulk Supply',
    metaDescription: 'Managed RMC procurement for infrastructure and real estate. M20–M60 grades.',
    intentKeywords: ['RMC procurement', 'ready mix concrete bulk', 'M30 concrete supply'],
    signalMapping: {
      category: 'concrete',
      subcategory: 'rmc',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 70,
    successfulDealsCount: 210,
    typicalDealRange: { min: 800000, max: 80000000 },
    deliveryTimeline: '2–10 days'
  },

  // 17) Fly Ash
  {
    slug: 'fly-ash-procurement',
    h1: 'Fly Ash Procurement for Cement & RMC Plants',
    subheading: 'Consistent grade fly ash with bulk logistics handling.',
    bodyText: `ProcureSaathi manages fly ash procurement for cement manufacturers and RMC plants.

We handle grade matching, long-term contracts, and logistics.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['RMC plants', 'Cement grinding units', 'Infrastructure projects'],
    whatBuyerGets: ['Single consolidated price', 'Consistent grade', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['IS 3812'],
    metaTitle: 'Fly Ash Procurement India | Cement & RMC',
    metaDescription: 'Managed fly ash procurement for cement & RMC plants.',
    intentKeywords: ['fly ash procurement', 'bulk fly ash India'],
    signalMapping: {
      category: 'cement',
      subcategory: 'fly_ash',
      industry: 'cement_rmc',
      buyer_type: 'plant_operator',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 88,
    typicalDealRange: { min: 500000, max: 30000000 },
    deliveryTimeline: '3–12 days'
  },

  // 18) Construction Aggregates
  {
    slug: 'construction-aggregates',
    h1: 'Construction Aggregate Procurement for Infrastructure',
    subheading: 'Crushed stone and sand with logistics coordination.',
    bodyText: `ProcureSaathi manages aggregate procurement for infrastructure and RMC plants.

We coordinate quarry allocation and delivery scheduling.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Road projects', 'RMC plants', 'Foundations'],
    whatBuyerGets: ['Single consolidated price', 'Size compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['10mm, 20mm, 40mm'],
    metaTitle: 'Construction Aggregate Procurement India',
    metaDescription: 'Managed aggregate procurement for infrastructure.',
    intentKeywords: ['aggregate procurement', 'crushed stone bulk'],
    signalMapping: {
      category: 'construction',
      subcategory: 'aggregates',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 120,
    typicalDealRange: { min: 300000, max: 25000000 },
    deliveryTimeline: '2–7 days'
  },

  // 19) Aluminium Extrusions
  {
    slug: 'aluminium-extrusions',
    h1: 'Aluminium Extrusion Procurement for OEMs',
    subheading: 'Custom profiles with alloy and temper control.',
    bodyText: `ProcureSaathi manages aluminium extrusion procurement for OEMs and exporters.

We coordinate die development, alloy matching, and logistics.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Automotive', 'Solar frames', 'Industrial equipment'],
    whatBuyerGets: ['Single consolidated price', 'Die support', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['6063-T5', '6061-T6'],
    metaTitle: 'Aluminium Extrusion Procurement India',
    metaDescription: 'Managed aluminium extrusion procurement.',
    intentKeywords: ['aluminium extrusion procurement'],
    signalMapping: {
      category: 'non_ferrous',
      subcategory: 'extrusions',
      industry: 'manufacturing',
      buyer_type: 'oem',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 30,
    successfulDealsCount: 76,
    typicalDealRange: { min: 2000000, max: 120000000 },
    deliveryTimeline: '15–40 days'
  },

  // 20) Industrial Fasteners
  {
    slug: 'industrial-fasteners',
    h1: 'Industrial Fastener Procurement',
    subheading: 'High-tensile fasteners with batch traceability.',
    bodyText: `ProcureSaathi manages fastener procurement for EPC and OEM buyers.

We ensure grade compliance and quality documentation.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Steel structures', 'Heavy machinery', 'Infrastructure'],
    whatBuyerGets: ['Single consolidated price', 'Test certificates', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['8.8, 10.9, 12.9 grades'],
    metaTitle: 'Industrial Fastener Procurement India',
    metaDescription: 'Managed fastener procurement for EPC and OEM buyers.',
    intentKeywords: ['industrial fasteners procurement'],
    signalMapping: {
      category: 'hardware',
      subcategory: 'fasteners',
      industry: 'infrastructure',
      buyer_type: 'epc',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 50,
    successfulDealsCount: 165,
    typicalDealRange: { min: 500000, max: 40000000 },
    deliveryTimeline: '7–20 days'
  },

  // 21) Industrial Bearings
  {
    slug: 'bearings-industrial',
    h1: 'Industrial Bearing Procurement for Manufacturing',
    subheading: 'OEM-grade bearings with authentic sourcing and traceability.',
    bodyText: `ProcureSaathi manages industrial bearing procurement for OEMs and MRO buyers.

We ensure authentic sourcing, brand verification, and bulk pricing.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Manufacturing plants', 'Heavy machinery', 'Automotive OEMs'],
    whatBuyerGets: ['Single consolidated price', 'Authentic sourcing', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['SKF, FAG, NSK, Timken', 'Ball, Roller, Taper bearings'],
    metaTitle: 'Industrial Bearing Procurement India',
    metaDescription: 'Managed industrial bearing procurement. OEM grades. Authentic sourcing.',
    intentKeywords: ['industrial bearings procurement', 'bulk bearings India'],
    signalMapping: {
      category: 'hardware',
      subcategory: 'bearings',
      industry: 'manufacturing',
      buyer_type: 'oem',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 98,
    typicalDealRange: { min: 500000, max: 50000000 },
    deliveryTimeline: '5–15 days'
  },

  // 22) Welding Consumables
  {
    slug: 'welding-consumables',
    h1: 'Welding Consumables Procurement for Fabrication',
    subheading: 'Electrodes, wires, and fluxes with AWS/IS compliance.',
    bodyText: `ProcureSaathi manages welding consumables procurement for fabricators and shipyards.

We handle brand sourcing, grade matching, and project-wise supply.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Fabrication units', 'Shipyards', 'Heavy engineering'],
    whatBuyerGets: ['Single consolidated price', 'AWS/IS compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['E6013, E7018', 'ER70S-6', 'Flux-cored wires'],
    metaTitle: 'Welding Consumables Procurement India',
    metaDescription: 'Managed welding consumables procurement. Electrodes & wires. AWS certified.',
    intentKeywords: ['welding consumables procurement', 'electrodes bulk India'],
    signalMapping: {
      category: 'consumables',
      subcategory: 'welding',
      industry: 'fabrication',
      buyer_type: 'fabricator',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 145,
    typicalDealRange: { min: 200000, max: 20000000 },
    deliveryTimeline: '3–10 days'
  },

  // 23) Gaskets & Seals
  {
    slug: 'gaskets-seals',
    h1: 'Gaskets & Seals Procurement for Process Industries',
    subheading: 'API and ASME grade gaskets with material traceability.',
    bodyText: `ProcureSaathi manages gasket and seal procurement for refineries, power plants, and process industries.

We ensure material compliance and pressure rating documentation.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Refineries', 'Power plants', 'Chemical plants'],
    whatBuyerGets: ['Single consolidated price', 'Material test certificates', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Spiral wound', 'Ring joint', 'PTFE', 'Graphite'],
    metaTitle: 'Gaskets & Seals Procurement India | Process Industries',
    metaDescription: 'Managed gaskets procurement. API/ASME grades. Refineries & power plants.',
    intentKeywords: ['gaskets procurement', 'industrial seals bulk'],
    signalMapping: {
      category: 'consumables',
      subcategory: 'gaskets',
      industry: 'process_industry',
      buyer_type: 'plant_operator',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 78,
    typicalDealRange: { min: 300000, max: 25000000 },
    deliveryTimeline: '7–21 days'
  },

  // 24) Power Cables
  {
    slug: 'power-cables',
    h1: 'Power Cable Procurement for Infrastructure Projects',
    subheading: 'LT/HT cables with ISI marking and project delivery.',
    bodyText: `ProcureSaathi manages power cable procurement for infrastructure and industrial projects.

We handle manufacturer coordination, testing, and project-wise dispatch.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Power substations', 'Industrial plants', 'Infrastructure projects'],
    whatBuyerGets: ['Single consolidated price', 'ISI marked cables', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['LT Cables (up to 1.1kV)', 'HT Cables (11kV, 33kV)', 'XLPE/PVC insulation'],
    metaTitle: 'Power Cable Procurement India | LT HT Cables',
    metaDescription: 'Managed power cable procurement. LT/HT cables. ISI marked. Infrastructure projects.',
    intentKeywords: ['power cables procurement', 'HT cables bulk India'],
    signalMapping: {
      category: 'electrical',
      subcategory: 'power_cables',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 45,
    successfulDealsCount: 134,
    typicalDealRange: { min: 1000000, max: 100000000 },
    deliveryTimeline: '10–30 days'
  },

  // 25) Control Cables
  {
    slug: 'control-cables',
    h1: 'Control Cable Procurement for Automation Projects',
    subheading: 'Instrumentation and control cables with shielding options.',
    bodyText: `ProcureSaathi manages control cable procurement for automation and instrumentation projects.

We coordinate manufacturer sourcing and project-wise delivery.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Automation projects', 'Process plants', 'Power plants'],
    whatBuyerGets: ['Single consolidated price', 'Shielding options', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Multi-core control cables', 'Instrumentation cables', 'Shielded/Unshielded'],
    metaTitle: 'Control Cable Procurement India | Automation',
    metaDescription: 'Managed control cable procurement. Instrumentation cables. Automation projects.',
    intentKeywords: ['control cables procurement', 'instrumentation cables bulk'],
    signalMapping: {
      category: 'electrical',
      subcategory: 'control_cables',
      industry: 'automation',
      buyer_type: 'system_integrator',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 89,
    typicalDealRange: { min: 500000, max: 50000000 },
    deliveryTimeline: '7–25 days'
  },

  // 26) Power Transformers
  {
    slug: 'transformers-power',
    h1: 'Power Transformer Procurement for Utilities & Industry',
    subheading: 'Distribution and power transformers with testing support.',
    bodyText: `ProcureSaathi manages transformer procurement for utilities and industrial buyers.

We coordinate manufacturer selection, testing, and delivery.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Utilities', 'Industrial plants', 'Infrastructure projects'],
    whatBuyerGets: ['Single consolidated price', 'Factory testing', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Distribution (up to 2.5MVA)', 'Power (5MVA+)', 'BIS certified'],
    metaTitle: 'Power Transformer Procurement India',
    metaDescription: 'Managed transformer procurement. Distribution & power. BIS certified.',
    intentKeywords: ['transformer procurement', 'power transformer bulk India'],
    signalMapping: {
      category: 'electrical',
      subcategory: 'transformers',
      industry: 'power',
      buyer_type: 'utility',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 45,
    typicalDealRange: { min: 5000000, max: 500000000 },
    deliveryTimeline: '30–90 days'
  },

  // 27) Industrial Valves
  {
    slug: 'industrial-valves',
    h1: 'Industrial Valve Procurement for Oil, Gas & Water',
    subheading: 'API and ASME valves with pressure testing documentation.',
    bodyText: `ProcureSaathi manages industrial valve procurement for oil & gas, water, and process industries.

We handle specification matching, testing, and delivery coordination.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Oil & gas', 'Water treatment', 'Chemical plants'],
    whatBuyerGets: ['Single consolidated price', 'Pressure test reports', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Gate, Globe, Ball, Butterfly', 'API 600/602/608', 'ASME B16.34'],
    metaTitle: 'Industrial Valve Procurement India | Oil Gas Water',
    metaDescription: 'Managed valve procurement. API/ASME grades. Oil, gas & water industries.',
    intentKeywords: ['industrial valves procurement', 'API valves bulk India'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'valves',
      industry: 'oil_gas_water',
      buyer_type: 'epc',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 112,
    typicalDealRange: { min: 1000000, max: 80000000 },
    deliveryTimeline: '15–45 days'
  },

  // 28) Centrifugal Pumps
  {
    slug: 'centrifugal-pumps',
    h1: 'Centrifugal Pump Procurement for Water & Process',
    subheading: 'API and IS pumps with performance curve verification.',
    bodyText: `ProcureSaathi manages centrifugal pump procurement for water, process, and industrial applications.

We handle manufacturer coordination, testing, and delivery.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Water treatment', 'Process industries', 'Irrigation'],
    whatBuyerGets: ['Single consolidated price', 'Performance curves', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['API 610', 'IS 1710', 'End suction, Split case'],
    metaTitle: 'Centrifugal Pump Procurement India | Water & Process',
    metaDescription: 'Managed pump procurement. API/IS grades. Water & process industries.',
    intentKeywords: ['centrifugal pumps procurement', 'industrial pumps bulk India'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'pumps',
      industry: 'water_process',
      buyer_type: 'contractor',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 98,
    typicalDealRange: { min: 500000, max: 60000000 },
    deliveryTimeline: '15–40 days'
  },

  // 29) Diesel Generators
  {
    slug: 'diesel-generators',
    h1: 'Diesel Generator Procurement for Infrastructure',
    subheading: 'Prime and standby DG sets with AMC options.',
    bodyText: `ProcureSaathi manages diesel generator procurement for infrastructure and industrial projects.

We coordinate OEM selection, installation support, and AMC options.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Infrastructure projects', 'Commercial buildings', 'Industrial plants'],
    whatBuyerGets: ['Single consolidated price', 'Installation support', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['15kVA–2000kVA', 'Cummins, Kirloskar, CAT', 'Prime/Standby rating'],
    metaTitle: 'Diesel Generator Procurement India | DG Sets',
    metaDescription: 'Managed DG set procurement. Prime & standby. All major brands.',
    intentKeywords: ['diesel generator procurement', 'DG sets bulk India'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'generators',
      industry: 'infrastructure',
      buyer_type: 'developer',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 30,
    successfulDealsCount: 67,
    typicalDealRange: { min: 1000000, max: 100000000 },
    deliveryTimeline: '15–45 days'
  },

  // 30) HVAC Equipment
  {
    slug: 'hvac-equipment',
    h1: 'HVAC Equipment Procurement for Commercial Projects',
    subheading: 'Chillers, AHUs, and VRF systems with project coordination.',
    bodyText: `ProcureSaathi manages HVAC equipment procurement for commercial and industrial projects.

We coordinate OEM selection, sizing, and delivery scheduling.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Commercial buildings', 'Hospitals', 'Data centers'],
    whatBuyerGets: ['Single consolidated price', 'Sizing support', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Chillers', 'AHUs', 'VRF/VRV systems', 'Ducted splits'],
    metaTitle: 'HVAC Equipment Procurement India | Commercial',
    metaDescription: 'Managed HVAC procurement. Chillers, AHUs, VRF. Commercial projects.',
    intentKeywords: ['HVAC equipment procurement', 'chillers bulk India'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'hvac',
      industry: 'commercial_real_estate',
      buyer_type: 'developer',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 56,
    typicalDealRange: { min: 2000000, max: 200000000 },
    deliveryTimeline: '30–60 days'
  },

  // ============================
  // ALIAS FIXES FOR 11–15 SLUGS
  // ============================

  {
    slug: 'cold-rolled-coil',
    canonicalSlug: 'cold-rolled-coil-manufacturing',
    h1: 'Cold Rolled Coil Procurement for Manufacturing Units',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Cold Rolled Coil Procurement India',
    metaDescription: 'CRC bulk procurement for OEMs and manufacturers.',
    intentKeywords: ['cold rolled coil', 'crc procurement'],
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

  {
    slug: 'galvanized-coils',
    canonicalSlug: 'galvanized-steel-coils',
    h1: 'Galvanized Steel Coil Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Galvanized Coil Procurement India',
    metaDescription: 'GI coil bulk procurement.',
    intentKeywords: ['galvanized coil', 'gi coil procurement'],
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

  {
    slug: 'steel-plates',
    canonicalSlug: 'steel-plates-heavy',
    h1: 'Steel Plate Procurement for Heavy Engineering',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Steel Plate Procurement India',
    metaDescription: 'Heavy steel plate bulk procurement.',
    intentKeywords: ['steel plates', 'heavy plates'],
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

  {
    slug: 'wire-rods',
    canonicalSlug: 'steel-wire-rods',
    h1: 'Steel Wire Rod Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Steel Wire Rod Procurement India',
    metaDescription: 'Wire rod bulk procurement.',
    intentKeywords: ['wire rods', 'steel wire rods'],
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

  {
    slug: 'chequered-plate',
    canonicalSlug: 'chequered-plates',
    h1: 'Chequered Plate Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Chequered Plate Procurement India',
    metaDescription: 'Anti-slip steel plates bulk supply.',
    intentKeywords: ['chequered plate', 'anti slip steel plate'],
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
  },

  // ============================
  // ALIAS FIXES FOR 16–30 SLUGS
  // ============================

  // 16) RMC Aliases
  {
    slug: 'rmc-concrete',
    canonicalSlug: 'ready-mix-concrete-rmc',
    h1: 'Ready Mix Concrete Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'RMC Concrete Procurement India',
    metaDescription: 'Ready mix concrete bulk procurement.',
    intentKeywords: ['rmc concrete', 'ready mix concrete'],
    signalMapping: {
      category: 'concrete',
      subcategory: 'rmc',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 70,
    successfulDealsCount: 210,
    typicalDealRange: { min: 800000, max: 80000000 },
    deliveryTimeline: '2–10 days'
  },
  {
    slug: 'ready-mix-concrete',
    canonicalSlug: 'ready-mix-concrete-rmc',
    h1: 'Ready Mix Concrete Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Ready Mix Concrete Supply India',
    metaDescription: 'RMC bulk supply for infrastructure.',
    intentKeywords: ['ready mix concrete supply', 'concrete bulk'],
    signalMapping: {
      category: 'concrete',
      subcategory: 'rmc',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 70,
    successfulDealsCount: 210,
    typicalDealRange: { min: 800000, max: 80000000 },
    deliveryTimeline: '2–10 days'
  },
  {
    slug: 'rmc-supply-india',
    canonicalSlug: 'ready-mix-concrete-rmc',
    h1: 'RMC Supply India',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'RMC Supply India | Bulk Concrete',
    metaDescription: 'RMC procurement for construction projects.',
    intentKeywords: ['rmc supply india', 'bulk rmc'],
    signalMapping: {
      category: 'concrete',
      subcategory: 'rmc',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 70,
    successfulDealsCount: 210,
    typicalDealRange: { min: 800000, max: 80000000 },
    deliveryTimeline: '2–10 days'
  },

  // 17) Fly Ash Aliases
  {
    slug: 'fly-ash',
    canonicalSlug: 'fly-ash-procurement',
    h1: 'Fly Ash Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Fly Ash Procurement India',
    metaDescription: 'Bulk fly ash supply.',
    intentKeywords: ['fly ash', 'fly ash bulk'],
    signalMapping: {
      category: 'cement',
      subcategory: 'fly_ash',
      industry: 'cement_rmc',
      buyer_type: 'plant_operator',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 88,
    typicalDealRange: { min: 500000, max: 30000000 },
    deliveryTimeline: '3–12 days'
  },
  {
    slug: 'fly-ash-cement',
    canonicalSlug: 'fly-ash-procurement',
    h1: 'Fly Ash for Cement Plants',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Fly Ash Cement Industry India',
    metaDescription: 'Fly ash procurement for cement manufacturing.',
    intentKeywords: ['fly ash cement', 'fly ash grinding unit'],
    signalMapping: {
      category: 'cement',
      subcategory: 'fly_ash',
      industry: 'cement_rmc',
      buyer_type: 'plant_operator',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 88,
    typicalDealRange: { min: 500000, max: 30000000 },
    deliveryTimeline: '3–12 days'
  },

  // 18) Aggregates Aliases
  {
    slug: 'crushed-stone-aggregates',
    canonicalSlug: 'construction-aggregates',
    h1: 'Crushed Stone Aggregate Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Crushed Stone Aggregate India',
    metaDescription: 'Crushed stone bulk supply.',
    intentKeywords: ['crushed stone', 'aggregate bulk'],
    signalMapping: {
      category: 'construction',
      subcategory: 'aggregates',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 120,
    typicalDealRange: { min: 300000, max: 25000000 },
    deliveryTimeline: '2–7 days'
  },
  {
    slug: 'aggregates-bulk',
    canonicalSlug: 'construction-aggregates',
    h1: 'Bulk Aggregate Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Bulk Aggregates Supply India',
    metaDescription: 'Construction aggregates bulk procurement.',
    intentKeywords: ['aggregates bulk', 'construction aggregates'],
    signalMapping: {
      category: 'construction',
      subcategory: 'aggregates',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 120,
    typicalDealRange: { min: 300000, max: 25000000 },
    deliveryTimeline: '2–7 days'
  },

  // 19) Aluminium Extrusions Aliases
  {
    slug: 'aluminium-extrusions-industrial',
    canonicalSlug: 'aluminium-extrusions',
    h1: 'Industrial Aluminium Extrusions',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Industrial Aluminium Extrusions India',
    metaDescription: 'Aluminium extrusion procurement for OEMs.',
    intentKeywords: ['industrial aluminium extrusions', 'aluminium profiles'],
    signalMapping: {
      category: 'non_ferrous',
      subcategory: 'extrusions',
      industry: 'manufacturing',
      buyer_type: 'oem',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 30,
    successfulDealsCount: 76,
    typicalDealRange: { min: 2000000, max: 120000000 },
    deliveryTimeline: '15–40 days'
  },
  {
    slug: 'aluminium-profiles',
    canonicalSlug: 'aluminium-extrusions',
    h1: 'Aluminium Profile Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Aluminium Profiles Supply India',
    metaDescription: 'Custom aluminium profile procurement.',
    intentKeywords: ['aluminium profiles', 'aluminium sections'],
    signalMapping: {
      category: 'non_ferrous',
      subcategory: 'extrusions',
      industry: 'manufacturing',
      buyer_type: 'oem',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 30,
    successfulDealsCount: 76,
    typicalDealRange: { min: 2000000, max: 120000000 },
    deliveryTimeline: '15–40 days'
  },

  // 20) Fasteners Aliases
  {
    slug: 'bulk-fasteners',
    canonicalSlug: 'industrial-fasteners',
    h1: 'Bulk Fastener Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Bulk Fasteners India',
    metaDescription: 'Industrial fasteners bulk supply.',
    intentKeywords: ['bulk fasteners', 'fasteners procurement'],
    signalMapping: {
      category: 'hardware',
      subcategory: 'fasteners',
      industry: 'infrastructure',
      buyer_type: 'epc',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 50,
    successfulDealsCount: 165,
    typicalDealRange: { min: 500000, max: 40000000 },
    deliveryTimeline: '7–20 days'
  },
  {
    slug: 'high-tensile-fasteners',
    canonicalSlug: 'industrial-fasteners',
    h1: 'High Tensile Fastener Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'High Tensile Fasteners India',
    metaDescription: 'Grade 8.8/10.9/12.9 fasteners bulk.',
    intentKeywords: ['high tensile fasteners', 'grade 10.9 bolts'],
    signalMapping: {
      category: 'hardware',
      subcategory: 'fasteners',
      industry: 'infrastructure',
      buyer_type: 'epc',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 50,
    successfulDealsCount: 165,
    typicalDealRange: { min: 500000, max: 40000000 },
    deliveryTimeline: '7–20 days'
  },

  // 21) Bearings Aliases
  {
    slug: 'industrial-bearings',
    canonicalSlug: 'bearings-industrial',
    h1: 'Industrial Bearing Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Industrial Bearings India',
    metaDescription: 'OEM bearings bulk procurement.',
    intentKeywords: ['industrial bearings', 'bearings bulk'],
    signalMapping: {
      category: 'hardware',
      subcategory: 'bearings',
      industry: 'manufacturing',
      buyer_type: 'oem',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 98,
    typicalDealRange: { min: 500000, max: 50000000 },
    deliveryTimeline: '5–15 days'
  },
  {
    slug: 'skf-fag-bearings',
    canonicalSlug: 'bearings-industrial',
    h1: 'SKF FAG Bearing Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'SKF FAG Bearings India',
    metaDescription: 'Authentic OEM bearings supply.',
    intentKeywords: ['skf bearings bulk', 'fag bearings india'],
    signalMapping: {
      category: 'hardware',
      subcategory: 'bearings',
      industry: 'manufacturing',
      buyer_type: 'oem',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 98,
    typicalDealRange: { min: 500000, max: 50000000 },
    deliveryTimeline: '5–15 days'
  },

  // 22) Welding Consumables Aliases
  {
    slug: 'welding-electrodes',
    canonicalSlug: 'welding-consumables',
    h1: 'Welding Electrode Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Welding Electrodes India',
    metaDescription: 'E6013/E7018 electrodes bulk.',
    intentKeywords: ['welding electrodes', 'E7018 bulk'],
    signalMapping: {
      category: 'consumables',
      subcategory: 'welding',
      industry: 'fabrication',
      buyer_type: 'fabricator',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 145,
    typicalDealRange: { min: 200000, max: 20000000 },
    deliveryTimeline: '3–10 days'
  },
  {
    slug: 'welding-wires',
    canonicalSlug: 'welding-consumables',
    h1: 'Welding Wire Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Welding Wires India',
    metaDescription: 'MIG/TIG welding wires bulk.',
    intentKeywords: ['welding wires', 'ER70S-6 bulk'],
    signalMapping: {
      category: 'consumables',
      subcategory: 'welding',
      industry: 'fabrication',
      buyer_type: 'fabricator',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 145,
    typicalDealRange: { min: 200000, max: 20000000 },
    deliveryTimeline: '3–10 days'
  },

  // 23) Gaskets Aliases
  {
    slug: 'industrial-gaskets',
    canonicalSlug: 'gaskets-seals',
    h1: 'Industrial Gasket Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Industrial Gaskets India',
    metaDescription: 'API/ASME gaskets bulk.',
    intentKeywords: ['industrial gaskets', 'spiral wound gaskets'],
    signalMapping: {
      category: 'consumables',
      subcategory: 'gaskets',
      industry: 'process_industry',
      buyer_type: 'plant_operator',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 78,
    typicalDealRange: { min: 300000, max: 25000000 },
    deliveryTimeline: '7–21 days'
  },
  {
    slug: 'seals-gaskets',
    canonicalSlug: 'gaskets-seals',
    h1: 'Seals & Gaskets Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Seals Gaskets India',
    metaDescription: 'Industrial seals and gaskets.',
    intentKeywords: ['seals gaskets', 'mechanical seals bulk'],
    signalMapping: {
      category: 'consumables',
      subcategory: 'gaskets',
      industry: 'process_industry',
      buyer_type: 'plant_operator',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 78,
    typicalDealRange: { min: 300000, max: 25000000 },
    deliveryTimeline: '7–21 days'
  },

  // 24) Power Cables Aliases
  {
    slug: 'lt-ht-cables',
    canonicalSlug: 'power-cables',
    h1: 'LT HT Cable Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'LT HT Cables India',
    metaDescription: 'Power cables for infrastructure.',
    intentKeywords: ['lt ht cables', 'power cables bulk'],
    signalMapping: {
      category: 'electrical',
      subcategory: 'power_cables',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 45,
    successfulDealsCount: 134,
    typicalDealRange: { min: 1000000, max: 100000000 },
    deliveryTimeline: '10–30 days'
  },
  {
    slug: 'power-cables-infrastructure',
    canonicalSlug: 'power-cables',
    h1: 'Infrastructure Power Cable Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Infrastructure Power Cables India',
    metaDescription: 'Power cable procurement for projects.',
    intentKeywords: ['infrastructure power cables', 'xlpe cables bulk'],
    signalMapping: {
      category: 'electrical',
      subcategory: 'power_cables',
      industry: 'infrastructure',
      buyer_type: 'contractor',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 45,
    successfulDealsCount: 134,
    typicalDealRange: { min: 1000000, max: 100000000 },
    deliveryTimeline: '10–30 days'
  },

  // 25) Control Cables Aliases
  {
    slug: 'instrumentation-cables',
    canonicalSlug: 'control-cables',
    h1: 'Instrumentation Cable Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Instrumentation Cables India',
    metaDescription: 'Control and instrumentation cables.',
    intentKeywords: ['instrumentation cables', 'control cables bulk'],
    signalMapping: {
      category: 'electrical',
      subcategory: 'control_cables',
      industry: 'automation',
      buyer_type: 'system_integrator',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 89,
    typicalDealRange: { min: 500000, max: 50000000 },
    deliveryTimeline: '7–25 days'
  },
  {
    slug: 'control-cables-industrial',
    canonicalSlug: 'control-cables',
    h1: 'Industrial Control Cable Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Industrial Control Cables India',
    metaDescription: 'Control cables for automation.',
    intentKeywords: ['industrial control cables', 'multi-core cables'],
    signalMapping: {
      category: 'electrical',
      subcategory: 'control_cables',
      industry: 'automation',
      buyer_type: 'system_integrator',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 89,
    typicalDealRange: { min: 500000, max: 50000000 },
    deliveryTimeline: '7–25 days'
  },

  // 26) Transformers Aliases
  {
    slug: 'distribution-transformers',
    canonicalSlug: 'transformers-power',
    h1: 'Distribution Transformer Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Distribution Transformers India',
    metaDescription: 'Distribution transformers up to 2.5MVA.',
    intentKeywords: ['distribution transformers', 'transformer bulk'],
    signalMapping: {
      category: 'electrical',
      subcategory: 'transformers',
      industry: 'power',
      buyer_type: 'utility',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 45,
    typicalDealRange: { min: 5000000, max: 500000000 },
    deliveryTimeline: '30–90 days'
  },
  {
    slug: 'power-transformers',
    canonicalSlug: 'transformers-power',
    h1: 'Power Transformer Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Power Transformers India',
    metaDescription: 'Power transformers 5MVA and above.',
    intentKeywords: ['power transformers', 'transformer procurement'],
    signalMapping: {
      category: 'electrical',
      subcategory: 'transformers',
      industry: 'power',
      buyer_type: 'utility',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 45,
    typicalDealRange: { min: 5000000, max: 500000000 },
    deliveryTimeline: '30–90 days'
  },

  // 27) Valves Aliases
  {
    slug: 'api-valves',
    canonicalSlug: 'industrial-valves',
    h1: 'API Valve Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'API Valves India',
    metaDescription: 'API certified valves for oil gas.',
    intentKeywords: ['api valves', 'gate valves bulk'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'valves',
      industry: 'oil_gas_water',
      buyer_type: 'epc',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 112,
    typicalDealRange: { min: 1000000, max: 80000000 },
    deliveryTimeline: '15–45 days'
  },
  {
    slug: 'valves-bulk',
    canonicalSlug: 'industrial-valves',
    h1: 'Bulk Valve Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Bulk Valves India',
    metaDescription: 'Industrial valves bulk procurement.',
    intentKeywords: ['valves bulk', 'ball valves procurement'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'valves',
      industry: 'oil_gas_water',
      buyer_type: 'epc',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 40,
    successfulDealsCount: 112,
    typicalDealRange: { min: 1000000, max: 80000000 },
    deliveryTimeline: '15–45 days'
  },

  // 28) Pumps Aliases
  {
    slug: 'industrial-pumps',
    canonicalSlug: 'centrifugal-pumps',
    h1: 'Industrial Pump Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Industrial Pumps India',
    metaDescription: 'Industrial pumps bulk procurement.',
    intentKeywords: ['industrial pumps', 'pumps bulk'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'pumps',
      industry: 'water_process',
      buyer_type: 'contractor',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 98,
    typicalDealRange: { min: 500000, max: 60000000 },
    deliveryTimeline: '15–40 days'
  },
  {
    slug: 'water-pumps-industrial',
    canonicalSlug: 'centrifugal-pumps',
    h1: 'Water Pump Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Water Pumps Industrial India',
    metaDescription: 'Water and process pumps bulk.',
    intentKeywords: ['water pumps industrial', 'centrifugal pumps bulk'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'pumps',
      industry: 'water_process',
      buyer_type: 'contractor',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 35,
    successfulDealsCount: 98,
    typicalDealRange: { min: 500000, max: 60000000 },
    deliveryTimeline: '15–40 days'
  },

  // 29) DG Sets Aliases
  {
    slug: 'dg-sets',
    canonicalSlug: 'diesel-generators',
    h1: 'DG Set Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'DG Sets India',
    metaDescription: 'Diesel generator sets bulk.',
    intentKeywords: ['dg sets', 'diesel genset bulk'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'generators',
      industry: 'infrastructure',
      buyer_type: 'developer',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 30,
    successfulDealsCount: 67,
    typicalDealRange: { min: 1000000, max: 100000000 },
    deliveryTimeline: '15–45 days'
  },
  {
    slug: 'dg-sets-industrial',
    canonicalSlug: 'diesel-generators',
    h1: 'Industrial DG Set Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Industrial DG Sets India',
    metaDescription: 'Industrial diesel generators.',
    intentKeywords: ['dg sets industrial', 'generator procurement'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'generators',
      industry: 'infrastructure',
      buyer_type: 'developer',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 30,
    successfulDealsCount: 67,
    typicalDealRange: { min: 1000000, max: 100000000 },
    deliveryTimeline: '15–45 days'
  },

  // 30) HVAC Aliases
  {
    slug: 'hvac-systems',
    canonicalSlug: 'hvac-equipment',
    h1: 'HVAC System Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'HVAC Systems India',
    metaDescription: 'HVAC systems for commercial projects.',
    intentKeywords: ['hvac systems', 'hvac procurement'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'hvac',
      industry: 'commercial_real_estate',
      buyer_type: 'developer',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 56,
    typicalDealRange: { min: 2000000, max: 200000000 },
    deliveryTimeline: '30–60 days'
  },
  {
    slug: 'hvac-systems-commercial',
    canonicalSlug: 'hvac-equipment',
    h1: 'Commercial HVAC Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Commercial HVAC India',
    metaDescription: 'HVAC equipment for commercial buildings.',
    intentKeywords: ['commercial hvac', 'chillers bulk'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'hvac',
      industry: 'commercial_real_estate',
      buyer_type: 'developer',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 56,
    typicalDealRange: { min: 2000000, max: 200000000 },
    deliveryTimeline: '30–60 days'
  },
  {
    slug: 'chillers-ahu',
    canonicalSlug: 'hvac-equipment',
    h1: 'Chiller & AHU Procurement',
    subheading: '',
    bodyText: '',
    useCases: [],
    whatBuyerGets: [],
    metaTitle: 'Chillers AHU India',
    metaDescription: 'Chillers and AHUs for projects.',
    intentKeywords: ['chillers ahu', 'vrf systems bulk'],
    signalMapping: {
      category: 'equipment',
      subcategory: 'hvac',
      industry: 'commercial_real_estate',
      buyer_type: 'developer',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 25,
    successfulDealsCount: 56,
    typicalDealRange: { min: 2000000, max: 200000000 },
    deliveryTimeline: '30–60 days'
  },

  // ============================
  // PHASE 2 — AGRICULTURAL MACHINERY & EQUIPMENT
  // ============================

  // Canonical
  {
    slug: 'agricultural-machinery-equipment-procurement',
    h1: 'Agricultural Machinery & Equipment Procurement for Farms & Agri Projects',
    subheading: 'Bulk sourcing of farm machinery, tools and equipment with managed pricing and delivery.',
    bodyText: `ProcureSaathi manages agricultural machinery and equipment procurement for farms, cooperatives and agri projects.

We handle vendor aggregation, pricing and logistics.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Commercial farming', 'Agri cooperatives', 'Plantation projects'],
    whatBuyerGets: ['Single consolidated price', 'Bulk supply support', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Tractors', 'Harvesters', 'Irrigation systems', 'Farm tools'],
    metaTitle: 'Agricultural Machinery Procurement India | Farm Equipment Bulk Supply',
    metaDescription: 'Managed agricultural machinery & equipment procurement for farms and agri projects.',
    intentKeywords: ['agricultural machinery procurement', 'farm equipment bulk', 'irrigation equipment supply'],
    signalMapping: {
      category: 'agriculture',
      subcategory: 'agricultural_machinery',
      industry: 'agriculture',
      buyer_type: 'farmer_enterprise',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 60,
    successfulDealsCount: 110,
    typicalDealRange: { min: 500000, max: 50000000 },
    deliveryTimeline: '7–30 days'
  },

  // Agricultural Machinery Aliases
  { slug: 'farm-machinery-bulk-procurement', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Farm Machinery Bulk Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Farm Machinery Bulk', metaDescription: 'Farm machinery procurement.', intentKeywords: ['farm machinery bulk'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'agricultural-equipment-supply', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Agricultural Equipment Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Agricultural Equipment', metaDescription: 'Agricultural equipment supply.', intentKeywords: ['agricultural equipment'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'irrigation-equipment-procurement', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Irrigation Equipment Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Irrigation Equipment', metaDescription: 'Irrigation equipment procurement.', intentKeywords: ['irrigation equipment'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'harvesting-machines-sourcing', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Harvesting Machines Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Harvesting Machines', metaDescription: 'Harvesting machines sourcing.', intentKeywords: ['harvesting machines'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'tractor-implements-bulk', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Tractor Implements Bulk', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Tractor Implements', metaDescription: 'Tractor implements bulk.', intentKeywords: ['tractor implements'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'greenhouse-equipment-procurement', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Greenhouse Equipment Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Greenhouse Equipment', metaDescription: 'Greenhouse equipment procurement.', intentKeywords: ['greenhouse equipment'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'dairy-farm-machinery-supply', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Dairy Farm Machinery Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Dairy Farm Machinery', metaDescription: 'Dairy farm machinery supply.', intentKeywords: ['dairy farm machinery'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'agriculture-tools-wholesale', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Agriculture Tools Wholesale', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Agriculture Tools', metaDescription: 'Agriculture tools wholesale.', intentKeywords: ['agriculture tools'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'plantation-equipment-sourcing', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Plantation Equipment Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Plantation Equipment', metaDescription: 'Plantation equipment sourcing.', intentKeywords: ['plantation equipment'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'bulk-farm-tools-supply', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Bulk Farm Tools Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Bulk Farm Tools', metaDescription: 'Bulk farm tools supply.', intentKeywords: ['bulk farm tools'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'commercial-farming-machinery', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Commercial Farming Machinery', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Commercial Farming Machinery', metaDescription: 'Commercial farming machinery.', intentKeywords: ['commercial farming machinery'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'agricultural-implements-procurement', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Agricultural Implements Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Agricultural Implements', metaDescription: 'Agricultural implements procurement.', intentKeywords: ['agricultural implements'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'irrigation-system-bulk-order', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Irrigation System Bulk Order', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Irrigation Systems Bulk', metaDescription: 'Irrigation system bulk order.', intentKeywords: ['irrigation system bulk'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'seed-processing-machinery', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Seed Processing Machinery', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Seed Processing Machinery', metaDescription: 'Seed processing machinery.', intentKeywords: ['seed processing machinery'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'grain-storage-silos-procurement', canonicalSlug: 'agricultural-machinery-equipment-procurement', h1: 'Grain Storage Silos Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Grain Storage Silos', metaDescription: 'Grain storage silos procurement.', intentKeywords: ['grain storage silos'], signalMapping: { category: 'agriculture', subcategory: 'agricultural_machinery', industry: 'agriculture', buyer_type: 'farmer_enterprise', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 60, successfulDealsCount: 110, typicalDealRange: { min: 500000, max: 50000000 }, deliveryTimeline: '7–30 days' },

  // ============================
  // PHASE 2 — AUTO PARTS & COMPONENTS
  // ============================

  // Canonical
  {
    slug: 'auto-parts-vehicle-components-procurement',
    h1: 'Auto Parts & Vehicle Components Procurement for OEMs & Fleet Operators',
    subheading: 'Bulk sourcing of automotive components with managed pricing and logistics.',
    bodyText: `ProcureSaathi manages procurement of auto parts and vehicle components for OEMs, fleet operators and distributors.

We aggregate suppliers, manage pricing and ensure delivery timelines.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['OEM manufacturing', 'Fleet maintenance', 'Auto distributors'],
    whatBuyerGets: ['Single consolidated price', 'OEM compliant parts', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Engine parts', 'Brake systems', 'Suspension', 'Batteries', 'Filters'],
    metaTitle: 'Auto Parts Procurement India | Vehicle Components Bulk Supply',
    metaDescription: 'Managed auto parts & vehicle components procurement for OEMs and fleet operators.',
    intentKeywords: ['auto parts bulk procurement', 'vehicle components sourcing', 'oem auto supply'],
    signalMapping: {
      category: 'automotive',
      subcategory: 'auto_parts',
      industry: 'automotive',
      buyer_type: 'oem_fleet',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 75,
    successfulDealsCount: 180,
    typicalDealRange: { min: 300000, max: 40000000 },
    deliveryTimeline: '5–20 days'
  },

  // Auto Parts Aliases
  { slug: 'car-parts-bulk-supply', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Car Parts Bulk Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Car Parts Bulk', metaDescription: 'Car parts bulk supply.', intentKeywords: ['car parts bulk'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'truck-spare-parts-procurement', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Truck Spare Parts Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Truck Spare Parts', metaDescription: 'Truck spare parts procurement.', intentKeywords: ['truck spare parts'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'fleet-maintenance-parts', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Fleet Maintenance Parts', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Fleet Maintenance Parts', metaDescription: 'Fleet maintenance parts.', intentKeywords: ['fleet maintenance parts'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'engine-components-sourcing', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Engine Components Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Engine Components', metaDescription: 'Engine components sourcing.', intentKeywords: ['engine components'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'auto-batteries-bulk-order', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Auto Batteries Bulk Order', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Auto Batteries Bulk', metaDescription: 'Auto batteries bulk order.', intentKeywords: ['auto batteries bulk'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'automotive-oem-supplier', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Automotive OEM Supplier', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Automotive OEM Supplier', metaDescription: 'Automotive OEM supplier.', intentKeywords: ['automotive oem supplier'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'vehicle-spares-wholesale', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Vehicle Spares Wholesale', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Vehicle Spares Wholesale', metaDescription: 'Vehicle spares wholesale.', intentKeywords: ['vehicle spares wholesale'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'two-wheeler-parts-supply', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Two Wheeler Parts Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Two Wheeler Parts', metaDescription: 'Two wheeler parts supply.', intentKeywords: ['two wheeler parts'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'auto-electronics-procurement', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Auto Electronics Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Auto Electronics', metaDescription: 'Auto electronics procurement.', intentKeywords: ['auto electronics'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'brake-parts-bulk', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Brake Parts Bulk', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Brake Parts Bulk', metaDescription: 'Brake parts bulk.', intentKeywords: ['brake parts bulk'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'suspension-parts-sourcing', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Suspension Parts Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Suspension Parts', metaDescription: 'Suspension parts sourcing.', intentKeywords: ['suspension parts'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'automotive-components-export', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Automotive Components Export', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Automotive Components Export', metaDescription: 'Automotive components export.', intentKeywords: ['automotive components export'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'truck-parts-vendor', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Truck Parts Vendor', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Truck Parts Vendor', metaDescription: 'Truck parts vendor.', intentKeywords: ['truck parts vendor'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'auto-aftermarket-supply', canonicalSlug: 'auto-parts-vehicle-components-procurement', h1: 'Auto Aftermarket Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Auto Aftermarket Supply', metaDescription: 'Auto aftermarket supply.', intentKeywords: ['auto aftermarket supply'], signalMapping: { category: 'automotive', subcategory: 'auto_parts', industry: 'automotive', buyer_type: 'oem_fleet', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 75, successfulDealsCount: 180, typicalDealRange: { min: 300000, max: 40000000 }, deliveryTimeline: '5–20 days' },

  // ============================
  // PHASE 2 — INDUSTRIAL CHEMICALS
  // ============================

  // Canonical
  {
    slug: 'industrial-chemicals-bulk-procurement',
    h1: 'Industrial Chemicals Bulk Procurement for Manufacturing & Utilities',
    subheading: 'Bulk sourcing of process and specialty chemicals with compliance and logistics support.',
    bodyText: `ProcureSaathi manages industrial and specialty chemical procurement for manufacturing, water treatment and utilities.

We handle supplier vetting, compliance and delivery.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Water treatment plants', 'Manufacturing units', 'Process industries'],
    whatBuyerGets: ['Single consolidated price', 'COA & compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Coagulants', 'Flocculants', 'Acids', 'Solvents', 'Additives'],
    metaTitle: 'Industrial Chemicals Procurement India | Bulk Process Chemicals',
    metaDescription: 'Managed bulk industrial chemical procurement for water treatment and manufacturing industries.',
    intentKeywords: ['industrial chemicals bulk', 'process chemicals sourcing', 'water treatment chemicals'],
    signalMapping: {
      category: 'chemicals',
      subcategory: 'industrial_chemicals',
      industry: 'process_industry',
      buyer_type: 'manufacturer',
      estimated_value_band: 'medium_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 90,
    successfulDealsCount: 210,
    typicalDealRange: { min: 400000, max: 60000000 },
    deliveryTimeline: '3–15 days'
  },

  // Industrial Chemicals Aliases
  { slug: 'bulk-process-chemicals-supply', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Bulk Process Chemicals Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Process Chemicals Bulk', metaDescription: 'Process chemicals bulk supply.', intentKeywords: ['process chemicals bulk'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'water-treatment-chemicals-procurement', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Water Treatment Chemicals Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Water Treatment Chemicals', metaDescription: 'Water treatment chemicals procurement.', intentKeywords: ['water treatment chemicals'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'coagulants-flocculants-supply', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Coagulants & Flocculants Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Coagulants Flocculants', metaDescription: 'Coagulants and flocculants supply.', intentKeywords: ['coagulants flocculants'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'specialty-chemicals-bulk-order', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Specialty Chemicals Bulk Order', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Specialty Chemicals Bulk', metaDescription: 'Specialty chemicals bulk order.', intentKeywords: ['specialty chemicals bulk'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'manufacturing-chemicals-sourcing', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Manufacturing Chemicals Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Manufacturing Chemicals', metaDescription: 'Manufacturing chemicals sourcing.', intentKeywords: ['manufacturing chemicals'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'corrosion-inhibitors-procurement', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Corrosion Inhibitors Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Corrosion Inhibitors', metaDescription: 'Corrosion inhibitors procurement.', intentKeywords: ['corrosion inhibitors'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'ph-adjusters-bulk', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'pH Adjusters Bulk', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'pH Adjusters Bulk', metaDescription: 'pH adjusters bulk.', intentKeywords: ['ph adjusters bulk'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'industrial-solvents-supply', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Industrial Solvents Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Industrial Solvents', metaDescription: 'Industrial solvents supply.', intentKeywords: ['industrial solvents'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'biocides-antiscalants-sourcing', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Biocides & Antiscalants Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Biocides Antiscalants', metaDescription: 'Biocides and antiscalants sourcing.', intentKeywords: ['biocides antiscalants'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'chemical-trading-for-industry', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Chemical Trading for Industry', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Chemical Trading', metaDescription: 'Chemical trading for industry.', intentKeywords: ['chemical trading industry'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'process-industry-chemicals', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Process Industry Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Process Industry Chemicals', metaDescription: 'Process industry chemicals.', intentKeywords: ['process industry chemicals'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },
  { slug: 'chemical-export-from-india', canonicalSlug: 'industrial-chemicals-bulk-procurement', h1: 'Chemical Export from India', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Chemical Export India', metaDescription: 'Chemical export from India.', intentKeywords: ['chemical export india'], signalMapping: { category: 'chemicals', subcategory: 'industrial_chemicals', industry: 'process_industry', buyer_type: 'manufacturer', estimated_value_band: 'medium_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 90, successfulDealsCount: 210, typicalDealRange: { min: 400000, max: 60000000 }, deliveryTimeline: '3–15 days' },

  // ============================
  // PHASE 2 — HARDWARE & FASTENERS
  // ============================

  // Canonical
  {
    slug: 'hardware-fasteners-tools-procurement',
    h1: 'Hardware, Fasteners & Tools Procurement for Construction & Industry',
    subheading: 'Bulk sourcing of fasteners and tools with project-wise delivery.',
    bodyText: `ProcureSaathi manages hardware, fasteners and industrial tools procurement for construction and manufacturing.

We aggregate suppliers and manage delivery.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Construction projects', 'Manufacturing units', 'Maintenance contractors'],
    whatBuyerGets: ['Single consolidated price', 'Bulk packaging', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Bolts & nuts', 'Anchors', 'Screws', 'Hand tools'],
    metaTitle: 'Hardware & Fasteners Procurement India | Industrial Tools Bulk Supply',
    metaDescription: 'Managed hardware, fasteners and industrial tools procurement for projects and factories.',
    intentKeywords: ['fasteners bulk procurement', 'hardware supply india', 'industrial tools sourcing'],
    signalMapping: {
      category: 'hardware',
      subcategory: 'fasteners_tools',
      industry: 'construction_industry',
      buyer_type: 'contractor',
      estimated_value_band: 'medium',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 85,
    successfulDealsCount: 300,
    typicalDealRange: { min: 200000, max: 20000000 },
    deliveryTimeline: '3–10 days'
  },

  // Hardware & Fasteners Aliases
  { slug: 'bolts-nuts-bulk-procurement', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Bolts & Nuts Bulk Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Bolts Nuts Bulk', metaDescription: 'Bolts and nuts bulk procurement.', intentKeywords: ['bolts nuts bulk'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'industrial-fasteners-supply', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Industrial Fasteners Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Industrial Fasteners', metaDescription: 'Industrial fasteners supply.', intentKeywords: ['industrial fasteners'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'construction-hardware-bulk', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Construction Hardware Bulk', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Construction Hardware', metaDescription: 'Construction hardware bulk.', intentKeywords: ['construction hardware'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'anchors-screws-wholesale', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Anchors & Screws Wholesale', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Anchors Screws Wholesale', metaDescription: 'Anchors and screws wholesale.', intentKeywords: ['anchors screws wholesale'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'power-tools-procurement', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Power Tools Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Power Tools Procurement', metaDescription: 'Power tools procurement.', intentKeywords: ['power tools procurement'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'hand-tools-bulk-supply', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Hand Tools Bulk Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Hand Tools Bulk', metaDescription: 'Hand tools bulk supply.', intentKeywords: ['hand tools bulk'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'structural-fasteners-vendor', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Structural Fasteners Vendor', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Structural Fasteners', metaDescription: 'Structural fasteners vendor.', intentKeywords: ['structural fasteners'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'stainless-fasteners-sourcing', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Stainless Fasteners Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Stainless Fasteners', metaDescription: 'Stainless fasteners sourcing.', intentKeywords: ['stainless fasteners'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'hardware-export-from-india', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Hardware Export from India', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Hardware Export India', metaDescription: 'Hardware export from India.', intentKeywords: ['hardware export india'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'industrial-maintenance-tools', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Industrial Maintenance Tools', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Maintenance Tools', metaDescription: 'Industrial maintenance tools.', intentKeywords: ['industrial maintenance tools'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'fastener-contract-supply', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Fastener Contract Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Fastener Contract Supply', metaDescription: 'Fastener contract supply.', intentKeywords: ['fastener contract supply'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },
  { slug: 'project-hardware-supply', canonicalSlug: 'hardware-fasteners-tools-procurement', h1: 'Project Hardware Supply', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Project Hardware', metaDescription: 'Project hardware supply.', intentKeywords: ['project hardware supply'], signalMapping: { category: 'hardware', subcategory: 'fasteners_tools', industry: 'construction_industry', buyer_type: 'contractor', estimated_value_band: 'medium', signal_source: 'signal_page' }, verifiedSuppliersCount: 85, successfulDealsCount: 300, typicalDealRange: { min: 200000, max: 20000000 }, deliveryTimeline: '3–10 days' },

  // ============================
  // PHASE 2 — REVENUE FIRST DEMAND SENSORS
  // ============================

  // 🟣 1. PHARMACEUTICAL APIs & INTERMEDIATES (Canonical)
  {
    slug: 'pharmaceutical-apis-intermediates',
    h1: 'Pharmaceutical APIs & Drug Intermediates Procurement',
    subheading: 'Bulk sourcing of active pharmaceutical ingredients and intermediates with compliance and quality assurance.',
    bodyText: `ProcureSaathi manages pharmaceutical API and intermediate procurement for drug manufacturers and formulators.

We handle supplier qualification, compliance documentation, and logistics.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Drug manufacturing', 'Generic formulation', 'Contract manufacturing'],
    whatBuyerGets: ['Single consolidated price', 'COA & compliance docs', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Active Pharmaceutical Ingredients', 'Drug Intermediates', 'Chiral Compounds', 'Amino Acid Derivatives'],
    metaTitle: 'Pharmaceutical APIs Procurement India | Drug Intermediates Bulk Supply',
    metaDescription: 'Managed pharmaceutical API & drug intermediate procurement for manufacturers. WHO-GMP compliant. Single contract.',
    intentKeywords: ['pharmaceutical api procurement', 'drug intermediates bulk', 'api sourcing india'],
    signalMapping: {
      category: 'pharmaceuticals',
      subcategory: 'apis_intermediates',
      industry: 'pharmaceutical',
      buyer_type: 'manufacturer',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 120,
    successfulDealsCount: 280,
    typicalDealRange: { min: 1000000, max: 100000000 },
    deliveryTimeline: '7–30 days'
  },

  // Pharmaceutical APIs Aliases
  { slug: 'api-manufacturers-india', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'API Manufacturers India', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'API Manufacturers India', metaDescription: 'API manufacturers India.', intentKeywords: ['api manufacturers india'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'pharma-active-ingredients-suppliers', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Pharma Active Ingredients Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Active Ingredients Suppliers', metaDescription: 'Pharma active ingredients suppliers.', intentKeywords: ['pharma active ingredients'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'drug-intermediates-bulk-buy', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Drug Intermediates Bulk Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Drug Intermediates Bulk', metaDescription: 'Drug intermediates bulk buy.', intentKeywords: ['drug intermediates bulk'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'pharma-raw-materials-procurement', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Pharma Raw Materials Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Pharma Raw Materials', metaDescription: 'Pharma raw materials procurement.', intentKeywords: ['pharma raw materials'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'bulk-api-sourcing', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Bulk API Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Bulk API Sourcing', metaDescription: 'Bulk API sourcing.', intentKeywords: ['bulk api sourcing'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'export-api-suppliers', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Export API Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Export API Suppliers', metaDescription: 'Export API suppliers.', intentKeywords: ['export api suppliers'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'custom-api-manufacturing', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Custom API Manufacturing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Custom API Manufacturing', metaDescription: 'Custom API manufacturing.', intentKeywords: ['custom api manufacturing'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'pharmaceutical-intermediate-suppliers', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Pharmaceutical Intermediate Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Pharma Intermediate Suppliers', metaDescription: 'Pharmaceutical intermediate suppliers.', intentKeywords: ['pharmaceutical intermediates'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'analgesic-intermediates-buy', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Analgesic Intermediates Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Analgesic Intermediates', metaDescription: 'Analgesic intermediates buy.', intentKeywords: ['analgesic intermediates'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'anticancer-api-procurement', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Anticancer API Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Anticancer API Procurement', metaDescription: 'Anticancer API procurement.', intentKeywords: ['anticancer api'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'antibiotic-api-suppliers', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Antibiotic API Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Antibiotic API Suppliers', metaDescription: 'Antibiotic API suppliers.', intentKeywords: ['antibiotic api'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'cardio-drug-intermediates', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Cardio Drug Intermediates', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Cardio Drug Intermediates', metaDescription: 'Cardio drug intermediates.', intentKeywords: ['cardio drug intermediates'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'cns-drug-ingredients', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'CNS Drug Ingredients', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'CNS Drug Ingredients', metaDescription: 'CNS drug ingredients.', intentKeywords: ['cns drug ingredients'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'chiral-compounds-sourcing', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Chiral Compounds Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Chiral Compounds Sourcing', metaDescription: 'Chiral compounds sourcing.', intentKeywords: ['chiral compounds'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'amino-acid-intermediates', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Amino Acid Intermediates', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Amino Acid Intermediates', metaDescription: 'Amino acid intermediates.', intentKeywords: ['amino acid intermediates'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'pharma-solvents-buy', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Pharma Solvents Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Pharma Solvents', metaDescription: 'Pharma solvents buy.', intentKeywords: ['pharma solvents'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'api-export-india', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'API Export India', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'API Export India', metaDescription: 'API export India.', intentKeywords: ['api export india'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'who-gmp-api-suppliers', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'WHO-GMP API Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'WHO-GMP API Suppliers', metaDescription: 'WHO-GMP API suppliers.', intentKeywords: ['who gmp api suppliers'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'bulk-drug-ingredients', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Bulk Drug Ingredients', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Bulk Drug Ingredients', metaDescription: 'Bulk drug ingredients.', intentKeywords: ['bulk drug ingredients'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'api-contract-manufacturing', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'API Contract Manufacturing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'API Contract Manufacturing', metaDescription: 'API contract manufacturing.', intentKeywords: ['api contract manufacturing'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'generic-drug-api-sourcing', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Generic Drug API Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Generic Drug API', metaDescription: 'Generic drug API sourcing.', intentKeywords: ['generic drug api'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'injectable-api-suppliers', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Injectable API Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Injectable API Suppliers', metaDescription: 'Injectable API suppliers.', intentKeywords: ['injectable api'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'pharma-synthesis-intermediates', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Pharma Synthesis Intermediates', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Pharma Synthesis Intermediates', metaDescription: 'Pharma synthesis intermediates.', intentKeywords: ['pharma synthesis intermediates'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },
  { slug: 'custom-pharma-chemicals', canonicalSlug: 'pharmaceutical-apis-intermediates', h1: 'Custom Pharma Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Custom Pharma Chemicals', metaDescription: 'Custom pharma chemicals.', intentKeywords: ['custom pharma chemicals'], signalMapping: { category: 'pharmaceuticals', subcategory: 'apis_intermediates', industry: 'pharmaceutical', buyer_type: 'manufacturer', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 120, successfulDealsCount: 280, typicalDealRange: { min: 1000000, max: 100000000 }, deliveryTimeline: '7–30 days' },

  // ⚡ 2. ELECTRICAL EQUIPMENT & POWER DISTRIBUTION (Canonical)
  {
    slug: 'electrical-equipment-power-distribution',
    h1: 'Electrical Equipment & Power Distribution Procurement',
    subheading: 'Bulk sourcing of transformers, switchgear, and power distribution equipment for EPC and industrial projects.',
    bodyText: `ProcureSaathi manages electrical equipment and power distribution procurement for EPC contractors and industrial facilities.

We handle vendor qualification, technical compliance, and project delivery.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Power substations', 'Industrial facilities', 'EPC projects'],
    whatBuyerGets: ['Single consolidated price', 'Technical compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Transformers', 'HT/LT Panels', 'Switchgear', 'Power Cables', 'Distribution Boards'],
    metaTitle: 'Electrical Equipment Procurement India | Power Distribution Bulk Supply',
    metaDescription: 'Managed electrical equipment & power distribution procurement for EPC and industrial projects. Single contract.',
    intentKeywords: ['electrical equipment procurement', 'power distribution bulk', 'transformer suppliers india'],
    signalMapping: {
      category: 'electrical_equipment',
      subcategory: 'power_distribution',
      industry: 'power_infrastructure',
      buyer_type: 'epc',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 95,
    successfulDealsCount: 220,
    typicalDealRange: { min: 2000000, max: 150000000 },
    deliveryTimeline: '15–60 days'
  },

  // Electrical Equipment Aliases
  { slug: 'transformer-suppliers-india', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Transformer Suppliers India', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Transformer Suppliers India', metaDescription: 'Transformer suppliers India.', intentKeywords: ['transformer suppliers india'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'ht-lt-panel-manufacturers', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'HT LT Panel Manufacturers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'HT LT Panel Manufacturers', metaDescription: 'HT LT panel manufacturers.', intentKeywords: ['ht lt panel'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'switchgear-procurement', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Switchgear Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Switchgear Procurement', metaDescription: 'Switchgear procurement.', intentKeywords: ['switchgear procurement'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'industrial-electrical-equipment', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Industrial Electrical Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Industrial Electrical Equipment', metaDescription: 'Industrial electrical equipment.', intentKeywords: ['industrial electrical equipment'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'power-distribution-equipment-buy', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Power Distribution Equipment Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Power Distribution Equipment', metaDescription: 'Power distribution equipment buy.', intentKeywords: ['power distribution equipment'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'control-panels-suppliers', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Control Panels Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Control Panels Suppliers', metaDescription: 'Control panels suppliers.', intentKeywords: ['control panels suppliers'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'electrical-substation-equipment', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Electrical Substation Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Electrical Substation Equipment', metaDescription: 'Electrical substation equipment.', intentKeywords: ['electrical substation equipment'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'mv-switchgear-sourcing', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'MV Switchgear Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'MV Switchgear Sourcing', metaDescription: 'MV switchgear sourcing.', intentKeywords: ['mv switchgear'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'power-cables-industrial', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Power Cables Industrial', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Power Cables Industrial', metaDescription: 'Power cables industrial.', intentKeywords: ['power cables industrial'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'busbar-trunking-systems', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Busbar Trunking Systems', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Busbar Trunking Systems', metaDescription: 'Busbar trunking systems.', intentKeywords: ['busbar trunking'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'relay-protection-equipment', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Relay Protection Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Relay Protection Equipment', metaDescription: 'Relay protection equipment.', intentKeywords: ['relay protection equipment'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'metering-panels-procurement', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Metering Panels Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Metering Panels Procurement', metaDescription: 'Metering panels procurement.', intentKeywords: ['metering panels'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'electrical-epc-supplies', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Electrical EPC Supplies', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Electrical EPC Supplies', metaDescription: 'Electrical EPC supplies.', intentKeywords: ['electrical epc supplies'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'industrial-electrical-projects', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Industrial Electrical Projects', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Industrial Electrical Projects', metaDescription: 'Industrial electrical projects.', intentKeywords: ['industrial electrical projects'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'energy-distribution-equipment', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Energy Distribution Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Energy Distribution Equipment', metaDescription: 'Energy distribution equipment.', intentKeywords: ['energy distribution equipment'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'substation-material-suppliers', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Substation Material Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Substation Material Suppliers', metaDescription: 'Substation material suppliers.', intentKeywords: ['substation material'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'electrical-infrastructure-buy', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Electrical Infrastructure Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Electrical Infrastructure', metaDescription: 'Electrical infrastructure buy.', intentKeywords: ['electrical infrastructure'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'transformer-export-suppliers', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Transformer Export Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Transformer Export Suppliers', metaDescription: 'Transformer export suppliers.', intentKeywords: ['transformer export'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'power-equipment-wholesale', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Power Equipment Wholesale', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Power Equipment Wholesale', metaDescription: 'Power equipment wholesale.', intentKeywords: ['power equipment wholesale'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'hv-equipment-procurement', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'HV Equipment Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'HV Equipment Procurement', metaDescription: 'HV equipment procurement.', intentKeywords: ['hv equipment'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'lt-panel-manufacturers', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'LT Panel Manufacturers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'LT Panel Manufacturers', metaDescription: 'LT panel manufacturers.', intentKeywords: ['lt panel manufacturers'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'distribution-boards-sourcing', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Distribution Boards Sourcing', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Distribution Boards Sourcing', metaDescription: 'Distribution boards sourcing.', intentKeywords: ['distribution boards'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'electrical-balance-of-plant', canonicalSlug: 'electrical-equipment-power-distribution', h1: 'Electrical Balance of Plant', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Electrical Balance of Plant', metaDescription: 'Electrical balance of plant.', intentKeywords: ['electrical balance of plant'], signalMapping: { category: 'electrical_equipment', subcategory: 'power_distribution', industry: 'power_infrastructure', buyer_type: 'epc', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 95, successfulDealsCount: 220, typicalDealRange: { min: 2000000, max: 150000000 }, deliveryTimeline: '15–60 days' },

  // 💧 3. WATER TREATMENT CHEMICALS & SYSTEMS (Canonical)
  {
    slug: 'water-treatment-chemicals-systems',
    h1: 'Water Treatment Chemicals & Systems Procurement',
    subheading: 'Bulk sourcing of water treatment chemicals and equipment for industrial and municipal applications.',
    bodyText: `ProcureSaathi manages water treatment chemical and equipment procurement for industries and municipalities.

We handle vendor qualification, compliance, and logistics.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['ETP/STP plants', 'Industrial facilities', 'Municipal water treatment'],
    whatBuyerGets: ['Single consolidated price', 'COA & compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Coagulants', 'Flocculants', 'Antiscalants', 'Biocides', 'pH Adjusters'],
    metaTitle: 'Water Treatment Chemicals Procurement India | ETP STP Supplies',
    metaDescription: 'Managed water treatment chemicals & systems procurement for industrial and municipal applications.',
    intentKeywords: ['water treatment chemicals', 'etp chemicals procurement', 'industrial water treatment'],
    signalMapping: {
      category: 'water_treatment',
      subcategory: 'chemicals_systems',
      industry: 'water_infrastructure',
      buyer_type: 'industrial',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 80,
    successfulDealsCount: 190,
    typicalDealRange: { min: 500000, max: 80000000 },
    deliveryTimeline: '5–20 days'
  },

  // Water Treatment Aliases
  { slug: 'water-treatment-chemicals-buy', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Water Treatment Chemicals Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Water Treatment Chemicals Buy', metaDescription: 'Water treatment chemicals buy.', intentKeywords: ['water treatment chemicals buy'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'ro-plant-chemicals-suppliers', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'RO Plant Chemicals Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'RO Plant Chemicals', metaDescription: 'RO plant chemicals suppliers.', intentKeywords: ['ro plant chemicals'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'effluent-treatment-chemicals', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Effluent Treatment Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Effluent Treatment Chemicals', metaDescription: 'Effluent treatment chemicals.', intentKeywords: ['effluent treatment chemicals'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'stp-etp-chemicals', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'STP ETP Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'STP ETP Chemicals', metaDescription: 'STP ETP chemicals.', intentKeywords: ['stp etp chemicals'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'coagulants-flocculants-buy', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Coagulants Flocculants Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Coagulants Flocculants', metaDescription: 'Coagulants flocculants buy.', intentKeywords: ['coagulants flocculants'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'antiscalant-suppliers', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Antiscalant Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Antiscalant Suppliers', metaDescription: 'Antiscalant suppliers.', intentKeywords: ['antiscalant suppliers'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'biocide-water-treatment', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Biocide Water Treatment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Biocide Water Treatment', metaDescription: 'Biocide water treatment.', intentKeywords: ['biocide water treatment'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'industrial-water-chemicals', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Industrial Water Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Industrial Water Chemicals', metaDescription: 'Industrial water chemicals.', intentKeywords: ['industrial water chemicals'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'cooling-tower-chemicals', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Cooling Tower Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Cooling Tower Chemicals', metaDescription: 'Cooling tower chemicals.', intentKeywords: ['cooling tower chemicals'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'boiler-water-chemicals', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Boiler Water Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Boiler Water Chemicals', metaDescription: 'Boiler water chemicals.', intentKeywords: ['boiler water chemicals'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'reverse-osmosis-chemicals', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Reverse Osmosis Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Reverse Osmosis Chemicals', metaDescription: 'Reverse osmosis chemicals.', intentKeywords: ['reverse osmosis chemicals'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'wastewater-treatment-supplies', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Wastewater Treatment Supplies', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Wastewater Treatment Supplies', metaDescription: 'Wastewater treatment supplies.', intentKeywords: ['wastewater treatment supplies'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'etp-plant-procurement', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'ETP Plant Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'ETP Plant Procurement', metaDescription: 'ETP plant procurement.', intentKeywords: ['etp plant procurement'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'water-treatment-export', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Water Treatment Export', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Water Treatment Export', metaDescription: 'Water treatment export.', intentKeywords: ['water treatment export'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'desalination-chemicals', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Desalination Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Desalination Chemicals', metaDescription: 'Desalination chemicals.', intentKeywords: ['desalination chemicals'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'chlorine-dioxide-suppliers', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Chlorine Dioxide Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Chlorine Dioxide Suppliers', metaDescription: 'Chlorine dioxide suppliers.', intentKeywords: ['chlorine dioxide suppliers'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'ph-adjusters-buy', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'pH Adjusters Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'pH Adjusters Buy', metaDescription: 'pH adjusters buy.', intentKeywords: ['ph adjusters buy'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'corrosion-inhibitors-water', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Corrosion Inhibitors Water', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Corrosion Inhibitors Water', metaDescription: 'Corrosion inhibitors water.', intentKeywords: ['corrosion inhibitors water'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'industrial-stp-suppliers', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Industrial STP Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Industrial STP Suppliers', metaDescription: 'Industrial STP suppliers.', intentKeywords: ['industrial stp suppliers'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'municipal-water-treatment', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Municipal Water Treatment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Municipal Water Treatment', metaDescription: 'Municipal water treatment.', intentKeywords: ['municipal water treatment'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'zero-liquid-discharge-chemicals', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Zero Liquid Discharge Chemicals', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Zero Liquid Discharge Chemicals', metaDescription: 'Zero liquid discharge chemicals.', intentKeywords: ['zero liquid discharge chemicals'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },
  { slug: 'water-treatment-epc-supplies', canonicalSlug: 'water-treatment-chemicals-systems', h1: 'Water Treatment EPC Supplies', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Water Treatment EPC Supplies', metaDescription: 'Water treatment EPC supplies.', intentKeywords: ['water treatment epc supplies'], signalMapping: { category: 'water_treatment', subcategory: 'chemicals_systems', industry: 'water_infrastructure', buyer_type: 'industrial', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 80, successfulDealsCount: 190, typicalDealRange: { min: 500000, max: 80000000 }, deliveryTimeline: '5–20 days' },

  // 🏗 4. INDUSTRIAL STORAGE TANKS & SILOS (Canonical)
  {
    slug: 'industrial-storage-tanks-silos',
    h1: 'Industrial Storage Tanks & Silos Procurement',
    subheading: 'Bulk sourcing of storage tanks and silos for process industries and infrastructure projects.',
    bodyText: `ProcureSaathi manages industrial storage tank and silo procurement for process industries and EPC contractors.

We handle vendor qualification, fabrication oversight, and delivery.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Process industries', 'EPC projects', 'Grain storage', 'Chemical storage'],
    whatBuyerGets: ['Single consolidated price', 'Fabrication oversight', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['MS/SS Storage Tanks', 'Grain Silos', 'Chemical Tanks', 'GFS Tanks', 'Process Vessels'],
    metaTitle: 'Industrial Storage Tanks Procurement India | Silos Bulk Supply',
    metaDescription: 'Managed industrial storage tanks & silos procurement for process industries and EPC projects.',
    intentKeywords: ['industrial storage tanks', 'silos procurement', 'chemical storage tanks india'],
    signalMapping: {
      category: 'storage_tanks',
      subcategory: 'industrial_silos',
      industry: 'process_industry',
      buyer_type: 'epc',
      estimated_value_band: 'high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 70,
    successfulDealsCount: 150,
    typicalDealRange: { min: 1000000, max: 120000000 },
    deliveryTimeline: '20–90 days'
  },

  // Storage Tanks & Silos Aliases
  { slug: 'industrial-storage-tanks-buy', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Industrial Storage Tanks Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Industrial Storage Tanks Buy', metaDescription: 'Industrial storage tanks buy.', intentKeywords: ['industrial storage tanks buy'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'ms-storage-tanks-manufacturers', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'MS Storage Tanks Manufacturers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'MS Storage Tanks Manufacturers', metaDescription: 'MS storage tanks manufacturers.', intentKeywords: ['ms storage tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'ss-storage-tanks-suppliers', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'SS Storage Tanks Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'SS Storage Tanks Suppliers', metaDescription: 'SS storage tanks suppliers.', intentKeywords: ['ss storage tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'chemical-storage-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Chemical Storage Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Chemical Storage Tanks', metaDescription: 'Chemical storage tanks.', intentKeywords: ['chemical storage tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'fire-water-tanks-procurement', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Fire Water Tanks Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Fire Water Tanks Procurement', metaDescription: 'Fire water tanks procurement.', intentKeywords: ['fire water tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'grain-storage-silos', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Grain Storage Silos', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Grain Storage Silos', metaDescription: 'Grain storage silos.', intentKeywords: ['grain storage silos'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'flat-bottom-silos', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Flat Bottom Silos', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Flat Bottom Silos', metaDescription: 'Flat bottom silos.', intentKeywords: ['flat bottom silos'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'hopper-bottom-silos', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Hopper Bottom Silos', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Hopper Bottom Silos', metaDescription: 'Hopper bottom silos.', intentKeywords: ['hopper bottom silos'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'gfs-storage-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'GFS Storage Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'GFS Storage Tanks', metaDescription: 'GFS storage tanks.', intentKeywords: ['gfs storage tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'bolted-steel-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Bolted Steel Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Bolted Steel Tanks', metaDescription: 'Bolted steel tanks.', intentKeywords: ['bolted steel tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'glass-lined-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Glass Lined Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Glass Lined Tanks', metaDescription: 'Glass lined tanks.', intentKeywords: ['glass lined tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'liquid-storage-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Liquid Storage Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Liquid Storage Tanks', metaDescription: 'Liquid storage tanks.', intentKeywords: ['liquid storage tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'fuel-storage-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Fuel Storage Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Fuel Storage Tanks', metaDescription: 'Fuel storage tanks.', intentKeywords: ['fuel storage tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'industrial-silos-export', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Industrial Silos Export', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Industrial Silos Export', metaDescription: 'Industrial silos export.', intentKeywords: ['industrial silos export'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'cement-silos-suppliers', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Cement Silos Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Cement Silos Suppliers', metaDescription: 'Cement silos suppliers.', intentKeywords: ['cement silos suppliers'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'fertilizer-storage-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Fertilizer Storage Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Fertilizer Storage Tanks', metaDescription: 'Fertilizer storage tanks.', intentKeywords: ['fertilizer storage tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'water-storage-tanks-industrial', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Water Storage Tanks Industrial', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Water Storage Tanks Industrial', metaDescription: 'Water storage tanks industrial.', intentKeywords: ['water storage tanks industrial'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'sewage-treatment-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Sewage Treatment Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Sewage Treatment Tanks', metaDescription: 'Sewage treatment tanks.', intentKeywords: ['sewage treatment tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'bio-digester-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Bio Digester Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Bio Digester Tanks', metaDescription: 'Bio digester tanks.', intentKeywords: ['bio digester tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'petroleum-storage-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Petroleum Storage Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Petroleum Storage Tanks', metaDescription: 'Petroleum storage tanks.', intentKeywords: ['petroleum storage tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'tank-fabrication-epc', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Tank Fabrication EPC', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Tank Fabrication EPC', metaDescription: 'Tank fabrication EPC.', intentKeywords: ['tank fabrication epc'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'process-storage-vessels', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Process Storage Vessels', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Process Storage Vessels', metaDescription: 'Process storage vessels.', intentKeywords: ['process storage vessels'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },
  { slug: 'chemical-reactor-tanks', canonicalSlug: 'industrial-storage-tanks-silos', h1: 'Chemical Reactor Tanks', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Chemical Reactor Tanks', metaDescription: 'Chemical reactor tanks.', intentKeywords: ['chemical reactor tanks'], signalMapping: { category: 'storage_tanks', subcategory: 'industrial_silos', industry: 'process_industry', buyer_type: 'epc', estimated_value_band: 'high', signal_source: 'signal_page' }, verifiedSuppliersCount: 70, successfulDealsCount: 150, typicalDealRange: { min: 1000000, max: 120000000 }, deliveryTimeline: '20–90 days' },

  // 🏥 5. MEDICAL EQUIPMENT & DIAGNOSTIC DEVICES (Canonical)
  {
    slug: 'medical-equipment-diagnostics',
    h1: 'Medical Equipment & Diagnostic Devices Procurement',
    subheading: 'Bulk sourcing of medical equipment and diagnostic devices for hospitals and healthcare facilities.',
    bodyText: `ProcureSaathi manages medical equipment and diagnostic device procurement for hospitals and healthcare facilities.

We handle vendor qualification, compliance, and logistics.

Buyers do not interact with suppliers.
Suppliers operate as verified fulfilment partners.`,
    useCases: ['Hospitals', 'Diagnostic centers', 'Healthcare EPC'],
    whatBuyerGets: ['Single consolidated price', 'Regulatory compliance', 'Contract with ProcureSaathi Pvt Ltd'],
    specifications: ['Diagnostic Machines', 'ICU Equipment', 'Surgical Equipment', 'Lab Equipment', 'Patient Monitors'],
    metaTitle: 'Medical Equipment Procurement India | Hospital Diagnostics Bulk Supply',
    metaDescription: 'Managed medical equipment & diagnostic device procurement for hospitals and healthcare facilities.',
    intentKeywords: ['medical equipment procurement', 'hospital equipment bulk', 'diagnostic devices india'],
    signalMapping: {
      category: 'medical_healthcare',
      subcategory: 'diagnostic_equipment',
      industry: 'healthcare',
      buyer_type: 'hospital',
      estimated_value_band: 'very_high',
      signal_source: 'signal_page'
    },
    verifiedSuppliersCount: 65,
    successfulDealsCount: 130,
    typicalDealRange: { min: 2000000, max: 200000000 },
    deliveryTimeline: '15–60 days'
  },

  // Medical Equipment Aliases
  { slug: 'medical-equipment-suppliers', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Medical Equipment Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Medical Equipment Suppliers', metaDescription: 'Medical equipment suppliers.', intentKeywords: ['medical equipment suppliers'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'hospital-equipment-procurement', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Hospital Equipment Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Hospital Equipment Procurement', metaDescription: 'Hospital equipment procurement.', intentKeywords: ['hospital equipment procurement'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'diagnostic-machines-buy', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Diagnostic Machines Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Diagnostic Machines Buy', metaDescription: 'Diagnostic machines buy.', intentKeywords: ['diagnostic machines buy'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'xray-machine-suppliers', canonicalSlug: 'medical-equipment-diagnostics', h1: 'X-Ray Machine Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'X-Ray Machine Suppliers', metaDescription: 'X-ray machine suppliers.', intentKeywords: ['xray machine suppliers'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'ct-scan-equipment', canonicalSlug: 'medical-equipment-diagnostics', h1: 'CT Scan Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'CT Scan Equipment', metaDescription: 'CT scan equipment.', intentKeywords: ['ct scan equipment'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'mri-machine-procurement', canonicalSlug: 'medical-equipment-diagnostics', h1: 'MRI Machine Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'MRI Machine Procurement', metaDescription: 'MRI machine procurement.', intentKeywords: ['mri machine procurement'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'patient-monitor-suppliers', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Patient Monitor Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Patient Monitor Suppliers', metaDescription: 'Patient monitor suppliers.', intentKeywords: ['patient monitor suppliers'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'icu-equipment-buy', canonicalSlug: 'medical-equipment-diagnostics', h1: 'ICU Equipment Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'ICU Equipment Buy', metaDescription: 'ICU equipment buy.', intentKeywords: ['icu equipment buy'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'ventilator-suppliers', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Ventilator Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Ventilator Suppliers', metaDescription: 'Ventilator suppliers.', intentKeywords: ['ventilator suppliers'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'lab-diagnostic-equipment', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Lab Diagnostic Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Lab Diagnostic Equipment', metaDescription: 'Lab diagnostic equipment.', intentKeywords: ['lab diagnostic equipment'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'pathology-lab-machines', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Pathology Lab Machines', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Pathology Lab Machines', metaDescription: 'Pathology lab machines.', intentKeywords: ['pathology lab machines'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'hospital-furniture-procurement', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Hospital Furniture Procurement', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Hospital Furniture Procurement', metaDescription: 'Hospital furniture procurement.', intentKeywords: ['hospital furniture procurement'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'rehabilitation-equipment', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Rehabilitation Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Rehabilitation Equipment', metaDescription: 'Rehabilitation equipment.', intentKeywords: ['rehabilitation equipment'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'surgical-equipment-suppliers', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Surgical Equipment Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Surgical Equipment Suppliers', metaDescription: 'Surgical equipment suppliers.', intentKeywords: ['surgical equipment suppliers'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'medical-devices-export', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Medical Devices Export', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Medical Devices Export', metaDescription: 'Medical devices export.', intentKeywords: ['medical devices export'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'ultrasound-machine-buy', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Ultrasound Machine Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Ultrasound Machine Buy', metaDescription: 'Ultrasound machine buy.', intentKeywords: ['ultrasound machine buy'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'ecg-machines-suppliers', canonicalSlug: 'medical-equipment-diagnostics', h1: 'ECG Machines Suppliers', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'ECG Machines Suppliers', metaDescription: 'ECG machines suppliers.', intentKeywords: ['ecg machines suppliers'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'dialysis-equipment', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Dialysis Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Dialysis Equipment', metaDescription: 'Dialysis equipment.', intentKeywords: ['dialysis equipment'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'neonatal-care-equipment', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Neonatal Care Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Neonatal Care Equipment', metaDescription: 'Neonatal care equipment.', intentKeywords: ['neonatal care equipment'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'operation-theatre-equipment', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Operation Theatre Equipment', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Operation Theatre Equipment', metaDescription: 'Operation theatre equipment.', intentKeywords: ['operation theatre equipment'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'healthcare-epc-supplies', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Healthcare EPC Supplies', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Healthcare EPC Supplies', metaDescription: 'Healthcare EPC supplies.', intentKeywords: ['healthcare epc supplies'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' },
  { slug: 'medical-infrastructure-buy', canonicalSlug: 'medical-equipment-diagnostics', h1: 'Medical Infrastructure Buy', subheading: '', bodyText: '', useCases: [], whatBuyerGets: [], metaTitle: 'Medical Infrastructure Buy', metaDescription: 'Medical infrastructure buy.', intentKeywords: ['medical infrastructure buy'], signalMapping: { category: 'medical_healthcare', subcategory: 'diagnostic_equipment', industry: 'healthcare', buyer_type: 'hospital', estimated_value_band: 'very_high', signal_source: 'signal_page' }, verifiedSuppliersCount: 65, successfulDealsCount: 130, typicalDealRange: { min: 2000000, max: 200000000 }, deliveryTimeline: '15–60 days' }
];

export function getSignalPageBySlug(slug: string): SignalPageConfig | undefined {
  const normalized = slug.toLowerCase().trim();

  const page = signalPagesConfig.find(
    p => p.slug.toLowerCase() === normalized
  );

  if (!page) return undefined;

  // Handle canonical redirects with loop protection
  if (page.canonicalSlug) {
    const canonical = signalPagesConfig.find(
      p => p.slug === page.canonicalSlug
    );

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

// =======================================================
// COUNTRY-AWARE SIGNAL PAGE RESOLVER (GEO REPLICATION)
// =======================================================

/**
 * Get a signal page config enriched with country-specific metadata.
 * Used for geo-replicated demand intelligence (e.g., /uae/procurement/tmt-bars-epc-projects)
 */
export function getSignalPageBySlugWithCountry(
  slug: string,
  countryCode?: string
): CountryEnrichedSignalPageConfig | undefined {
  const basePage = getSignalPageBySlug(slug);
  if (!basePage) return undefined;

  // Resolve country info
  const countryInfo = countryCode 
    ? getCountryByCode(countryCode) || DEFAULT_COUNTRY
    : DEFAULT_COUNTRY;

  const isIndia = countryInfo.code === 'india';

  // Generate country-specific SEO metadata
  const countryMetaTitle = isIndia
    ? basePage.metaTitle
    : `${basePage.metaTitle} | ${countryInfo.seoLabel}`;

  const countryMetaDescription = isIndia
    ? basePage.metaDescription
    : `${basePage.metaDescription} Now delivering to ${countryInfo.seoLabel}.`;

  // Generate logistics line
  const logisticsLine = isIndia
    ? countryInfo.logisticsHint
    : `Delivery supported across ${countryInfo.seoLabel} via ProcureSaathi's managed export desk.`;

  return {
    ...basePage,
    countryInfo,
    countryMetaTitle,
    countryMetaDescription,
    logisticsLine
  };
}

export function getAllSignalPageSlugs(): string[] {
  return signalPagesConfig.map(page => page.slug);
}

// Get all canonical (non-alias) slugs
export function getCanonicalSignalPageSlugs(): string[] {
  return signalPagesConfig
    .filter(page => !page.canonicalSlug)
    .map(page => page.slug);
}
