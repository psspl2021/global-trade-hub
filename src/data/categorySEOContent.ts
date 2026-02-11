import { nameToSlug } from '@/pages/CategoryLanding';

export interface CategorySEOContent {
  intro: string;
  typesH2: string;
  typesContent: string[];
  applicationsH2: string;
  applicationsContent: string;
  sourcingH2: string;
  sourcingContent: string;
  buyLinks: { label: string; slug: string }[];
  relatedCategories: { label: string; slug: string }[];
}

/**
 * Unique SEO content for each /category/{slug} page.
 * Each entry targets 400–600 words total across intro + 3 H2 sections.
 * Internal links point to /buy-*, /post-rfq, and related /category/* pages.
 */
const seoContent: Record<string, CategorySEOContent> = {
  'Agriculture Equipment & Supplies': {
    intro: `Agriculture equipment and supplies form the backbone of India's agrarian economy and are critical for large-scale farming, contract cultivation, and agri-export operations. Buyers across EPC firms, food processing plants, and government procurement agencies rely on B2B sourcing channels to procure farm machinery, irrigation systems, seeds, fertilizers, and post-harvest equipment in bulk. ProcureSaathi connects procurement teams with APEDA-certified and ICAR-verified suppliers, enabling competitive RFQs for domestic and export-ready agricultural products. Whether you need drip irrigation kits for a 500-acre project or organic bio-fertilizers meeting NPOP standards, our AI-driven platform matches your specifications with pre-qualified manufacturers across India.`,
    typesH2: 'Types of Agriculture Equipment Used in B2B Procurement',
    typesContent: [
      'Farm Machinery & Tractors – Rotavators, power tillers, combine harvesters, and seed drills from OEM-authorized dealers for large-scale farm mechanization projects.',
      'Irrigation Systems – Drip irrigation, sprinkler systems, submersible pumps, and micro-irrigation kits conforming to BIS IS 12786 and IS 16146 standards.',
      'Seeds, Fertilizers & Crop Protection – Hybrid seeds, bio-fertilizers, organic pesticides, and plant growth regulators sourced from ICAR-approved suppliers.',
      'Post-Harvest & Storage Equipment – Cold storage units, grain silos, sorting machines, and packaging lines for food processing and export facilities.',
      'Greenhouse & Protected Cultivation – Polyhouse structures, climate control systems, hydroponic setups, and shade nets for precision agriculture projects.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Agricultural equipment procurement serves diverse sectors: government-funded watershed development and PMKSY irrigation schemes, large-scale contract farming operations by FMCG companies, agri-export packaging lines for spice and grain exporters, dairy farm mechanization for cooperative societies, and greenfield food processing plant setups. EPC contractors working on canal lining, micro-irrigation networks, and rural infrastructure projects regularly source pumps, pipes, and mechanization tools through structured RFQ processes to meet project timelines and compliance requirements.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Agriculture Equipment Sourcing',
    sourcingContent: `ProcureSaathi's AI-powered procurement engine lets buyers post detailed RFQs specifying crop type, acreage, irrigation method, and delivery location. The platform matches requirements with verified suppliers who hold APEDA, FSSAI, or BIS certifications. Buyers receive multiple competitive bids within 24–48 hours, compare pricing transparently, and benefit from managed fulfillment including quality inspection, dispatch tracking, and documentation support for export shipments. The system supports both domestic procurement and international trade to markets across the Middle East, Africa, and Southeast Asia.`,
    buyLinks: [
      { label: 'Buy Agricultural Machinery', slug: 'buy-agricultural-machinery' },
      { label: 'Buy Irrigation Equipment', slug: 'buy-irrigation-equipment' },
      { label: 'Buy Fertilizers & Pesticides', slug: 'buy-fertilizers-pesticides' }
    ],
    relatedCategories: [
      { label: 'Food & Beverages', slug: 'food-beverages' },
      { label: 'Chemicals & Raw Materials', slug: 'chemicals-raw-materials' }
    ]
  },

  'Auto Vehicle & Accessories': {
    intro: `Auto vehicle parts and accessories are among the most actively traded B2B categories in India, driven by the country's position as the world's third-largest automotive market. Procurement teams at OEMs, fleet operators, authorized service centers, and aftermarket distributors source engine components, body parts, electrical systems, and performance accessories through structured bidding. ProcureSaathi enables bulk sourcing of genuine OEM and aftermarket auto parts from verified manufacturers across Pune, Chennai, Delhi-NCR, and Ludhiana clusters, with AI-matched RFQs for both domestic distribution and CKD/SKD export requirements.`,
    typesH2: 'Types of Auto Parts Used in B2B Procurement',
    typesContent: [
      'Engine & Transmission Components – Pistons, crankshafts, gearbox assemblies, clutch plates, and turbochargers from IATF 16949-certified manufacturers.',
      'Electrical & Lighting Systems – Headlamp assemblies, wiring harnesses, alternators, starter motors, and LED retrofit kits meeting AIS standards.',
      'Body Parts & Structural Components – Bumpers, fenders, doors, chassis frames, and pressed sheet metal parts for passenger and commercial vehicles.',
      'Braking & Suspension Systems – Disc brake pads, drum shoes, shock absorbers, leaf springs, and anti-roll bars conforming to FMVSS/ECE R90 standards.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Automotive components procurement serves OEM assembly lines, Tier-1 and Tier-2 supplier networks, authorized dealership spare parts inventory, fleet maintenance operations for logistics and transport companies, and defense vehicle refurbishment programs. Construction and mining companies source heavy vehicle parts—axles, hydraulic cylinders, and track assemblies—for earthmoving equipment. Export-oriented manufacturers supply CKD kits and replacement parts to markets in Africa, the Middle East, and ASEAN under bilateral trade agreements.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Auto Parts Sourcing',
    sourcingContent: `Buyers post RFQs specifying vehicle make, model, part number, and quantity. ProcureSaathi's AI matches these with IATF 16949 or ISO 9001-certified suppliers, delivering multiple bids with transparent pricing. The platform supports technical drawing uploads, sample dispatch coordination, and quality inspection before bulk shipment. For export orders, documentation including Certificate of Origin, test reports, and packaging compliance is managed through the fulfillment desk.`,
    buyLinks: [
      { label: 'Buy Auto Engine Parts', slug: 'buy-auto-engine-parts' },
      { label: 'Buy Brake Systems', slug: 'buy-brake-systems' },
      { label: 'Buy Vehicle Accessories', slug: 'buy-vehicle-accessories' }
    ],
    relatedCategories: [
      { label: 'Hardware & Tools', slug: 'hardware-tools' },
      { label: 'Metals - Ferrous (Steel, Iron)', slug: 'metals-ferrous-steel-iron' }
    ]
  },

  'Building & Construction': {
    intro: `Building and construction materials represent one of the highest-value B2B procurement categories in India, underpinning residential, commercial, and infrastructure development projects worth trillions of rupees annually. Procurement managers at EPC firms, real estate developers, government PWD departments, and industrial construction companies source cement, TMT bars, tiles, sanitary ware, structural steel, waterproofing chemicals, and MEP components through competitive bidding. ProcureSaathi streamlines this process by connecting buyers with BIS-certified and ISI-marked manufacturers, enabling project-based pricing, scheduled deliveries, and quality documentation for both domestic and cross-border projects.`,
    typesH2: 'Types of Construction Materials Used in B2B Procurement',
    typesContent: [
      'Cement & Concrete – OPC 43/53 grade cement, ready-mix concrete, fly ash, slag cement, and specialty cements (white, rapid-setting) conforming to IS 269 and IS 12269.',
      'Structural Steel & TMT Bars – Fe 500D/550D TMT bars, MS angles, channels, I-beams, and HR coils meeting IS 1786 and IS 2062 specifications.',
      'Tiles, Flooring & Sanitary Ware – Vitrified tiles, ceramic wall tiles, natural stone slabs, CP fittings, and sanitary fixtures from factories in Morbi and Thangadh.',
      'Waterproofing & Chemicals – Admixtures, sealants, epoxy coatings, and cementitious waterproofing systems for basements, terraces, and water-retaining structures.',
      'MEP Materials – Electrical conduits, plumbing pipes (CPVC, PPR, HDPE), HVAC ducting, and fire safety systems for commercial building fitouts.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Construction material procurement powers highway and expressway projects under Bharatmala, metro rail systems, smart city infrastructure, affordable housing (PMAY), industrial park development, water treatment plants, and power plant civil works. EPC contractors source in bulk with staggered delivery schedules aligned to project milestones. The sector also feeds renovation and retrofit markets for commercial buildings, hospitals, and educational institutions requiring specialized fire-rated, acoustic, or anti-bacterial materials.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Construction Material Sourcing',
    sourcingContent: `Buyers post project-specific RFQs with BOQ details, grade specifications, and delivery schedules. ProcureSaathi's AI engine matches requirements with BIS/ISI-certified manufacturers offering competitive project pricing. The platform supports multi-lot bidding, site delivery coordination, and test certificate verification for structural steel and cement. For international EPC projects, export documentation including Mill Test Certificates and third-party inspection reports is managed through the fulfillment desk.`,
    buyLinks: [
      { label: 'Buy TMT Steel Bars', slug: 'buy-tmt-steel-bars' },
      { label: 'Buy Cement & Concrete', slug: 'buy-cement-concrete' },
      { label: 'Buy Waterproofing Materials', slug: 'buy-waterproofing-materials' }
    ],
    relatedCategories: [
      { label: 'Metals - Ferrous (Steel, Iron)', slug: 'metals-ferrous-steel-iron' },
      { label: 'Pipes & Tubes', slug: 'pipes-tubes' }
    ]
  },

  'Chemicals & Raw Materials': {
    intro: `Industrial chemicals and raw materials are essential inputs for manufacturing, processing, water treatment, and construction industries across India and global export markets. Procurement teams at pharmaceutical companies, textile dyeing units, agrochemical formulators, and water treatment EPC firms source specialty chemicals, solvents, acids, bases, and intermediates through structured RFQ processes. ProcureSaathi connects buyers with REACH-compliant, ISO 9001-certified chemical manufacturers and distributors, facilitating bulk procurement with MSDS documentation, hazmat-compliant logistics, and regulatory support for both domestic consumption and international shipments.`,
    typesH2: 'Types of Chemicals Used in B2B Procurement',
    typesContent: [
      'Industrial Solvents & Acids – MEK, toluene, acetone, sulfuric acid, hydrochloric acid, and nitric acid from GMP-certified chemical plants for manufacturing applications.',
      'Water Treatment Chemicals – Alum, PAC, ferric chloride, sodium hypochlorite, and RO antiscalants for municipal and industrial water treatment plants.',
      'Dyes, Pigments & Intermediates – Reactive dyes, acid dyes, organic pigments, and dye intermediates for textile, leather, and paint industries.',
      'Specialty & Fine Chemicals – Pharmaceutical intermediates, flavoring agents, surfactants, and adhesive raw materials meeting pharmacopeial or food-grade standards.',
      'Petrochemical Derivatives – HDPE, LDPE, polypropylene granules, PVC resin, and rubber process oils for polymer processing industries.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Chemical procurement supports pharmaceutical API synthesis, textile wet processing, paint and coatings manufacturing, water and effluent treatment plant construction, agrochemical formulation, adhesive and sealant production, and construction chemical preparation. EPC firms working on desalination plants, sewage treatment facilities, and industrial effluent systems require consistent chemical supply with batch traceability. Export markets in Africa, Southeast Asia, and Latin America present growing demand for Indian-manufactured chemicals meeting international quality benchmarks.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Chemical Sourcing',
    sourcingContent: `Buyers submit RFQs with CAS numbers, purity grades, packaging requirements, and delivery locations. ProcureSaathi matches these with verified chemical manufacturers providing MSDS, COA, and REACH documentation. The platform coordinates hazmat logistics through licensed transporters, manages sample dispatch for quality validation, and supports recurring procurement contracts with price-lock mechanisms. For export shipments, the platform assists with DGR classification, HS code mapping, and customs documentation.`,
    buyLinks: [
      { label: 'Buy Industrial Chemicals', slug: 'buy-industrial-chemicals' },
      { label: 'Buy Water Treatment Chemicals', slug: 'buy-water-treatment-chemicals' },
      { label: 'Buy Dyes & Pigments', slug: 'buy-dyes-pigments' }
    ],
    relatedCategories: [
      { label: 'Pharmaceuticals & Drugs', slug: 'pharmaceuticals-drugs' },
      { label: 'Polymers & Resins', slug: 'polymers-resins' }
    ]
  },

  'Electrical Equipment & Supplies': {
    intro: `Electrical equipment and supplies constitute a critical procurement category for power distribution, industrial automation, commercial building construction, and infrastructure development projects across India. Buyers including electrical contractors, EPC firms, plant maintenance teams, and government utilities source switchgear, transformers, cables, motors, and panel boards through competitive bidding processes. ProcureSaathi provides access to BIS/ISI-certified electrical product manufacturers and authorized distributors, enabling transparent price discovery, multi-vendor comparison, and quality-assured procurement for both domestic installations and international export projects.`,
    typesH2: 'Types of Electrical Equipment Used in B2B Procurement',
    typesContent: [
      'Cables & Wires – XLPE power cables, armoured cables, control cables, and flexible wires conforming to IS 7098 and IS 694 from CPRI-tested manufacturers.',
      'Switchgear & Protection – ACBs, MCCBs, MCBs, contactors, and relay panels for LT and HT distribution systems in industrial and commercial installations.',
      'Transformers & Motors – Distribution transformers (up to 2500 kVA), dry-type transformers, induction motors, and VFDs for power and industrial applications.',
      'Lighting & Luminaires – LED industrial lights, street lights, flameproof luminaires, and smart lighting systems meeting BEE star-rating requirements.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Electrical equipment procurement serves power distribution companies (DISCOMs), metro rail and railway electrification, smart city street lighting programs, industrial plant electrification, solar farm balance-of-system components, data center power infrastructure, and commercial building MEP works. EPC firms working on substations, transmission lines, and industrial complexes require certified equipment with type-test reports and factory acceptance documentation. Export demand from African and Middle Eastern utility projects creates consistent international sourcing opportunities.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Electrical Equipment Sourcing',
    sourcingContent: `Procurement teams post RFQs specifying voltage rating, current capacity, protection class (IP rating), and applicable IS/IEC standards. ProcureSaathi's AI matches requirements with CPRI/NABL-tested manufacturers and authorized channel partners. The platform facilitates technical bid evaluation, factory inspection coordination, and delivery scheduling aligned to project commissioning timelines. For export orders, CE/IEC certification verification and shipping documentation are handled through the managed fulfillment desk.`,
    buyLinks: [
      { label: 'Buy Electrical Cables', slug: 'buy-electrical-cables' },
      { label: 'Buy Switchgear Panels', slug: 'buy-switchgear-panels' },
      { label: 'Buy Transformers', slug: 'buy-transformers' }
    ],
    relatedCategories: [
      { label: 'Electronic Components', slug: 'electronic-components' },
      { label: 'Energy & Power', slug: 'energy-power' }
    ]
  },

  'Electronic Components': {
    intro: `Electronic components form the foundation of India's rapidly growing electronics manufacturing ecosystem, serving PCB assemblers, OEM product designers, EMS providers, and R&D laboratories. Procurement officers source semiconductors, passive components, connectors, displays, and sensors from both domestic manufacturers and global franchise distributors. ProcureSaathi enables structured sourcing of genuine electronic components with full traceability, datasheets, and compliance certificates, supporting both prototype quantities and high-volume production runs for consumer electronics, industrial automation, and defense applications.`,
    typesH2: 'Types of Electronic Components Used in B2B Procurement',
    typesContent: [
      'Semiconductors & ICs – Microcontrollers, FPGAs, power MOSFETs, op-amps, and voltage regulators from authorized franchise distributors with full traceability.',
      'Passive Components – MLCC capacitors, chip resistors, inductors, and ferrite beads in industrial-temperature grades for automotive and industrial applications.',
      'Connectors & Cables – Board-to-board connectors, D-sub connectors, FFC/FPC cables, and RF connectors meeting MIL-SPEC or IPC standards.',
      'Displays & Optoelectronics – TFT-LCD panels, OLED modules, LED drivers, photodiodes, and optical sensors for instrumentation and consumer products.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Electronic component procurement supports PCB assembly lines for IoT devices and smart meters, industrial PLC and SCADA system manufacturing, telecom infrastructure equipment (5G base stations, fiber optic terminals), medical device production under QMS ISO 13485, defense electronics for BEL and DRDO projects, and automotive ECU manufacturing for Tier-1 suppliers. The PLI scheme for electronics manufacturing has accelerated domestic demand, while export markets for Indian-assembled electronics continue to expand across South Asia and Africa.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Electronic Component Sourcing',
    sourcingContent: `Buyers submit RFQs with manufacturer part numbers, package types, temperature grades, and quantity requirements. ProcureSaathi matches these with authorized distributors and verified suppliers providing datasheets, compliance certificates (RoHS, REACH), and lot traceability. The platform supports BOM uploads for multi-component procurement, manages sample dispatch for engineering validation, and coordinates just-in-time delivery for production schedules.`,
    buyLinks: [
      { label: 'Buy Semiconductors', slug: 'buy-semiconductors' },
      { label: 'Buy PCB Components', slug: 'buy-pcb-components' },
      { label: 'Buy LED Modules', slug: 'buy-led-modules' }
    ],
    relatedCategories: [
      { label: 'Electrical Equipment & Supplies', slug: 'electrical-equipment-supplies' },
      { label: 'Telecommunication', slug: 'telecommunication' }
    ]
  },

  'Energy & Power': {
    intro: `Energy and power equipment procurement spans solar photovoltaic systems, diesel generators, battery energy storage, UPS systems, and grid infrastructure components—all critical for India's expanding energy capacity and net-zero commitments. Procurement teams at renewable energy developers, industrial plant operators, data center builders, and rural electrification agencies source equipment through competitive RFQ processes requiring MNRE approval, BEE ratings, and IEC compliance. ProcureSaathi connects buyers with verified power equipment manufacturers and EPC integrators, enabling transparent bidding for both distributed energy projects and utility-scale installations.`,
    typesH2: 'Types of Energy Equipment Used in B2B Procurement',
    typesContent: [
      'Solar PV Systems – Mono PERC modules, string inverters, mounting structures, and ACDB/DCDB panels from ALMM-listed and MNRE-approved manufacturers.',
      'Generators & Gensets – Diesel generator sets (5 kVA to 2500 kVA), gas generators, and AMF panels for commercial, industrial, and standby power applications.',
      'Battery & Energy Storage – Lithium-ion batteries, VRLA batteries, battery management systems, and containerized energy storage solutions for peak shaving and backup.',
      'UPS & Power Conditioning – Online UPS systems, static transfer switches, voltage stabilizers, and harmonic filters for critical facility power protection.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Energy equipment procurement serves utility-scale solar parks, rooftop solar installations under PM-KUSUM and RESCO models, commercial and industrial captive power plants, telecom tower power backup systems, data center Tier-III/IV power infrastructure, hospital and healthcare facility emergency power, and rural electrification micro-grids. EPC contractors working on solar farms require coordinated delivery of modules, inverters, and BOS components to meet commissioning deadlines. Export demand for Indian solar modules and lithium battery packs is growing across Africa and Southeast Asia.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Energy Equipment Sourcing',
    sourcingContent: `Buyers post RFQs specifying capacity (kW/MW), voltage class, compliance requirements (ALMM, MNRE, IEC 61215), and project location. ProcureSaathi's AI matches these with certified manufacturers and EPC partners providing type-test certificates, warranty documentation, and performance guarantees. The platform supports project-based procurement with milestone-linked deliveries, manages factory acceptance testing coordination, and assists with subsidy documentation for government-backed renewable energy schemes.`,
    buyLinks: [
      { label: 'Buy Solar Panels', slug: 'buy-solar-panels' },
      { label: 'Buy Diesel Generators', slug: 'buy-diesel-generators' },
      { label: 'Buy UPS Systems', slug: 'buy-ups-systems' }
    ],
    relatedCategories: [
      { label: 'Solar & Renewable Energy', slug: 'solar-renewable-energy' },
      { label: 'Electrical Equipment & Supplies', slug: 'electrical-equipment-supplies' }
    ]
  },

  'Food & Beverages': {
    intro: `Food and beverage procurement is a high-volume, compliance-sensitive B2B category covering grains, spices, edible oils, dairy products, processed foods, food additives, and packaging materials. Buyers at hotel chains, QSR franchises, institutional catering companies, food processing plants, and export houses require FSSAI-licensed suppliers with batch traceability, lab test reports, and cold chain capabilities. ProcureSaathi connects food procurement teams with verified manufacturers and processors across India, enabling competitive RFQs for both domestic supply chains and export shipments to the Middle East, Europe, and North America.`,
    typesH2: 'Types of Food Products Used in B2B Procurement',
    typesContent: [
      'Grains, Pulses & Cereals – Basmati rice, wheat flour, tur dal, chana dal, and millets from APEDA-registered exporters and FCI-empaneled suppliers.',
      'Spices & Condiments – Turmeric, chili powder, cumin, coriander, and spice blends from Spices Board-certified processors with aflatoxin testing.',
      'Edible Oils & Fats – Refined soybean oil, mustard oil, palm oil, and specialty oils (sesame, groundnut) in bulk packaging for food service operators.',
      'Processed & Packaged Foods – Ready-to-eat meals, snacks, bakery ingredients, sauces, and frozen foods from FSSAI and HACCP-certified manufacturers.',
      'Food Additives & Ingredients – Emulsifiers, preservatives, colors, flavors, and functional ingredients meeting Codex Alimentarius standards.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Food procurement supports institutional catering for corporate campuses and hospitals, hotel and restaurant chain supply management, food processing plant raw material sourcing, military and paramilitary canteen supplies (CSD), school mid-day meal program ingredients, and export consignment preparation for international buyers. Food manufacturers working on contract manufacturing (private label) projects require consistent raw material quality with batch-to-batch uniformity. Cold chain logistics and temperature-controlled warehousing are critical for dairy, frozen, and perishable product categories.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Food Sourcing',
    sourcingContent: `Buyers post RFQs specifying product grade, packaging type, FSSAI license requirements, and delivery frequency. ProcureSaathi matches requirements with FSSAI, HACCP, and ISO 22000-certified suppliers offering competitive bulk pricing. The platform manages lab test report verification, cold chain logistics coordination, and recurring order scheduling. For export orders, phytosanitary certificates, health certificates, and APEDA documentation are processed through the managed fulfillment desk.`,
    buyLinks: [
      { label: 'Buy Spices & Condiments', slug: 'buy-spices-condiments' },
      { label: 'Buy Edible Oils', slug: 'buy-edible-oils' },
      { label: 'Buy Food Ingredients', slug: 'buy-food-ingredients' }
    ],
    relatedCategories: [
      { label: 'Flavors & Fragrances', slug: 'flavors-fragrances' },
      { label: 'Agriculture Equipment & Supplies', slug: 'agriculture-equipment-supplies' }
    ]
  },

  'Hardware & Tools': {
    intro: `Hardware and tools are foundational procurement items for construction contractors, manufacturing plants, maintenance departments, and industrial service providers across India. From hand tools and power tools to fasteners, abrasives, and cutting instruments, this category supports day-to-day operations in factories, workshops, and project sites. ProcureSaathi enables bulk sourcing of branded and OEM-quality tools from verified manufacturers and authorized distributors, with competitive pricing for both spot purchases and annual rate contracts used by large enterprises and government departments.`,
    typesH2: 'Types of Hardware & Tools Used in B2B Procurement',
    typesContent: [
      'Hand Tools – Wrenches, spanners, pliers, screwdrivers, hammers, and measuring instruments from IS-marked manufacturers for industrial and construction use.',
      'Power Tools – Angle grinders, impact drills, circular saws, demolition hammers, and cordless tool kits from authorized brand distributors.',
      'Fasteners & Fixings – Bolts, nuts, screws, anchors, rivets, and threaded rods in various grades (4.6, 8.8, 10.9, 12.9) conforming to IS 1367.',
      'Abrasives & Cutting Tools – Grinding wheels, cutting discs, sandpaper, flap discs, and carbide-tipped saw blades for metalworking and woodworking applications.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Hardware and tools procurement serves construction site operations, factory floor maintenance, shipyard fabrication, oil and gas pipeline installation, railway track maintenance, automotive workshop equipment, and institutional maintenance (hospitals, universities, government buildings). EPC contractors maintain tool cribs requiring periodic replenishment of consumables—drill bits, grinding discs, welding electrodes—alongside capital equipment like hydraulic torque wrenches and pipe threading machines. Defense and ordnance factories procure specialized tooling meeting DGQA specifications.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Hardware Sourcing',
    sourcingContent: `Buyers post RFQs specifying tool type, brand preference, material grade, and quantity. ProcureSaathi matches these with ISI-marked manufacturers and authorized channel partners, delivering multiple bids with warranty and after-sales terms. The platform supports annual rate contract procurement, manages tool calibration certificate verification, and coordinates pan-India delivery from manufacturer warehouses. For export buyers, quality test reports and packaging compliance documentation are prepared by the fulfillment team.`,
    buyLinks: [
      { label: 'Buy Power Tools', slug: 'buy-power-tools' },
      { label: 'Buy Industrial Fasteners', slug: 'buy-industrial-fasteners' },
      { label: 'Buy Abrasives & Cutting Tools', slug: 'buy-abrasives-cutting-tools' }
    ],
    relatedCategories: [
      { label: 'Industrial Supplies', slug: 'industrial-supplies' },
      { label: 'Safety & Security', slug: 'safety-security' }
    ]
  },

  'Medical & Healthcare': {
    intro: `Medical and healthcare equipment procurement serves hospitals, diagnostic centers, pharmaceutical companies, research institutions, and public health agencies. This high-compliance category demands suppliers with ISO 13485 certification, CDSCO registration, and adherence to Medical Device Rules 2017. Buyers source diagnostic instruments, surgical devices, hospital furniture, consumables, and laboratory equipment through regulated procurement channels. ProcureSaathi connects healthcare procurement teams with verified medical device manufacturers and distributors, enabling transparent RFQ processes with quality documentation, regulatory compliance verification, and managed logistics for both domestic and export requirements.`,
    typesH2: 'Types of Medical Equipment Used in B2B Procurement',
    typesContent: [
      'Diagnostic Equipment – X-ray machines, ultrasound systems, ECG monitors, hematology analyzers, and biochemistry analyzers from CDSCO-registered manufacturers.',
      'Surgical Instruments – Orthopedic implants, endoscopy systems, electrosurgical units, and operating room equipment meeting IS 13450 and EN ISO 7153 standards.',
      'Hospital Furniture & Infrastructure – ICU beds, OT tables, patient monitors, medical gas pipeline systems, and modular OT panels for hospital construction projects.',
      'Consumables & Disposables – Syringes, IV sets, surgical gloves, wound care products, and diagnostic test kits from WHO-GMP and CE-marked manufacturers.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Medical equipment procurement supports new hospital construction and commissioning, government health program equipment supply (Ayushman Bharat, NHM), diagnostic lab chain expansion, pharmaceutical manufacturing quality control labs, and medical device export to regulated and semi-regulated markets. EPC firms working on hospital turnkey projects procure complete equipment packages including CSSD, radiology suites, and laboratory setups. India's medical device export market—spanning surgical instruments from Tuttlingen-competitor clusters in Jalandhar and Aurangabad—continues to grow across Africa, Latin America, and CIS countries.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Medical Equipment Sourcing',
    sourcingContent: `Buyers post RFQs specifying device classification (Class A/B/C/D), technical specifications, and regulatory requirements. ProcureSaathi's AI matches these with CDSCO-registered and ISO 13485-certified manufacturers. The platform verifies manufacturing licenses, manages sample evaluation, and coordinates installation and commissioning support. For export orders, CE marking verification, FDA 510(k) status checks, and WHO prequalification documentation are handled through the managed fulfillment desk.`,
    buyLinks: [
      { label: 'Buy Diagnostic Equipment', slug: 'buy-diagnostic-equipment' },
      { label: 'Buy Surgical Instruments', slug: 'buy-surgical-instruments' },
      { label: 'Buy Hospital Furniture', slug: 'buy-hospital-furniture' }
    ],
    relatedCategories: [
      { label: 'Pharmaceuticals & Drugs', slug: 'pharmaceuticals-drugs' },
      { label: 'Safety & Security', slug: 'safety-security' }
    ]
  },

  'Metals - Ferrous (Steel, Iron)': {
    intro: `Ferrous metals—primarily steel and iron—represent the highest-value B2B procurement category in India's industrial economy, underpinning construction, manufacturing, infrastructure, and defense sectors. Procurement managers at EPC firms, steel fabricators, automotive component manufacturers, and government infrastructure agencies source TMT bars, structural steel, HR/CR coils, plates, and specialty alloys through competitive bidding. ProcureSaathi connects buyers with SAIL, JSW, Tata Steel-authorized channel partners and secondary steel producers, enabling real-time price discovery, mill-direct procurement, and quality-verified sourcing with Mill Test Certificates for both domestic projects and export shipments.`,
    typesH2: 'Types of Ferrous Metals Used in B2B Procurement',
    typesContent: [
      'TMT Reinforcement Bars – Fe 500D and Fe 550D TMT bars conforming to IS 1786:2008 for RCC construction in buildings, bridges, and infrastructure projects.',
      'Structural Steel Sections – I-beams, H-beams, channels, angles, and hollow sections per IS 2062 for industrial sheds, warehouses, and pre-engineered buildings.',
      'HR & CR Coils/Sheets – Hot-rolled and cold-rolled steel coils for automotive stamping, appliance manufacturing, pipe making, and general fabrication.',
      'Steel Plates & Specialty Alloys – Boiler-quality plates (IS 2002), shipbuilding plates (LR/ABS grade), and alloy steel (EN8, EN24, EN31) for heavy engineering applications.',
      'Pig Iron & Cast Iron – Foundry-grade pig iron, SG iron, and grey cast iron for automotive castings, pump housings, and machine tool components.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Ferrous metal procurement serves highway and bridge construction under Bharatmala, metro rail viaduct and station structures, industrial building and warehouse pre-engineered frameworks, shipbuilding and offshore platform fabrication, automotive body-in-white and chassis manufacturing, railway coach and wagon production, and defense equipment manufacturing. EPC contractors working on power plants, refineries, and petrochemical complexes require project-specific steel grades with third-party inspection (TPI) certification from agencies like Lloyds, BV, or TUV.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Steel Sourcing',
    sourcingContent: `Buyers post RFQs specifying steel grade, section size, quantity, and delivery schedule. ProcureSaathi matches these with mill-authorized stockists and secondary producers providing Mill Test Certificates, chemical composition reports, and mechanical test results. The platform supports multi-lot procurement with staggered deliveries, manages third-party inspection coordination, and provides real-time market price benchmarking. For export orders, documentation including Certificate of Origin, packing lists, and BL drafts is prepared by the managed trade desk.`,
    buyLinks: [
      { label: 'Buy TMT Steel Bars', slug: 'buy-tmt-steel-bars' },
      { label: 'Buy Structural Steel', slug: 'buy-structural-steel' },
      { label: 'Buy HR/CR Steel Coils', slug: 'buy-hr-cr-steel-coils' }
    ],
    relatedCategories: [
      { label: 'Building & Construction', slug: 'building-construction' },
      { label: 'Steel Fabrication & Structures', slug: 'steel-fabrication-structures' }
    ]
  },

  'Metals - Non-Ferrous (Copper, Aluminium)': {
    intro: `Non-ferrous metals including copper, aluminium, zinc, brass, and nickel alloys serve critical roles in electrical, automotive, aerospace, and construction industries. Procurement teams at cable manufacturers, die-casting units, extrusion plants, and electrical equipment OEMs source wire rods, ingots, sheets, and extruded profiles through bulk bidding. ProcureSaathi enables procurement of LME-benchmarked non-ferrous metals from smelters, rolling mills, and authorized distributors, with transparent pricing linked to international commodity indices and quality verification through spectro-analysis certificates.`,
    typesH2: 'Types of Non-Ferrous Metals Used in B2B Procurement',
    typesContent: [
      'Copper – Electrolytic copper cathodes, copper wire rods, bus bars, and copper tubes for electrical, plumbing, and heat exchanger applications.',
      'Aluminium – Primary ingots, extrusion billets, rolled sheets, and foils for construction facades, automotive components, and packaging industries.',
      'Brass & Bronze – Brass rods, sheets, and castings for plumbing fittings, electrical terminals, and decorative hardware applications.',
      'Zinc & Lead – Zinc ingots for galvanizing, zinc die-casting alloys, and lead for battery manufacturing and radiation shielding.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Non-ferrous metal procurement supports power cable manufacturing, transformer winding (copper strips), aluminium curtain wall and facade systems for commercial buildings, automotive heat exchangers and radiators, aerospace component machining, electronics heat sink production, and marine hardware fabrication. EPC firms working on power transmission and distribution projects consume significant copper for bus bars, earthing systems, and cable trays. India's aluminium extrusion industry serves both domestic construction and export markets for architectural profiles.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Non-Ferrous Metal Sourcing',
    sourcingContent: `Buyers post RFQs specifying alloy grade, temper, dimensions, and quantity with LME-linked pricing preferences. ProcureSaathi matches requirements with smelters, rolling mills, and authorized stockists providing spectro-analysis reports and dimensional inspection certificates. The platform supports hedging-aware procurement with LME price benchmarking, manages quality inspection at dispatch, and coordinates logistics for both domestic and export shipments with proper packaging for corrosion-sensitive materials.`,
    buyLinks: [
      { label: 'Buy Copper Products', slug: 'buy-copper-products' },
      { label: 'Buy Aluminium Sheets', slug: 'buy-aluminium-sheets' },
      { label: 'Buy Brass Fittings', slug: 'buy-brass-fittings' }
    ],
    relatedCategories: [
      { label: 'Metals - Ferrous (Steel, Iron)', slug: 'metals-ferrous-steel-iron' },
      { label: 'Electrical Equipment & Supplies', slug: 'electrical-equipment-supplies' }
    ]
  },

  'Pharmaceuticals & Drugs': {
    intro: `Pharmaceutical procurement covers Active Pharmaceutical Ingredients (APIs), finished dosage forms, excipients, packaging materials, and analytical reference standards for drug manufacturers, hospitals, distributors, and export houses. India's position as the "pharmacy of the world" makes this a globally significant B2B category governed by WHO-GMP, Schedule M, and ICH guidelines. ProcureSaathi connects pharmaceutical procurement teams with CDSCO-licensed, WHO-GMP-certified manufacturers, enabling transparent bidding for both domestic supply and export to regulated markets including the US (FDA), EU (EMA), and Africa (WHO prequalified).`,
    typesH2: 'Types of Pharmaceutical Products Used in B2B Procurement',
    typesContent: [
      'APIs & Intermediates – Bulk drug substances, key starting materials, and pharmaceutical intermediates from DMF/CEP-holding manufacturers in Hyderabad and Gujarat clusters.',
      'Finished Dosage Forms – Tablets, capsules, injectables, syrups, and topical formulations for domestic distribution and export under contract manufacturing agreements.',
      'Excipients & Raw Materials – Microcrystalline cellulose, starch, gelatin capsule shells, coating agents, and packaging materials meeting pharmacopeial (IP/BP/USP) standards.',
      'Surgical & Diagnostic Products – Surgical sutures, wound care dressings, rapid diagnostic kits, and point-of-care testing devices from CE-marked manufacturers.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Pharmaceutical procurement supports generic drug manufacturing for domestic and export markets, hospital pharmacy supply chain management, government tender supplies (CGHS, ESIC, state medical corporations), veterinary pharmaceutical production, nutraceutical and dietary supplement manufacturing, and clinical trial material sourcing. India exports pharmaceutical products to 200+ countries, with key markets being the US, Africa, Southeast Asia, and Latin America. Contract manufacturing (CDMO) and contract research (CRO) operations drive significant B2B procurement of APIs, excipients, and packaging materials.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Pharmaceutical Sourcing',
    sourcingContent: `Buyers post RFQs specifying drug substance, pharmacopeial standard, DMF status, and quantity requirements. ProcureSaathi matches these with WHO-GMP, FDA-inspected, and EU-GMP-certified manufacturers providing COA, stability data, and regulatory documentation. The platform verifies manufacturing licenses, manages cold chain logistics for temperature-sensitive products, and coordinates documentation for regulated market submissions. For export orders, Free Sale Certificates, CPP, and WHO prequalification dossier support are available through the managed fulfillment desk.`,
    buyLinks: [
      { label: 'Buy Pharmaceutical APIs', slug: 'buy-pharmaceutical-apis' },
      { label: 'Buy Pharma Excipients', slug: 'buy-pharma-excipients' },
      { label: 'Buy Medical Consumables', slug: 'buy-medical-consumables' }
    ],
    relatedCategories: [
      { label: 'Medical & Healthcare', slug: 'medical-healthcare' },
      { label: 'Chemicals & Raw Materials', slug: 'chemicals-raw-materials' }
    ]
  },

  'Pipes & Tubes': {
    intro: `Pipes and tubes are essential procurement items for water supply, oil and gas transmission, industrial process piping, structural applications, and plumbing systems. Buyers at EPC firms, municipal water boards, petrochemical refineries, and construction contractors source MS pipes, GI pipes, HDPE pipes, CPVC pipes, SS tubes, and API-grade line pipes through competitive bidding. ProcureSaathi connects procurement teams with BIS-certified pipe manufacturers and stockists, enabling transparent price discovery across mill-direct and secondary market channels with Mill Test Certificates, hydrostatic test reports, and dimensional inspection documentation.`,
    typesH2: 'Types of Pipes & Tubes Used in B2B Procurement',
    typesContent: [
      'MS & GI Pipes – ERW and seamless pipes in IS 1239, IS 3589, and IS 4923 grades for water supply, structural, and scaffolding applications.',
      'HDPE & PVC Pipes – PE 100 and PE 80 pipes for water distribution, sewerage, and gas distribution networks conforming to IS 4984 and IS 14333.',
      'SS & Alloy Tubes – Stainless steel (304, 316, 321) and alloy steel tubes for heat exchangers, boilers, and pharmaceutical/food processing equipment.',
      'API Line Pipes – API 5L Grade B, X42, X52, and X65 pipes for oil, gas, and petrochemical transmission pipeline projects.',
      'CPVC & PPR Pipes – Hot and cold water plumbing pipes for residential, commercial, and industrial building projects with NSF/ASTM certification.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Pipe procurement serves Jal Jeevan Mission and AMRUT water supply projects, city gas distribution (CGD) networks under PNGRB, refinery and petrochemical plant process piping, power plant steam and condensate lines, HVAC chilled water systems in commercial buildings, fire fighting networks, and agricultural micro-irrigation mainlines. EPC contractors working on cross-country pipeline projects require API-certified pipes with radiography testing and coating (3LPE, FBE) documentation. Export demand for Indian-manufactured HDPE and ERW pipes is strong in Middle Eastern and African infrastructure projects.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Pipe Sourcing',
    sourcingContent: `Buyers post RFQs specifying pipe material, size (NB/OD), schedule/thickness, grade, and coating requirements. ProcureSaathi matches these with BIS-licensed mills and authorized stockists providing Mill Test Certificates, hydro test reports, and third-party inspection certificates. The platform supports project-specific procurement with delivery scheduling aligned to construction milestones, manages stockyard inspection coordination, and handles export documentation including packing lists, weight reconciliation, and shipping marks for international projects.`,
    buyLinks: [
      { label: 'Buy MS & GI Pipes', slug: 'buy-ms-gi-pipes' },
      { label: 'Buy HDPE Pipes', slug: 'buy-hdpe-pipes' },
      { label: 'Buy Stainless Steel Tubes', slug: 'buy-stainless-steel-tubes' }
    ],
    relatedCategories: [
      { label: 'Metals - Ferrous (Steel, Iron)', slug: 'metals-ferrous-steel-iron' },
      { label: 'Building & Construction', slug: 'building-construction' }
    ]
  },

  'Polymers & Resins': {
    intro: `Polymers and resins form the feedstock for India's plastics processing, coatings, adhesives, and composites industries. Procurement teams at injection molding units, extrusion plants, paint manufacturers, and FRP fabricators source polyethylene, polypropylene, PVC, epoxy resins, polyester resins, and engineering plastics through bulk bidding linked to petrochemical index pricing. ProcureSaathi enables structured procurement from petrochemical majors, compounders, and authorized distributors with grade-specific matching, price benchmarking, and quality documentation including COA and processing data sheets.`,
    typesH2: 'Types of Polymers & Resins Used in B2B Procurement',
    typesContent: [
      'Commodity Polymers – HDPE, LDPE, LLDPE, PP (homo and co-polymer), and PVC resin in various grades for film, pipe, molding, and fiber applications.',
      'Engineering Plastics – Nylon (PA6, PA66), polycarbonate, ABS, POM, and PBT for automotive, electrical, and precision component manufacturing.',
      'Thermoset Resins – Epoxy resins, unsaturated polyester resins, vinyl ester resins, and phenolic resins for coatings, adhesives, laminates, and FRP/GRP fabrication.',
      'Specialty Compounds – Masterbatches, PVC compounds, TPE/TPU compounds, and flame-retardant grades for specific application requirements.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Polymer procurement supports packaging film and container manufacturing, automotive interior and exterior component molding, construction pipe and profile extrusion, electrical insulation and cable compounding, FRP tank and vessel fabrication for chemical plants, marine and wind energy composite structures, and consumer product manufacturing. EPC firms working on water treatment, chemical storage, and corrosion-resistant infrastructure require specialty resins with certified chemical resistance data. India's polymer processing industry exports finished products to over 150 countries.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Polymer Sourcing',
    sourcingContent: `Buyers post RFQs specifying polymer type, grade, MFI (melt flow index), and quantity with price-index linkage preferences. ProcureSaathi matches requirements with petrochemical producers, authorized distributors, and compounders providing material datasheets, COA, and processing parameter recommendations. The platform supports index-linked pricing contracts, manages warehouse-to-factory logistics, and coordinates material testing for quality validation. For export buyers, packaging compliance and shipping documentation are managed through the fulfillment desk.`,
    buyLinks: [
      { label: 'Buy Polyethylene Granules', slug: 'buy-polyethylene-granules' },
      { label: 'Buy Epoxy Resins', slug: 'buy-epoxy-resins' },
      { label: 'Buy Engineering Plastics', slug: 'buy-engineering-plastics' }
    ],
    relatedCategories: [
      { label: 'Chemicals & Raw Materials', slug: 'chemicals-raw-materials' },
      { label: 'Plastic & Rubber', slug: 'plastic-rubber' }
    ]
  },

  'Safety & Security': {
    intro: `Safety and security equipment procurement is mandatory for industrial plants, construction sites, mining operations, and commercial establishments under the Factories Act, Building & Other Construction Workers Act, and DGMS regulations. Buyers source personal protective equipment (PPE), fire safety systems, CCTV surveillance, access control, and industrial safety signage from certified manufacturers. ProcureSaathi connects procurement teams with BIS/ISI-marked, CE-certified, and DGMS-approved safety equipment suppliers, enabling compliant procurement with product test certificates, user training documentation, and managed logistics for multi-site delivery.`,
    typesH2: 'Types of Safety Equipment Used in B2B Procurement',
    typesContent: [
      'Personal Protective Equipment – Safety helmets (IS 2925), safety shoes (IS 15298), harnesses (IS 3521), safety goggles, ear muffs, and respiratory protection equipment.',
      'Fire Safety Systems – Fire extinguishers, fire alarm panels, sprinkler systems, fire-rated doors, and fire suppression systems conforming to IS 15683 and NBC norms.',
      'Surveillance & Access Control – CCTV cameras, NVR/DVR systems, biometric access control, boom barriers, and perimeter security systems for industrial and commercial premises.',
      'Industrial Safety Equipment – Gas detectors, flame arresters, safety showers, emergency eyewash stations, and explosion-proof electrical fittings for hazardous area installations.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Safety equipment procurement serves construction project safety compliance, factory and plant PPE replenishment programs, oil and gas facility hazardous area protection, mining operation DGMS-mandated safety gear, smart city surveillance infrastructure, commercial building fire safety retrofits, and institutional security systems. EPC contractors maintain safety stores requiring monthly replenishment of consumable PPE alongside capital equipment like confined space rescue kits and portable gas monitoring systems. Export demand exists for Indian-manufactured safety helmets, gloves, and fire extinguishers in African and South Asian markets.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Safety Equipment Sourcing',
    sourcingContent: `Buyers post RFQs specifying product standards (IS/EN/ANSI), protection class, quantity, and delivery sites. ProcureSaathi matches these with BIS-licensed and CE-certified manufacturers providing type-test certificates, batch test reports, and compliance documentation. The platform supports annual rate contracts for recurring PPE procurement, manages multi-site delivery coordination, and assists with regulatory documentation for factory inspector audits. For export orders, CE/EN certification verification and packaging compliance are handled by the fulfillment team.`,
    buyLinks: [
      { label: 'Buy PPE Equipment', slug: 'buy-ppe-equipment' },
      { label: 'Buy Fire Safety Systems', slug: 'buy-fire-safety-systems' },
      { label: 'Buy CCTV & Surveillance', slug: 'buy-cctv-surveillance' }
    ],
    relatedCategories: [
      { label: 'Industrial Supplies', slug: 'industrial-supplies' },
      { label: 'Electrical Equipment & Supplies', slug: 'electrical-equipment-supplies' }
    ]
  },

  'Textiles & Leather': {
    intro: `Textiles and leather represent one of India's largest export-oriented B2B procurement categories, encompassing fabrics, yarns, garments, leather goods, and technical textiles. Buyers at garment manufacturers, upholstery fabricators, leather goods exporters, automotive seat cover producers, and technical textile converters source raw materials and finished products through structured bidding. ProcureSaathi connects textile procurement teams with OEKO-TEX, ISO 9001, and LWG-certified manufacturers across Tirupur, Surat, Ludhiana, Kanpur, and Chennai textile clusters, enabling competitive RFQs for both domestic consumption and export to the US, EU, and Middle Eastern markets.`,
    typesH2: 'Types of Textiles & Leather Used in B2B Procurement',
    typesContent: [
      'Fabrics & Yarns – Cotton, polyester, blended fabrics, denim, technical textiles, and specialty yarns (viscose, modal, bamboo) for garment and industrial applications.',
      'Garments & Apparel – Ready-made garments, uniforms, workwear, sportswear, and private-label clothing from SEDEX-audited manufacturing units.',
      'Leather & Leather Goods – Finished leather (bovine, goat, sheep), leather footwear, bags, belts, and automotive leather from LWG-certified tanneries.',
      'Technical Textiles – Geotextiles, agrotextiles, medical textiles, and protective textiles for infrastructure, agriculture, and healthcare applications.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Textile procurement supports garment export manufacturing, automotive interior trim and seat cover production, hospital linen and medical textile supply, defense uniform and tent manufacturing, hotel and hospitality linen procurement, geotextile installation in road and embankment construction, and industrial filtration fabric supply. Leather procurement serves footwear manufacturing clusters, automotive upholstery OEMs, fashion goods exporters, and saddlery/equestrian equipment makers. India's textile and leather exports exceed $40 billion annually, with significant growth in technical textiles and sustainable fashion segments.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Textile & Leather Sourcing',
    sourcingContent: `Buyers post RFQs specifying fabric composition, GSM, width, finish, and compliance requirements (OEKO-TEX, GOTS, REACH). ProcureSaathi matches these with certified manufacturers providing shade cards, sample yardage, and test reports (pilling, colorfastness, tensile strength). The platform coordinates sample approval workflows, manages production tracking, and handles export documentation including GSP certificates and fumigation certificates. For leather products, LWG certification verification and restricted substance testing compliance are managed through the quality desk.`,
    buyLinks: [
      { label: 'Buy Cotton Fabrics', slug: 'buy-cotton-fabrics' },
      { label: 'Buy Technical Textiles', slug: 'buy-technical-textiles' },
      { label: 'Buy Leather Products', slug: 'buy-leather-products' }
    ],
    relatedCategories: [
      { label: 'Industrial Supplies', slug: 'industrial-supplies' },
      { label: 'Packaging & Printing', slug: 'packaging-printing' }
    ]
  },

  'Telecommunication': {
    intro: `Telecommunication equipment procurement supports India's rapid 5G rollout, fiber-to-the-home (FTTH) expansion, and enterprise networking infrastructure. Buyers at telecom operators, ISPs, system integrators, and IT infrastructure companies source optical fiber cables, networking switches, antenna systems, and cable management products through structured bidding. ProcureSaathi connects procurement teams with TEC-certified and BIS-compliant telecom equipment manufacturers, enabling competitive RFQs for both domestic network expansion and export to emerging telecom markets in Africa and South Asia.`,
    typesH2: 'Types of Telecom Equipment Used in B2B Procurement',
    typesContent: [
      'Optical Fiber & Cables – Single-mode and multi-mode fiber cables, FTTH drop cables, armoured fiber cables, and fiber patch cords conforming to ITU-T G.652/G.657 standards.',
      'Networking Equipment – Managed switches, routers, wireless access points, PoE injectors, and network management systems for enterprise and carrier-grade deployments.',
      'Antenna & RF Systems – 4G/5G antennas, small cells, tower-mounted amplifiers, RF connectors, and waveguide components for mobile network infrastructure.',
      'Cable Management & Accessories – Cable trays, conduits, splice closures, ODF panels, and FDMS cabinets for organized network infrastructure deployment.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Telecom equipment procurement serves 5G network rollout by major operators, BharatNet rural broadband backbone expansion, smart city ICT infrastructure including city surveillance and Wi-Fi, enterprise campus networking and data center interconnects, defense communication network modernization, and railway signaling and communication system upgrades. EPC firms working on telecom tower infrastructure, fiber trenching, and data center construction require coordinated delivery of active and passive components to meet rollout timelines and TEC compliance requirements.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Telecom Equipment Sourcing',
    sourcingContent: `Buyers post RFQs specifying equipment type, TEC certification requirements, capacity, and deployment timeline. ProcureSaathi matches these with TEC-certified and BIS-compliant manufacturers providing type approval certificates, test reports, and warranty documentation. The platform supports project-based procurement with milestone-aligned deliveries, manages factory acceptance testing, and coordinates logistics for multi-site deployments. For export orders, international certification verification (FCC, CE, ETSI) and shipping documentation are handled through the managed fulfillment desk.`,
    buyLinks: [
      { label: 'Buy Fiber Optic Cables', slug: 'buy-fiber-optic-cables' },
      { label: 'Buy Networking Equipment', slug: 'buy-networking-equipment' },
      { label: 'Buy Telecom Antennas', slug: 'buy-telecom-antennas' }
    ],
    relatedCategories: [
      { label: 'Electronic Components', slug: 'electronic-components' },
      { label: 'Electrical Equipment & Supplies', slug: 'electrical-equipment-supplies' }
    ]
  },

  'Packaging & Printing': {
    intro: `Packaging and printing materials are essential procurement items for FMCG companies, pharmaceutical manufacturers, food processors, e-commerce logistics providers, and export houses. Buyers source corrugated boxes, flexible packaging films, labels, printing inks, and specialty packaging from certified converters and printers. ProcureSaathi connects packaging procurement teams with FSSAI-compliant, ISO 9001-certified, and BRC-audited packaging manufacturers, enabling competitive RFQs for both standard and custom packaging solutions with artwork proofing, material testing, and managed logistics.`,
    typesH2: 'Types of Packaging Used in B2B Procurement',
    typesContent: [
      'Corrugated Packaging – Shipping boxes, die-cut cartons, display packaging, and heavy-duty industrial packaging in various flute profiles (B, C, BC, E).',
      'Flexible Packaging – BOPP, BOPET, PE, and laminated films for food, pharma, and FMCG product wrapping with barrier properties and print capability.',
      'Labels & Printing – Self-adhesive labels, shrink sleeves, printed cartons, and promotional materials with UV/flexo/gravure printing options.',
      'Specialty Packaging – Anti-static packaging for electronics, VCI packaging for metal parts, cold chain packaging, and tamper-evident solutions.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Packaging procurement supports FMCG product launches and seasonal promotions, pharmaceutical primary and secondary packaging compliance, food export packaging meeting destination country regulations, e-commerce fulfillment center packaging supplies, industrial export packaging with ISPM-15 compliant wooden crates, and automotive component transit packaging. Print procurement covers marketing collateral, product catalogs, POS displays, and compliance labeling across industries. India's packaging industry serves both domestic consumption and contract packaging export services.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Packaging Sourcing',
    sourcingContent: `Buyers post RFQs specifying packaging type, material, dimensions, print specifications, and compliance requirements. ProcureSaathi matches these with certified converters and printers providing material test reports, print proofs, and food-contact compliance certificates. The platform supports artwork approval workflows, manages sample production, and coordinates just-in-time delivery for production schedules. For export packaging, ISPM-15 compliance verification and destination-specific regulatory documentation are handled by the fulfillment team.`,
    buyLinks: [
      { label: 'Buy Corrugated Boxes', slug: 'buy-corrugated-boxes' },
      { label: 'Buy Flexible Packaging Films', slug: 'buy-flexible-packaging-films' },
      { label: 'Buy Printed Labels', slug: 'buy-printed-labels' }
    ],
    relatedCategories: [
      { label: 'Paper & Paper Products', slug: 'paper-paper-products' },
      { label: 'Plastic & Rubber', slug: 'plastic-rubber' }
    ]
  },

  'Solar & Renewable Energy': {
    intro: `Solar and renewable energy equipment procurement is a rapidly growing B2B category driven by India's ambitious target of 500 GW non-fossil fuel capacity by 2030. Procurement teams at solar EPC firms, IPPs, C&I rooftop developers, and state renewable energy agencies source solar modules, inverters, mounting structures, and balance-of-system components through competitive bidding. ProcureSaathi connects buyers with ALMM-listed, MNRE-approved, and IEC-certified solar equipment manufacturers, enabling transparent procurement for utility-scale, commercial rooftop, and off-grid solar installations across India and export markets.`,
    typesH2: 'Types of Solar Equipment Used in B2B Procurement',
    typesContent: [
      'Solar PV Modules – Mono PERC, bifacial, TOPCon, and HJT technology modules from ALMM-listed manufacturers in capacities from 540Wp to 700Wp.',
      'Solar Inverters – String inverters, central inverters, and micro-inverters with MNRE/BIS certification for grid-tied, off-grid, and hybrid applications.',
      'Mounting & Tracking Systems – Fixed-tilt ground mount structures, rooftop mounting systems, single-axis trackers, and floating solar platforms.',
      'BOS Components – AC/DC distribution boxes, solar cables, MC4 connectors, earthing kits, and monitoring systems for complete solar plant installations.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Solar equipment procurement serves utility-scale solar park development, commercial and industrial rooftop installations under net metering and open access, agricultural solar pump systems under PM-KUSUM, floating solar projects on reservoirs and canals, solar-hybrid power plants with battery storage, and off-grid electrification for remote communities. EPC contractors working on large solar projects require coordinated procurement of modules, inverters, structures, and BOS components with delivery aligned to construction milestones. India also exports solar modules and EPC services to markets across Africa, Southeast Asia, and the Pacific Islands.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Solar Equipment Sourcing',
    sourcingContent: `Buyers post RFQs specifying module technology, inverter capacity, mounting type, and project location. ProcureSaathi matches these with ALMM-listed and IEC 61215/61730-certified manufacturers providing flash test reports, warranty certificates, and performance guarantee documentation. The platform supports project-based procurement with milestone deliveries, manages EL testing and visual inspection coordination, and assists with MNRE subsidy documentation. For export projects, IEC certification verification and international shipping coordination are handled through the managed trade desk.`,
    buyLinks: [
      { label: 'Buy Solar Modules', slug: 'buy-solar-modules' },
      { label: 'Buy Solar Inverters', slug: 'buy-solar-inverters' },
      { label: 'Buy Mounting Structures', slug: 'buy-mounting-structures' }
    ],
    relatedCategories: [
      { label: 'Energy & Power', slug: 'energy-power' },
      { label: 'Electrical Equipment & Supplies', slug: 'electrical-equipment-supplies' }
    ]
  },

  'Petroleum & Bitumen': {
    intro: `Petroleum products and bitumen are critical procurement categories for road construction, waterproofing, industrial fuel supply, and lubricant distribution. Buyers at NHAI contractors, PWD departments, asphalt mixing plants, and industrial fuel consumers source VG-grade bitumen, modified bitumen (CRMB, PMB), industrial fuels, base oils, and specialty petroleum products through structured bidding. ProcureSaathi connects procurement teams with refineries, authorized distributors, and bitumen importers, enabling transparent price discovery with depot-linked pricing, quality documentation, and managed tanker logistics.`,
    typesH2: 'Types of Petroleum Products Used in B2B Procurement',
    typesContent: [
      'Bitumen – VG-10, VG-30, and VG-40 grade bitumen conforming to IS 73:2013 for road construction, along with CRMB-55 and PMB-40 for highway projects.',
      'Bitumen Emulsions – Rapid-setting (RS), medium-setting (MS), and slow-setting (SS) emulsions for surface dressing, tack coating, and cold mix applications.',
      'Industrial Fuels – Furnace oil, LSHS, LDO, and HSD for industrial boilers, kilns, and DG sets in manufacturing and power generation facilities.',
      'Lubricants & Base Oils – Group I, II, and III base oils, automotive lubricants, industrial gear oils, and specialty greases for manufacturing and transport fleets.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Petroleum product procurement serves national highway construction under Bharatmala, state PWD road building and maintenance, airport runway resurfacing, industrial estate road infrastructure, waterproofing of rooftops and basements using bitumen-based membranes, and marine and structural coating applications. EPC contractors working on expressway projects consume thousands of metric tons of bitumen with staggered delivery from refinery depots. Industrial fuel procurement supports manufacturing plants, power generation, and process heating applications across ceramics, glass, and metallurgical industries.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Petroleum Sourcing',
    sourcingContent: `Buyers post RFQs specifying product grade, quantity, delivery depot, and packaging (bulk/drummed). ProcureSaathi matches these with refinery-authorized distributors and importers providing test certificates, viscosity reports, and penetration grade verification. The platform supports depot-linked pricing with transparent freight calculations, manages tanker logistics coordination, and handles documentation for both domestic supply and export shipments. For modified bitumen, performance grade test reports and JMF compatibility data are verified through the quality desk.`,
    buyLinks: [
      { label: 'Buy Bitumen VG-30', slug: 'buy-bitumen-vg-30' },
      { label: 'Buy Bitumen Emulsion', slug: 'buy-bitumen-emulsion' },
      { label: 'Buy Industrial Fuels', slug: 'buy-industrial-fuels' }
    ],
    relatedCategories: [
      { label: 'Road Safety & Infrastructure', slug: 'road-safety-infrastructure' },
      { label: 'Building & Construction', slug: 'building-construction' }
    ]
  },

  'Industrial Supplies': {
    intro: `Industrial supplies encompass a broad range of MRO (maintenance, repair, and operations) products required for the day-to-day functioning of factories, plants, and commercial facilities. Procurement teams source bearings, belts, lubricants, seals, gaskets, cleaning chemicals, and workshop consumables through annual rate contracts and spot purchases. ProcureSaathi connects industrial buyers with authorized distributors and OEM-quality manufacturers, enabling efficient procurement with competitive pricing, genuine product verification, and pan-India delivery for both single-plant and multi-site operations.`,
    typesH2: 'Types of Industrial Supplies Used in B2B Procurement',
    typesContent: [
      'Bearings & Power Transmission – Ball bearings, roller bearings, timing belts, V-belts, chains, and sprockets from authorized SKF, FAG, and NTN distributors.',
      'Seals, Gaskets & O-Rings – Mechanical seals, hydraulic seals, spiral wound gaskets, and Viton/PTFE O-rings for pump, valve, and flange applications.',
      'Industrial Lubricants & Greases – Hydraulic oils, gear oils, cutting fluids, and specialty greases for manufacturing equipment maintenance programs.',
      'Workshop & Cleaning Supplies – Degreasing solvents, industrial wipes, absorbents, workshop furniture, and waste management supplies for factory housekeeping.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Industrial supply procurement supports scheduled plant maintenance and shutdown programs, continuous manufacturing operations requiring MRO consumable replenishment, commissioning spares for new plant startups, fleet maintenance workshops for transport and logistics companies, and facility management operations in commercial and institutional buildings. Large enterprises operate centralized procurement desks managing MRO supply across 10–50 plant locations, requiring vendor consolidation, rate standardization, and delivery reliability. Defense ordnance factories and railway workshops represent significant institutional buyers of industrial supplies.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Industrial Supply Sourcing',
    sourcingContent: `Buyers post RFQs specifying part numbers, OEM cross-references, and quantity requirements. ProcureSaathi matches these with authorized distributors and quality-equivalent manufacturers providing product datasheets, warranty certificates, and batch traceability. The platform supports annual rate contract procurement with price-lock mechanisms, manages multi-location delivery coordination, and provides consolidation services for multi-SKU orders. For export buyers, product certification verification and export packaging are handled through the fulfillment desk.`,
    buyLinks: [
      { label: 'Buy Industrial Bearings', slug: 'buy-industrial-bearings' },
      { label: 'Buy Seals & Gaskets', slug: 'buy-seals-gaskets' },
      { label: 'Buy Industrial Lubricants', slug: 'buy-industrial-lubricants' }
    ],
    relatedCategories: [
      { label: 'Hardware & Tools', slug: 'hardware-tools' },
      { label: 'Safety & Security', slug: 'safety-security' }
    ]
  },

  'Plastic & Rubber': {
    intro: `Plastic and rubber products procurement covers a diverse range of molded, extruded, and fabricated items used across automotive, construction, packaging, and industrial applications. Buyers at OEMs, industrial equipment manufacturers, and construction contractors source rubber sheets, plastic containers, PVC fittings, silicone products, and custom-molded components. ProcureSaathi connects procurement teams with ISO 9001-certified plastic and rubber product manufacturers, enabling competitive RFQs for both standard catalog items and custom-engineered components with material test reports and dimensional inspection documentation.`,
    typesH2: 'Types of Plastic & Rubber Products Used in B2B Procurement',
    typesContent: [
      'Rubber Sheets & Products – Natural rubber, neoprene, EPDM, and nitrile rubber sheets, gaskets, O-rings, and molded components for industrial sealing applications.',
      'Plastic Containers & Tanks – HDPE tanks, chemical storage containers, water tanks, and IBCs for industrial storage and material handling.',
      'PVC Fittings & Profiles – PVC pipes fittings, cable trays, window profiles, and conduit systems for construction and electrical installations.',
      'Custom Molded Components – Injection-molded, compression-molded, and blow-molded plastic and rubber parts for automotive, appliance, and industrial applications.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Plastic and rubber product procurement supports automotive component supply chains, chemical plant corrosion-resistant lining systems, water treatment plant HDPE piping and tank installations, mining equipment wear-resistant rubber lining, conveyor belt systems for material handling, agricultural irrigation fittings, and construction waterproofing membrane systems. EPC firms working on chemical and pharmaceutical facilities require certified chemical-resistant plastic and rubber products with material compatibility documentation.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Plastic & Rubber Sourcing',
    sourcingContent: `Buyers post RFQs specifying material type, hardness (Shore A/D), dimensions, and application requirements. ProcureSaathi matches these with certified manufacturers providing material test reports, chemical resistance data, and dimensional inspection certificates. The platform supports custom tooling development for molded components, manages sample approval workflows, and coordinates bulk production with delivery scheduling. For export orders, material compliance certificates (FDA, EU 1935/2004) and packaging documentation are prepared by the fulfillment team.`,
    buyLinks: [
      { label: 'Buy Rubber Sheets', slug: 'buy-rubber-sheets' },
      { label: 'Buy HDPE Tanks', slug: 'buy-hdpe-tanks' },
      { label: 'Buy PVC Fittings', slug: 'buy-pvc-fittings' }
    ],
    relatedCategories: [
      { label: 'Polymers & Resins', slug: 'polymers-resins' },
      { label: 'Pipes & Tubes', slug: 'pipes-tubes' }
    ]
  },

  'Mining & Minerals': {
    intro: `Mining and mineral products procurement serves steel plants, cement factories, ceramic manufacturers, glass industries, and construction material producers. Buyers source iron ore, limestone, quartz, feldspar, bentonite, and other industrial minerals from mine operators and mineral processors. ProcureSaathi connects procurement teams with IBM-licensed mining companies and mineral processing units, enabling competitive RFQs with grade-specific matching, chemical analysis certificates, and logistics coordination for bulk material movement by rail and road.`,
    typesH2: 'Types of Minerals Used in B2B Procurement',
    typesContent: [
      'Metallic Minerals – Iron ore fines and lumps, manganese ore, chromite ore, and bauxite for steel making and metallurgical applications.',
      'Non-Metallic Minerals – Limestone, dolomite, quartz, feldspar, and silica sand for cement, glass, and ceramic manufacturing.',
      'Industrial Minerals – Bentonite, kaolin, talc, mica, and graphite for drilling, paper, paint, and refractory applications.',
      'Construction Aggregates – Crushed stone, sand (manufactured and river), gravel, and road metal for construction and infrastructure projects.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Mineral procurement supports integrated steel plant raw material supply, cement factory limestone and gypsum requirements, glass and ceramic manufacturing quartz and feldspar needs, foundry silica sand supply, road construction aggregate requirements, and refractory brick manufacturing for kilns and furnaces. EPC firms working on mineral processing plants, beneficiation facilities, and material handling systems require technical understanding of mineral grades and specifications for equipment selection and process design.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Mineral Sourcing',
    sourcingContent: `Buyers post RFQs specifying mineral type, chemical composition requirements, particle size, and quantity. ProcureSaathi matches these with IBM-licensed miners and processors providing chemical analysis reports, moisture content data, and dispatch quality certificates. The platform supports bulk logistics coordination via rail and road, manages quality inspection at loading points, and handles documentation for mineral export including DGFT approvals and mineral despatch permits.`,
    buyLinks: [
      { label: 'Buy Iron Ore', slug: 'buy-iron-ore' },
      { label: 'Buy Limestone', slug: 'buy-limestone' },
      { label: 'Buy Silica Sand', slug: 'buy-silica-sand' }
    ],
    relatedCategories: [
      { label: 'Metals - Ferrous (Steel, Iron)', slug: 'metals-ferrous-steel-iron' },
      { label: 'Building & Construction', slug: 'building-construction' }
    ]
  },

  'Steel Fabrication & Structures': {
    intro: `Steel fabrication and structural steel procurement serves pre-engineered building manufacturers, industrial plant constructors, bridge builders, and warehouse developers. Buyers source fabricated beams, trusses, portal frames, mezzanine structures, and miscellaneous steelwork from certified fabrication workshops. ProcureSaathi connects procurement teams with ISO 3834 and EN 1090-certified steel fabricators, enabling competitive RFQs for both standard structural profiles and custom-engineered heavy fabrication with weld procedure qualifications, NDT reports, and erection support.`,
    typesH2: 'Types of Steel Fabrication Used in B2B Procurement',
    typesContent: [
      'Pre-Engineered Buildings (PEB) – Portal frame structures, purlins, girts, and cladding systems for industrial sheds, warehouses, and commercial buildings.',
      'Heavy Structural Fabrication – Plate girders, box columns, trusses, and lattice towers for bridges, process plants, and power station structures.',
      'Miscellaneous Steelwork – Platforms, ladders, handrails, grating, and embedded parts for industrial and infrastructure applications.',
      'Tanks & Vessels – Storage tanks, pressure vessels, silos, and hoppers fabricated to API 650, ASME Section VIII, and IS 803 standards.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Steel fabrication procurement serves industrial park and SEZ warehouse construction, factory building expansion programs, highway overpass and flyover construction, railway station roof structures, power plant structural steelwork, offshore platform module fabrication, and metro station canopy structures. EPC contractors working on refinery, petrochemical, and fertilizer plant projects require heavy fabrication with international weld quality standards and third-party inspection by agencies like Lloyds and Bureau Veritas.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Steel Fabrication Sourcing',
    sourcingContent: `Buyers post RFQs with GA drawings, material specifications, coating requirements, and erection scope. ProcureSaathi matches these with qualified fabricators providing weld procedure specifications, welder qualification records, and NDT capability documentation. The platform supports stage inspection coordination, manages surface preparation and coating certification, and handles transportation planning for oversized structural members. For export projects, international code compliance (AISC, EN 1090) verification is managed through the quality desk.`,
    buyLinks: [
      { label: 'Buy PEB Structures', slug: 'buy-peb-structures' },
      { label: 'Buy Structural Steel', slug: 'buy-structural-steel' },
      { label: 'Buy Steel Tanks', slug: 'buy-steel-tanks' }
    ],
    relatedCategories: [
      { label: 'Metals - Ferrous (Steel, Iron)', slug: 'metals-ferrous-steel-iron' },
      { label: 'Building & Construction', slug: 'building-construction' }
    ]
  },

  'Road Safety & Infrastructure': {
    intro: `Road safety and infrastructure equipment procurement supports highway construction, urban road development, traffic management, and road maintenance operations. Buyers at NHAI contractors, state PWD departments, municipal corporations, and traffic police departments source crash barriers, road studs, signage, lane markings, and traffic signals through government and private tenders. ProcureSaathi connects procurement teams with IRC-compliant and MORTH-approved road safety product manufacturers, enabling competitive RFQs with product test certificates, installation support, and delivery coordination for linear infrastructure projects.`,
    typesH2: 'Types of Road Safety Products Used in B2B Procurement',
    typesContent: [
      'Crash Barriers & Guardrails – Metal beam crash barriers (W-beam, Thrie-beam), wire rope barriers, and concrete barriers conforming to IRC SP:73 and MORTH specifications.',
      'Road Marking & Studs – Thermoplastic road marking paint, cold-applied marking materials, retroreflective road studs, and delineator posts for highway lane marking.',
      'Traffic Signs & Signals – Retroreflective traffic signs, variable message signs, LED traffic signals, and solar-powered blinkers conforming to IRC 67.',
      'Road Construction Equipment – Asphalt pavers, road rollers, bitumen sprayers, and milling machines for highway construction and resurfacing projects.'
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `Road safety procurement serves national highway construction and widening under Bharatmala Pariyojana, state highway development programs, urban road improvement under Smart Cities Mission, expressway toll plaza infrastructure, airport taxiway and runway marking, industrial estate internal road development, and railway level crossing safety equipment. EPC contractors working on highway packages require coordinated supply of crash barriers, signage, and marking materials aligned with pavement laying progress. India's highway construction pace of 28+ km/day drives continuous demand for road safety products.`,
    sourcingH2: 'How ProcureSaathi Enables Verified Road Safety Sourcing',
    sourcingContent: `Buyers post RFQs specifying product type, MORTH/IRC compliance requirements, quantity, and delivery schedule aligned to project chainage. ProcureSaathi matches these with NABL-tested manufacturers providing type-test certificates, retroreflectivity test reports, and crash test documentation. The platform supports project-specific procurement with milestone-linked deliveries, manages quality inspection coordination, and handles documentation for NHAI and state PWD billing requirements.`,
    buyLinks: [
      { label: 'Buy Crash Barriers', slug: 'buy-crash-barriers' },
      { label: 'Buy Road Marking Materials', slug: 'buy-road-marking-materials' },
      { label: 'Buy Traffic Signs', slug: 'buy-traffic-signs' }
    ],
    relatedCategories: [
      { label: 'Petroleum & Bitumen', slug: 'petroleum-bitumen' },
      { label: 'Building & Construction', slug: 'building-construction' }
    ]
  },
};

/**
 * Get SEO content for a category by its display name.
 * Returns undefined if no specific content exists (fallback handled by caller).
 */
export function getCategorySEOContent(categoryName: string): CategorySEOContent | undefined {
  return seoContent[categoryName];
}

/**
 * Get a generic fallback SEO content block for categories without specific content.
 */
export function getFallbackCategorySEOContent(categoryName: string): CategorySEOContent {
  const slug = nameToSlug(categoryName);
  return {
    intro: `${categoryName} procurement is a key B2B category for Indian manufacturers, infrastructure contractors, and industrial buyers seeking verified suppliers at competitive prices. Whether sourcing for domestic projects or international export orders, buyers require quality-certified products with transparent pricing and reliable delivery. ProcureSaathi's AI-powered procurement platform connects buyers with verified ${categoryName.toLowerCase()} suppliers across India, enabling structured RFQ processes with competitive bidding, quality documentation, and managed fulfillment support for both spot purchases and long-term supply contracts.`,
    typesH2: `Types of ${categoryName} Used in B2B Procurement`,
    typesContent: [
      `Standard-grade ${categoryName.toLowerCase()} products conforming to applicable BIS/ISO standards for domestic industrial and construction applications.`,
      `Premium and export-quality ${categoryName.toLowerCase()} meeting international compliance requirements for overseas buyers.`,
      `Custom-specification ${categoryName.toLowerCase()} manufactured to buyer drawings and technical requirements for OEM and project applications.`,
    ],
    applicationsH2: 'Applications Across Manufacturing, EPC & Infrastructure Projects',
    applicationsContent: `${categoryName} products serve diverse sectors including manufacturing plants, infrastructure development projects, commercial and residential construction, government procurement programs, and export-oriented industries. EPC contractors, institutional buyers, and industrial maintenance departments represent key buyer segments requiring consistent quality, competitive pricing, and reliable delivery schedules for both project-based and recurring procurement needs.`,
    sourcingH2: `How ProcureSaathi Enables Verified ${categoryName} Sourcing`,
    sourcingContent: `ProcureSaathi's AI-driven platform enables buyers to post detailed RFQs specifying product type, grade, quantity, and delivery requirements. The system matches these with verified suppliers holding relevant quality certifications, delivering multiple competitive bids within 24–48 hours. The platform manages quality documentation verification, logistics coordination, and payment facilitation for both domestic and international procurement. Buyers benefit from transparent price discovery, supplier verification, and managed fulfillment support throughout the procurement cycle.`,
    buyLinks: [
      { label: `Buy ${categoryName} Products`, slug: `buy-${slug}-products` },
    ],
    relatedCategories: [
      { label: 'Industrial Supplies', slug: 'industrial-supplies' },
      { label: 'Building & Construction', slug: 'building-construction' }
    ]
  };
}
