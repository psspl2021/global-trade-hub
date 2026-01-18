// Signal Page Configuration - Demand Intelligence Entry Points
// Each page captures high-intent procurement signals and feeds into the Demand Intelligence Engine

export interface SignalPageConfig {
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  subheadline: string;
  targetBuyers: string[];
  highIntentQueries: string[];
  industries: string[];
  estimatedDealRange: { min: number; max: number };
  deliveryTimeline: string;
  verifiedSuppliersCount: number;
  successfulDealsCount: number;
  features: string[];
  specifications: string[];
  certifications: string[];
}

export const signalPagesConfig: SignalPageConfig[] = [
  {
    slug: 'structural-steel-infrastructure',
    category: 'Metals - Ferrous (Steel, Iron)',
    subcategory: 'Structural Steel',
    title: 'Structural Steel Procurement – Infrastructure Projects',
    metaTitle: 'Structural Steel Procurement for Infrastructure | Managed Sourcing India',
    metaDescription: 'Managed structural steel procurement for large infrastructure projects. I-Beam, H-Beam, Metro & Bridge steel. Single counterparty. Verified fulfilment. No supplier interaction.',
    headline: 'Managed Structural Steel Procurement for Large Infrastructure Projects',
    subheadline: 'Single counterparty. Verified fulfilment. No supplier interaction.',
    targetBuyers: ['EPC contractors', 'Infra developers', 'Metro projects', 'Highway projects'],
    highIntentQueries: ['structural steel supply for infra', 'I beam H beam procurement India', 'steel for bridges metro', 'structural steel bulk order'],
    industries: ['construction_infrastructure', 'metro_rail', 'highways', 'power_plants'],
    estimatedDealRange: { min: 5000000, max: 500000000 },
    deliveryTimeline: '15-45 days',
    verifiedSuppliersCount: 85,
    successfulDealsCount: 127,
    features: [
      'Direct mill pricing for bulk orders',
      'Project-specific grade availability (E250, E350, E450)',
      'Mill test certificates with every consignment',
      'Site delivery across India'
    ],
    specifications: ['I-Beam (ISMB, ISJB)', 'H-Beam (ISHB, UC, UB)', 'Channels (ISMC, ISJC)', 'Angles (ISA)', 'Plates (IS 2062)', 'WPB & NPB Sections'],
    certifications: ['BIS certified', 'IS 2062:2011', 'IS 808', 'ASTM A36']
  },
  {
    slug: 'tmt-bars-epc-projects',
    category: 'Metals - Ferrous (Steel, Iron)',
    subcategory: 'TMT Bars',
    title: 'TMT Bars Procurement – Government & EPC Projects',
    metaTitle: 'TMT Bars Bulk Procurement for EPC & Govt Projects | Verified Suppliers India',
    metaDescription: 'Bulk TMT bar procurement for government contractors and EPC projects. Fe500, Fe500D, Fe550D grades. BIS certified. State-wise project supply. Single contract fulfilment.',
    headline: 'Bulk TMT Bars Procurement for Government & EPC Projects',
    subheadline: 'Volume + repeat demand = predictable revenue. Managed fulfilment.',
    targetBuyers: ['Govt contractors', 'Road & bridge EPCs', 'Housing projects', 'Industrial construction'],
    highIntentQueries: ['bulk TMT procurement', 'Fe500 Fe550 supply', 'TMT bars for govt project', 'state-wise TMT order'],
    industries: ['construction_infrastructure', 'housing', 'government_projects', 'industrial_construction'],
    estimatedDealRange: { min: 2000000, max: 200000000 },
    deliveryTimeline: '7-21 days',
    verifiedSuppliersCount: 120,
    successfulDealsCount: 312,
    features: [
      'All major brands: TATA, JSW, SAIL, Jindal, Kamdhenu',
      'Direct mill and stockist options',
      'Project financing support',
      'State-wise delivery network'
    ],
    specifications: ['Fe415', 'Fe500', 'Fe500D', 'Fe550', 'Fe550D', 'CRS', 'TMT rebars 8mm-40mm'],
    certifications: ['BIS IS 1786:2008', 'ISI marked', 'Mill Test Certificate']
  },
  {
    slug: 'hot-rolled-coil-industrial',
    category: 'Metals - Ferrous (Steel, Iron)',
    subcategory: 'Hot Rolled Coil',
    title: 'Hot Rolled Coil (HRC) Procurement – Industrial Buyers',
    metaTitle: 'HRC Hot Rolled Coil Procurement for Industrial Buyers India',
    metaDescription: 'Hot Rolled Coil procurement for fabricators, OEMs, PEB manufacturers. IS 2062 grades. Domestic and import options. Bulk purchase. Verified steel suppliers.',
    headline: 'Hot Rolled Coil Procurement for Industrial Manufacturing',
    subheadline: 'Fabricators, OEMs, PEB manufacturers. Domestic + import sourcing.',
    targetBuyers: ['Fabricators', 'OEMs', 'PEB manufacturers', 'Auto component makers'],
    highIntentQueries: ['HRC IS 2062', 'hot rolled coil bulk purchase', 'HRC domestic import', 'steel coil for manufacturing'],
    industries: ['manufacturing', 'automotive', 'peb_structures', 'heavy_engineering'],
    estimatedDealRange: { min: 3000000, max: 100000000 },
    deliveryTimeline: '10-30 days',
    verifiedSuppliersCount: 65,
    successfulDealsCount: 189,
    features: [
      'Multiple thickness options (1.6mm - 25mm)',
      'Width range: 900mm - 2000mm',
      'Domestic mills + import from Korea, Japan, China',
      'Slitting and cutting services available'
    ],
    specifications: ['IS 2062 E250 A/B/C', 'IS 2062 E350 A/B/C', 'ASTM A36', 'SAE 1008/1010', 'Commercial Quality (CQ)', 'Drawing Quality (DQ)'],
    certifications: ['IS 2062:2011', 'ASTM certified', 'Mill Test Certificate']
  },
  {
    slug: 'peb-steel-structures',
    category: 'Metals - Ferrous (Steel, Iron)',
    subcategory: 'PEB Steel',
    title: 'Pre-Engineered Building (PEB) Steel Procurement',
    metaTitle: 'PEB Steel Structures Procurement | Warehouses, Factories India',
    metaDescription: 'PEB steel structure procurement for warehouses, factories, logistics parks. Custom fabrication. Time-bound delivery. High margin category with verified suppliers.',
    headline: 'PEB Steel Structures for Warehouses & Industrial Facilities',
    subheadline: 'Custom fabrication. Time-bound delivery. High margin category.',
    targetBuyers: ['Warehouse developers', 'Factory builders', 'Logistics parks', 'Cold storage projects'],
    highIntentQueries: ['PEB structure steel', 'custom steel fabrication', 'warehouse steel structure', 'time-bound steel delivery'],
    industries: ['warehousing', 'manufacturing', 'logistics', 'cold_chain'],
    estimatedDealRange: { min: 10000000, max: 300000000 },
    deliveryTimeline: '30-60 days',
    verifiedSuppliersCount: 45,
    successfulDealsCount: 78,
    features: [
      'Complete design to delivery solution',
      'In-house fabrication partners',
      'Erection support available',
      'Turnkey project capability'
    ],
    specifications: ['Primary Frames', 'Secondary Members', 'Purlins & Girts', 'Roof Sheeting', 'Wall Cladding', 'Accessories & Fasteners'],
    certifications: ['ISO 9001 fabricators', 'AWS D1.1', 'IS 800:2007 compliance']
  },
  {
    slug: 'colour-coated-steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    subcategory: 'Colour Coated Steel',
    title: 'Colour Coated Steel Procurement – Roofing & Cladding',
    metaTitle: 'Colour Coated Steel PPGL PPGI Procurement | Roofing Sheets India',
    metaDescription: 'Colour coated steel procurement for industrial sheds, commercial buildings. PPGL, PPGI, roofing sheets. Export quality available. Bulk orders with verified suppliers.',
    headline: 'Colour Coated Steel for Roofing & Cladding Projects',
    subheadline: 'Industrial sheds, commercial buildings, export projects.',
    targetBuyers: ['Industrial sheds', 'Commercial buildings', 'Export projects', 'Roofing contractors'],
    highIntentQueries: ['PPGL PPGI', 'roofing sheets bulk', 'export quality steel', 'colour coated coils'],
    industries: ['construction_infrastructure', 'commercial_real_estate', 'industrial_construction', 'export'],
    estimatedDealRange: { min: 1000000, max: 50000000 },
    deliveryTimeline: '10-25 days',
    verifiedSuppliersCount: 55,
    successfulDealsCount: 145,
    features: [
      'Multiple coating types: Polyester, SMP, PVDF',
      'RAL colour matching available',
      'Profile cutting to length',
      'Export quality with certifications'
    ],
    specifications: ['PPGL (Pre-painted Galvalume)', 'PPGI (Pre-painted Galvanized)', '0.35mm - 0.80mm thickness', 'AZ50-AZ150 coating', 'Z80-Z275 zinc coating'],
    certifications: ['IS 15961', 'ASTM A653', 'EN 10346', 'Export certifications']
  },
  {
    slug: 'aluminium-industrial-export',
    category: 'Metals - Non-Ferrous',
    subcategory: 'Aluminium',
    title: 'Aluminium Procurement – Industrial & Export Orders',
    metaTitle: 'Industrial Aluminium Procurement | 6061 7075 Grades Export India',
    metaDescription: 'Aluminium procurement for auto, aerospace, exporters. 6061, 7075 grades. AMS, ASTM specifications. Export documentation support. Strategic global category.',
    headline: 'Industrial Aluminium Procurement for Manufacturing & Export',
    subheadline: 'Auto, aerospace, exporters. AMS/ASTM grades. Global supply chain.',
    targetBuyers: ['Auto manufacturers', 'Aerospace industry', 'Exporters', 'Electronics OEMs'],
    highIntentQueries: ['aluminium 6061 7075', 'AMS ASTM aluminium grades', 'aluminium export documentation', 'industrial aluminium bulk'],
    industries: ['automotive', 'aerospace', 'electronics', 'export'],
    estimatedDealRange: { min: 2000000, max: 150000000 },
    deliveryTimeline: '15-40 days',
    verifiedSuppliersCount: 40,
    successfulDealsCount: 92,
    features: [
      'Primary & secondary aluminium',
      'Sheets, plates, extrusions, bars',
      'Custom extrusion die support',
      'International grade matching'
    ],
    specifications: ['6061-T6', '6063-T5', '7075-T6', '5052-H32', '1100-H14', 'Cast alloys (LM6, LM25)'],
    certifications: ['ASTM B209', 'AMS 4027', 'EN 573-3', 'Mill Test Certificate']
  },
  {
    slug: 'non-ferrous-metals',
    category: 'Metals - Non-Ferrous',
    subcategory: 'Copper & Brass',
    title: 'Copper & Non-Ferrous Metals Procurement',
    metaTitle: 'Copper Cathode Rods Non-Ferrous Metals Procurement India',
    metaDescription: 'Copper cathode, copper rods, non-ferrous metals bulk supply. For electrical, power, OEM industries. Verified suppliers. Managed procurement.',
    headline: 'Copper & Non-Ferrous Metals for Electrical & Power Industries',
    subheadline: 'Electrical, power, OEMs. Cathodes, rods, strips. Verified supply.',
    targetBuyers: ['Electrical manufacturers', 'Power equipment OEMs', 'Cable manufacturers', 'Transformer makers'],
    highIntentQueries: ['copper cathode', 'copper rods bulk', 'non-ferrous bulk supply', 'electrical copper'],
    industries: ['electrical_equipment', 'power_generation', 'cable_wire', 'transformers'],
    estimatedDealRange: { min: 5000000, max: 200000000 },
    deliveryTimeline: '10-30 days',
    verifiedSuppliersCount: 35,
    successfulDealsCount: 67,
    features: [
      'LME linked pricing available',
      'Import and domestic options',
      'Custom sizes and forms',
      'Consistent quality supply'
    ],
    specifications: ['Copper Cathode (Grade A)', 'ETP Copper Rods', 'Copper Strips', 'Brass Sheets', 'Phosphor Bronze', 'Copper Wire Rod'],
    certifications: ['LME Grade A', 'IS 191', 'ASTM B115', 'EN 1652']
  },
  {
    slug: 'cement-bulk-infra',
    category: 'Building & Construction',
    subcategory: 'Cement',
    title: 'Cement Procurement – Infra & Bulk Buyers',
    metaTitle: 'Bulk Cement Procurement for Infrastructure Projects India',
    metaDescription: 'Bulk cement supply for infra companies, RMC plants. Project-based pricing. Logistics-heavy fulfilment. All major brands. Verified suppliers.',
    headline: 'Bulk Cement Procurement for Infrastructure & RMC Plants',
    subheadline: 'Project-based pricing. Logistics-heavy fulfilment. All brands.',
    targetBuyers: ['Infra companies', 'RMC plants', 'Real estate developers', 'Government contractors'],
    highIntentQueries: ['bulk cement supply', 'project cement pricing', 'RMC cement procurement', 'infra cement order'],
    industries: ['construction_infrastructure', 'rmc_plants', 'real_estate', 'government_projects'],
    estimatedDealRange: { min: 1000000, max: 100000000 },
    deliveryTimeline: '3-15 days',
    verifiedSuppliersCount: 75,
    successfulDealsCount: 234,
    features: [
      'All major brands: UltraTech, ACC, Ambuja, Shree, Dalmia',
      'OPC and PPC grades available',
      'Direct ex-factory dispatch',
      'Pan-India logistics network'
    ],
    specifications: ['OPC 43 Grade', 'OPC 53 Grade', 'PPC', 'PSC', 'Composite Cement', 'White Cement'],
    certifications: ['BIS IS 269', 'IS 1489', 'IS 455', 'ISO 9001 plants']
  },
  {
    slug: 'industrial-pipes-tubes',
    category: 'Metals - Ferrous (Steel, Iron)',
    subcategory: 'Pipes & Tubes',
    title: 'Industrial Pipes & Tubes Procurement',
    metaTitle: 'Industrial Steel Pipes Tubes Procurement | Oil Gas Water Projects',
    metaDescription: 'MS, GI, seamless pipes procurement for oil & gas, water projects, process industries. ASTM, API specifications. Project delivery timelines. Verified suppliers.',
    headline: 'Industrial Pipes & Tubes for Oil, Gas & Water Projects',
    subheadline: 'MS, GI, Seamless. ASTM/API specs. Project timeline delivery.',
    targetBuyers: ['Oil & gas contractors', 'Water projects', 'Process industries', 'Petrochemical plants'],
    highIntentQueries: ['MS GI seamless pipes', 'ASTM API pipe specs', 'project pipe delivery', 'industrial pipes bulk'],
    industries: ['oil_gas', 'water_treatment', 'petrochemical', 'power_plants'],
    estimatedDealRange: { min: 2000000, max: 150000000 },
    deliveryTimeline: '15-45 days',
    verifiedSuppliersCount: 60,
    successfulDealsCount: 156,
    features: [
      'ERW, Seamless, SAW pipes',
      'Size range: 1/2" to 48"',
      'IBR approved for boilers',
      'Third party inspection support'
    ],
    specifications: ['MS ERW Pipes (IS 1239, IS 3589)', 'GI Pipes (IS 1239)', 'Seamless Pipes (IS 1978, ASTM A106)', 'API 5L Grade B/X42/X52/X60', 'SS Pipes (ASTM A312)'],
    certifications: ['API 5L', 'ASTM A106', 'IBR approved', 'IS 1239 Part 1 & 2']
  },
  {
    slug: 'export-industrial-materials',
    category: 'Metals - Ferrous (Steel, Iron)',
    subcategory: 'Export',
    title: 'Export Procurement Desk – India → GCC / Africa',
    metaTitle: 'India Steel Export Procurement | GCC Africa CIF FOB',
    metaDescription: 'India export procurement desk for international buyers. Steel, metals to GCC, Africa. CIF, FOB terms. Export documentation. Global presence anchor.',
    headline: 'Export Procurement Desk: India → GCC / Africa',
    subheadline: 'International buyers. CIF/FOB terms. Complete export support.',
    targetBuyers: ['International buyers', 'Traders', 'EPCs outside India', 'Import houses'],
    highIntentQueries: ['India export steel', 'GCC procurement from India', 'CIF FOB steel requirements', 'Africa steel import India'],
    industries: ['international_trade', 'construction_infrastructure', 'manufacturing', 'trading'],
    estimatedDealRange: { min: 10000000, max: 500000000 },
    deliveryTimeline: '30-60 days',
    verifiedSuppliersCount: 50,
    successfulDealsCount: 89,
    features: [
      'Complete export documentation',
      'Port clearance support',
      'LC/BG handling',
      'Quality inspection before shipment'
    ],
    specifications: ['TMT Bars', 'HRC/CRC Coils', 'Structural Steel', 'Pipes & Tubes', 'Aluminium Products', 'Industrial Chemicals'],
    certifications: ['Export house certified', 'ISO 9001', 'DGFT registered', 'Chamber of Commerce']
  }
];

export function getSignalPageBySlug(slug: string): SignalPageConfig | undefined {
  return signalPagesConfig.find(page => page.slug === slug);
}

export function getAllSignalPageSlugs(): string[] {
  return signalPagesConfig.map(page => page.slug);
}
