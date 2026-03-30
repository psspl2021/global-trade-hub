/**
 * Scalable Demand Product Taxonomy
 * Lightweight metadata for auto-generating 1200+ word procurement pages.
 * Rich content is generated at render time by the content engine.
 */

import gfrpSheetsImg from '@/assets/products/gfrp-sheets.jpg';
import gfrpGratingsImg from '@/assets/products/gfrp-gratings.jpg';
import gfrpPanelsImg from '@/assets/products/gfrp-panels.jpg';
import gfrpPipesImg from '@/assets/products/gfrp-pipes.jpg';
import frpTanksImg from '@/assets/products/frp-tanks.jpg';
import gfrpRebarsImg from '@/assets/products/gfrp-rebars.jpg';

export interface DemandProduct {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  industrySlug: string;
  subIndustrySlug: string;
  /** Short description of what the product is */
  definition: string;
  /** Key industries that procure this */
  industries: string[];
  /** Key grades / variants */
  grades: string[];
  /** Specifications (thickness, sizes, standards) */
  specifications: string[];
  /** Common standards */
  standards: string[];
  /** HSN codes */
  hsnCodes: string[];
  /** Typical order sizes */
  orderSizes: string;
  /** Import source countries */
  importCountries: string[];
  /** Related product slugs */
  relatedSlugs: string[];
  /** Typical price range description */
  priceRange: string;
  /** Key applications */
  applications: string[];
  /** Procurement challenges */
  challenges: string[];
  /** Market trend summary */
  marketTrend: string;
  /** Optional hero image path */
  heroImage?: string;
  /** Alt text for hero image */
  heroImageAlt?: string;
}

function createSlug(product: string): string {
  return product
    .toLowerCase()
    .replace(/[&,()]/g, '')
    .replace(/\s+/g, '-')
    + '-india';
}

// ─── METALS - FERROUS ───────────────────────────────────────────
const ferrousProducts: DemandProduct[] = [
  {
    slug: createSlug('HR Coil'),
    name: 'HR Coil',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Hot Rolled (HR) Coils are flat steel products produced by rolling heated steel slabs through high-pressure rollers at temperatures above 926°C. They are the most widely consumed steel product globally, forming the base material for cold rolling, pipe manufacturing, structural fabrication, and automotive stamping.',
    industries: ['Construction', 'Automotive', 'Infrastructure', 'Shipbuilding', 'Heavy Engineering', 'Pipe Manufacturing'],
    grades: ['IS 2062 E250A', 'IS 2062 E250BR', 'IS 2062 E350', 'SAE 1006', 'SAE 1008', 'SAE 1010', 'ASTM A36', 'SS400', 'Q235B', 'S275JR'],
    specifications: ['Thickness: 1.2mm – 25mm', 'Width: 900mm – 2000mm', 'Coil weight: 5 MT – 30 MT', 'Surface: Mill finish / Pickled & Oiled'],
    standards: ['IS 2062', 'IS 1079', 'ASTM A36', 'JIS G3101', 'EN 10025'],
    hsnCodes: ['7208'],
    orderSizes: '50 MT to 500 MT per order',
    importCountries: ['Japan', 'South Korea', 'Vietnam', 'China', 'Indonesia', 'Ukraine', 'Russia'],
    relatedSlugs: ['cr-coil-india', 'hr-sheet-india', 'ms-plates-india', 'galvanized-coils-india', 'chequered-plates-india', 'color-coated-sheets-india'],
    priceRange: '₹48,000 – ₹62,000 per MT',
    applications: ['Structural steel fabrication', 'Automotive body panels and chassis', 'Ship hull plates', 'Pipe and tube manufacturing (ERW/SAW)', 'Storage tank shells', 'Railway wagon components'],
    challenges: ['Price volatility linked to iron ore and coking coal', 'Grade-specific width and thickness availability', 'Mill lead times of 4–8 weeks for non-standard sizes', 'Import duty and anti-dumping considerations'],
    marketTrend: 'India\'s HR coil demand is growing at 6–8% CAGR driven by infrastructure spending under NIP (National Infrastructure Pipeline) and automotive production expansion. Domestic capacity additions by JSW, Tata, and AMNS India are increasing availability.'
  },
  {
    slug: createSlug('CR Coil'),
    name: 'CR Coil',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Cold Rolled (CR) Coils are produced by further processing HR coils at room temperature through cold reduction mills. This process provides tighter thickness tolerance, superior surface finish, and improved mechanical properties. CR coils are the primary input for automotive panels, appliance bodies, and precision components.',
    industries: ['Automotive', 'White Goods', 'Electrical Equipment', 'Furniture', 'Construction', 'Packaging'],
    grades: ['IS 513 CR1', 'IS 513 CR2', 'IS 513 CR3', 'IS 513 CR4', 'IS 513 CR5', 'SPCC', 'SPCD', 'SPCE', 'DC01', 'DC03', 'DC04'],
    specifications: ['Thickness: 0.15mm – 3.0mm', 'Width: 600mm – 1500mm', 'Surface finish: Bright / Matt / Dull', 'Temper: Full Hard / Half Hard / Annealed'],
    standards: ['IS 513', 'IS 1079', 'JIS G3141', 'EN 10130', 'ASTM A1008'],
    hsnCodes: ['7209'],
    orderSizes: '20 MT to 200 MT per order',
    importCountries: ['Japan', 'South Korea', 'China', 'Taiwan', 'Vietnam', 'Ukraine', 'Germany'],
    relatedSlugs: ['hr-coil-india', 'cr-sheet-india', 'galvanized-coils-india', 'color-coated-sheets-india', 'ms-plates-india'],
    priceRange: '₹55,000 – ₹72,000 per MT',
    applications: ['Automotive body panels and stamped components', 'Refrigerator and washing machine bodies', 'Electrical panel enclosures', 'Steel furniture', 'Roofing and cladding substrates', 'Tin plate manufacturing'],
    challenges: ['Tight tolerance requirements (±0.02mm)', 'Surface quality demands for painted applications', 'Long lead times for drawing grades (CR4/CR5)', 'Premium pricing over HR coil (₹8,000–₹12,000/MT)'],
    marketTrend: 'CR coil demand in India is driven by automotive production growth and white goods manufacturing expansion. JSW, Tata Steel, and AMNS India are the major domestic producers.'
  },
  {
    slug: createSlug('CR Sheet'),
    name: 'CR Sheet',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Cold Rolled (CR) Sheets are cut-to-length products derived from CR coils. They offer precise dimensional accuracy and smooth surface finish, making them ideal for fabrication, bending, and forming operations in automotive, appliance, and general engineering applications.',
    industries: ['Automotive', 'Appliances', 'General Engineering', 'Electrical', 'Furniture Manufacturing'],
    grades: ['IS 513 CR1', 'IS 513 CR2', 'IS 513 CR3', 'IS 513 CR4', 'SPCC', 'DC01', 'DC04'],
    specifications: ['Thickness: 0.3mm – 3.0mm', 'Width: 900mm – 1500mm', 'Length: 2000mm – 6000mm', 'Flatness tolerance: ≤5mm/m'],
    standards: ['IS 513', 'JIS G3141', 'EN 10130'],
    hsnCodes: ['7209'],
    orderSizes: '10 MT to 100 MT per order',
    importCountries: ['South Korea', 'Japan', 'China', 'Vietnam', 'Taiwan'],
    relatedSlugs: ['cr-coil-india', 'hr-sheet-india', 'ms-plates-india', 'galvanized-coils-india'],
    priceRange: '₹58,000 – ₹75,000 per MT',
    applications: ['Precision stamping and forming', 'Appliance outer panels', 'Furniture components', 'Electrical enclosures', 'Signage and display panels'],
    challenges: ['Sheet flatness requirements for CNC processing', 'Edge condition specifications (trimmed vs mill edge)', 'Minimum order quantities from mills'],
    marketTrend: 'Growing demand from automotive tier-2 suppliers and the expanding electrical panel manufacturing sector in India.'
  },
  {
    slug: createSlug('HR Sheet'),
    name: 'HR Sheet',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Hot Rolled (HR) Sheets are cut-to-length flat steel products derived from HR coils. They are used in structural fabrication, general engineering, ship building, and heavy equipment manufacturing where surface finish is less critical than strength and formability.',
    industries: ['Construction', 'Heavy Engineering', 'Shipbuilding', 'Railway', 'Agricultural Equipment'],
    grades: ['IS 2062 E250A', 'IS 2062 E250BR', 'IS 2062 E350', 'ASTM A36', 'SS400'],
    specifications: ['Thickness: 1.6mm – 25mm', 'Width: 900mm – 2000mm', 'Length: 2000mm – 12000mm'],
    standards: ['IS 2062', 'ASTM A36', 'JIS G3101'],
    hsnCodes: ['7208'],
    orderSizes: '20 MT to 200 MT per order',
    importCountries: ['Japan', 'South Korea', 'Vietnam', 'China', 'Indonesia', 'Ukraine', 'Turkey'],
    relatedSlugs: ['hr-coil-india', 'ms-plates-india', 'cr-sheet-india', 'chequered-plates-india'],
    priceRange: '₹50,000 – ₹65,000 per MT',
    applications: ['Structural steel fabrication', 'Bridge and flyover components', 'Ship hull panels', 'Heavy equipment chassis', 'Agricultural implement manufacturing'],
    challenges: ['Dimensional tolerance for thick gauges', 'Surface oxide scale removal for painting', 'Logistics for oversized sheets'],
    marketTrend: 'Infrastructure push under Bharatmala and Sagarmala driving sustained demand for HR sheets in India.'
  },
  {
    slug: createSlug('Chequered Plates'),
    name: 'Chequered Plates',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Chequered Plates (also called checker plates or diamond plates) are steel plates with raised patterns on one surface providing anti-slip properties. They are extensively used in flooring, staircase treads, platform covers, and vehicle bodies where slip resistance is critical for safety.',
    industries: ['Construction', 'Industrial Flooring', 'Transport', 'Oil & Gas', 'Marine'],
    grades: ['IS 3502', 'IS 2062 E250A', 'ASTM A36', 'SS400'],
    specifications: ['Thickness: 2.0mm – 12mm', 'Width: 1000mm – 2000mm', 'Pattern height: 1.0mm – 2.5mm', 'Pattern: Diamond / Teardrop'],
    standards: ['IS 3502', 'IS 2062', 'JIS G3101'],
    hsnCodes: ['7208'],
    orderSizes: '10 MT to 100 MT per order',
    importCountries: ['China', 'Vietnam', 'South Korea', 'Japan', 'Indonesia'],
    relatedSlugs: ['hr-sheet-india', 'ms-plates-india', 'hr-coil-india', 'structural-steel-india'],
    priceRange: '₹52,000 – ₹68,000 per MT',
    applications: ['Industrial flooring and walkways', 'Staircase treads', 'Truck and trailer flooring', 'Platform and mezzanine floors', 'Loading dock ramps'],
    challenges: ['Pattern consistency across batches', 'Weight calculation includes pattern height', 'Limited availability in thick gauges'],
    marketTrend: 'Growing demand from industrial construction and commercial vehicle manufacturing sectors.'
  },
  {
    slug: createSlug('Galvanized Coils'),
    name: 'Galvanized Coils',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Galvanized Coils are steel coils coated with a layer of zinc through hot-dip galvanizing process, providing excellent corrosion resistance. They are essential for roofing, construction, automotive, and general engineering applications where long-term durability against rust is critical.',
    industries: ['Construction', 'Roofing', 'Automotive', 'White Goods', 'HVAC', 'Solar Structures'],
    grades: ['IS 277 Z120', 'IS 277 Z180', 'IS 277 Z275', 'SGCC', 'DX51D+Z', 'ASTM A653 CS-B'],
    specifications: ['Thickness: 0.2mm – 3.0mm', 'Width: 600mm – 1500mm', 'Zinc coating: 60–275 g/m²', 'Spangle: Regular / Minimized / Zero'],
    standards: ['IS 277', 'JIS G3302', 'EN 10346', 'ASTM A653'],
    hsnCodes: ['7210'],
    orderSizes: '20 MT to 200 MT per order',
    importCountries: ['South Korea', 'Japan', 'China', 'Vietnam', 'Indonesia', 'Taiwan', 'Turkey'],
    relatedSlugs: ['color-coated-sheets-india', 'cr-coil-india', 'hr-coil-india', 'gi-pipes-india'],
    priceRange: '₹58,000 – ₹78,000 per MT',
    applications: ['Roofing and cladding sheets', 'Pre-engineered building components', 'Automotive underbody panels', 'HVAC ductwork', 'Solar panel mounting structures', 'Cable trays and electrical enclosures'],
    challenges: ['Zinc coating weight specifications per application', 'Spangle type selection for painted applications', 'Import anti-dumping duty impact on pricing'],
    marketTrend: 'Strong demand driven by pre-engineered building construction, solar energy infrastructure, and automotive galvanization mandates.'
  },
  {
    slug: createSlug('Color Coated Sheets'),
    name: 'Color Coated Sheets',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Color Coated Sheets (also known as PPGI/PPGL or pre-painted steel) are galvanized steel sheets coated with primer and topcoat paint layers. They provide aesthetic appeal, weather resistance, and corrosion protection, making them the preferred choice for roofing, wall cladding, and architectural applications.',
    industries: ['Construction', 'Roofing', 'Architecture', 'Cold Storage', 'Commercial Buildings', 'Industrial Sheds'],
    grades: ['RAL colors', 'IS 14246', 'JIS G3312', 'Polyester coated', 'SMP coated', 'PVDF coated'],
    specifications: ['Thickness: 0.25mm – 1.2mm', 'Width: 900mm – 1250mm', 'Coating: PE 15μm / SMP 25μm / PVDF 25μm', 'Substrate: GI / GL / Al-Zn'],
    standards: ['IS 14246', 'JIS G3312', 'EN 10169', 'ASTM A755'],
    hsnCodes: ['7210'],
    orderSizes: '10 MT to 100 MT per order',
    importCountries: ['South Korea', 'China', 'Vietnam', 'Indonesia', 'Turkey'],
    relatedSlugs: ['galvanized-coils-india', 'cr-coil-india', 'hr-coil-india'],
    priceRange: '₹62,000 – ₹85,000 per MT',
    applications: ['Roofing for industrial and commercial buildings', 'Wall cladding and facade panels', 'Cold storage insulated panels', 'Modular construction components', 'Signage and display boards'],
    challenges: ['Color consistency across batches (Delta E tolerance)', 'Coating adhesion and bend test requirements', 'Shelf life limitations for pre-painted material'],
    marketTrend: 'Rapid growth in pre-engineered building construction and affordable housing is driving color coated sheet demand.'
  },
  {
    slug: createSlug('Pig Iron'),
    name: 'Pig Iron',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Pig Iron is the primary product of blast furnace smelting of iron ore, serving as the fundamental raw material for steel making and cast iron foundry operations. It contains 92–94% iron with 3.5–4.5% carbon content along with silicon, manganese, and phosphorus.',
    industries: ['Steel Making', 'Foundry', 'Cast Iron Manufacturing', 'Ductile Iron', 'Engineering Castings'],
    grades: ['Basic Grade (for steel making)', 'Foundry Grade 1', 'Foundry Grade 2', 'Foundry Grade 3', 'Nodular/SG Iron Grade'],
    specifications: ['Carbon: 3.5–4.5%', 'Silicon: 0.5–3.5%', 'Manganese: 0.1–1.5%', 'Phosphorus: ≤0.12% (basic) / ≤0.7% (foundry)', 'Pig weight: 5–15 kg each'],
    standards: ['IS 292', 'IS 708', 'ASTM A43', 'EN 1561'],
    hsnCodes: ['7201'],
    orderSizes: '100 MT to 1000 MT per order',
    importCountries: ['Brazil', 'Russia', 'South Africa', 'Ukraine', 'Australia'],
    relatedSlugs: ['ms-plates-india', 'structural-steel-india', 'hr-coil-india', 'tmt-bars-india'],
    priceRange: '₹32,000 – ₹42,000 per MT',
    applications: ['Electric arc furnace (EAF) steel making', 'Induction furnace steel making', 'Grey iron castings', 'Ductile iron (SG iron) castings', 'Manhole covers and pipe fittings'],
    challenges: ['Chemical composition consistency between batches', 'Logistics cost for bulk inland transport', 'Quality variation between blast furnace and mini blast furnace sources'],
    marketTrend: 'India is the world\'s largest pig iron producer. Domestic demand is sustained by the growing secondary steel sector and foundry industry.'
  },
  {
    slug: createSlug('Basic Pig Iron'),
    name: 'Basic Pig Iron',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Basic Pig Iron is a specialized grade of pig iron with controlled low phosphorus and silicon content, specifically designed for steel making in electric arc furnaces (EAF) and basic oxygen furnaces (BOF). It serves as a premium charge material for producing quality steel.',
    industries: ['Steel Making', 'EAF Steelmakers', 'Special Steel Producers', 'Alloy Steel Manufacturing'],
    grades: ['Low Phosphorus Basic (<0.05% P)', 'Standard Basic (<0.12% P)', 'Low Silicon Basic (<1.0% Si)'],
    specifications: ['Carbon: 3.5–4.5%', 'Silicon: 0.5–1.5%', 'Manganese: 0.1–0.8%', 'Phosphorus: ≤0.05–0.12%', 'Sulphur: ≤0.05%'],
    standards: ['IS 292', 'ASTM A43'],
    hsnCodes: ['7201'],
    orderSizes: '200 MT to 2000 MT per order',
    importCountries: ['Brazil', 'Russia', 'South Africa', 'Ukraine', 'Australia'],
    relatedSlugs: ['pig-iron-india', 'hr-coil-india', 'ms-plates-india', 'tmt-bars-india'],
    priceRange: '₹34,000 – ₹44,000 per MT',
    applications: ['Primary charge material for EAF steel making', 'BOF charge supplementation', 'Dilutant for high-residual scrap', 'Premium casting applications requiring low trace elements'],
    challenges: ['Phosphorus level certification requirements', 'Source verification for consistent chemistry', 'Price premium over foundry grade pig iron'],
    marketTrend: 'Growing EAF steel production capacity in India is increasing demand for quality basic pig iron as a charge material.'
  },
  // ─── NEW FERROUS PRODUCTS ─────────────────────────────────────
  {
    slug: createSlug('TMT Bars'),
    name: 'TMT Bars',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Thermo-Mechanically Treated (TMT) Bars are high-strength reinforcement steel bars produced through a controlled quenching and self-tempering process. They are the primary reinforcement material for reinforced concrete construction (RCC) in India, offering superior weldability, ductility, and earthquake resistance.',
    industries: ['Construction', 'Infrastructure', 'Real Estate', 'Pre-Engineered Buildings', 'Precast'],
    grades: ['Fe 415', 'Fe 415D', 'Fe 500', 'Fe 500D', 'Fe 500S', 'Fe 550', 'Fe 550D', 'Fe 600', 'CRS (Corrosion Resistant)'],
    specifications: ['Diameter: 6mm – 40mm', 'Length: 12m standard', 'Rib pattern: Herringbone / Crescent', 'Elongation: ≥14.5% (Fe 500D)'],
    standards: ['IS 1786:2008', 'ASTM A615', 'BS 4449'],
    hsnCodes: ['7214'],
    orderSizes: '50 MT to 2000 MT per order',
    importCountries: ['Turkey', 'China', 'Vietnam', 'Indonesia', 'Japan', 'South Korea', 'Ukraine'],
    relatedSlugs: ['structural-steel-india', 'ms-plates-india', 'hr-coil-india', 'steel-angles-india', 'steel-channels-india', 'steel-beams-india'],
    priceRange: '₹50,000 – ₹65,000 per MT',
    applications: ['RCC foundations and columns', 'Bridge and flyover reinforcement', 'High-rise building construction', 'Dam and tunnel reinforcement', 'Metro rail and highway projects', 'Precast concrete elements'],
    challenges: ['Grade verification and mill certificate authenticity', 'Consistent mechanical properties across batches', 'Corrosion resistance for coastal and marine environments', 'Supply timing for large infrastructure projects'],
    marketTrend: 'India\'s TMT bar market exceeds 100 MTPA capacity. Growth is driven by PM Awas Yojana, smart city missions, and metro rail expansion across tier-2 cities.'
  },
  {
    slug: createSlug('Structural Steel'),
    name: 'Structural Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Structural Steel encompasses sections, angles, channels, beams, and columns used as primary load-bearing members in building, bridge, and industrial construction. India\'s structural steel demand is growing rapidly with the shift toward steel-intensive construction methods.',
    industries: ['Construction', 'Infrastructure', 'Heavy Engineering', 'Pre-Engineered Buildings', 'Industrial'],
    grades: ['IS 2062 E250A', 'IS 2062 E250BR', 'IS 2062 E350', 'IS 2062 E450', 'ASTM A36', 'ASTM A572 Gr.50', 'S355JR'],
    specifications: ['Sections: I-Beam, H-Beam, Angle, Channel, Flat', 'Length: 6m / 12m standard', 'Flange width: 75mm – 300mm', 'Web depth: 100mm – 600mm'],
    standards: ['IS 2062', 'IS 808', 'ASTM A36', 'ASTM A572', 'EN 10025'],
    hsnCodes: ['7216', '7228'],
    orderSizes: '20 MT to 500 MT per order',
    importCountries: ['China', 'South Korea', 'Japan', 'Vietnam', 'Turkey', 'Indonesia', 'Ukraine'],
    relatedSlugs: ['tmt-bars-india', 'ms-plates-india', 'steel-angles-india', 'steel-channels-india', 'steel-beams-india', 'hr-coil-india'],
    priceRange: '₹52,000 – ₹70,000 per MT',
    applications: ['Industrial building frameworks', 'Bridge girders and trusses', 'Transmission tower structures', 'Offshore platform structures', 'Crane gantries and material handling', 'Pre-engineered metal buildings'],
    challenges: ['Section availability for non-standard sizes', 'Import lead times for heavy sections', 'Weldability requirements per structural code', 'Third-party inspection and certification'],
    marketTrend: 'India\'s structural steel consumption is growing at 9% CAGR driven by infrastructure investment, PEB adoption, and Make in India manufacturing facility construction.'
  },
  {
    slug: createSlug('Steel Angles'),
    name: 'Steel Angles',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Steel Angles (L-sections) are hot-rolled structural sections with two legs at 90° used extensively in framing, bracing, lintels, and general fabrication. They are one of the most versatile structural steel products consumed across all construction and manufacturing sectors.',
    industries: ['Construction', 'Infrastructure', 'Heavy Engineering', 'Transmission Towers', 'Industrial'],
    grades: ['IS 2062 E250A', 'IS 2062 E250BR', 'IS 2062 E350', 'ASTM A36'],
    specifications: ['Size: 20x20mm to 200x200mm (equal leg)', 'Unequal: 40x25mm to 200x150mm', 'Thickness: 3mm – 25mm', 'Length: 6m / 12m'],
    standards: ['IS 2062', 'IS 808', 'ASTM A36'],
    hsnCodes: ['7216'],
    orderSizes: '10 MT to 200 MT per order',
    importCountries: ['China', 'Vietnam', 'South Korea', 'Turkey', 'Indonesia', 'Japan'],
    relatedSlugs: ['structural-steel-india', 'steel-channels-india', 'steel-beams-india', 'ms-plates-india', 'tmt-bars-india'],
    priceRange: '₹52,000 – ₹68,000 per MT',
    applications: ['Transmission tower fabrication', 'Building steel framing', 'Bracing and cross-members', 'Equipment support structures', 'General fabrication and brackets'],
    challenges: ['Section straightness and twist tolerance', 'Availability of non-standard unequal angles', 'Price premium for E350 grade'],
    marketTrend: 'Transmission tower construction for power grid expansion and PEB growth driving angle demand.'
  },
  {
    slug: createSlug('Steel Channels'),
    name: 'Steel Channels',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Steel Channels (C-sections/U-sections) are hot-rolled structural sections used as purlins, rafters, floor joists, and general framing members. Their U-shaped cross-section provides excellent bending resistance and load-bearing capacity for structural applications.',
    industries: ['Construction', 'Heavy Engineering', 'Pre-Engineered Buildings', 'Industrial', 'Transport'],
    grades: ['IS 2062 E250A', 'IS 2062 E350', 'ISMC', 'ISLC', 'ASTM A36'],
    specifications: ['Size: ISMC 75 to ISMC 400', 'Lightweight: ISLC 75 to ISLC 400', 'Thickness: 4mm – 15mm', 'Length: 6m / 12m'],
    standards: ['IS 2062', 'IS 808', 'ASTM A36'],
    hsnCodes: ['7216'],
    orderSizes: '10 MT to 100 MT per order',
    importCountries: ['China', 'South Korea', 'Vietnam', 'Japan', 'Turkey'],
    relatedSlugs: ['structural-steel-india', 'steel-angles-india', 'steel-beams-india', 'ms-plates-india'],
    priceRange: '₹54,000 – ₹70,000 per MT',
    applications: ['Building purlins and girts', 'Floor joist and mezzanine framing', 'Crane rail mounting', 'Vehicle chassis framing', 'Equipment base frames'],
    challenges: ['Web and flange dimensional tolerance', 'Availability of larger sections (ISMC 300+)', 'Straightness requirements for crane rails'],
    marketTrend: 'PEB sector growth and industrial construction expansion driving channel demand in India.'
  },
  {
    slug: createSlug('Steel Beams'),
    name: 'Steel Beams',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Steel Beams (I-Beams, H-Beams, and Wide Flange sections) are primary structural load-bearing members used in building frames, bridge girders, and heavy industrial structures. They offer the highest strength-to-weight ratio among structural steel sections.',
    industries: ['Construction', 'Infrastructure', 'Heavy Engineering', 'Pre-Engineered Buildings', 'Industrial'],
    grades: ['IS 2062 E250A', 'IS 2062 E350', 'ISMB/ISJB/ISLB', 'NPB/WPB', 'ASTM A36', 'ASTM A572'],
    specifications: ['I-Beam: ISMB 100 to ISMB 600', 'H-Beam: NPB 100×100 to WPB 400×400', 'Flange: 50mm – 400mm', 'Length: 12m standard'],
    standards: ['IS 2062', 'IS 808', 'ASTM A36', 'ASTM A572', 'EN 10025'],
    hsnCodes: ['7216'],
    orderSizes: '20 MT to 500 MT per order',
    importCountries: ['China', 'South Korea', 'Japan', 'Vietnam', 'Turkey', 'Indonesia', 'Luxembourg'],
    relatedSlugs: ['structural-steel-india', 'steel-angles-india', 'steel-channels-india', 'ms-plates-india', 'tmt-bars-india'],
    priceRange: '₹55,000 – ₹75,000 per MT',
    applications: ['Building column and beam frames', 'Bridge girders and deck beams', 'Industrial crane beams', 'Offshore platform structures', 'Heavy equipment foundations', 'Metro rail viaduct construction'],
    challenges: ['Import dependency for heavy/wide-flange sections', 'Lead time of 8–16 weeks for imported beams', 'Third-party inspection requirements', 'Weld procedure qualification for critical joints'],
    marketTrend: 'Metro rail projects, bridge construction, and industrial greenfield investments driving steel beam demand. India is increasingly importing heavier sections from China and South Korea.'
  },
];

// ─── METALS - NON-FERROUS ───────────────────────────────────────
const nonFerrousProducts: DemandProduct[] = [
  {
    slug: createSlug('Copper Cathodes'),
    name: 'Copper Cathodes',
    category: 'Metals - Non-Ferrous (Copper, Aluminium)',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Copper Cathodes are 99.99% pure electrolytic copper plates produced through electrolytic refining. They are the primary raw material for copper wire rod, tube, and sheet manufacturing, and are traded globally as an LME-grade commodity with standardized quality specifications.',
    industries: ['Electrical & Electronics', 'Wire Manufacturing', 'Construction', 'Automotive', 'Telecommunications', 'Power Transmission'],
    grades: ['LME Grade A (Cu ≥ 99.99%)', 'IS 191 ETP Copper', 'ASTM B115 Cathode'],
    specifications: ['Purity: ≥99.99% Cu', 'Size: 900mm × 900mm (standard)', 'Weight: 40–125 kg per cathode', 'Oxygen: <400 ppm'],
    standards: ['IS 191', 'ASTM B115', 'BS EN 1978', 'LME registered brands'],
    hsnCodes: ['7403'],
    orderSizes: '25 MT to 500 MT per order',
    importCountries: ['Chile', 'Indonesia', 'Japan', 'South Korea', 'UAE', 'Zambia', 'Peru'],
    relatedSlugs: ['copper-wire-rods-india', 'copper-sheets-india', 'aluminium-ingots-india', 'zinc-ingots-india'],
    priceRange: 'LME + Premium (₹720–₹800 per kg)',
    applications: ['Copper wire rod manufacturing', 'Cable and conductor production', 'Copper tube and pipe manufacturing', 'Copper alloy foundries', 'Electroplating operations'],
    challenges: ['LME price volatility requiring hedging', 'Brand and origin premium variations', 'Import duty structure and FTA implications', 'Quality certification for LME-registered brands'],
    marketTrend: 'India imports over 60% of its refined copper requirement. Growing power transmission, EV, and renewable energy infrastructure are driving sustained demand.'
  },
  {
    slug: createSlug('Aluminium Ingots'),
    name: 'Aluminium Ingots',
    category: 'Metals - Non-Ferrous (Copper, Aluminium)',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Aluminium Ingots are primary aluminium cast into standard ingot shapes for remelting in foundries and downstream processing. They are the base material for die casting, extrusion, and rolling operations across automotive, construction, packaging, and electrical industries.',
    industries: ['Automotive', 'Die Casting', 'Construction', 'Packaging', 'Electrical', 'Aerospace'],
    grades: ['P1020A (LME Grade)', 'IS 617 Al 99.7', 'ADC12 (casting alloy)', 'A356 (aerospace grade)'],
    specifications: ['Purity: 99.5–99.9% Al', 'Weight: 10–25 kg per ingot', 'Bundle: 0.75–1 MT', 'Iron: ≤0.20%'],
    standards: ['IS 617', 'ASTM B209', 'LME P1020A', 'EN 573'],
    hsnCodes: ['7601'],
    orderSizes: '25 MT to 500 MT per order',
    importCountries: ['UAE', 'China', 'Indonesia', 'Bahrain', 'Saudi Arabia', 'Australia', 'Oman'],
    relatedSlugs: ['aluminium-billets-india', 'aluminium-sheets-india', 'copper-cathodes-india', 'zinc-ingots-india'],
    priceRange: 'LME + Premium (₹210–₹240 per kg)',
    applications: ['Automotive die casting (engine blocks, wheels)', 'Aluminium extrusion profiles', 'Electrical conductor manufacturing', 'Packaging foil and container production', 'Building and construction profiles'],
    challenges: ['LME price volatility', 'Alloy composition requirements per application', 'Import duty and anti-dumping duty on Chinese origin', 'Quality consistency for die casting applications'],
    marketTrend: 'India\'s aluminium demand is growing at 8–10% driven by automotive lightweighting, electrical infrastructure, and packaging growth.'
  },
  {
    slug: createSlug('Copper Wire Rods'),
    name: 'Copper Wire Rods',
    category: 'Metals - Non-Ferrous (Copper, Aluminium)',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Copper Wire Rods are continuously cast and rolled rods of 8mm diameter produced from copper cathodes. They are the primary feedstock for wire drawing operations producing electrical conductors, cables, winding wires, and telecommunications cables.',
    industries: ['Cable Manufacturing', 'Electrical', 'Power Transmission', 'Telecommunications', 'Automotive Wiring'],
    grades: ['ETP (Electrolytic Tough Pitch) Cu', 'OF (Oxygen Free) Cu', 'DHP (Deoxidized High Phosphorus) Cu'],
    specifications: ['Diameter: 8mm standard', 'Conductivity: ≥100% IACS', 'Elongation: ≥35%', 'Oxygen: 200–400 ppm (ETP)'],
    standards: ['IS 191', 'IS 8451', 'ASTM B49', 'IEC 60228'],
    hsnCodes: ['7408'],
    orderSizes: '25 MT to 200 MT per order',
    importCountries: ['Japan', 'South Korea', 'Indonesia', 'Malaysia', 'Chile', 'UAE'],
    relatedSlugs: ['copper-cathodes-india', 'copper-sheets-india', 'aluminium-ingots-india'],
    priceRange: 'LME + Fabrication premium (₹740–₹820 per kg)',
    applications: ['Power cable manufacturing', 'Building wire production', 'Enamelled winding wire', 'Flexible cable production', 'Telecommunication cables'],
    challenges: ['Conductivity certification requirements', 'Surface quality for fine wire drawing', 'Cathode brand impact on wire rod quality'],
    marketTrend: 'Expanding power transmission network and renewable energy capacity additions are driving sustained copper wire rod demand in India.'
  },
  {
    slug: createSlug('Aluminium Billets'),
    name: 'Aluminium Billets',
    category: 'Metals - Non-Ferrous (Copper, Aluminium)',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Aluminium Billets are cylindrical semi-finished products produced by direct chill (DC) casting from molten aluminium alloys. They serve as the primary input for extrusion presses producing profiles for construction, automotive, solar, and industrial applications.',
    industries: ['Construction', 'Automotive', 'Solar Energy', 'Industrial', 'Furniture', 'Electronics'],
    grades: ['6063 (architectural)', '6061 (structural)', '6082 (heavy structural)', '6005A (transport)', '1050/1070 (electrical)'],
    specifications: ['Diameter: 127mm – 305mm', 'Length: 500mm – 7000mm', 'Homogenization: T4/T5/T6 temper', 'Grain structure: Fine equiaxed'],
    standards: ['IS 617', 'IS 733', 'ASTM B221', 'EN 755', 'EN 573'],
    hsnCodes: ['7604'],
    orderSizes: '25 MT to 300 MT per order',
    importCountries: ['UAE', 'China', 'Bahrain', 'Indonesia', 'Oman', 'Saudi Arabia'],
    relatedSlugs: ['aluminium-ingots-india', 'aluminium-sheets-india', 'copper-cathodes-india'],
    priceRange: 'LME + Premium (₹220–₹260 per kg)',
    applications: ['Architectural extrusion profiles (windows, doors, curtain walls)', 'Solar panel mounting frames', 'Automotive structural members', 'Heat sink profiles for electronics', 'Scaffolding and industrial structures'],
    challenges: ['Alloy composition consistency for surface-critical profiles', 'Homogenization quality impact on extrudability', 'Surface quality requirements for anodizing'],
    marketTrend: 'India\'s aluminium extrusion industry is growing rapidly driven by real estate construction, solar energy installations, and automotive lightweighting.'
  },
  {
    slug: createSlug('Aluminium Sheets'),
    name: 'Aluminium Sheets',
    category: 'Metals - Non-Ferrous (Copper, Aluminium)',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Aluminium Sheets are flat-rolled products available in various alloys and tempers for diverse applications including construction, packaging, automotive, and marine industries. They offer excellent corrosion resistance, light weight, and formability.',
    industries: ['Construction', 'Packaging', 'Automotive', 'Marine', 'Signage', 'HVAC'],
    grades: ['1050 H14', '1100 H14', '3003 H14', '5052 H32', '5083 H111', '6061 T6', '8011 H14'],
    specifications: ['Thickness: 0.2mm – 6.0mm', 'Width: 1000mm – 2000mm', 'Length: 2000mm – 6000mm', 'Temper: O/H14/H24/H32/T6'],
    standards: ['IS 737', 'IS 736', 'ASTM B209', 'EN 485'],
    hsnCodes: ['7606'],
    orderSizes: '5 MT to 100 MT per order',
    importCountries: ['China', 'South Korea', 'UAE', 'Indonesia', 'Bahrain', 'Japan'],
    relatedSlugs: ['aluminium-ingots-india', 'aluminium-billets-india', 'copper-sheets-india'],
    priceRange: '₹230–₹350 per kg depending on alloy',
    applications: ['Roofing and wall cladding', 'Composite panel substrates', 'Marine hull plating (5083)', 'Automotive body panels', 'Kitchen equipment and utensils', 'Signage and nameplates'],
    challenges: ['Alloy-specific mechanical property requirements', 'Surface quality for decorative applications', 'Import duties on Chinese origin'],
    marketTrend: 'Aluminium sheet demand is growing with increased adoption of aluminium composite panels in construction and lightweighting in automotive.'
  },
  {
    slug: createSlug('Copper Sheets'),
    name: 'Copper Sheets',
    category: 'Metals - Non-Ferrous (Copper, Aluminium)',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Copper Sheets are flat-rolled copper products used extensively in electrical, architectural, and industrial applications. They offer superior electrical and thermal conductivity, corrosion resistance, and antimicrobial properties.',
    industries: ['Electrical', 'Architecture', 'Industrial Equipment', 'Heat Exchangers', 'Defense'],
    grades: ['ETP Copper (C11000)', 'OF Copper (C10200)', 'DHP Copper (C12200)', 'Phosphor Bronze'],
    specifications: ['Thickness: 0.3mm – 6.0mm', 'Width: 300mm – 1200mm', 'Temper: Soft / Half Hard / Hard', 'Conductivity: ≥100% IACS'],
    standards: ['IS 191', 'IS 1897', 'ASTM B152', 'EN 1652'],
    hsnCodes: ['7409'],
    orderSizes: '1 MT to 25 MT per order',
    importCountries: ['Japan', 'South Korea', 'Germany', 'China', 'USA', 'Taiwan'],
    relatedSlugs: ['copper-cathodes-india', 'copper-wire-rods-india', 'aluminium-sheets-india'],
    priceRange: 'LME + Fabrication premium (₹780–₹900 per kg)',
    applications: ['Electrical busbar and switchgear components', 'Architectural roofing and facade', 'Heat exchanger plates', 'Transformer winding strips', 'Earthing and grounding systems'],
    challenges: ['LME price volatility', 'Temper and conductivity specifications', 'Cut-to-size requirements for transformer applications'],
    marketTrend: 'Growing power infrastructure and electrical equipment manufacturing driving copper sheet demand in India.'
  },
  {
    slug: createSlug('Zinc Ingots'),
    name: 'Zinc Ingots',
    category: 'Metals - Non-Ferrous (Copper, Aluminium)',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Zinc Ingots are refined zinc castings of 99.95%+ purity used primarily for hot-dip galvanizing of steel, die casting alloy production, and brass manufacturing. India is a major zinc producer through Hindustan Zinc Limited.',
    industries: ['Galvanizing', 'Die Casting', 'Brass Manufacturing', 'Battery', 'Chemical', 'Rubber'],
    grades: ['SHG (Special High Grade 99.995%)', 'HG (High Grade 99.99%)', 'GOB (Good Ordinary Brand 99.95%)'],
    specifications: ['Purity: 99.95–99.995% Zn', 'Weight: 20–25 kg per ingot', 'Bundle: 1 MT palletized', 'Lead: ≤50 ppm (SHG)'],
    standards: ['IS 209', 'ASTM B6', 'EN 1179', 'LME registered brands'],
    hsnCodes: ['7901'],
    orderSizes: '25 MT to 500 MT per order',
    importCountries: ['Australia', 'South Korea', 'Japan', 'Peru', 'USA', 'Mexico'],
    relatedSlugs: ['lead-ingots-india', 'copper-cathodes-india', 'aluminium-ingots-india', 'galvanized-coils-india'],
    priceRange: 'LME + Premium (₹260–₹300 per kg)',
    applications: ['Hot-dip galvanizing of steel structures', 'Continuous galvanizing lines for sheet/coil', 'Zinc die casting (Zamak alloys)', 'Brass and bronze alloy manufacturing', 'Zinc oxide production', 'Battery electrode material'],
    challenges: ['LME price exposure and hedging requirements', 'Grade selection between SHG and HG for galvanizing', 'Supply concentration (Hindustan Zinc dominates Indian market)'],
    marketTrend: 'Galvanized steel demand growth and zinc-aluminium alloy adoption are driving zinc ingot consumption in India.'
  },
  {
    slug: createSlug('Lead Ingots'),
    name: 'Lead Ingots',
    category: 'Metals - Non-Ferrous (Copper, Aluminium)',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Lead Ingots are refined lead castings of 99.97%+ purity, primarily consumed by the battery manufacturing industry. Lead-acid batteries account for over 80% of lead consumption globally, with significant demand from automotive and industrial UPS/inverter applications.',
    industries: ['Battery Manufacturing', 'Automotive', 'Radiation Shielding', 'Cable Sheathing', 'Chemical'],
    grades: ['LME Grade (Pb ≥ 99.97%)', 'Corroding Lead (Pb ≥ 99.99%)', 'Secondary (recycled) Lead'],
    specifications: ['Purity: 99.97–99.99% Pb', 'Weight: 20–50 kg per ingot', 'Antimony: ≤0.005% (pure grade)', 'Copper: ≤0.001%'],
    standards: ['IS 27', 'ASTM B29', 'EN 12659', 'LME registered brands'],
    hsnCodes: ['7801'],
    orderSizes: '25 MT to 200 MT per order',
    importCountries: ['Australia', 'South Korea', 'Japan', 'China', 'USA', 'Mexico'],
    relatedSlugs: ['zinc-ingots-india', 'copper-cathodes-india', 'aluminium-ingots-india'],
    priceRange: 'LME + Premium (₹190–₹220 per kg)',
    applications: ['Lead-acid battery manufacturing (automotive & industrial)', 'Radiation shielding panels', 'Cable sheathing for underground cables', 'Lead alloy production (antimony, tin, calcium)', 'Counterweight and ballast applications'],
    challenges: ['Environmental regulations on lead handling and storage', 'Recycled lead quality consistency', 'LME price volatility', 'Health and safety compliance requirements'],
    marketTrend: 'Battery manufacturing expansion for automotive and energy storage applications is driving sustained lead demand despite environmental concerns.'
  },
  {
    slug: createSlug('Nickel Alloys'),
    name: 'Nickel Alloys',
    category: 'Metals - Non-Ferrous (Copper, Aluminium)',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Nickel Alloys are high-performance materials engineered for extreme environments including high temperature, corrosive, and high-pressure applications. They include Inconel, Monel, Hastelloy, and other superalloys used in aerospace, chemical processing, oil & gas, and power generation.',
    industries: ['Oil & Gas', 'Chemical Processing', 'Aerospace', 'Power Generation', 'Marine', 'Petrochemical'],
    grades: ['Inconel 600/625/718', 'Monel 400/K500', 'Hastelloy C276/C22', 'Alloy 20', 'Incoloy 800/825'],
    specifications: ['Nickel content: 30–99%', 'Forms: Sheet/Plate/Bar/Pipe/Fittings', 'Temperature rating: up to 1200°C', 'Corrosion resistance per ASTM G48'],
    standards: ['ASTM B168', 'ASTM B443', 'ASTM B446', 'ASTM B564', 'NACE MR0175'],
    hsnCodes: ['7502', '7505', '7506'],
    orderSizes: '100 kg to 10 MT per order',
    importCountries: ['USA', 'Germany', 'Japan', 'South Korea', 'China', 'Italy', 'UK'],
    relatedSlugs: ['copper-cathodes-india', 'stainless-steel-pipes-india', 'aluminium-sheets-india'],
    priceRange: '₹2,000–₹8,000 per kg depending on alloy',
    applications: ['Oil & gas downhole components', 'Chemical reactor vessels and heat exchangers', 'Gas turbine components', 'Flue gas desulfurization systems', 'Marine propeller shafts', 'Nuclear reactor internals'],
    challenges: ['High material cost and long lead times', 'Grade selection based on specific corrosion environment', 'Mill test certification (EN 10204 3.1/3.2)', 'Machining difficulty and specialized welding requirements'],
    marketTrend: 'Growing oil & gas exploration, petrochemical expansion, and aerospace manufacturing in India are increasing nickel alloy demand.'
  },
];

// ─── POLYMERS & RESINS ──────────────────────────────────────────
const polymerProducts: DemandProduct[] = [
  {
    slug: createSlug('Polypropylene PP'),
    name: 'Polypropylene (PP)',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Polypropylene (PP) is a semi-crystalline thermoplastic polymer and India\'s second-largest commodity polymer by volume. It is produced by polymerisation of propylene monomer and consumed across packaging, automotive, textiles, and household products.',
    industries: ['Packaging', 'Automotive', 'Textiles', 'Household Products', 'Medical', 'Agriculture'],
    grades: ['Homopolymer (HP)', 'Random Copolymer (RC)', 'Impact Copolymer (IC)', 'Raffia Grade', 'Injection Moulding Grade', 'BOPP Grade'],
    specifications: ['MFI: 0.5–35 g/10min', 'Density: 0.900–0.910 g/cm³', 'Packaging: 25 kg bags / 1 MT jumbo bags', 'Flexural modulus: 1300–1800 MPa'],
    standards: ['IS 10910', 'ASTM D4101', 'ISO 1133'],
    hsnCodes: ['3902'],
    orderSizes: '20 MT to 200 MT per order',
    importCountries: ['Saudi Arabia', 'UAE', 'South Korea', 'Singapore', 'Thailand', 'Taiwan', 'Oman'],
    relatedSlugs: ['polyethylene-pe-india', 'pvc-resin-india', 'abs-resin-india', 'hdpe-granules-india', 'lldpe-granules-india', 'pp-homopolymer-india'],
    priceRange: '₹95,000 – ₹135,000 per MT',
    applications: ['BOPP films for flexible packaging', 'Woven sacks for cement and fertilizer', 'Automotive components (bumpers, dashboard)', 'Non-woven fabrics for medical and hygiene', 'Household containers and furniture', 'FIBC (jumbo bags) for bulk packaging'],
    challenges: ['Grade-specific availability varies by producer cycle', 'Price volatility linked to crude oil and propylene margins', 'Distributor markups of ₹2,000–₹5,000/MT over producer list price'],
    marketTrend: 'India\'s PP demand is growing at 8–10% CAGR driven by FMCG packaging, automotive lightweighting, and infrastructure. New cracker capacity additions will add 2+ MTPA by 2027.'
  },
  {
    slug: createSlug('Polyethylene PE'),
    name: 'Polyethylene (PE)',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Polyethylene (PE) is the world\'s most widely produced plastic, available in multiple density variants — HDPE, LDPE, and LLDPE. It is the backbone of India\'s packaging, pipe, and film industries with annual consumption exceeding 6 million MT.',
    industries: ['Packaging', 'Pipe Manufacturing', 'Agriculture', 'Consumer Products', 'Wire & Cable'],
    grades: ['HDPE (Pipe/Blow Moulding/Injection)', 'LDPE (Film/Extrusion Coating)', 'LLDPE (Film/Rotomoulding)', 'UHMWPE'],
    specifications: ['Density: 0.910–0.965 g/cm³', 'MFI: 0.03–30 g/10min', 'Packaging: 25 kg bags', 'Vicat softening point: 80–130°C'],
    standards: ['IS 7328', 'IS 4984', 'ASTM D1248', 'ASTM D4976'],
    hsnCodes: ['3901'],
    orderSizes: '20 MT to 300 MT per order',
    importCountries: ['Saudi Arabia', 'UAE', 'Singapore', 'Qatar', 'Thailand', 'Oman', 'USA'],
    relatedSlugs: ['polypropylene-pp-india', 'hdpe-granules-india', 'ldpe-granules-india', 'lldpe-granules-india', 'pvc-resin-india'],
    priceRange: '₹90,000 – ₹140,000 per MT',
    applications: ['Multilayer packaging films', 'HDPE pipes for water and gas distribution', 'Agricultural mulch films', 'Blow moulded containers', 'Wire and cable insulation', 'Geomembranes for water conservation'],
    challenges: ['Grade proliferation creating sourcing complexity', 'Crude oil price linkage creating budget uncertainty', 'Quality variation between petrochemical and recycled grades', 'Import logistics for bulk shipments'],
    marketTrend: 'India\'s PE demand growing at 7% CAGR led by pipe infrastructure (Jal Jeevan Mission) and flexible packaging expansion.'
  },
  {
    slug: createSlug('PVC Resin'),
    name: 'PVC Resin',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Polyvinyl Chloride (PVC) Resin is the third most widely produced synthetic polymer globally. India consumes over 3.5 million MT annually, primarily in pipe manufacturing, window profiles, cables, and building products. PVC is unique among commodity polymers for its chlorine content (57%), making it less dependent on crude oil pricing.',
    industries: ['Pipe Manufacturing', 'Construction', 'Electrical', 'Packaging', 'Footwear', 'Agriculture'],
    grades: ['Suspension PVC (S-PVC) K57–K70', 'Emulsion PVC (E-PVC)', 'Paste PVC', 'Chlorinated PVC (CPVC)'],
    specifications: ['K-value: 57–70', 'Bulk density: 0.45–0.65 g/cm³', 'Volatile matter: ≤0.3%', 'Particle size: 100–250 μm'],
    standards: ['IS 12121', 'ASTM D1755', 'ISO 1060'],
    hsnCodes: ['3904'],
    orderSizes: '20 MT to 200 MT per order',
    importCountries: ['China', 'Japan', 'USA', 'South Korea', 'Taiwan', 'Thailand', 'Indonesia'],
    relatedSlugs: ['polypropylene-pp-india', 'pvc-pipes-india', 'hdpe-granules-india', 'pvc-compound-india'],
    priceRange: '₹72,000 – ₹95,000 per MT',
    applications: ['PVC pipe and fittings manufacturing', 'Window and door profiles (uPVC)', 'Cable insulation and sheathing', 'Flooring (vinyl tiles and sheets)', 'Footwear and leather cloth', 'Agricultural drip irrigation tubes'],
    challenges: ['Anti-dumping duties on Chinese PVC imports', 'Caustic soda and chlorine supply chain linkage', 'K-value selection for specific processing methods', 'Environmental regulations on PVC products'],
    marketTrend: 'India\'s PVC demand growing at 8% CAGR driven by Jal Jeevan Mission pipe requirements, uPVC window adoption, and irrigation infrastructure.'
  },
  {
    slug: createSlug('ABS Resin'),
    name: 'ABS Resin',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Acrylonitrile Butadiene Styrene (ABS) is an engineering thermoplastic known for its impact resistance, rigidity, and surface finish quality. India imports over 60% of its ABS requirement, primarily for automotive, electronics, and consumer goods manufacturing.',
    industries: ['Automotive', 'Electronics', 'Consumer Products', 'Medical', 'Construction'],
    grades: ['General Purpose', 'High Impact', 'Heat Resistant', 'Flame Retardant', 'Plating Grade', 'Extrusion Grade'],
    specifications: ['MFI: 2–25 g/10min', 'Density: 1.04–1.06 g/cm³', 'Impact strength: 15–30 kJ/m²', 'HDT: 85–110°C'],
    standards: ['ASTM D4673', 'ISO 2580', 'UL 94 (flame retardant)'],
    hsnCodes: ['3903'],
    orderSizes: '5 MT to 50 MT per order',
    importCountries: ['South Korea', 'Taiwan', 'Japan', 'Thailand', 'China', 'Malaysia', 'USA'],
    relatedSlugs: ['polycarbonate-india', 'polypropylene-pp-india', 'pvc-resin-india'],
    priceRange: '₹150,000 – ₹220,000 per MT',
    applications: ['Automotive interior and exterior trim', 'Computer and TV housings', 'Kitchen appliance bodies', 'Luggage and travel goods', 'Bathroom fittings and sanitary ware', '3D printing filament'],
    challenges: ['Import dependency exceeding 60%', 'Grade-specific color matching requirements', 'Price premium over commodity polymers', 'Butadiene price volatility'],
    marketTrend: 'Automotive interior quality upgrades and electronics manufacturing expansion driving ABS demand growth in India.'
  },
  {
    slug: createSlug('Polycarbonate'),
    name: 'Polycarbonate',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Polycarbonate (PC) is a transparent engineering thermoplastic with exceptional impact resistance, optical clarity, and heat resistance. It is the material of choice for optical media, automotive glazing, LED lighting, and safety equipment.',
    industries: ['Automotive', 'Electronics', 'Construction', 'Medical', 'Packaging', 'Lighting'],
    grades: ['General Purpose', 'Optical Grade', 'Flame Retardant', 'Food Contact', 'Medical Grade', 'UV Stabilized'],
    specifications: ['MFI: 3–30 g/10min', 'Density: 1.20 g/cm³', 'Light transmission: 89%', 'HDT: 130–140°C'],
    standards: ['ASTM D3935', 'ISO 7391', 'UL 94 V-0/V-2'],
    hsnCodes: ['3907'],
    orderSizes: '5 MT to 50 MT per order',
    importCountries: ['South Korea', 'Japan', 'Thailand', 'Saudi Arabia', 'China', 'Germany', 'USA'],
    relatedSlugs: ['abs-resin-india', 'polypropylene-pp-india', 'pet-resin-india'],
    priceRange: '₹180,000 – ₹280,000 per MT',
    applications: ['Automotive headlamp lenses', 'LED lighting diffusers', 'Roofing sheets and skylights', 'Electronic device housings', 'Medical equipment casings', 'Safety helmets and visors'],
    challenges: ['Import dependency over 80%', 'UV degradation requiring stabilization', 'Chemical resistance limitations', 'BPA concerns in food contact applications'],
    marketTrend: 'LED lighting adoption and automotive lightweighting driving polycarbonate demand in India.'
  },
  {
    slug: createSlug('HDPE Granules'),
    name: 'HDPE Granules',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'High-Density Polyethylene (HDPE) Granules are semi-crystalline thermoplastic pellets used as the primary raw material for pipe, container, film, and moulding production. HDPE is India\'s largest-consumed polyethylene variant with over 2 million MT annual demand.',
    industries: ['Pipe Manufacturing', 'Packaging', 'Agriculture', 'Consumer Products', 'Automotive', 'Water Supply'],
    grades: ['Pipe Grade (PE63/PE80/PE100)', 'Blow Moulding', 'Injection Moulding', 'Film Grade', 'Raffia Grade', 'Wire & Cable'],
    specifications: ['Density: 0.940–0.965 g/cm³', 'MFI: 0.03–12 g/10min', 'Tensile strength: 22–31 MPa', 'Packaging: 25 kg bags'],
    standards: ['IS 4984', 'IS 14333', 'ASTM D3350', 'ISO 4427'],
    hsnCodes: ['3901'],
    orderSizes: '20 MT to 200 MT per order',
    importCountries: ['Saudi Arabia', 'Qatar', 'UAE', 'Singapore', 'South Korea', 'Thailand', 'USA'],
    relatedSlugs: ['ldpe-granules-india', 'lldpe-granules-india', 'polyethylene-pe-india', 'hdpe-pipes-india', 'polypropylene-pp-india'],
    priceRange: '₹95,000 – ₹130,000 per MT',
    applications: ['HDPE water supply and gas pipes', 'Jerry cans and industrial containers', 'Agricultural mulch film', 'Woven sack lamination', 'Bottle caps and closures', 'Household storage containers'],
    challenges: ['Pipe grade PE100 availability from domestic producers', 'Grade-specific approval for potable water applications', 'Price fluctuation with naphtha/gas prices'],
    marketTrend: 'Jal Jeevan Mission and city gas distribution driving massive HDPE pipe demand. Annual consumption growing at 8% CAGR.'
  },
  {
    slug: createSlug('LLDPE Granules'),
    name: 'LLDPE Granules',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Linear Low-Density Polyethylene (LLDPE) Granules are flexible polyethylene pellets with superior puncture and tear resistance compared to LDPE. They are the dominant raw material for stretch films, shrink wraps, agricultural films, and multi-layer packaging in India.',
    industries: ['Packaging', 'Agriculture', 'Consumer Products', 'Construction', 'Industrial'],
    grades: ['C4 (Butene)', 'C6 (Hexene)', 'C8 (Octene)', 'Metallocene LLDPE', 'Rotomoulding Grade'],
    specifications: ['Density: 0.915–0.940 g/cm³', 'MFI: 0.5–4.0 g/10min', 'Packaging: 25 kg bags', 'Dart impact: 200–600g'],
    standards: ['ASTM D1248', 'ASTM D4976', 'ISO 17855'],
    hsnCodes: ['3901'],
    orderSizes: '20 MT to 200 MT per order',
    importCountries: ['Saudi Arabia', 'UAE', 'Qatar', 'Singapore', 'South Korea', 'Thailand', 'USA'],
    relatedSlugs: ['ldpe-granules-india', 'hdpe-granules-india', 'polyethylene-pe-india', 'polypropylene-pp-india'],
    priceRange: '₹100,000 – ₹135,000 per MT',
    applications: ['Stretch and cling films', 'Multi-layer lamination films', 'Agricultural mulch and greenhouse films', 'Heavy-duty packaging sacks', 'Water tank rotomoulding', 'Geomembrane liners'],
    challenges: ['C6/C8 comonomer grade availability in India', 'Metallocene grade premium of ₹15,000–₹25,000/MT', 'Film processing parameter optimization per grade'],
    marketTrend: 'Flexible packaging conversion from rigid to flexible and agricultural film subsidies driving LLDPE demand growth.'
  },
  {
    slug: createSlug('LDPE Granules'),
    name: 'LDPE Granules',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Low-Density Polyethylene (LDPE) Granules are highly branched polyethylene pellets offering excellent clarity, flexibility, and moisture barrier properties. They are primarily used for film manufacturing, extrusion coating, and wire insulation applications.',
    industries: ['Packaging', 'Wire & Cable', 'Agriculture', 'Consumer Products', 'Textile (Polyester Fibre)'],
    grades: ['Film Grade', 'Extrusion Coating Grade', 'Injection Moulding Grade', 'Wire & Cable Grade'],
    specifications: ['Density: 0.910–0.930 g/cm³', 'MFI: 0.3–20 g/10min', 'Packaging: 25 kg bags', 'Clarity: High (film grades)'],
    standards: ['ASTM D1248', 'IS 7328', 'ISO 17855'],
    hsnCodes: ['3901'],
    orderSizes: '20 MT to 150 MT per order',
    importCountries: ['Saudi Arabia', 'UAE', 'Qatar', 'South Korea', 'Thailand', 'Singapore', 'USA'],
    relatedSlugs: ['lldpe-granules-india', 'hdpe-granules-india', 'polyethylene-pe-india', 'polypropylene-pp-india'],
    priceRange: '₹105,000 – ₹140,000 per MT',
    applications: ['Carry bags and shopping bags', 'Extrusion coating for paper/board', 'Shrink wrap and stretch film', 'Wire and cable insulation', 'Greenhouse covers', 'Squeeze bottles and tubes'],
    challenges: ['Single-use plastic ban impact on film applications', 'Competition from LLDPE in film markets', 'Import dependency for specialized grades'],
    marketTrend: 'While some applications face regulatory headwinds from single-use plastic bans, extrusion coating and wire & cable grades maintain growth.'
  },
  {
    slug: createSlug('PET Resin'),
    name: 'PET Resin',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Polyethylene Terephthalate (PET) Resin is a clear, strong, and lightweight polyester used primarily for beverage bottles, food packaging, and polyester fibre production. India is the world\'s second-largest PET consumer with over 1.5 million MT annual demand.',
    industries: ['Packaging', 'Food & Beverage', 'Textile (Polyester Fibre)', 'Consumer Products', 'Pharmaceutical'],
    grades: ['Bottle Grade', 'Sheet Grade', 'Fibre Grade', 'Film Grade', 'Hot Fill Grade'],
    specifications: ['IV (Intrinsic Viscosity): 0.72–0.84 dl/g', 'Density: 1.33–1.39 g/cm³', 'Moisture: ≤0.02%', 'Chip size: Standard'],
    standards: ['IS 12252', 'ASTM D4603', 'FDA 21 CFR'],
    hsnCodes: ['3907'],
    orderSizes: '20 MT to 300 MT per order',
    importCountries: ['China', 'South Korea', 'Taiwan', 'Indonesia', 'Oman', 'Saudi Arabia', 'Thailand'],
    relatedSlugs: ['polypropylene-pp-india', 'polycarbonate-india', 'pvc-resin-india'],
    priceRange: '₹85,000 – ₹115,000 per MT',
    applications: ['Water and carbonated beverage bottles', 'Food packaging containers', 'Polyester staple fibre production', 'Thermoformed food trays', 'Pharmaceutical packaging', 'Polyester film for electrical insulation'],
    challenges: ['PTA and MEG feedstock price linkage', 'Recycled PET (rPET) quality benchmarking', 'FDA/food contact compliance for food packaging', 'IV consistency for preform processing'],
    marketTrend: 'India\'s PET demand growing driven by packaged water, FMCG, and pharmaceutical packaging. Recycled PET (rPET) mandates creating new supply chain dynamics.'
  },
  {
    slug: createSlug('EVA Copolymer'),
    name: 'EVA Copolymer',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Ethylene Vinyl Acetate (EVA) Copolymer is a flexible, rubber-like thermoplastic with excellent impact resistance, clarity, and UV resistance. VA content ranges from 2% to 40%, determining flexibility and application suitability across footwear, solar, packaging, and adhesive industries.',
    industries: ['Footwear', 'Solar Energy', 'Packaging', 'Automotive', 'Agriculture', 'Construction'],
    grades: ['Low VA (2–8%)', 'Medium VA (8–18%)', 'High VA (18–40%)', 'Solar Grade', 'Hot Melt Adhesive Grade'],
    specifications: ['VA content: 2–40%', 'MFI: 0.5–150 g/10min', 'Density: 0.920–0.960 g/cm³', 'Packaging: 25 kg bags'],
    standards: ['ASTM D3236', 'ISO 4613', 'IEC 62108 (solar)'],
    hsnCodes: ['3901'],
    orderSizes: '10 MT to 100 MT per order',
    importCountries: ['South Korea', 'Japan', 'USA', 'Thailand', 'Taiwan', 'Saudi Arabia', 'China'],
    relatedSlugs: ['polypropylene-pp-india', 'ldpe-granules-india', 'polyethylene-pe-india'],
    priceRange: '₹120,000 – ₹200,000 per MT',
    applications: ['Footwear soles and midsoles', 'Solar panel encapsulation film', 'Hot melt adhesives', 'Agricultural greenhouse film', 'Automotive interior padding', 'Sports equipment and mats'],
    challenges: ['VA content and MFI specification precision', 'Solar-grade quality certification', 'Price sensitivity in footwear segment', 'Import dependency for specialized grades'],
    marketTrend: 'India\'s solar energy expansion is creating massive demand for solar-grade EVA encapsulant. Footwear remains the largest traditional consumer.'
  },
  // ─── NEW POLYMER PRODUCTS ─────────────────────────────────────
  {
    slug: createSlug('PP Homopolymer'),
    name: 'PP Homopolymer',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'PP Homopolymer is the most widely consumed polypropylene variant, offering high rigidity, good chemical resistance, and excellent processability. It is the preferred grade for BOPP film, raffia, injection moulding, and fibre applications across India\'s FMCG and industrial packaging sectors.',
    industries: ['Packaging', 'Textiles', 'Automotive', 'Consumer Products', 'Medical', 'Industrial'],
    grades: ['Raffia Grade (MFI 3–4)', 'BOPP Film Grade (MFI 3–5)', 'Injection Moulding Grade (MFI 8–35)', 'Fibre Grade (MFI 25–35)'],
    specifications: ['MFI: 0.5–35 g/10min', 'Density: 0.900–0.905 g/cm³', 'Flexural Modulus: 1400–1800 MPa', 'HDT: 85–100°C'],
    standards: ['IS 10910', 'ASTM D4101', 'ISO 1133'],
    hsnCodes: ['3902'],
    orderSizes: '20 MT to 200 MT per order',
    importCountries: ['Saudi Arabia', 'UAE', 'South Korea', 'Thailand', 'Oman', 'Singapore', 'Taiwan'],
    relatedSlugs: ['polypropylene-pp-india', 'pp-copolymer-india', 'hdpe-granules-india', 'polyethylene-pe-india'],
    priceRange: '₹95,000 – ₹130,000 per MT',
    applications: ['BOPP packaging film', 'Woven sack raffia', 'Injection moulded furniture and containers', 'Spunbond non-woven fabrics', 'Monofilament and staple fibre', 'Automotive under-hood components'],
    challenges: ['MFI consistency across batches', 'Processing additive requirements', 'Competition from recycled PP grades'],
    marketTrend: 'India\'s PP homopolymer demand exceeds 4 MTPA driven by FMCG packaging, woven sack industry, and non-woven fabric growth for hygiene products.'
  },
  {
    slug: createSlug('PP Copolymer'),
    name: 'PP Copolymer',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'PP Copolymer (Impact Copolymer / Random Copolymer) offers improved impact resistance and transparency compared to PP Homopolymer. Random copolymers provide clarity for packaging, while impact copolymers are preferred for automotive and industrial applications requiring toughness at low temperatures.',
    industries: ['Automotive', 'Packaging', 'Consumer Products', 'Medical', 'Industrial', 'Household Products'],
    grades: ['Random Copolymer (clarified)', 'Impact Copolymer (medium/high)', 'Nucleated Grades', 'Metallocene PP'],
    specifications: ['MFI: 2–50 g/10min', 'Density: 0.900–0.910 g/cm³', 'Izod impact: 5–60 kJ/m²', 'Haze: 10–35% (random)'],
    standards: ['IS 10910', 'ASTM D4101', 'ISO 19069'],
    hsnCodes: ['3902'],
    orderSizes: '10 MT to 100 MT per order',
    importCountries: ['South Korea', 'Saudi Arabia', 'Japan', 'Thailand', 'Taiwan', 'Singapore', 'UAE'],
    relatedSlugs: ['polypropylene-pp-india', 'pp-homopolymer-india', 'abs-resin-india', 'polycarbonate-india'],
    priceRange: '₹105,000 – ₹150,000 per MT',
    applications: ['Transparent food packaging containers', 'Automotive bumpers and instrument panels', 'Battery cases', 'Medical syringes and labware', 'Household storage with clarity', 'Thin-wall injection moulding'],
    challenges: ['Random vs impact grade selection complexity', 'Nucleation requirements for cycle time', 'Higher price vs homopolymer (₹5,000–₹15,000/MT)'],
    marketTrend: 'Growing automotive production and transparent packaging demand driving PP copolymer consumption in India.'
  },
  {
    slug: createSlug('PVC Compound'),
    name: 'PVC Compound',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'PVC Compound is a pre-formulated blend of PVC resin with plasticizers, stabilizers, fillers, and processing aids, ready for direct extrusion or moulding. It eliminates the need for in-house compounding, offering consistency, convenience, and quality assurance for small and medium converters.',
    industries: ['Pipe Manufacturing', 'Wire & Cable', 'Footwear', 'Construction', 'Automotive', 'Medical'],
    grades: ['Rigid (uPVC) Compound', 'Flexible (fPVC) Compound', 'Wire & Cable Compound', 'Medical Grade', 'Shoe Sole Grade'],
    specifications: ['Shore hardness: 40A–80D', 'Specific gravity: 1.20–1.55', 'Temperature range: -20°C to 70°C', 'Packaging: 25 kg bags'],
    standards: ['IS 12121', 'ASTM D4396', 'UL 1581 (cables)'],
    hsnCodes: ['3904'],
    orderSizes: '5 MT to 50 MT per order',
    importCountries: ['China', 'South Korea', 'Thailand', 'Vietnam', 'Malaysia', 'Japan'],
    relatedSlugs: ['pvc-resin-india', 'pvc-pipes-india', 'polypropylene-pp-india'],
    priceRange: '₹80,000 – ₹150,000 per MT',
    applications: ['PVC pipe and fitting production', 'Cable insulation and jacketing', 'Footwear soles and straps', 'Window profile extrusion', 'Medical tube and bag production', 'Gaskets and sealing profiles'],
    challenges: ['Plasticizer type selection (DOP/DOTP/DINP)', 'Lead-free stabilizer transition', 'Color matching across batches', 'Regulatory compliance for food/medical contact'],
    marketTrend: 'Lead-free stabilizer mandate and growing cable manufacturing driving demand for specialty PVC compounds.'
  },
  {
    slug: createSlug('Engineering Plastics'),
    name: 'Engineering Plastics',
    category: 'Polymers & Resins',
    categorySlug: 'polymers-resins',
    industrySlug: 'polymers',
    subIndustrySlug: 'resins',
    definition: 'Engineering Plastics encompass high-performance thermoplastics including Nylon (PA6/PA66), POM (Acetal), PBT, and modified PPO, offering superior mechanical strength, chemical resistance, and thermal stability compared to commodity polymers. India imports over 70% of its engineering plastic requirement.',
    industries: ['Automotive', 'Electronics', 'Industrial', 'Medical', 'Consumer Products', 'Aerospace'],
    grades: ['PA6 (Nylon 6)', 'PA66 (Nylon 66)', 'POM (Acetal/Delrin)', 'PBT', 'Modified PPO/PPE', 'PEEK'],
    specifications: ['Tensile strength: 60–100 MPa', 'HDT: 120–340°C', 'Moisture absorption: varies by type', 'Density: 1.05–1.42 g/cm³'],
    standards: ['ASTM D4066', 'ISO 1874', 'UL 94'],
    hsnCodes: ['3908', '3907'],
    orderSizes: '1 MT to 25 MT per order',
    importCountries: ['China', 'South Korea', 'Japan', 'Germany', 'USA', 'Taiwan', 'Thailand'],
    relatedSlugs: ['abs-resin-india', 'polycarbonate-india', 'polypropylene-pp-india'],
    priceRange: '₹180,000 – ₹500,000 per MT',
    applications: ['Automotive under-hood components', 'Electrical connectors and switches', 'Gear and bearing applications', 'Medical device housings', 'Industrial conveyor components', 'Aerospace interior parts'],
    challenges: ['High import dependency (70%+)', 'Grade selection complexity across polymer families', 'Moisture control during processing (nylons)', 'Price premium 3–5x over commodity polymers'],
    marketTrend: 'Metal-to-plastic conversion in automotive, growing electrical connector demand, and industrial automation driving engineering plastics consumption in India.'
  },
];

// ─── PIPES & TUBES ──────────────────────────────────────────────
const pipeProducts: DemandProduct[] = [
  {
    slug: createSlug('MS Pipes'),
    name: 'MS Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Mild Steel (MS) Pipes are carbon steel tubes manufactured through ERW (Electric Resistance Welding) or seamless processes. They are the most widely used piping product in India for structural, water, gas, and general engineering applications across construction and industrial sectors.',
    industries: ['Construction', 'Water Supply', 'Oil & Gas', 'Agriculture', 'Industrial', 'Infrastructure'],
    grades: ['IS 1239 Medium', 'IS 1239 Heavy', 'IS 3589', 'ASTM A53 Grade B', 'API 5L Gr.B'],
    specifications: ['OD: 15mm – 600mm', 'Thickness: 1.8mm – 12mm', 'Length: 6m standard', 'Type: ERW / Seamless'],
    standards: ['IS 1239', 'IS 3589', 'IS 4923', 'ASTM A53', 'API 5L'],
    hsnCodes: ['7306'],
    orderSizes: '10 MT to 200 MT per order',
    importCountries: ['China', 'South Korea', 'Vietnam', 'Japan', 'Indonesia', 'Turkey', 'Ukraine'],
    relatedSlugs: ['gi-pipes-india', 'hdpe-pipes-india', 'stainless-steel-pipes-india', 'erw-pipes-india', 'seamless-pipes-india'],
    priceRange: '₹50,000 – ₹70,000 per MT',
    applications: ['Water supply and distribution', 'Structural scaffolding and supports', 'Oil and gas transmission', 'Fire sprinkler systems', 'Agricultural bore well casing', 'General engineering and fabrication'],
    challenges: ['Thickness and OD tolerance compliance', 'Corrosion protection requirements', 'Test certificate availability', 'Price differential between ERW and seamless'],
    marketTrend: 'India\'s MS pipe demand exceeds 10 MTPA driven by infrastructure, water, and oil & gas projects.'
  },
  {
    slug: createSlug('GI Pipes'),
    name: 'GI Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Galvanized Iron (GI) Pipes are MS pipes coated with zinc through hot-dip galvanizing, providing corrosion resistance for potable water, fire protection, and exposed structural applications. They remain the dominant piping product for building plumbing in India.',
    industries: ['Construction', 'Water Supply', 'Agriculture', 'Industrial', 'Residential'],
    grades: ['IS 1239 Medium GI', 'IS 1239 Heavy GI', 'IS 4736', 'ASTM A53 Galvanized'],
    specifications: ['OD: 15mm – 150mm', 'Zinc coating: 300–600 g/m²', 'Length: 6m standard', 'End type: Plain / Threaded / Socketed'],
    standards: ['IS 1239', 'IS 4736', 'ASTM A53', 'BS 1387'],
    hsnCodes: ['7306'],
    orderSizes: '5 MT to 100 MT per order',
    importCountries: ['China', 'Vietnam', 'South Korea', 'Turkey', 'Indonesia', 'Thailand'],
    relatedSlugs: ['ms-pipes-india', 'hdpe-pipes-india', 'pvc-pipes-india', 'galvanized-coils-india'],
    priceRange: '₹58,000 – ₹80,000 per MT',
    applications: ['Building water supply plumbing', 'Fire sprinkler and hydrant systems', 'Agricultural irrigation', 'Fencing and railing', 'Greenhouse structures', 'Scaffolding tubes'],
    challenges: ['Zinc coating uniformity and thickness', 'Thread quality for screwed joints', 'Competition from CPVC and PPR in plumbing', 'Galvanizing bath zinc quality'],
    marketTrend: 'While CPVC and PPR are gaining share in plumbing, GI pipes maintain dominance in fire protection, agricultural, and industrial applications.'
  },
  {
    slug: createSlug('HDPE Pipes'),
    name: 'HDPE Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'High-Density Polyethylene (HDPE) Pipes are flexible, corrosion-resistant thermoplastic pipes used for water supply, gas distribution, sewage, and industrial applications. They are India\'s fastest-growing pipe segment driven by Jal Jeevan Mission and city gas distribution expansion.',
    industries: ['Water Supply', 'Gas Distribution', 'Irrigation', 'Sewage', 'Telecommunications', 'Mining Equipment'],
    grades: ['PE63', 'PE80', 'PE100', 'PE100+', 'PE-RT'],
    specifications: ['OD: 20mm – 1600mm', 'SDR: 7.4 – 33', 'Pressure rating: 2.5 – 20 bar', 'Coil length: 50/100/200m (small dia)'],
    standards: ['IS 4984', 'IS 14333', 'ISO 4427', 'ASTM D3350'],
    hsnCodes: ['3917'],
    orderSizes: '5 MT to 500 MT per order',
    importCountries: ['Saudi Arabia', 'UAE', 'China', 'South Korea', 'Oman', 'Qatar'],
    relatedSlugs: ['pvc-pipes-india', 'ms-pipes-india', 'hdpe-granules-india', 'di-pipes-india'],
    priceRange: '₹80–₹400 per meter depending on diameter',
    applications: ['Rural water supply (Jal Jeevan Mission)', 'City gas distribution networks', 'Sewage and drainage systems', 'Sprinkler irrigation networks', 'Telecommunications cable ducting', 'Mine dewatering and slurry'],
    challenges: ['PE100 raw material price volatility', 'Jointing quality (butt fusion/electrofusion)', 'UV resistance for above-ground installation', 'BIS certification for potable water'],
    marketTrend: 'India\'s HDPE pipe demand exceeds ₹15,000 crore driven by Jal Jeevan Mission target of 190+ million household connections.'
  },
  {
    slug: createSlug('PVC Pipes'),
    name: 'PVC Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Polyvinyl Chloride (PVC) Pipes include rigid uPVC and flexible plasticized variants, dominating India\'s agriculture, plumbing, and sewage pipe market. India is the world\'s third-largest PVC pipe market with over 3 million MT annual production capacity.',
    industries: ['Agriculture', 'Construction', 'Water Supply', 'Sewage', 'Electrical', 'Drainage'],
    grades: ['uPVC (Unplasticized)', 'cPVC (Chlorinated PVC)', 'SWR (Soil, Waste & Rainwater)', 'Casing Pipe', 'Column Pipe'],
    specifications: ['OD: 20mm – 630mm', 'Class: 2.5 – 10 kg/cm²', 'Length: 3m / 6m', 'Type: Solvent cement / Push-fit / Threaded'],
    standards: ['IS 4985', 'IS 15778 (SWR)', 'IS 12818 (casing)', 'ASTM D1785'],
    hsnCodes: ['3917'],
    orderSizes: '5 MT to 200 MT per order',
    importCountries: ['China', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'South Korea'],
    relatedSlugs: ['hdpe-pipes-india', 'ms-pipes-india', 'gi-pipes-india', 'pvc-resin-india'],
    priceRange: '₹30–₹250 per meter depending on diameter and class',
    applications: ['Borewell casing and column pipes', 'Agricultural drip irrigation', 'Building plumbing (cPVC)', 'Sewage and drainage (SWR)', 'Electrical conduit', 'Rainwater harvesting'],
    challenges: ['Impact resistance in cold weather', 'UV degradation for exposed installation', 'cPVC vs PPR selection for hot water', 'Resin price volatility'],
    marketTrend: 'India\'s PVC pipe market exceeds ₹40,000 crore. Growth driven by agricultural mechanization, rural water supply, and affordable housing construction.'
  },
  {
    slug: createSlug('LSAW Pipes'),
    name: 'LSAW Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Longitudinal Submerged Arc Welded (LSAW) Pipes are large-diameter welded steel pipes manufactured by forming and welding steel plates. They are used for high-pressure oil and gas transmission, water transmission, and structural piling applications.',
    industries: ['Oil & Gas', 'Water Pipeline', 'Construction', 'Infrastructure', 'Power Generation'],
    grades: ['API 5L Gr.B/X42/X52/X60/X65/X70', 'IS 3589', 'EN 10219'],
    specifications: ['OD: 406mm – 1524mm', 'Wall thickness: 6mm – 40mm', 'Length: 6m – 12.2m', 'Weld type: LSAW (single/double seam)'],
    standards: ['API 5L PSL1/PSL2', 'IS 3589', 'EN 10219', 'ASME B36.10'],
    hsnCodes: ['7305'],
    orderSizes: '100 MT to 5000 MT per order',
    importCountries: ['China', 'Japan', 'South Korea', 'UAE', 'Turkey', 'Italy', 'Germany'],
    relatedSlugs: ['hsaw-pipes-india', 'seamless-pipes-india', 'ms-pipes-india', 'erw-pipes-india'],
    priceRange: '₹55,000 – ₹90,000 per MT',
    applications: ['Crude oil and gas transmission pipelines', 'Water transmission mains', 'Penstock pipes for hydropower', 'Structural piling for bridges', 'Offshore platform jackets', 'Industrial process piping'],
    challenges: ['Plate sourcing for specific wall thickness', 'NDT and radiography requirements', 'PSL2 compliance for sour service', 'Long fabrication lead times'],
    marketTrend: 'India\'s oil & gas pipeline expansion and water grid projects driving LSAW pipe demand. Domestic manufacturing capacity is expanding.'
  },
  {
    slug: createSlug('HSAW Pipes'),
    name: 'HSAW Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Helical Submerged Arc Welded (HSAW) Pipes are large-diameter spiral-welded steel pipes manufactured from HR coils. They are the most cost-effective large-bore pipe option for water transmission, piling, and low-to-medium pressure applications.',
    industries: ['Water Pipeline', 'Construction', 'Infrastructure', 'Oil Pipeline', 'Agriculture'],
    grades: ['IS 3589 Fe410', 'IS 3589 Fe490', 'API 5L Gr.B/X42/X52', 'ASTM A252'],
    specifications: ['OD: 219mm – 3500mm', 'Wall thickness: 5mm – 25mm', 'Length: 6m – 12.2m', 'Weld type: Helical/Spiral'],
    standards: ['IS 3589', 'API 5L', 'ASTM A252', 'EN 10219'],
    hsnCodes: ['7305'],
    orderSizes: '100 MT to 5000 MT per order',
    importCountries: ['China', 'Vietnam', 'Turkey', 'South Korea', 'UAE', 'Indonesia'],
    relatedSlugs: ['lsaw-pipes-india', 'ms-pipes-india', 'seamless-pipes-india', 'erw-pipes-india'],
    priceRange: '₹48,000 – ₹72,000 per MT',
    applications: ['Potable water transmission pipelines', 'Sewage force mains', 'Irrigation canals and siphons', 'Foundation piling', 'Culverts and stormwater drains', 'Low-pressure gas distribution'],
    challenges: ['Ovality and dimensional tolerance for large diameters', 'Internal and external coating requirements', 'Transportation logistics for large pipes', 'Weld quality consistency in spiral welding'],
    marketTrend: 'National Water Mission and smart city water supply projects are driving massive HSAW pipe demand across India.'
  },
  {
    slug: createSlug('Stainless Steel Pipes'),
    name: 'Stainless Steel Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Stainless Steel Pipes are corrosion-resistant alloy steel tubes available in austenitic (304/316), ferritic (409/430), and duplex grades. They are essential for food processing, pharmaceutical, chemical, and architectural applications where corrosion resistance is paramount.',
    industries: ['Chemical Processing', 'Food & Beverage', 'Pharmaceutical', 'Oil & Gas', 'Architecture', 'Power Generation'],
    grades: ['304/304L', '316/316L', '321', '347', '2205 Duplex', '410', '430'],
    specifications: ['OD: 6mm – 600mm', 'Wall thickness: 0.5mm – 30mm', 'Type: Seamless / Welded', 'Finish: 2B / BA / Mirror / Electropolished'],
    standards: ['ASTM A312', 'ASTM A269', 'ASTM A358', 'IS 6913', 'EN 10216-5'],
    hsnCodes: ['7304', '7306'],
    orderSizes: '500 kg to 50 MT per order',
    importCountries: ['China', 'Japan', 'South Korea', 'Indonesia', 'Taiwan', 'Italy', 'Germany'],
    relatedSlugs: ['ms-pipes-india', 'nickel-alloys-india', 'seamless-pipes-india', 'precision-tubes-india'],
    priceRange: '₹200–₹800 per kg depending on grade',
    applications: ['Chemical process piping', 'Food and dairy processing lines', 'Pharmaceutical clean piping', 'Architectural handrails and facades', 'Heat exchanger tubes', 'Nuclear power plant piping'],
    challenges: ['Grade selection for specific corrosion environment', 'Intergranular corrosion testing requirements', 'Surface finish specifications per application', 'Price volatility linked to nickel and chrome'],
    marketTrend: 'India\'s stainless steel pipe demand growing driven by pharmaceutical, food processing, and chemical industry expansion.'
  },
  {
    slug: createSlug('Boiler Tubes'),
    name: 'Boiler Tubes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Boiler Tubes are specialized seamless or welded steel tubes designed for high-temperature, high-pressure service in power plant boilers, heat recovery systems, and industrial heating equipment. They require strict quality certification and material traceability.',
    industries: ['Power Generation', 'Boiler', 'Oil & Gas', 'Chemical Processing', 'Industrial'],
    grades: ['SA 106 Gr.B', 'SA 210 Gr.A1', 'SA 213 T11/T22/T91', 'SA 192', 'IS 1914'],
    specifications: ['OD: 12.7mm – 168mm', 'Wall thickness: 1.5mm – 15mm', 'Length: Random / Cut-to-length', 'Type: Seamless / Welded'],
    standards: ['ASME SA 106', 'ASME SA 210', 'ASME SA 213', 'IS 1914', 'EN 10216-2'],
    hsnCodes: ['7304'],
    orderSizes: '2 MT to 50 MT per order',
    importCountries: ['China', 'Japan', 'South Korea', 'Germany', 'Czech Republic', 'Italy', 'USA'],
    relatedSlugs: ['seamless-pipes-india', 'stainless-steel-pipes-india', 'precision-tubes-india', 'ms-pipes-india'],
    priceRange: '₹120–₹500 per kg depending on grade',
    applications: ['Thermal power plant boiler tubes', 'HRSG (Heat Recovery Steam Generator)', 'Superheater and reheater tubes', 'Economizer sections', 'Industrial boiler fire tubes', 'Process heater coils'],
    challenges: ['IBR (Indian Boiler Regulations) certification', 'Material traceability and EN 10204 3.2 certificates', 'Creep strength requirements for high-temperature grades', 'Long lead times for alloy grades'],
    marketTrend: 'Thermal power plant maintenance and new capacity additions sustaining boiler tube demand. Shift to supercritical boilers requiring T91/T92 grades.'
  },
  {
    slug: createSlug('Precision Tubes'),
    name: 'Precision Tubes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Precision Tubes are cold-drawn seamless or welded steel tubes with tight dimensional tolerances, smooth surface finish, and specific mechanical properties. They are used in automotive, hydraulic, instrumentation, and bearing applications requiring precise dimensions.',
    industries: ['Automotive', 'Hydraulic Equipment', 'Instrumentation', 'Industrial', 'Construction', 'Defense'],
    grades: ['IS 3074', 'SAE 1020', 'SAE 1045', 'EN8', 'AISI 4130', 'ST52'],
    specifications: ['OD: 6mm – 120mm', 'Wall thickness: 1mm – 12mm', 'Tolerance: ±0.05mm to ±0.10mm', 'Surface: Ra ≤1.6 μm'],
    standards: ['IS 3074', 'DIN 2391', 'EN 10305-1', 'ASTM A519'],
    hsnCodes: ['7304'],
    orderSizes: '1 MT to 20 MT per order',
    importCountries: ['China', 'Germany', 'Japan', 'South Korea', 'Italy', 'Czech Republic', 'Taiwan'],
    relatedSlugs: ['hydraulic-tubes-india', 'seamless-pipes-india', 'stainless-steel-pipes-india', 'boiler-tubes-india'],
    priceRange: '₹100–₹300 per kg depending on grade and tolerance',
    applications: ['Automotive shock absorber cylinders', 'Hydraulic cylinder barrels', 'Instrumentation tubing', 'Bearing sleeves and bushes', 'Pneumatic cylinder tubes', 'Precision machinery shafts'],
    challenges: ['Tight OD/ID tolerance requirements', 'Surface roughness specifications', 'Heat treatment and hardness consistency', 'Minimum order quantities for special sizes'],
    marketTrend: 'Automotive production growth and hydraulic equipment manufacturing expansion driving precision tube demand in India.'
  },
  {
    slug: createSlug('Hydraulic Tubes'),
    name: 'Hydraulic Tubes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Hydraulic Tubes are high-precision seamless cold-drawn tubes specifically designed for hydraulic cylinder, fluid power, and pneumatic system applications. They feature superior surface finish, tight tolerances, and high burst pressure ratings.',
    industries: ['Heavy Engineering', 'Construction', 'Mining Equipment', 'Agricultural Equipment', 'Industrial', 'Defense'],
    grades: ['ST52 (E355)', 'SAE 1020', 'SAE 1026', 'AISI 4130', 'EN 10305-1 E355+SR'],
    specifications: ['OD: 25mm – 300mm', 'Wall thickness: 3mm – 25mm', 'ID tolerance: H8 / H9', 'Surface finish: Ra ≤0.4 μm (honed)'],
    standards: ['DIN 2391', 'EN 10305-1', 'IS 3074', 'ASTM A519'],
    hsnCodes: ['7304'],
    orderSizes: '1 MT to 20 MT per order',
    importCountries: ['China', 'Germany', 'Japan', 'Italy', 'Czech Republic', 'South Korea', 'Turkey'],
    relatedSlugs: ['precision-tubes-india', 'seamless-pipes-india', 'ms-pipes-india', 'stainless-steel-pipes-india'],
    priceRange: '₹130–₹400 per kg depending on finish',
    applications: ['Hydraulic cylinder barrels', 'Telescopic cylinder tubes', 'Pneumatic cylinder bodies', 'Crane boom cylinders', 'Earth-moving equipment cylinders', 'Press machine hydraulic rams'],
    challenges: ['ID honing quality and surface finish', 'Straightness tolerance for telescopic applications', 'Chrome plating quality for piston rods', 'Pressure testing certification'],
    marketTrend: 'Construction equipment and earth-moving machinery demand driving hydraulic tube consumption. Make in India boosting domestic hydraulic cylinder manufacturing.'
  },
  // ─── NEW PIPE PRODUCTS ────────────────────────────────────────
  {
    slug: createSlug('DI Pipes'),
    name: 'DI Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Ductile Iron (DI) Pipes are centrifugally cast iron pipes with nodular graphite structure providing superior strength, ductility, and corrosion resistance. They are the preferred material for potable water transmission, sewage mains, and fire hydrant systems in India\'s urban infrastructure.',
    industries: ['Water Supply', 'Sewage', 'Construction', 'Infrastructure', 'Industrial'],
    grades: ['IS 8329 (Class K7/K9)', 'ISO 2531', 'EN 545', 'ANSI/AWWA C151'],
    specifications: ['DN: 80mm – 2200mm', 'Pressure class: K7/K9/K12', 'Length: 5.5m / 6m standard', 'Joint: Push-on / Mechanical / Flanged'],
    standards: ['IS 8329', 'ISO 2531', 'EN 545', 'AWWA C151'],
    hsnCodes: ['7303'],
    orderSizes: '50 MT to 2000 MT per order',
    importCountries: ['China', 'Turkey', 'UAE', 'Japan', 'South Korea', 'Vietnam'],
    relatedSlugs: ['ms-pipes-india', 'hdpe-pipes-india', 'hsaw-pipes-india', 'pvc-pipes-india'],
    priceRange: '₹35,000 – ₹55,000 per MT',
    applications: ['Municipal water supply mains', 'Sewage force mains', 'Fire hydrant networks', 'Raw water intake pipes', 'Industrial cooling water systems', 'Pumping station piping'],
    challenges: ['Internal cement mortar lining quality', 'External zinc + bitumen coating compliance', 'Pipe joint leakage during pressure testing', 'Weight and handling for large diameters'],
    marketTrend: 'AMRUT 2.0 and Jal Jeevan Mission creating massive demand for DI pipes. India\'s DI pipe market exceeds ₹12,000 crore annually.'
  },
  {
    slug: createSlug('API Pipes'),
    name: 'API Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'API (American Petroleum Institute) Pipes are steel line pipes and casing tubes manufactured to API 5L and API 5CT specifications for oil and gas exploration, production, and transmission. They are among the highest-value pipe products with stringent quality and testing requirements.',
    industries: ['Oil & Gas', 'Offshore', 'Oil Pipeline', 'Gas Distribution', 'Power Generation'],
    grades: ['API 5L Gr.B/X42/X52/X60/X65/X70/X80', 'API 5CT J55/K55/N80/L80/P110'],
    specifications: ['OD: 21mm – 1524mm', 'Wall thickness: 2mm – 50mm', 'Type: Seamless/ERW/LSAW/HSAW', 'End: Plain/Threaded/Coupled'],
    standards: ['API 5L PSL1/PSL2', 'API 5CT', 'NACE MR0175 (sour service)'],
    hsnCodes: ['7304', '7305', '7306'],
    orderSizes: '50 MT to 5000 MT per order',
    importCountries: ['Japan', 'South Korea', 'China', 'Germany', 'Italy', 'USA', 'UAE'],
    relatedSlugs: ['lsaw-pipes-india', 'seamless-pipes-india', 'ms-pipes-india', 'hsaw-pipes-india'],
    priceRange: '₹70,000 – ₹200,000 per MT depending on grade',
    applications: ['Onshore oil and gas pipelines', 'Offshore flowlines and risers', 'Oil well casing and tubing', 'Gas transmission networks', 'Refinery process piping', 'City gas distribution steel mains'],
    challenges: ['API monogram certification requirements', 'PSL2 HIC/SSC testing for sour service', 'Hydrostatic testing at specified pressures', 'Material traceability and documentation'],
    marketTrend: 'India\'s oil & gas pipeline network expansion (CGD, GAIL pipelines) and ONGC exploration activities driving sustained API pipe demand.'
  },
  {
    slug: createSlug('Seamless Pipes'),
    name: 'Seamless Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Seamless Pipes are manufactured from solid steel billets without any welded seam, providing uniform strength and pressure-bearing capacity. They are essential for high-pressure, high-temperature applications in oil & gas, boiler, and heavy engineering industries.',
    industries: ['Oil & Gas', 'Power Generation', 'Heavy Engineering', 'Automotive', 'Boiler', 'Chemical Processing'],
    grades: ['ASTM A106 Gr.B', 'ASTM A53 Gr.B', 'API 5L Gr.B/X42/X52', 'SA 210 Gr.A1', 'IS 1239', 'DIN 2448 ST52'],
    specifications: ['OD: 10mm – 660mm', 'Wall thickness: 2mm – 60mm', 'Length: Random 5–7m / Fixed', 'Type: Hot finished / Cold drawn'],
    standards: ['ASTM A106', 'ASTM A53', 'API 5L', 'IS 1239', 'EN 10216'],
    hsnCodes: ['7304'],
    orderSizes: '5 MT to 200 MT per order',
    importCountries: ['China', 'Japan', 'South Korea', 'Germany', 'Italy', 'USA', 'Czech Republic'],
    relatedSlugs: ['ms-pipes-india', 'api-pipes-india', 'boiler-tubes-india', 'precision-tubes-india', 'lsaw-pipes-india'],
    priceRange: '₹65,000 – ₹150,000 per MT depending on grade',
    applications: ['High-pressure process piping', 'Oil & gas well casing', 'Boiler and superheater tubes', 'Hydraulic cylinder barrels', 'Mechanical engineering shafts', 'Nuclear power plant piping'],
    challenges: ['Price premium over ERW pipes (30–60%)', 'Lead time for non-standard sizes', 'Mill certificate and third-party inspection', 'Dimensional tolerance for machined applications'],
    marketTrend: 'Oil & gas exploration, power plant construction, and heavy engineering driving seamless pipe demand in India. ISMT and Jindal Saw are major domestic producers.'
  },
  {
    slug: createSlug('ERW Pipes'),
    name: 'ERW Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'pipes',
    definition: 'Electric Resistance Welded (ERW) Pipes are manufactured by cold-forming HR coil/strip and welding longitudinally using high-frequency electric resistance welding. They are the most cost-effective steel pipe solution for structural, water, and general engineering applications.',
    industries: ['Construction', 'Water Supply', 'Oil & Gas', 'Infrastructure', 'Automotive', 'Agriculture'],
    grades: ['IS 1239 Medium/Heavy', 'IS 3589 Fe410/Fe490', 'API 5L Gr.B/X42', 'ASTM A53 Gr.B'],
    specifications: ['OD: 15mm – 610mm', 'Wall thickness: 1.5mm – 12mm', 'Length: 6m / 12m', 'Weld type: HF ERW'],
    standards: ['IS 1239', 'IS 3589', 'API 5L', 'ASTM A53', 'EN 10219'],
    hsnCodes: ['7306'],
    orderSizes: '10 MT to 500 MT per order',
    importCountries: ['China', 'Vietnam', 'South Korea', 'Turkey', 'Indonesia', 'Thailand'],
    relatedSlugs: ['ms-pipes-india', 'gi-pipes-india', 'seamless-pipes-india', 'lsaw-pipes-india', 'api-pipes-india'],
    priceRange: '₹48,000 – ₹68,000 per MT',
    applications: ['Water distribution pipelines', 'Structural hollow sections', 'Oil & gas gathering lines', 'Scaffolding tubes', 'Automotive exhaust systems', 'Furniture and racking systems'],
    challenges: ['Weld seam integrity testing (hydro/eddy current)', 'OD/thickness tolerance per standard', 'Galvanizing quality for GI conversion', 'Import anti-dumping duties'],
    marketTrend: 'India\'s ERW pipe market exceeds 8 MTPA capacity. Growth driven by infrastructure, water, and structural applications. Major producers: APL Apollo, Tata Steel BSL.'
  },
];

// ─── BUILDING & CONSTRUCTION ────────────────────────────────────
const constructionProducts: DemandProduct[] = [
  {
    slug: createSlug('Cement'),
    name: 'Cement',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Cement is the fundamental binding material for concrete production and construction. India is the world\'s second-largest cement producer with over 570 MTPA installed capacity. Major types include Ordinary Portland Cement (OPC), Portland Pozzolana Cement (PPC), and Portland Slag Cement (PSC).',
    industries: ['Construction', 'Infrastructure', 'Real Estate', 'Precast', 'Industrial'],
    grades: ['OPC 33 Grade', 'OPC 43 Grade', 'OPC 53 Grade', 'PPC (Fly Ash)', 'PSC (Slag)', 'SRC (Sulphate Resistant)'],
    specifications: ['Fineness: 225–400 m²/kg', 'Setting time: Initial 30min / Final 600min', 'Compressive strength: 33–53 MPa at 28 days', 'Packaging: 50 kg bags / Bulk'],
    standards: ['IS 269 (OPC)', 'IS 1489 (PPC)', 'IS 455 (PSC)', 'ASTM C150'],
    hsnCodes: ['2523'],
    orderSizes: '50 MT to 5000 MT per order',
    importCountries: ['UAE', 'Vietnam', 'Pakistan', 'Indonesia', 'Bangladesh', 'Japan'],
    relatedSlugs: ['concrete-india', 'tiles-india', 'roofing-materials-india', 'tmt-bars-india', 'aac-blocks-india'],
    priceRange: '₹320 – ₹450 per 50 kg bag',
    applications: ['RCC construction (residential, commercial, industrial)', 'Road and highway construction', 'Bridge and dam construction', 'Precast concrete products', 'Tile and block manufacturing', 'Oil well cementing'],
    challenges: ['Grade selection based on application and environment', 'Seasonal demand fluctuations', 'Transportation cost impact (15–20% of delivered cost)', 'Quality consistency between batches'],
    marketTrend: 'India\'s cement demand growing at 5–7% CAGR driven by PM Awas Yojana, Bharatmala, and smart city infrastructure. Green cement adoption increasing.'
  },
  {
    slug: createSlug('Concrete'),
    name: 'Concrete',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Concrete is a composite material made from cement, aggregates, water, and admixtures. Ready-Mix Concrete (RMC) is the fastest-growing construction material segment in India, providing consistent quality, reduced wastage, and faster construction speed compared to site-mixed concrete.',
    industries: ['Construction', 'Infrastructure', 'Real Estate', 'Precast', 'Industrial'],
    grades: ['M15', 'M20', 'M25', 'M30', 'M40', 'M50', 'M60', 'Self Compacting (SCC)', 'High Performance'],
    specifications: ['Compressive strength: 15–60 MPa', 'Slump: 75–200mm', 'Water-cement ratio: 0.35–0.55', 'Max aggregate: 10–20mm'],
    standards: ['IS 456', 'IS 4926 (RMC)', 'ASTM C94', 'ACI 318'],
    hsnCodes: ['3824'],
    orderSizes: '50 m³ to 50,000 m³ per project',
    importCountries: [],
    relatedSlugs: ['cement-india', 'tmt-bars-india', 'tiles-india', 'ready-mix-concrete-india', 'aac-blocks-india'],
    priceRange: '₹4,000 – ₹8,000 per m³',
    applications: ['Foundation and structural construction', 'Road pavement construction', 'Bridge decks and piers', 'Precast structural elements', 'Mass concrete for dams', 'Self-leveling floor screeds'],
    challenges: ['Slump and workability management at site', 'Transit time impact on quality', 'Admixture compatibility testing', 'Cold and hot weather concreting protocols'],
    marketTrend: 'India\'s RMC market growing at 12–15% CAGR driven by urbanization, quality consciousness, and green building adoption.'
  },
  {
    slug: createSlug('Sanitary Ware'),
    name: 'Sanitary Ware',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Sanitary Ware encompasses vitreous china and ceramic bathroom fixtures including water closets, wash basins, urinals, bidets, and pedestals. India is a major sanitary ware manufacturer with domestic demand exceeding 30 million pieces annually.',
    industries: ['Construction', 'Real Estate', 'Hospitality', 'Healthcare', 'Residential', 'Commercial Buildings'],
    grades: ['Economy', 'Mid-segment', 'Premium', 'Luxury', 'Smart (IoT-enabled)'],
    specifications: ['Material: Vitreous China / Ceramic', 'Flush: Single (6L) / Dual (3/6L)', 'Trap: S-trap / P-trap', 'Glaze: Anti-bacterial / Self-cleaning'],
    standards: ['IS 2556', 'IS 771', 'EN 997', 'ASME A112'],
    hsnCodes: ['6910'],
    orderSizes: '100 to 10,000 pieces per order',
    importCountries: ['China', 'Vietnam', 'Thailand', 'Spain', 'Italy', 'Germany'],
    relatedSlugs: ['tiles-india', 'plumbing-supplies-india', 'flooring-india', 'cement-india'],
    priceRange: '₹1,500 – ₹50,000 per piece',
    applications: ['Residential bathroom construction', 'Hotel and hospitality projects', 'Hospital and healthcare facilities', 'Commercial office buildings', 'Public and institutional projects', 'Smart bathroom systems'],
    challenges: ['Product quality consistency across batches', 'Breakage during transportation (8–12%)', 'Installation compatibility with local plumbing', 'After-sales warranty and replacement'],
    marketTrend: 'Swachh Bharat Mission, affordable housing, and premiumization driving sanitary ware demand growth at 9–11% CAGR.'
  },
  {
    slug: createSlug('Roofing Materials'),
    name: 'Roofing Materials',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Roofing Materials encompass metal sheets, fibre cement sheets, clay and concrete tiles, polycarbonate sheets, and waterproofing membranes used for residential, commercial, and industrial roofing. India\'s roofing market is transitioning from asbestos-cement to metal and polymer solutions.',
    industries: ['Construction', 'Industrial', 'Residential', 'Agriculture', 'Warehousing', 'Commercial Buildings'],
    grades: ['Metal Roofing (GI/Color Coated)', 'Fibre Cement', 'Clay Tiles', 'Concrete Tiles', 'Polycarbonate', 'Bituminous Waterproofing'],
    specifications: ['Thickness: 0.35mm – 1.0mm (metal)', 'Profile: Corrugated / Trapezoidal / Standing Seam', 'Wind uplift: As per IS 875 Part 3', 'Thermal: U-value per ECBC'],
    standards: ['IS 277', 'IS 14246', 'IS 459 (fibre cement)', 'NBC 2016'],
    hsnCodes: ['7210', '6811', '6905'],
    orderSizes: '1,000 to 100,000 sq.m per project',
    importCountries: ['China', 'South Korea', 'Vietnam', 'Turkey', 'Malaysia', 'Thailand'],
    relatedSlugs: ['metal-roofing-india', 'galvanized-coils-india', 'color-coated-sheets-india', 'cement-india'],
    priceRange: '₹200 – ₹800 per sq.m',
    applications: ['Industrial factory roofing', 'Warehouse and logistics facilities', 'Residential roofing', 'Agricultural storage structures', 'Commercial complex roofing', 'Sports facility domes and canopies'],
    challenges: ['Wind and rain load calculation per location', 'Thermal comfort without insulation', 'Leakage prevention at joints and penetrations', 'Corrosion in coastal and industrial environments'],
    marketTrend: 'India\'s roofing material market growing at 8% CAGR. Metal roofing gaining share over fibre cement. Green roofing and cool roof concepts emerging.'
  },
  {
    slug: createSlug('Tiles'),
    name: 'Tiles',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Tiles encompass ceramic, vitrified, porcelain, and natural stone tiles used for floor, wall, and facade applications. India is the world\'s second-largest tile producer with installed capacity exceeding 1,500 million sq.m annually, centered in Morbi (Gujarat).',
    industries: ['Construction', 'Real Estate', 'Hospitality', 'Healthcare', 'Commercial Buildings', 'Residential'],
    grades: ['Ceramic Floor Tiles', 'Vitrified (Polished/Matte/Rustic)', 'Porcelain', 'Double Charge', 'GVT (Glazed Vitrified)', 'PGVT (Polished GVT)'],
    specifications: ['Size: 300x300mm to 1200x2400mm', 'Thickness: 8mm – 12mm', 'Water absorption: <0.5% (vitrified)', 'Breaking strength: >2000N'],
    standards: ['IS 13753', 'IS 15622', 'EN 14411', 'ISO 13006'],
    hsnCodes: ['6907', '6908'],
    orderSizes: '1,000 to 100,000 sq.m per order',
    importCountries: ['China', 'Spain', 'Italy', 'Vietnam', 'Indonesia', 'Turkey'],
    relatedSlugs: ['flooring-india', 'sanitary-ware-india', 'cement-india', 'roofing-materials-india'],
    priceRange: '₹25 – ₹300 per sq.ft',
    applications: ['Residential flooring and walls', 'Commercial office and mall flooring', 'Hospital and laboratory walls', 'Hotel lobby and room flooring', 'Exterior facade cladding', 'Swimming pool and wet area tiling'],
    challenges: ['Color shade and calibre matching across lots', 'Planarity and rectification requirements', 'Slip resistance for safety applications', 'Installation quality impact on performance'],
    marketTrend: 'India\'s tile market growing at 7–9% CAGR driven by urbanization and premiumization. Large-format and slab tiles gaining market share.'
  },
  {
    slug: createSlug('Flooring'),
    name: 'Flooring',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Flooring encompasses diverse floor covering solutions including vinyl (LVT/SPC), laminate, hardwood, epoxy, and natural stone flooring. India\'s organized flooring market is growing rapidly with the shift from traditional tiles to engineered flooring solutions in commercial and premium residential segments.',
    industries: ['Construction', 'Real Estate', 'Hospitality', 'Healthcare', 'Industrial', 'Commercial Buildings'],
    grades: ['Vinyl (LVT/SPC)', 'Laminate', 'Engineered Hardwood', 'Epoxy', 'PU (Polyurethane)', 'Terrazzo', 'Natural Stone'],
    specifications: ['Thickness: 1.5mm – 12mm', 'Wear layer: 0.2mm – 0.7mm', 'Fire rating: Bfl-s1 / Class B', 'Slip rating: R9 – R13'],
    standards: ['IS 3461', 'EN 14041', 'ASTM F1700', 'EN ISO 10582'],
    hsnCodes: ['3918', '4411'],
    orderSizes: '500 to 50,000 sq.m per project',
    importCountries: ['China', 'South Korea', 'Belgium', 'Germany', 'Vietnam', 'Malaysia'],
    relatedSlugs: ['tiles-india', 'cement-india', 'sanitary-ware-india', 'glass-glazing-india'],
    priceRange: '₹50 – ₹500 per sq.ft',
    applications: ['Commercial office flooring', 'Hospital and clean room flooring', 'Hotel room and corridor flooring', 'Retail showroom and mall flooring', 'Industrial warehouse epoxy flooring', 'Residential premium flooring'],
    challenges: ['Subfloor preparation and moisture testing', 'VOC emission compliance for indoor air quality', 'Maintenance and lifecycle cost analysis', 'Acclimatization requirements for wood flooring'],
    marketTrend: 'India\'s organized flooring market growing at 15–20% CAGR. SPC vinyl flooring emerging as the fastest-growing segment due to waterproof properties and ease of installation.'
  },
  {
    slug: createSlug('Electrical Fittings'),
    name: 'Electrical Fittings',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Electrical Fittings encompass switches, sockets, MCBs, distribution boards, cable trays, conduits, and wiring accessories used in residential, commercial, and industrial electrical installations. India\'s electrical fitting market is driven by construction activity and electrification programs.',
    industries: ['Construction', 'Real Estate', 'Industrial', 'Commercial Buildings', 'Infrastructure', 'Residential'],
    grades: ['Economy', 'Standard', 'Premium', 'Modular', 'Industrial', 'Smart/IoT-enabled'],
    specifications: ['Voltage: 240V / 415V', 'Current: 6A – 63A', 'Protection: IP20 – IP65', 'Material: ABS / PC / Brass / Copper'],
    standards: ['IS 3854', 'IS 1293', 'IS 8828', 'IS 12640', 'IEC 60898'],
    hsnCodes: ['8536', '8537'],
    orderSizes: '₹50,000 to ₹5 crore per project',
    importCountries: ['China', 'South Korea', 'Japan', 'Germany', 'Italy', 'Turkey'],
    relatedSlugs: ['plumbing-supplies-india', 'cement-india', 'tiles-india', 'glass-glazing-india'],
    priceRange: '₹15 – ₹5,000 per piece',
    applications: ['Residential wiring and switch systems', 'Commercial electrical distribution', 'Industrial motor control panels', 'Street lighting and outdoor fixtures', 'Data centre power distribution', 'Smart home automation systems'],
    challenges: ['BIS certification requirement for safety', 'Counterfeit product identification', 'Standard vs modular series selection', 'Fire safety rating compliance'],
    marketTrend: 'India\'s electrical fitting market exceeds ₹15,000 crore. Growth driven by smart home adoption, premiumization, and ECBC compliance mandates.'
  },
  {
    slug: createSlug('Plumbing Supplies'),
    name: 'Plumbing Supplies',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Plumbing Supplies encompass pipes, fittings, valves, taps, cisterns, and accessories for water supply, drainage, and sanitation systems. India\'s plumbing market is transitioning from GI/CI to CPVC, PPR, and composite piping systems for modern construction.',
    industries: ['Construction', 'Real Estate', 'Hospitality', 'Healthcare', 'Industrial', 'Residential'],
    grades: ['CPVC Systems', 'PPR Systems', 'PVC-U (Drainage)', 'Brass Fittings', 'SS Fittings', 'Composite (PEX-Al-PEX)'],
    specifications: ['Pipe sizes: 15mm – 110mm', 'Pressure: 6 – 16 bar', 'Temperature: Up to 93°C (CPVC)', 'Material: CPVC / PPR / Brass / SS'],
    standards: ['IS 15778', 'IS 12235', 'ASTM D2846 (CPVC)', 'DIN 8077/8078 (PPR)'],
    hsnCodes: ['3917', '7412'],
    orderSizes: '₹1 lakh to ₹2 crore per project',
    importCountries: ['China', 'Germany', 'Italy', 'Turkey', 'South Korea', 'Spain'],
    relatedSlugs: ['sanitary-ware-india', 'gi-pipes-india', 'pvc-pipes-india', 'tiles-india'],
    priceRange: '₹20 – ₹5,000 per piece',
    applications: ['Hot and cold water plumbing', 'Building drainage systems', 'Fire sprinkler systems', 'Swimming pool piping', 'Hospital medical gas piping', 'Industrial process piping'],
    challenges: ['CPVC vs PPR selection for hot water', 'Jointing method training for installers', 'Pipe sizing and pressure calculation', 'Quality certification for potable water'],
    marketTrend: 'India\'s plumbing market growing at 10% CAGR driven by CPVC adoption replacing GI pipes, green building requirements, and smart plumbing systems.'
  },
  {
    slug: createSlug('Glass Glazing'),
    name: 'Glass Glazing',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Glass Glazing encompasses flat glass products including float glass, tempered glass, laminated glass, insulated glass units (IGU), and Low-E coated glass used for building facades, windows, partitions, and architectural applications. India\'s architectural glass market is growing rapidly with green building mandates.',
    industries: ['Construction', 'Architecture', 'Real Estate', 'Automotive', 'Solar Energy', 'Industrial'],
    grades: ['Clear Float', 'Tinted', 'Reflective', 'Tempered (Toughened)', 'Laminated', 'Low-E Coated', 'Insulated Glass Unit (IGU)'],
    specifications: ['Thickness: 3mm – 19mm', 'Size: Up to 3210mm × 6000mm', 'U-value: 1.1 – 5.8 W/m²K', 'Safety: BS EN 12150 (tempered)'],
    standards: ['IS 2553', 'IS 14900', 'EN 12150', 'EN 14449', 'ANSI Z97.1'],
    hsnCodes: ['7005', '7007', '7008'],
    orderSizes: '100 to 50,000 sq.m per project',
    importCountries: ['China', 'UAE', 'Malaysia', 'Indonesia', 'Thailand', 'Belgium'],
    relatedSlugs: ['cement-india', 'tiles-india', 'aluminium-sheets-india', 'roofing-materials-india'],
    priceRange: '₹100–₹1,500 per sq.ft depending on type',
    applications: ['Building facade curtain walls', 'Windows and doors', 'Interior partitions and railings', 'Shower enclosures', 'Solar panel glass covers', 'Skylights and canopies'],
    challenges: ['Thermal performance specifications (U-value)', 'Safety glass requirements per NBC', 'Installation and sealing quality', 'Breakage during transportation and handling'],
    marketTrend: 'Energy-efficient glass (Low-E, IGU) adoption increasing with green building mandates. India\'s flat glass production expanding with new float glass plants.'
  },
  {
    slug: createSlug('Metal Roofing'),
    name: 'Metal Roofing',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Metal Roofing encompasses profiled steel and aluminium roofing sheets including corrugated, trapezoidal, standing seam, and clip-lock profiles. Metal roofing dominates India\'s industrial, commercial, and pre-engineered building segments due to its durability, speed of installation, and recyclability.',
    industries: ['Industrial', 'Commercial', 'Pre-Engineered Buildings', 'Warehousing', 'Agriculture', 'Residential'],
    grades: ['Galvanized (GI) Sheets', 'Galvalume (Al-Zn) Sheets', 'Color Coated (PPGI/PPGL)', 'Aluminium Roofing', 'Stainless Steel Roofing'],
    specifications: ['Thickness: 0.35mm – 1.0mm', 'Width: 1050mm – 1250mm', 'Coating: Z120 – Z275 (galvanized)', 'Profile depth: 17mm – 50mm'],
    standards: ['IS 277', 'IS 14246', 'ASTM A792', 'AS 1397'],
    hsnCodes: ['7210', '7606'],
    orderSizes: '5,000 sq.m to 200,000 sq.m per project',
    importCountries: ['South Korea', 'China', 'Vietnam', 'Indonesia', 'Turkey'],
    relatedSlugs: ['galvanized-coils-india', 'color-coated-sheets-india', 'roofing-materials-india', 'cement-india'],
    priceRange: '₹280–₹650 per sq.m',
    applications: ['Factory and warehouse roofing', 'Pre-engineered metal building systems', 'Commercial complex roofing', 'Agricultural storage sheds', 'Airport terminal roofing', 'Residential roofing (standing seam)'],
    challenges: ['Profile selection for span and wind load', 'Thermal expansion management', 'Condensation control in uninsulated roofs', 'Fastener corrosion in coastal environments'],
    marketTrend: 'Pre-engineered building market growth driving metal roofing demand. Standing seam systems gaining share in premium commercial and residential applications.'
  },
  // ─── NEW CONSTRUCTION PRODUCTS ────────────────────────────────
  {
    slug: createSlug('Paver Blocks'),
    name: 'Paver Blocks',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Paver Blocks (Interlocking Concrete Blocks) are precast concrete units designed for creating durable, permeable, and aesthetically pleasing pavements for roads, driveways, and industrial floors. India\'s paver block market is growing rapidly with smart city and road infrastructure programs.',
    industries: ['Construction', 'Infrastructure', 'Real Estate', 'Industrial', 'Commercial Buildings', 'Residential'],
    grades: ['M-25 (Light Traffic)', 'M-30 (Medium Traffic)', 'M-35 (Heavy Traffic)', 'M-40 (Very Heavy Traffic)', 'Colored/Pigmented'],
    specifications: ['Thickness: 60mm – 100mm', 'Compressive strength: 25–50 MPa', 'Water absorption: <6%', 'Shapes: Zigzag/I-shape/Rectangular/Hexagonal'],
    standards: ['IS 15658:2021', 'ASTM C936', 'EN 1338'],
    hsnCodes: ['6810'],
    orderSizes: '10,000 to 500,000 sq.m per project',
    importCountries: [],
    relatedSlugs: ['cement-india', 'concrete-india', 'tiles-india', 'aac-blocks-india', 'ready-mix-concrete-india'],
    priceRange: '₹30 – ₹80 per piece',
    applications: ['City road and footpath construction', 'Industrial yard and factory floors', 'Residential driveways and patios', 'Parking areas', 'Port and container terminals', 'Landscaping and garden pathways'],
    challenges: ['Edge restraint and bedding sand quality', 'Compressive strength verification', 'Color consistency for architectural projects', 'Interlocking pattern design per traffic load'],
    marketTrend: 'Smart city missions and AMRUT driving massive paver block demand for urban road beautification and flood management (permeable pavers).'
  },
  {
    slug: createSlug('AAC Blocks'),
    name: 'AAC Blocks',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Autoclaved Aerated Concrete (AAC) Blocks are lightweight precast building blocks made from cement, fly ash, lime, and aluminium powder. They offer superior thermal insulation, fire resistance, and faster construction speed compared to traditional clay bricks, making them the preferred masonry material for modern construction.',
    industries: ['Construction', 'Real Estate', 'Infrastructure', 'Industrial', 'Commercial Buildings', 'Residential'],
    grades: ['Density 451–550 kg/m³', 'Density 551–650 kg/m³', 'Density 651–750 kg/m³', 'Load Bearing', 'Non Load Bearing'],
    specifications: ['Size: 600×200×100/150/200/230mm', 'Density: 451–750 kg/m³', 'Compressive strength: 3–5 N/mm²', 'Thermal conductivity: 0.16–0.24 W/mK'],
    standards: ['IS 2185 Part 3', 'ASTM C1693', 'EN 771-4'],
    hsnCodes: ['6810'],
    orderSizes: '10,000 to 200,000 cubic meters per project',
    importCountries: [],
    relatedSlugs: ['cement-india', 'concrete-india', 'paver-blocks-india', 'tmt-bars-india', 'ready-mix-concrete-india'],
    priceRange: '₹3,500 – ₹4,500 per cubic meter',
    applications: ['Load-bearing and non-load-bearing walls', 'Partition walls in commercial buildings', 'High-rise residential construction', 'Fire-rated walls and barriers', 'Sound insulation walls', 'Green building construction (GRIHA/IGBC)'],
    challenges: ['Curing and moisture content at delivery', 'Specialized thin-bed adhesive mortar requirement', 'Chasing for electrical/plumbing runs', 'Anchoring and fixing in AAC walls'],
    marketTrend: 'AAC blocks replacing red bricks in urban construction at 15–20% CAGR. Green building mandates and fly ash utilization norms accelerating adoption.'
  },
  {
    slug: createSlug('Ready Mix Concrete'),
    name: 'Ready Mix Concrete',
    category: 'Building & Construction',
    categorySlug: 'building-construction',
    industrySlug: 'construction',
    subIndustrySlug: 'construction',
    definition: 'Ready Mix Concrete (RMC) is factory-produced concrete delivered to construction sites in transit mixers. It provides consistent quality, eliminates on-site mixing, and reduces material wastage. India\'s RMC penetration is growing from 15% toward the global average of 60%.',
    industries: ['Construction', 'Infrastructure', 'Real Estate', 'Industrial', 'Precast', 'Commercial Buildings'],
    grades: ['M15/M20 (general)', 'M25/M30 (structural)', 'M40/M50 (high strength)', 'M60/M80 (ultra-high performance)', 'SCC (Self Compacting)', 'Fibre Reinforced'],
    specifications: ['Slump: 100–200mm', 'Pump pressure: up to 100 bar', 'Transit time: max 90 minutes', 'Admixtures: Superplasticizer/Retarder/Accelerator'],
    standards: ['IS 4926:2003', 'IS 456:2000', 'ACI 318', 'BS EN 206'],
    hsnCodes: ['3824'],
    orderSizes: '100 m³ to 100,000 m³ per project',
    importCountries: [],
    relatedSlugs: ['cement-india', 'concrete-india', 'tmt-bars-india', 'aac-blocks-india', 'paver-blocks-india'],
    priceRange: '₹4,500 – ₹9,000 per m³',
    applications: ['High-rise building construction', 'Metro rail and highway projects', 'Bridge and flyover construction', 'Industrial floor slabs', 'Precast element production', 'Mass concrete for dam and retaining walls'],
    challenges: ['Quality consistency across batches', 'Transit time limitations (90 minutes)', 'Pump line blockage prevention', 'Weather conditions impact on placement'],
    marketTrend: 'India\'s RMC market growing at 12–15% CAGR. UltraTech, ACC, and Ambuja are the largest RMC producers. Technology adoption driving growth.'
  },
];

// ─── COMPOSITES & GFRP ─────────────────────────────────────────
const compositeProducts: DemandProduct[] = [
  {
    slug: 'gfrp-sheets-india',
    name: 'GFRP Sheets',
    category: 'GFRP & Composites',
    categorySlug: 'gfrp-composites',
    industrySlug: 'composites',
    subIndustrySlug: 'gfrp',
    definition: 'Glass Fiber Reinforced Plastic (GFRP) sheets are high-strength, lightweight composite panels made from glass fiber embedded in a polymer resin matrix. They are widely used in industrial roofing, cladding, skylights, and corrosion-resistant enclosures across steel plants, chemical factories, warehouses, and infrastructure projects.',
    industries: ['Steel & Metal Plants', 'Chemical & Pharma', 'Warehousing & Logistics', 'Infrastructure & EPC', 'Food Processing', 'Water Treatment'],
    grades: ['Corrugated FRP Sheets', 'Flat FRP Sheets', 'Translucent Roofing Sheets', 'UV-Stabilized Sheets', 'Fire Retardant Sheets', 'Chemical Resistant Sheets'],
    specifications: ['Thickness: 1.0–3.0mm', 'Width: 1050–1200mm', 'Length: up to 12m', 'Light transmission: 60–85%', 'Glass content: 25–40%'],
    standards: ['IS 12866:1989', 'ASTM D5364', 'BS EN 1013', 'ISO 14125'],
    hsnCodes: ['3921', '7019'],
    orderSizes: '500 sq.m to 50,000 sq.m per order',
    importCountries: ['China', 'Thailand', 'Malaysia', 'Vietnam'],
    relatedSlugs: ['gfrp-gratings-india', 'gfrp-panels-india', 'gfrp-pipes-india', 'polycarbonate-sheets-india'],
    priceRange: '₹180 – ₹600 per sq.ft',
    applications: ['Industrial roofing and skylights', 'Warehouse cladding', 'Chemical plant enclosures', 'Cooling tower panels', 'Agricultural greenhouses', 'Factory daylighting systems'],
    challenges: ['UV degradation over time', 'Fire rating compliance for specific industries', 'Matching corrugation profiles with metal roofing', 'Quality consistency in glass fiber content'],
    marketTrend: 'GFRP sheet demand growing at 8–12% CAGR in India driven by warehouse construction boom, corrosion-resistant roofing needs in chemical/steel plants, and smart city infrastructure projects.',
    heroImage: gfrpSheetsImg,
    heroImageAlt: 'GFRP corrugated roofing sheets stacked in industrial warehouse'
  },
  {
    slug: 'gfrp-gratings-india',
    name: 'GFRP Gratings',
    category: 'GFRP & Composites',
    categorySlug: 'gfrp-composites',
    industrySlug: 'composites',
    subIndustrySlug: 'gfrp',
    definition: 'GFRP gratings are fiberglass-reinforced polymer grids used as anti-corrosive, lightweight walkways, platforms, and trench covers in industrial facilities. They replace traditional steel gratings in corrosive environments, offering superior chemical resistance, non-conductivity, and lower maintenance costs.',
    industries: ['Chemical & Petrochemical', 'Oil & Gas', 'Water Treatment', 'Power Plants', 'Steel Plants', 'Offshore & Marine'],
    grades: ['Molded Gratings (38mm, 50mm)', 'Pultruded Gratings (25mm, 30mm, 40mm)', 'Covered/Gritted Surface', 'Concave Top', 'Mini Mesh Gratings', 'Heavy Duty Load Rated'],
    specifications: ['Panel size: 1220×3660mm standard', 'Load capacity: up to 25 kN/m²', 'Resin systems: Polyester/Vinyl Ester/Phenolic', 'Fire retardant options: ASTM E84 Class 1'],
    standards: ['ASTM D4385', 'ASTM E84', 'BS 4592-3', 'ISO 14125'],
    hsnCodes: ['3925', '7019'],
    orderSizes: '100 sq.m to 10,000 sq.m per project',
    importCountries: ['China', 'USA', 'UK', 'Malaysia'],
    relatedSlugs: ['gfrp-sheets-india', 'gfrp-panels-india', 'gfrp-pipes-india'],
    priceRange: '₹3,000 – ₹12,000 per sq.m',
    applications: ['Chemical plant walkways and platforms', 'Trench and drain covers', 'Offshore platform decking', 'Water treatment plant flooring', 'Cooling tower structures', 'Sewage treatment plant access'],
    challenges: ['Load rating verification for specific applications', 'Resin system selection (polyester vs vinyl ester)', 'UV stabilization for outdoor installations', 'Cut-to-size accuracy and edge finishing'],
    marketTrend: 'FRP grating market expanding rapidly as Indian refineries, chemical plants, and water treatment facilities replace corroding steel gratings with maintenance-free GFRP alternatives.',
    heroImage: gfrpGratingsImg,
    heroImageAlt: 'Industrial FRP molded gratings with yellow safety border'
  },
  {
    slug: 'gfrp-panels-india',
    name: 'GFRP Structural Panels',
    category: 'GFRP & Composites',
    categorySlug: 'gfrp-composites',
    industrySlug: 'composites',
    subIndustrySlug: 'gfrp',
    definition: 'GFRP structural panels are high-performance composite wall and partition panels used in corrosive industrial environments, clean rooms, cold storage, and food processing facilities. They provide exceptional chemical resistance, thermal insulation, and hygienic surfaces without rusting or degradation.',
    industries: ['Food Processing', 'Pharmaceutical', 'Cold Storage', 'Chemical Plants', 'Healthcare', 'Data Centers'],
    grades: ['Flat Panels (smooth finish)', 'Embossed/Textured Panels', 'Insulated Sandwich Panels (PUF/PIR core)', 'Fire Rated Panels', 'Anti-microbial Panels', 'Translucent Panels'],
    specifications: ['Thickness: 2–50mm (with insulation)', 'Width: 1000–1220mm', 'Length: custom up to 12m', 'Surface: Gel-coated / smooth / textured'],
    standards: ['ASTM D5364', 'ASTM E84', 'FDA 21 CFR (food-grade)', 'IS 14856'],
    hsnCodes: ['3921', '3925'],
    orderSizes: '200 sq.m to 20,000 sq.m per project',
    importCountries: ['China', 'USA', 'Germany', 'South Korea'],
    relatedSlugs: ['gfrp-sheets-india', 'gfrp-gratings-india', 'polycarbonate-sheets-india'],
    priceRange: '₹400 – ₹2,500 per sq.ft',
    applications: ['Clean room wall and ceiling lining', 'Cold storage chamber walls', 'Food processing facility hygiene walls', 'Chemical plant partitions', 'Pharma manufacturing enclosures', 'Industrial canteen interiors'],
    challenges: ['Fire rating compliance for specific use cases', 'Joint sealing for hygiene-critical applications', 'Panel flatness and finish quality', 'Custom color and texture matching'],
    marketTrend: 'Growing demand from food processing, pharma, and cold chain sectors in India as FSSAI and GMP compliance drives adoption of hygienic, corrosion-proof GFRP panels.',
    heroImage: gfrpPanelsImg,
    heroImageAlt: 'Flat GFRP panels stacked in factory warehouse'
  },
  {
    slug: 'gfrp-pipes-india',
    name: 'GFRP Pipes',
    category: 'GFRP & Composites',
    categorySlug: 'gfrp-composites',
    industrySlug: 'composites',
    subIndustrySlug: 'gfrp',
    definition: 'GFRP (Glass Fiber Reinforced Plastic) pipes are composite piping systems designed for transporting corrosive chemicals, water, sewage, and industrial effluents. They offer superior corrosion resistance, long service life (50+ years), and lower lifecycle costs compared to steel, CI, or RCC pipes.',
    industries: ['Water Treatment', 'Chemical & Petrochemical', 'Oil & Gas', 'Irrigation', 'Power Plants', 'Municipal Infrastructure'],
    grades: ['Filament Wound Pipes', 'Centrifugally Cast (Hobas) Pipes', 'Hand Layup Pipes', 'High Pressure Pipes (PN 10/16/25)', 'Low Pressure Gravity Pipes', 'Jacking Pipes (trenchless)'],
    specifications: ['Diameter: DN 25 to DN 4000', 'Pressure: PN 1 to PN 32', 'Stiffness: SN 2500 to SN 10000', 'Length: 6m/12m standard', 'Liner: C-Glass / ECR Glass'],
    standards: ['IS 12709:1994', 'AWWA C950', 'ISO 14692', 'BS EN 1796', 'ASTM D2996/D2997'],
    hsnCodes: ['3917', '7019'],
    orderSizes: '500m to 50,000m per project',
    importCountries: ['China', 'Saudi Arabia', 'UAE', 'Turkey'],
    relatedSlugs: ['gfrp-sheets-india', 'gfrp-gratings-india', 'hdpe-pipes-india', 'upvc-pipes-india'],
    priceRange: '₹800 – ₹25,000 per running meter',
    applications: ['Municipal water supply mains', 'Sewage and effluent transport', 'Chemical process piping', 'Desalination plant piping', 'Irrigation canal crossings', 'Industrial cooling water systems'],
    challenges: ['Jointing methods (adhesive bonded vs rubber ring)', 'Handling and transport of large diameter pipes', 'UV protection for above-ground installations', 'Design verification for buried pipe conditions'],
    marketTrend: 'India\'s Jal Jeevan Mission and Smart Cities initiative driving massive GFRP pipe adoption for water supply and sewage networks. Market growing at 10–15% CAGR.',
    heroImage: gfrpPipesImg,
    heroImageAlt: 'Large diameter GFRP pipes stacked at construction site'
  },
  {
    slug: 'frp-tanks-india',
    name: 'FRP Storage Tanks',
    category: 'GFRP & Composites',
    categorySlug: 'gfrp-composites',
    industrySlug: 'composites',
    subIndustrySlug: 'gfrp',
    definition: 'FRP (Fiber Reinforced Plastic) storage tanks are corrosion-resistant vessels used for storing chemicals, water, acids, alkalis, and industrial effluents. They are manufactured through filament winding or hand layup processes and offer lightweight, leak-proof alternatives to MS, SS, and RCC tanks.',
    industries: ['Chemical & Petrochemical', 'Water Treatment', 'Pharmaceutical', 'Food Processing', 'Textile & Dyeing', 'Pulp & Paper'],
    grades: ['Vertical Flat Bottom Tanks', 'Horizontal Cylindrical Tanks', 'Underground Storage Tanks', 'Acid Storage Tanks (HCl, H2SO4)', 'Alkali Storage Tanks (NaOH)', 'Dual Laminate Tanks (FRP + HDPE/PP liner)'],
    specifications: ['Capacity: 500L to 200,000L', 'Diameter: 0.5m to 6m', 'Resin: Polyester/Vinyl Ester/Epoxy', 'Design: API 650 / BS 4994 standards'],
    standards: ['BS 4994:1987', 'ASTM D4097', 'API 650 (modified)', 'IS 10192'],
    hsnCodes: ['3925', '7019'],
    orderSizes: '1 to 50 tanks per order',
    importCountries: ['China', 'Malaysia', 'Thailand'],
    relatedSlugs: ['gfrp-pipes-india', 'gfrp-panels-india', 'hdpe-pipes-india'],
    priceRange: '₹50,000 – ₹25,00,000 per tank',
    applications: ['Chemical raw material storage', 'ETP/STP chemical dosing tanks', 'Acid and alkali storage in plants', 'Water storage in corrosive environments', 'Food-grade liquid storage', 'Underground fuel and chemical storage'],
    challenges: ['Design pressure and temperature validation', 'Nozzle and fitting integration', 'Seismic zone design considerations', 'Internal inspection and maintenance access'],
    marketTrend: 'FRP tank demand surging in India as chemical industry expands and environmental regulations mandate leak-proof, corrosion-resistant storage solutions.',
    heroImage: frpTanksImg,
    heroImageAlt: 'Large FRP chemical storage tanks at industrial plant'
  },
  {
    slug: 'gfrp-rebars-india',
    name: 'GFRP Rebars',
    category: 'GFRP & Composites',
    categorySlug: 'gfrp-composites',
    industrySlug: 'composites',
    subIndustrySlug: 'gfrp',
    definition: 'GFRP (Glass Fiber Reinforced Polymer) rebars are non-metallic reinforcement bars made from high-strength glass fibers embedded in a thermosetting polymer resin. They offer 2–3x higher tensile strength-to-weight ratio than steel, are 100% corrosion-resistant, and electromagnetically neutral — making them ideal for coastal infrastructure, bridges, tunnels, marine structures, MRI rooms, and chemical plants where steel rebar corrodes rapidly.',
    industries: ['Infrastructure & Highways', 'Bridges & Flyovers', 'Marine & Coastal Construction', 'Chemical & Petrochemical Plants', 'Water Treatment & Desalination', 'Healthcare (MRI Facilities)', 'Tunnels & Underground Structures', 'Power & Telecom'],
    grades: ['GFRP Rebar #8 (8mm)', 'GFRP Rebar #10 (10mm)', 'GFRP Rebar #12 (12mm)', 'GFRP Rebar #16 (16mm)', 'GFRP Rebar #20 (20mm)', 'GFRP Rebar #25 (25mm)', 'Bent/Stirrup GFRP Bars', 'Sand-Coated GFRP Rebars', 'Helical Wrapped GFRP Rebars'],
    specifications: ['Tensile Strength: 800–1200 MPa', 'Elastic Modulus: 40–55 GPa', 'Density: 1.8–2.2 g/cm³ (75% lighter than steel)', 'Thermal Expansion: 6–10 µm/m°C', 'Glass Content: 70–80% by weight', 'Bar Surface: Sand-coated / Ribbed / Helical'],
    standards: ['ACI 440.1R', 'CSA S807', 'ASTM D7957', 'ISO 10406-1', 'IS 15894:2018 (BIS)', 'IRC SP:120 (Indian Roads)'],
    hsnCodes: ['7019', '3926'],
    orderSizes: '1 MT to 500 MT per project',
    importCountries: ['China', 'Russia', 'USA', 'Canada', 'UAE'],
    relatedSlugs: ['gfrp-sheets-india', 'gfrp-gratings-india', 'tmt-bars-india', 'gfrp-pipes-india'],
    priceRange: '₹150 – ₹600 per running meter',
    applications: ['Bridge decks and approach slabs', 'Coastal and marine seawalls', 'Highway median barriers and parapets', 'Tunnel lining reinforcement', 'MRI room construction (non-magnetic)', 'Chemical plant foundations and floors', 'Water treatment tank reinforcement', 'Precast concrete panel reinforcement'],
    challenges: ['No yielding (brittle failure mode requires design factor adjustment)', 'Bending must be done at factory (no field bending)', 'Higher initial cost vs steel (offset by zero maintenance)', 'Limited BIS code awareness among contractors', 'Lap splice length calculations differ from steel'],
    marketTrend: 'GFRP rebar adoption in India accelerating with NHAI and IRC mandating corrosion-resistant reinforcement for coastal highways and bridges. Market projected to grow at 15–20% CAGR as lifecycle cost benefits over steel become widely recognized. Major infrastructure projects like Sagarmala, Bharatmala, and Smart Cities driving demand.',
    heroImage: gfrpRebarsImg,
    heroImageAlt: 'Bundle of GFRP composite reinforcement rebars'
  },
];

// ─── COMBINED EXPORT ────────────────────────────────────────────
// (export moved to end of file after all product arrays)

const constructionNewProducts: DemandProduct[] = [
  {
    slug: 'doors-windows-india',
    name: 'Doors & Windows',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Doors and windows are essential architectural components providing access, light, ventilation, and security to buildings. They are typically fabricated from materials like wood, UPVC, aluminum, and steel, often incorporating glass panes, and come in various designs such as hinged, sliding, casement, and fixed, selected based on aesthetic, functional, and climatic requirements, impacting a building\'s energy efficiency and structural integrity.',
    industries: [
      'Residential Construction',
      'Commercial Building',
      'Hospitality',
      'Healthcare Facilities',
      'Government Projects'
    ],
    grades: [
      'Solid Wood (Teak, Sal)',
      'Engineered Wood (Flush Doors)',
      'UPVC (IS 15510)',
      'Aluminum (AA 6063)',
      'Steel (IS 2062 E250)',
      'Glass (IS 2835 Toughened)',
      'Fire-Rated (IS 3614 Part 2)'
    ],
    specifications: [
      'Thickness: 30-50 mm (doors), 25-100 mm (frames)',
      'Material: UPVC, Aluminum, Wood, Steel',
      'Glazing Type: Single, Double, Triple',
      'Hardware: SS 304, Zinc Alloy',
      'Sound Insulation: 25-45 dB'
    ],
    standards: [
      'IS 1003 (Part 1): Timber Door Shutters',
      'IS 15510: UPVC Windows',
      'IS 1948: Aluminum Doors, Windows, and Ventilators',
      'IS 3629: Timber Window and Ventilator Shutters',
      'IS 4993: Wooden Panel Doors'
    ],
    hsnCodes: ['4418.20', '7610.10'],
    orderSizes: '50-5000 units',
    importCountries: [
      'China',
      'Germany',
      'Italy',
      'Malaysia',
      'Turkey'
    ],
    relatedSlugs: [
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india',
      'galvanized-roofing-india'
    ],
    priceRange: '₹2,500-₹75,000 per unit',
    applications: [
      'Residential Homes',
      'Office Buildings',
      'Shopping Malls',
      'Hotels',
      'Hospitals',
      'Educational Institutions'
    ],
    challenges: [
      'Fluctuating raw material costs (wood, aluminum)',
      'Need for energy-efficient solutions (thermal breaks)',
      'Skilled labor availability for installation',
      'Competition from unorganized sector'
    ],
    marketTrend: 'Growing demand for energy-efficient and smart door/window solutions, driven by green building norms and government initiatives like Smart Cities. Increased adoption of UPVC and aluminum over traditional wood due to durability and lower maintenance, alongside a focus on aesthetic customization and security features.'
  },
  {
    slug: 'paints-coatings-india',
    name: 'Paints & Coatings',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Paints and coatings are liquid or mastic compositions applied to surfaces to provide protection, decoration, or both. They consist of pigments, binders, solvents, and additives, forming a durable film upon drying. These materials offer resistance against corrosion, weathering, abrasion, and chemicals, while also imparting desired aesthetic finishes like gloss, texture, and color, tailored for various substrates and environmental conditions.',
    industries: [
      'Residential Construction',
      'Commercial Building',
      'Industrial Infrastructure',
      'Automotive',
      'Marine'
    ],
    grades: [
      'Interior Emulsion (Acrylic)',
      'Exterior Emulsion (100% Acrylic)',
      'Texture Paints',
      'Enamel Paints (Synthetic)',
      'Epoxy Coatings (IS 12334)',
      'Polyurethane Coatings (IS 12431)',
      'Waterproofing Coatings',
      'Fire Retardant Paints'
    ],
    specifications: [
      'Coverage: 100-200 sq ft/liter/coat',
      'Drying Time: 1-4 hours (surface), 4-24 hours (hard)',
      'VOC Content: <50 g/L to 200 g/L',
      'Sheen Level: Matt, Eggshell, Silk, Gloss',
      'Durability: 3-10 years'
    ],
    standards: [
      'IS 15489: Water Thinnable Exterior Emulsion',
      'IS 165: Synthetic Enamel Paints',
      'IS 101: Methods of Test for Paints',
      'IS 13180: Cement Paint, Dry and Ready Mixed',
      'IS 158: Ready Mixed Paint, Brushing, Finishing, Semi-Gloss, for General Purposes to IS 104'
    ],
    hsnCodes: ['3208.20', '3209.10'],
    orderSizes: '20-5000 liters',
    importCountries: [
      'Germany',
      'USA',
      'Japan',
      'Korea',
      'China',
      'Belgium'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india',
      'galvanized-roofing-india'
    ],
    priceRange: '₹150-₹1,500 per liter',
    applications: [
      'Interior Wall Decoration',
      'Exterior Weather Protection',
      'Corrosion Control for Metals',
      'Floor Coatings',
      'Wood Finishing',
      'Waterproofing Damp Areas'
    ],
    challenges: [
      'Environmental regulations on VOC emissions',
      'Competition from unorganized players',
      'Seasonality of demand',
      'Rising raw material costs (titanium dioxide, crude oil derivatives)'
    ],
    marketTrend: 'Increasing demand for eco-friendly, low-VOC paints and coatings driven by consumer awareness and regulatory pressures. Growth in protective coatings for industrial infrastructure and anti-corrosion applications. Government initiatives for infrastructure development and the \'Housing for All\' scheme boost residential demand.'
  },
  {
    slug: 'gc-roofing-sheets-india',
    name: 'GC Roofing Sheets',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Galvanized Corrugated (GC) roofing sheets are cold-rolled steel sheets coated with a layer of zinc, then formed into a corrugated profile. The zinc coating provides excellent corrosion resistance, protecting the steel substrate from rust and extending the sheet\'s lifespan. Their corrugated shape imparts structural rigidity, allowing them to span roof supports effectively while facilitating water runoff, making them suitable for various roofing and siding applications.',
    industries: [
      'Rural Housing',
      'Industrial Sheds',
      'Agricultural Buildings',
      'Warehousing',
      'Temporary Structures'
    ],
    grades: [
      'IS 277: General Purpose (GP), Commercial Quality (CQ)',
      'IS 277: Deep Drawing Quality (DDQ)',
      'IS 513: Cold Rolled Low Carbon Steel',
      'Zinc Coating: Z120, Z180, Z275 (grams/sqm)'
    ],
    specifications: [
      'Thickness: 0.25-0.80 mm',
      'Width: 760-1220 mm (after corrugation)',
      'Length: 1.8-7.3 meters (6-24 ft)',
      'Zinc Coating Mass: 120-275 gsm',
      'Corrugation Pitch: 75-150 mm'
    ],
    standards: [
      'IS 277: Galvanized Steel Sheets (Plain and Corrugated)',
      'IS 513: Cold Rolled Low Carbon Steel Sheets',
      'ASTM A653: Steel Sheet, Zinc-Coated (Galvanized)',
      'BIS Certification Mark'
    ],
    hsnCodes: ['7210.41', '7210.49'],
    orderSizes: '1-100 tons',
    importCountries: [
      'China',
      'Korea',
      'Japan',
      'Vietnam',
      'Taiwan'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india',
      'galvanized-roofing-india'
    ],
    priceRange: '₹65-₹95 per kg',
    applications: [
      'Residential Roofing (rural areas)',
      'Farm Sheds and Animal Shelters',
      'Industrial and Warehouse Roofing',
      'Site Offices/Temporary Structures',
      'Fencing'
    ],
    challenges: [
      'Susceptibility to damage from strong winds/hail',
      'Thermal insulation requirements',
      'Noise generation during rain',
      'Rusting at cut edges or scratched areas if zinc coating is compromised'
    ],
    marketTrend: 'Steady demand from rural construction and agricultural sectors due to cost-effectiveness and ease of installation. Government focus on affordable housing and rural development schemes, like Pradhan Mantri Awas Yojana (PMAY), sustains growth. Competitive pricing remains a key market driver.'
  },
  {
    slug: 'gp-roofing-sheets-india',
    name: 'GP Roofing Sheets',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Galvanized Plain (GP) roofing sheets are flat, cold-rolled steel sheets uniformly coated with zinc, offering superior corrosion resistance and a smooth, uncorrugated surface. The zinc layer acts as a sacrificial barrier, protecting the base steel from oxidation. These sheets are versatile, often used where aesthetic appeal or specific forming is required, and serve as raw material for further profiling, fabrication, or pre-painting in various construction and industrial applications.',
    industries: [
      'Manufacturing (raw material)',
      'HVAC Ducting',
      'Automotive (non-structural)',
      'Appliance Manufacturing',
      'Construction (flashings, gutters)'
    ],
    grades: [
      'IS 277: General Purpose (GP), Commercial Quality (CQ)',
      'IS 277: Forming Quality (FQ)',
      'IS 513: Cold Rolled Low Carbon Steel',
      'Zinc Coating: Z120, Z180, Z275 (grams/sqm)',
      'ASTM A653: Structural Quality (SQ)'
    ],
    specifications: [
      'Thickness: 0.20-2.0 mm',
      'Width: 600-1500 mm',
      'Length: Coil or cut-to-length sheets (up to 6 meters)',
      'Zinc Coating Mass: 90-350 gsm',
      'Surface Finish: Regular Spangle, Minimized Spangle, Skin Passed'
    ],
    standards: [
      'IS 277: Galvanized Steel Sheets (Plain and Corrugated)',
      'IS 513: Cold Rolled Low Carbon Steel Sheets',
      'ASTM A653: Steel Sheet, Zinc-Coated (Galvanized)',
      'EN 10346: Continuously Hot-Dip Coated Steel Flat Products'
    ],
    hsnCodes: ['7210.41', '7210.49'],
    orderSizes: '5-500 tons',
    importCountries: [
      'China',
      'Korea',
      'Japan',
      'Taiwan',
      'Turkey',
      'Vietnam'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'color-coated-roofing-sheets-india',
      'galvanized-roofing-india'
    ],
    priceRange: '₹68-₹98 per kg',
    applications: [
      'Ducting and Ventilation Systems',
      'Industrial Casings and Enclosures',
      'Roofing Accessories (Flashings, Gutters)',
      'False Ceilings',
      'Base Material for Color Coated Sheets',
      'Fabrication of Small Components'
    ],
    challenges: [
      'Maintaining flatness during processing',
      'Surface defects can compromise aesthetics',
      'Price volatility of zinc and steel',
      'Logistics for wide and heavy coils'
    ],
    marketTrend: 'Growing demand as a base material for value-added products like pre-painted sheets and panels. Industrial expansion and infrastructure development drive consumption in HVAC, automotive, and appliance sectors. \'Make in India\' initiative encourages domestic production and utilization.'
  },
  {
    slug: 'color-coated-roofing-sheets-india',
    name: 'Color Coated Roofing Sheets',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Color-coated roofing sheets are manufactured by pre-treating and coating galvanized or Galvalume® steel sheets with multiple layers of paint, typically polyester or fluorocarbon, in a continuous coil coating process. This enhances aesthetic appeal, provides additional corrosion resistance, and improves durability against weathering and UV radiation. They are available in various profiles and colors, offering a versatile and long-lasting solution for modern architectural roofing and cladding.',
    industries: [
      'Residential Construction',
      'Commercial Building',
      'Industrial Buildings',
      'Cold Storage',
      'Architectural Projects'
    ],
    grades: [
      'Base Steel: IS 277 (Galvanized)',
      'Base Steel: IS 15961 (Galvalume®)',
      'Coating Types: SMP (Silicone Modified Polyester), RMP (Regular Modified Polyester), PVDF (Polyvinylidene Fluoride)',
      'Coating Thickness: 15-25 microns (top), 5-10 microns (back)'
    ],
    specifications: [
      'Thickness: 0.35-0.80 mm',
      'Effective Width: 900-1070 mm',
      'Color: RAL shades (e.g., Brick Red, Sky Blue)',
      'Coating System: 2-coat, 2-bake (typically)',
      'Zinc/Al-Zn Coating: Z90-Z275 gsm / AZ100-AZ150 gsm'
    ],
    standards: [
      'IS 14246: Pre-Painted Galvanized Steel Sheets',
      'IS 15961: Hot-dip Aluminium Zinc Alloy Coated Steel',
      'ASTM A755: Steel Sheet, Metallic Coated by The Hot-Dip Process and Prelacquered',
      'JIS G3312: Pre-coated Galvanized Steel Sheets and Coils'
    ],
    hsnCodes: ['7210.70', '7210.90'],
    orderSizes: '5-500 tons',
    importCountries: [
      'China',
      'Korea',
      'Japan',
      'Taiwan',
      'Vietnam'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'galvanized-roofing-india'
    ],
    priceRange: '₹75-₹120 per kg',
    applications: [
      'Residential Roofs and Walls',
      'Commercial Building Cladding',
      'Industrial Shed Roofing',
      'Cold Storage Wall Panels',
      'Pre-Engineered Building (PEB) Components',
      'Bus Shelters'
    ],
    challenges: [
      'Damage to coating during handling/installation',
      'UV degradation over long periods (fading)',
      'Variations in coating quality among manufacturers',
      'Higher initial cost compared to plain GC sheets'
    ],
    marketTrend: 'Strong growth driven by increased focus on aesthetics, durability, and low maintenance in modern construction. Demand from infrastructure projects, industrial expansion, and commercial developments is significant. The PLI Scheme and National Infrastructure Pipeline (NIP) support the growth of the manufacturing sector, increasing demand for industrial roofing.'
  },
  {
    slug: 'galvanized-roofing-india',
    name: 'Galvanized Roofing',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Galvanized roofing refers to steel sheets that have undergone a hot-dip galvanization process, where they are immersed in a molten zinc bath to obtain a protective zinc coating. This coating serves as a sacrificial layer, corroding preferentially to the steel and thus preventing rust formation. Galvanized roofing offers durable, cost-effective weather protection and is predominantly available in corrugated forms, widely used across residential, agricultural, and light industrial applications due to its longevity and strength.',
    industries: [
      'Residential (affordable housing)',
      'Agricultural',
      'Industrial Warehousing',
      'Poultry Farms',
      'Temporary Shelters'
    ],
    grades: [
      'IS 277: General Purpose (GP), Commercial Quality (CQ)',
      'IS 513: Cold Rolled Low Carbon Steel',
      'Zinc Coating: Z120, Z180, Z275 (grams/sqm, minimum)',
      'ASTM A653: Structural Steel',
      'EN 10346: Continuously Coated Steel'
    ],
    specifications: [
      'Base Steel Thickness: 0.25-1.00 mm',
      'Sheet Width: 760-1220 mm (after profiling)',
      'Length: Up to 12 meters',
      'Spangle: Regular, Minimized, Zero',
      'Corrugation Depth: 12-25 mm'
    ],
    standards: [
      'IS 277: Galvanized Steel Sheets (Plain and Corrugated)',
      'IS 513: Cold Rolled Low Carbon Steel Sheets',
      'ASTM A653: Steel Sheet, Zinc-Coated (Galvanized)',
      'BS EN 10143: Continuously Hot-dip Coated Strip and Sheet'
    ],
    hsnCodes: ['7210.41', '7210.49'],
    orderSizes: '1-100 tons',
    importCountries: [
      'China',
      'Korea',
      'Japan',
      'Vietnam',
      'Turkey'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india'
    ],
    priceRange: '₹65-₹95 per kg',
    applications: [
      'Residential Roofs (rural/semi-urban)',
      'Industrial Sheds',
      'Agricultural Storage Facilities',
      'Poultry and Dairy Farm Structures',
      'Boundary Walls'
    ],
    challenges: [
      'Can get very hot under direct sunlight due to conductivity',
      'Susceptible to denting from heavy impact',
      'Prone to \'white rust\' if improperly stored or exposed to moisture without ventilation',
      'Limited aesthetic appeal compared to color-coated options'
    ],
    marketTrend: 'Consistent demand from the affordable housing sector and rural infrastructure projects. Increased government expenditure on rural development and initiatives like the Swachh Bharat Abhiyan indirectly supports the demand for robust and economical roofing solutions. Price stability of zinc impacts market dynamics.'
  },
  {
    slug: 'pre-painted-roofing-sheets-india',
    name: 'Pre-Painted Roofing Sheets',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Pre-painted roofing sheets are a type of color-coated roofing where the base metal, usually galvanized steel or Galvalume®, is cleaned, treated, and painted in a controlled factory environment prior to being formed into various profiles. This multi-layered coating system offers superior corrosion resistance, enhanced aesthetics, and reduced maintenance. The pre-painting process ensures uniform thickness and curing of the paint, leading to a long-lasting and decorative finish suitable for a wide range of building applications.',
    industries: [
      'Commercial Construction',
      'Industrial & Warehousing',
      'Residential (Premium)',
      'Infrastructure Projects',
      'Automotive (Bus Body Panels)'
    ],
    grades: [
      'Base Steel: IS 277 (Galvanized), IS 15961 (Galvalume®)',
      'Paint Systems: Regular Modified Polyester (RMP), Silicone Modified Polyester (SMP), Polyvinylidene Fluoride (PVDF)',
      'IS 14246: Pre-Painted Galvanized Steel Sheets',
      'IS 15961: Hot-dip Aluminium Zinc Alloy Coated Steel',
      'Zinc Coating: Z120, Z180 gsm / AZ100-AZ150 gsm'
    ],
    specifications: [
      'Overall Thickness: 0.35-0.80 mm',
      'Coating Thickness: 18-25 microns (top coat), 5-10 microns (back coat)',
      'Paint Finish: Gloss, Matt, Wrinkle',
      'Color Range: Wide variety of RAL shades',
      'Effective Cover Width: 900-1070 mm'
    ],
    standards: [
      'IS 14246: Pre-Painted Galvanized Steel Sheets',
      'IS 15961: Hot-dip Aluminium Zinc Alloy Coated Steel',
      'ASTM A755: Steel Sheet, Metallic Coated by The Hot-Dip Process and Prelacquered',
      'JIS G3312: Pre-coated Galvanized Steel Sheets and Coils',
      'BIS Certification Mark'
    ],
    hsnCodes: ['7210.70', '7210.90'],
    orderSizes: '5-500 tons',
    importCountries: [
      'China',
      'Korea',
      'Japan',
      'Taiwan',
      'Vietnam'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india'
    ],
    priceRange: '₹78-₹130 per kg',
    applications: [
      'Architectural Roofing',
      'Wall Cladding',
      'False Ceilings',
      'Insulated Sandwich Panels',
      'Cold Storage Walls and Roofs',
      'Building Facades'
    ],
    challenges: [
      'Potential for scratching during transport and installation',
      'Choice of paint system impacts UV resistance and color retention',
      'Initial cost can be higher than traditional roofing materials',
      'Dependence on continuous coil coating infrastructure'
    ],
    marketTrend: 'Increasingly preferred for its aesthetic versatility, longevity, and low maintenance, particularly in commercial and industrial projects. The demand is boosted by rapid urbanization, modern architectural trends, and the growth of the pre-engineered building (PEB) sector. Government focus on industrial corridors and \'Smart Cities\' further stimulates demand.'
  },
  {
    slug: 'c-purlins-india',
    name: 'C Purlins',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'C Purlins are horizontal structural members made from cold-formed galvanized or black steel, shaped in the profile of a \'C\' with or without stiffening lips. They are primarily used as secondary structural components in roofing and wall cladding systems, supporting the roofing sheets or wall panels and transferring loads to the main structural framework. Their lightweight, high strength-to-weight ratio, and ease of installation make them a popular choice in pre-engineered buildings and industrial sheds.',
    industries: [
      'Pre-Engineered Buildings (PEB)',
      'Industrial Sheds',
      'Warehousing',
      'Solar Panel Mounting Structures',
      'Agricultural Buildings'
    ],
    grades: [
      'IS 2062 E250/E350 (Black Steel)',
      'IS 277 (Galvanized Steel)',
      'ASTM A653 (Galvanized)',
      'Yield Strength: 250-350 MPa'
    ],
    specifications: [
      'Web Depth: 100-300 mm',
      'Flange Width: 50-100 mm',
      'Lip Size: 15-30 mm',
      'Thickness: 1.6-3.0 mm',
      'Length: Up to 10-12 meters (custom cut)'
    ],
    standards: [
      'IS 811: Cold Formed Light Gauge Structural Steel Sections',
      'IS 2062: Hot Rolled Medium and High Tensile Structural Steel',
      'ASTM A653: Steel Sheet, Zinc-Coated (Galvanized)',
      'EN 10346: Continuously Hot-Dip Coated Steel Flat Products'
    ],
    hsnCodes: ['7308.90', '7216.61'],
    orderSizes: '1-50 tons',
    importCountries: [
      'China',
      'Korea',
      'Turkey',
      'Vietnam'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india'
    ],
    priceRange: '₹60-₹85 per kg',
    applications: [
      'Roof Purlins for Metal Sheets',
      'Wall Girts for Cladding',
      'Solar Mounting Structures',
      'False Ceiling Supports',
      'Mezzanine Floor Supports'
    ],
    challenges: [
      'Design complexity for optimal load bearing',
      'Corrosion in ungalvanized sections over time',
      'Transportation of long sections',
      'Quality control for consistent profiling'
    ],
    marketTrend: 'High demand from the rapidly expanding Pre-Engineered Building (PEB) sector due to their efficiency and cost-effectiveness. Increased adoption in solar energy projects for mounting structures. Government\'s push for infrastructure development, industrial corridors, and \'Make in India\' drives demand for factory-made components.'
  },
  {
    slug: 'z-purlins-india',
    name: 'Z Purlins',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Z Purlins are cold-formed steel sections shaped like the letter \'Z\', typically made from galvanized or black steel. Their unique asymmetrical profile allows them to nest together, creating a continuous beam effect and enabling efficient lapping over supports, which optimizes structural performance and reduces material usage. Widely used as secondary structural elements in roofing and wall systems, Z Purlins support cladding and transfer loads to the main building frame, especially beneficial in structures requiring larger spans.',
    industries: [
      'Pre-Engineered Buildings (PEB)',
      'Industrial Warehousing',
      'Large Span Roof Structures',
      'Solar Panel Mounting Structures',
      'Factory Buildings'
    ],
    grades: [
      'IS 2062 E250/E350 (Black Steel)',
      'IS 277 (Galvanized Steel)',
      'ASTM A653 (Galvanized)',
      'Yield Strength: 250-350 MPa'
    ],
    specifications: [
      'Web Depth: 100-300 mm',
      'Flange Width: 50-100 mm',
      'Lip Size: 15-30 mm',
      'Thickness: 1.6-3.0 mm',
      'Material: Galvanized or Black Iron'
    ],
    standards: [
      'IS 811: Cold Formed Light Gauge Structural Steel Sections',
      'IS 2062: Hot Rolled Medium and High Tensile Structural Steel',
      'ASTM A653: Steel Sheet, Zinc-Coated (Galvanized)',
      'EN 10346: Continuously Hot-Dip Coated Steel Flat Products'
    ],
    hsnCodes: ['7308.90', '7216.61'],
    orderSizes: '1-50 tons',
    importCountries: [
      'China',
      'Korea',
      'Turkey',
      'Vietnam'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india'
    ],
    priceRange: '₹62-₹88 per kg',
    applications: [
      'Roof Purlins with Lapping',
      'Heavy Duty Wall Girts',
      'Structural Supports for Industrial Equipment',
      'Solar Farm Frameworks',
      'Mezzanine Deck Supports'
    ],
    challenges: [
      'Precise fabrication required for effective lapping',
      'Potential for local buckling if not designed correctly',
      'Corrosion management (galvanization is key)',
      'Logistical challenges for custom long lengths'
    ],
    marketTrend: 'Strong demand from the expanding Pre-Engineered Building (PEB) sector, especially for projects requiring large clear spans in industrial and warehousing applications. Increased use in solar power projects for robust and efficient module mounting. Government\'s National Infrastructure Pipeline and industrial development initiatives continue to drive the market.'
  },
  {
    slug: 'monopoles-india',
    name: 'Monopoles',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Monopoles are tall, slender, single-pole structures typically made from tapered steel sections, used primarily for mounting telecommunication antennas, street lighting, or utility lines. They are designed to be aesthetically less intrusive than traditional lattice towers, requiring a smaller footprint and offering easier installation. Monopoles provide robust support for various equipment at elevation, ensuring optimal signal propagation or illumination while blending into urban and suburban landscapes.',
    industries: [
      'Telecommunications',
      'Street Lighting',
      'Power Transmission',
      'Smart City Infrastructure',
      'Traffic Management'
    ],
    grades: [
      'IS 2062 E250/E350/E410 (Structural Steel)',
      'ASTM A572 Grade 50/65 (High Strength Low Alloy Steel)',
      'Galvanization: Hot-dip (IS 4759)',
      'IS 800: General Construction in Steel'
    ],
    specifications: [
      'Height: 15-60 meters',
      'Base Diameter: 500-1500 mm',
      'Top Diameter: 200-500 mm',
      'Wall Thickness: 6-12 mm',
      'Finish: Hot-dip galvanized'
    ],
    standards: [
      'IS 800: Code of Practice for General Construction in Steel',
      'IS 4759: Hot Dip Galvanizing of Structural Steel',
      'TIA/EIA-222: Structural Standards for Antenna Supporting Structures',
      'ASTM A123: Zinc (Hot-Dip Galvanized) Coatings on Iron and Steel Products'
    ],
    hsnCodes: ['7308.20', '7308.90'],
    orderSizes: '1-50 units',
    importCountries: [
      'China',
      'South Korea',
      'Germany',
      'Turkey'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india'
    ],
    priceRange: '₹1,50,000-₹15,00,000 per unit',
    applications: [
      'Cellular Tower (4G/5G)',
      'Street Light Poles',
      'Transmission Line Supports',
      'CCTV Camera Poles',
      'Traffic Signal Poles',
      'WiFi Hotspot Infrastructure'
    ],
    challenges: [
      'Complex foundation design due to tall slender structure',
      'Logistics for transport and erection of large sections',
      'Wind load considerations and vibration mitigation',
      'Aesthetic integration with urban environment'
    ],
    marketTrend: 'Robust demand driven by the rapid expansion of 5G telecom networks and the \'Digital India\' initiative. Significant growth from \'Smart City\' projects for integrated street lighting, CCTV, and communication infrastructure. Government focus on modernizing power transmission and distribution lines also contributes to steady orders.'
  },
  {
    slug: 'transmission-poles-india',
    name: 'Transmission Poles',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Transmission poles are critical infrastructure components made typically from steel, concrete, or wood, designed to support overhead power lines for electricity transmission and distribution. They are engineered to withstand significant wind loads, ice accumulation, and seismic forces while maintaining structural integrity to ensure reliable power delivery across vast distances, from generation plants to substations and ultimately to consumers. Their design incorporates specific height, strength, and insulation requirements to safely carry high-voltage electrical conductors.',
    industries: [
      'Power Transmission & Distribution',
      'Infrastructure Development',
      'Renewable Energy',
      'Urban Electrification',
      'Rural Electrification'
    ],
    grades: [
      'IS 2062 E250BR (Steel)',
      'IS 277 (Steel)',
      'IS 1678 (Concrete)',
      'ASTM A36 (Steel)',
      'ASTM A572 Grade 50 (Steel)',
      'PCC Poles 8m',
      'PCC Poles 9m',
      'PCC Poles 11m',
      'PCC Poles 13m'
    ],
    specifications: [
      'Height: 8m-30m',
      'Load Bearing Capacity: 100 kg-1000 kg',
      'Material Thickness: 3mm-10mm (Steel)',
      'Corrosion Protection: Hot-dip Galvanized (100-120 microns)',
      'Deflection under Load: 0.5%-1.5%'
    ],
    standards: [
      'IS 2713: Specification for Tubular Steel Poles',
      'IS 1678: Specification for Pre-stressed Concrete Poles for Overhead Power Traction',
      'IS 2062: Steel for general structural purposes',
      'BIS 875 (Part 3): Design Loads (Wind)',
      'IEC 60810: Lamps for Road Vehicles - Performance Requirements'
    ],
    hsnCodes: ['7308.90.90', '8504.90.90'],
    orderSizes: '50 units-5000 units',
    importCountries: [
      'China',
      'South Korea',
      'Vietnam',
      'Germany',
      'Indonesia',
      'Turkey',
      'Malaysia'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india'
    ],
    priceRange: '₹7,500-₹75,000 per unit',
    applications: [
      'High Voltage Transmission Lines',
      'Rural Electrification Projects',
      'Urban Distribution Networks',
      'Renewable Energy Project Connections',
      'Street Lighting Support',
      'Railway Electrification'
    ],
    challenges: [
      'Logistical challenges for remote installations',
      'Ensuring consistent material quality across large orders',
      'Compliance with varying state and central regulations',
      'Managing raw material price volatility (steel, cement)'
    ],
    marketTrend: 'The market for transmission poles in India is experiencing steady growth, driven by increasing electricity demand and significant government investment in infrastructure under schemes like the National Infrastructure Pipeline (NIP) and the Smart Cities Mission. There\'s a particular focus on upgrading aging grid infrastructure and expanding renewable energy integration. The push for \'Har Ghar Bijli\' continues to fuel demand for distribution-level poles.'
  },
  {
    slug: 'telecom-monopoles-india',
    name: 'Telecom Monopoles',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Telecom monopoles are single-pole structures, typically made of steel, engineered to support cellular antennas, microwave dishes, and other telecommunication equipment. They are designed for minimal visual impact compared to lattice towers, making them suitable for urban and aesthetically sensitive areas, while providing robust support against environmental loads like wind and seismic activity. Their modular design allows for varying heights and equipment capacities, crucial for expanding wireless network coverage and capacity, including 5G deployments.',
    industries: [
      'Telecommunications',
      'Infrastructure Development',
      'Urban Planning',
      'Smart Cities',
      'Internet Service Providers'
    ],
    grades: [
      'IS 2062 E350BO (Steel)',
      'ASTM A572 Grade 65 (Steel)',
      'ASTM A500 Grade C (Structural Tubing)',
      'IS 4923 YST 310 (Hollow Sections)',
      'IS 800 (Code of Practice for General Construction in Steel)',
      'Monopole Standard 20m',
      'Monopole Standard 30m',
      'Monopole Standard 40m'
    ],
    specifications: [
      'Height: 15m-60m',
      'Antenna Capacity: 3-12 antennas',
      'Wind Speed Resistance: Upto 180 km/h',
      'Galvanization Thickness: 100-120 microns',
      'Deflection: <1 degree at max wind load'
    ],
    standards: [
      'IS 875 (Part 3): Design Loads (Wind)',
      'IS 802 (Part 1/Sec 1): Code of Practice for Use of Structural Steel in Overhead Transmission Line Towers',
      'TIA/EIA-222-G/H: Structural Standard for Antenna Supporting Structures and Antennas',
      'BIS 1367: Technical Supply Conditions for Fasteners',
      'IEC 60950: Information Technology Equipment - Safety'
    ],
    hsnCodes: ['7308.20.19', '7308.90.90'],
    orderSizes: '10 units-500 units',
    importCountries: [
      'China',
      'South Korea',
      'Malaysia',
      'Germany',
      'USA',
      'Turkey',
      'UAE'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india'
    ],
    priceRange: '₹1,50,000-₹8,00,000 per unit',
    applications: [
      '4G/5G Cellular Base Stations',
      'Microwave Link Support',
      'Radio Broadcasting',
      'Security Surveillance Systems (CCTV)',
      'WiFi Hotspot Deployment',
      'Smart City Infrastructure'
    ],
    challenges: [
      'Obtaining necessary regulatory approvals and clearances',
      'Logistics and installation in densely populated urban areas',
      'Ensuring stability and wind resistance in diverse terrains',
      'Managing aesthetics and public acceptance of new tower installations'
    ],
    marketTrend: 'The telecom monopole market in India is witnessing substantial growth, primarily driven by the rapid expansion of 5G networks and ongoing efforts to improve rural broadband connectivity. Government initiatives like the National Digital Communications Policy and Smart Cities Mission are key demand drivers. There\'s an increasing preference for these aesthetically pleasing structures in urban settings, balancing utility with visual integration.'
  },
  {
    slug: 'tata-wiron-products-india',
    name: 'Tata Wiron Products',
    category: 'Building & Construction',
    categorySlug: 'construction',
    industrySlug: 'construction',
    subIndustrySlug: 'building-materials',
    definition: 'Tata Wiron refers to a range of high-quality wired products manufactured by Tata Steel, encompassing diverse categories like galvanized wires, barbed wires, chainlink fences, and nails. These products are made from robust steel and undergo specific processing, such as hot-dip galvanization, to enhance their durability, corrosion resistance, and strength. They are essential for a multitude of applications across construction, agriculture, and various industrial sectors, providing reliable solutions for fencing, reinforcement, and fastening purposes.',
    industries: [
      'Building & Construction',
      'Agriculture',
      'Infrastructure Development',
      'Security & Fencing',
      'Telecommunications'
    ],
    grades: [
      'IS 280 (Mild Steel Wires)',
      'IS 278 (Galvanized Steel Wires)',
      'ASTM A121 (Barbed Wire)',
      'ASTM A392 (Chain Link Fence)',
      'IS 7215 (Mild Steel Wire for General Purposes)',
      'HB Wire',
      'MS Wire',
      'GI Wire',
      'Binding Wire'
    ],
    specifications: [
      'Wire Diameter: 0.9 mm-6.0 mm',
      'Zinc Coating: 40-275 gsm (Galvanized)',
      'Tensile Strength: 340-550 N/mm²',
      'Coil Weight: 25 kg-1000 kg',
      'Barb Spacing: 75 mm-100 mm (Barbed Wire)'
    ],
    standards: [
      'IS 280: Mild Steel Wire for General Engineering Purposes',
      'IS 278: Galvanized Steel Barbed Wire for Fencing',
      'IS 14887: Chain Link Fence',
      'IS 15637: Steel Wire for Concrete Reinforcement',
      'BIS 277: Hot-Dipped Galvanized Steel Sheets and Coils'
    ],
    hsnCodes: ['7217.10.00', '7314.41.00'],
    orderSizes: '50 kg-50,000 kg',
    importCountries: [
      'China',
      'Vietnam',
      'Indonesia',
      'South Korea',
      'Russia',
      'Malaysia',
      'Turkey'
    ],
    relatedSlugs: [
      'doors-windows-india',
      'paints-coatings-india',
      'gc-roofing-sheets-india',
      'gp-roofing-sheets-india',
      'color-coated-roofing-sheets-india'
    ],
    priceRange: '₹65-₹120 per kg',
    applications: [
      'Perimeter Fencing (Commercial/Industrial)',
      'Agricultural Fencing',
      'Concrete Reinforcement (Binding Wire)',
      'Security Barriers',
      'Gabion Mesh Construction',
      'Vineyards and Orchards'
    ],
    challenges: [
      'Intense competition from unorganized sector suppliers',
      'Managing fluctuating steel input costs impacting profitability',
      'Ensuring anti-corrosion properties in diverse climatic zones',
      'Distribution network efficiency in remote agricultural areas'
    ],
    marketTrend: 'The market for Tata Wiron products in India is characterized by consistent demand driven by ongoing infrastructure expansion, growth in real estate, and agricultural requirements. Government focus on rural development, border security, and smart city infrastructure indirectly stimulates demand for fencing and construction-related wire products. The \'Make in India\' and PLI schemes also support domestic manufacturers like Tata Steel.'
  },
];

// ─── METALS - FERROUS ───
const ferrousNewProducts: DemandProduct[] = [
  {
    slug: 'foundry-grade-pig-iron-india',
    name: 'Foundry Grade Pig Iron',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Foundry Grade Pig Iron is an intermediate product of iron manufacturing, produced by smelting iron ore in a blast furnace. It is characterized by its high carbon content (typically 3.5-4.5%) and varying amounts of silicon, manganese, phosphorus, and sulfur, which dictate its suitability for specific foundry applications. This iron is subsequently remelted with scrap and other alloys to produce cast iron components.',
    industries: [
      'Automotive',
      'Foundries',
      'Heavy Machinery',
      'Agricultural Equipment',
      'Railway',
      'Pipes and Fittings'
    ],
    grades: [
      'IS 284:2018 Grade S1',
      'IS 284:2018 Grade S2',
      'IS 284:2018 Grade S3',
      'ASTM A43',
      'ASTM A48',
      'Ductile Iron Grade',
      'Malleable Iron Grade'
    ],
    specifications: [
      'Carbon Content: 3.5-4.5%',
      'Silicon Content: 1.0-3.0%',
      'Manganese Content: 0.5-1.5%',
      'Phosphorus Content: 0.05-0.15%',
      'Sulfur Content: 0.01-0.05%'
    ],
    standards: [
      'IS 284:2018 (Pig Iron for Foundry)',
      'ASTM A43 (Foundry Pig Iron)',
      'ISO 9443 (Pig irons - Guidelines for purchasers)',
      'BIS Certification',
      'NABL Accredited Lab Testing'
    ],
    hsnCodes: ['72011000'],
    orderSizes: '100-5000 Metric Tons',
    importCountries: [
      'Ukraine',
      'Russia',
      'Brazil',
      'South Africa',
      'China',
      'Australia',
      'Sweden'
    ],
    relatedSlugs: [
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india',
      'hrpo-india'
    ],
    priceRange: '₹40,000-60,000 per Metric Ton',
    applications: [
      'Automotive Engine Blocks',
      'Machine Tool Castings',
      'Pumps and Valve Bodies',
      'Agricultural Implement Castings',
      'Railway Brake Drums',
      'Counterweights'
    ],
    challenges: [
      'Volatility in raw material prices (iron ore, coking coal)',
      'Energy costs for blast furnace operations',
      'Environmental regulations on emissions',
      'Logistical challenges for bulk material transport'
    ],
    marketTrend: 'Demand for foundry grade pig iron is closely linked to the growth of the manufacturing and infrastructure sectors. The \'Make in India\' initiative, coupled with investments in automotive and heavy machinery, is expected to maintain a steady demand. Focus on quality and specific alloy compositions is increasing, driven by advanced manufacturing processes.'
  },
  {
    slug: 'cold-rolled-gp-sheets-india',
    name: 'Cold Rolled GP Sheets',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Cold Rolled Galvanized Plain (GP) Sheets are steel sheets that have undergone cold rolling to achieve precise thickness and surface finish, followed by hot-dip galvanization to apply a protective zinc coating. This coating provides excellent corrosion resistance, making the sheets suitable for applications requiring durability and a clean appearance. They are typically used in environments exposed to moisture and moderate corrosive elements.',
    industries: [
      'Construction',
      'Automotive',
      'Appliances',
      'HVAC',
      'Electrical Enclosures',
      'Furniture'
    ],
    grades: [
      'IS 277:2018 Grade D',
      'IS 277:2018 Grade L',
      'ASTM A653 CS Type A',
      'JIS G3302 SGCC',
      'EN 10346 DX51D',
      'CQ (Commercial Quality)',
      'DQ (Drawing Quality)'
    ],
    specifications: [
      'Thickness: 0.30mm-2.00mm',
      'Width: 900mm-1500mm',
      'Zinc Coating: Z80-Z275 gsm',
      'Tensile Strength: 270-450 MPa',
      'Yield Strength: 210-350 MPa'
    ],
    standards: [
      'IS 277:2018 (Galvanized Steel Sheets)',
      'ASTM A653 (Steel Sheet, Zinc-Coated by the Hot-Dip Process)',
      'JIS G3302 (Hot-dip zinc-coated steel sheets and coils)',
      'EN 10346 (Continuously hot-dip coated steel flat products)',
      'BIS Certification'
    ],
    hsnCodes: ['72104900'],
    orderSizes: '5-500 Metric Tons',
    importCountries: [
      'South Korea',
      'Japan',
      'China',
      'Vietnam',
      'Turkey',
      'Taiwan',
      'Malaysia'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india',
      'hrpo-india'
    ],
    priceRange: '₹70,000-95,000 per Metric Ton',
    applications: [
      'Roofing and Cladding',
      'Ducting Systems',
      'White Goods (refrigerators, washing machines)',
      'Automotive Body Panels (non-exposed)',
      'Electrical Panels',
      'Grain Silos'
    ],
    challenges: [
      'Fluctuations in zinc and steel raw material prices',
      'Maintaining uniform coating thickness',
      'Competition from imported cheaper alternatives',
      'Environmental concerns regarding galvanization processes'
    ],
    marketTrend: 'The infrastructure push, particularly under the \'Smart Cities\' mission and affordable housing schemes, drives consistent demand for GP sheets in construction. The automotive and appliance sectors also contribute significantly. Domestic manufacturers benefit from policies promoting local production, though competition from international players remains a factor.'
  },
  {
    slug: 'cold-rolled-annealed-coils-india',
    name: 'Cold Rolled Annealed Coils',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Cold Rolled Annealed (CRA) Coils are steel coils that have undergone cold rolling to achieve precise dimensions and surface finish, followed by an annealing process. Annealing involves heating the steel to a specific temperature and then slowly cooling it, which reduces hardness, improves ductility, and refines the grain structure. This process makes the material highly formable and suitable for deep drawing and complex shaping operations.',
    industries: [
      'Automotive',
      'Appliances',
      'Electrical',
      'Deep Drawing',
      'Precision Stamping',
      'Furniture'
    ],
    grades: [
      'IS 513:2008 CR1',
      'IS 513:2008 CR2',
      'IS 513:2008 CR3',
      'ASTM A1008/A1008M CS Type B',
      'JIS G3141 SPCC',
      'EN 10130 DC01',
      'DQSK (Deep Drawing Quality Special Killed)'
    ],
    specifications: [
      'Thickness: 0.30mm-3.00mm',
      'Width: 600mm-1800mm',
      'Tensile Strength: 270-410 MPa',
      'Yield Strength: 140-280 MPa',
      'Elongation: >30%'
    ],
    standards: [
      'IS 513:2008 (Cold Rolled Low Carbon Steel Sheets and Coils)',
      'ASTM A1008/A1008M (Steel, Sheet, Cold-Rolled, Carbon, Structural)',
      'JIS G3141 (Cold-reduced carbon steel sheets and strip)',
      'EN 10130 (Cold rolled flat products of low carbon steel)',
      'BIS Certification'
    ],
    hsnCodes: ['72091710', '72091810'],
    orderSizes: '10-1000 Metric Tons',
    importCountries: [
      'South Korea',
      'Japan',
      'China',
      'Vietnam',
      'Taiwan',
      'Russia',
      'Germany'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india',
      'hrpo-india'
    ],
    priceRange: '₹65,000-85,000 per Metric Ton',
    applications: [
      'Automotive Exposed Panels',
      'Refrigerator Outer Bodies',
      'Washing Machine Casings',
      'Deep Drawn Components',
      'Pre-painted Steel Substrate',
      'Furniture Components'
    ],
    challenges: [
      'Maintaining uniform mechanical properties after annealing',
      'Surface quality control to prevent defects',
      'Energy consumption during the annealing process',
      'Managing inventory due to specific grade requirements'
    ],
    marketTrend: 'The automotive sector, particularly with the push for localization and electric vehicle manufacturing, is a key driver for CRA coils. The appliance industry, driven by rising consumer demand and PLI schemes, also contributes significantly. Consistency in quality and adherence to strict specifications are paramount for buyers in these industries.'
  },
  {
    slug: 'full-hard-cold-rolled-coils-india',
    name: 'Full Hard Cold Rolled Coils',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Full Hard Cold Rolled (FHCR) Coils are steel coils that have undergone cold rolling without subsequent annealing. This process significantly increases the material\'s strength and hardness while reducing its ductility. Characterized by a bright, smooth finish and tight dimensional tolerances, FHCR coils are typically used in applications where high strength is required and where further forming or deep drawing is not extensive. They often serve as a substrate for galvanizing or painting.',
    industries: [
      'Construction',
      'Automotive (non-exposed parts)',
      'Steel Furniture',
      'Pipemaking (for smaller diameters)',
      'Electrical Appliances',
      'Storage Racks'
    ],
    grades: [
      'IS 513:2008 CR0',
      'ASTM A1008/A1008M HR',
      'JIS G3141 SPCC-1C (without annealing)',
      'EN 10130 DC01 (as-rolled)',
      'Commercial Quality',
      'High Strength Low Alloy (HSLA)'
    ],
    specifications: [
      'Thickness: 0.20mm-2.00mm',
      'Width: 600mm-1500mm',
      'Tensile Strength: 350-550 MPa',
      'Yield Strength: 300-480 MPa',
      'Hardness: HRB 70-95'
    ],
    standards: [
      'IS 513:2008 (Cold Rolled Low Carbon Steel Sheets and Coils)',
      'ASTM A1008/A1008M (Steel, Sheet, Cold-Rolled, Carbon, Structural)',
      'JIS G3141 (Cold-reduced carbon steel sheets and strip)',
      'EN 10130 (Cold rolled flat products of low carbon steel)',
      'BIS Certification'
    ],
    hsnCodes: ['72091710', '72091810'],
    orderSizes: '10-1000 Metric Tons',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Vietnam',
      'Taiwan',
      'Russia',
      'Thailand'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'hr-plates-india',
      'hrpo-india'
    ],
    priceRange: '₹60,000-78,000 per Metric Ton',
    applications: [
      'Substrate for Galvanizing',
      'Pre-painted Steel Applications',
      'Rolling Shutters',
      'Steel Furniture Structurals',
      'Conduit Pipes',
      'Trays and Panels'
    ],
    challenges: [
      'Limited formability restricts application range',
      'Higher internal stresses, risking spring back',
      'Surface defects like orange peel can be prominent',
      'Requires careful handling due to hardness'
    ],
    marketTrend: 'FHCR coils are primarily used as feedstock for galvanized or color-coated products, making their demand linked to industries like construction, pre-engineered buildings, and appliances. Government initiatives like the National Infrastructure Pipeline and Housing for All drive a steady requirement. The emphasis on cost-effectiveness and timely supply is crucial in this segment.'
  },
  {
    slug: 'hr-plates-india',
    name: 'HR Plates',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Hot Rolled (HR) Plates are flat steel products produced by rolling steel at high temperatures, typically above 1,000°C. This process allows the steel to be easily shaped and results in a product with a rougher surface finish and looser dimensional tolerances compared to cold-rolled products. HR Plates are known for their strength, weldability, and impact resistance, making them ideal for heavy structural applications where precision is less critical than robustness.',
    industries: [
      'Construction',
      'Shipbuilding',
      'Heavy Fabrication',
      'Pressure Vessels',
      'Bridges',
      'Mining Equipment'
    ],
    grades: [
      'IS 2062:2011 E250BR',
      'IS 2062:2011 E350BR',
      'ASTM A36',
      'ASTM A572 Grade 50',
      'EN 10025 S275JR',
      'IS 2062:2011 E410BR',
      'Boiler Quality (BQ) Grades'
    ],
    specifications: [
      'Thickness: 5mm-150mm',
      'Width: 1500mm-3000mm',
      'Length: 6000mm-12000mm',
      'Tensile Strength: 410-600 MPa',
      'Yield Strength: 250-450 MPa'
    ],
    standards: [
      'IS 2062:2011 (Hot Rolled Medium and High Tensile Structural Steel)',
      'ASTM A36 (Standard Specification for Carbon Structural Steel)',
      'ASTM A572 (High-Strength Low-Alloy Columbium-Vanadium Structural Steel)',
      'EN 10025 (Hot rolled products of structural steels)',
      'BIS Certification and IBR Approved'
    ],
    hsnCodes: ['72085110', '72085200'],
    orderSizes: '5-5000 Metric Tons',
    importCountries: [
      'Japan',
      'South Korea',
      'China',
      'Russia',
      'Ukraine',
      'Germany',
      'Brazil'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hrpo-india'
    ],
    priceRange: '₹60,000-85,000 per Metric Ton',
    applications: [
      'Building Structures',
      'Ship Hulls',
      'Storage Tanks',
      'Railway Wagons',
      'Bridge Girders',
      'Offshore Platforms'
    ],
    challenges: [
      'Price volatility of iron ore and coking coal',
      'Logistical costs for heavy and large plates',
      'Ensuring consistent mechanical properties across thick sections',
      'Competition from imported plates with aggressive pricing'
    ],
    marketTrend: 'HR Plates are foundational to India\'s infrastructure development, with strong demand driven by government spending on highways, ports, railways, and industrial corridors under the National Infrastructure Pipeline. The shipbuilding and heavy equipment manufacturing sectors also contribute. Focus on higher strength-to-weight ratio plates and specialized grades is increasing.'
  },
  {
    slug: 'hrpo-india',
    name: 'HRPO',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Hot Rolled Pickled and Oiled (HRPO) steel is hot-rolled steel that has undergone an additional processing step called pickling, which removes mill scale and surface impurities using acid. Following pickling, a thin layer of oil is applied to prevent rust during storage and transportation. This process results in a cleaner, smoother surface than standard hot-rolled steel, improving its suitability for subsequent cold forming, welding, and painting operations.',
    industries: [
      'Automotive',
      'Tube & Pipe Manufacturing',
      'Heavy Fabrication',
      'Agricultural Equipment',
      'Industrial Racking',
      'Construction Equipment'
    ],
    grades: [
      'IS 10748:2004 HR1',
      'IS 10748:2004 HR2',
      'ASTM A1011 CS Type B',
      'JIS G3131 SPHC',
      'EN 10111 DD11',
      'CQ (Commercial Quality)',
      'DQ (Drawing Quality)'
    ],
    specifications: [
      'Thickness: 1.6mm-12.0mm',
      'Width: 900mm-2000mm',
      'Surface Finish: Clean, scale-free, oiled',
      'Tensile Strength: 300-500 MPa',
      'Yield Strength: 200-380 MPa'
    ],
    standards: [
      'IS 10748:2004 (Hot rolled carbon steel sheet and strip for cold forming)',
      'ASTM A1011 (Steel, Sheet and Strip, Hot-Rolled, Carbon, Commercial)',
      'JIS G3131 (Hot-rolled mild steel plates, sheets and strip)',
      'EN 10111 (Hot rolled uncoated low carbon steel flat products)',
      'BIS Certification'
    ],
    hsnCodes: ['72083900'],
    orderSizes: '50-2000 Metric Tons',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Russia',
      'Ukraine',
      'Taiwan',
      'Thailand'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹62,000-80,000 per Metric Ton',
    applications: [
      'Automotive Chassis Components',
      'Pipe and Tube Mills feedstock',
      'Agricultural Implement Frames',
      'Pressure Vessel Components',
      'Heavy Duty Storage Racks',
      'Construction Equipment Parts'
    ],
    challenges: [
      'Disposal of acidic waste from pickling process',
      'Maintaining consistent oil coating for rust prevention',
      'Energy costs for heating and pickling',
      'Competition from alternative surface preparation methods'
    ],
    marketTrend: 'HRPO demand is robust, fueled by the growth in automotive manufacturing, particularly the push for localization and \'Make in India\' components. The tube and pipe industry, serving both infrastructure and industrial sectors, is also a significant consumer. Regulatory focus on environmental compliance in pickling operations is increasing, prompting cleaner production methods.'
  },
  {
    slug: 'gp-sheets-india',
    name: 'GP Sheets',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Galvanized Plain (GP) Sheets are steel sheets that have undergone hot-dip galvanization, where they are immersed in a molten zinc bath to acquire a protective coating. This process imparts excellent corrosion resistance to the steel, making it durable in various environmental conditions. GP sheets are widely used in construction and manufacturing for applications requiring both structural integrity and protection against rust.',
    industries: [
      'Construction',
      'Automotive',
      'Appliances',
      'HVAC',
      'Electrical',
      'Solar Energy'
    ],
    grades: [
      'IS 277:2018 Grade D',
      'IS 277:2018 Grade L',
      'ASTM A653 CS Type A',
      'JIS G3302 SGCC',
      'EN 10346 DX51D',
      'CQ (Commercial Quality)',
      'DQ (Drawing Quality)'
    ],
    specifications: [
      'Thickness: 0.30mm-2.00mm',
      'Width: 900mm-1500mm',
      'Zinc Coating: Z80-Z275 gsm',
      'Tensile Strength: 270-450 MPa',
      'Yield Strength: 210-350 MPa'
    ],
    standards: [
      'IS 277:2018 (Galvanized Steel Sheets)',
      'ASTM A653 (Steel Sheet, Zinc-Coated by the Hot-Dip Process)',
      'JIS G3302 (Hot-dip zinc-coated steel sheets and coils)',
      'EN 10346 (Continuously hot-dip coated steel flat products)',
      'BIS Certification'
    ],
    hsnCodes: ['72104900'],
    orderSizes: '5-500 Metric Tons',
    importCountries: [
      'South Korea',
      'Japan',
      'China',
      'Vietnam',
      'Turkey',
      'Taiwan',
      'Malaysia'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹70,000-95,000 per Metric Ton',
    applications: [
      'Roofing and Wall Cladding',
      'Ductwork for HVAC',
      'Appliance Casings',
      'Automotive Parts (non-exposed)',
      'Electrical Cabinets',
      'Solar Panel Mounts'
    ],
    challenges: [
      'Volatility in zinc market prices affecting production costs',
      'Ensuring consistent zinc coating thickness and adhesion',
      'Environmental impact of galvanization processes',
      'Competition from pre-painted galvanized steel'
    ],
    marketTrend: 'The ‘Housing for All’ initiative and significant infrastructure development continue to drive demand for GP sheets. The growth of the appliance sector and solar energy projects further boosts consumption. Policies aimed at boosting domestic manufacturing (PLI schemes) are favorable, though quality and price remain key competitive factors.'
  },
  {
    slug: 'gc-sheets-india',
    name: 'GC Sheets',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Galvanized Corrugated (GC) Sheets are galvanized steel sheets that have been cold-formed into a corrugated pattern. The corrugation process enhances the sheet\'s strength, rigidity, and spanning capability, making it highly suitable for structural applications, particularly in roofing and walling. The galvanized coating provides exceptional protection against rust and corrosion, ensuring a long service life in outdoor environments.',
    industries: [
      'Construction',
      'Rural Housing',
      'Warehousing',
      'Temporary Shelters',
      'Agricultural Buildings',
      'Fencing'
    ],
    grades: [
      'IS 277:2018 Grade D',
      'IS 277:2018 Grade L',
      'ASTM A653 CS Type B',
      'JIS G3302 SGCH',
      'EN 10346 S280GD',
      'Commercial Quality (CQ)',
      'Structural Grade'
    ],
    specifications: [
      'Thickness: 0.30mm-0.80mm',
      'Width (effective): 760mm-1000mm',
      'Zinc Coating: Z120-Z275 gsm',
      'Corrugation Depth: 12-25mm',
      'Tensile Strength: 300-550 MPa'
    ],
    standards: [
      'IS 277:2018 (Galvanized Steel Sheets)',
      'ASTM A653 (Steel Sheet, Zinc-Coated by the Hot-Dip Process)',
      'JIS G3302 (Hot-dip zinc-coated steel sheets and coils)',
      'EN 10346 (Continuously hot-dip coated steel flat products)',
      'BIS Certification'
    ],
    hsnCodes: ['72104100'],
    orderSizes: '5-300 Metric Tons',
    importCountries: [
      'China',
      'South Korea',
      'Vietnam',
      'Turkey',
      'Malaysia',
      'Indonesia',
      'Taiwan'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹75,000-1,00,000 per Metric Ton',
    applications: [
      'Residential Roofing',
      'Industrial Sheds',
      'Farm Buildings',
      'Boundary Walls',
      'Temporary Site Offices',
      'Shelters for disasters'
    ],
    challenges: [
      'Ensuring consistent corrugation profiles and dimensions',
      'Managing raw material (GP coil) price fluctuations',
      'Transport damage susceptibility due to handling',
      'Competition from other roofing materials like asbestos cement sheets'
    ],
    marketTrend: 'GC sheets are a staple in the affordable housing segment and rural development programs, driven by government initiatives like \'Pradhan Mantri Awas Yojana\'. Demand from warehousing and industrial shed construction is also significant. The ease of installation and cost-effectiveness ensure sustained market presence, with a growing focus on higher zinc coatings for extended life.'
  },
  {
    slug: 'steel-pipes-india',
    name: 'Steel Pipes',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Steel pipes are hollow cylindrical sections of steel used for conveying liquids, gases, and fine solids, or for various structural applications. They are manufactured through different processes including Electric Resistance Welding (ERW), Seamless, and Submerged Arc Welding (SAW), each offering distinct properties suited for specific pressure, temperature, and corrosive environments. Their strength, durability, and versatility make them indispensable in modern infrastructure.',
    industries: [
      'Oil & Gas',
      'Water Supply',
      'Construction',
      'Automotive',
      'Agriculture',
      'HVAC'
    ],
    grades: [
      'IS 1239 (Part 1):2004 Light',
      'IS 1239 (Part 1):2004 Medium',
      'IS 1239 (Part 1):2004 Heavy',
      'ASTM A53 Grade A/B (ERW/Seamless)',
      'API 5L Grade B/X42/X52',
      'IS 3589:2016 Grade Fe 330/Fe 410',
      'ASTM A106 Grade B/C (Seamless)'
    ],
    specifications: [
      'Outer Diameter: 1/2 inch to 24 inches (ERW)',
      'Wall Thickness: 2mm-100mm (Seamless)',
      'Length: 6 meters to 12 meters',
      'Hydrostatic Test Pressure: As per standard',
      'Material: Carbon Steel, Alloy Steel'
    ],
    standards: [
      'IS 1239 (Part 1):2004 (Mild Steel Tubes, Tubulars)',
      'IS 3589:2016 (Steel Pipes for Water and Sewage)',
      'ASTM A53 (Pipe, Steel, Black and Hot-Dipped, Zinc-Coated)',
      'API 5L (Specification for Line Pipe)',
      'BIS Certification and IBR Approved'
    ],
    hsnCodes: ['73063090', '73041910'],
    orderSizes: '1-1000 Metric Tons',
    importCountries: [
      'China',
      'Japan',
      'South Korea',
      'Germany',
      'Turkey',
      'Ukraine',
      'UAE'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹70,000-1,20,000 per Metric Ton',
    applications: [
      'Water Pipelines',
      'Gas Distribution Networks',
      'Structural Columns',
      'Conduit for Electrical Cables',
      'Boiler Tubes',
      'Irrigation Systems'
    ],
    challenges: [
      'Ensuring weld integrity and dimensional accuracy',
      'Corrosion prevention during service life',
      'Logistical challenges for large diameter and long pipes',
      'Intense competition from domestic and international suppliers'
    ],
    marketTrend: 'Massive investment in water infrastructure projects like \'Jal Jeevan Mission\' and expansion of oil & gas pipelines under the National Gas Grid significantly drive demand for steel pipes. The construction sector\'s growth and urbanization also contribute. There is a growing preference for corrosion-resistant coatings and higher-grade materials for critical applications.'
  },
  {
    slug: 'spiral-welded-pipes-india',
    name: 'Spiral Welded Pipes',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Spiral Welded Pipes, also known as Helical Submerged Arc Welded (HSAW) pipes, are large diameter steel pipes produced by spirally coiling a steel strip and then welding the adjoining edges together using a submerged arc welding process. This manufacturing method allows for the production of very large diameter pipes (typically 24 inches and above) with excellent structural integrity suitable for high-pressure fluid conveyance over long distances. They are known for cost-effectiveness in large diameters.',
    industries: [
      'Oil & Gas Pipelines',
      'Water Transmission',
      'Sewerage Systems',
      'Hydroelectric Projects',
      'Offshore Structures',
      'Infrastructure Projects'
    ],
    grades: [
      'IS 3589:2016 Grade Fe 330',
      'IS 3589:2016 Grade Fe 410',
      'API 5L Grade B',
      'API 5L Grade X42',
      'API 5L Grade X52',
      'ASTM A139 Grade B',
      'EN 10217-5'
    ],
    specifications: [
      'Outer Diameter: 24 inches to 120 inches',
      'Wall Thickness: 6mm-25mm',
      'Length: 6 meters to 18 meters',
      'Pressure Rating: Up to 1500 psi (design dependent)',
      'Steel Grade: As per API 5L or IS 3589'
    ],
    standards: [
      'IS 3589:2016 (Steel Pipes for Water and Sewage)',
      'API 5L (Specification for Line Pipe)',
      'ASTM A139 (Electric-Fusion (ARC)-Welded Steel Pipe (NPS 4 and Over))',
      'ISO 3183 (Petroleum and natural gas industries-steel pipe for pipelines)',
      'BIS Certification and PESO Approved'
    ],
    hsnCodes: ['73061919'],
    orderSizes: '100-10000 Metric Tons',
    importCountries: [
      'China',
      'Turkey',
      'South Korea',
      'Russia',
      'Malaysia',
      'Indonesia',
      'UAE'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹65,000-95,000 per Metric Ton',
    applications: [
      'Crude Oil Pipelines',
      'Natural Gas Pipelines',
      'Large Diameter Water Supply Lines',
      'Irrigation and Drainage Projects',
      'Structural Piles',
      'Industrial Effluent Disposal'
    ],
    challenges: [
      'Ensuring consistent weld quality over long spiral seams',
      'Logistical challenges in transporting large diameter pipes',
      'Volatility in Hot Rolled Coil (HRC) feedstock prices',
      'Strict regulatory compliance for pipeline safety in critical sectors'
    ],
    marketTrend: 'The expansion of India\'s oil and gas pipeline infrastructure and the implementation of large-scale water supply schemes under \'Jal Jeevan Mission\' are key drivers for HSAW pipes. The National Infrastructure Pipeline allocates significant funds for such projects. Domestic manufacturing is boosted by PLI schemes, emphasizing scale and quality for critical infrastructure.'
  },
  {
    slug: 'tmt-bars-fe-500-india',
    name: 'TMT Bars Fe-500',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Thermo-Mechanically Treated (TMT) bars Fe-500 are high-strength reinforcement bars widely used in construction. Produced through a specialized manufacturing process involving hot rolling, quenching, and tempering, they exhibit excellent tensile strength and ductility. The Fe-500 grade signifies a minimum yield strength of 500 N/mm², making them suitable for general construction, residential buildings, and infrastructure projects requiring moderate structural loads. Their ribbed surface ensures superior bonding with concrete, preventing slippage and enhancing the overall structural integrity.',
    industries: [
      'Construction',
      'Real Estate',
      'Infrastructure Development',
      'Residential Building',
      'Industrial Construction',
      'Bridge Building'
    ],
    grades: [
      'Fe 500 IS 1786',
      'Fe 500D IS 1786 (for comparison)',
      'Fe 415 IS 1786 (for comparison)',
      'ASTM A615 Grade 75 (equivalent)',
      'BS 4449 Grade B500B (equivalent)',
      'JIS G3112 SD490 (equivalent)',
      'DIN 488 B500B (equivalent)',
      'EN 10080 B500B (equivalent)'
    ],
    specifications: [
      'Yield Strength: 500-550 N/mm²',
      'Tensile Strength: 565-620 N/mm²',
      'Elongation: 14-18%',
      'Carbon Equivalent (CE): 0.40-0.45%',
      'Standard Length: 6-12 meters'
    ],
    standards: [
      'IS 1786:2008 (Reaffirmed 2018)',
      'BIS Certification (mandatory in India)',
      'ASTM A615/A615M',
      'BS 4449',
      'ISO 6935-2'
    ],
    hsnCodes: ['7214.20', '7214.99'],
    orderSizes: '10-500000 kg',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Turkey',
      'Ukraine',
      'Russia',
      'Malaysia'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹45-55 per kg',
    applications: [
      'Residential buildings',
      'Commercial complexes',
      'Bridges and flyovers',
      'Industrial structures',
      'Roads and highways',
      'Dams and canals'
    ],
    challenges: [
      'Volatility in raw material (iron ore, coking coal) prices',
      'Intense competition from organized and unorganized sectors',
      'Logistical challenges for transportation to remote sites',
      'Quality consistency across different manufacturers'
    ],
    marketTrend: 'The demand for TMT bars Fe-500 remains robust, driven by extensive government investment in infrastructure projects under the National Infrastructure Pipeline (NIP) and the push for \'Housing for All\'. Urbanization and the growth of smart cities are also contributing factors. Manufacturers are focusing on energy efficiency in production and adopting sustainable practices to meet regulatory expectations.'
  },
  {
    slug: 'tmt-bars-fe-500d-india',
    name: 'TMT Bars Fe-500D',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'TMT Bars Fe-500D are advanced high-strength deformed steel bars with superior ductility compared to standard Fe-500 grades. The \'D\' denotes enhanced ductility, achieved through stricter control over the chemical composition, particularly lower carbon and sulphur content, and optimized thermomechanical treatment. This results in significantly higher elongation and bendability, making them ideal for seismic zones and structures requiring greater earthquake resistance and energy absorption without brittle fracture. Their yield strength is a minimum of 500 N/mm².',
    industries: [
      'Seismic Zone Construction',
      'High-Rise Buildings',
      'Infrastructure Development',
      'Bridge Construction',
      'Nuclear Power Plants',
      'Residential & Commercial Construction'
    ],
    grades: [
      'Fe 500D IS 1786',
      'Fe 500S (equivalent in some regions)',
      'ASTM A706 Grade 60 (equivalent for seismic applications)',
      'BS 4449 Grade B500C (equivalent)',
      'JIS G3112 SD490 with low carbon (equivalent)',
      'EN 10080 B500C (equivalent)',
      'IS 1786:2008 Grade Fe 500D'
    ],
    specifications: [
      'Yield Strength: 500-550 N/mm²',
      'Tensile Strength: 585-645 N/mm²',
      'Elongation: 16-20%',
      'Carbon Equivalent (CE): Max 0.42%',
      'Sulphur + Phosphorus: Max 0.075%'
    ],
    standards: [
      'IS 1786:2008 (Reaffirmed 2018) \'D\' category',
      'BIS Certification',
      'ASTM A706/A706M',
      'BS 4449',
      'ISO 6935-2'
    ],
    hsnCodes: ['7214.20', '7214.99'],
    orderSizes: '10-250000 kg',
    importCountries: [
      'Germany',
      'Japan',
      'South Korea',
      'Austria',
      'Finland',
      'Sweden',
      'China'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹48-58 per kg',
    applications: [
      'Earthquake-resistant structures',
      'High-rise buildings in seismic zones',
      'Critical infrastructure projects',
      'Heavy load bearing structures',
      'Bridges and tunnels',
      'Foundations and retaining walls'
    ],
    challenges: [
      'Higher production costs due to stringent chemical control',
      'Limited availability from smaller manufacturers',
      'Need for specialized testing and quality assurance',
      'Educating end-users on the specific benefits over regular TMT'
    ],
    marketTrend: 'The demand for Fe-500D TMT bars is steadily increasing, particularly in seismic-prone regions of India. Government regulations mandating earthquake-resistant designs for critical infrastructure and multi-story buildings, coupled with growing awareness among builders, are key drivers. The focus on safety and durability in construction under the Smart Cities mission is further boosting this segment.'
  },
  {
    slug: 'tmt-bars-fe-550-india',
    name: 'TMT Bars Fe-550',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'TMT Bars Fe-550 are high-strength reinforcement bars offering a minimum yield strength of 550 N/mm². They are manufactured using the same thermo-mechanical treatment process as other TMT grades, but with a specific chemical composition and rolling parameters to achieve enhanced strength. Fe-550 bars are typically used in large-scale infrastructure projects, commercial buildings, and industrial structures where higher load-bearing capacity and reduced steel consumption are desired without compromising ductility. They provide a cost-effective solution for structural designs.',
    industries: [
      'Large-Scale Infrastructure',
      'Commercial Building',
      'Industrial Construction',
      'High-Rise Construction',
      'Bridge & Elevated Corridor Projects',
      'Prestressed Concrete Applications'
    ],
    grades: [
      'Fe 550 IS 1786',
      'Fe 550D IS 1786 (for comparison)',
      'Fe 415 IS 1786 (for comparison)',
      'ASTM A615 Grade 80 (equivalent)',
      'BS 4449 Grade B500B/B550B (equivalent)',
      'DIN 488 B550B (equivalent)',
      'EN 10080 B550B (equivalent)',
      'AS/NZS 4671 500E (equivalent)'
    ],
    specifications: [
      'Yield Strength: 550-600 N/mm²',
      'Tensile Strength: 600-660 N/mm²',
      'Elongation: 12-16%',
      'Carbon Equivalent (CE): 0.42-0.47%',
      'Standard Length: 6-12 meters'
    ],
    standards: [
      'IS 1786:2008 (Reaffirmed 2018)',
      'BIS Certification',
      'ASTM A615/A615M',
      'BS 4449',
      'ISO 6935-2'
    ],
    hsnCodes: ['7214.20', '7214.99'],
    orderSizes: '50-500000 kg',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Turkey',
      'GCC countries',
      'Ukraine',
      'Russia'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹46-56 per kg',
    applications: [
      'High-rise commercial buildings',
      'Long-span bridges',
      'Industrial structures and factories',
      'Ports and maritime structures',
      'Metro and railway infrastructure',
      'Large foundations and basements'
    ],
    challenges: [
      'Potential for reduced ductility compared to \'D\' grades if not specified',
      'Requires careful quality control during concrete pouring to ensure alignment',
      'Competition from lower-grade, cheaper alternatives in some regions',
      'Availability in smaller diameters can be limited from certain suppliers'
    ],
    marketTrend: 'The market for TMT Fe-550 bars continues to grow, fueled by ambitious infrastructure and commercial development projects across India. The government\'s push for more efficient and durable construction practices, aligning with initiatives like the \'Make in India\' and \'Smart Cities\' programs, drives demand for higher strength steel. Engineers increasingly specify Fe-550 to optimize designs and reduce material consumption, offering cost efficiencies.'
  },
  {
    slug: 'tmt-bars-fe-550d-india',
    name: 'TMT Bars Fe-550D',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'TMT Bars Fe-550D are premium reinforcement bars combining high strength with enhanced ductility. The \'D\' suffix indicates superior bendability and elongation properties, achieved through precise control over the chemical composition, especially low levels of carbon, sulfur, and phosphorus, coupled with an advanced thermomechanical treatment process. With a minimum yield strength of 550 N/mm², these bars are extensively used in earthquake-prone areas, critical infrastructure, and structures demanding both high load-bearing capacity and resilience against dynamic forces. They ensure maximum safety and structural integrity.',
    industries: [
      'Seismic Construction',
      'Critical Infrastructure',
      'High-Rise Commercial & Residential',
      'Bridge Development',
      'Power Plants (Thermal & Nuclear)',
      'Industrial Facilities'
    ],
    grades: [
      'Fe 550D IS 1786',
      'Fe 500D IS 1786 (for comparison)',
      'ASTM A706 Grade 80 (equivalent for seismic applications)',
      'BS 4449 Grade B550C (equivalent)',
      'EN 10080 B550C (equivalent)',
      'JIS G3112 SD590 with low carbon (equivalent)',
      'CSA G30.18-09 Grade 500R (equivalent)'
    ],
    specifications: [
      'Yield Strength: 550-600 N/mm²',
      'Tensile Strength: 630-690 N/mm²',
      'Elongation: 14-18%',
      'Carbon Equivalent (CE): Max 0.42%',
      'Sulphur + Phosphorus: Max 0.070%'
    ],
    standards: [
      'IS 1786:2008 (Reaffirmed 2018) \'D\' category',
      'BIS Certification',
      'ASTM A706/A706M',
      'BS 4449',
      'ISO 6935-2'
    ],
    hsnCodes: ['7214.20', '7214.99'],
    orderSizes: '50-250000 kg',
    importCountries: [
      'Germany',
      'Japan',
      'South Korea',
      'Finland',
      'Austria',
      'Sweden',
      'Luxembourg'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹49-59 per kg',
    applications: [
      'Earthquake-resistant buildings',
      'Long-span bridges and viaducts',
      'Heavy industrial foundations',
      'Metro rail projects',
      'Marine structures and jetties',
      'High-story residential and commercial towers'
    ],
    challenges: [
      'Higher premium over standard Fe-550 due to specialized production',
      'Requires advanced quality assurance and testing facilities',
      'Limited number of domestic manufacturers meeting all \'D\' grade specifications',
      'Ensuring proper handling and bending techniques on site to preserve ductility'
    ],
    marketTrend: 'The demand for TMT Fe-550D bars is experiencing significant growth driven by increasing awareness of seismic hazards and stricter building codes in India. The government\'s thrust on resilient infrastructure, including projects under the Smart Cities and National Infrastructure Pipeline, fuels the need for high-strength, high-ductility steel. Adoption by leading construction firms for critical projects is expanding its market footprint.'
  },
  {
    slug: 'tmt-bars-fe-600-india',
    name: 'TMT Bars Fe-600',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'TMT Bars Fe-600 represent the highest grade of TMT reinforcement steel currently available for mainstream construction, offering a minimum yield strength of 600 N/mm². This superior strength is achieved through advanced alloy design and a precise thermo-mechanical treatment process, enabling significant reduction in steel consumption for large structures. They are specifically engineered for highly stressed concrete structures, such as long-span bridges, shear walls in skyscrapers, and special structures where high strength is paramount for design efficiency and material optimization. Fe-600 bars lead to lighter, more economical, and durable constructions.',
    industries: [
      'Mega Infrastructure Projects',
      'High-Rise Construction (Super-tall)',
      'Bridge Construction (Long Span)',
      'Nuclear & Thermal Power Plants',
      'Heavy Industrial Facilities',
      'Special Architectural Structures'
    ],
    grades: [
      'Fe 600 IS 1786',
      'Fe 550D IS 1786 (for comparison)',
      'ASTM A615 Grade 100+ (equivalent)',
      'BS 4449 Grade B600B (equivalent)',
      'EN 10080 B600B (equivalent)',
      'JIS G3112 SD600 (equivalent)',
      'AS/NZS 4671 600E (equivalent)'
    ],
    specifications: [
      'Yield Strength: 600-660 N/mm²',
      'Tensile Strength: 660-720 N/mm²',
      'Elongation: 10-14%',
      'Carbon Equivalent (CE): Max 0.45%',
      'Sulphur + Phosphorus: Max 0.080%'
    ],
    standards: [
      'IS 1786:2008 (Reaffirmed 2018)',
      'BIS Certification',
      'ASTM A615/A615M',
      'BS 4449',
      'ISO 6935-2'
    ],
    hsnCodes: ['7214.20', '7214.99'],
    orderSizes: '100-200000 kg',
    importCountries: [
      'Japan',
      'Germany',
      'South Korea',
      'Austria',
      'Sweden',
      'Finland',
      'Luxembourg'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹52-65 per kg',
    applications: [
      'Skyscrapers and high-rise structures',
      'Long-span, cable-stayed bridges',
      'Large industrial factories and warehouses',
      'Heavy-duty concrete foundations',
      'Prestressed concrete applications',
      'Nuclear reactor containment structures'
    ],
    challenges: [
      'Higher cost compared to lower grades of TMT bars',
      'Requires specialized engineering design and detailing expertise',
      'Limited number of approved manufacturers and suppliers',
      'Careful site handling to prevent damage and ensure proper detailing'
    ],
    marketTrend: 'The market for TMT Fe-600 bars, though niche, is expanding in India as ambitious mega-infrastructure and high-rise projects gain momentum. The drive for sustainable construction and optimized material use, in line with government policies like the National Infrastructure Pipeline and emphasis on world-class infrastructure (PLI scheme), is pushing demand. This segment benefits from a focus on engineering excellence and cost-efficiency in large-scale ventures.'
  },
  {
    slug: 'seqr-tmt-bars-india',
    name: 'SeQR TMT Bars',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'SeQR TMT Bars are a specialized category of TMT reinforcement bars designed for advanced corrosion resistance, making them ideal for structures exposed to aggressive environments. These bars incorporate specific metallurgical modifications, such as controlled chemical composition including higher copper/chromium content or specialized surface coatings (often fusion-bonded epoxy), during the thermo-mechanical treatment process. They offer enhanced durability against chlorides and sulfates, preventing premature degradation of concrete structures. SeQR bars maintain the excellent mechanical properties of standard TMT bars while significantly extending the service life of structures in coastal areas, underground applications, and industrial environments.',
    industries: [
      'Coastal Construction',
      'Marine Structures',
      'Underground Infrastructure',
      'Chemical Processing Plants',
      'Smart City Infrastructure',
      'Waste Water Treatment Plants'
    ],
    grades: [
      'Fe 500 HRS IS 1786',
      'Fe 550 HRS IS 1786',
      'Fe 500D (CRS) as per IS 1786',
      'ASTM A1035 (Corrosion-Resistant Steel)',
      'BS 4449 Grade B500CR (equivalent)',
      'EN 10080 CR (equivalent)',
      'IRS M-40 (for marine applications)'
    ],
    specifications: [
      'Yield Strength: 500-550 N/mm² (typically)',
      'Tensile Strength: 565-620 N/mm² (typically)',
      'Elongation: 14-18% (typically)',
      'Corrosion Resistance: High (e.g., as per ASTM G109 salt spray)',
      'Copper Content: 0.15-0.30% (for some grades)'
    ],
    standards: [
      'IS 1786:2008 Grade Fe 500 HRS or Fe 550 HRS (where \'HRS\' denotes High Resistance to Sulphates & Chlorides)',
      'BIS Certification',
      'ASTM A1035/A1035M',
      'As per specific manufacturer\'s proprietary standard, adhering to IS 1786 norms',
      'ISO 6935-2 with corrosion resistance enhancements'
    ],
    hsnCodes: ['7214.20', '7214.91'],
    orderSizes: '50-200000 kg',
    importCountries: [
      'Japan',
      'Germany',
      'South Korea',
      'Sweden',
      'Norway',
      'Finland',
      'USA'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹55-75 per kg',
    applications: [
      'Coastal buildings and jetties',
      'Bridges over estuaries and rivers',
      'Underground drainage systems',
      'Industrial structures with chemical exposure',
      'Basements and foundations in saline soil',
      'Effluent treatment plants'
    ],
    challenges: [
      'Higher material cost compared to standard TMT bars',
      'Requires careful handling to maintain any surface coatings',
      'Educating stakeholders on long-term benefits vs. upfront cost',
      'Limited availability in very small diameters or specialized lengths'
    ],
    marketTrend: 'The market for SeQR (Corrosion Resistant) TMT bars is growing significantly in India, driven by the expansion of coastal infrastructure, smart city development, and increasing awareness of structural longevity. Government mandates for durable construction materials in specific environments, coupled with a focus on \'asset life cycle costing\', are boosting demand. Manufacturers are investing in advanced metallurgy to meet these specialized requirements, aligning with the National Infrastructure Pipeline\'s emphasis on sustainable and resilient projects.'
  },
  {
    slug: 'earthquake-resistant-tmt-india',
    name: 'Earthquake Resistant TMT',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Earthquake Resistant TMT bars are specifically engineered with superior ductility and fatigue resistance to withstand seismic forces without brittle fracture. These bars adhere to strict chemical composition controls, particularly lower carbon, sulfur, and phosphorus content, alongside precise thermomechanical treatment. The enhanced ductility allows the bars to stretch and absorb significant energy during an earthquake, preventing sudden structural collapse and providing crucial warning time. Typically, \'D\' grades (e.g., Fe-500D, Fe-550D) fall into this category, offering a higher percentage of elongation and superior bendability compared to standard TMT grades, thereby enhancing the overall seismic performance of concrete structures, especially in high seismic zones.',
    industries: [
      'Seismic Zone Construction',
      'High-Rise Residential & Commercial',
      'Critical Infrastructure (Hospitals, Schools)',
      'Bridge Construction & Repair',
      'Power Generation Facilities',
      'Smart City Development'
    ],
    grades: [
      'Fe 500D IS 1786',
      'Fe 550D IS 1786',
      'Fe 415D IS 1786 (for smaller structures)',
      'ASTM A706 (Standard Specification for Low-Alloy Steel Deformed and Plain Bars for Concrete Reinforcement)',
      'BS 4449 Grade B500C',
      'JIS G3112 SD490D/SD590D',
      'EN 10080 B500C'
    ],
    specifications: [
      'Yield Strength: 500-550 N/mm² (min.)',
      'Tensile Strength: 585-645 N/mm² (min.)',
      'Elongation: 16-20% (min.)',
      'Carbon Equivalent (CE): Max 0.42%',
      'Sulphur + Phosphorus: Max 0.075%'
    ],
    standards: [
      'IS 1786:2008 (Reaffirmed 2018) \'D\' category',
      'BIS Certification (mandatory as per IS 1786)',
      'ASTM A706/A706M',
      'National Building Code of India (NBC) specific recommendations for seismic zones',
      'ISO 6935-2 with enhanced ductility requirements'
    ],
    hsnCodes: ['7214.20', '7214.99'],
    orderSizes: '10-250000 kg',
    importCountries: [
      'Japan',
      'South Korea',
      'Germany',
      'Austria',
      'Finland',
      'Sweden',
      'USA'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹48-59 per kg',
    applications: [
      'High-rise buildings in seismic zones III, IV, and V',
      'Hospitals, schools, and emergency facilities',
      'Critical government buildings',
      'Bridges and flyovers',
      'Metro rail and underground tunnels',
      'Industrial chimneys and silos'
    ],
    challenges: [
      'Higher cost compared to standard TMT bars',
      'Stringent quality control necessary during manufacturing and on-site',
      'Requires skilled labor for proper bending and placement',
      'Limited awareness among smaller builders and individual home owners'
    ],
    marketTrend: 'The market for Earthquake Resistant TMT bars is experiencing significant expansion in India, driven by stricter building codes, increased awareness of seismic risks, and the government\'s push for resilient infrastructure. The National Disaster Management Authority\'s guidelines and the focus on safety in \'Smart Cities\' projects are pivotal. There is a growing preference for \'D\' grades, signaling a shift towards higher safety standards in construction across seismic-prone regions.'
  },
  {
    slug: 'wire-rods-india',
    name: 'Wire Rods',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Wire rods are hot-rolled, semi-finished steel products with a circular cross-section, typically ranging from 5.5 mm to 16 mm in diameter. They are produced by rolling billets through successive stands at high temperatures and then coiled into specified sizes. Wire rods serve as the primary raw material for various downstream industries, undergoing further processing such as drawing, annealing, and coating to be transformed into finished wire products. Their properties are defined by carbon content, influencing their suitability for different applications from general-purpose wires to high-strength cables. They are essential for a wide array of industrial and construction uses.',
    industries: [
      'Wire Drawing',
      'Fastener Manufacturing',
      'Welding Electrode Manufacturing',
      'Spring Manufacturing',
      'Cable Industry',
      'Mesh and Netting Production'
    ],
    grades: [
      'SAE 1006 (Low Carbon)',
      'SAE 1008 (Low Carbon)',
      'SAE 1010 (Mild Carbon)',
      'SAE 1018 (Medium Carbon)',
      'IS 2062:2011 (Structural Steel - relevant for some applications)',
      'IS 7887:1992 (Low Carbon Steel Wire Rods)',
      'IS 432:1982 (Weldable Structural Steel - for some grades)',
      'ASTM A510 (General Requirements for Wire Rods)'
    ],
    specifications: [
      'Diameter: 5.5 mm - 16 mm',
      'Tensile Strength: 300-900 N/mm² (depending on grade)',
      'Carbon Content: 0.05-0.85% (depending on grade)',
      'Coil Weight: 1-2.5 tons',
      'Ovality: Max 0.8 mm (deviation from true roundness)'
    ],
    standards: [
      'IS 7887:1992 (Low Carbon Steel Wire Rods)',
      'IS 2062:2011 (Hot Rolled Structural Steel)',
      'ASTM A510/A510M',
      'JIS G3503 (Carbon Steel Wire Rods)',
      'DIN EN 10016 (Non-alloy steel wire rods for drawing and/or cold rolling)'
    ],
    hsnCodes: ['7213.91', '7213.99'],
    orderSizes: '5-1000 tons',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Russia',
      'Ukraine',
      'Indonesia',
      'Vietnam'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹40-55 per kg',
    applications: [
      'Drawing into various wires (fencing, nails)',
      'Manufacturing of nuts, bolts, and fasteners',
      'Production of welding electrodes',
      'Reinforcement for concrete (cold drawn wire)',
      'Springs and automotive components',
      'Tire cords and cables'
    ],
    challenges: [
      'Price volatility due to raw material and global supply fluctuations',
      'Maintaining consistent quality for specialized drawing applications',
      'Competition from imported cheaper alternatives',
      'Logistical costs for bulk transportation across regions'
    ],
    marketTrend: 'The wire rod market in India is driven by growth in the infrastructure, automotive, and construction sectors. Government initiatives like \'Make in India\' and the Production Linked Incentive (PLI) scheme are encouraging domestic manufacturing of wire products. However, global trade dynamics and duties on steel imports continue to influence pricing and supply. The increasing demand for galvanized wires and fasteners is a positive trend.'
  },
  {
    slug: 'high-carbon-wire-rods-india',
    name: 'High Carbon Wire Rods',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'High Carbon Wire Rods are hot-rolled steel rods with a carbon content generally ranging from 0.45% to 0.90%, and sometimes higher. This elevated carbon level imparts higher strength, hardness, and wear resistance compared to their low or medium carbon counterparts. They are typically produced from specialized steel grades through a controlled rolling and cooling process to achieve specific microstructures for subsequent cold drawing and heat treatment. High carbon wire rods are primarily used for manufacturing high-strength wires, springs, cables, and other demanding applications where superior mechanical properties and fatigue resistance are critical. They form the backbone of industries requiring robust and durable wire products.',
    industries: [
      'Spring Manufacturing',
      'Wire Rope & Cable Industry',
      'Automotive Components',
      'Tyre Manufacturing (Tyre Bead Wire)',
      'Prestressed Concrete Industry',
      'Mechanical Fasteners (High Strength)'
    ],
    grades: [
      'SAE 1045',
      'SAE 1060',
      'SAE 1070',
      'SAE 1080',
      'IS 280:2006 (Carbon Steel Wire for Ropes and Springs)',
      'IS 4454 (Part 1):1975 (Carbon Steel Wire for Springs)',
      'JIS G3506 (High Carbon Steel Wire Rods)',
      'DIN EN 10016-4 (Non-alloy steel wire rods for drawing and/or cold rolling - special grades)'
    ],
    specifications: [
      'Diameter: 5.5 mm - 14 mm',
      'Carbon Content: 0.45-0.90%',
      'Tensile Strength: 650-1200 N/mm² (as rolled)',
      'Coil Weight: 1-2.5 tons',
      'Microstructure: Controlled pearlite (desired for drawing)'
    ],
    standards: [
      'IS 280:2006 (Steel for Ropes)',
      'IS 4454 (Part 1, 2, 3, 4) (Spring Steels)',
      'ASTM A510/A510M (High Carbon Grades)',
      'JIS G3506',
      'DIN EN 10016-4'
    ],
    hsnCodes: ['7213.91', '7213.20'],
    orderSizes: '10-500 tons',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Russia',
      'Taiwan',
      'Turkey',
      'Germany'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹48-65 per kg',
    applications: [
      'Springs (automotive, industrial)',
      'Tyre bead wire and tire cord',
      'Wire ropes and cables for elevators/cranes',
      'Prestressed concrete wires',
      'High-strength fasteners and bolts',
      'Saw wires and abrasive wires'
    ],
    challenges: [
      'Requires precise control during manufacturing to avoid defects',
      'More difficult to draw than low carbon grades, requires specific machinery',
      'Impact of alloy additions on cost and availability',
      'Vulnerability to global steel price fluctuations'
    ],
    marketTrend: 'The market for high carbon wire rods in India is driven by the expansion of the automotive sector, infrastructure development, and growing demand for high-performance engineered products. The \'Aatmanirbhar Bharat\' vision is encouraging domestic production, though specialized grades still rely on imports. Demand for value-added products like pre-stressing steel and tire cord is a significant growth area, supporting the \'Make in India\' initiative within manufacturing.'
  },
  {
    slug: 'low-carbon-wire-rods-india',
    name: 'Low Carbon Wire Rods',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Low Carbon Wire Rods are hot-rolled steel rods characterized by a relatively low carbon content, typically ranging from 0.05% to 0.25%. This low carbon level provides excellent formability, ductility, and weldability, making them highly versatile for various cold-forming and drawing applications. They are produced through a controlled rolling process, ensuring a uniform and clean surface finish essential for subsequent processing into finished wire products. Low carbon wire rods serve as a foundational material for general engineering purposes, including the manufacturing of binding wires, nails, mesh, and mild steel fasteners where ease of processing and cost-effectiveness are key considerations.',
    industries: [
      'Wire Drawing (General Purpose)',
      'Construction (Binding Wire, Nails)',
      'Fastener Manufacturing (Mild Steel)',
      'Welding Industry (Electrodes)',
      'Mesh and Fencing',
      'Agricultural Tools and Components'
    ],
    grades: [
      'SAE 1006',
      'SAE 1008',
      'SAE 1010',
      'IS 7887:1992 (Low Carbon Steel Wire Rods)',
      'IS 2062:2011 (as base material for some applications)',
      'ASTM A510 (Low Carbon Grades)',
      'JIS G3503 (Low Carbon Steel Wire Rods)',
      'DIN EN 10016-2 (Non-alloy steel wire rods for drawing and/or cold rolling)'
    ],
    specifications: [
      'Diameter: 5.5 mm - 16 mm',
      'Carbon Content: 0.05-0.25%',
      'Tensile Strength: 300-450 N/mm² (as rolled)',
      'Coil Weight: 1-2.5 tons',
      'Surface Quality: Smooth, free from seams and cracks'
    ],
    standards: [
      'IS 7887:1992 (Reaffirmed 2018)',
      'BIS Certification',
      'ASTM A510/A510M',
      'JIS G3503',
      'DIN EN 10016-2'
    ],
    hsnCodes: ['7213.91', '7213.99'],
    orderSizes: '5-2000 tons',
    importCountries: [
      'China',
      'South Korea',
      'Russia',
      'Ukraine',
      'Indonesia',
      'Vietnam',
      'Malaysia'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹40-52 per kg',
    applications: [
      'General-purpose binding wires',
      'Nails and screws manufacturing',
      'Wire mesh and fencing',
      'Manufacturing of welding electrodes',
      'Cold heading applications (rivets, bolts)',
      'Galvanized wire production'
    ],
    challenges: [
      'Intense price competition, especially from imports',
      'Vulnerability to fluctuations in iron ore and coking coal prices',
      'Maintaining consistent quality for high-speed drawing lines',
      'Logistical bottlenecks for reaching smaller, regional processors'
    ],
    marketTrend: 'The market for low carbon wire rods in India is driven by robust construction activity, rural infrastructure development, and the growth of ancillary manufacturing industries. Government focus on affordable housing, roads, and agricultural infrastructure under schemes like PMGSY provides steady demand. While domestic production is substantial, global price dynamics and anti-dumping policies for imports play a crucial role in market stability. Continued innovation in downstream wire products drives demand for specific grades.'
  },
  {
    slug: 'crane-rails-india',
    name: 'Crane Rails',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Crane rails are specialized heavy-duty steel sections designed to support and guide overhead cranes, gantry cranes, and other material handling equipment. These rails are characterized by their robust profiles, high strength, and resistance to wear and tear, ensuring safe and efficient movement of heavy loads in industrial environments. They typically feature a wide base for stability and a flat, smooth head for optimal wheel contact, minimizing friction and maximizing load distribution.',
    industries: [
      'Steel Manufacturing',
      'Shipbuilding',
      'Heavy Engineering',
      'Port Operations',
      'Construction',
      'Automotive Assembly'
    ],
    grades: [
      'CR A73',
      'CR B73',
      'DIN 536 A45',
      'DIN 536 A55',
      'DIN 536 A65',
      'IS 3443:2004 Gr. 880 (U)',
      'IS 3443:2004 Gr. 900 (U)'
    ],
    specifications: [
      'Tensile Strength: 700-1000 N/mm²',
      'Yield Strength: 400-700 N/mm²',
      'Hardness (Brinell): 200-300 HB',
      'Carbon Content: 0.5-0.8%',
      'Rail Length: 6-12 meters'
    ],
    standards: [
      'DIN 536',
      'IS 3443:2004',
      'ASTM A759',
      'BS 11',
      'JIS E 1101'
    ],
    hsnCodes: ['7302.10'],
    orderSizes: '10 - 5000 Tons',
    importCountries: [
      'Germany',
      'China',
      'Japan',
      'Spain',
      'UK',
      'France',
      'Italy'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹65,000 - ₹95,000 per Ton',
    applications: [
      'Overhead travelling cranes',
      'Gantry cranes',
      'Ship-to-shore cranes',
      'Container handling equipment',
      'Heavy industrial workshops',
      'Steel rolling mills'
    ],
    challenges: [
      'Accurate alignment during installation',
      'Wear and fatigue resistance in high-stress environments',
      'Corrosion prevention in outdoor applications',
      'Availability of specialized fastening systems'
    ],
    marketTrend: 'The market for crane rails is stable, driven by sustained industrial growth and infrastructure development, particularly in port expansions and manufacturing sectors. Government initiatives like the National Infrastructure Pipeline (NIP) are bolstering demand for heavy material handling solutions. Investment in modernizing existing industrial facilities also contributes to a consistent need for replacement and upgrade of crane rail systems.'
  },
  {
    slug: 'fish-plates-india',
    name: 'Fish Plates',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Fish plates, also known as joint bars or splice bars, are metal bars used to connect two railway track rails together at their ends. They are designed with precise bolt holes that align with corresponding holes in the rail ends, ensuring a secure and stable connection that maintains gauge and provides continuity for the rolling stock. These plates are crucial for distributing the load evenly across the rail joint, preventing buckling and providing structural integrity to the railway track.',
    industries: [
      'Railway Construction',
      'Mining',
      'Heavy Engineering',
      'Metro Rail Projects',
      'Port Logistics'
    ],
    grades: [
      'IS 2062 Gr. E250',
      'IS 2062 Gr. E350',
      'ASTM A36',
      'ASTM A572 Gr. 50',
      'EN 10025 S275JR',
      'UIC 860-0 B_1002'
    ],
    specifications: [
      'Tensile Strength: 410-600 N/mm²',
      'Yield Strength: 250-350 N/mm²',
      'Elongation: 20-25%',
      'Hardness (Brinell): 120-180 HB',
      'Hole Diameter Tolerance: ±0.5 mm'
    ],
    standards: [
      'IS 2062',
      'IRS T-1',
      'UIC 860-0',
      'ASTM A36',
      'BS EN 10025'
    ],
    hsnCodes: ['7302.40'],
    orderSizes: '500 - 50,000 Pieces',
    importCountries: [
      'China',
      'France',
      'Germany',
      'Japan',
      'Russia',
      'USA'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹70 - ₹250 per piece (depending on rail section)',
    applications: [
      'Joining railway tracks',
      'Repairing broken rail sections',
      'Temporary track installations',
      'Switch and crossing assemblies',
      'Securing turnout components'
    ],
    challenges: [
      'Corrosion in humid or saline environments',
      'Fatigue crack propagation under repeated loading',
      'Ensuring proper fit and bolt tension during installation',
      'Availability of specific profiles for older rail sections'
    ],
    marketTrend: 'The market for fish plates is directly influenced by railway network expansion and maintenance activities. India\'s extensive railway modernization programs, including dedicated freight corridors and high-speed rail projects, are driving consistent demand. The focus on improving track safety and reducing maintenance costs also sustains the need for high-quality, durable fish plates.'
  },
  {
    slug: 'railway-track-components-india',
    name: 'Railway Track Components',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Railway track components encompass a wide array of specialized parts that collectively form a railway track system. These include rails, sleepers (ties), fastenings (e.g., clips, bolts, baseplates), ballast, and various other accessories essential for guiding trains, supporting loads, and maintaining track stability. Each component plays a critical role in distributing the weight of rolling stock, absorbing vibrations, and ensuring the safe and smooth movement of trains over a long operational lifespan.',
    industries: [
      'Railway Construction',
      'Civil Engineering',
      'Mining',
      'Metro Rail',
      'Port Operations',
      'Public Transportation'
    ],
    grades: [
      'IS 2062 Gr. E250',
      'IS 2062 Gr. E350',
      'IS 3443',
      'IRS-T1',
      'UIC 860-0',
      'ASTM A36',
      'ASTM A572 Gr. 50'
    ],
    specifications: [
      'Tensile Strength: 410-880 N/mm² (component dependent)',
      'Yield Strength: 250-700 N/mm² (component dependent)',
      'Hardness (Brinell): 120-280 HB',
      'Dimensional Tolerances: As per relevant IRS/UIC standards',
      'Fatigue Life: Designed for specific load cycles'
    ],
    standards: [
      'IRS Specifications (Various T-series)',
      'IS 2062',
      'IS 3443',
      'UIC Codes (e.g., 860-0, 861-1)',
      'ASTM (various)',
      'BS EN (various)'
    ],
    hsnCodes: [
      '7302.10',
      '7302.30',
      '7302.40',
      '7302.90'
    ],
    orderSizes: 'Project-based, ranging from small batches to multi-ton consignments',
    importCountries: [
      'China',
      'Japan',
      'Germany',
      'France',
      'UK',
      'USA',
      'Russia'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹50 - ₹150,000 per component (highly variable)',
    applications: [
      'Construction of new railway lines',
      'Maintenance and repair of existing tracks',
      'Upgrading heavy haul lines',
      'Metro and light rail systems',
      'Industrial sidings',
      'Turnouts and crossovers'
    ],
    challenges: [
      'Ensuring compatibility between diverse components',
      'Logistics for large-scale procurement and delivery',
      'Resistance to harsh environmental conditions',
      'Adherence to stringent safety and quality standards'
    ],
    marketTrend: 'The market for railway track components is experiencing robust growth driven by significant investments in both passenger and freight rail infrastructure in India. Initiatives like the National Rail Plan 2030 and increased allocation for railway development under the Union Budget are creating substantial demand. The emphasis on higher speeds and greater axle loads also necessitates the use of advanced, durable components.'
  },
  {
    slug: '60-kg-rails-india',
    name: '60 Kg Rails',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: '60 Kg rails are heavy-duty railway tracks with a nominal weight of 60 kilograms per linear meter, signifying their robust cross-sectional area and high strength. These rails are designed for main lines, high-speed corridors, and heavy haul freight routes where high axle loads, frequent traffic, and increased speeds are common. Their substantial mass and profile are engineered to provide enhanced stability, reduce track deformation, and extend the lifespan of the railway infrastructure under demanding operational conditions.',
    industries: [
      'Railway Construction',
      'High-Speed Rail',
      'Heavy Haul Rail',
      'Metro Rail Projects',
      'Freight Logistics'
    ],
    grades: [
      '90 UTS (UIC 60)',
      '1080 MPa (IRS-T12)',
      'R260 (EN 13674-1)',
      'R350HT (EN 13674-1)',
      'Grade 880 (IS 3845:2007)',
      'Grade 1080 (IS 3845:2007)'
    ],
    specifications: [
      'Weight per meter: 60.34 kg',
      'Tensile Strength: 880-1200 N/mm²',
      'Hardness (Brinell): 260-390 HB',
      'Material: Carbon Manganese Steel',
      'Length: 13-26 meters (standard)'
    ],
    standards: [
      'UIC 860-0 V',
      'IRS T-12',
      'IS 3845:2007',
      'EN 13674-1',
      'ASTM A1'
    ],
    hsnCodes: ['7302.10'],
    orderSizes: '100 - 20,000 Tons',
    importCountries: [
      'Japan',
      'China',
      'Germany',
      'France',
      'Russia',
      'Poland',
      'USA'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹65,000 - ₹90,000 per Ton',
    applications: [
      'Mainline passenger routes',
      'High-speed rail corridors',
      'Dedicated freight corridors',
      'Metro rail networks',
      'Heavy industrial railways',
      'Junction and yard lines'
    ],
    challenges: [
      'Precise welding techniques for continuous welded rail',
      'Thermal expansion and contraction management',
      'Wear and rolling contact fatigue management',
      'Logistics for transportation of long rail sections'
    ],
    marketTrend: 'The demand for 60 Kg rails is robust, driven by India\'s ambitious railway expansion and modernization projects, especially the Dedicated Freight Corridors (DFCs) and new high-speed rail lines. The government\'s focus on increasing train speeds and carrying capacity, supported by the National Rail Plan, ensures a consistent and growing market. \'Make in India\' initiatives are encouraging domestic production, but imports supplement specific quality requirements.'
  },
  {
    slug: '52-kg-rails-india',
    name: '52 Kg Rails',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: '52 Kg rails are standard railway tracks with a nominal weight of 52 kilograms per linear meter, making them a common choice for secondary main lines, branch lines, and industrial sidings. They offer a good balance of strength and cost-effectiveness for moderate traffic volumes and axle loads. While lighter than 60 Kg rails, they are engineered to provide adequate support and durability, ensuring reliable operation for a variety of railway applications across different operational conditions.',
    industries: [
      'Railway Construction',
      'Mining',
      'Industrial Logistics',
      'Port Infrastructure',
      'Sugar Mills',
      'Thermal Power Plants'
    ],
    grades: [
      '72 UTS (IRS-T12)',
      '90 UTS (IRS-T12)',
      'R260 (EN 13674-1)',
      'Grade 720 (IS 3845:2007)',
      'Grade 880 (IS 3845:2007)'
    ],
    specifications: [
      'Weight per meter: 51.89 kg',
      'Tensile Strength: 720-1080 N/mm²',
      'Hardness (Brinell): 220-300 HB',
      'Material: Carbon Manganese Steel',
      'Length: 13 meters (standard)'
    ],
    standards: [
      'IRS T-12',
      'IS 3845:2007',
      'UIC 860-0 V',
      'EN 13674-1',
      'ASTM A1'
    ],
    hsnCodes: ['7302.10'],
    orderSizes: '50 - 10,000 Tons',
    importCountries: [
      'China',
      'Russia',
      'Poland',
      'Ukraine',
      'Turkey',
      'Japan'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹60,000 - ₹85,000 per Ton',
    applications: [
      'Branch lines',
      'Secondary mainlines',
      'Industrial sidings and corridors',
      'Port and yard tracks',
      'Mining railways',
      'Private railway networks'
    ],
    challenges: [
      'Susceptibility to wear in high-traffic areas if not properly maintained',
      'Flexibility requirements for curved sections',
      'Corrosion management in specific environments',
      'Ensuring proper track geometry and alignment'
    ],
    marketTrend: 'The market for 52 Kg rails remains steady, primarily driven by maintenance and upgrade projects on existing railway lines and the development of industrial sidings. While new mainlines increasingly adopt 60 Kg rails, the extensive network of secondary lines and private industrial railways in India ensures continuous demand. The Push to ensure last-mile connectivity for industries also contributes to its sustained requirement.'
  },
  {
    slug: 'head-hardened-rails-india',
    name: 'Head Hardened Rails',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Head hardened rails are railway tracks that undergo a specialized heat treatment process, typically involving controlled quenching and tempering of the railhead. This process significantly enhances the hardness, wear resistance, and rolling contact fatigue life of the railhead, while maintaining the toughness of the web and foot. These rails are essential for high-stress applications such as tight curves, steep gradients, heavy haul lines, and high-speed corridors, where conventional rails would experience premature wear and damage.',
    industries: [
      'Heavy Haul Rail',
      'High-Speed Rail',
      'Metro Rail Projects',
      'Mining Railways',
      'Urban Transit Systems'
    ],
    grades: [
      'UIC 900A',
      'UIC 1100',
      'UIC 1200',
      'R350HT (EN 13674-1)',
      'R370CrHT (EN 13674-1)',
      'Grade 1080HH (IS 3845:2007)'
    ],
    specifications: [
      'Tensile Strength: 1080-1400 N/mm²',
      'Head Hardness (Brinell): 300-390 HB',
      'Pearlite Content: >90%',
      'Decarburization Depth: <0.5 mm',
      'Straightness Tolerance: ±0.1 mm/m'
    ],
    standards: [
      'UIC 860-0 Rev. 5',
      'EN 13674-1',
      'IS 3845:2007 (for HH grades)',
      'IRS T-12 (for HH grades)',
      'ASTM A1'
    ],
    hsnCodes: ['7302.10'],
    orderSizes: '50 - 15,000 Tons',
    importCountries: [
      'Japan',
      'Austria',
      'Germany',
      'France',
      'China',
      'Spain',
      'Poland'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹80,000 - ₹120,000 per Ton',
    applications: [
      'Sharp curves on mainline tracks',
      'Heavy haul freight lines',
      'High-speed rail corridors',
      'Metro rail systems',
      'Turnouts and crossings',
      'Sections with steep gradients'
    ],
    challenges: [
      'Higher initial cost compared to conventional rails',
      'Specialized welding procedures required',
      'Susceptibility to hydrogen embrittlement if not manufactured correctly',
      'Requires precise installation and maintenance practices'
    ],
    marketTrend: 'The market for head hardened rails is experiencing significant growth in India, driven by the increasing emphasis on higher speeds, heavier axle loads, and reduced maintenance costs for railway infrastructure. Projects like dedicated freight corridors, new metro lines, and high-speed rail corridors are specifically opting for HH rails. The \'Smart Cities Mission\' also indirectly contributes by demanding robust urban transport infrastructure, enhancing demand for these specialised rails.'
  },
  {
    slug: 'railway-wheels-india',
    name: 'Railway Wheels',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Railway wheels are critical components of rolling stock, designed to support the weight of the train and guide it along the railway tracks. They are typically made from high-strength forged or cast steel, featuring a coned tread and a flanged rim. The wheel\'s design ensures a precise interface with the rail, distributing loads, providing traction, and enabling smooth negotiation of curves. Their durability, wear resistance, and fatigue strength are paramount for operational safety and longevity.',
    industries: [
      'Railways (Locomotives, Wagons, Coaches)',
      'Metro Rail',
      'Mining & Industrial Locomotives',
      'Heavy Engineering',
      'Defence Railways'
    ],
    grades: [
      'IRS R-19 (Class A, B, C)',
      'AAR M-107/M-208 (Class B, C, D)',
      'EN 13262 (ER7, ER8, ER9)',
      'ASTM A504 (Class B, C, D)',
      'BS 5892-3 (Grade R7, R8, R9)'
    ],
    specifications: [
      'Tensile Strength: 700-1100 N/mm²',
      'Yield Strength: 400-800 N/mm²',
      'Rim Hardness (Brinell): 200-350 HB',
      'Carbon Content: 0.5-0.8%',
      'Diameter: 650-1070 mm (Locomotive), 840-915 mm (Wagon/Coach)'
    ],
    standards: [
      'IRS R-19',
      'AAR M-107/M-208',
      'EN 13262',
      'IS 10398:1982',
      'ASTM A504',
      'UIC 810-1'
    ],
    hsnCodes: ['8607.19'],
    orderSizes: '100 - 50,000 Wheels',
    importCountries: [
      'Ukraine',
      'China',
      'Russia',
      'Germany',
      'Czech Republic',
      'Poland',
      'Japan'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹70,000 - ₹2,50,000 per wheel',
    applications: [
      'Locomotives (diesel/electric)',
      'Coaching stock (passenger)',
      'Freight wagons',
      'Metro train sets',
      'Tramways',
      'Industrial rail vehicles'
    ],
    challenges: [
      'Rolling contact fatigue and wear of the tread',
      'Thermal cracking due to braking',
      'Internal stress management during manufacturing',
      'Ensuring precise geometric profiles for safe operation'
    ],
    marketTrend: 'The market for railway wheels in India is robust, driven by the expansion of railway networks, increase in rolling stock production under \'Make in India\' and modernization programs. The continued focus on dedicated freight corridors and metro rail expansion across cities significantly contributes to demand. The Production Linked Incentive (PLI) scheme for rolling stock manufacturing could further boost domestic demand and production.'
  },
  {
    slug: 'railway-axles-india',
    name: 'Railway Axles',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Railway axles are cylindrical steel shafts designed to connect a pair of wheels, forming a wheelset, and transmit the weight of the rolling stock to the wheels and then to the rails. These crucial components are made from high-strength forged steel, engineered to withstand immense static and dynamic loads, repeated fatigue stresses, and torsional forces. The integrity of the axle is paramount for rail safety, requiring precise manufacturing, excellent fatigue resistance, and robust material properties.',
    industries: [
      'Railways (Locomotives, Wagons, Coaches)',
      'Metro Rail',
      'Mining Locomotives',
      'Heavy Engineering',
      'Integrated Steel Plants'
    ],
    grades: [
      'IRS R-16 (Class A, B, C)',
      'AAR M-101 (Class B, C, D)',
      'EN 13261 (A1N, A2N, AZN)',
      'ASTM A21 (Class B, C, D)',
      'BS 5892-2 (Grade A, B, C)'
    ],
    specifications: [
      'Tensile Strength: 500-800 N/mm²',
      'Yield Strength: 250-500 N/mm²',
      'Elongation: 18-25%',
      'Impact Strength (Charpy): >27 J at -20°C',
      'Diameter: 130-230 mm (standard)'
    ],
    standards: [
      'IRS R-16',
      'AAR M-101',
      'EN 13261',
      'IS 10343',
      'ASTM A21',
      'UIC 811-1'
    ],
    hsnCodes: ['8607.19'],
    orderSizes: '50 - 20,000 Axles',
    importCountries: [
      'Ukraine',
      'China',
      'Russia',
      'France',
      'Germany',
      'Czech Republic',
      'Japan'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹1,00,000 - ₹3,50,000 per axle',
    applications: [
      'Locomotives and electric multiple units',
      'Passenger coaches',
      'Freight wagons',
      'Metro rail coaches',
      'Industrial rolling stock',
      'Tram bogies'
    ],
    challenges: [
      'Fatigue crack initiation and propagation',
      'Corrosion under service conditions',
      'Maintaining concentricity and surface finish',
      'Non-destructive testing for hidden defects'
    ],
    marketTrend: 'The market for railway axles is driven by the expansion and modernization of India\'s railway infrastructure, including new rolling stock procurement for both passenger and freight segments. The push towards indigenous manufacturing of high-quality components for these critical applications is strong, aligned with \'Make in India\'. Investments in metro projects across various cities also contribute to sustained demand for robust and reliable axles.'
  },
  {
    slug: 'wheel-sets-india',
    name: 'Wheel Sets',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Wheel sets are integral assemblies in railway rolling stock, comprising two railway wheels firmly pressed onto a dedicated railway axle. This integrated unit is designed to provide stable guidance of the train on the tracks, transmit vertical and lateral forces, and facilitate smooth movement through curves. The precise fit of the wheels onto the axle, along with the metallurgical properties of both components, ensures critical safety, performance, and durability under varying operational conditions.',
    industries: [
      'Railways (Locomotives, Wagons, Coaches)',
      'Metro Rail',
      'Mining & Heavy Engineering',
      'Urban Transit Systems',
      'Defence Railways'
    ],
    grades: [
      'IRS R-19 (Wheels) + IRS R-16 (Axles)',
      'AAR M-107/M-208 (Wheels) + AAR M-101 (Axles)',
      'EN 13260 (Integrated Wheelset Standard)',
      'ASTM A504 (Wheels) + ASTM A21 (Axles)',
      'UIC 813-1 (Integrated Wheelset Standard)'
    ],
    specifications: [
      'Nominal wheel diameter: 650-1070 mm',
      'Axle Journal Diameter: 130-230 mm',
      'Wheel Pressing Force: As per standard for specified diameter',
      'Axle Material: Carbon steel (e.g., C30, C40)',
      'Wheel Material: High Carbon Steel (e.g., Gr A, B, C)'
    ],
    standards: [
      'IRS R-19 & IRS R-16',
      'AAR M-107/M-208 & M-101',
      'EN 13260',
      'IS 10398 & IS 10343',
      'UIC 813-1',
      'ASTM A551'
    ],
    hsnCodes: ['8607.19'],
    orderSizes: '50 - 15,000 Wheel Sets',
    importCountries: [
      'Ukraine',
      'China',
      'Russia',
      'Germany',
      'Czech Republic',
      'France',
      'Japan'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹1,80,000 - ₹5,50,000 per wheel set',
    applications: [
      'Bogies for locomotives',
      'Underframes of passenger coaches',
      'Freight wagon assemblies',
      'Metro train bogies',
      'Tram and light rail vehicles',
      'Industrial shuttle trains'
    ],
    challenges: [
      'Critical interference fit between wheel and axle',
      'Cumulative fatigue life of both components',
      'Vibration and noise reduction',
      'In-service inspection and maintenance for safety'
    ],
    marketTrend: 'The market for railway wheel sets is driven by comprehensive railway modernization and expansion plans across India. With significant investment in new rolling stock for both high-speed and conventional lines, and the ongoing development of metro rail networks, demand remains high. The Indian government\'s push for advanced manufacturing capabilities for railways under the National Policy on Capital Goods also directly supports this sector.'
  },
  {
    slug: 'forged-wheels-india',
    name: 'Forged Wheels',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Forged wheels are railway wheels manufactured through a hot forging process, where steel billets are shaped under immense pressure and heat. This process refines the grain structure of the steel, eliminating internal defects and voids, resulting in superior mechanical properties compared to cast wheels. Forged wheels exhibit exceptional strength, toughness, fatigue resistance, and wear resistance, making them the preferred choice for high-speed trains, heavy haul locomotives, and other demanding railway applications requiring maximum reliability and safety.',
    industries: [
      'High-Speed Rail',
      'Heavy Haul Rail',
      'Metro Rail',
      'Locomotive Manufacturing',
      'Passenger Coach Manufacturing',
      'Freight Wagon Manufacturing'
    ],
    grades: [
      'IRS R-19 (Class C)',
      'AAR M-107/M-208 (Class D)',
      'EN 13262 (ER9)',
      'ASTM A504 (Class D)',
      'UIC 810-1 (Class R8, R9)'
    ],
    specifications: [
      'Tensile Strength: >880-1100 N/mm²',
      'Rim Hardness (Brinell): 260-350 HB',
      'Toughness: High (Charpy >20 J at -40°C)',
      'Grain Structure: Fine and uniform',
      'Fatigue Life: Superior to cast wheels'
    ],
    standards: [
      'IRS R-19 (Forged)',
      'AAR M-107/M-208',
      'EN 13262',
      'IS 10398 (Forged)',
      'ASTM A504',
      'UIC 810-1'
    ],
    hsnCodes: ['8607.19'],
    orderSizes: '50 - 10,000 Wheels',
    importCountries: [
      'Ukraine',
      'Germany',
      'Russia',
      'Japan',
      'China',
      'Czech Republic',
      'Italy'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹85,000 - ₹3,00,000 per wheel',
    applications: [
      'High-speed passenger trains (Bullet Trains)',
      'Heavy haul locomotives and wagons',
      'Metro train sets with high operational demands',
      'High-axle load freight wagons',
      'Special purpose railway vehicles',
      'Electric Multiple Units (EMUs)'
    ],
    challenges: [
      'Higher manufacturing costs compared to casting',
      'Complex forging process requiring specialized equipment',
      'Precise heat treatment for optimal properties',
      'Demand for consistent quality and defect-free material'
    ],
    marketTrend: 'The market for forged wheels in India is rapidly expanding, driven by the rollout of high-speed rail projects and the increasing modernization of the railway fleet. The focus on enhanced safety, higher speeds, and increased freight capacity necessitates the use of premium-quality forged wheels. The \'Make in India\' initiative is pushing for domestic manufacturing capabilities for such critical components, reducing reliance on imports for these advanced applications.'
  },
  {
    slug: 'stainless-steel-sheets-india',
    name: 'Stainless Steel Sheets',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Stainless steel sheets are flat, thin products made from various stainless steel alloys, primarily used for their corrosion resistance, strength, and aesthetic appeal. They are typically produced by hot or cold rolling processes, followed by annealing and pickling. Their versatility in size, finish, and grade makes them indispensable across a wide spectrum of industrial and consumer applications, offering durability and low maintenance.',
    industries: [
      'Architecture & Construction',
      'Food Processing',
      'Chemical & Petrochemical',
      'Automotive',
      'Medical Equipment',
      'Home Appliances'
    ],
    grades: [
      'SS 304 (IS 6911)',
      'SS 316 (ASTM A240)',
      'SS 201 (IS 15748)',
      'SS 430 (ASTM A240)',
      'SS 304L (ASTM A240)',
      'SS 316L (ASTM A240)',
      'SS 904L (ASTM A240)',
      'SS 310S (ASTM A240)',
      'SS 2205 (ASTM A240)',
      'SS 409L (ASTM A240)'
    ],
    specifications: [
      'Thickness: 0.3 mm - 6.0 mm',
      'Width: 1000 mm - 2000 mm',
      'Length: 2000 mm - 6000 mm',
      'Surface Finish: 2B, BA, No.4, HL'
    ],
    standards: [
      'ASTM A240',
      'IS 6911',
      'EN 10088-2',
      'JIS G4305',
      'ISO 9445'
    ],
    hsnCodes: ['72192100', '72193200'],
    orderSizes: '500 kg - 100 MT',
    importCountries: [
      'South Korea',
      'Indonesia',
      'Malaysia',
      'Taiwan',
      'Japan',
      'China',
      'Germany'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹220 - ₹450 per kg',
    applications: [
      'Kitchen sinks & utensils',
      'Architectural cladding',
      'Chemical storage tanks',
      'Automotive exhaust systems',
      'Heat exchangers',
      'Surgical instruments'
    ],
    challenges: [
      'Fluctuating raw material (Nickel, Chromium) prices',
      'Competition from imported material',
      'Disposal of industrial waste from manufacturing'
    ],
    marketTrend: 'Demand for stainless steel sheets is growing steadily, propelled by infrastructure development and expansion in food processing and automotive sectors. Government initiatives like Make in India and NIP are driving domestic consumption and production capacity. The emphasis on hygiene and durability in various industries also contributes to sustained market expansion.'
  },
  {
    slug: 'stainless-steel-coils-india',
    name: 'Stainless Steel Coils',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Stainless steel coils are semi-finished products obtained by continuous hot or cold rolling of stainless steel, forming long, wound strips. These coils serve as the primary input material for various downstream processing, including cutting into sheets, slitting into narrower strips, or forming into tubes and pipes. Their form factor allows for efficient transportation and subsequent fabrication into a multitude of end products requiring corrosion resistance and strength.',
    industries: [
      'Automotive',
      'Construction',
      'Consumer Goods',
      'Electrical Appliances',
      'HVAC',
      'Industrial Fabrication'
    ],
    grades: [
      'SS 304 (IS 6911)',
      'SS 316 (ASTM A240)',
      'SS 201 (IS 15748)',
      'SS 430 (ASTM A240)',
      'SS 304L (ASTM A240)',
      'SS 316L (ASTM A240)',
      'SS 409L (ASTM A240)',
      'SS 2205 (ASTM A240)',
      'SS 309S (ASTM A240)',
      'SS 321 (ASTM A240)'
    ],
    specifications: [
      'Thickness: 0.1 mm - 12.0 mm',
      'Width: 600 mm - 2000 mm',
      'Coil ID: 508 mm or 610 mm',
      'Surface Finish: 2B, BA, No.1, No.4'
    ],
    standards: [
      'ASTM A240',
      'IS 6911',
      'EN 10088-2',
      'JIS G4305',
      'ISO 9445'
    ],
    hsnCodes: ['72192100', '72193200'],
    orderSizes: '1 MT - 150 MT',
    importCountries: [
      'Taiwan',
      'Indonesia',
      'Vietnam',
      'South Korea',
      'China',
      'Germany',
      'Japan'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹210 - ₹430 per kg',
    applications: [
      'Pipe & Tube manufacturing',
      'Pressing & stamping activities',
      'Roll forming sections',
      'Transformer casings',
      'Food processing equipment panels',
      'Solar panel frames'
    ],
    challenges: [
      'Variability in international commodity prices',
      'Logistics and handling of heavy coils',
      'Quality consistency across different batches'
    ],
    marketTrend: 'The market for stainless steel coils is experiencing robust growth driven by demand from downstream industries like automotive and white goods manufacturing. Public infrastructure projects under the National Infrastructure Pipeline (NIP) are also creating significant demand. Initiatives to boost domestic manufacturing capacity coupled with strategic exports are shaping market dynamics.'
  },
  {
    slug: 'stainless-steel-plates-india',
    name: 'Stainless Steel Plates',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Stainless steel plates are thick, flat rolled products with a thickness typically greater than 6 mm, offering superior strength, corrosion resistance, and heat resistance. They are manufactured through hot rolling, followed by various heat treatments and finishing processes. These plates are crucial for heavy-duty applications where structural integrity, high load-bearing capacity, and resistance to harsh environments are paramount, often serving as primary structural components.',
    industries: [
      'Heavy Fabrication',
      'Shipbuilding',
      'Oil & Gas',
      'Power Generation',
      'Defence',
      'Cement & Mining'
    ],
    grades: [
      'SS 304 (IS 6911)',
      'SS 316L (ASTM A240)',
      'SS 2205 (ASTM A240)',
      'SS 321 (ASTM A240)',
      'SS 304H (ASTM A240)',
      'SS 310S (ASTM A240)',
      'SS 904L (ASTM A240)',
      'SS 410 (ASTM A240)',
      'SS 347 (ASTM A240)',
      'SS S31803 (ASTM A240)'
    ],
    specifications: [
      'Thickness: 6.0 mm - 100.0 mm',
      'Width: 1500 mm - 3500 mm',
      'Length: 3000 mm - 12000 mm',
      'Surface Finish: No.1, Hot Rolled Annealed & Pickled'
    ],
    standards: [
      'ASTM A240',
      'IS 6911',
      'ASME SA240',
      'EN 10088-2',
      'JIS G4304'
    ],
    hsnCodes: ['72191100', '72191200'],
    orderSizes: '1 MT - 200 MT',
    importCountries: [
      'Japan',
      'South Korea',
      'Germany',
      'Finland',
      'Sweden',
      'Belgium',
      'China'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹250 - ₹550 per kg',
    applications: [
      'Pressure vessels',
      'Storage tanks',
      'Ship hulls & decks',
      'Industrial machinery frameworks',
      'Bridge components',
      'Nuclear power plant structures'
    ],
    challenges: [
      'High capital investment for production facilities',
      'Impact of anti-dumping duties on imports',
      'Compliance with stringent industry-specific certifications'
    ],
    marketTrend: 'Demand for stainless steel plates is driven by expansion in heavy engineering, oil & gas, and infrastructure sectors. Large-scale government projects in defence and power generation are key demand drivers. The focus on reliable and long-lasting materials in critical infrastructure under the National Infrastructure Pipeline continues to bolster market growth.'
  },
  {
    slug: 'stainless-steel-bars-india',
    name: 'Stainless Steel Bars',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Stainless steel bars are elongated, solid forms of stainless steel, ranging from round, square, hexagonal, to flat cross-sections. They are produced through hot rolling, cold drawing, or forging processes, offering excellent machinability, strength, and corrosion resistance. These bars are fundamental semi-finished products used for manufacturing components, fasteners, and structural elements that demand high performance and durability in corrosive environments.',
    industries: [
      'Machining & Fabrication',
      'Automotive',
      'Aerospace',
      'Fasteners',
      'Medical Implants',
      'Pump & Valve Industry'
    ],
    grades: [
      'SS 304 (IS 6603)',
      'SS 316 (ASTM A276)',
      'SS 410 (ASTM A276)',
      'SS 420 (ASTM A276)',
      'SS 303 (ASTM A582)',
      'SS 431 (ASTM A276)',
      'SS 17-4PH (ASTM A564)',
      'SS 304L (ASTM A276)',
      'SS 316L (ASTM A276)',
      'SS 630 (ASTM A564)'
    ],
    specifications: [
      'Diameter (Round): 3 mm - 300 mm',
      'Length: 2000 mm - 6000 mm (custom lengths available)',
      'Tolerance: h9, h11, cold drawn/hot rolled',
      'Surface Finish: Bright, Black, Peeled'
    ],
    standards: [
      'ASTM A276',
      'IS 6603',
      'EN 10088-3',
      'JIS G4303',
      'BS 970'
    ],
    hsnCodes: ['72221111', '72222010'],
    orderSizes: '100 kg - 50 MT',
    importCountries: [
      'Taiwan',
      'China',
      'Spain',
      'Italy',
      'Japan',
      'Germany',
      'UK'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹280 - ₹600 per kg',
    applications: [
      'Pump shafts & impellers',
      'Valve components',
      'Machine parts',
      'Bolts, nuts & fasteners',
      'Surgical instruments',
      'Marine hardware'
    ],
    challenges: [
      'Ensuring consistent mechanical properties across different batches',
      'Demand fluctuations from SME fabricators',
      'High machining costs for complex parts'
    ],
    marketTrend: 'The market for stainless steel bars is experiencing steady growth, driven by expansion in the automotive, manufacturing, and general engineering sectors. The push for indigenous manufacturing under \'Atmanirbhar Bharat\' is increasing local procurement. Modernization of infrastructure also fuels demand for durable components produced from these bars.'
  },
  {
    slug: 'austenitic-stainless-steel-india',
    name: 'Austenitic Stainless Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Austenitic stainless steels are the most common type of stainless steel, characterized by their face-centered cubic crystal structure (austenite), excellent corrosion resistance, non-magnetic properties, and good formability. They are typically alloyed with high levels of chromium, nickel, and sometimes molybdenum or nitrogen. Their superior ductility and weldability make them suitable for a vast array of applications, particularly where formability and resistance to moderate corrosive environments are key requirements.',
    industries: [
      'Food & Beverage',
      'Chemical Processing',
      'Architectural',
      'Medical Devices',
      'Consumer Goods',
      'Pharmaceutical'
    ],
    grades: [
      'SS 304 (IS 6911)',
      'SS 316 (ASTM A240)',
      'SS 304L (ASTM A240)',
      'SS 316L (ASTM A240)',
      'SS 321 (ASTM A240)',
      'SS 310S (ASTM A240)',
      'SS 904L (ASTM A240)',
      'SS 201 (IS 15748)',
      'SS 317L (ASTM A240)',
      'SS 347 (ASTM A240)'
    ],
    specifications: [
      'Chromium Content: 16% - 26%',
      'Nickel Content: 6% - 22%',
      'Yield Strength: 200 MPa - 350 MPa',
      'Elongation: >40%'
    ],
    standards: [
      'ASTM A240',
      'IS 6911',
      'EN 10088-1',
      'JIS G4305',
      'BS 1449'
    ],
    hsnCodes: ['72192200', '72202021'],
    orderSizes: '100 kg - 100 MT',
    importCountries: [
      'South Korea',
      'Indonesia',
      'Japan',
      'China',
      'Taiwan',
      'Germany',
      'USA'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹220 - ₹600 per kg',
    applications: [
      'Kitchen appliances & utensils',
      'Chemical storage tanks',
      'Heat exchangers',
      'Architectural trim',
      'Textile machinery components',
      'Cryogenic applications'
    ],
    challenges: [
      'Vulnerability to stress corrosion cracking in specific environments',
      'Higher raw material costs due to nickel content',
      'Sensitization during welding if carbon content is not controlled'
    ],
    marketTrend: 'The market for austenitic stainless steel is consistently robust, driven by health sector expansion, increasing demand for food-grade equipment, and growing urban infrastructure. The \'Smart Cities Mission\' and \'Swachh Bharat Abhiyan\' contribute to increased usage in public utilities. Their versatility ensures continued relevance across diverse segments.'
  },
  {
    slug: 'ferritic-stainless-steel-india',
    name: 'Ferritic Stainless Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Ferritic stainless steels are a class of stainless steels characterized by their body-centered cubic (BCC) crystal structure, which makes them magnetic and generally resistant to stress corrosion cracking. They contain chromium as the primary alloying element (10.5% to 27%) and very low carbon content, with minimal or no nickel. These steels offer good ductility and formability, and are generally more cost-effective than austenitic grades, making them attractive for non-critical, interior, and less aggressive corrosive environments.',
    industries: [
      'Automotive Exhausts',
      'Kitchenware',
      'Home Appliances',
      'Industrial Furnaces',
      'Indoor Architectural',
      'Heat Treatment Equipment'
    ],
    grades: [
      'SS 430 (IS 15748)',
      'SS 409L (ASTM A240)',
      'SS 439 (ASTM A240)',
      'SS 441 (ASTM A240)',
      'SS 444 (ASTM A240)',
      'SS 409 (ASTM A240)',
      'SS 436 (ASTM A240)',
      'SS 405 (ASTM A240)',
      'SS 4003 (ASTM A240)',
      'SS 430Ti (ASTM A240)'
    ],
    specifications: [
      'Chromium Content: 10.5% - 27%',
      'Nickel Content: <0.75%',
      'Tensile Strength: 400 MPa - 600 MPa',
      'Thermal Expansion: Lower than austenitic'
    ],
    standards: [
      'ASTM A240',
      'IS 15748',
      'EN 10088-1',
      'JIS G4305',
      'GOST 5632'
    ],
    hsnCodes: ['72192300', '72202029'],
    orderSizes: '500 kg - 70 MT',
    importCountries: [
      'China',
      'Indonesia',
      'Brazil',
      'Japan',
      'South Korea',
      'USA',
      'Germany'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹150 - ₹280 per kg',
    applications: [
      'Automotive exhaust systems',
      'Washing machine tubs',
      'Dishwasher interiors',
      'Cooking utensils',
      'Industrial heat exchangers',
      'Ornamental trim'
    ],
    challenges: [
      'Lower corrosion resistance compared to austenitic grades',
      'Reduced weldability, especially in thicker sections',
      'Risk of 475°C embrittlement with prolonged exposure to elevated temperatures'
    ],
    marketTrend: 'The market for ferritic stainless steel is experiencing growth, particularly in the automotive and home appliance sectors due to its cost-effectiveness and magnetic properties. The Indian auto industry\'s push for vehicle electrification and BS-VI compliance boosts demand. Affordability also makes it attractive for mass-market consumer products.'
  },
  {
    slug: 'duplex-stainless-steel-india',
    name: 'Duplex Stainless Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Duplex stainless steels are advanced alloys characterized by a mixed microstructure of approximately equal proportions of austenite and ferrite phases, providing a unique combination of high strength and excellent corrosion resistance. Their enhanced resistance to stress corrosion cracking and pitting corrosion surpasses that of conventional austenitic grades. These properties make them highly desirable for demanding applications in aggressive environments where both mechanical integrity and corrosion protection are critical.',
    industries: [
      'Oil & Gas',
      'Chemical Tankers',
      'Desalination Plants',
      'Pulp & Paper',
      'Marine Engineering',
      'Structural Engineering'
    ],
    grades: [
      'UNS S31803 (ASTM A240)',
      'UNS S32205 (ASTM A240)',
      'UNS S32750 (ASTM A240)',
      'UNS S32760 (ASTM A240)',
      'UNS S32550 (ASTM A240)',
      'UNS S39274 (ASTM A240)',
      'UNS S32304 (ASTM A240)',
      'UNS S82441 (ASTM A240)',
      'UNS S32101 (ASTM A240)',
      'UNS J92205 (ASTM A890)'
    ],
    specifications: [
      'Chromium Content: 21% - 28%',
      'Nickel Content: 4.5% - 8%',
      'Yield Strength: 450 MPa - 800 MPa',
      'PREN (Pitting Resistance Equivalent Number): >32'
    ],
    standards: [
      'ASTM A240',
      'ASTM A790',
      'EN 1.4462',
      'NACE MR0175',
      'API spec 5L'
    ],
    hsnCodes: ['72191400', '72221999'],
    orderSizes: '50 kg - 50 MT',
    importCountries: [
      'Sweden',
      'USA',
      'Finland',
      'Germany',
      'France',
      'Japan',
      'South Korea'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹450 - ₹900 per kg',
    applications: [
      'Offshore oil platforms',
      'Chemical process piping',
      'Heat exchangers',
      'Desalination plant components',
      'Bridge structural elements',
      'Storage tanks for chemicals'
    ],
    challenges: [
      'Precise control during welding to maintain phase balance',
      'Higher raw material cost due to nickel and molybdenum content',
      'Limited suppliers for specialized grades and forms'
    ],
    marketTrend: 'The market for duplex stainless steel is experiencing significant expansion, driven by the oil and gas sector\'s demand for high-performance materials in challenging environments. Indian infrastructure projects, especially in coastal regions and chemical industries, are also increasing uptake. The focus on long-lasting, low-maintenance assets under \'Sagarmala\' project further fuels demand.'
  },
  {
    slug: 'electrical-steel-sheets-india',
    name: 'Electrical Steel Sheets',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Electrical steel sheets, also known as silicon steel or transformer steel, are specialized ferrous alloys engineered for specific magnetic properties, primarily high magnetic permeability and low core loss. They contain varying silicon content (up to 4.5%) which increases electrical resistivity and reduces eddy current losses. These sheets are essential for constructing efficient magnetic cores in electrical devices, minimizing energy wastage and enhancing performance.',
    industries: [
      'Power Transformers',
      'Electric Motors',
      'Generators',
      'Switchgear',
      'Home Appliances',
      'Renewable Energy'
    ],
    grades: [
      'M3 (ASTM A677)',
      'M4 (ASTM A677)',
      'M5 (ASTM A677)',
      'M6 (ASTM A677)',
      '35W230 (IS 3024)',
      '50W400 (IEC 60404-8-4)',
      '27G130 (JIS C2550)',
      '30Q130 (JIS C2552)',
      'NOES 0.35 mm',
      'CRNO M19'
    ],
    specifications: [
      'Silicon Content: 0.5% - 4.5%',
      'Thickness: 0.23 mm - 0.65 mm',
      'Core Loss (P1.7/50): 1.5 - 6.0 W/kg',
      'Permeability: High (typically >10,000)'
    ],
    standards: [
      'ASTM A677',
      'IS 3024',
      'IEC 60404-8-4',
      'JIS C2552',
      'BS EN 10106'
    ],
    hsnCodes: ['72251100', '72261100'],
    orderSizes: '5 MT - 200 MT',
    importCountries: [
      'Japan',
      'South Korea',
      'Germany',
      'USA',
      'China',
      'Russia',
      'France'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹120 - ₹280 per kg',
    applications: [
      'Transformer cores',
      'Motor laminations',
      'Generator cores',
      'Reactor cores',
      'Chokes',
      'Magnetic shields'
    ],
    challenges: [
      'Maintaining consistent grain orientation for optimal magnetic properties',
      'High energy consumption during manufacturing',
      'Susceptibility to damage from mechanical stress affecting magnetic performance'
    ],
    marketTrend: 'Demand for electrical steel sheets is robust, driven by extensive investment in power infrastructure and the growth of the electric vehicle (EV) market. Government initiatives for renewable energy and \'Make in India\' for electrical equipment are pivotal drivers. The push for energy efficiency in motor and transformer manufacturing provides sustained market stimulus.'
  },
  {
    slug: 'crgo-cold-rolled-grain-oriented-steel-india',
    name: 'CRGO (Cold Rolled Grain Oriented) Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'CRGO steel is a highly specialized electrical steel characterized by its unique grain orientation, achieved through a meticulously controlled cold rolling process and subsequent high-temperature annealing. This anisotropic property ensures that the magnetic grains are aligned in the rolling direction, significantly enhancing magnetic permeability and drastically reducing core losses, particularly in applications where the magnetic flux is predominantly in one direction. It is indispensable for high-efficiency transformers.',
    industries: [
      'Power Transformers',
      'Distribution Transformers',
      'High Voltage Equipment',
      'Renewable Energy (Wind & Solar)',
      'Railway Electrification',
      'Large Generators'
    ],
    grades: [
      'M3',
      'M4',
      'M5',
      'M6',
      '23Z95',
      '27Z100',
      '30Z110',
      '23P090',
      '0.23 mm HI-B',
      '0.27 mm HI-B'
    ],
    specifications: [
      'Thickness: 0.23 mm - 0.35 mm',
      'Core Loss (P1.7/50): 0.9 - 1.8 W/kg',
      'Magnetic Induction (B800): Typically >1.8 Tesla',
      'Grain Orientation: Highly uniform'
    ],
    standards: [
      'ASTM A876',
      'IS 3024',
      'IEC 60404-8-7',
      'JIS C2553',
      'EN 10107'
    ],
    hsnCodes: ['72251100', '72261100'],
    orderSizes: '1 MT - 100 MT',
    importCountries: [
      'Japan',
      'South Korea',
      'USA',
      'Germany',
      'China',
      'Russia',
      'Austria'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹300 - ₹550 per kg',
    applications: [
      'Power transformer cores',
      'Distribution transformer cores',
      'High-efficiency chokes',
      'Large industrial motors',
      'Generator laminations',
      'Rectifier cores'
    ],
    challenges: [
      'High manufacturing complexity and cost',
      'Limited global production capacity',
      'Susceptibility to performance degradation from improper handling and fabrication'
    ],
    marketTrend: 'The CRGO steel market is experiencing strong demand from the power sector, driven by expansion of electricity grids and emphasis on energy-efficient transformers. Indian government\'s impetus on \'Power for All\' and \'National Smart Grid Mission\' directly translates into increased need for CRGO. Domestic production capacity is growing but still relies on significant imports.'
  },
  {
    slug: 'crngo-cold-rolled-non-grain-oriented-steel-india',
    name: 'CRNGO (Cold Rolled Non-Grain Oriented) Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'CRNGO steel is a type of electrical steel characterized by its non-oriented magnetic properties, meaning the magnetic grains are randomly distributed. It is produced through cold rolling and annealing, but without the specific grain-orientation process. While offering lower magnetic permeability and higher core losses compared to CRGO, it provides isotropic magnetic properties, making it suitable for applications where magnetic flux operates in multiple directions. CRNGO is often more cost-effective and easier to process.',
    industries: [
      'Electric Motors',
      'Generators',
      'Ballasts',
      'Small Transformers',
      'Home Appliances',
      'Automotive (EV motors)'
    ],
    grades: [
      'M15 (ASTM A677)',
      'M19 (ASTM A677)',
      'M27 (ASTM A677)',
      'M36 (ASTM A677)',
      '50C400 (IEC 60404-8-8)',
      '65C500 (IEC 60404-8-8)',
      '800-50A (JIS C2552)',
      'CRNO 470',
      'CRNO 600',
      'CRNO 500'
    ],
    specifications: [
      'Thickness: 0.35 mm - 1.0 mm',
      'Core Loss (P1.5/50): 3.0 - 10.0 W/kg',
      'Magnetic Induction (B50): 1.5 - 1.7 Tesla',
      'Silicon Content: 0.5% - 3.5%'
    ],
    standards: [
      'ASTM A677',
      'IS 648',
      'IEC 60404-8-8',
      'JIS C2552',
      'DIN EN 10106'
    ],
    hsnCodes: ['72251900', '72261900'],
    orderSizes: '5 MT - 150 MT',
    importCountries: [
      'China',
      'South Korea',
      'Taiwan',
      'Japan',
      'Germany',
      'USA',
      'Brazil'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹80 - ₹180 per kg',
    applications: [
      'Electric motor laminations',
      'Generator cores',
      'Ballast cores',
      'Small power transformers',
      'Relay cores',
      'Home appliance motors'
    ],
    challenges: [
      'Balancing magnetic performance with cost-effectiveness',
      'Availability of consistent quality raw materials (hot rolled coils)',
      'Competition from imported material from larger production hubs'
    ],
    marketTrend: 'The CRNGO steel market is experiencing consistent growth, largely fueled by aggressive growth in the electric motor and domestic appliance sectors. The government’s Production Linked Incentive (PLI) schemes for manufacturing and increased focus on efficient electrical machinery under \'Atmanirbhar Bharat\' are significant drivers for indigenous consumption. The burgeoning EV sector is also a strong emerging demand source.'
  },
  {
    slug: 'silicon-steel-india',
    name: 'Silicon Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Silicon steel, also known as electrical steel, is a soft magnetic alloy primarily composed of iron with silicon content ranging from 0.5% to 6.5%. Its key characteristics include high magnetic permeability, low core loss (hysteresis and eddy current losses), and high electrical resistivity. These properties make it ideal for applications involving alternating magnetic fields, where energy efficiency and minimal heat generation are crucial.',
    industries: [
      'Power Generation',
      'Electrical Transformers',
      'Electric Motors',
      'Electronics',
      'Renewable Energy',
      'Automotive'
    ],
    grades: [
      'M3',
      'M4',
      'M5',
      'M6',
      '35W230',
      '27G135',
      'IS 648:2006',
      'ASTM A677',
      'ASTM A876',
      'IS 3024:2006'
    ],
    specifications: [
      'Silicon Content: 0.5-6.5%',
      'Thickness: 0.23-0.65 mm',
      'Core Loss: 0.9-2.5 W/kg (at 1.5T, 50Hz)',
      'Permeability: 5000-20000 µH/m',
      'Yield Strength: 250-450 MPa'
    ],
    standards: [
      'IS 648:2006',
      'ASTM A677',
      'ASTM A876',
      'IEC 60404-8-7',
      'JIS C2550'
    ],
    hsnCodes: ['7225.11', '7226.11'],
    orderSizes: '5-500 MT',
    importCountries: [
      'South Korea',
      'Japan',
      'China',
      'Germany',
      'USA',
      'Taiwan',
      'Russia'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹150-350 per kg',
    applications: [
      'Transformer Cores',
      'Electric Motor Laminations',
      'Generator Stator Cores',
      'Inductors',
      'Relays',
      'Magnetic Shields'
    ],
    challenges: [
      'Raw material price volatility affecting cost.',
      'Ensuring consistent magnetic properties across batches.',
      'High import dependence for specialized grades.',
      'Energy-intensive manufacturing process.'
    ],
    marketTrend: 'Demand for silicon steel is rising due to increased focus on energy efficiency in electrical equipment and the growth of renewable energy infrastructure. Government initiatives like the PLI scheme for electronics and electrical goods are further boosting domestic manufacturing and consumption, driving innovation in advanced grades.'
  },
  {
    slug: 'transformer-grade-steel-india',
    name: 'Transformer Grade Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Transformer grade steel, a specific type of silicon steel, is engineered for optimal performance in power transformers. It is characterized by extremely low core losses, high magnetic saturation, and excellent permeability, crucial for efficient energy conversion and minimal heat generation. These properties are achieved through precise control of silicon content, grain orientation (for grain-oriented electrical steel - GOES), and advanced processing techniques.',
    industries: [
      'Power Transmission & Distribution',
      'Electrical Transformers',
      'Power Generation',
      'Renewable Energy',
      'Railways'
    ],
    grades: [
      '23ZDMH',
      '27ZDMH',
      '30Q120',
      '20P085',
      'CRGO M4',
      'CRGO M5',
      'IS 3024:2006',
      'ASTM A876',
      'IS 648:2006 (GOES)',
      'BIS 1060 (Part 1):1994'
    ],
    specifications: [
      'Silicon Content: 2.8-3.5%',
      'Thickness: 0.23-0.35 mm',
      'Core Loss: 0.8-1.5 W/kg (at 1.7T, 50Hz)',
      'Magnetic Induction: 1.7-1.9 Tesla',
      'Grain Orientation: Highly Preferred'
    ],
    standards: [
      'IS 3024:2006',
      'ASTM A876',
      'IEC 60404-8-7',
      'JIS C2550',
      'BIS 1060'
    ],
    hsnCodes: ['7225.11', '7226.11'],
    orderSizes: '10-1000 MT',
    importCountries: [
      'Japan',
      'South Korea',
      'Germany',
      'USA',
      'China',
      'Russia',
      'France'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹200-450 per kg',
    applications: [
      'Power Transformer Cores',
      'Distribution Transformer Cores',
      'Voltage Regulators',
      'Current Transformers',
      'Reactors',
      'Inductive Devices'
    ],
    challenges: [
      'High cost due to specialized manufacturing processes.',
      'Limited domestic production of high-grade CRGO.',
      'Vulnerability to global supply chain disruptions.',
      'Need for advanced magnetic property testing facilities.'
    ],
    marketTrend: 'The expansion of India\'s power grid, driven by increasing electricity demand and Smart Cities Mission, fuels demand for transformer grade steel. Policy support for local manufacturing of transformers and a push for energy-efficient products are creating a robust market, despite significant reliance on imported high-grade materials.'
  },
  {
    slug: 'motor-grade-steel-india',
    name: 'Motor Grade Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Motor grade steel, also known as non-grain oriented electrical steel (NGOES), is an iron-silicon alloy specifically designed for electric motors and generators. Unlike GOES, it exhibits isotropic magnetic properties, meaning its magnetic characteristics are uniform in all directions, which is beneficial for rotating magnetic fields. It offers good magnetic permeability and relatively low core losses, contributing to motor efficiency and reduced power consumption.',
    industries: [
      'Electric Motors',
      'Automotive',
      'Appliances',
      'Industrial Machinery',
      'HVAC',
      'Consumer Electronics'
    ],
    grades: [
      '50CS1300',
      '65CS650',
      '80CS550',
      'NO20',
      'NO27',
      'NO35',
      'BIS 1060 (Part 2):1994',
      'ASTM A677',
      'IS 3024:2006 (NGOES)',
      'EN 10106'
    ],
    specifications: [
      'Silicon Content: 0.5-3.0%',
      'Thickness: 0.35-0.65 mm',
      'Core Loss: 2.0-6.0 W/kg (at 1.5T, 50Hz)',
      'Tensile Strength: 300-500 MPa',
      'Surface Insulation: C3 to C6 Coating'
    ],
    standards: [
      'IS 3024:2006',
      'ASTM A677',
      'IEC 60404-8-2',
      'JIS C2552',
      'BIS 1060'
    ],
    hsnCodes: ['7225.19', '7226.19'],
    orderSizes: '10-200 MT',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Germany',
      'Taiwan',
      'Russia',
      'France'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹120-280 per kg',
    applications: [
      'Motor Stators',
      'Motor Rotors',
      'Generators',
      'Ballasts',
      'Small Transformers',
      'Relays'
    ],
    challenges: [
      'Demand for higher performance grades for EV motors.',
      'Balancing cost and quality for diverse motor applications.',
      'Compliance with stringent energy efficiency norms.',
      'Availability of advanced coating technologies.'
    ],
    marketTrend: 'The burgeoning electric vehicle (EV) sector and the \'Make in India\' initiative are significant drivers for motor grade steel. The shift towards energy-efficient appliances and industrial motors also boosts demand, pushing for continuous improvement in magnetic properties and surface finishes to reduce energy consumption.'
  },
  {
    slug: 'steel-sheets-india',
    name: 'Steel Sheets',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Steel sheets are flat, thin pieces of steel, typically produced through hot rolling or cold rolling processes, forming various thicknesses and finishes. They are a fundamental material in manufacturing, offering high strength, formability, and versatility. Available in numerous grades, such as mild steel, high-strength low-alloy (HSLA) steel, and stainless steel, they cater to a vast array of structural, automotive, and appliance applications.',
    industries: [
      'Automotive',
      'Construction',
      'Appliances',
      'Fabrication',
      'Shipbuilding',
      'Industrial Equipment'
    ],
    grades: [
      'IS 2062 E250',
      'IS 2062 E350',
      'ASTM A36',
      'JIS G3101 SS400',
      'EN 10025 S235JR',
      'SAE 1008',
      'IS 513',
      'ASTM A1008',
      'CRCA Commercial Grade'
    ],
    specifications: [
      'Thickness: 0.3-50 mm',
      'Width: 600-2500 mm',
      'Length: Coil or cut-to-length 1000-12000 mm',
      'Yield Strength: 250-700 MPa',
      'Tensile Strength: 400-850 MPa'
    ],
    standards: [
      'IS 2062',
      'IS 513',
      'ASTM A36',
      'JIS G3101',
      'EN 10025'
    ],
    hsnCodes: ['7208.51', '7209.16'],
    orderSizes: '1-1000 MT',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Russia',
      'Taiwan',
      'Germany',
      'Vietnam'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹60-120 per kg',
    applications: [
      'Car Body Panels',
      'Structural Components',
      'Refrigerators',
      'Washing Machines',
      'Storage Tanks',
      'Ductwork'
    ],
    challenges: [
      'Fluctuations in coking coal and iron ore prices.',
      'Managing complex inventory for diverse grades and sizes.',
      'Meeting stringent quality requirements for automotive sector.',
      'Competition from imported cheaper alternatives.'
    ],
    marketTrend: 'The infrastructure push under the National Infrastructure Pipeline (NIP) and growth in the automotive sector are key drivers. Demand for pre-coated and highly formable steel sheets is increasing, driven by aesthetic and functional requirements, alongside a strong emphasis on domestic production and quality control.'
  },
  {
    slug: 'steel-bars-rods-india',
    name: 'Steel Bars & Rods',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Steel bars and rods are essential long steel products, typically solid, with various cross-sectional shapes (round, square, flat, hexagonal). They are manufactured by hot rolling or cold drawing steel billets. These products provide structural integrity, mechanical strength, and reinforcement, making them indispensable in construction, manufacturing, and engineering applications. They come in plain, deformed, or threaded forms depending on the intended use.',
    industries: [
      'Construction',
      'Infrastructure',
      'Manufacturing',
      'Automotive',
      'Forging',
      'Fasteners'
    ],
    grades: [
      'IS 1786 Fe 500D',
      'IS 1786 Fe 550D',
      'ASTM A615 Grade 60',
      'SAE 1018',
      'SAE 1045',
      'EN 10025 S355',
      'IS 2062 E250',
      'BIS 2830',
      'BIS 432 (Part-1)'
    ],
    specifications: [
      'Diameter: 6-100 mm',
      'Length: 6-12 meters (standard)',
      'Yield Strength: 415-600 MPa',
      'Tensile Strength: 500-700 MPa',
      'Elongation: 12-18%'
    ],
    standards: [
      'IS 1786',
      'IS 2062',
      'ASTM A615',
      'JIS G3112',
      'EN 10025'
    ],
    hsnCodes: ['7214.20', '7214.99'],
    orderSizes: '1-500 MT',
    importCountries: [
      'China',
      'Japan',
      'Russia',
      'Turkey',
      'South Korea',
      'Ukraine',
      'Vietnam'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹55-90 per kg',
    applications: [
      'Reinforcement in Concrete (Rebars)',
      'Structural Frameworks',
      'Machined Components',
      'Fasteners (Bolts, Nuts)',
      'Automotive Parts',
      'Grating and Fencing'
    ],
    challenges: [
      'Price fluctuations due to raw material costs and demand-supply.',
      'Logistical challenges for heavy and long products.',
      'Meeting strict quality and testing requirements for infrastructure.',
      'Competition from unorganized sector in smaller grades.'
    ],
    marketTrend: 'India\'s booming construction and infrastructure sectors, spurred by government projects like the Pradhan Mantri Awas Yojana and NIP, are driving strong demand. There\'s a growing preference for higher grade (Fe550D, Fe600) seismic-resistant rebars, pushing manufacturers towards advanced thermomechanical treatment (TMT) processes.'
  },
  {
    slug: 'iron-castings-india',
    name: 'Iron Castings',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Iron castings are metal objects produced by pouring molten iron into a mold, allowing it to solidify into a desired shape. This manufacturing process allows for complex geometries and produces parts with excellent compressive strength, good wear resistance, and damping properties. Common types include grey iron, ductile iron, and malleable iron, each offering specific mechanical properties suitable for diverse engineering applications.',
    industries: [
      'Automotive',
      'Heavy Machinery',
      'Pumps & Valves',
      'Railways',
      'Agrícultura',
      'Construction'
    ],
    grades: [
      'IS 210 FG 200',
      'IS 210 FG 250',
      'IS 1865 SG 400/15',
      'IS 1865 SG 500/7',
      'ASTM A48 Class 30',
      'ASTM A536 Grade 60-40-18',
      'EN 1561 EN-GJL-250',
      'EN 1563 EN-GJS-500-7'
    ],
    specifications: [
      'Tensile Strength: 200-700 MPa',
      'Hardness: 180-250 BHN',
      'Elongation: 0.5-22% (Ductile Iron)',
      'Wall Thickness: 3-50 mm',
      'Weight: 0.1 kg - 10 MT'
    ],
    standards: [
      'IS 210',
      'IS 1865',
      'ASTM A48',
      'ASTM A536',
      'EN 1561'
    ],
    hsnCodes: ['7325.10', '7325.99'],
    orderSizes: '0.1 kg - 100 MT (per order)',
    importCountries: [
      'China',
      'Germany',
      'USA',
      'Japan',
      'Italy',
      'Turkey',
      'South Korea'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹80-250 per kg',
    applications: [
      'Engine Blocks',
      'Gearboxes',
      'Pump Casings',
      'Valve Bodies',
      'Manhole Covers',
      'Brake Drums'
    ],
    challenges: [
      'Maintaining dimensional accuracy and surface finish.',
      'Controlling metallurgical properties for specific applications.',
      'High energy consumption in foundry operations.',
      'Environmental compliance for emissions and waste management.'
    ],
    marketTrend: 'The \'Make in India\' initiative and growth in the automotive, agricultural, and infrastructure sectors are sustaining demand for iron castings. Automation in foundries and a shift towards precision castings with improved mechanical properties are key trends. The demand for lightweight and higher-strength ductile iron castings is particularly robust.'
  },
  {
    slug: 'alloy-steel-india',
    name: 'Alloy Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Alloy steel is a type of steel that is alloyed with a variety of elements, such as manganese, nickel, chromium, molybdenum, vanadium, silicon, and boron, in total amounts between 1.0% and 50% by weight. These alloying elements modify the steel\'s properties, enhancing strength, hardness, wear resistance, toughness, and corrosion resistance beyond what can be achieved with plain carbon steel. The specific choice of alloying elements dictates its final application.',
    industries: [
      'Automotive',
      'Aerospace',
      'Oil & Gas',
      'Tooling',
      'Defense',
      'Heavy Engineering'
    ],
    grades: [
      'AISI 4140',
      'AISI 4340',
      'EN 19 (50CrV4)',
      'EN 24 (34CrNiMo6)',
      'IS 1570 (Part 5) 40Cr1',
      'IS 1570 (Part 5) 30Mn2',
      'ASTM A335 P11',
      'JIS SCM440'
    ],
    specifications: [
      'Tensile Strength: 700-1500 MPa',
      'Hardness: 200-600 HB',
      'Impact Strength: 50-150 J',
      'Corrosion Resistance: Improved',
      'Heat Treatment Response: Excellent'
    ],
    standards: [
      'AISI/SAE',
      'ASTM',
      'EN',
      'JIS',
      'IS 1570'
    ],
    hsnCodes: ['7225.40', '7228.30'],
    orderSizes: '1-200 MT',
    importCountries: [
      'China',
      'Japan',
      'Germany',
      'USA',
      'South Korea',
      'Sweden',
      'France'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹120-400 per kg',
    applications: [
      'Gears',
      'Shafts',
      'Connecting Rods',
      'High-Pressure Pipes',
      'Aircraft Landing Gear',
      'Cutting Tools'
    ],
    challenges: [
      'Precise control over alloying element compositions.',
      'Complex heat treatment processes required.',
      'High raw material costs (e.g., nickel, molybdenum).',
      'Difficulty in machining higher strength grades.'
    ],
    marketTrend: 'The demand for high-performance alloy steels is increasing, driven by sectors like defense, aerospace, and energy infrastructure. Indigenous manufacturing under initiatives like \'Atmanirbhar Bharat\' is promoting domestic production, while continuous research focuses on developing new grades with improved properties for critical applications.'
  },
  {
    slug: 'tool-steel-india',
    name: 'Tool Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Tool steels are a group of alloy steels specifically designed for manufacturing tools, dies, and molds, often subjected to extreme conditions. They are characterized by exceptional hardness, wear resistance, toughness, and often the ability to retain these properties at elevated temperatures (hot hardness). Their performance is highly dependent on their specific chemical composition and meticulous heat treatment processes.',
    industries: [
      'Die & Mold Manufacturing',
      'Automotive',
      'Metalworking',
      'Plastics Processing',
      'Forging',
      'Medical'
    ],
    grades: [
      'D2 (High Carbon, High Chromium)',
      'H13 (Hot Work)',
      'M2 (High Speed Steel)',
      'P20 (Plastic Mold)',
      'O1 (Oil Hardening)',
      'AISI S7 (Shock Resisting)',
      'IS 10795 SKD11',
      'IS 10795 SKH9'
    ],
    specifications: [
      'Hardness: 58-65 HRC (after heat treat)',
      'Wear Resistance: High',
      'Toughness: Good to Excellent',
      'Hot Hardness: Up to 600°C',
      'Compressive Strength: 2000-3000 MPa'
    ],
    standards: [
      'AISI/SAE',
      'ASTM A681',
      'DIN EN ISO 4957',
      'JIS G4404',
      'IS 10795'
    ],
    hsnCodes: ['7228.30', '7228.40'],
    orderSizes: '0.1-50 MT',
    importCountries: [
      'Germany',
      'Sweden',
      'Japan',
      'USA',
      'Austria',
      'China',
      'Czech Republic'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹300-1500 per kg',
    applications: [
      'Cutting Tools (Drills, Mills)',
      'Forging Dies',
      'Plastic Molds',
      'Punching Dies',
      'Extrusion Dies',
      'Hot Work Tooling'
    ],
    challenges: [
      'Extreme sensitivity to heat treatment parameters.',
      'High material cost for specialized grades.',
      'Demand for complex geometries requiring advanced machining.',
      'Global competition in tool and die manufacturing.'
    ],
    marketTrend: 'Growth in the Indian manufacturing sector, particularly automotive and capital goods, is driving the demand for specialized tool steels. Emphasis on precision and high-performance tooling for new product development, coupled with a push for \'Make in India\' in defense and aerospace, is fostering domestic expertise and utilization.'
  },
  {
    slug: 'scrap-india',
    name: 'Scrap',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Scrap refers to discarded or reclaimed metallic materials that are reprocessed from end-of-life products or manufacturing waste. It serves as a crucial secondary raw material for steelmaking and casting, significantly reducing the need for virgin iron ore, coking coal, and energy. Ferrous scrap, primarily iron and steel, is categorized by type (e.g., heavy melting scrap, turning, shredded) and purity, directly impacting its value and application.',
    industries: [
      'Steel Mills',
      'Foundries',
      'Recycling Industry',
      'Shipbreaking',
      'Automotive Recycling',
      'Construction Demolition'
    ],
    grades: [
      'HMS 1 (Heavy Melting Scrap)',
      'HMS 2 (Heavy Melting Scrap)',
      'Shredded Scrap ISRI 210-211',
      'P&S (Plates & Structurals)',
      'Busheling (Bale of new production steel)',
      'Cast Iron Scrap',
      'Turnings (Machine shop waste)',
      'IS 11847 Part 2'
    ],
    specifications: [
      'Density: 0.5-1.5 MT/m³ (depending on type)',
      'Contamination Level: <0.5% non-metallic',
      'Nickel Content: <0.1% (for carbon steel applications)',
      'Copper Content: <0.2% (critical for quality)',
      'Size: Defined by grade (e.g., 50x50 cm max for HMS)'
    ],
    standards: [
      'ISRI (Institute of Scrap Recycling Industries)',
      'IS 11847',
      'ASTM E1506',
      'Bureau of Indian Standards norms'
    ],
    hsnCodes: ['7204.41', '7204.49'],
    orderSizes: '1-10,000 MT',
    importCountries: [
      'USA',
      'UK',
      'UAE',
      'Netherlands',
      'Japan',
      'Australia',
      'Canada'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹35-45 per kg',
    applications: [
      'Electric Arc Furnace (EAF) Steelmaking',
      'Induction Furnace Steelmaking',
      'Foundry Remelting',
      'Blast Furnace Charge (minor component)'
    ],
    challenges: [
      'Price volatility influenced by global supply and demand.',
      'Quality and contamination control of purchased scrap.',
      'Logistical costs for collection and transport.',
      'Compliance with environmental regulations for processing.'
    ],
    marketTrend: 'India is a net importer of ferrous scrap, with growing demand from EAF and induction furnaces. The government\'s National Steel Policy aims to increase scrap usage to promote sustainability and reduce carbon footprint. The development of organized scrap collection and processing centers is a major trend.'
  },
  {
    slug: 'iron-ore-india',
    name: 'Iron Ore',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Iron ore is a mineral rock from which metallic iron can be economically extracted. It is the primary raw material for steel production globally, typically containing iron oxides like hematite (Fe2O3) or magnetite (Fe3O4). The quality of iron ore is determined by its iron content, gangue minerals, and impurity levels, which directly influence the steelmaking process and the final properties of the steel produced.',
    industries: [
      'Steel Production',
      'Pig Iron Manufacturing',
      'Direct Reduced Iron (DRI) Production',
      'Foundries'
    ],
    grades: [
      'Fines (Fe 60-63%)',
      'Lumps (Fe 63-65%)',
      'Pellets (Fe 65% +)',
      'Sinter Feed',
      'Hematite Ore',
      'Magnetite Ore',
      'IS 10022',
      'IS 14811'
    ],
    specifications: [
      'Iron Content (Fe): 58-68%',
      'Silica (SiO2): 2-8%',
      'Alumina (Al2O3): 1-5%',
      'Phosphorus (P): 0.05-0.15%',
      'Sulphur (S): <0.05%',
      'Moisture: 2-10%'
    ],
    standards: [
      'IS 10022',
      'IS 14811',
      'ISO 3081',
      'ASTM E246',
      'National Mineral Policy (India)'
    ],
    hsnCodes: ['2601.11', '2601.12'],
    orderSizes: '1,000-100,000 MT',
    importCountries: [
      'Australia',
      'Brazil',
      'South Africa',
      'Canada',
      'Ukraine',
      'Russia',
      'Sweden'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹7,000-12,000 per MT (FOB price variable)',
    applications: [
      'Blast Furnace Feedstock',
      'Direct Reduced Iron (DRI) Plants',
      'Sintering Plants',
      'Pellet Plants',
      'Pig Iron Production'
    ],
    challenges: [
      'Global price volatility and geopolitical factors.',
      'Environmental impact of mining and refining.',
      'Logistical hurdles for bulk transport (rail, sea).',
      'Fluctuating domestic demand tied to steel industry cycles.'
    ],
    marketTrend: 'India is a major producer and consumer of iron ore. The National Steel Policy aims to increase steel production, thereby driving sustained demand for iron ore. There\'s a growing emphasis on value addition through pelletization and beneficiation to use lower-grade fines and improve blast furnace efficiency.'
  },
  {
    slug: 'ht-strands-india',
    name: 'HT Strands',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'High Tensile (HT) Strands are high-strength steel wires twisted together to form a strand, primarily used as prestressing tendons in concrete structures. They exhibit excellent tensile strength and fatigue resistance, essential for applications requiring durable and crack-resistant concrete. The manufacturing process involves cold drawing and stress-relieving to achieve the desired mechanical properties and maintain dimensional stability under load.',
    industries: [
      'Construction',
      'Infrastructure Development',
      'Precast Concrete Manufacturing',
      'Bridge Building',
      'Nuclear Power Plants',
      'Hydroelectric Projects'
    ],
    grades: [
      'IS 14268 Part 2: 1995 Grade 1770',
      'IS 14268 Part 2: 1995 Grade 1960',
      'ASTM A416/A416M Grade 250K',
      'ASTM A416/A416M Grade 270K',
      'EN 10138-3 Class 1770',
      'EN 10138-3 Class 1860'
    ],
    specifications: [
      'Nominal Diameter: 9.3mm - 18.0mm',
      'Tensile Strength: 1770 MPa - 1960 MPa',
      'Elongation at Break: 3.5% - 5.0%',
      'Minimum Breaking Load: 90 KN - 300 KN',
      'Relaxation at 1000 hours: Max 2.5%'
    ],
    standards: [
      'IS 14268',
      'ASTM A416/A416M',
      'EN 10138-3',
      'BS 5896',
      'ISO 6934-2'
    ],
    hsnCodes: ['73121010'],
    orderSizes: '1 MT - 1000 MT',
    importCountries: [
      'China',
      'South Korea',
      'Germany',
      'Japan',
      'Belgium',
      'Turkey',
      'France'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹80,000 - ₹120,000 per MT',
    applications: [
      'Prestressed Concrete Bridges',
      'Precast Girders',
      'High-rise Building Slabs',
      'Containment Structures for Nuclear Power',
      'Railway Sleepers',
      'Silos and Storage Tanks'
    ],
    challenges: [
      'Fluctuations in raw material (wire rod) prices',
      'Maintaining consistent quality and high tensile strength',
      'Logistical challenges for large coil deliveries',
      'Intense competition from domestic and international suppliers'
    ],
    marketTrend: 'The demand for HT strands is being driven by significant infrastructure development projects in India, including new expressways, railway networks, and smart city initiatives. Government push through policies like the National Infrastructure Pipeline is fostering investment. Manufacturers are focusing on advanced manufacturing techniques to meet stringent quality and performance requirements.'
  },
  {
    slug: 'lrpc-india',
    name: 'LRPC',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Low Relaxation Prestressed Concrete (LRPC) strands are high-strength steel strands specifically engineered for prestressing concrete elements. They are characterized by their minimal stress relaxation over time, ensuring sustained prestressing forces in civil structures. The low relaxation property, achieved through specific thermal treatment processes, enhances the longevity and structural integrity of prestressed concrete components by reducing long-term prestress losses.',
    industries: [
      'Construction',
      'Infrastructure',
      'Precast Manufacturing',
      'Road and Bridge Building',
      'Railway Infrastructure',
      'Real Estate'
    ],
    grades: [
      'IS 14268 Grade 270K',
      'ASTM A416/A416M Grade 270K',
      'BS EN 10138-3:2009 LR',
      'AS/NZS 4672:2006 LR',
      'JIS G3137 SWPR7LR Type A',
      'ISO 6934-2 Grade 270K'
    ],
    specifications: [
      'Nominal Diameter: 9.3mm - 15.7mm',
      'Tensile Strength: 1860 MPa - 1960 MPa',
      'Relaxation at 1000 hours: Max 2.5%',
      '0.2% Proof Stress: Min 90% of UTS',
      'Elongation at Break: Min 3.5%'
    ],
    standards: [
      'IS 14268',
      'ASTM A416/A416M',
      'EN 10138-3',
      'BS 5896',
      'JIS G3536'
    ],
    hsnCodes: ['73121010'],
    orderSizes: '5 MT - 750 MT',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Taiwan',
      'Belgium',
      'Germany',
      'Vietnam'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹85,000 - ₹125,000 per MT',
    applications: [
      'Long Span Bridges',
      'Pre-tensioned Girders',
      'Post-tensioned Slabs',
      'Concrete Railway Sleepers',
      'Large Storage Silos',
      'Nuclear Reactor Structures'
    ],
    challenges: [
      'Strict quality control for relaxation properties',
      'High capital investment for sophisticated manufacturing lines',
      'Impact of global steel price volatility on production costs',
      'Need for specialized testing and certification processes'
    ],
    marketTrend: 'The LRPC strand market in India is expanding due to increased adoption in large-scale infrastructure projects requiring durable and long-lasting concrete solutions. Government initiatives like the \'Housing for All\' scheme and dedicated freight corridors are boosting demand. The PLI scheme for specialty steel production could further support domestic manufacturing capabilities, reducing reliance on imports.'
  },
  {
    slug: 'pc-strand-india',
    name: 'PC Strand',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'PC (Prestressed Concrete) Strand refers to high-strength steel wires twisted into a helical shape, designed to impart compressive stresses into concrete members. This prestressing enhances the concrete\'s load-carrying capacity and prevents cracking, leading to more efficient and durable structures. The high tensile strength and controlled elongation properties are critical for maintaining the intended prestressing force throughout the structure\'s service life, making it a fundamental component in modern construction.',
    industries: [
      'Construction',
      'Civil Engineering',
      'Building Materials',
      'Infrastructure Development',
      'Road Construction',
      'Precast Industry'
    ],
    grades: [
      'IS 14268 Part 2: 1995 Grade 1770',
      'IS 14268 Part 2: 1995 Grade 1960',
      'ASTM A416/A416M Grade 270',
      'BS 5896:1980 Type 2',
      'EN 10138-3 Class 1860',
      'JIS G3137 SWPR7A'
    ],
    specifications: [
      'Nominal Diameter: 9.3mm - 15.2mm',
      'Characteristic Tensile Strength: 1770 MPa - 1960 MPa',
      'Minimum Breaking Load: 90 kN - 260 kN',
      'Elongation at Failure: Min 3.5%',
      'Relaxation at 1000 hours: Max 2.5% (Low Relaxation)'
    ],
    standards: [
      'IS 14268',
      'ASTM A416/A416M',
      'EN 10138',
      'BS 5896',
      'ISO 6934'
    ],
    hsnCodes: ['73121010', '73121090'],
    orderSizes: '3 MT - 800 MT',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Germany',
      'Taiwan',
      'Belgium',
      'Thailand'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹78,000 - ₹120,000 per MT',
    applications: [
      'Prestressed Concrete Sleepers',
      'Precast Concrete Pipes',
      'Building Slabs and Beams',
      'Bridge Girders',
      'Ground Anchors',
      'Post-tensioned Floor Systems'
    ],
    challenges: [
      'Ensuring uniform properties across long lengths',
      'Protection from corrosion during transport and storage',
      'High setup costs for specialized drawing and stranding machinery',
      'Adherence to strict national and international quality norms'
    ],
    marketTrend: 'The PC strand market in India is experiencing robust growth driven by the government\'s ambitious infrastructure development agenda, including major investments in roadways, urban infrastructure, and affordable housing. Growing urbanization and the adoption of advanced construction techniques are sustaining demand. Increased use in precast concrete elements contributes significantly to this trend.'
  },
  {
    slug: 'prestressing-steel-india',
    name: 'Prestressing Steel',
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: 'Prestressing steel encompasses high-strength steel wires, bars, or strands used to induce compressive stress in concrete structures prior to their service load application. This technique, known as prestressing, significantly improves the concrete\'s resistance to tensile forces, reduces cracking, and enhances its overall structural performance and durability. The specific metallurgy and manufacturing processes ensure high tensile strength, excellent fatigue resistance, and controlled relaxation characteristics.',
    industries: [
      'Construction',
      'Infrastructure',
      'Civil Engineering',
      'Precast Concrete',
      'Transportation',
      'Energy Sector'
    ],
    grades: [
      'IS 14268 Part 2:1995 (for strands)',
      'IS 13620 (for indented wires)',
      'ASTM A722/A722M (for bars)',
      'ASTM A421/A421M (for wires)',
      'EN 10138 (for wires, bars, strands)',
      'JIS G3109 (for wires)'
    ],
    specifications: [
      'Nominal Diameter: 5mm (wire) - 36mm (bar)',
      'Characteristic Tensile Strength: 1470 MPa - 1960 MPa',
      '0.1% or 0.2% Proof Stress: Min 80% - 90% of UTS',
      'Breaking Elongation: Min 3% - 8%',
      'Relaxation at 1000 hours: Max 2.5% (for LR types)'
    ],
    standards: [
      'IS 14268',
      'ASTM A416/A416M',
      'EN 10138',
      'BS 5896',
      'ISO 6934',
      'IS 13620'
    ],
    hsnCodes: ['72292000', '73121010'],
    orderSizes: '2 MT - 1200 MT',
    importCountries: [
      'China',
      'Germany',
      'South Korea',
      'Japan',
      'Italy',
      'France',
      'Spain'
    ],
    relatedSlugs: [
      'foundry-grade-pig-iron-india',
      'cold-rolled-gp-sheets-india',
      'cold-rolled-annealed-coils-india',
      'full-hard-cold-rolled-coils-india',
      'hr-plates-india'
    ],
    priceRange: '₹75,000 - ₹150,000 per MT',
    applications: [
      'Prestressed Concrete Bridges',
      'High-rise Building Foundations',
      'Nuclear Power Plant Containment Vessels',
      'Precast Concrete Elements',
      'Railway Sleepers',
      'Dams and Port Structures'
    ],
    challenges: [
      'Corrosion susceptibility if not properly protected',
      'Precise installation and tensioning procedures required',
      'Maintaining ductility and strength throughout production',
      'Compliance with varying global engineering specifications'
    ],
    marketTrend: 'The market for prestressing steel in India is significantly influenced by government policies aimed at boosting infrastructure and urban development, such as the Smart Cities Mission and dedicated industrial corridors. The focus on constructing durable, long-life assets is increasing the adoption of prestressed concrete solutions. Growing awareness about cost-effectiveness and structural efficiency also contributes to its steady demand growth.'
  },
];

// ─── NON-FERROUS METALS ───
const nonFerrousNewProducts: DemandProduct[] = [
  {
    slug: 'copper-products-india',
    name: 'Copper Products',
    category: 'Metals - Non-Ferrous',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Copper products encompass a wide range of materials manufactured from pure copper or its alloys, known for their excellent electrical and thermal conductivity, corrosion resistance, and malleability. These products are processed into various forms such as sheets, plates, tubes, wires, and rods, catering to diverse industrial applications. Their high ductility allows for easy fabrication into complex shapes, making them indispensable in numerous sectors. The unparalled electrical conductivity of copper ensures efficient energy transmission.',
    industries: [
      'Electrical & Electronics',
      'Construction',
      'Automotive',
      'Renewable Energy',
      'Telecommunications',
      'Plumbing'
    ],
    grades: [
      'Electrolytic Tough Pitch (ETP) Copper C11000/CW004A',
      'Deoxidized High Phosphorus (DHP) Copper C12200/CW024A',
      'Oxygen-Free High Conductivity (OFHC) Copper C10200/CW008A',
      'C10100 (Oxygen-Free Electronic)',
      'IS 191 (Copper)',
      'IS 1897 (Wrought Copper and Copper Alloys)'
    ],
    specifications: [
      'Purity: 99.9% - 99.99%',
      'Electrical Conductivity: 95 - 101% IACS',
      'Tensile Strength: 200 - 400 MPa',
      'Hardness (HV): 40 - 120',
      'Density: 8.9 - 8.94 g/cm³'
    ],
    standards: [
      'ASTM B152 (Copper Sheet, Strip, Plate)',
      'ASTM B88 (Seamless Copper Water Tube)',
      'IS 191 (Specification for Copper)',
      'IS 613 (Copper Rods and Bars for Electrical Purposes)',
      'BIS IS 14003 (Copper and Copper Alloys - Terminology)'
    ],
    hsnCodes: ['7407', '7403'],
    orderSizes: '100 kg - 10000 MT',
    importCountries: [
      'Chile',
      'Australia',
      'Indonesia',
      'Japan',
      'Zambia',
      'Peru',
      'Congo'
    ],
    relatedSlugs: [
      'aluminium-products-india',
      'brass-products-india',
      'zinc-products-india',
      'lead-products-india',
      'titanium-products-india'
    ],
    priceRange: '₹650 - ₹950 per kg',
    applications: [
      'Electrical wiring and cables',
      'Heat exchangers and radiators',
      'Plumbing pipes and fittings',
      'Architectural cladding',
      'Busbars and connectors',
      'Printed Circuit Boards (PCBs)'
    ],
    challenges: [
      'Volatility in raw material prices',
      'Environmental regulations on mining and smelting',
      'Competition from alternative materials like aluminum for certain uses',
      'Ensuring sustainable sourcing practices'
    ],
    marketTrend: 'The demand for copper products in India is driven by infrastructure development under the Smart Cities Mission and increased adoption of electric vehicles, boosting the electrical and electronics sectors. India\'s emphasis on renewable energy projects, particularly solar, further escalates copper consumption for wiring and components. Government initiatives like the National Infrastructure Pipeline (NIP) also underpin sustained growth in demand across construction and power transmission.'
  },
  {
    slug: 'aluminium-products-india',
    name: 'Aluminium Products',
    category: 'Metals - Non-Ferrous',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Aluminium products refer to a diverse range of materials fabricated from aluminum, a lightweight, corrosion-resistant, and highly ductile metal. Available in various forms such as sheets, plates, extrusions, foils, and castings, these products leverage aluminum\'s high strength-to-weight ratio and excellent thermal conductivity. Its non-toxic nature and recyclability make it a preferred material in sustainable applications, offering versatility across numerous industrial and consumer-oriented sectors. The material\'s ease of alloying further extends its application spectrum.',
    industries: [
      'Automotive',
      'Aerospace',
      'Construction',
      'Packaging',
      'Electrical',
      'Consumer Goods'
    ],
    grades: [
      'Alloy 6061 (T6 Temper)',
      'Alloy 7075 (T6 Temper)',
      'Alloy 5083 (H116/H321 Temper)',
      'Alloy 1100',
      'IS 733 (Wrought Aluminium and Aluminium Alloy Bars, Rods and Sections)',
      'IS 737 (Wrought Aluminium and Aluminium Alloy Plate, Sheet and Strip)'
    ],
    specifications: [
      'Tensile Strength: 90 - 570 MPa',
      'Yield Strength: 35 - 500 MPa',
      'Elongation: 3 - 25%',
      'Density: 2.7 - 2.8 g/cm³',
      'Thermal Conductivity: 160 - 240 W/m.K'
    ],
    standards: [
      'ASTM B209 (Aluminum and Aluminum-Alloy Sheet and Plate)',
      'ASTM B221 (Aluminum and Aluminum-Alloy Extruded Bars, Rods, Wire, Shapes)',
      'IS 733 (Aluminium and Aluminium Alloy Bars, Rods and Sections)',
      'IS 737 (Aluminium and Aluminium Alloy Plate, Sheet and Strip)',
      'BIS IS 1285 (Wrought Aluminium and Aluminium Alloy Cold Rolled Plates Sheet and Strip)'
    ],
    hsnCodes: ['7606', '7604'],
    orderSizes: '50 kg - 5000 MT',
    importCountries: [
      'UAE',
      'China',
      'Bahrain',
      'Canada',
      'Russia',
      'Norway',
      'Australia'
    ],
    relatedSlugs: [
      'copper-products-india',
      'brass-products-india',
      'zinc-products-india',
      'lead-products-india',
      'titanium-products-india'
    ],
    priceRange: '₹200 - ₹450 per kg',
    applications: [
      'Aircraft structures',
      'Vehicle body panels and engine parts',
      'Window frames and architectural elements',
      'Food and beverage packaging',
      'Electrical conductors and busbars',
      'Heat sinks'
    ],
    challenges: [
      'High energy consumption in primary production',
      'Dependency on bauxite imports',
      'Competition from steel in certain construction applications',
      'Managing scrap collection and recycling efficiently'
    ],
    marketTrend: 'India\'s aluminium product market is driven by increasing demand in the automotive sector, especially with the push for lightweighting for fuel efficiency, and by a buoyant construction industry. Government initiatives like the \'Make in India\' campaign and the Production Linked Incentive (PLI) scheme for advanced chemistry cell batteries further stimulate demand within the electric vehicle ecosystem. The growth of smart cities also contributes to the use of aluminium in architectural and infrastructure projects.'
  },
  {
    slug: 'brass-products-india',
    name: 'Brass Products',
    category: 'Metals - Non-Ferrous',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Brass products are alloys primarily composed of copper and zinc, valued for their appealing golden-yellow appearance, machinability, and good corrosion resistance. The varied proportions of copper and zinc lead to different brass types, each with specific mechanical and physical properties. These products are extensively used in manufacturing components requiring fine detail, aesthetic appeal, and resistance to wear, finding applications in plumbing, electrical, and decorative industries. Their acoustic properties are also highly regarded.',
    industries: [
      'Plumbing & Sanitary',
      'Musical Instruments',
      'Electrical Appliances',
      'Decorative & Hardware',
      'Automotive',
      'Marine'
    ],
    grades: [
      'Cartridge Brass (70/30) C26000',
      'Yellow Brass (65/35) C27000',
      'Naval Brass (60/40) C46400',
      'Free-Machining Brass C36000',
      'IS 319 (Free Machining Brass Rods and Sections)',
      'IS 410 (Sheet and Strip for the Manufacture of Utensils)'
    ],
    specifications: [
      'Copper Content: 58 - 90%',
      'Zinc Content: 10 - 42%',
      'Tensile Strength: 300 - 600 MPa',
      'Hardness (HV): 80 - 150',
      'Density: 8.4 - 8.7 g/cm³'
    ],
    standards: [
      'ASTM B36 (Brass Plate, Sheet, Strip, and Rolled Bar)',
      'ASTM B135 (Seamless Brass Tube)',
      'IS 319 (Free Machining Brass Rods and Sections)',
      'IS 407 (Brass Ingots and Castings)',
      'BIS IS 1264 (Brass, Naval Brass & Leaded Naval Brass Bars for Machining)'
    ],
    hsnCodes: ['7409', '7407'],
    orderSizes: '50 kg - 500 MT',
    importCountries: [
      'Germany',
      'China',
      'USA',
      'South Korea',
      'UK',
      'Taiwan',
      'Italy'
    ],
    relatedSlugs: [
      'copper-products-india',
      'aluminium-products-india',
      'zinc-products-india',
      'lead-products-india',
      'titanium-products-india'
    ],
    priceRange: '₹450 - ₹750 per kg',
    applications: [
      'Plumbing fixtures and fittings',
      'Musical instruments (e.g., trumpets, trombones)',
      'Electrical connectors and switchgear',
      'Decorative hardware',
      'Fasteners and gears',
      'Ammunition casings'
    ],
    challenges: [
      'Fluctuations in copper and zinc prices',
      'Lead content restrictions in certain applications (e.g., potable water)',
      'Competition from other alloys for specific functions',
      'Ensuring consistent alloy composition for specialized uses'
    ],
    marketTrend: 'The market for brass products in India is steadily growing, driven by the expanding plumbing and sanitary ware industry, fueled by urbanization and housing projects. Demand also comes from the electrical sector for components and connectors. The \'Smart Cities\' initiative and the focus on improving domestic manufacturing capabilities are contributing factors to this stable market. However, price volatility of raw materials remains a concern for manufacturers.'
  },
  {
    slug: 'zinc-products-india',
    name: 'Zinc Products',
    category: 'Metals - Non-Ferrous',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Zinc products encompass materials made from elemental zinc or its alloys, primarily utilized for galvanizing, die-casting, and as a component in various alloys like brass. Known for its excellent corrosion resistance when applied as a coating and its low melting point, zinc is easily cast into complex shapes. It plays a critical role in protecting steel from rust and is essential in battery manufacturing. Its versatility makes it invaluable across heavy industries and consumer goods alike.',
    industries: [
      'Construction',
      'Automotive',
      'Battery Manufacturing',
      'Galvanizing',
      'Die-Casting',
      'Chemical'
    ],
    grades: [
      'Special High Grade (SHG) Zinc 99.995%',
      'High Grade (HG) Zinc 99.95%',
      'Prime Western (PW) Zinc 98.7%',
      'Zinc Die Casting Alloys (e.g., Zamak 3, Zamak 5)',
      'IS 4202 (Zinc Plate)',
      'IS 209 (Zinc Ingots for Galvanizing)'
    ],
    specifications: [
      'Purity: 98.7% - 99.995%',
      'Melting Point: 419.5 °C',
      'Boiling Point: 907 °C',
      'Density: 7.14 g/cm³',
      'Hardness (HV): 30 - 45'
    ],
    standards: [
      'ASTM B6 (Zinc)',
      'ASTM B86 (Zinc Alloy Die Castings)',
      'IS 209 (Zinc Ingots)',
      'IS 13229 (Zinc for Galvanizing)',
      'BIS IS 4933 (Zinc and Zinc Alloys - Terminology)'
    ],
    hsnCodes: ['7901', '7907'],
    orderSizes: '1 MT - 5000 MT',
    importCountries: [
      'Australia',
      'China',
      'Peru',
      'South Korea',
      'Kazakhstan',
      'Canada',
      'Netherlands'
    ],
    relatedSlugs: [
      'copper-products-india',
      'aluminium-products-india',
      'brass-products-india',
      'lead-products-india',
      'titanium-products-india'
    ],
    priceRange: '₹250 - ₹380 per kg',
    applications: [
      'Galvanized steel sheets and structures',
      'Die-cast components for automotive and appliances',
      'Alloying element in brass and bronze',
      'Zinc-carbon and alkaline batteries',
      'Sacrificial anodes for corrosion protection',
      'Pharmaceuticals and pigments'
    ],
    challenges: [
      'Global price volatility influenced by supply and demand',
      'Environmental impact of zinc mining and processing',
      'Competition from alternative corrosion protection methods',
      'Ensuring consistent quality for critical applications like galvanizing'
    ],
    marketTrend: 'The market for zinc products in India is primarily driven by the steel industry\'s demand for galvanization, which is boosted by infrastructure and construction projects under the NIP. Increased automotive production and the growth of renewable energy projects (requiring galvanized structures) also contribute significantly. The \'Make in India\' push for manufacturing further promotes the use of zinc die-cast components in various sectors, indicating stable growth.'
  },
  {
    slug: 'lead-products-india',
    name: 'Lead Products',
    category: 'Metals - Non-Ferrous',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Lead products are materials derived from elemental lead, characterized by their high density, malleability, low melting point, and excellent corrosion resistance. Primarily used in battery manufacturing, radiation shielding, and as an alloying agent, lead\'s unique properties make it suitable for specialized applications where heavy weight or protective barriers are required. Despite environmental concerns, its specific functionalities remain critical in various industrial sectors, often with stringent handling and recycling protocols.',
    industries: [
      'Battery Manufacturing',
      'Construction',
      'Radiation Shielding',
      'Ammunition',
      'Chemical Plants',
      'Recycling'
    ],
    grades: [
      'Refined Lead 99.97% minimum',
      'Antimonial Lead (e.g., 2-6% Antimony)',
      'Calcium Lead Alloys',
      'Chemical Lead',
      'IS 27 (Lead Ingots for General Purposes)',
      'IS 11470 (Lead and Lead Alloys - Sheet and Strip)'
    ],
    specifications: [
      'Purity: 99.9 - 99.99%',
      'Density: 11.34 g/cm³',
      'Melting Point: 327.5 °C',
      'Hardness (BHN): 3 - 30',
      'Tensile Strength: 12 - 20 MPa'
    ],
    standards: [
      'ASTM B29 (Refined Lead)',
      'ASTM B749 (Lead and Lead Alloy Strip, Sheet, and Plate)',
      'IS 27 (Lead Ingots for General Purposes)',
      'IS 398 (Lead Acid Storage Batteries)',
      'BIS IS 15470 (Lead and Lead Alloys - Terminology)'
    ],
    hsnCodes: ['7801', '7806'],
    orderSizes: '1 MT - 2000 MT',
    importCountries: [
      'China',
      'South Korea',
      'UAE',
      'Australia',
      'USA',
      'Mexico',
      'UK'
    ],
    relatedSlugs: [
      'copper-products-india',
      'aluminium-products-india',
      'brass-products-india',
      'zinc-products-india',
      'titanium-products-india'
    ],
    priceRange: '₹190 - ₹280 per kg',
    applications: [
      'Lead-acid batteries',
      'Radiation shielding (X-ray rooms, nuclear facilities)',
      'Cable sheathing',
      'Ammunition and weights',
      'Soundproofing materials',
      'Corrosion-resistant linings for chemical tanks'
    ],
    challenges: [
      'Strict environmental and health regulations due to toxicity',
      'Volatile raw material prices',
      'Competition from alternative battery technologies',
      'High costs of lead recycling and hazardous waste management'
    ],
    marketTrend: 'The Indian market for lead products is strongly dominated by the lead-acid battery industry, which continues to see demand from automotive (replacements and new vehicles) and inverter segments. While there\'s a global shift towards lithium-ion, lead-acid batteries remain cost-effective for many applications. However, increasing environmental scrutiny and the push for safe recycling practices are significant factors influencing the industry. Infrastructural growth also supports demand for some niche applications.'
  },
  {
    slug: 'titanium-products-india',
    name: 'Titanium Products',
    category: 'Metals - Non-Ferrous',
    categorySlug: 'metals-non-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'non-ferrous',
    definition: 'Titanium products are materials manufactured from titanium and its alloys, renowned for their exceptional strength-to-weight ratio, superior corrosion resistance, and biocompatibility. Available in various forms, including sheets, rods, wires, and complex fabricated components, these products are instrumental in industries demanding high performance under extreme conditions. Their unique properties make them indispensable in applications where both lightness and durability are paramount, often replacing heavier, less resilient metals.',
    industries: [
      'Aerospace',
      'Medical Implants',
      'Chemical Processing',
      'Marine',
      'Automotive (High-Performance)',
      'Sports Equipment'
    ],
    grades: [
      'Commercially Pure Titanium Grade 1, 2, 3, 4',
      'Titanium Alloy Grade 5 (Ti-6Al-4V)',
      'Titanium Alloy Grade 7 (Ti-0.15Pd)',
      'Titanium Alloy Grade 9 (Ti-3Al-2.5V)',
      'ASTM B348 (Titanium and Titanium Alloy Bars and Billets)',
      'IS 2005 (Titanium and Titanium Alloys - General Requirements)'
    ],
    specifications: [
      'Tensile Strength: 240 - 1100+ MPa',
      'Density: 4.51 g/cm³',
      'Melting Point: 1668 °C',
      'Corrosion Resistance: Excellent in oxidizing environments',
      'Elongation: 10 - 25%'
    ],
    standards: [
      'ASTM B265 (Titanium and Titanium Alloy Strip, Sheet, and Plate)',
      'ASTM F136 (Ti-6Al-4V ELI for Surgical Implant Applications)',
      'IS 2005 (Titanium and Titanium Alloys - General Requirements)',
      'ISO 5832-2 (Implants for Surgery - Pure Titanium)',
      'BIS IS 1395 (Titanium and Titanium Alloys - Forgings)'
    ],
    hsnCodes: ['8108', '810810'],
    orderSizes: '10 kg - 50 MT',
    importCountries: [
      'USA',
      'Japan',
      'China',
      'Russia',
      'Germany',
      'UK',
      'France'
    ],
    relatedSlugs: [
      'copper-products-india',
      'aluminium-products-india',
      'brass-products-india',
      'zinc-products-india',
      'lead-products-india'
    ],
    priceRange: '₹1500 - ₹8000 per kg (depending on grade/form)',
    applications: [
      'Aircraft structural components and engine parts',
      'Surgical implants and prosthetics',
      'Chemical processing equipment (heat exchangers, tanks)',
      'Marine components (submarines, propellers)',
      'High-performance automotive parts (exhausts, connecting rods)',
      'Sporting goods (golf clubs, bike frames)'
    ],
    challenges: [
      'High cost of extraction and processing',
      'Difficulties in machining and welding',
      'Limited domestic production and reliance on imports',
      'Niche market applications requiring specialized expertise'
    ],
    marketTrend: 'The market for titanium products in India is expanding, notably within the aerospace and defense sectors, driven by \'Make in India\' and indigenous manufacturing initiatives. The medical implant industry also presents growing demand due to advancements in healthcare infrastructure. While still a niche, high-value segment, domestic capacity expansion and government support for high-tech manufacturing are slowly reducing import reliance and bolstering local production capabilities.'
  },
];

// ─── PIPES & TUBES ───
const pipeNewProducts: DemandProduct[] = [
  {
    slug: 'copper-tubes-india',
    name: 'Copper Tubes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'industrial-pipes',
    definition: 'Copper tubes are seamless or welded metal conduits made from pure copper or copper alloys, primarily used for conveying fluids or gases in various applications. They are known for their excellent thermal conductivity, corrosion resistance, and ductility, making them suitable for refrigeration, air conditioning, and plumbing systems. These tubes can be supplied in straight lengths or coils, and often come in annealed or hard-drawn tempers.',
    industries: [
      'HVAC & Refrigeration',
      'Plumbing & Sanitation',
      'Automotive',
      'Electrical & Electronics',
      'Healthcare',
      'Solar Water Heating'
    ],
    grades: [
      'C12200 (DHP Copper)',
      'C11000 (ETP Copper)',
      'C10200 (OFHC Copper)',
      'C1220R (Annealed)',
      'C70600 (Cupro-Nickel)',
      'C26000 (Cartridge Brass)'
    ],
    specifications: [
      'Outer Diameter: 6 mm - 108 mm',
      'Wall Thickness: 0.5 mm - 5 mm',
      'Length: 3 m - 6 m (straight), 15 m - 50 m (coils)',
      'Tensile Strength: 200 MPa - 300 MPa',
      'Elongation: 30% - 50%'
    ],
    standards: [
      'ASTM B88',
      'IS 2501',
      'EN 1057',
      'ASTM B68',
      'BIS 1972'
    ],
    hsnCodes: ['74111000'],
    orderSizes: '100 kg - 50,000 kg',
    importCountries: [
      'China',
      'Japan',
      'South Korea',
      'Malaysia',
      'Germany',
      'USA',
      'Thailand'
    ],
    relatedSlugs: [
      'hollow-sections-india',
      'heat-exchanger-tubes-india',
      'line-pipes-india',
      'casing-pipes-india',
      'galvanized-pipes-india'
    ],
    priceRange: '₹650 - ₹950 per kg',
    applications: [
      'Refrigeration lines',
      'Air conditioning systems',
      'Potable water supply',
      'Medical gas lines',
      'Automotive brake lines',
      'Heat exchangers'
    ],
    challenges: [
      'Volatility in copper raw material prices',
      'High susceptibility to theft due to scrap value',
      'Risk of galvanic corrosion when combined with other metals',
      'Installation requires skilled labor for brazing'
    ],
    marketTrend: 'The demand for copper tubes is driven by the burgeoning HVAC-R sector and infrastructure development under initiatives like Smart Cities and the National Infrastructure Pipeline. Growing urbanisation and an increasing focus on energy-efficient cooling solutions in residential and commercial buildings further bolster this growth. The shift towards sustainable building practices is also creating opportunities for copper in eco-friendly plumbing systems.'
  },
  {
    slug: 'hollow-sections-india',
    name: 'Hollow Sections',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'industrial-pipes',
    definition: 'Hollow sections are cold-formed or hot-finished structural steel products with a hollow, enclosed cross-section, commonly square, rectangular, or circular. They offer excellent strength-to-weight ratio, making them efficient for load-bearing applications in construction and engineering. These sections contribute to aesthetic appeal in architectural designs and simplify fabrication due to their uniform properties and clean lines.',
    industries: [
      'Construction & Infrastructure',
      'Automotive',
      'Material Handling',
      'Agricultural Equipment',
      'Furniture & Fixtures',
      'Renewable Energy'
    ],
    grades: [
      'IS 4923 YST 210',
      'IS 4923 YST 240',
      'IS 4923 YST 310',
      'ASTM A500 Grade B',
      'EN 10219 S355JR',
      'ASTM A500 Grade C',
      'EN 10210 S355NH'
    ],
    specifications: [
      'Side Length/Diameter: 20 mm - 400 mm',
      'Wall Thickness: 1.5 mm - 16 mm',
      'Length: 6 m - 12 m',
      'Yield Strength: 210 MPa - 355 MPa',
      'Tensile Strength: 340 MPa - 520 MPa'
    ],
    standards: [
      'IS 4923',
      'ASTM A500',
      'EN 10219',
      'EN 10210',
      'BIS 9070'
    ],
    hsnCodes: ['73066100'],
    orderSizes: '5 MT - 1000 MT',
    importCountries: [
      'China',
      'South Korea',
      'Turkey',
      'Ukraine',
      'Japan',
      'Germany',
      'Russia'
    ],
    relatedSlugs: [
      'copper-tubes-india',
      'heat-exchanger-tubes-india',
      'line-pipes-india',
      'casing-pipes-india',
      'galvanized-pipes-india'
    ],
    priceRange: '₹55 - ₹85 per kg',
    applications: [
      'Building frameworks and trusses',
      'Bus and truck chassis',
      'Conveyor systems',
      'Storage racks and shelving',
      'Signage structures',
      'Bridge components'
    ],
    challenges: [
      'Requires careful welding procedures to maintain structural integrity',
      'Internal surface corrosion protection can be difficult',
      'Limited aesthetic flexibility compared to solid sections in some designs',
      'Fluctuations in steel raw material costs impact pricing'
    ],
    marketTrend: 'The market for hollow sections is significantly bolstered by the robust growth in infrastructure development under government programs like the National Infrastructure Pipeline and Housing for All. Increased construction activity in commercial and industrial sectors, alongside the burgeoning automotive and manufacturing industries, sustains demand. Emphasis on pre-fabricated and modular construction also provides a steady growth trajectory for these versatile structural components.'
  },
  {
    slug: 'heat-exchanger-tubes-india',
    name: 'Heat Exchanger Tubes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'industrial-pipes',
    definition: 'Heat exchanger tubes are precision-engineered pipes designed to efficiently transfer thermal energy between two fluids without direct contact. They come in various materials, including copper, stainless steel, and nickel alloys, selected based on fluid corrosivity, temperature, and pressure requirements. These tubes are often seamless or welded, with smooth or finned surfaces to optimize heat transfer efficiency in demanding industrial applications.',
    industries: [
      'Power Generation',
      'Petrochemical & Refinery',
      'Chemical Processing',
      'HVAC & Refrigeration',
      'Oil & Gas',
      'Food & Beverage'
    ],
    grades: [
      'ASTM A213 T22 (Alloy Steel)',
      'ASTM A269 TP304/304L (Stainless Steel)',
      'ASTM B111 C70600 (Cupro-Nickel)',
      'ASTM B338 Grade 2 (Titanium)',
      'IS 1972 (Carbon Steel)',
      'ASTM A213 TP347H (Stainless Steel)',
      'ASTM B407 (Incoloy 800)'
    ],
    specifications: [
      'Outer Diameter: 6.35 mm - 101.6 mm',
      'Wall Thickness: 0.7 mm - 4 mm',
      'Length: U-bent or straight up to 18 m',
      'Surface Finish: Ra < 0.8 µm',
      'Pressure Rating: Up to 20 MPa'
    ],
    standards: [
      'ASTM A213',
      'ASTM A269',
      'ASTM B111',
      'IS 1972 (for carbon steel)',
      'TEMA (Tubular Exchanger Manufacturers Association)'
    ],
    hsnCodes: ['73043110', '74112100'],
    orderSizes: '500 kg - 50,000 kg',
    importCountries: [
      'Germany',
      'Japan',
      'South Korea',
      'USA',
      'China',
      'Italy',
      'Sweden'
    ],
    relatedSlugs: [
      'copper-tubes-india',
      'hollow-sections-india',
      'line-pipes-india',
      'casing-pipes-india',
      'galvanized-pipes-india'
    ],
    priceRange: '₹400 - ₹3000 per kg (material dependent)',
    applications: [
      'Boilers and condensers',
      'Oil and gas coolers',
      'Chemical reactors',
      'HVAC chillers',
      'Refrigeration systems',
      'Steam generators'
    ],
    challenges: [
      'Fouling and scaling can reduce efficiency over time',
      'Material selection is critical to resist corrosion and erosion',
      'Manufacturing requires high precision and quality control',
      'High upfront cost for specialized alloy tubes'
    ],
    marketTrend: 'The market for heat exchanger tubes is driven by the expansion of power generation capacity, particularly in thermal and nuclear sectors, and the growing demand from oil refineries and petrochemical plants in India. Increased investment in energy efficiency and process optimization across various manufacturing industries under the Make in India initiative further contributes to demand. The focus on reducing carbon footprint and improving industrial process efficiency is steadily boosting the adoption of advanced heat exchange technologies.'
  },
  {
    slug: 'line-pipes-india',
    name: 'Line Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'industrial-pipes',
    definition: 'Line pipes are robust steel pipes used for long-distance transportation of fluids such as crude oil, natural gas, refined petroleum products, and water. They are designed to withstand high pressures and harsh environmental conditions, manufactured to stringent specifications for wall thickness, diameter, and material strength. These pipes are typically seamless or welded (ERW, LSAW, HSAW) and often coated for corrosion protection, ensuring safe and efficient transfer across vast distances.',
    industries: [
      'Oil & Gas',
      'Water Infrastructure',
      'Petrochemical',
      'Mining',
      'Thermal Power Plants',
      'Fertilizer Plants'
    ],
    grades: [
      'API 5L Grade B',
      'API 5L X42',
      'API 5L X52',
      'API 5L X60',
      'API 5L X65',
      'API 5L X70',
      'IS 3589 Fe 410'
    ],
    specifications: [
      'Outer Diameter: 60.3 mm - 1422 mm',
      'Wall Thickness: 3.2 mm - 30 mm',
      'Length: 6 m - 12 m (single random, double random)',
      'Yield Strength: 245 MPa - 485 MPa',
      'Impact Toughness: -20°C Test'
    ],
    standards: [
      'API 5L',
      'IS 3589',
      'ISO 3183',
      'DNV-OS-F101',
      'EN 10208'
    ],
    hsnCodes: ['73041910', '73051111'],
    orderSizes: '100 MT - 10,000 MT',
    importCountries: [
      'China',
      'Russia',
      'Japan',
      'South Korea',
      'Germany',
      'USA',
      'Turkey'
    ],
    relatedSlugs: [
      'copper-tubes-india',
      'hollow-sections-india',
      'heat-exchanger-tubes-india',
      'casing-pipes-india',
      'galvanized-pipes-india'
    ],
    priceRange: '₹70 - ₹120 per kg',
    applications: [
      'Oil and gas pipelines',
      'Water transmission networks',
      'Slurry pipelines in mining',
      'Hydrogen transportation (emerging)',
      'CO2 capture and transport',
      'Industrial process piping'
    ],
    challenges: [
      'High capital investment for pipeline projects',
      'Environmental and land acquisition challenges for new routes',
      'Risk of corrosion and external damage requiring robust coatings',
      'Stringent quality control and third-party inspections are mandatory'
    ],
    marketTrend: 'The line pipe market is significantly boosted by India\'s expanding natural gas grid under the National Gas Grid mission and increased investment in crude oil and product pipelines to meet growing energy demands. Government initiatives for infrastructure development and ensuring energy security are key drivers. The focus on urban and rural water supply projects further enhances demand for water transmission lines. Policy support for renewable energy and hydrogen transport infrastructure also signals future growth.'
  },
  {
    slug: 'casing-pipes-india',
    name: 'Casing Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'industrial-pipes',
    definition: 'Casing pipes are large-diameter, heavy-duty steel pipes primarily used to line subterranean boreholes, particularly in oil, gas, and water well drilling operations. They serve to stabilize the wellbore, prevent contamination from surrounding formations, and provide a conduit for production. Manufactured to specific API standards, these pipes are crucial for well integrity, typically joined by threaded and coupled connections to withstand extreme conditions downhole.',
    industries: [
      'Oil & Gas Exploration',
      'Groundwater & Irrigation',
      'Geothermal Drilling',
      'Mining',
      'Water Treatment',
      'Construction (Piling)'
    ],
    grades: [
      'API 5CT J55',
      'API 5CT K55',
      'API 5CT N80',
      'API 5CT L80',
      'API 5CT P110',
      'IS 12818 (for water wells)',
      'IS 4270 (for water wells)'
    ],
    specifications: [
      'Outer Diameter: 114.3 mm - 508 mm',
      'Wall Thickness: 5.2 mm - 16 mm',
      'Length: R1 (4.88-7.62m), R2 (7.62-10.36m), R3 (>10.36m)',
      'Yield Strength: 379 MPa - 758 MPa',
      'Connection Type: BTC, LTC, STC (Buttress, Long Thread, Short Thread)'
    ],
    standards: [
      'API 5CT',
      'IS 12818',
      'IS 4270',
      'ISO 11960',
      'BIS 5CT'
    ],
    hsnCodes: ['73042910', '73042990'],
    orderSizes: '50 MT - 5,000 MT',
    importCountries: [
      'China',
      'Russia',
      'USA',
      'Mexico',
      'South Korea',
      'Japan',
      'Turkey'
    ],
    relatedSlugs: [
      'copper-tubes-india',
      'hollow-sections-india',
      'heat-exchanger-tubes-india',
      'line-pipes-india',
      'galvanized-pipes-india'
    ],
    priceRange: '₹80 - ₹150 per kg',
    applications: [
      'Oil and gas well completion',
      'Deep water well drilling',
      'Geothermal well construction',
      'Submersible pump installations',
      'Vertical pipe piling',
      'Exploration boreholes'
    ],
    challenges: [
      'Requires high material toughness and dimensional accuracy',
      'Corrosion from downhole fluids and gases is a major concern',
      'Logistics for heavy and long pipe sections to remote locations',
      'High cost due to specialized manufacturing and alloy grades'
    ],
    marketTrend: 'The casing pipe market is directly tied to the upstream oil and gas exploration and production (E&P) activities. India\'s focus on increasing domestic crude oil and natural gas production to reduce import dependence, coupled with ongoing investment in groundwater extraction for agriculture and urban supply, drives demand. Government policies supporting energy security and water resource management are key market enablers. Demand for these pipes is also seen in geological surveys and mineral exploration.'
  },
  {
    slug: 'galvanized-pipes-india',
    name: 'Galvanized Pipes',
    category: 'Pipes & Tubes',
    categorySlug: 'pipes-tubes',
    industrySlug: 'pipes',
    subIndustrySlug: 'industrial-pipes',
    definition: 'Galvanized pipes are steel pipes that have been coated with a protective layer of zinc through a hot-dip galvanizing process. This zinc coating acts as a sacrificial layer, providing superior corrosion resistance against rust and environmental elements, significantly extending the pipe\'s service life compared to plain steel pipes. They are commonly used for conveying water, gas, and other fluids in applications where corrosion protection is paramount.',
    industries: [
      'Plumbing & Sanitation',
      'Agriculture',
      'Fencing & Railings',
      'Construction',
      'Water Supply',
      'Horticulture'
    ],
    grades: [
      'IS 1239 (Part 1) Light',
      'IS 1239 (Part 1) Medium',
      'IS 1239 (Part 1) Heavy',
      'ASTM A53 Type F/E/S',
      'EN 10255 (L, M, H Series)',
      'JIS G3442 SGP'
    ],
    specifications: [
      'Outer Diameter: 15 mm - 150 mm',
      'Wall Thickness: 1.8 mm - 5.4 mm',
      'Length: 6 m standard (up to 12m available)',
      'Zinc Coating: 60 µm - 100 µm',
      'Yield Strength: 200 MPa - 275 MPa'
    ],
    standards: [
      'IS 1239 (Part 1)',
      'IS 4736',
      'ASTM A53',
      'EN 10255',
      'BIS 1972'
    ],
    hsnCodes: ['73063090'],
    orderSizes: '5 MT - 1000 MT',
    importCountries: [
      'China',
      'Turkey',
      'Ukraine',
      'South Korea',
      'Malaysia',
      'Vietnam',
      'Japan'
    ],
    relatedSlugs: [
      'copper-tubes-india',
      'hollow-sections-india',
      'heat-exchanger-tubes-india',
      'line-pipes-india',
      'casing-pipes-india'
    ],
    priceRange: '₹65 - ₹95 per kg',
    applications: [
      'Domestic water plumbing',
      'Agricultural irrigation systems',
      'Scaffolding and temporary structures',
      'Protective conduits for electrical wiring',
      'Perimeter fencing posts',
      'Fire fighting systems (sprinklers)'
    ],
    challenges: [
      'Internal scaling can lead to reduced water flow over time',
      'Welding requires special care to prevent zinc fume inhalation',
      'Zinc coating can be damaged by abrasive handling or rough cutting',
      'Less aesthetic for exposed modern architectural applications'
    ],
    marketTrend: 'The market for galvanized pipes is significantly driven by robust construction activity, particularly in residential and commercial sectors, and extensive government initiatives for safe drinking water supply under schemes like Jal Jeevan Mission. Demand from the agricultural sector for irrigation and from infrastructure projects for scaffolding and structural applications also contributes. The focus on durable and maintenance-free building solutions continues to support steady growth. The NIP\'s push for urban infrastructure development further solidifies demand.'
  },
];

// ─── STEEL FABRICATION & STRUCTURES ───
const fabricationProducts: DemandProduct[] = [
  {
    slug: 'ms-structures-india',
    name: 'MS Structures',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'MS Structures refer to Mild Steel fabricated components and assemblies used as load-bearing frameworks or support systems in construction and industrial applications. These structures are typically manufactured from hot-rolled or cold-formed mild steel sections like beams, columns, angles, and channels, then cut, welded, and bolted together to form robust and durable frameworks capable of supporting heavy loads and resisting environmental stresses.',
    industries: [
      'Construction',
      'Infrastructure',
      'Manufacturing',
      'Warehousing',
      'Power & Energy',
      'Oil & Gas'
    ],
    grades: [
      'IS 2062 E250BR',
      'IS 2062 E250BO',
      'IS 2062 E350BR',
      'ASTM A36',
      'ASTM A572 Grade 50',
      'JIS G3101 SS400'
    ],
    specifications: [
      'Thickness: 3mm-50mm',
      'Section Height: 100mm-1000mm',
      'Yield Strength: 250-350 MPa',
      'Tensile Strength: 410-510 MPa',
      'Surface Finish: Mill Finish, Galvanized, Painted'
    ],
    standards: [
      'IS 800: General construction in steel',
      'IS 2062: Steel for general structural purposes',
      'ASTM A36: Structural Carbon Steel',
      'BS EN 10025: Hot rolled structural steel',
      'IS 1363: Hexagon head bolts, screws and nuts'
    ],
    hsnCodes: ['73089090'],
    orderSizes: '1-5000 Tons',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Germany',
      'UAE',
      'Turkey',
      'Taiwan'
    ],
    relatedSlugs: [
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india',
      'steel-gratings-india'
    ],
    priceRange: '₹60,000-₹90,000 per ton',
    applications: [
      'Building frameworks',
      'Industrial sheds',
      'Warehouses',
      'Bridges',
      'Transmission towers',
      'Material handling structures'
    ],
    challenges: [
      'Corrosion prevention and maintenance',
      'Skilled labor availability for fabrication and erection',
      'Logistics for large and heavy components',
      'Fluctuating raw material (steel) prices'
    ],
    marketTrend: 'Demand for MS Structures is robust, driven by NIP and Smart Cities initiatives. Government focus on infrastructure development, including roads, bridges, and industrial corridors, significantly boosts the market. The warehousing and logistics sectors also contribute to sustained growth, with an emphasis on prefabricated and modular solutions.'
  },
  {
    slug: 'steel-ducting-india',
    name: 'Steel Ducting',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Steel ducting refers to fabricated conduit systems typically made from galvanized, mild, or stainless steel, designed to convey air, fumes, sawdust, or other particulate matter in industrial ventilation and exhaust systems. These systems are crucial for maintaining air quality, controlling temperature, and preventing the accumulation of hazardous substances in various operational environments. Fabrication involves forming, welding, and sealing steel sheets into various shapes like circular, rectangular, or spiral.',
    industries: [
      'HVAC',
      'Automotive',
      'Pharmaceuticals',
      'Chemical',
      'Food & Beverage',
      'Mining'
    ],
    grades: [
      'IS 277 (Galvanized Steel)',
      'IS 513 (Cold Rolled Steel)',
      'ASTM A653 (Galvanized Steel)',
      'ASTM A240 Grade 304',
      'ASTM A240 Grade 316L',
      'IS 2062 E250BO'
    ],
    specifications: [
      'Material Thickness: 0.8mm-5.0mm',
      'Standard Diameter: 100mm-1500mm',
      'Air Tightness Class: A, B, C',
      'Pressure Rating: -2000 Pa to +2000 Pa',
      'Surface Finish: Galvanized, Powder Coated, Mill Finish'
    ],
    standards: [
      'SMACNA HVAC Duct Construction Standards',
      'ASHRAE 193: Method of Test for Ducts',
      'IS 655: Code of practice for design of ventilation systems',
      'DW 144: Specification for Sheet Metal Ductwork',
      'IS 3804: Code of practice for industrial ventilation'
    ],
    hsnCodes: ['73089090', '73269099'],
    orderSizes: '1-500 meters',
    importCountries: [
      'China',
      'UAE',
      'Germany',
      'Italy',
      'South Korea',
      'Malaysia'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india',
      'steel-gratings-india'
    ],
    priceRange: '₹300-₹3,000 per meter',
    applications: [
      'Industrial ventilation systems',
      'Fume extraction',
      'Dust collection',
      'HVAC systems in commercial buildings',
      'Exhaust systems in manufacturing plants',
      'Pneumatic conveying'
    ],
    challenges: [
      'Ensuring air-tightness and structural integrity',
      'Corrosion resistance in aggressive environments',
      'Noise mitigation for airflow',
      'Custom fabrication for complex layouts'
    ],
    marketTrend: 'The market for steel ducting is driven by industrial expansion, particularly in manufacturing and infrastructure. Stricter environmental norms and a focus on occupational health and safety in factories are propelling demand for efficient ventilation systems. The \'Make in India\' initiative encourages domestic production, aiming to reduce reliance on imports and improve supply chain resilience.'
  },
  {
    slug: 'profiled-sheets-india',
    name: 'Profiled Sheets',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Profiled sheets, also known as corrugated or trapezoidal sheets, are cold-formed steel sheets with specific geometric profiles, offering enhanced structural strength and rigidity compared to flat sheets. They are primarily used for roofing, cladding, and decking applications in buildings, providing weather protection, aesthetic appeal, and structural support. Common materials include galvanized steel, galvalume, or pre-painted galvanized iron (PPGI), ensuring durability and corrosion resistance.',
    industries: [
      'Construction',
      'Warehousing',
      'Industrial',
      'Agriculture',
      'Infrastructure',
      'Solar Power'
    ],
    grades: [
      'IS 277 (Galvanized Steel)',
      'ASTM A653 (Galvanized Steel)',
      'ASTM A792 (Galvalume)',
      'JIS G3302 (Galvanized Steel)',
      'IS 14246 (PPGI)',
      'IS 15961 (Pre-coated Metal)'
    ],
    specifications: [
      'Thickness: 0.3mm-1.2mm',
      'Effective Cover Width: 750mm-1100mm',
      'Profile Height: 18mm-45mm',
      'Coating Weight: Z120 - Z275 (GSM)',
      'Color: RAL shades'
    ],
    standards: [
      'IS 277: Galvanized steel sheets and strips (for roofing)',
      'IS 14246: Pre-coated galvanized steel sheets',
      'ASTM A653: Steel sheet, zinc-coated (galvanized)',
      'ASTM A792: Steel sheet, 55% Al-Zn alloy-coated',
      'AS/NZS 2728: Pre-finished/pre-painted sheet metal products'
    ],
    hsnCodes: ['73089090', '73083000'],
    orderSizes: '50-10,000 sq ft',
    importCountries: [
      'China',
      'South Korea',
      'Malaysia',
      'Vietnam',
      'Turkey',
      'Taiwan',
      'Indonesia'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'perforated-sheets-india',
      'cable-trays-india',
      'steel-gratings-india'
    ],
    priceRange: '₹70-₹180 per sq ft',
    applications: [
      'Industrial roofing',
      'Wall cladding',
      'False ceilings',
      'Decking in multi-story buildings',
      'Agricultural shelters',
      'Solar panel mounting structures'
    ],
    challenges: [
      'Ensuring proper installation to prevent leaks',
      'Transport and handling of large, thin sheets',
      'Heat insulation in hot climates',
      'Color fading in harsh sunlight'
    ],
    marketTrend: 'The market for profiled sheets is experiencing significant growth due to rapid industrialization, expansion of manufacturing facilities, and the development of modern warehousing infrastructure under schemes like PLI and NIP. The ease of installation, cost-effectiveness, and availability in various colors make them a preferred choice for large-span constructions. Demand is also rising from the affordable housing segment.'
  },
  {
    slug: 'perforated-sheets-india',
    name: 'Perforated Sheets',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Perforated sheets are metal sheets (steel, stainless steel, aluminum) that have been mechanically punched with a pattern of holes. These holes can be round, square, slotted, or decorative, and their size and spacing vary based on application. Perforated sheets are valued for their ability to allow passage of light, air, liquids, or sound, while simultaneously offering strength, aesthetics, and filtering capabilities across a wide range of industrial and architectural uses.',
    industries: [
      'Architecture',
      'Filtration',
      'Acoustics',
      'Automotive',
      'Food Processing',
      'Agriculture'
    ],
    grades: [
      'IS 513 (Cold Rolled Steel)',
      'IS 2062 (Mild Steel)',
      'ASTM A240 Grade 304',
      'ASTM A240 Grade 316',
      'ASTM B209 (Aluminum)',
      'JIS G3141 SPCC'
    ],
    specifications: [
      'Material Thickness: 0.5mm-10mm',
      'Hole Diameter: 1mm-50mm',
      'Open Area: 20%-60%',
      'Pattern: Staggered, Straight, Decorative',
      'Sheet Size: Up to 1.5m x 6m'
    ],
    standards: [
      'ASTM E2016: Standard Test Method for Perforated Metal',
      'ISO 7806: Perforated metal sheets definition',
      'DIN 24041: Perforated plates for sieves',
      'IS 655: Code of practice for design of ventilation systems',
      'IS 1570 (Part 1): Steel for general engineering purposes'
    ],
    hsnCodes: ['73145000', '73269099'],
    orderSizes: '1-100 sheets',
    importCountries: [
      'China',
      'Germany',
      'South Korea',
      'Italy',
      'Taiwan',
      'Turkey'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'cable-trays-india',
      'steel-gratings-india'
    ],
    priceRange: '₹200-₹1,500 per sq ft',
    applications: [
      'Architectural facades',
      'Sun screens',
      'Acoustic panels',
      'Grain dryers',
      'Filter screens',
      'Ventilation grilles'
    ],
    challenges: [
      'Maintaining flatness during perforation',
      'Achieving consistent hole patterns',
      'Customization for unique designs',
      'Cost-effectiveness for small batches'
    ],
    marketTrend: 'The demand for perforated sheets is growing due to their versatility in architectural, industrial, and acoustic applications. The push for aesthetically pleasing and functional building designs in urban development projects, along with increased focus on industrial filtration and sound dampening, drives market expansion. Emerging applications in renewable energy and waste management also contribute to sustained growth. The \'Smart City\' initiative boosts demand for innovative building materials.'
  },
  {
    slug: 'cable-trays-india',
    name: 'Cable Trays',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Cable trays are structures designed to support and protect insulated electrical cables, wires, and pneumatic or hydraulic lines used for power distribution, control, and communication. They provide an organized system for cable management, improving routing efficiency, reducing clutter, and facilitating maintenance. Typically manufactured from galvanized steel, stainless steel, or aluminum, they come in various types such as ladder, perforated, solid bottom, or wire mesh to suit different load capacities and environmental conditions.',
    industries: [
      'Electrical',
      'Construction',
      'IT & Data Centers',
      'Industrial',
      'Power & Energy',
      'Oil & Gas'
    ],
    grades: [
      'IS 277 (Galvanized Steel)',
      'IS 2062 (Mild Steel)',
      'ASTM A653 (Galvanized Steel)',
      'ASTM A240 Grade 304',
      'ASTM A240 Grade 316L',
      'ISO 8089 (Hot-dip galvanized coating)'
    ],
    specifications: [
      'Width: 50mm-1000mm',
      'Side Rail Height: 25mm-150mm',
      'Material Thickness: 1.0mm-3.0mm',
      'Surface Finish: Hot-dip Galvanized, Pre-Galvanized, Epoxy Coated',
      'Load Capacity: 20-200 kg/meter'
    ],
    standards: [
      'NEMA VE 1: Metal Cable Tray Systems',
      'IS 8081: Code of practice for installation of cable trays',
      'IEC 61537: Cable management systems - Cable tray systems',
      'BS EN 61537: Cable management systems - Cable tray systems',
      'IS 2062: Steel for general structural purposes'
    ],
    hsnCodes: ['73089090', '73269099'],
    orderSizes: '1-10,000 meters',
    importCountries: [
      'China',
      'UAE',
      'Germany',
      'Italy',
      'South Korea',
      'Turkey',
      'France'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'steel-gratings-india'
    ],
    priceRange: '₹150-₹800 per meter',
    applications: [
      'Industrial cable routing',
      'Commercial building wiring',
      'Data center cable management',
      'Power plant electrical systems',
      'Road and rail infrastructure',
      'Solar farm cabling'
    ],
    challenges: [
      'Ensuring proper grounding and electrical safety',
      'Capacity management for growing cable loads',
      'Corrosion resistance in outdoor or harsh environments',
      'Custom fabrication for complex installations'
    ],
    marketTrend: 'The market for cable trays in India is experiencing strong growth, fueled by rapid industrialization, infrastructure development under the NIP, and expansion of data centers. Increased demand for organized and safe electrical installations in commercial and residential projects, coupled with the rollout of 5G networks, sustains market momentum. The push for smart manufacturing and automation further drives the need for efficient cable management solutions.'
  },
  {
    slug: 'steel-gratings-india',
    name: 'Steel Gratings',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Steel gratings are open-grid structures made by welding or interlocking steel bearing bars and cross bars, forming a robust and lightweight panel. They are primarily used for flooring, platforms, stair treads, and drainage covers, offering excellent load-bearing capacity, slip resistance, and ventilation. Available in mild steel, galvanized steel, or stainless steel, gratings are essential for industrial safety and functionality in areas requiring high strength, open-area flow, and easy maintenance.',
    industries: [
      'Industrial',
      'Infrastructure',
      'Oil & Gas',
      'Power & Energy',
      'Waste Management',
      'Marine'
    ],
    grades: [
      'IS 2062 E250BR',
      'IS 2062 E350BR',
      'ASTM A36',
      'ASTM A240 Grade 304',
      'ASTM A240 Grade 316',
      'BS EN 10025 S235JR'
    ],
    specifications: [
      'Bar Spacing: 30x100mm, 40x100mm',
      'Bearing Bar Size: 25x3mm to 60x5mm',
      'Surface Finish: Mill Finish, Hot-dip Galvanized, Painted',
      'Edge Type: Banded, Unbanded',
      'Load Capacity: 2-10 tons/sqm'
    ],
    standards: [
      'ANSI/NAAMM MBG 531: Metal Bar Grating Manual',
      'BS 4592-1: Industrial type flooring and stair treads',
      'IS 2062: Steel for general structural purposes',
      'ASTM A123: Zinc (Hot-Dip Galvanized) Coatings',
      'ISO 1461: Hot-dip galvanized coatings'
    ],
    hsnCodes: ['73144900', '73089090'],
    orderSizes: '1-1000 sq meters',
    importCountries: [
      'China',
      'Malaysia',
      'UAE',
      'Germany',
      'South Korea',
      'Taiwan',
      'Indonesia'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india'
    ],
    priceRange: '₹150-₹800 per sq ft',
    applications: [
      'Industrial flooring',
      'Platform walkways',
      'Stair treads',
      'Drainage covers',
      'Mezzanines',
      'Security screens'
    ],
    challenges: [
      'Ensuring anti-slip properties, especially when wet',
      'Corrosion resistance in demanding environments',
      'Accurate fabrication for custom fit',
      'Heavy weight for transport and handling'
    ],
    marketTrend: 'The market for steel gratings is buoyant, propelled by ongoing infrastructure projects, expansion of manufacturing facilities, and strict industrial safety regulations. Increased investment in power plants, oil & gas refineries, and urban drainage systems under government initiatives boosts demand. The need for durable, low-maintenance, and safe flooring solutions in industrial settings ensures consistent market growth, complemented by \'Make in India\' sourcing preferences.'
  },
  {
    slug: 'railings-india',
    name: 'Railings',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Railings are safety barriers or handholds typically fabricated from steel (mild steel, stainless steel) which are installed along edges of staircases, balconies, elevated platforms, and open areas to prevent falls and provide support. They consist of vertical posts, horizontal rails, and infill panels or balusters. Railings prioritize safety while also contributing significantly to architectural aesthetics, often incorporating various designs, finishes, and material combinations to suit specific functional and visual requirements.',
    industries: [
      'Construction',
      'Architecture',
      'Infrastructure',
      'Commercial',
      'Residential',
      'Hospitality'
    ],
    grades: [
      'IS 2062 E250BR',
      'ASTM A240 Grade 304',
      'ASTM A240 Grade 316',
      'IS 513 Cold Rolled Steel',
      'ASTM A500 Grade B',
      'JIS G3446 STKR400'
    ],
    specifications: [
      'Height: 900mm-1200mm (As per standard)',
      'Material Thickness: 1.5mm-5.0mm',
      'Finish: Polished, Brushed, Powder Coated, Painted',
      'Infill Type: Bar, Glass, Wire Mesh, Perforated',
      'Load Bearing: 0.75-1.5 kN/m'
    ],
    standards: [
      'IS 15053: Guidelines for the design and construction of steel stairs',
      'NBC 2016: National Building Code of India (Safety Regulations)',
      'BS EN 1090: Execution of steel structures',
      'ASTM E985: Standard Test Methods for Load Tests of Glass Railing Systems',
      'OHSA 1910.29: Fall protection systems'
    ],
    hsnCodes: ['73089090'],
    orderSizes: '1-1000 linear meters',
    importCountries: [
      'China',
      'Italy',
      'Germany',
      'Turkey',
      'Spain',
      'Taiwan',
      'UAE'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india'
    ],
    priceRange: '₹400-₹3,000 per linear ft',
    applications: [
      'Staircases',
      'Balconies',
      'Terraces',
      'Mezzanines',
      'Industrial platforms',
      'Public access areas'
    ],
    challenges: [
      'Adherence to strict safety codes and regulations',
      'Corrosion resistance for outdoor installations',
      'Achieving seamless and aesthetic welds',
      'Custom fabrication for unique architectural designs'
    ],
    marketTrend: 'The market for railings is experiencing steady growth, driven by expansion in residential and commercial construction, adherence to safety regulations (NBC 2016), and increasing demand for aesthetically appealing architectural elements. Infrastructure projects, including metro stations and flyovers, also contribute to demand. The focus on high-quality and durable materials, particularly stainless steel, is a key trend, aligning with the rising aspirations for modern and safe spaces in urban centers.'
  },
  {
    slug: 'walkways-india',
    name: 'Walkways',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Walkways are elevated or ground-level pathways, typically constructed from steel, installed within industrial plants, commercial buildings, or outdoor settings to provide safe pedestrian access between different areas, especially over obstacles or hazardous zones. These structures usually incorporate steel gratings or checkered plates for flooring, along with handrails and toe plates for safety. They serve as essential access routes for maintenance, inspection, and operational staff, improving safety and efficiency.',
    industries: [
      'Industrial',
      'Oil & Gas',
      'Power & Energy',
      'Mining',
      'Logistics',
      'Chemical'
    ],
    grades: [
      'IS 2062 E250BR',
      'IS 2062 E350BR',
      'ASTM A36',
      'ASTM A572 Grade 50',
      'ASTM A240 Grade 304',
      'JIS G3101 SS400'
    ],
    specifications: [
      'Width: 600mm-1500mm',
      'Load Capacity: 250-500 kg/sqm (distributed)',
      'Material: Mild Steel, Galvanized Steel, Stainless Steel',
      'Finish: Hot-dip Galvanized, Painted',
      'Flooring: Steel Grating, Checkered Plate'
    ],
    standards: [
      'IS 800: General construction in steel',
      'IS 2062: Steel for general structural purposes',
      'ANSI/NAAMM MBG 531: Metal Bar Grating Manual',
      'OSHA 1910.25: Stairways',
      'NBC 2016: National Building Code of India (Safety aspects)'
    ],
    hsnCodes: ['73089090'],
    orderSizes: '1-1000 linear meters',
    importCountries: [
      'China',
      'UAE',
      'Germany',
      'South Korea',
      'Malaysia',
      'Turkey',
      'Taiwan'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india'
    ],
    priceRange: '₹800-₹2,500 per linear ft',
    applications: [
      'Industrial plant access',
      'Machinery maintenance access',
      'Pipe rack walkways',
      'Conveyor system access',
      'Building roof access',
      'Bridge maintenance access'
    ],
    challenges: [
      'Ensuring structural stability and load-bearing capacity',
      'Corrosion protection in harsh environments',
      'Compliance with safety standards (guardrails, toe boards)',
      'Modular design for easier installation and future expansion'
    ],
    marketTrend: 'The market for industrial walkways is expanding due to stringent safety regulations and the surge in manufacturing and infrastructure projects. The NIP and PLI schemes are driving new factory setups and expansions, leading to increased demand for safe and efficient access solutions. Growing awareness about occupational health and safety in industrial settings further propels the adoption of well-designed steel walkways, supporting India\'s industrial growth.'
  },
  {
    slug: 'flanges-india',
    name: 'Flanges',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Flanges are disc-shaped or ring-shaped components used to connect pipes, valves, pumps, and other equipment in a piping system, creating a non-permanent, bolted connection. They are typically fabricated from carbon steel, stainless steel, or alloy steel through forging or casting. Flanges facilitate maintenance, inspection, and modification of piping systems, ensuring leak-proof connections under various pressure and temperature conditions through the use of gaskets and bolts.',
    industries: [
      'Oil & Gas',
      'Chemical',
      'Petrochemicals',
      'Power & Energy',
      'Water Treatment',
      'Manufacturing'
    ],
    grades: [
      'ASTM A105 (Carbon Steel)',
      'ASTM A182 F304L (Stainless Steel)',
      'ASTM A182 F316L (Stainless Steel)',
      'IS 2062 E250BR',
      'ASTM A350 LF2 (Low Temperature Carbon Steel)',
      'ASTM A694 F65 (High Yield Carbon Steel)'
    ],
    specifications: [
      'Size: 1/2 inch to 60 inch',
      'Pressure Class: 150#, 300#, 600#, 900#, 1500#, 2500#',
      'Facing Type: Raised Face (RF), Flat Face (FF), Ring Type Joint (RTJ)',
      'Type: Weld Neck, Slip-On, Blind, Socket Weld, Threaded, Lap Joint',
      'Material: Carbon Steel, Stainless Steel, Alloy Steel'
    ],
    standards: [
      'ASME B16.5: Pipe Flanges and Flanged Fittings',
      'ASME B16.47: Large Diameter Steel Flanges',
      'IS 2062: Steel for general structural purposes',
      'MSS SP-44: Steel Pipeline Flanges',
      'API 6A: Wellhead and Christmas Tree Equipment'
    ],
    hsnCodes: ['73079100', '73079390'],
    orderSizes: '1-10,000 pieces',
    importCountries: [
      'China',
      'Italy',
      'Germany',
      'South Korea',
      'Japan',
      'USA',
      'Taiwan'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india'
    ],
    priceRange: '₹100-₹50,000 per piece (size dependent)',
    applications: [
      'Pipeline connections',
      'Valve installations',
      'Pump connections',
      'Heat exchanger connections',
      'Pressure vessel connections',
      'Instrumentation connections'
    ],
    challenges: [
      'Ensuring proper sealing and leak prevention',
      'Correct material selection for corrosive environments',
      'Precision machining for accurate dimensions',
      'Maintaining stock for a wide range of sizes and ratings'
    ],
    marketTrend: 'The market for flanges in India is significantly driven by the expansion of the oil & gas, petrochemical, and power generation sectors. Investments in new refineries, power plants, and chemical processing units, along with infrastructure development under the NIP, fuel steady demand. The focus on replacing aging infrastructure and ensuring operational safety in existing plants also contributes to sustained growth. Quality and adherence to international standards are paramount.'
  },
  {
    slug: 'platforms-india',
    name: 'Platforms',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Platforms are elevated flat surfaces, constructed primarily from steel, providing safe and accessible working areas for personnel, machinery, or equipment in industrial, commercial, and public environments. They are typically supported by structural steel frameworks and feature flooring made of steel gratings, checkered plates, or ribbed sheets, often equipped with handrails, toe plates, and stairways for safe access. Platforms are customized to specific load requirements and operational needs, enhancing safety and efficiency.',
    industries: [
      'Industrial',
      'Manufacturing',
      'Warehousing',
      'Infrastructure',
      'Oil & Gas',
      'Power & Energy'
    ],
    grades: [
      'IS 2062 E250BR',
      'IS 2062 E350BR',
      'ASTM A36',
      'ASTM A572 Grade 50',
      'JIS G3101 SS400',
      'IS 513 (Cold Rolled Steel)'
    ],
    specifications: [
      'Load Capacity: 250kg/sqm to 2000kg/sqm',
      'Height: 1 meter to 20 meters',
      'Material: Mild Steel, Galvanized Steel, Stainless Steel',
      'Finish: Hot-dip Galvanized, Painted, Powder Coated',
      'Access: Stairways, Ladders, Ramps'
    ],
    standards: [
      'IS 800: General construction in steel',
      'IS 2062: Steel for general structural purposes',
      'NBC 2016: National Building Code of India (Safety aspects)',
      'OSHA 1910.23: Guarding floor and wall openings',
      'BS EN 1090: Execution of steel structures'
    ],
    hsnCodes: ['73089090'],
    orderSizes: '1-500 square meters',
    importCountries: [
      'China',
      'UAE',
      'Germany',
      'South Korea',
      'Malaysia',
      'Turkey',
      'Taiwan'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india'
    ],
    priceRange: '₹1,000-₹4,000 per sq ft',
    applications: [
      'Machine operation platforms',
      'Maintenance access platforms',
      'Mezzanine floors',
      'Loading docks',
      'Observation platforms',
      'Stage risers'
    ],
    challenges: [
      'Ensuring structural integrity and stability under dynamic loads',
      'Adherence to fall protection and safety standards',
      'Modular design for scalability and relocation',
      'Ease of assembly and dismantling for temporary structures'
    ],
    marketTrend: 'The market for steel platforms is witnessing significant growth, driven by industrial expansion, particularly in manufacturing and warehousing sectors. The government\'s focus on \'Make in India\' and the PLI scheme encourages factory setups, boosting demand for safe and efficient working access. Rising awareness of workplace safety and the need for organized operational spaces in diverse industries contribute to a robust market outlook, aligning with India\'s industrial policy push.'
  },
  {
    slug: 'ladders-india',
    name: 'Ladders',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Steel ladders are vertical or inclined structures consisting of two side rails joined at intervals by rungs or steps, primarily used to access elevated areas. They are fabricated from various steel grades to provide strength, stability, and corrosion resistance, essential for industrial, construction, and maintenance applications. Designs range from fixed cage ladders for rooftop access to portable single or double-rung models, adhering to strict safety and ergonomic standards for user protection.',
    industries: [
      'Construction',
      'Manufacturing',
      'Oil & Gas',
      'Power Generation',
      'Warehousing',
      'Marine'
    ],
    grades: [
      'IS 2062 E250BR',
      'IS 2062 E350BR',
      'ASTM A36',
      'ASTM A572 Grade 50',
      'AISI 304',
      'AISI 316',
      'IS 4923 Fe 460',
      'IS 800 (for design considerations)'
    ],
    specifications: [
      'Height: 1.5m-30m',
      'Rung Spacing: 250mm-300mm',
      'Load Capacity: 150kg-300kg',
      'Material Thickness: 3mm-8mm',
      'Surface Finish: Hot-dip Galvanized, Painted, Powder Coated'
    ],
    standards: [
      'IS 10699 (Fixed Ladders)',
      'IS 3696 Part 1 & 2 (Scaffolds and Ladders)',
      'OSHA 1910.23 (General Requirements)',
      'ISO 14122-4 (Fixed Ladders)',
      'EN 131 (Portable Ladders)'
    ],
    hsnCodes: ['7308.90.90'],
    orderSizes: '5 units-500 units',
    importCountries: [
      'China',
      'Germany',
      'USA',
      'South Korea',
      'Italy',
      'Turkey',
      'Brazil'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india'
    ],
    priceRange: '₹2,500-₹75,000 per unit',
    applications: [
      'Rooftop access for buildings',
      'Maintenance platforms in factories',
      'Access to mezzanines and elevated storage',
      'Confined space entry in tanks',
      'Emergency exits in industrial facilities',
      'Ship and offshore vessel access'
    ],
    challenges: [
      'Ensuring compliance with diverse safety standards',
      'Corrosion resistance in harsh environments',
      'Logistics for oversized fabricated units',
      'Accurate load bearing capacity calculation'
    ],
    marketTrend: 'Demand for industrial ladders is driven by infrastructure development under initiatives like Smart Cities and the National Infrastructure Pipeline. Manufacturers are focusing on modular designs and advanced coatings for enhanced durability and safety. Integration with automated systems in warehouses is also leading to innovation in access solutions.'
  },
  {
    slug: 'staircases-india',
    name: 'Staircases',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Steel staircases are permanent structures providing vertical circulation between different levels within buildings or industrial facilities. They are engineered from structural steel components like beams, channels, and plates, offering superior strength, fire resistance, and design flexibility compared to other materials. Common types include straight run, L-shaped, U-shaped, and spiral stairs, all designed to meet specific architectural, ergonomic, and safety requirements, often incorporating non-slip treads and handrails.',
    industries: [
      'Commercial & Residential Construction',
      'Industrial & Manufacturing',
      'Public Infrastructure',
      'Retail & Hospitality',
      'Education',
      'Healthcare'
    ],
    grades: [
      'IS 2062 E250GR',
      'IS 2062 E350GR',
      'ASTM A36',
      'ASTM A500 Grade B',
      'AISI 304 (for aesthetic/corrosion resistance)',
      'IS 4923 Fe 410 (for pipe sections)',
      'IS 800 (for structural design)',
      'IS 808 (dimensions for hot rolled steel sections)'
    ],
    specifications: [
      'Rise: 150mm-200mm',
      'Run: 250mm-300mm',
      'Width: 900mm-2000mm',
      'Finish: Powder Coated, Painted, Galvanized, Etched',
      'Load Bearing: 5.0 kN/m² - 10.0 kN/m²'
    ],
    standards: [
      'IS 800 (Code of Practice for General Construction in Steel)',
      'National Building Code 2016 (Part 4 Fire Safety, Part 7 Construction Materials)',
      'ISO 14122-3 (Means of access to machinery)',
      'ASTM E84 (Surface Burning Characteristics)',
      'BS 5395 (Stairs, Ladders and Walkways)'
    ],
    hsnCodes: ['7308.90.90'],
    orderSizes: '1 unit-100 units',
    importCountries: [
      'China',
      'Germany',
      'Italy',
      'USA',
      'Spain',
      'South Korea',
      'Taiwan'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india'
    ],
    priceRange: '₹15,000-₹5,00,000 per unit',
    applications: [
      'Internal and external building access',
      'Emergency exits in multi-storey buildings',
      'Access to elevated machinery platforms',
      'Architectural statements in commercial spaces',
      'Industrial plant personnel access',
      'Public access in metro stations and flyovers'
    ],
    challenges: [
      'Achieving precise architectural aesthetics',
      'Ensuring fire safety and egress compliance',
      'Complex on-site assembly and installation',
      'Compliance with varying building codes'
    ],
    marketTrend: 'The demand for pre-fabricated steel staircases is growing due to faster installation times and cost-effectiveness in large construction projects. Smart City initiatives are pushing for integrated, functional, and aesthetically pleasing public access structures. The PLI Scheme for steel is also encouraging domestic manufacturing capacity and quality improvements for structural components.'
  },
  {
    slug: 'support-structures-india',
    name: 'Support Structures',
    category: 'Steel Fabrication & Structures',
    categorySlug: 'steel-fabrication',
    industrySlug: 'fabrication',
    subIndustrySlug: 'steel-structures',
    definition: 'Steel support structures refer to a broad category of fabricated steel frameworks designed to bear and distribute loads, providing stability and foundational support for various equipment, platforms, pipelines, and building elements. These include columns, beams, trusses, braces, and custom-engineered frames, crucial for maintaining the integrity and functionality of industrial facilities, infrastructure projects, and building complexes. They are meticulously designed and fabricated to withstand specific static and dynamic loads, seismic forces, and environmental conditions.',
    industries: [
      'Oil & Gas',
      'Power Generation',
      'Chemical Processing',
      'Infrastructure',
      'Mining',
      'Renewable Energy',
      'Telecommunications'
    ],
    grades: [
      'IS 2062 E250B',
      'IS 2062 E350C',
      'ASTM A36',
      'ASTM A572 Grade 50',
      'IS 4923 Fe 460',
      'IS 1161 YSt 210',
      'IS 800 (for design principles)',
      'IS 2062 (for structural steel)'
    ],
    specifications: [
      'Section Type: I-beam, H-beam, Channel, Angle, RHS, SHS',
      'Length: 0.5m-30m segments',
      'Load Capacity: 10 kN-10,000 kN',
      'Surface Treatment: Hot-dip Galvanized, Epoxy Coated, Primer Painted',
      'Connection Type: Welded, Bolted'
    ],
    standards: [
      'IS 800 (Code of Practice for General Construction in Steel)',
      'BIS 1984 (Specification for Steel Structures)',
      'ASTM A6 (General Requirements for Rolled Structural Steel Bars)',
      'EN 1090-2 (Execution of Steel Structures)',
      'ISO 12944 (Corrosion Protection by Paint Systems)'
    ],
    hsnCodes: ['7308.90.90', '7308.40.00'],
    orderSizes: '1 Ton-5000 Tons',
    importCountries: [
      'China',
      'South Korea',
      'Japan',
      'Germany',
      'USA',
      'Turkey',
      'Vietnam'
    ],
    relatedSlugs: [
      'ms-structures-india',
      'steel-ducting-india',
      'profiled-sheets-india',
      'perforated-sheets-india',
      'cable-trays-india'
    ],
    priceRange: '₹60,000-₹90,000 per Ton',
    applications: [
      'Pipe racks in refineries and chemical plants',
      'Equipment skids and platforms',
      'Support for conveyors in material handling',
      'Solar panel mounting structures',
      'Telecommunication towers and masts',
      'Foundation supports for heavy machinery'
    ],
    challenges: [
      'Design optimization for complex load cases',
      'Corrosion protection in aggressive environments',
      'Adherence to seismic design codes',
      'Logistical challenges for large, heavy components'
    ],
    marketTrend: 'The growth in capital expenditure across manufacturing and infrastructure sectors, driven by government policies like the National Infrastructure Pipeline, is fueling demand for robust steel support structures. There\'s an increasing emphasis on modular construction and pre-engineered solutions to reduce project timelines. Technological advancements in design software and fabrication techniques are enhancing efficiency and precision.'
  },
];

// ─── ROAD SAFETY & INFRASTRUCTURE ───
const roadSafetyProducts: DemandProduct[] = [
  {
    slug: 'crash-barriers-india',
    name: 'Crash Barriers',
    category: 'Road Safety & Infrastructure',
    categorySlug: 'road-safety',
    industrySlug: 'infrastructure',
    subIndustrySlug: 'road-safety',
    definition: 'Crash barriers are passive safety devices engineered to prevent vehicles from leaving the roadway or crossing into opposing traffic lanes, thereby minimizing the severity of accidents. They are typically made from steel, concrete, or often a combination thereof, designed to absorb kinetic energy upon impact and safely redirect errant vehicles. Their strategic placement on highways, expressways, and hazardous road sections is critical for mitigating accident fatalities and injuries, aligning with India\'s National Infrastructure Pipeline\'s emphasis on road safety upgrades.',
    industries: [
      'Road Construction',
      'Highway Development',
      'Urban Infrastructure',
      'Automotive Safety',
      'Civil Engineering'
    ],
    grades: [
      'W-beam Steel (IS 16778)',
      'Thrie-beam Steel (IS 16778)',
      'Concrete New Jersey Barrier (IRC:SP:084)',
      'Wire Rope Safety Barrier (IRC:SP:085)',
      'High Containment Barrier (EN 1317-2)',
      'Low Containment Barrier (EN 1317-2)'
    ],
    specifications: [
      'Barrier Height: 0.7m-1.2m',
      'Material Thickness: 2.67mm-4.0mm',
      'Post Spacing: 1.5m-4.0m',
      'Deflection During Impact: 0.5m-2.5m'
    ],
    standards: [
      'IS 16778:2018 (Steel Crash Barriers)',
      'IRC:SP:084-2019 (Concrete Crash Barriers)',
      'IRC:SP:085-2019 (Wire Rope Barriers)',
      'EN 1317 (European Standard)',
      'AASHTO M 180 (USA Standard)'
    ],
    hsnCodes: ['73089090'],
    orderSizes: '100 meters - 10,000+ meters',
    importCountries: [
      'China',
      'South Korea',
      'Germany',
      'USA',
      'Turkey',
      'Italy'
    ],
    relatedSlugs: [
      'guardrails-india',
      'road-studs-india',
      'traffic-cones-india',
      'bollards-india',
      'traffic-signs-india'
    ],
    priceRange: '₹2,500-₹8,000 per meter',
    applications: [
      'National Highways',
      'State Highways',
      'Expressways',
      'Mountain Roads',
      'Bridge Approaches',
      'High-risk Curves'
    ],
    challenges: [
      'High upfront installation costs',
      'Regular maintenance requirement post-impact',
      'Logistics for large-scale deployment',
      'Ensuring proper anchorage for various soil conditions'
    ],
    marketTrend: 'The market for crash barriers in India is experiencing steady growth, driven by aggressive infrastructure development targets under schemes like the Bharatmala Pariyojana and increased focus on road safety regulations. Innovations in material science and modular prefabrication techniques are improving installation efficiency and overall barrier performance, contributing to broader adoption on critical road networks across the country.'
  },
  {
    slug: 'guardrails-india',
    name: 'Guardrails',
    category: 'Road Safety & Infrastructure',
    categorySlug: 'road-safety',
    industrySlug: 'infrastructure',
    subIndustrySlug: 'road-safety',
    definition: 'Guardrails are protective barriers, often made of steel or timber, installed along the sides of roads, bridges, and other structures to prevent vehicles from veering off course or into dangerous areas. They are designed to absorb and redirect the kinetic energy of an impacting vehicle, reducing the severity of accidents and protecting occupants. While similar to crash barriers, guardrails typically serve to demarcate road boundaries and offer a lower level of containment compared to more robust crash barrier systems.',
    industries: [
      'Road Construction',
      'Civil Engineering',
      'Landscaping',
      'Bridge Construction',
      'Public Safety'
    ],
    grades: [
      'W-beam Galvanized Steel (IS 16778)',
      'Thrie-beam Galvanized Steel (IS 16778)',
      'Timber Guardrails (IRC:SP:083)',
      'Cable Guardrails (IRC:SP:085)',
      'Semi-rigid Guardrail (EN 1317-2)',
      'Flexible Guardrail (EN 1317-2)'
    ],
    specifications: [
      'Beam Thickness: 2.67mm-3.17mm',
      'Galvanization: 550 gm/m² - 610 gm/m²',
      'Post Length: 1.5m-2.2m',
      'Overall Height: 600mm-800mm'
    ],
    standards: [
      'IS 16778:2018 (Steel Guardrails)',
      'IRC:SP:083-2019 (Timber Guardrails)',
      'IRC:SP:085-2019 (Cable Barrier Systems)',
      'EN 1317 (European Standard)',
      'AASHTO M 180 (USA Standard)'
    ],
    hsnCodes: ['73089090'],
    orderSizes: '50 meters - 5,000+ meters',
    importCountries: [
      'China',
      'South Korea',
      'Germany',
      'Turkey',
      'USA'
    ],
    relatedSlugs: [
      'crash-barriers-india',
      'road-studs-india',
      'traffic-cones-india',
      'bollards-india',
      'traffic-signs-india'
    ],
    priceRange: '₹1,800-₹5,500 per meter',
    applications: [
      'Rural Roads',
      'Urban Arterials',
      'Residential Areas',
      'Bridge Parapets',
      'Embankments',
      'Parking Lots'
    ],
    challenges: [
      'Corrosion in coastal or high-humidity areas',
      'Aesthetics in urban environments',
      'Damage from minor impacts requiring repair',
      'Installation complexity on uneven terrain'
    ],
    marketTrend: 'The Indian market for guardrails is robust, propelled by a strong emphasis on maintaining and upgrading existing road networks under central and state government initiatives. The demand for durable, galvanized steel guardrails is particularly high, driven by their longevity and minimal maintenance requirements. Adoption of modular systems is also increasing to expedite project timelines.'
  },
  {
    slug: 'road-studs-india',
    name: 'Road Studs',
    category: 'Road Safety & Infrastructure',
    categorySlug: 'road-safety',
    industrySlug: 'infrastructure',
    subIndustrySlug: 'road-safety',
    definition: 'Road studs are reflective or illuminated markers embedded in the road surface to enhance visibility and delineate traffic lanes, especially during nighttime or adverse weather conditions. They serve as crucial navigational aids for drivers, providing advanced warning of curves, intersections, and changes in road alignment. Categorized by their material (aluminum, plastic) and illumination method (reflective, solar-powered LED), road studs significantly contribute to reducing nighttime accidents on Indian roads by improving driver perception and reaction time.',
    industries: [
      'Road Construction',
      'Traffic Management',
      'Urban Planning',
      'Automotive Safety',
      'Civil Engineering'
    ],
    grades: [
      'Aluminum Reflector (IS 12891)',
      'Plastic Reflector (IS 12891)',
      'Solar LED Stud (IRC:67)',
      'Cat\'s Eye (BS 873)',
      'Raised Pavement Marker Type I (ASTM D4280)',
      'Raised Pavement Marker Type II (ASTM D4280)'
    ],
    specifications: [
      'Compressive Strength: >15 tons',
      'Reflectivity: >300 mcd/lux',
      'Working Temperature: -20°C to +70°C',
      'Visibility Distance: >200 meters'
    ],
    standards: [
      'IS 12891:1990 (Plastic Road Studs)',
      'IRC:67-2012 (Traffic Signs Guidelines)',
      'ASTM D4280 (Standard Specification for Nonreflective Raised Pavement Markers)',
      'BS EN 1463 (Road Marking Materials)',
      'CE Certified'
    ],
    hsnCodes: ['39269099', '76169990'],
    orderSizes: '50 units - 10,000+ units',
    importCountries: [
      'China',
      'Taiwan',
      'South Korea',
      'Germany',
      'USA'
    ],
    relatedSlugs: [
      'crash-barriers-india',
      'guardrails-india',
      'traffic-cones-india',
      'bollards-india',
      'traffic-signs-india'
    ],
    priceRange: '₹150-₹800 per piece',
    applications: [
      'Highway Delineation',
      'Median Openings',
      'Hazardous Curves',
      'Pedestrian Crossings',
      'Tunnels',
      'Airport Runways'
    ],
    challenges: [
      'Damage from heavy vehicle traffic',
      'Accumulation of dirt reducing reflectivity',
      'Battery life degradation for solar studs',
      'Ensuring proper adhesion to road surface'
    ],
    marketTrend: 'The demand for road studs in India is steadily rising, driven by increased public and government focus on road safety and improved nighttime visibility. The adoption of solar-powered LED studs is gaining traction, particularly for remote highways and areas with unreliable power. Smart Cities initiatives are also promoting sophisticated road marking solutions, including intelligent studs, to enhance urban traffic management.'
  },
  {
    slug: 'traffic-cones-india',
    name: 'Traffic Cones',
    category: 'Road Safety & Infrastructure',
    categorySlug: 'road-safety',
    industrySlug: 'infrastructure',
    subIndustrySlug: 'road-safety',
    definition: 'Traffic cones are portable, typically conical-shaped markers made from durable, brightly colored plastic (often PVC or EVA) with reflective bands, used to temporarily redirect traffic, warn of hazards, or delineate work zones. They are lightweight, stackable for easy storage, and designed to provide high visibility in various lighting conditions. Their primary function is to enhance safety for both motorists and workers by clearly indicating temporary changes or obstacles on roadways, construction sites, and public events.',
    industries: [
      'Road Construction',
      'Traffic Management',
      'Event Management',
      'Utility Services',
      'Logistics'
    ],
    grades: [
      'PVC Cone (IRC:SP:55)',
      'EVA Cone (IRC:SP:55)',
      'Recycled Plastic Cone',
      'Reflective Sleeve Type A',
      'Reflective Sleeve Type B',
      'Cone with Base Weight'
    ],
    specifications: [
      'Height: 450mm-1000mm',
      'Base Size: 250mm x 250mm to 400mm x 400mm',
      'Weight: 0.8kg-6.0kg',
      'Reflective Sheeting: High Intensity Grade'
    ],
    standards: [
      'IRC:SP:55-2014 (Road Traffic Safety Management)',
      'MoRTH Specifications (Ministry of Road Transport and Highways)',
      'BIS Approved Materials (for reflectivity)',
      'EN 13422 (European Standard)',
      'ANSI/ASME A10.4 (USA Standard)'
    ],
    hsnCodes: ['39269099'],
    orderSizes: '20 units - 5,000+ units',
    importCountries: [
      'China',
      'Malaysia',
      'Taiwan',
      'UAE'
    ],
    relatedSlugs: [
      'crash-barriers-india',
      'guardrails-india',
      'road-studs-india',
      'bollards-india',
      'traffic-signs-india'
    ],
    priceRange: '₹180-₹600 per piece',
    applications: [
      'Construction Zones',
      'Road Diversions',
      'Accident Sites',
      'Event Parking',
      'Utility Work',
      'Emergency Lane Closures'
    ],
    challenges: [
      'Prone to being knocked over by wind or vehicles',
      'Fading of color/reflectivity over time',
      'Theft or vandalism in public spaces',
      'Storage and transportation logistics for large quantities'
    ],
    marketTrend: 'The Indian market for traffic cones is stable, driven by continuous infrastructure projects, urban development, and stringent safety norms for temporary work zones. Manufacturers are increasingly focusing on cones made from recycled materials and those with enhanced UV resistance for longer outdoor life. Demand is consistently high from government contractors and event management companies.'
  },
  {
    slug: 'bollards-india',
    name: 'Bollards',
    category: 'Road Safety & Infrastructure',
    categorySlug: 'road-safety',
    industrySlug: 'infrastructure',
    subIndustrySlug: 'road-safety',
    definition: 'Bollards are short, sturdy, vertical posts used to control or direct traffic, protect pedestrians and property, or delineate public spaces. They can be fixed, removable, retractable, or crash-rated, and are typically made from steel, concrete, or polymer. Their primary purpose is to provide physical barriers against unauthorized vehicle access or impact, enhancing security and safety in urban environments and critical infrastructure zones. The deployment of bollards is increasingly relevant in India\'s \'Smart Cities\' initiative for pedestrian-friendly urban planning.',
    industries: [
      'Urban Development',
      'Security',
      'Traffic Management',
      'Civil Engineering',
      'Architectural Landscaping'
    ],
    grades: [
      'Steel Fixed Bollard (IS 2062)',
      'Concrete Decorative Bollard (IS 456)',
      'Flexible Polymer Bollard',
      'Automatic Retractable Bollard (EN 1317-3)',
      'Crash-Rated K4/K8/K12 Bollard (ASTM F2656)',
      'LED Illuminated Bollard'
    ],
    specifications: [
      'Height: 700mm-1200mm',
      'Diameter: 100mm-300mm',
      'Material Thickness: 3mm-10mm (for steel)',
      'Impact Resistance: Up to 150KN'
    ],
    standards: [
      'IS 2062 (Steel for Bollards)',
      'IS 456 (Concrete for Bollards)',
      'ASTM F2656 (Crash Test Standard)',
      'CPNI/PAS 68 (UK Security Standard)',
      'EN 1317-3 (Vehicle Restraint Systems)',
      'IRC:SP:103 (Urban Road Planning Guidelines)'
    ],
    hsnCodes: ['73089090', '68109900'],
    orderSizes: '5 units - 1,000+ units',
    importCountries: [
      'China',
      'Europe (Italy, UK)',
      'USA',
      'Australia'
    ],
    relatedSlugs: [
      'crash-barriers-india',
      'guardrails-india',
      'road-studs-india',
      'traffic-cones-india',
      'traffic-signs-india'
    ],
    priceRange: '₹1,500-₹45,000 per piece',
    applications: [
      'Pedestrian Zones',
      'Building Entrances',
      'Parks and Plazas',
      'High-Security Areas',
      'Traffic Calming',
      'Parking Management'
    ],
    challenges: [
      'High installation cost for crash-rated types',
      'Maintenance of retractable mechanisms',
      'Aesthetics integration into urban design',
      'Ensuring proper visibility and warning for drivers'
    ],
    marketTrend: 'The bollard market in India is expanding, driven by increasing focus on urban beautification, pedestrian safety, and security infrastructure in smart cities. Demand for both decorative and high-security, crash-rated bollards is on the rise as public spaces and critical infrastructure require enhanced protection. Indian manufacturers are innovating with smarter, aesthetically appealing and durable solutions.'
  },
  {
    slug: 'traffic-signs-india',
    name: 'Traffic Signs',
    category: 'Road Safety & Infrastructure',
    categorySlug: 'road-safety',
    industrySlug: 'infrastructure',
    subIndustrySlug: 'road-safety',
    definition: 'Traffic signs are visual devices displaying symbols, words, or images, erected along roadsides or overhead, to provide drivers with regulatory, warning, or guidance information. They are crucial for maintaining traffic flow, preventing accidents, and ensuring road user safety. Made from reflective sheeting on aluminum or steel substrates, these signs must adhere to strict international and national standards for legibility, durability, and retroreflectivity, aligning with the Ministry of Road Transport and Highways\' mandate for standardized road signage across India.',
    industries: [
      'Road Construction',
      'Traffic Management',
      'Urban Development',
      'Public Safety',
      'Civil Engineering'
    ],
    grades: [
      'Engineering Grade Reflective (Type I)',
      'High Intensity Prismatic (Type III/IV)',
      'Diamond Grade VIP (Type VIII/IX)',
      'Aluminum Substrate (IS 737)',
      'Galvanized Steel Substrate (IS 2062)',
      'Retroreflective Sheeting (IS 6245)'
    ],
    specifications: [
      'Sheeting Durability: 7-12 years',
      'Aluminum Thickness: 2mm-3mm',
      'Retroreflectivity: As per IRC:67-2012 classification',
      'Wind Load Resistance: As per design calculations'
    ],
    standards: [
      'IRC:67-2012 (Code of Practice for Road Signs)',
      'MoRTH Specifications (Section 800 - Traffic Signs)',
      'IS 6245 (Retroreflective Sheeting)',
      'ASTM D4956 (Reflective Sheeting for Traffic Control)',
      'EN 12899-1 (Fixed Vertical Road Traffic Signs)'
    ],
    hsnCodes: ['83100090', '76169990'],
    orderSizes: '10 units - 5,000+ units',
    importCountries: [
      'China',
      'USA (3M)',
      'Germany (Avery Dennison)',
      'Japan',
      'South Korea'
    ],
    relatedSlugs: [
      'crash-barriers-india',
      'guardrails-india',
      'road-studs-india',
      'traffic-cones-india',
      'bollards-india'
    ],
    priceRange: '₹800-₹15,000 per piece (depending on size/type)',
    applications: [
      'National Highways',
      'Urban Roads',
      'Industrial Zones',
      'Construction Sites',
      'Parking Facilities',
      'Rural Road Networks'
    ],
    challenges: [
      'Vandalism and theft',
      'Fading of reflective material over time',
      'Ensuring proper visibility and placement',
      'Compliance with evolving standards and specifications'
    ],
    marketTrend: 'The market for traffic signs in India is experiencing consistent growth, driven by ambitious highway expansion projects (Bharatmala Pariyojana) and renewed focus on upgrading existing road infrastructure. There is a rising demand for high-performance reflective materials and digitally-integrated smart signs, particularly in urban corridors, enhancing traffic management and real-time information dissemination.'
  },
  {
    slug: 'road-marking-materials-india',
    name: 'Road Marking Materials',
    category: 'Road Safety & Infrastructure',
    categorySlug: 'road-safety',
    industrySlug: 'infrastructure',
    subIndustrySlug: 'road-safety',
    definition: 'Road marking materials are specialized paints, thermoplastics, or preformed tapes applied to road surfaces to provide visual guidance and regulatory information to drivers and pedestrians. These markings define lanes, indicate turning movements, highlight pedestrian crossings, and warn of hazards. Key properties include durability, retroreflectivity, and skid resistance, which are crucial for enhancing road safety, particularly at night and in wet conditions. Adherence to BIS and IRC standards is critical for performance and longevity in India\'s diverse climatic conditions.',
    industries: [
      'Road Construction',
      'Traffic Management',
      'Urban Infrastructure',
      'Airport Infrastructure',
      'Civil Engineering'
    ],
    grades: [
      'Thermoplastic Paint (IS 16423)',
      'Cold Plastic/MMA (IS 16423)',
      'Waterborne Paint (IS 16423)',
      'Preformed Thermoplastic Tape',
      'Solvent-based Paint (IS 16423)',
      'Glass Beads (IS 20040)'
    ],
    specifications: [
      'Retroreflectivity: >150 mcd/m2/lux (initial)',
      'Skid Resistance: >45 BPN',
      'Drying Time: <20 minutes (thermoplastic)',
      'Film Thickness: 1.5mm-3.0mm (thermoplastic)'
    ],
    standards: [
      'IS 16423:2015 (Thermoplastic Road Marking Materials)',
      'IRC:35-2015 (Code of Practice for Road Markings)',
      'IS 20040:2021 (Glass Beads for Road Markings)',
      'EN 1436 (Road Marking Materials - Performance for Road Users)',
      'ASTM D4797 (Standard Test Method for Thermoplastic)'
    ],
    hsnCodes: ['32089090', '39079990'],
    orderSizes: '100 kg - 100+ tons',
    importCountries: [
      'China',
      'USA',
      'Germany',
      'Japan',
      'South Korea'
    ],
    relatedSlugs: [
      'crash-barriers-india',
      'guardrails-india',
      'road-studs-india',
      'traffic-cones-india',
      'bollards-india'
    ],
    priceRange: '₹50-₹250 per kg (material only)',
    applications: [
      'Highways',
      'City Roads',
      'Parking Lots',
      'Airports',
      'Industrial Areas',
      'Pedestrian Crossings'
    ],
    challenges: [
      'Degradation due to heavy traffic and weather',
      'Inconsistent application quality',
      'Adhesion issues on certain road surfaces',
      'Environmental impact of certain solvent-based paints'
    ],
    marketTrend: 'The road marking materials market in India is expanding rapidly, driven by extensive road network development under schemes like the National Infrastructure Pipeline and increased traffic safety awareness. There is a strong shift towards durable, highly retroreflective, and environmentally friendly materials like thermoplastic and cold plastic. Smart city initiatives are also promoting advanced, long-lasting markings.'
  },
  {
    slug: 'street-light-poles-india',
    name: 'Street Light Poles',
    category: 'Road Safety & Infrastructure',
    categorySlug: 'road-safety',
    industrySlug: 'infrastructure',
    subIndustrySlug: 'road-safety',
    definition: 'Street light poles are structural supports, typically made of galvanized steel, aluminum, or concrete, designed to elevate and position luminaires for public lighting. They are essential for illuminating roads, pathways, public spaces, and industrial areas, enhancing visibility, safety, and security during nighttime hours. Key considerations include height, material strength, aesthetic design, and resistance to environmental factors. The \'Smart Cities Mission\' in India extensively promotes energy-efficient LED lighting supported by robust, smart-enabled poles.',
    industries: [
      'Urban Development',
      'Electrical Infrastructure',
      'Civil Engineering',
      'Road Construction',
      'Public Utilities'
    ],
    grades: [
      'Hot Dip Galvanized Steel (IS 2062 Gr. A)',
      'Aluminum Alloy (IS 2704)',
      'Prestressed Concrete (IS 1678)',
      'Octagonal Tapered Pole',
      'Conical Tapered Pole',
      'High Mast Pole (IS 875)'
    ],
    specifications: [
      'Height: 3m-12m (Street Light), 15m-30m (High Mast)',
      'Base Plate Thickness: 10mm-25mm',
      'Shaft Thickness: 3mm-8mm',
      'Wind Load Resistance: Up to 200 km/hr'
    ],
    standards: [
      'IS 2062:2011 (Structural Steel)',
      'IS 1678:1978 (Poles for Overhead Power Traction)',
      'IS 875 (Part 3):1987 (Wind Loads)',
      'ASTM A123 (Hot-Dip Galvanizing)',
      'IES RP-8-14 (Roadway Lighting)'
    ],
    hsnCodes: ['73089090', '76109090'],
    orderSizes: '5 units - 2,000+ units',
    importCountries: [
      'China',
      'UAE',
      'Germany',
      'Turkey',
      'South Korea'
    ],
    relatedSlugs: [
      'crash-barriers-india',
      'guardrails-india',
      'road-studs-india',
      'traffic-cones-india',
      'bollards-india'
    ],
    priceRange: '₹5,000-₹45,000 per pole (standard height)',
    applications: [
      'Highways',
      'Urban Streets',
      'Public Parks',
      'Industrial Estates',
      'Residential Colonies',
      'Bridge Lighting'
    ],
    challenges: [
      'Corrosion in coastal environments',
      'Damage from vehicle collisions',
      'Ensuring stability in high wind zones',
      'Integration with smart city technologies'
    ],
    marketTrend: 'The market for street light poles in India is experiencing significant growth, primarily fueled by the \'Smart Cities Mission\' and various state-level urban development and rural electrification projects. There\'s a strong demand for galvanized steel poles with integrated smart features, such as IoT sensors and CCTV, facilitating adaptive lighting and improved urban management. The \'Make in India\' initiative is encouraging domestic manufacturing capabilities.'
  },
  {
    slug: 'drainage-systems-india',
    name: 'Drainage Systems',
    category: 'Road Safety & Infrastructure',
    categorySlug: 'road-safety',
    industrySlug: 'infrastructure',
    subIndustrySlug: 'road-safety',
    definition: 'Drainage systems for roads and infrastructure comprise a network of components designed to effectively collect, channel, and discharge surface runoff and subsurface water away from the road surface and subgrade. These systems include drains, culverts, catch basins, gratings, and pipes, primarily constructed from concrete, HDPE, or PVC. Their critical role is to prevent water accumulation, which can cause hydroplaning, erosion, and structural damage to roads, thereby ensuring road longevity and traffic safety. Proper drainage is a fundamental aspect of resilient infrastructure development under schemes like Bharatmala Pariyojana.',
    industries: [
      'Road Construction',
      'Civil Engineering',
      'Urban Planning',
      'Water Management',
      'Infrastructure Development'
    ],
    grades: [
      'Precast Concrete Drains (IS 456)',
      'HDPE Drainage Pipes (IS 4984)',
      'PVC Drainage Pipes (IS 4985)',
      'Cast Iron Gratings (IS 1729)',
      'RCC Culvert Pipes (IS 458)',
      'Geo-composite Drains (ASTM D7270)'
    ],
    specifications: [
      'Pipe Diameter: 100mm-1200mm',
      'Concrete Compressive Strength: M30-M40',
      'Grating Load Class: A15-D400 (EN 124)',
      'Flow Rate Capacity: Varies by design'
    ],
    standards: [
      'IRC:SP:42-2014 (Road Drainage Guidelines)',
      'IS 458:2003 (Concrete Pipes)',
      'IS 4984:1995 (HDPE Pipes)',
      'IS 4985:1994 (PVC Pipes)',
      'EN 124 (Gullies and Manhole Tops)'
    ],
    hsnCodes: ['68109100', '39172310', '73251000'],
    orderSizes: '10 meters - 5,000+ meters',
    importCountries: [
      'China',
      'Germany',
      'USA',
      'UAE',
      'Spain'
    ],
    relatedSlugs: [
      'crash-barriers-india',
      'guardrails-india',
      'road-studs-india',
      'traffic-cones-india',
      'bollards-india'
    ],
    priceRange: '₹500-₹15,000 per meter (depending on type/size)',
    applications: [
      'Highways',
      'Urban Roads',
      'Industrial Parks',
      'Railway Lines',
      'Airports',
      'Residential Areas'
    ],
    challenges: [
      'Clogging from debris and silt',
      'Damage from heavy vehicle loads',
      'Ensuring proper gradient and outflow points',
      'Integration with existing municipal drainage networks'
    ],
    marketTrend: 'The market for road drainage systems in India is witnessing robust growth due to extensive investment in road infrastructure projects and heightened awareness of climate change impacts. There\'s a rising demand for advanced, durable, and highly efficient drainage solutions, including precast systems and geosynthetic materials, to manage increasing rainfall intensities and ensure long-term road resilience. Focus on sustainable urban drainage systems (SUDS) is also gaining traction.'
  },
];

// ─── INDUSTRIAL STORAGE & TANKS ───
const storageProducts: DemandProduct[] = [
  {
    slug: 'storage-tanks-india',
    name: 'Storage Tanks',
    category: 'Industrial Storage & Tanks',
    categorySlug: 'industrial-storage',
    industrySlug: 'storage',
    subIndustrySlug: 'tanks-silos',
    definition: 'Industrial storage tanks are large containers designed for the bulk storage of liquids, gases, or dry bulk materials. They are typically constructed from materials like steel, concrete, or plastics, and are essential components in various industries for holding raw materials, intermediate products, or finished goods. Their design considers material properties, pressure requirements, and environmental regulations.',
    industries: [
      'Petrochemical',
      'Chemical Processing',
      'Oil & Gas',
      'Food & Beverage',
      'Pharmaceuticals',
      'Water Treatment'
    ],
    grades: [
      'Carbon Steel IS 2062 Gr. A/B/E250',
      'Stainless Steel ASTM A240 304/316',
      'FRP ASTM D4097',
      'HDPE ASTM D1248',
      'Concrete IS 456 M25/M30',
      'Duplex Stainless Steel UNS S31803',
      'Aluminum ASTM B209 5083'
    ],
    specifications: [
      'Capacity: 1,000 L - 5,000,000 L',
      'Operating Pressure: 0 - 15 barg',
      'Temperature Range: -40°C to 200°C',
      'Material Thickness: 5 mm - 50 mm',
      'Corrosion Allowance: 1.5 mm - 3 mm'
    ],
    standards: [
      'API 650 (Welded Tanks for Oil Storage)',
      'IS 803 (Code of Practice for Design & Fabrication of Steel Pipes & Tanks)',
      'ASME BPV Code Section VIII (Pressure Vessels)',
      'UL 142 (Steel Aboveground Tanks)',
      'AWWA D100 (Welded Carbon Steel Tanks)'
    ],
    hsnCodes: ['73090010', '84798999'],
    orderSizes: '1 unit - 100+ units',
    importCountries: [
      'Germany',
      'USA',
      'China',
      'South Korea',
      'Japan',
      'Italy',
      'Netherlands'
    ],
    relatedSlugs: [
      'silos-india',
      'conveyors-india',
      'water-tanks-india',
      'ss-tanks-india',
      'fire-water-tanks-india'
    ],
    priceRange: '₹50,000 - ₹5,00,00,000 per unit',
    applications: [
      'Crude oil storage',
      'Chemical feedstock retention',
      'Drinking water reservoirs',
      'Food processing ingredient storage',
      'Industrial waste collection',
      'Fuel storage in power plants'
    ],
    challenges: [
      'Corrosion and material degradation',
      'Leak detection and environmental compliance',
      'Spatial constraints for large installations',
      'Pressure and temperature management'
    ],
    marketTrend: 'The market for industrial storage tanks in India is growing, driven by expanding manufacturing sectors and infrastructure development. Policy thrusts like the National Infrastructure Pipeline (NIP) and the Make in India initiative are encouraging domestic production and consumption. Enhanced focus on safety and environmental regulations is also shaping demand for advanced tank technologies.'
  },
  {
    slug: 'silos-india',
    name: 'Silos',
    category: 'Industrial Storage & Tanks',
    categorySlug: 'industrial-storage',
    industrySlug: 'storage',
    subIndustrySlug: 'tanks-silos',
    definition: 'Silos are large, typically cylindrical structures used for the bulk storage of granular materials such as grains, cement, coal, or fertilizers. They are designed for efficient loading and unloading, often employing pneumatic or mechanical conveying systems. Silos protect materials from environmental degradation and enable systematic inventory management in industries requiring high-volume dry material handling.',
    industries: [
      'Agriculture',
      'Cement',
      'Food Processing',
      'Mining',
      'Chemicals',
      'Plastics'
    ],
    grades: [
      'Mild Steel IS 2062 Gr. E250',
      'Galvanized Steel ASTM A653 G90',
      'Stainless Steel ASTM A240 304L/316L',
      'Fiberglass Reinforced Polymer (FRP) ASTM D3299',
      'High-Density Polyethylene (HDPE) ASTM D3350',
      'Concrete IS 456 M35',
      'Corrugated Steel ASTM A792'
    ],
    specifications: [
      'Capacity: 10 MT - 10,000+ MT',
      'Diameter: 2 m - 30 m',
      'Height: 5 m - 60 m',
      'Material Discharge Rate: 10 TPH - 500 TPH',
      'Internal Pressure: Up to 0.5 barg'
    ],
    standards: [
      'IS 4995 (Criteria for Design of Reinforced Concrete Bins, Silos and Bunkers)',
      'ANSI/ASAE EP433 (Agricultural Storage Structures)',
      'EN 1991-4 (Eurocode 1: Actions on structures - Silos and tanks)',
      'ACI 313 (Design and Construction of Concrete Silos and Stacking Tubes)',
      'OSHA 1910.272 (Grain Handling Facilities)'
    ],
    hsnCodes: ['73090090', '84798999'],
    orderSizes: '1 unit - 50 units',
    importCountries: [
      'USA',
      'Germany',
      'Canada',
      'China',
      'Italy',
      'Turkey',
      'Brazil'
    ],
    relatedSlugs: [
      'storage-tanks-india',
      'conveyors-india',
      'water-tanks-india',
      'ss-tanks-india',
      'fire-water-tanks-india'
    ],
    priceRange: '₹1,50,000 - ₹2,00,00,000 per unit',
    applications: [
      'Grain storage in agriculture',
      'Cement storage at construction sites',
      'Flour storage in bakeries',
      'Coal storage in power plants',
      'Plastic pellet storage for manufacturing',
      'Fertilizer storage for chemical plants'
    ],
    challenges: [
      'Material bridging and rat-holing',
      'Dust explosion risks with certain materials',
      'Moisture ingress and material spoilage',
      'Structural integrity under dynamic loads'
    ],
    marketTrend: 'The Indian silo market is expanding, spurred by modernization in agriculture and the growth of cement and construction sectors. Government initiatives like the National Food Security Act and increased investment in food processing units are driving demand for advanced storage solutions. Automation in material handling is also a key market influence.'
  },
  {
    slug: 'conveyors-india',
    name: 'Conveyors',
    category: 'Industrial Storage & Tanks',
    categorySlug: 'industrial-storage',
    industrySlug: 'storage',
    subIndustrySlug: 'tanks-silos',
    definition: 'Conveyors are mechanical handling systems used to move materials, products, or goods from one location to another within an industrial facility. They come in various types, including belt, roller, screw, and chain conveyors, each suited for different material types, capacities, and distances. Conveyors enhance efficiency, reduce manual labor, and improve safety in material transport operations.',
    industries: [
      'Mining',
      'Manufacturing',
      'Logistics & Warehousing',
      'Food & Beverage',
      'Automotive',
      'E-commerce'
    ],
    grades: [
      'Carbon Steel IS 2062 Gr. E250',
      'Stainless Steel ASTM A240 304',
      'Food Grade PVC/PU Belting',
      'Rubber EP/NN Belting IS 1891',
      'UHMW-PE (Ultra-high-molecular-weight polyethylene) ASTM D4020',
      'High-tensile Steel IS 1030',
      'Aluminum Alloys 6061-T6'
    ],
    specifications: [
      'Belt Width: 300 mm - 2000 mm',
      'Conveying Capacity: 5 TPH - 5000 TPH',
      'Speed: 0.1 m/s - 5 m/s',
      'Belt Type: Flat, Troughed, Sidewall',
      'Motor Power: 0.75 kW - 200 kW'
    ],
    standards: [
      'IS 1891 (Conveyor Belting - Specification)',
      'IS 11592 (Code of practice for selection of belt conveyors)',
      'ISO 340 (Conveyor Belts - Fire Retardant)',
      'DIN 22101 (Continuous mechanical handling equipment; belt conveyors)',
      'CEMA (Conveyor Equipment Manufacturers Association)'
    ],
    hsnCodes: ['84283300', '84283900'],
    orderSizes: '1 unit - 100+ units',
    importCountries: [
      'Germany',
      'China',
      'Japan',
      'USA',
      'Italy',
      'France',
      'South Korea'
    ],
    relatedSlugs: [
      'storage-tanks-india',
      'silos-india',
      'water-tanks-india',
      'ss-tanks-india',
      'fire-water-tanks-india'
    ],
    priceRange: '₹25,000 - ₹5,00,00,000 per unit',
    applications: [
      'Material handling in mines',
      'Assembly line production in factories',
      'Parcel sorting in logistics hubs',
      'Food product packaging lines',
      'Grain transfer at agricultural processing units',
      'Waste material transport in recycling plants'
    ],
    challenges: [
      'Belt wear and tear',
      'Jamming and blockages',
      'Energy consumption optimization',
      'Integration with existing systems'
    ],
    marketTrend: 'The Indian conveyor market is experiencing robust growth, driven by expansion in manufacturing, e-commerce, and logistics sectors. Government initiatives like the PLI scheme for manufacturing and increased investment in infrastructure are boosting demand. The trend towards automation and Industry 4.0 also fuels the adoption of advanced conveyor systems.'
  },
  {
    slug: 'water-tanks-india',
    name: 'Water Tanks',
    category: 'Industrial Storage & Tanks',
    categorySlug: 'industrial-storage',
    industrySlug: 'storage',
    subIndustrySlug: 'tanks-silos',
    definition: 'Water tanks are containers designed to store water for various purposes, including potable water, fire suppression, industrial processes, and irrigation. They are constructed from materials like plastic (HDPE, LLDPE), fiberglass, concrete, or steel, and are selected based on capacity, application, and environmental factors. Their design must ensure water quality and structural integrity.',
    industries: [
      'Residential & Commercial',
      'Municipal Water Supply',
      'Agriculture',
      'Fire Fighting',
      'Industrial Manufacturing',
      'Hospitality'
    ],
    grades: [
      'HDPE/LLDPE IS 12701',
      'FRP (Fiberglass Reinforced Plastic) ASTM D4097',
      'Stainless Steel ASTM A240 304/316',
      'Carbon Steel IS 2062 Gr. E250',
      'Prestressed Concrete IS 1343',
      'Galvanized Iron IS 277',
      'Polypropylene (PP) ASTM D4101'
    ],
    specifications: [
      'Capacity: 100 L - 10,000,000 L',
      'Material Type: Food-grade plastic, Steel, Concrete',
      'Temperature Range: 0°C to 60°C',
      'Inlet/Outlet Size: 1/2 inch - 12 inch',
      'UV Resistance: Yes (for outdoor use)'
    ],
    standards: [
      'IS 12701 (Plastics water storage tanks - Specification)',
      'IS 456 (Plain and Reinforced Concrete - Code of Practice)',
      'AWWA D100 (Welded Carbon Steel Tanks for Water Storage)',
      'BIS for Potable Water Storage (IS 10910, IS 4462)',
      'NFPA 22 (Water Tanks for Private Fire Protection)'
    ],
    hsnCodes: ['39251000', '73090010'],
    orderSizes: '1 unit - 500+ units',
    importCountries: [
      'China',
      'USA',
      'Germany',
      'UAE',
      'Italy',
      'Turkey',
      'Malaysia'
    ],
    relatedSlugs: [
      'storage-tanks-india',
      'silos-india',
      'conveyors-india',
      'ss-tanks-india',
      'fire-water-tanks-india'
    ],
    priceRange: '₹2,000 - ₹2,00,00,000 per unit',
    applications: [
      'Potable water supply for homes',
      'Firefighting water reserves',
      'Irrigation water storage in farms',
      'Rainwater harvesting systems',
      'Boiler feed water storage in industries',
      'Chemical dilution in water treatment plants'
    ],
    challenges: [
      'Algae growth and bacterial contamination',
      'Leakage and structural failure',
      'UV degradation for outdoor plastic tanks',
      'Installation space and foundation requirements'
    ],
    marketTrend: 'The Indian water tank market is experiencing consistent growth, fueled by rapid urbanization, smart city initiatives, and increasing awareness of public health. Government programs like \'Har Ghar Jal\' and updated building codes for water storage are significant drivers. There\'s a growing preference for durable and food-grade materials.'
  },
  {
    slug: 'ss-tanks-india',
    name: 'SS Tanks',
    category: 'Industrial Storage & Tanks',
    categorySlug: 'industrial-storage',
    industrySlug: 'storage',
    subIndustrySlug: 'tanks-silos',
    definition: 'Stainless steel (SS) tanks are storage vessels fabricated from various grades of stainless steel, primarily for storing liquids or gases that require high levels of cleanliness, corrosion resistance, or specific temperature control. They are widely used in critical applications where hygiene, chemical inertness, and durability are paramount, offering a non-reactive and easy-to-clean storage solution.',
    industries: [
      'Food & Beverage',
      'Pharmaceuticals',
      'Chemical Processing',
      'Dairy',
      'Biotechnology',
      'Cosmetics'
    ],
    grades: [
      'SS 304 (UNS S30400) ASTM A240',
      'SS 316L (UNS S31603) ASTM A240',
      'SS 316 (UNS S31600) ASTM A240',
      'SS 304L (UNS S30403) ASTM A240',
      'SS 409 (UNS S40900) ASTM A240',
      'Duplex SS (UNS S31803) ASTM A240',
      'Super Duplex SS (UNS S32750) ASTM A240'
    ],
    specifications: [
      'Capacity: 50 L - 500,000 L',
      'Surface Finish: Ra 0.2 µm - Ra 0.8 µm (internal)',
      'Operating Pressure: Atmospheric to 10 barg',
      'Temperature Range: -10°C to 150°C',
      'Agitator Type: Anchor, Propeller, Turbine'
    ],
    standards: [
      'ASME BPV Code Section VIII (Pressure Vessels)',
      'IS 2825 (Code for Unfired Pressure Vessels)',
      '3-A Sanitary Standards (Dairy/Food applications)',
      'EU PED (Pressure Equipment Directive)',
      'ASTM A240 (Heat-Resisting Chromium and Chromium-Nickel Stainless Steel Plate, Sheet, and Strip for Pressure Vessels)'
    ],
    hsnCodes: ['73090010', '84198910'],
    orderSizes: '1 unit - 200 units',
    importCountries: [
      'Germany',
      'Italy',
      'USA',
      'China',
      'South Korea',
      'Denmark',
      'Sweden'
    ],
    relatedSlugs: [
      'storage-tanks-india',
      'silos-india',
      'conveyors-india',
      'water-tanks-india',
      'fire-water-tanks-india'
    ],
    priceRange: '₹15,000 - ₹3,00,00,000 per unit',
    applications: [
      'Milk storage and processing',
      'Pharmaceutical ingredient mixing',
      'Chemical reaction vessels',
      'Wine and beer fermentation',
      'Cosmetics ingredient blending',
      'High-purity water storage'
    ],
    challenges: [
      'High initial capital cost',
      'Susceptibility to crevice corrosion',
      'Welding quality and passivation requirements',
      'Demand for specialized cleaning protocols'
    ],
    marketTrend: 'The market for SS tanks in India is experiencing steady growth, fueled by the expansion of the food & beverage, pharmaceutical, and chemical industries. Strict regulatory standards for hygiene and product quality are driving demand for stainless steel solutions. The \'Make in India\' initiative encourages domestic manufacturing of these specialized tanks.'
  },
  {
    slug: 'fire-water-tanks-india',
    name: 'Fire Water Tanks',
    category: 'Industrial Storage & Tanks',
    categorySlug: 'industrial-storage',
    industrySlug: 'storage',
    subIndustrySlug: 'tanks-silos',
    definition: 'Fire water tanks are dedicated storage vessels designed to provide a reliable and readily available supply of water for fire suppression systems. These tanks are critical components of fire protection infrastructure, ensuring that sprinklers, hydrants, and other fire extinguishing equipment have adequate water pressure and volume during emergencies. They must meet stringent safety and capacity standards.',
    industries: [
      'Commercial Buildings',
      'Industrial Plants',
      'Residential Complexes',
      'Warehouses & Logistics',
      'Healthcare Facilities',
      'Data Centers'
    ],
    grades: [
      'Carbon Steel IS 2062 Gr. E250',
      'Galvanized Steel ASTM A653 G90',
      'FRP (Fiberglass Reinforced Plastic) ASTM D4097',
      'Concrete IS 456 M25',
      'Low Alloy Steel ASTM A572 Gr. 50',
      'Stainless Steel ASTM A240 304',
      'Bolted Steel EN 10025-2 S235JRG2'
    ],
    specifications: [
      'Capacity: 50,000 L - 5,000,000 L',
      'Design Life: 20 - 50 years',
      'Lining Material: Epoxy, Bituminous, HDPE',
      'Filling Rate: As per NFPA/TAC',
      'Connection Sizes: 4 inch - 10 inch'
    ],
    standards: [
      'NFPA 22 (Water Tanks for Private Fire Protection)',
      'TAC (Tariff Advisory Committee, India) Norms',
      'IS 13612 (Recommendations for Fire Fighting Installations)',
      'API 650 (Welded Tanks for Oil Storage - adaptable for fire water)',
      'AWWA D100 (Welded Carbon Steel Tanks)'
    ],
    hsnCodes: ['73090010', '84249000'],
    orderSizes: '1 unit - 10 units',
    importCountries: [
      'USA',
      'UK',
      'Germany',
      'China',
      'UAE',
      'Australia',
      'Turkey'
    ],
    relatedSlugs: [
      'storage-tanks-india',
      'silos-india',
      'conveyors-india',
      'water-tanks-india',
      'ss-tanks-india'
    ],
    priceRange: '₹1,00,000 - ₹1,50,00,000 per unit',
    applications: [
      'Providing water for sprinkler systems',
      'Supplying water to fire hydrants',
      'Maintaining water pressure for fire pumps',
      'Emergency water reserve for industrial fires',
      'Backup water supply for critical infrastructure',
      'Residential complex fire safety'
    ],
    challenges: [
      'Corrosion and leakage over time',
      'Maintaining required water levels and quality',
      'Compliance with evolving fire safety regulations',
      'Space requirements for large tanks'
    ],
    marketTrend: 'The Indian fire water tank market is witnessing strong growth due to increasingly stringent fire safety regulations and rapid industrial and urban development. The emphasis on high-rise buildings and industrial safety mandates robust fire protection infrastructure. Smart Cities Mission and NIP also promote investment in such critical safety assets.'
  },
  {
    slug: 'bio-digester-tanks-india',
    name: 'Bio Digester Tanks',
    category: 'Industrial Storage & Tanks',
    categorySlug: 'industrial-storage',
    industrySlug: 'storage',
    subIndustrySlug: 'tanks-silos',
    definition: 'Bio digester tanks are anaerobic reactors designed to break down organic waste materials such as agricultural waste, animal manure, or food waste, into biogas (primarily methane and carbon dioxide) and digestate. These tanks play a crucial role in waste management, renewable energy production, and nutrient recovery, offering an environmentally friendly solution for organic waste processing.',
    industries: [
      'Agriculture',
      'Waste Management',
      'Municipal Solid Waste',
      'Food Processing',
      'Breweries',
      'Pulp & Paper'
    ],
    grades: [
      'HDPE Liner (High-density polyethylene) ASTM D1248',
      'GRP/FRP (Glass Reinforced Plastic) BS EN 13121',
      'Mild Steel IS 2062 Gr. E250 (Epoxy coated)',
      'Stainless Steel ASTM A240 316L',
      'Reinforced Concrete IS 456 M30',
      'Glass-Fused-to-Steel (GFS) Coating ISO 28765',
      'Polypropylene (PP) ISO 1133'
    ],
    specifications: [
      'Capacity: 1 m³ - 10,000+ m³',
      'Biogas Yield: 0.5 - 1 m³ biogas/kg COD removed',
      'Retention Time: 20 - 60 days',
      'Operating Temperature: Mesophilic (25-40°C), Thermophilic (50-60°C)',
      'Mixing Type: Mechanical, Hydraulic, Gas Recirculation'
    ],
    standards: [
      'IS 15073 (Biogas Plant - Design and construction of fixed dome type)',
      'ISO 28765 (Enamelled articles - Glass-lined apparatus for process plants)',
      'BIS for Biogas components (e.g., IS 8746 for biogas stoves)',
      'European Committee for Standardization - Biogas standards (e.g., EN 16733)',
      'ASTM for Polymer materials as liners'
    ],
    hsnCodes: ['84198990', '39251000'],
    orderSizes: '1 unit - 20 units',
    importCountries: [
      'Germany',
      'Denmark',
      'China',
      'Italy',
      'USA',
      'Austria',
      'Netherlands'
    ],
    relatedSlugs: [
      'storage-tanks-india',
      'silos-india',
      'conveyors-india',
      'water-tanks-india',
      'ss-tanks-india'
    ],
    priceRange: '₹50,000 - ₹5,00,00,000 per unit',
    applications: [
      'Decentralized power generation from animal waste',
      'Waste-to-energy projects for municipalities',
      'Organic waste treatment in food factories',
      'Fertilizer production from digestate',
      'Biogas production for cooking fuel',
      'Industrial wastewater treatment'
    ],
    challenges: [
      'Fluctuating feedstock availability and quality',
      'Optimization of biogas production and utilization',
      'Corrosion from H2S in biogas',
      'High initial investment and maintenance'
    ],
    marketTrend: 'The bio digester tank market in India is experiencing significant expansion, driven by government focus on renewable energy, waste management, and sustainable agriculture. Schemes like the SATAT initiative for Compressed Biogas (CBG) and the Swachh Bharat Abhiyan are providing major impetus. There\'s a growing demand for cost-effective and scalable solutions.'
  },
  {
    slug: 'bolted-steel-tanks-india',
    name: 'Bolted Steel Tanks',
    category: 'Industrial Storage & Tanks',
    categorySlug: 'industrial-storage',
    industrySlug: 'storage',
    subIndustrySlug: 'tanks-silos',
    definition: 'Bolted steel tanks are modular storage containers constructed from pre-engineered steel panels that are bolted together on site. They are often coated (e.g., glass-fused-to-steel, epoxy) for enhanced corrosion resistance, making them suitable for a wide range of liquids, including water, wastewater, and certain chemicals. Their modular design allows for rapid installation, easy expansion, and relocation.',
    industries: [
      'Water & Wastewater Treatment',
      'Fire Protection',
      'Agriculture',
      'Oil & Gas',
      'Industrial Processing',
      'Municipal Utilities'
    ],
    grades: [
      'Glass-Fused-to-Steel (GFS/Enamel) ISO 28765',
      'Epoxy Coated Steel (FBE, Liquid Epoxy) API RP 5L2',
      'Galvanized Steel ASTM A653 G90',
      'Stainless Steel ASTM A240 304/316',
      'Carbon Steel IS 2062 Gr. E250',
      'Polymer Coated Steel (e.g., PVC/PE)',
      'Aluminum Alloys 6061-T6'
    ],
    specifications: [
      'Capacity: 20 m³ - 25,000+ m³',
      'Diameter: 3 m - 60 m',
      'Height: 3 m - 30 m',
      'Coating Thickness: 0.25 mm - 0.75 mm',
      'Bolt Material: Stainless Steel Grade A4'
    ],
    standards: [
      'AWWA D103 (Factory-Coated Bolted Steel Tanks for Water Storage)',
      'ISO 28765 (Enamel - Glass-lined apparatus for process plants - Factory applied to steel)',
      'NFPA 22 (Water Tanks for Private Fire Protection)',
      'IS 4995 (Criteria for Design of Reinforced Concrete Bins, Silos and Bunkers - adaptable for foundation)',
      'ASCE 7 (Minimum Design Loads for Buildings and Other Structures)'
    ],
    hsnCodes: ['73090010', '73102990'],
    orderSizes: '1 unit - 20 units',
    importCountries: [
      'USA',
      'China',
      'UK',
      'Germany',
      'Australia',
      'South Africa',
      'Israel'
    ],
    relatedSlugs: [
      'storage-tanks-india',
      'silos-india',
      'conveyors-india',
      'water-tanks-india',
      'ss-tanks-india'
    ],
    priceRange: '₹3,00,000 - ₹3,00,00,000 per unit',
    applications: [
      'Potable water reservoirs',
      'Wastewater treatment equalization basins',
      'Fire water storage in industrial parks',
      'Agricultural irrigation water storage',
      'Oil field fluid storage',
      'Digester tanks in biogas plants'
    ],
    challenges: [
      'Proper sealing and leak prevention',
      'Coating integrity against chemicals and abrasion',
      'Foundation stability requirements',
      'Corrosion around bolt connections'
    ],
    marketTrend: 'The bolted steel tank market in India is experiencing rapid growth, primarily driven by the expansion of water and wastewater treatment infrastructure and industrial development. The ease of installation, modularity, and corrosion resistance of these tanks align well with the fast-paced project requirements of Smart Cities and the Jal Jeevan Mission. Demand is high for durable and low-maintenance solutions.'
  },
];



// ─── FERROUS METALS (RETRY BATCH) ───
const ferrousRetryProducts: DemandProduct[] = [
  {
    slug: "billets-suppliers-india",
    name: "Billets",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Billets are semi-finished metal products, typically square or round in cross-section, produced from continuous casting or hot rolling. They serve as the primary raw material for further processing into various long products like bars, wire rods, and structural shapes. Characterized by their uniform grain structure and minimal defects, billets are crucial in the steelmaking process as an intermediate stage before final product shaping.",
    industries: ["Construction", "Automotive", "Forging", "Engineering", "Mining", "Oil & Gas"],
    grades: ["IS 2830 (2012) (Mild Steel Billets)", "IS 2831 (2001) (Carbon Steel Billets)", "ASTM A519 (Seamless Carbon & Alloy Steel Mechanical Tubing Billets)", "ASTM A572 (High-Strength Low-Alloy Structural Steel Billets)", "IS 1786 (1985) (High strength deformed steel bars and wires for concrete reinforcement - Billets)", "SAE 1008 (Low Carbon Steel Billets)", "EN 10025 (Hot Rolled Structural Steel Billets)"],
    specifications: ["Cross-section: 60mm-180mm square", "Length: 6m-12m", "Carbon Content: 0.08%-0.60%", "Manganese Content: 0.30%-1.60%", "Sulphur Content: Max 0.05%"],
    standards: ["IS 2830", "IS 2831", "ASTM A519", "EN 10025", "BIS (Bureau of Indian Standards)"],
    hsnCodes: ["7207.11", "7207.20"],
    orderSizes: "500 MT - 50000 MT",
    importCountries: ["Russia", "Ukraine", "China", "Brazil", "Indonesia", "South Korea", "Japan"],
    relatedSlugs: ["blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india", "channels-suppliers-india"],
    priceRange: "\u20b9 40,000 - \u20b9 65,000 per MT",
    applications: ["Production of rebar", "Manufacturing of wire rods", "Forging into various shapes", "Seamless pipe production", "Railway components", "Automobile parts"],
    challenges: ["Price volatility due to raw material costs", "Quality consistency across different suppliers", "Lead time management for large orders", "Logistical challenges for bulk transport"],
    marketTrend: "The Indian billet market is influenced by infrastructure development and the construction sector. Demand remains robust, driven by government initiatives and housing projects. Local production caters to a significant portion of demand, but imports supplement supply, especially for specific grades. The market experiences cyclical demand based on construction activity and overall industrial growth in the country."
  },
  {
    slug: "blooms-suppliers-india",
    name: "Blooms",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Blooms are semi-finished steel products with a larger cross-sectional area than billets, typically square or rectangular. They are produced by continuous casting or hot rolling and are intermediate products used for rolling larger structural shapes like beams, heavy rails, and large pipes. Blooms generally have a cross-section greater than 150mm x 150mm. Their robust size makes them suitable for manufacturing heavy-duty steel components.",
    industries: ["Construction", "Railway", "Heavy Engineering", "Shipbuilding", "Power Generation", "Mining"],
    grades: ["IS 2062 (E250 Gr A, B, C) (Structural Steel Blooms)", "IS 808 (Standard Dimensions for Hot Rolled Steel Beams, Channels & Angles - Blooms)", "ASTM A36 (Structural Quality Carbon Steel Blooms)", "ASTM A572 (High-Strength Low-Alloy Structural Steel Blooms)", "EN 10025 (Hot Rolled Structural Steel Blooms)", "SAE 1045 (Medium Carbon Steel Blooms)"],
    specifications: ["Cross-section: 150mm-400mm square/rectangular", "Length: 6m-15m", "Carbon Content: 0.15%-0.70%", "Manganese Content: 0.60%-1.80%", "Silicon Content: 0.15%-0.40%"],
    standards: ["IS 2062", "IS 808", "ASTM A36", "EN 10025", "BIS"],
    hsnCodes: ["7207.19", "7207.20"],
    orderSizes: "1000 MT - 75000 MT",
    importCountries: ["China", "Russia", "South Korea", "Japan", "Brazil", "Ukraine", "Turkey"],
    relatedSlugs: ["billets-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india", "channels-suppliers-india"],
    priceRange: "\u20b9 42,000 - \u20b9 68,000 per MT",
    applications: ["Rolling into heavy structural beams", "Manufacturing of rails", "Large forging applications", "Producing heavy plates", "Shipbuilding structures", "Industrial machinery parts"],
    challenges: ["High transportation costs due to weight and size", "Limited number of manufacturers for specific sizes", "Fluctuations in global steel demand", "Ensuring dimensional accuracy for rolling processes"],
    marketTrend: "The Indian market for blooms is closely tied to heavy infrastructure and railway expansion. Demand for heavy structural steel and rails drives this segment. While domestic production is substantial, imports fulfill specialized requirements. The focus on 'Make in India' and modernization of railways provides a stable outlook for bloom consumption."
  },
  {
    slug: "slabs-suppliers-india",
    name: "Slabs",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Slabs are semi-finished, rectangular steel products, typically wide and flat, produced through continuous casting or hot rolling. They are the primary raw material for manufacturing flat steel products such as plates, sheets, and coils. Slabs are characterized by their smooth surface finish and uniform thickness, making them ideal for subsequent rolling processes into thinner gauges. Their dimensions vary widely depending on the final product requirements.",
    industries: ["Shipbuilding", "Heavy Engineering", "Automotive", "Construction", "Oil & Gas", "Power Generation"],
    grades: ["IS 2062 (E250 Gr A, B, C) (Structural Steel Slabs)", "IS 4800 (Cold Rolled Carbon Steel Sheet and Strip - Slabs)", "ASTM A36 (Structural Steel Slabs)", "ASTM A516 (Pressure Vessel Plate Steel Slabs)", "EN 10025 (Hot Rolled Structural Steel Slabs)", "API 5L (Pipe Line Steel Slabs)"],
    specifications: ["Thickness: 150mm-300mm", "Width: 800mm-2500mm", "Length: 4m-12m", "Carbon Content: 0.05%-0.70%", "Sulphur Content: Max 0.04%"],
    standards: ["IS 2062", "IS 4800", "ASTM A36", "EN 10025", "BIS", "API 5L"],
    hsnCodes: ["7207.12", "7207.20"],
    orderSizes: "2000 MT - 100000 MT",
    importCountries: ["China", "Russia", "Japan", "South Korea", "Brazil", "Ukraine", "Indonesia"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india", "channels-suppliers-india"],
    priceRange: "\u20b9 43,000 - \u20b9 70,000 per MT",
    applications: ["Production of hot rolled coils", "Manufacturing of heavy plates", "Ship hull construction", "Fabrication of pressure vessels", "Automotive body panels", "Bridge construction"],
    challenges: ["Inventory management for large stock", "Freight costs for large volumes and dimensions", "Supplier reliability for consistent quality", "Impact of global steel overcapacity"],
    marketTrend: "The Indian slab market is closely linked to the demand for flat steel products, driven by sectors like automotive, appliances, and infrastructure. Capacity expansion in flat steel production influences slab demand. While domestic mills are major producers, specific grades and large sizes might be imported. The trend is positive, supported by manufacturing growth and export potential for finished flat products."
  },
  {
    slug: "ingots-suppliers-india",
    name: "Ingots",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Ingots are primary castings of metal, typically steel, formed when molten metal is poured into molds and allowed to solidifies. Unlike continuously cast products, ingots are often produced for specific applications requiring higher purity, specialized alloys, or for subsequent rolling into exceptionally large or complex sections. They are considered an intermediate product before further processing like forging or rolling into semi-finished products.",
    industries: ["Specialty Steel", "Heavy Forging", "Defense", "Power Generation", "Tool Manufacturing", "Die Making"],
    grades: ["IS 1030 (1998) (Carbon Steel Castings for General Engineering Purposes - Ingots)", "ASTM A27 (Steel Castings, Carbon, For General Application - Ingots)", "ASTM A29 (General Requirements for Steel Bars, Carbon and Alloy, Hot-Wrought - Ingots)", "IS 2707 (High Strength Quenched and Tempered Weldable Structural Steel - Ingots)", "SAE J403 (Chemical Compositions of SAE Carbon Steels - Ingots)"],
    specifications: ["Weight: 100 kg - 50 MT", "Cross-section: Tapered rectangular/square/round", "Carbon Content: 0.10%-1.50%", "Alloy Content: Varies based on grade", "Phosphorus & Sulphur: Max 0.03% each"],
    standards: ["IS 1030", "ASTM A27", "ASTM A29", "BIS"],
    hsnCodes: ["7206.10", "7206.90"],
    orderSizes: "50 MT - 5000 MT",
    importCountries: ["Germany", "Japan", "USA", "Sweden", "China", "South Korea", "Russia"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "angles-suppliers-india", "channels-suppliers-india"],
    priceRange: "\u20b9 50,000 - \u20b9 150,000 per MT",
    applications: ["Large forgings for industrial machinery", "Production of specialty steel alloys", "Nuclear power plant components", "Ship propeller shafts", "Heavy crankshafts", "Die blocks for pressing"],
    challenges: ["High energy consumption in production", "Specific mold and casting requirements", "Limited number of specialized manufacturers", "Quality control for internal defects"],
    marketTrend: "The Indian ingot market, particularly for specialized and alloy steel ingots, caters to high-end industrial applications. Demand is driven by sectors requiring large, defect-free forgings and custom alloy compositions. While bulk commodity ingots have largely been replaced by continuous casting, specialized ingots retain their niche. Growth is steady, linked to investments in heavy industries and defense."
  },
  {
    slug: "angles-suppliers-india",
    name: "Angles",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Angles are L-shaped structural steel sections, characterized by two perpendicular legs of equal or unequal length. They are hot-rolled and known for their high strength-to-weight ratio, making them essential components in construction and fabrication. Angles provide excellent structural support, resist bending, and are versatile for various bracing and framing applications. They are available in a wide range of sizes and thicknesses.",
    industries: ["Construction", "Infrastructure", "Fabrication", "Renewable Energy", "Automotive", "Agricultural Machinery"],
    grades: ["IS 2062 (E250 Gr A, B, C) (Structural Steel Angles)", "IS 808 (Standard Dimensions for Hot Rolled Steel Angles)", "ASTM A36 (Structural Steel Angles)", "ASTM A242 (High-Strength Low-Alloy Structural Steel Angles)", "EN 10025 (Hot Rolled Structural Steel Angles)", "JIS G 3101 (Rolled Steel for General Structure - Angles)"],
    specifications: ["Leg Length: 20mm x 20mm to 200mm x 200mm", "Thickness: 3mm-25mm", "Length: 6m-12m", "Yield Strength: Min 250 MPa", "Tensile Strength: 410-540 MPa"],
    standards: ["IS 2062", "IS 808", "ASTM A36", "EN 10025", "BIS"],
    hsnCodes: ["7216.21", "7216.40"],
    orderSizes: "5 MT - 1000 MT",
    importCountries: ["China", "Vietnam", "South Korea", "Taiwan", "Turkey", "Russia", "UAE"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "channels-suppliers-india"],
    priceRange: "\u20b9 55,000 - \u20b9 80,000 per MT",
    applications: ["Roof trusses and portal frames", "Transmission line towers", "Industrial shelving and racks", "Supporting structures for machinery", "Frame construction for vehicles", "Bridge components"],
    challenges: ["Price competition from domestic and international suppliers", "Ensuring correct dimensions and straightness", "Logistics for varying lengths and quantities", "Availability of special grades"],
    marketTrend: "The Indian steel angle market is driven by the robust construction and infrastructure sectors. Demand is consistent due to ongoing projects in commercial, residential, and industrial segments. Local manufacturers dominate, with imports filling specific gaps or offering competitive pricing. The 'Atmanirbhar Bharat' initiative supports domestic production, maintaining a stable demand outlook."
  },
  {
    slug: "channels-suppliers-india",
    name: "Channels",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Channels, also known as C-sections or U-sections, are structural steel products with a C-shaped cross-section. They consist of a web and two flanges, which are either parallel or tapered. Channels are hot-rolled and provide excellent structural support, particularly useful for framing, bracing, and as lintels. Their design allows for easy attachment and integration into various structural systems, offering good load-bearing capabilities. They are available in various sizes and weights.",
    industries: ["Construction", "Infrastructure", "Automotive", "Manufacturing", "Power Transmission", "Railways"],
    grades: ["IS 2062 (E250 Gr A, B, C) (Structural Steel Channels)", "IS 808 (Standard Dimensions for Hot Rolled Steel Channels)", "ASTM A36 (Structural Steel Channels)", "ASTM A572 (High-Strength Low-Alloy Structural Steel Channels)", "EN 10025 (Hot Rolled Structural Steel Channels)", "JIS G 3101 (Rolled Steel for General Structure - Channels)"],
    specifications: ["Web Height: 75mm-400mm", "Flange Width: 40mm-100mm", "Thickness (web/flange): 4mm-18mm", "Length: 6m-12m", "Yield Strength: Min 250 MPa"],
    standards: ["IS 2062", "IS 808", "ASTM A36", "EN 10025", "BIS"],
    hsnCodes: ["7216.31", "7216.32"],
    orderSizes: "10 MT - 1500 MT",
    importCountries: ["China", "Vietnam", "South Korea", "Turkey", "Russia", "UAE", "Malaysia"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 58,000 - \u20b9 85,000 per MT",
    applications: ["Secondary structural members in buildings", "Frameworks for trucks and trailers", "Lintels over openings", "Girts and purlins in pre-engineered buildings", "Cable trays and supports", "Mining conveyor systems"],
    challenges: ["Dimensional variations affecting fabrication", "Surface finish requirements for certain applications", "Ensuring timely delivery for project timelines", "Availability of standard and non-standard sizes"],
    marketTrend: "The Indian steel channel market shows consistent demand, driven by construction, infrastructure, and industrial fabrication. Growth in pre-engineered buildings and automotive ancillary industries contributes significantly. Domestic production meets most requirements, with imports stabilizing supply and offering competitive options for specific niche applications. The market remains stable with a positive outlook."
  },
  {
    slug: "beams-suppliers-india",
    name: "Beams",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Beams are horizontal structural elements designed to withstand bending loads, shear forces, and often axial compression. They are typically hot-rolled with H-shaped (H-Beams) or I-shaped (I-Beams) cross-sections, providing high strength and rigidity. Beams are fundamental components in building frames, bridges, and other large structures, efficiently transferring loads to columns and foundations. Their various profiles and weights allow for optimization in structural design.",
    industries: ["Construction", "Infrastructure", "Heavy Engineering", "Bridge Construction", "Power Plants", "Automotive Assembly"],
    grades: ["IS 2062 (E250, E300, E350 Gr A, B, C) (Structural Steel Beams)", "IS 808 (Standard Dimensions for Hot Rolled Steel I & H Sections)", "ASTM A36 (Structural Steel Beams)", "ASTM A572 (High-Strength Low-Alloy Structural Steel Beams)", "EN 10025 (Hot Rolled Structural Steel Beams)", "JIS G 3101 (Rolled Steel for General Structure - Beams)"],
    specifications: ["Depth of Section: 100mm-1000mm", "Flange Width: 50mm-400mm", "Web/Flange Thickness: 5mm-30mm", "Length: 6m-18m", "Yield Strength: Min 250 MPa"],
    standards: ["IS 2062", "IS 808", "ASTM A36", "EN 10025", "BIS"],
    hsnCodes: ["7216.33", "7216.39"],
    orderSizes: "20 MT - 5000 MT",
    importCountries: ["China", "Korea", "Japan", "Europe (Germany, Belgium)", "Turkey", "Russia", "Vietnam"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 60,000 - \u20b9 95,000 per MT",
    applications: ["Main structural frames for buildings", "Bridge girders and supports", "Columns in industrial structures", "Crane runway beams", "Trailer and chassis frames", "Support for heavy machinery"],
    challenges: ["Logistical complexity for heavy and long sections", "Availability of specific large sizes and grades", "Market price fluctuations", "Welding requirements for high-strength beams"],
    marketTrend: "The Indian steel beam market is experiencing robust demand due to massive infrastructure projects, smart city development, and industrial expansion. Both I-Beams and H-Beams are critical. Domestic production is strong, but imports, particularly for larger sections or specialized grades, remain relevant. The market is positive with continuous project pipelines driving growth."
  },
  {
    slug: "joists-suppliers-india",
    name: "Joists",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Joists are horizontal structural members used to support a floor or ceiling. Typically, they are I-shaped (I-joists) but can also refer to smaller-sized I-Beams or wide-flange beams used in floor and roof systems. Their primary function is to transfer loads from the flooring/decking to the main supporting beams or walls. Steel joists offer excellent strength, span capabilities, and fire resistance, making them ideal for various construction types.",
    industries: ["Residential Construction", "Commercial Construction", "Industrial Buildings", "Pre-Engineered Buildings", "Modular Construction", "Warehousing"],
    grades: ["IS 2062 (E250 Gr A, B, C) (Structural Steel Joists)", "IS 808 (Standard Dimensions for Hot Rolled Steel Joists)", "ASTM A36 (Structural Steel Joists)", "ASTM A572 (High-Strength Low-Alloy Structural Steel Joists)", "EN 10025 (Hot Rolled Structural Steel Joists)", "JIS G 3101 (Rolled Steel for General Structure - Joists)"],
    specifications: ["Depth of Section: 100mm-600mm", "Flange Width: 50mm-200mm", "Weight per meter: 7.3 kg/m - 100 kg/m", "Length: 6m-12m", "Yield Strength: Min 250 MPa"],
    standards: ["IS 2062", "IS 808", "ASTM A36", "EN 10025", "BIS"],
    hsnCodes: ["7216.33", "7216.39"],
    orderSizes: "5 MT - 1000 MT",
    importCountries: ["China", "South Korea", "Turkey", "Vietnam", "Russia", "Ukraine", "UAE"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 60,000 - \u20b9 90,000 per MT",
    applications: ["Floor and roof support in buildings", "Decking supports in multi-story structures", "Mezzanine floors", "Supporting scaffolding systems", "Light bridge walkways", "Pre-fabricated module frameworks"],
    challenges: ["Precision cutting and fabrication requirements", "Transportation and handling of long sections", "Coordination with other building trades", "Ensuring code compliance for floor loads"],
    marketTrend: "The Indian market for steel joists is growing, driven by the shift towards faster construction methods, pre-engineered buildings, and multi-story commercial and residential complexes. The preference for steel over traditional concrete in certain applications boosts demand. Domestic manufacturers largely cater to this, with an optimistic outlook due to urbanization and industrial infrastructure."
  },
  {
    slug: "h-beams-suppliers-india",
    name: "H-Beams",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "H-Beams are structural steel sections characterized by their distinctive 'H' shape, with parallel flanges and a deeper web. Also known as Wide Flange Beams (W-sections) in some standards, they are designed for heavy load-bearing applications. Their geometry provides exceptional strength, rigidity, and resistance to bending and buckling, making them ideal for columns, heavy girders, and large span structures. H-Beams are a cornerstone of modern steel construction.",
    industries: ["Construction", "Infrastructure", "Heavy Engineering", "Bridge Building", "High-Rise Buildings", "Industrial Plants"],
    grades: ["IS 2062 (E250, E300, E350 Gr A, B, C) (Structural Steel H-Beams)", "IS 808 (Standard Dimensions for Hot Rolled Steel H-Sections)", "ASTM A992 (Structural Steel for Shapes H-Beams)", "ASTM A572 (High-Strength Low-Alloy Structural Steel H-Beams)", "EN 10025 (Hot Rolled Structural Steel H-Beams)", "JIS G 3101 (Rolled Steel for General Structure - H-Beams)"],
    specifications: ["Depth of Section: 100mm-1000mm", "Flange Width: 100mm-400mm", "Web/Flange Thickness: 6mm-40mm", "Length: 6m-18m", "Yield Strength: Min 250 MPa (higher for specific grades)"],
    standards: ["IS 2062", "IS 808", "ASTM A992", "EN 10025", "BIS"],
    hsnCodes: ["7216.33", "7216.39"],
    orderSizes: "50 MT - 10000 MT",
    importCountries: ["China", "Japan", "Korea", "Germany", "Turkey", "Russia", "Europe"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 62,000 - \u20b9 100,000 per MT",
    applications: ["Primary load-bearing columns in high-rise buildings", "Long-span bridge girders", "Heavy-duty industrial platforms and frameworks", "Crane support structures", "Large warehouse construction", "Nuclear power plant frameworks"],
    challenges: ["Logistical challenges for extremely large sizes", "Precise fabrication and welding requirements", "Sourcing specific high-strength or resistant grades", "Global steel market price volatility"],
    marketTrend: "The Indian H-Beam market is experiencing high growth, propelled by large-scale infrastructure projects including metros, railway bridges, and industrial corridors. Demand for high-rise commercial and residential buildings also contributes significantly. While domestic mills produce standard sizes, larger and specialized H-Beams are often imported. The outlook is highly positive, driven by long-term infrastructure investment."
  },
  {
    slug: "i-beams-suppliers-india",
    name: "I-Beams",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "I-Beams are structural steel sections characterized by their 'I' shape, with tapered flanges and a central web. These are also known as universal beams (UB) or RSJs (rolled steel joists) in certain regions. They offer a strong cross-section that efficiently resists bending. I-Beams are widely used horizontally as beams or vertically as columns, particularly in medium to heavy construction, renowned for their strength, rigidity, and cost-effectiveness in design.",
    industries: ["Construction", "Infrastructure", "Industrial Buildings", "Machine Manufacturing", "Railways", "Mining"],
    grades: ["IS 2062 (E250, E300, E350 Gr A, B, C) (Structural Steel I-Beams)", "IS 808 (Standard Dimensions for Hot Rolled Steel I-Sections)", "ASTM A36 (Structural Steel I-Beams)", "ASTM A572 (High-Strength Low-Alloy Structural Steel I-Beams)", "EN 10025 (Hot Rolled Structural Steel I-Beams)", "JIS G 3101 (Rolled Steel for General Structure - I-Beams)"],
    specifications: ["Depth of Section: 100mm-600mm", "Flange Width: 50mm-250mm", "Web/Flange Thickness: 5mm-25mm", "Length: 6m-15m", "Yield Strength: Min 250 MPa"],
    standards: ["IS 2062", "IS 808", "ASTM A36", "EN 10025", "BIS"],
    hsnCodes: ["7216.33", "7216.39"],
    orderSizes: "20 MT - 5000 MT",
    importCountries: ["China", "Korea", "Japan", "Turkey", "Russia", "Europe (Germany, Belgium)", "Vietnam"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 60,000 - \u20b9 90,000 per MT",
    applications: ["Floor and roof beams in buildings", "Supporting structures for industrial equipment", "Bridge framework", "Girders in warehouses", "Railway wagon chassis", "Fabrication of machinery frames"],
    challenges: ["Weight and size constrain transportation logistics", "Ensuring straightness for critical applications", "Availability of longer lengths for project requirements", "Impact of steel mill production cycles"],
    marketTrend: "The Indian I-Beam market benefits from the continuous expansion of the construction and industrial sectors. Demand is steady, especially for medium to heavy sections used in commercial complexes, factories, and public infrastructure. Domestic production largely meets the demand for standard sizes, with imports supplementing for specialized sections. The long-term outlook is stable, supported by sustained economic activity."
  },
  {
    slug: "wire-rods-suppliers-india",
    name: "Wire Rods",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Wire Rods are hot-rolled steel products with a circular cross-section, typically coiled. They are intermediate products used for further processing into wires. They possess specific mechanical properties and surface finishes based on their intended application, making them crucial for subsequent drawing operations.",
    industries: ["Construction", "Automotive", "Fasteners", "Springs", "Welding", "Agriculture"],
    grades: ["SAE 1006", "SAE 1008", "SAE 1010", "EN 8", "SAE 1018", "IS 2879"],
    specifications: ["Diameter: 5.5mm - 16mm", "Tensile Strength: 300 - 900 MPa", "Elongation: 12% - 25%", "Chemical Composition: C 0.05-0.25%, Mn 0.30-1.00%", "Ovality: Max 0.8mm"],
    standards: ["IS 2879", "ASTM A510", "JIS G3503", "EN 16120", "BIS Standards"],
    hsnCodes: ["7213.91.10", "7213.91.90"],
    orderSizes: "50 MT - 5000 MT",
    importCountries: ["China", "South Korea", "Japan", "Russia", "Indonesia", "Ukraine", "Turkey"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 55,000 - \u20b9 75,000 per MT",
    applications: ["Drawing into mild steel wire", "Manufacturing of nails and screws", "Production of barbed wire", "Fabrication of mesh and fencing", "Cold heading applications", "Welding electrodes"],
    challenges: ["Volatility in raw material prices (iron ore, scrap)", "Logistics and transportation costs for bulk orders", "Ensuring consistent quality and surface finish", "Managing currency fluctuations for imports"],
    marketTrend: "India's wire rod market is experiencing steady growth driven by infrastructure development and manufacturing expansion. Demand from the construction and automotive sectors remains robust. Domestic production capacity is expanding, but imports continue to play a role in meeting specific grade requirements and balancing market supply. Price trends are influenced by a combination of global steel prices and domestic demand-supply dynamics."
  },
  {
    slug: "high-carbon-wire-rods-suppliers-india",
    name: "High Carbon Wire Rods",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "High Carbon Wire Rods (HCWR) are specialized hot-rolled steel products with carbon content typically ranging from 0.60% to 1.00% or higher. This elevated carbon content imparts significantly higher strength and hardness compared to low carbon grades, making them suitable for applications requiring superior mechanical properties and resistance to wear.",
    industries: ["Automotive", "Springs", "Agricultural Equipment", "Tires", "Oil & Gas", "Mining"],
    grades: ["SAE 1060", "SAE 1070", "SAE 1080", "IS 280", "IS 2507", "EN 10089 Grades"],
    specifications: ["Diameter: 5.5mm - 16mm", "Carbon Content: 0.60% - 1.00%", "Tensile Strength: 700 - 1400 MPa", "Reduction of Area: 30% - 60%", "Decarburization Depth: Max 0.05 mm"],
    standards: ["IS 280", "IS 2507", "ASTM A510", "JIS G3506", "EN 10089"],
    hsnCodes: ["7213.91.10", "7213.91.90"],
    orderSizes: "100 MT - 3000 MT",
    importCountries: ["China", "Japan", "South Korea", "Germany", "Taiwan", "Russia"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 65,000 - \u20b9 90,000 per MT",
    applications: ["High strength springs (automotive, industrial)", "Prestressed concrete wires", "Tire cord wires", "Wire ropes and strands", "Valve springs", "Agricultural machinery components"],
    challenges: ["Strict quality control over chemical composition and microstructure", "Finding suppliers with advanced rolling technology", "Higher susceptibility to defects like seams and laps", "Availability of specific higher carbon grades"],
    marketTrend: "The market for high carbon wire rods in India is driven by the automotive, spring manufacturing, and infrastructure sectors. Growing demand for lightweight and high-strength components in vehicles fuels consumption. The focus on quality and advanced manufacturing practices is increasing. Domestic production caters to a significant portion, but specialized grades often require imports, leading to a dynamic market influenced by global supply chains and technological advancements."
  },
  {
    slug: "low-carbon-wire-rods-suppliers-india",
    name: "Low Carbon Wire Rods",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Low Carbon Wire Rods (LCWR) are hot-rolled steel products with a carbon content typically below 0.25%. Their low carbon content contributes to excellent ductility and weldability, making them highly suitable for applications requiring easy formability, cold drawing, and subsequent processing into various wire products. They are fundamental building blocks for many common wire products.",
    industries: ["Construction", "Fasteners", "Welding", "Agriculture", "Electronics", "Packaging"],
    grades: ["SAE 1006", "SAE 1008", "SAE 1010", "IS 9548", "IS 7887", "JIS G3505"],
    specifications: ["Diameter: 5.5mm - 16mm", "Carbon Content: 0.05% - 0.25%", "Tensile Strength: 290 - 450 MPa", "Elongation: 20% - 35%", "Surface Condition: Free from scales, cracks"],
    standards: ["IS 9548", "IS 7887", "ASTM A510", "JIS G3503", "EN 16120"],
    hsnCodes: ["7213.91.10", "7213.91.90"],
    orderSizes: "50 MT - 5000 MT",
    importCountries: ["China", "South Korea", "Malaysia", "Indonesia", "Vietnam", "Russia"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 55,000 - \u20b9 70,000 per MT",
    applications: ["General purpose wires", "Nails and screws", "Barbed wire and fencing mesh", "Welding electrodes and filler wires", "Paper clips and staples", "Reinforcement mesh for concrete"],
    challenges: ["Price fluctuations of raw materials", "Consistency in surface quality for wire drawing", "Managing large volume logistics efficiently", "Competitive pricing due to high supply"],
    marketTrend: "India's low carbon wire rod market is driven by robust demand from the construction, agriculture, and general manufacturing sectors. Increased infrastructure projects and urbanization fuel the need for various wire products. While domestic manufacturers meet a substantial portion of the demand, imports can influence local pricing. The market is competitive, with a strong focus on cost-effectiveness and timely delivery for large volume consistently."
  },
  {
    slug: "electrode-quality-wire-rods-suppliers-india",
    name: "Electrode Quality Wire Rods",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Electrode Quality Wire Rods (EQWR) are specialized low carbon steel wire rods specifically produced for the manufacture of welding electrodes and filler wires. They are characterized by extremely low impurity levels, precise chemical composition control, and excellent surface finish to ensure optimal arc stability, minimal spatter, and superior weld metal integrity during welding processes.",
    industries: ["Welding and Fabrication", "Automotive", "Construction", "Shipbuilding", "Oil & Gas", "Power Generation"],
    grades: ["EQ C5", "EQ C8", "AWS A5.18 ER70S-6 Equivalents", "IS 7280", "IS 6580", "SAE 1008 C-Mn"],
    specifications: ["Diameter: 5.5mm - 8mm", "Carbon Content: 0.05% - 0.12%", "Sulfur Content: Max 0.015%", "Phosphorus Content: Max 0.015%", "Copper Content: Max 0.10%"],
    standards: ["IS 7280", "IS 6580", "AWS A5.18", "JIS G3503 Eq.", "EN 16120-2"],
    hsnCodes: ["7213.91.10", "7213.91.90"],
    orderSizes: "50 MT - 1000 MT",
    importCountries: ["China", "Japan", "South Korea", "Norway", "Russia", "Sweden", "Turkey"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 60,000 - \u20b9 85,000 per MT",
    applications: ["Manufacturing of mild steel welding electrodes", "Production of submerged arc welding wires", "Fabrication of gas metal arc welding (GMAW) wires", "High-quality filler wires for critical joints", "Bridge construction", "Pressure vessel fabrication"],
    challenges: ["Stringent chemical composition control", "Ensuring minimal surface defects and non-metallic inclusions", "Supplier's capability for consistent quality", "Compliance with international welding standards"],
    marketTrend: "The market for Electrode Quality Wire Rods in India is driven by the growth in the welding and fabrication industry, which supports infrastructure development, manufacturing, and automotive sectors. Demand for higher quality welds and automated welding processes is increasing. While domestic production of standard grades is robust, premium or specialized EQWR often sees imports. Prices are influenced by the global steel market and the specific high purity requirements of the product."
  },
  {
    slug: "cold-heading-quality-wire-rods-suppliers-india",
    name: "Cold Heading Quality Wire Rods",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Cold Heading Quality Wire Rods (CHQWR) are specifically manufactured for cold forming applications such as fasteners, rivets, pins, and bolts. They exhibit exceptional malleability, ductility, and uniform grain structure, allowing them to be cold-formed into complex shapes without cracking or fracturing. Precise control over chemical composition and microstructure is critical for their performance.",
    industries: ["Automotive", "Fasteners", "Aerospace (specific grades)", "Construction", "Electronics", "Consumer Goods"],
    grades: ["SAE 1006 CHQ", "SAE 1008 CHQ", "SAE 1018 CHQ", "IS 7280 Equivalent", "JIS G3507 Equivalent", "EN 16120-2 CHQ"],
    specifications: ["Diameter: 5.5mm - 32mm", "Carbon Content: 0.05% - 0.25% (low to medium)", "Tensile Strength: 300 - 550 MPa", "Soundness: Free from internal cracks or piping", "Surface Quality: Excellent, free of seams/laps"],
    standards: ["IS 7280 (EQ)", "ASTM A510", "JIS G3507", "EN 16120-2", "ISO 4954"],
    hsnCodes: ["7213.91.10", "7213.91.90"],
    orderSizes: "50 MT - 2000 MT",
    importCountries: ["Japan", "South Korea", "China", "Germany", "Taiwan", "Italy"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 62,000 - \u20b9 88,000 per MT",
    applications: ["Manufacturing of bolts, nuts, and screws", "Production of rivets and pins", "Automotive fasteners and components", "Cold-forged parts for machinery", "Specialty fasteners for electronics", "Fasteners for white goods"],
    challenges: ["Achieving superior formability without cracking", "Stringent surface defect requirements", "Consistency in mechanical properties across batches", "Managing higher rejection rates in manufacturing if quality is not precise"],
    marketTrend: "The Cold Heading Quality Wire Rod market in India is driven by the robust growth in the automotive, construction, and general manufacturing sectors. As production of vehicles and machinery increases, so does the demand for high-quality fasteners. While domestic suppliers are improving capabilities, specific high-performance CHQ grades are often imported, reflecting a gap in local advanced material production. The market emphasizes consistent quality, formability, and competitive pricing."
  },
  {
    slug: "pm-plates-suppliers-india",
    name: "PM Plates",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "PM (Platemill) Plates are hot-rolled steel plates produced directly from slabs, characterized by their diverse dimensions and excellent mechanical properties. These primary plates serve as fundamental structural components and feedstock for various manufacturing processes. They offer versatility across numerous industries due to their strength, workability, and availability in a wide range of thicknesses and widths.",
    industries: ["Construction", "Shipbuilding", "Infrastructure", "Heavy Machinery", "Fabrication", "Storage Tanks"],
    grades: ["IS 2062 E250BR", "IS 2062 E350BR", "ASTM A36", "ASTM A572 Gr 50", "SS400 (JIS)", "EN 10025 S275JR"],
    specifications: ["Thickness: 5mm - 150mm", "Width: 900mm - 4000mm", "Length: 2000mm - 12000mm", "Tensile Strength: 340 - 700 MPa", "Yield Strength: 240 - 450 MPa"],
    standards: ["IS 2062", "ASTM A6/A6M", "JIS G3101", "EN 10025", "BIS Standards"],
    hsnCodes: ["7208.51.00", "7208.52.00"],
    orderSizes: "50 MT - 10,000 MT",
    importCountries: ["China", "South Korea", "Japan", "Russia", "Ukraine", "Taiwan", "Turkey"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 58,000 - \u20b9 85,000 per MT",
    applications: ["General structural fabrication", "Bridge construction", "Building frameworks", "Storage tanks and vessels", "Industrial equipment chassis", "Railcar manufacturing"],
    challenges: ["Logistical challenges for heavy and oversized plates", "Ensuring dimensional accuracy and flatness", "Price volatility due to global steel market", "Availability of specific thicknesses/widths for larger projects"],
    marketTrend: "The Indian market for PM Plates is highly influenced by infrastructure development, construction activities, and capital goods manufacturing. Government initiatives in infrastructure, defense, and railways are driving demand. While domestic production is substantial, imports complement the market, especially for specialized grades or high-volume requirements. Global steel prices and domestic economic policies play a significant role in market dynamics."
  },
  {
    slug: "boiler-quality-plates-suppliers-india",
    name: "Boiler Quality Plates",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Boiler Quality (BQ) Plates are hot-rolled steel plates specifically engineered for use in pressure vessels, boilers, and heat exchangers. They possess excellent high-temperature strength, pressure resistance, and good weldability. Manufactured under stringent quality control, these plates ensure safety and reliability in high-pressure, high-temperature environments, typically requiring specific controlled chemical compositions and mechanical properties.",
    industries: ["Power Generation", "Oil & Gas", "Petrochemicals", "Chemical Processing", "Fertilizers", "Refineries"],
    grades: ["IS 2002 Gr 1", "IS 2002 Gr 2", "ASTM A516 Gr 60", "ASTM A516 Gr 70", "EN 10028 P265GH", "EN 10028 P355GH"],
    specifications: ["Thickness: 8mm - 150mm", "C-Equivalent (CEV): Max 0.45%", "Tensile Strength: 410 - 580 MPa", "Yield Strength: 235 - 355 MPa", "Charpy Impact Test: Specific impact energy at sub-zero temps"],
    standards: ["IS 2002", "ASTM A516", "EN 10028", "JIS G3103", "ASME SA516"],
    hsnCodes: ["7208.51.00", "7208.52.00"],
    orderSizes: "20 MT - 2000 MT",
    importCountries: ["Japan", "South Korea", "Germany", "China", "Russia", "Ukraine", "Czech Republic"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 65,000 - \u20b9 1,20,000 per MT",
    applications: ["Fabrication of industrial boilers", "Construction of pressure vessels", "Heat exchangers for processing plants", "Storage tanks for critical fluids", "Components for thermal power plants", "Chemical reactors"],
    challenges: ["Extremely strict quality and testing requirements", "Supplier certification and traceability", "Higher production costs due to specialized manufacturing", "Availability of specific high-grade alloy BQ plates"],
    marketTrend: "India's Boiler Quality Plate market is driven by the energy sector, particularly thermal power, oil & gas, and petrochemical industries. The increasing need for energy infrastructure and upgrades in existing plants sustains demand. Domestic manufacturers offer standard grades, but specialized grades often require imports due to technological gaps or specific project requirements. Prices are premium due to stringent quality control, testing, and specialized metallurgical properties, influenced by global energy projects and raw material costs."
  },
  {
    slug: "shipbuilding-plates-suppliers-india",
    name: "Shipbuilding Plates",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Shipbuilding Plates are specialized hot-rolled steel plates designed for the construction of ships, offshore structures, and marine vessels. They offer high strength, excellent toughness, good weldability, and resistance to brittle fracture, especially at low temperatures. These plates must adhere to stringent international classification society rules, ensuring structural integrity and safety in demanding marine environments.",
    industries: ["Shipbuilding", "Offshore Structures", "Marine Engineering", "Docks & Ports", "Naval", "Wind Energy (Offshore)"],
    grades: ["LR-A", "LR-B", "LR-D", "Lloyd's DH36", "IRS Grade A", "IRS Grade DH36", "ABS Gr A"],
    specifications: ["Thickness: 5mm - 100mm", "Tensile Strength: 400 - 590 MPa (for higher strength grades)", "Yield Strength: 235 - 355 MPa (for higher strength grades)", "Charpy Impact Test: Required at specific temperatures (e.g., 0\u00b0C, -20\u00b0C)", "C-Equivalent (CEV): Controlled for weldability"],
    standards: ["IS 3039", "ABS", "Lloyd's Register (LR)", "DNV GL", "Bureau Veritas (BV)", "IRS Classification"],
    hsnCodes: ["7208.51.00", "7208.52.00"],
    orderSizes: "50 MT - 5000 MT",
    importCountries: ["South Korea", "Japan", "China", "Germany", "Sweden", "Turkey", "Italy"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 60,000 - \u20b9 95,000 per MT",
    applications: ["Hull structures of ships and vessels", "Decks and bulkheads for offshore platforms", "Marine storage tanks", "Components for FPSOs (Floating Production Storage and Offloading)", "Naval vessel construction", "Submarine sections (specific grades)"],
    challenges: ["Adherence to multiple classification society rules", "High dimensional accuracy and flatness requirements", "Extensive traceability and documentation", "Logistics for large sizes and project-specific delivery"],
    marketTrend: "The Indian shipbuilding plate market is buoyed by defense orders for naval vessels, coastal shipping, and growth in marine infrastructure. Government initiatives like 'Make in India' are encouraging domestic shipbuilding. Demand is also linked to global shipping trends and offshore energy projects. While domestic mills produce standard grades, specialized or higher-strength grades, particularly for defense or technically advanced vessels, are often sourced internationally. Prices are sensitive to global steel commodity markets and exchange rates."
  },
  {
    slug: "structural-plates-suppliers-india",
    name: "Structural Plates",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Structural Plates are hot-rolled steel plates primarily used in general construction and structural applications where specified strength and formability are required. They form the backbone of buildings, bridges, and general fabrication projects. These plates offer a good balance of strength, ductility, and weldability, making them versatile for a wide range of load-bearing structural designs.",
    industries: ["Construction", "Infrastructure", "General Engineering", "Fabrication", "Automotive (heavy vehicles)", "Railways"],
    grades: ["IS 2062 E250A", "IS 2062 E250BR", "IS 2062 E350A", "ASTM A36", "ASTM A572 Gr 50", "EN 10025 S235JR"],
    specifications: ["Thickness: 5mm - 100mm", "Tensile Strength: 390 - 550 MPa", "Yield Strength: 235 - 355 MPa", "Elongation: 18% - 22%", "C-Equivalent (CEV): Controlled for weldability"],
    standards: ["IS 2062", "ASTM A36", "EN 10025", "JIS G3101", "BIS Standards"],
    hsnCodes: ["7208.51.00", "7208.52.00"],
    orderSizes: "50 MT - 10,000 MT",
    importCountries: ["China", "South Korea", "Japan", "Russia", "Ukraine", "Turkey", "Vietnam"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 57,000 - \u20b9 80,000 per MT",
    applications: ["Steel frameworks for buildings", "Bridge girders and components", "Industrial sheds and warehouses", "Support structures for infrastructure projects", "Manufacturing of earthmoving equipment", "Railway wagon fabrication"],
    challenges: ["Managing large scale logistics and supply chain", "Price fluctuations of raw materials (iron ore, coking coal)", "Ensuring consistent mechanical properties for critical structures", "Coordinating delivery with project timelines"],
    marketTrend: "The Indian market for Structural Plates is experiencing consistent demand driven by robust growth in the construction and infrastructure sectors. Government investment in urban development, national highways, and industrial corridors significantly boosts consumption. Domestic steel mills are crucial suppliers, but imports, particularly for competitively priced or specialized wide/thick plates, also play a role. The market is highly sensitive to overall economic growth and construction activity."
  },
  {
    slug: "pressure-vessel-plates-suppliers-india",
    name: "Pressure Vessel Plates",
    category: 'Metals - Ferrous (Steel, Iron)',
    categorySlug: 'metals-ferrous',
    industrySlug: 'metals',
    subIndustrySlug: 'ferrous',
    definition: "Pressure Vessel Plates are high-quality steel plates specifically manufactured for the fabrication of pressure vessels, tanks, and static equipment designed to contain gases or liquids at high pressures. These plates possess excellent creep resistance, fracture toughness, and weldability at elevated temperatures, ensuring the safe and reliable operation of critical processing equipment in hazardous environments.",
    industries: ["Oil & Gas", "Petrochemicals", "Thermal Power", "Chemical Processing", "Fertilizers", "Nuclear Power"],
    grades: ["ASTM A516 Gr 70", "ASTM A387 Gr 11 Cl 2", "ASTM A387 Gr 22 Cl 2", "EN 10028 P265GH", "EN 10028 P355GH", "IS 2002 Gr 2 (for limited applications)"],
    specifications: ["Thickness: 10mm - 200mm", "Tensile Strength: 485 - 620 MPa (for A516 Gr 70)", "Yield Strength: 260 - 330 MPa (for A516 Gr 70)", "Impact Testing: Charpy V-notch at specified temperatures", "Controlled Microstructure and Grain Size"],
    standards: ["ASTM A516", "ASTM A387", "EN 10028", "ASME SA516", "ASME SA387"],
    hsnCodes: ["7208.51.00", "7208.52.00"],
    orderSizes: "10 MT - 1000 MT",
    importCountries: ["Japan", "South Korea", "Germany", "USA", "Italy", "Czech Republic", "China"],
    relatedSlugs: ["billets-suppliers-india", "blooms-suppliers-india", "slabs-suppliers-india", "ingots-suppliers-india", "angles-suppliers-india"],
    priceRange: "\u20b9 70,000 - \u20b9 1,50,000 per MT",
    applications: ["Fabrication of chemical reactors and columns", "Storage tanks for liquefied natural gas (LNG)", "Components for oil refineries and petrochemical plants", "Pressure vessels for power generation facilities", "Heat exchangers in critical process applications", "Cryogenic vessels"],
    challenges: ["Extremely high quality and safety critical requirements", "Mandatory third-party inspection and certification (e.g., LRS, TUV)", "Limited number of approved global suppliers", "Long lead times for specialized and thicker grades"],
    marketTrend: "The Indian Pressure Vessel Plate market is premium and driven by investments in the oil & gas, petrochemical, and power generation sectors. Upgrades and expansions in these industries create steady demand. While some standard PV plates are produced domestically, high-end, alloyed, or thicker grades often rely on imports from technologically advanced nations. The market values reliability, traceability, and adherence to stringent international codes, making supplier qualification a critical factor. Prices are top-tier due to the intensive manufacturing and testing protocols."
  }
];

// ─── COMBINED EXPORT ────────────────────────────────────
export const demandProducts: DemandProduct[] = [
  ...ferrousProducts,
  ...nonFerrousProducts,
  ...polymerProducts,
  ...pipeProducts,
  ...constructionProducts,
  ...compositeProducts,
  ...constructionNewProducts,
  ...ferrousNewProducts,
  ...nonFerrousNewProducts,
  ...pipeNewProducts,
  ...fabricationProducts,
  ...roadSafetyProducts,
  ...storageProducts,
  ...ferrousRetryProducts,
];

export function getDemandProductBySlug(slug: string): DemandProduct | undefined {
  return demandProducts.find(p => p.slug === slug);
}

export function getDemandProductsByCategory(categorySlug: string): DemandProduct[] {
  return demandProducts.filter(p => p.categorySlug === categorySlug);
}

export function getAllDemandSlugs(): string[] {
  return demandProducts.map(p => p.slug);
}
