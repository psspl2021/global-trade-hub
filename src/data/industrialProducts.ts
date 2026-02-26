/**
 * Industrial Product Taxonomy
 * Full SEO-optimized content for 10 core industrial categories.
 * Each product includes 900+ words of authority content, FAQs, and structured data.
 */

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface IndustrialProduct {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  industry: string;
  industrySlug: string;
  subIndustry: string;
  subIndustrySlug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  introText: string;
  heroImage: string;
  heroImageAlt: string;
  /** 900+ words structured authority content */
  sections: {
    whatIs: string;
    grades: string;
    specifications: string;
    applications: string;
    marketTrends: string;
    procurementChallenges: string;
    pricingFactors: string;
    gradeTable?: { grade: string; yieldStrength: string; tensileStrength?: string; elongation?: string; application: string }[];
    thicknessChart?: { thickness: string; weightPerSqM: string }[];
    sizeTable?: { section: string; weightPerMeter: string }[];
    widthToleranceTable?: { width: string; tolerance: string }[];
    complianceMatrix?: string[];
    procurementRiskInsights?: string[];
    indiaDemandIntelligence?: string[];
    bendProperties?: string[];
    seismicPerformance?: string[];
    loadBearingInsights?: string[];
    fabricationImplications?: string[];
    downstreamApplications?: string[];
    exportCompliance?: string[];
  };
  faqs: ProductFAQ[];
  /** AI Demand Intelligence mock data */
  demandIntelligence: {
    intentScore: number;
    confidencePercent: number;
    recentRFQs: number;
    avgDealSize: string;
    corridors: string[];
  };
  relatedProducts: string[];
  hsnCodes: string[];
  standards: string[];
  isActivated: boolean;
}

export const industrialProducts: IndustrialProduct[] = [
  // ─── 1. MS PLATES ──────────────────────────────────────────────
  {
    slug: 'ms-plates-india',
    name: 'MS Plates',
    country: 'India',
    countryCode: 'IN',
    industry: 'Metals',
    industrySlug: 'metals',
    subIndustry: 'Ferrous',
    subIndustrySlug: 'ferrous',
    h1: 'Buy MS Plates in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy MS Plates in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source MS Plates (Mild Steel Plates) from AI-verified Indian suppliers. IS 2062 grades, 3mm–200mm thickness. Live pricing, sealed bidding, and managed procurement.',
    introText: 'MS Plates (Mild Steel Plates) are among the most widely traded flat steel products in India\'s industrial ecosystem. Used across construction, heavy fabrication, shipbuilding, and infrastructure projects, MS Plates are the backbone of structural engineering. ProcureSaathi\'s AI procurement engine connects buyers with verified mill-direct and stockist suppliers for transparent, governance-compliant sourcing.',
    heroImage: '/images/products/ms-plates.webp',
    heroImageAlt: 'Industrial MS Plate steel sheets stacked in a warehouse in India',
    sections: {
      whatIs: `Mild Steel (MS) Plates are flat-rolled carbon steel products manufactured through hot rolling processes. They are produced from low-carbon steel billets or slabs, typically containing 0.05%–0.25% carbon content, which gives them excellent weldability, formability, and machinability. MS Plates are classified under the broader category of hot-rolled flat products and are one of the highest-volume steel products consumed in India's industrial and infrastructure sectors.

The manufacturing process involves heating steel slabs to approximately 1,200°C and rolling them through successive stands in a hot strip mill or plate mill. The resulting plates are then cooled, leveled, and cut to specified dimensions. Indian steel majors like SAIL, Tata Steel, JSW Steel, AMNS India, and JSPL produce MS Plates conforming to Bureau of Indian Standards (BIS) specifications, primarily IS 2062.

MS Plates differ from HR (Hot Rolled) sheets primarily in thickness — plates typically start at 5mm and go up to 200mm or more, while sheets are thinner gauge products below 5mm. This distinction is critical for procurement specifications, as structural applications almost universally require plate-gauge material for load-bearing integrity.`,

      grades: `MS Plates in India are primarily governed by IS 2062:2011 (Sixth Revision), the Bureau of Indian Standards specification for Hot Rolled Medium and High Tensile Structural Steel. The most commonly procured grades include:

**E250 (Fe 410W A)** — The most widely used structural grade with a minimum yield strength of 250 MPa. Suitable for general construction, fabrication, and non-critical structural applications. This grade offers excellent weldability and is the default specification for most infrastructure projects.

**E250 BR/B0** — Enhanced grades of E250 with controlled impact properties for applications requiring resistance to brittle fracture, particularly in cold-weather or dynamic loading environments.

**E350 (Fe 490)** — A higher-strength grade with minimum yield strength of 350 MPa, used in heavy structural applications, bridges, pressure vessels, and offshore structures. E350 commands a premium of ₹2,000–₹4,000 per MT over E250 due to alloying additions.

**E450 (Fe 570)** — High-strength structural grade for specialized applications including crane rails, heavy machinery bases, and high-rise structural steel. Limited availability from select Indian mills.

**SA 516 Grade 70** — ASME specification for moderate and lower-temperature service pressure vessels. Increasingly demanded by Indian EPC contractors for refinery and petrochemical projects.

**SAILMA Grades (SAIL proprietary)** — SAILMA 350, SAILMA 410, SAILMA 450 are proprietary high-strength grades from Steel Authority of India Limited, widely specified in government infrastructure tenders.

Each grade carries specific chemical composition limits (carbon, manganese, silicon, phosphorus, sulfur) and mechanical properties (yield strength, tensile strength, elongation) that must be verified through mill test certificates (MTCs) during procurement.`,

      specifications: `MS Plates are available in a wide range of thicknesses, widths, and lengths to serve diverse industrial applications:

**Thickness Range:** 3mm to 200mm (most common procurement: 6mm–50mm)
**Width:** 1000mm to 3500mm (standard mill widths: 1250mm, 1500mm, 2000mm, 2500mm)
**Length:** 3000mm to 12000mm (standard lengths: 6000mm, 6300mm)
**Weight per plate:** Varies from ~25 kg (thin gauge) to 5+ MT (thick heavy plates)

**Surface Finish:** Mill finish (as-rolled with oxide scale), shot-blasted and primed (for corrosion-sensitive applications)
**Edge Condition:** Mill edge, sheared, gas-cut, or plasma-cut
**Flatness Tolerance:** As per IS 2062 Table 11 or customer specification

For procurement purposes, thickness tolerance is a critical quality parameter. IS 2062 permits tolerances of ±0.5mm to ±3mm depending on nominal thickness. Premium suppliers offer tighter tolerances for precision fabrication requirements.

Weight calculation follows the standard formula: Weight (kg) = Length (m) × Width (m) × Thickness (mm) × 7.85 (density of mild steel in kg/m² per mm thickness).`,

      applications: `MS Plates serve as foundational material across India's industrial landscape:

**Construction & Infrastructure:** Structural steel for buildings, bridges, flyovers, metro rail projects, and industrial sheds. The National Infrastructure Pipeline (NIP) targets ₹111 lakh crore investment by 2025, driving massive MS Plate demand.

**Heavy Fabrication:** Base plates, gusset plates, stiffener plates, and web plates for structural steel fabrication. Fabrication shops across India consume over 15 million MT of plates annually.

**Shipbuilding & Marine:** Hull plates, deck plates, and structural members for shipbuilding yards in Cochin, Visakhapatnam, and Mumbai. Lloyd's and IRS-certified grades required.

**Pressure Vessels & Boilers:** Boiler quality (BQ) plates for steam generators, pressure vessels, heat exchangers, and storage tanks in refineries and chemical plants.

**Earth Moving & Mining Equipment:** Wear plates, bucket plates, and structural plates for excavators, dump trucks, crushers, and conveyor systems.

**Wind Energy:** Tower section plates for wind turbine towers, typically requiring E350 or higher grades with stringent impact test requirements.

**Railway Infrastructure:** Bridge girder plates, wagon body plates, and platform structural steel for Indian Railways expansion programs.

**Defence & Aerospace:** Armour plates, ballistic steel, and high-strength structural plates for defence manufacturing under the Make in India initiative.`,

      marketTrends: `India's MS Plate market reflects the country's position as the world's second-largest crude steel producer (143+ MT in FY2024). Key market dynamics include:

**Production Capacity Expansion:** Major Indian steel producers are adding 50+ MTPA capacity through brownfield and greenfield projects. JSW Steel (from 28 to 37 MTPA), Tata Steel (from 21 to 40 MTPA), and AMNS India (from 9 to 15 MTPA) are leading expansion.

**Government Infrastructure Push:** Projects like Bharatmala (highway network), Sagarmala (port modernization), Smart Cities Mission, and AMRUT are creating sustained demand for structural steel plates.

**Import-Export Dynamics:** India exports approximately 7–8 MT of finished steel annually, with MS Plates being a significant export category to the Middle East, Southeast Asia, and Africa. Import safeguard duties and BIS certification requirements protect domestic producers.

**Price Volatility:** MS Plate prices in India have shown significant volatility, ranging from ₹45,000 to ₹75,000 per MT over the past three years. Prices are influenced by iron ore costs (India is a major iron ore producer), coking coal imports (predominantly from Australia), and global steel benchmarks.

**Digital Procurement Adoption:** B2B steel procurement is rapidly shifting from traditional trader-intermediary models to digital platforms. AI-driven demand matching and sealed bidding are reducing information asymmetry and improving price discovery.`,

      procurementChallenges: `Procuring MS Plates in India presents several challenges that ProcureSaathi's managed procurement model addresses:

**Quality Consistency:** Mill-to-mill variation in mechanical properties, surface quality, and dimensional tolerances. Third-party inspection and mill test certificate verification are essential but often neglected in traditional procurement.

**Price Opacity:** Traditional steel trading involves multiple intermediaries (stockists, distributors, traders) each adding margins. Actual mill-gate prices are rarely visible to end buyers, creating information asymmetry.

**Delivery Reliability:** Lead times vary from 7 days (ex-stock from stockists) to 45+ days (mill-direct rolling programs). Late deliveries can cascade into project delays with significant financial penalties.

**Specification Matching:** Buyers often over-specify or under-specify grade requirements, leading to cost overruns or structural inadequacy. Proper specification engineering requires metallurgical expertise.

**Payment Terms Conflict:** Mills typically demand advance payment or LC-backed orders, while EPC contractors require 30–90 day credit terms. Bridging this gap requires trade finance solutions.

**Logistics Complexity:** MS Plates are heavy, bulky products requiring specialized trailer transport. Freight costs can add ₹1,500–₹5,000 per MT depending on distance from mill/stockyard to project site.`,

      pricingFactors: `MS Plate pricing in India is determined by a complex interplay of factors:

**Raw Material Costs:** Iron ore (India-origin: ₹4,000–₹8,000/MT) and imported coking coal ($200–$400/MT) constitute 65–70% of production cost. Price movements in these inputs directly impact plate pricing.

**Grade Premium:** Higher grades command premiums — E350 is typically ₹2,000–₹4,000/MT above E250; boiler quality plates are ₹5,000–₹8,000/MT above structural grades.

**Thickness Premium:** Thinner plates (below 8mm) and very thick plates (above 80mm) carry premiums due to rolling complexity. The sweet spot (12mm–40mm) offers the most competitive pricing.

**Quantity:** Mill-direct orders typically require minimum 20–50 MT per size/grade combination. Smaller quantities are sourced from stockists at ₹1,000–₹3,000/MT premium.

**Delivery Terms:** Ex-works (mill gate) pricing is lowest; FOR (freight on road) to site adds ₹1,500–₹5,000/MT; CIF for export orders includes freight and insurance.

**Market Sentiment:** Steel prices respond to global commodity cycles, Chinese production/export policies, domestic demand-supply balance, and government trade policy interventions (anti-dumping duties, safeguard measures).

**Seasonal Patterns:** Prices typically strengthen during October–March (construction season) and moderate during monsoon months (July–September) due to reduced construction activity.`,
      gradeTable: [
        { grade: 'IS 2062 E250', yieldStrength: '250 MPa', tensileStrength: '410–540 MPa', application: 'General structural fabrication' },
        { grade: 'IS 2062 E350', yieldStrength: '350 MPa', tensileStrength: '490–630 MPa', application: 'Heavy load bearing structures' },
        { grade: 'IS 2062 E450', yieldStrength: '450 MPa', tensileStrength: '570–720 MPa', application: 'High-rise & crane rail applications' },
        { grade: 'ASTM A36', yieldStrength: '250 MPa', tensileStrength: '400–550 MPa', application: 'Export & international EPC projects' },
        { grade: 'SA 516 Gr.70', yieldStrength: '260 MPa', tensileStrength: '485–620 MPa', application: 'Pressure vessels & boilers' },
        { grade: 'SAILMA 350', yieldStrength: '350 MPa', tensileStrength: '490 MPa min', application: 'Govt infrastructure tenders' }
      ],
      thicknessChart: [
        { thickness: '3 mm', weightPerSqM: '23.55 kg' },
        { thickness: '6 mm', weightPerSqM: '47.10 kg' },
        { thickness: '10 mm', weightPerSqM: '78.50 kg' },
        { thickness: '16 mm', weightPerSqM: '125.60 kg' },
        { thickness: '20 mm', weightPerSqM: '157.00 kg' },
        { thickness: '25 mm', weightPerSqM: '196.25 kg' },
        { thickness: '32 mm', weightPerSqM: '251.20 kg' },
        { thickness: '50 mm', weightPerSqM: '392.50 kg' },
        { thickness: '80 mm', weightPerSqM: '628.00 kg' },
        { thickness: '100 mm', weightPerSqM: '785.00 kg' },
        { thickness: '200 mm', weightPerSqM: '1570.00 kg' }
      ],
      complianceMatrix: [
        'IS 2062:2011 — Hot Rolled Medium and High Tensile Structural Steel (BIS mandatory)',
        'BIS Certification (CM/L mark) mandatory for public infrastructure projects',
        'HSN Code: 7208 — Flat-rolled products of iron/non-alloy steel (GST 18%)',
        'Mill Test Certificate (MTC) required for all EPC and government tenders',
        'Third-party inspection (TPI) by BV/SGS/TUV required for export consignments',
        'IS 2002 — Steel plates for pressure vessels (boiler quality applications)',
        'ASTM A36/A572 compliance required for international export orders',
        'NHAI/MORTH specifications mandate E350+ grade for highway bridge fabrication'
      ],
      procurementRiskInsights: [
        'Verify heat number traceability on Mill Test Certificate before dispatch acceptance',
        'Monitor iron ore (Odisha/Chhattisgarh) and coking coal (Australia import) price volatility weekly',
        'Differentiate primary mill-origin plates from secondary re-rollers — quality variance is significant',
        'Confirm dimensional tolerance (thickness ±0.5mm–±3mm per IS 2062 Table 11) before cutting',
        'Freight escalation from mill to site (₹1,500–₹5,000/MT) impacts total landed cost — factor in logistics',
        'Monsoon season (Jul–Sep) reduces construction activity and can soften spot prices by 3–5%',
        'Government policy changes (export duties, anti-dumping measures) can shift prices ₹2,000–₹5,000/MT overnight',
        'Secondary market plates may lack proper BIS certification — verify CM/L license number on every consignment'
      ],
      indiaDemandIntelligence: [
        'NHAI highway expansion (Bharatmala Phase-I: 34,800 km) driving sustained plate demand across Western & Southern corridors',
        'Railway bridge fabrication procurement cycles increasing under Dedicated Freight Corridor projects',
        'Union Budget FY2025 infrastructure allocation of ₹11.11 lakh crore boosting steel consumption forecasts',
        'Industrial corridor expansion (DMIC, CBIC, AKIC) generating heavy fabrication orders for structural plates',
        'Metro rail projects in 27+ cities creating recurring demand for E350+ grade plates',
        'Renewable energy (wind tower fabrication) emerging as high-growth demand segment for thick plates (20mm+)',
        'Defence manufacturing (Make in India) driving specialized high-strength plate procurement',
        'Port modernization under Sagarmala creating demand for marine-grade and structural plates'
      ]
    },
    faqs: [
      { question: 'What is MS plate price per kg in India?', answer: 'MS Plate prices in India typically range from ₹45 to ₹75 per kg depending on grade, thickness, and quantity. IS 2062 E250 grade in 10mm–25mm thickness from major mills like SAIL, Tata Steel, and JSW currently trades between ₹50,000–₹65,000 per MT. Prices fluctuate based on raw material costs, demand-supply dynamics, and government policies. ProcureSaathi provides live AI-benchmarked pricing through sealed competitive bidding.' },
      { question: 'What is IS 2062 grade for MS Plates?', answer: 'IS 2062 is the Bureau of Indian Standards specification for Hot Rolled Medium and High Tensile Structural Steel. The most common grades are E250 (minimum 250 MPa yield strength) for general structural use, E350 (350 MPa) for heavy structural applications, and E450 (450 MPa) for specialized high-strength requirements. Each grade has specific chemical composition and mechanical property requirements verified through mill test certificates.' },
      { question: 'What thickness of MS Plates is available in India?', answer: 'MS Plates in India are available from 3mm to 200mm thickness. The most commonly procured range is 6mm–50mm for construction and fabrication. Thin plates (3mm–5mm) are used for lighter fabrication, while heavy plates (50mm–200mm) serve pressure vessels, shipbuilding, and heavy machinery. Standard widths range from 1000mm to 3500mm with lengths up to 12000mm.' },
      { question: 'What is the difference between MS Plate and HR Plate?', answer: 'MS (Mild Steel) Plate and HR (Hot Rolled) Plate are often used interchangeably, but technically MS Plate refers to low-carbon steel (0.05%–0.25% carbon) in plate gauge thickness (typically 5mm+), while HR is a broader manufacturing process descriptor. HR products include both sheets (below 5mm) and plates (5mm+). For procurement, always specify the IS 2062 grade, thickness, and mechanical properties rather than relying on colloquial terminology.' },
      { question: 'How does bulk MS Plate procurement work on ProcureSaathi?', answer: 'ProcureSaathi operates as a managed procurement counterparty. You submit your specifications (grade, thickness, width, length, quantity, delivery location). Our AI matches your requirement with verified mill-direct and stockist suppliers. Suppliers submit sealed bids — you receive anonymized competitive quotes. ProcureSaathi handles quality verification, logistics coordination, and contract fulfilment as the single counterparty.' },
      { question: 'What are SAILMA grade MS Plates?', answer: 'SAILMA (SAIL Manufactured Alloy) grades are proprietary high-strength structural steel plates from Steel Authority of India Limited (SAIL). Available in SAILMA 350, SAILMA 410, SAILMA 450, and SAILMA 450HI grades, these plates offer superior yield strength compared to standard IS 2062 grades. They are widely specified in government infrastructure projects, bridges, and heavy engineering applications.' },
      { question: 'What is the minimum order quantity for MS Plates in India?', answer: 'Mill-direct orders typically require minimum 20–50 MT per size and grade combination, with rolling program lead times of 3–6 weeks. For smaller quantities (1–20 MT), stockist-sourced plates are available with shorter lead times of 3–7 days but at a premium of ₹1,000–₹3,000/MT over mill prices. ProcureSaathi aggregates demand to help smaller buyers access mill-direct pricing.' },
      { question: 'How do I verify MS Plate quality before purchase?', answer: 'Quality verification for MS Plates should include: (1) Mill Test Certificate (MTC) review for chemical composition and mechanical properties; (2) Dimensional inspection for thickness, width, length tolerances per IS 2062; (3) Surface quality check for lamination, pitting, and scale; (4) Third-party inspection (TPI) by agencies like BV, SGS, or TUV for critical applications. ProcureSaathi\'s managed procurement includes quality verification as a standard service.' }
    ],
    demandIntelligence: {
      intentScore: 87,
      confidencePercent: 92,
      recentRFQs: 34,
      avgDealSize: '₹18.5 Lakhs',
      corridors: ['India Domestic', 'India → UAE', 'India → Saudi Arabia', 'India → Kenya']
    },
    relatedProducts: ['tmt-bars-india', 'hr-coil-india', 'structural-steel-india'],
    hsnCodes: ['7208', '7211', '7225'],
    standards: ['IS 2062:2011', 'IS 2002', 'SA 516 Gr.70', 'ASTM A36'],
    isActivated: true
  },

  // ─── 2. TMT BARS ──────────────────────────────────────────────
  {
    slug: 'tmt-bars-india',
    name: 'TMT Bars',
    country: 'India',
    countryCode: 'IN',
    industry: 'Metals',
    industrySlug: 'metals',
    subIndustry: 'Ferrous',
    subIndustrySlug: 'ferrous',
    h1: 'Buy TMT Bars in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy TMT Bars in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source TMT Bars (Fe-500, Fe-500D, Fe-550D) from AI-verified Indian suppliers. BIS-certified, earthquake-resistant grades. Live pricing and managed procurement.',
    introText: 'TMT (Thermo-Mechanically Treated) Bars are the primary reinforcement steel used in India\'s construction industry. From residential buildings to mega infrastructure projects, TMT bars provide the tensile strength and ductility essential for reinforced concrete structures. ProcureSaathi connects construction companies and contractors with BIS-certified TMT bar manufacturers through AI-driven procurement.',
    heroImage: '/images/products/tmt-bars.webp',
    heroImageAlt: 'TMT reinforcement steel bars bundled at construction site in India',
    sections: {
      whatIs: `TMT Bars (Thermo-Mechanically Treated Bars) are high-strength reinforcement steel bars manufactured through a controlled process of quenching and self-tempering. The TMT process involves rolling heated billets through a series of stands, followed by rapid water quenching that creates a hardened outer martensitic layer, while the core remains soft and ductile. This unique microstructure gives TMT bars their characteristic combination of high strength and superior ductility.

The manufacturing process begins with steel billets (typically 100mm–160mm square cross-section) heated to approximately 1,100°C in a reheating furnace. The heated billets pass through roughing, intermediate, and finishing mill stands to achieve the desired diameter. Immediately after the final stand, the bars pass through a Thermex or Tempcore quenching system where high-pressure water jets rapidly cool the surface to approximately 400°C, creating the martensite layer. The bar then enters a cooling bed where the residual core heat tempers the outer layer, creating a tempered martensite-bainite shell with a ferrite-pearlite core.

India is the world's largest consumer of TMT bars, with annual consumption exceeding 50 million MT. The market is served by major producers including Tata Tiscon, SAIL, JSW Neosteel, AMNS (ArcelorMittal Nippon Steel), Shyam Steel, Kamdhenu, and numerous regional secondary producers.`,

      grades: `TMT Bars in India are governed by IS 1786:2008 (Fourth Revision), which specifies the following grades based on minimum yield strength:

**Fe-500** — Minimum yield strength 500 MPa. The most widely used grade for residential and commercial construction. Offers good balance of strength and economy.

**Fe-500D** — Same minimum yield strength as Fe-500 but with enhanced ductility (D for ductile). Mandatory for structures in Seismic Zones III, IV, and V as per IS 13920. Lower carbon content (max 0.25% vs 0.30%) and stricter elongation requirements.

**Fe-550** — Higher strength grade with minimum 550 MPa yield strength. Used in high-rise buildings and infrastructure where reduced steel consumption per cubic meter of concrete is desired.

**Fe-550D** — High-strength ductile grade combining Fe-550 strength with Fe-500D ductility. Premium product for critical infrastructure.

**Fe-600** — Highest standard grade with 600 MPa minimum yield strength. Limited applications in specialized structures requiring maximum load-bearing capacity with minimum reinforcement.

**CRS (Corrosion Resistant Steel)** — TMT bars with added copper, phosphorus, and chromium for enhanced corrosion resistance. Marketed under brand names like Tata Tiscon CRS and JSW Neosteel CRS. Essential for coastal construction and structures exposed to aggressive environments.`,

      specifications: `TMT Bars are produced in standard diameters and lengths:

**Diameter Range:** 6mm, 8mm, 10mm, 12mm, 16mm, 20mm, 25mm, 28mm, 32mm, 36mm, 40mm
**Standard Length:** 12 meters (industry standard); also available in 9m and custom lengths
**Rib Pattern:** Transverse ribs for concrete bond; pattern varies by manufacturer
**Bundle Weight:** Standard bundles of approximately 2–3 MT; exact weight depends on diameter and length

**Key Mechanical Properties (Fe-500D):**
- Yield Strength: ≥500 MPa
- Tensile Strength: ≥565 MPa
- Elongation: ≥16%
- UTS/YS Ratio: ≥1.08
- Total Elongation at Maximum Force: ≥5%

**Weight per meter (theoretical):** Diameter² ÷ 162. Example: 12mm bar = 144/162 = 0.888 kg/m

BIS certification (ISI mark) is mandatory for TMT bars sold in India. Every bundle must carry the BIS license number, grade marking, and manufacturer identification.`,

      applications: `TMT Bars are the universal reinforcement material for concrete structures across India:

**Residential Construction:** Foundation, columns, beams, slabs, and staircases for houses and apartment buildings. Fe-500 is the standard specification for most residential projects.

**Commercial & Institutional:** High-rise office buildings, shopping complexes, hospitals, educational institutions, and government buildings. Fe-500D or higher grades mandated for structures exceeding certain heights in seismic zones.

**Infrastructure:** Highways, bridges, flyovers, metro rail viaducts, tunnels, and underground structures. National Highway Authority of India (NHAI) projects typically specify Fe-500D minimum grade.

**Industrial:** Factory buildings, warehouses, material handling structures, chimney foundations, and equipment foundations. Heavy industrial applications may require Fe-550 or Fe-550D.

**Water Infrastructure:** Dams, reservoirs, water treatment plants, sewage treatment plants, and canal linings. CRS grades preferred for water-contact structures.

**Power Sector:** Thermal power plant structures, cooling tower shells, turbine foundations, and transmission tower foundations.

**Railways:** Station buildings, platform structures, rail over bridges (ROBs), rail under bridges (RUBs), and dedicated freight corridor structures.`,

      marketTrends: `India's TMT bar market is valued at approximately ₹3.5 lakh crore (US$42 billion) and is projected to grow at 7-8% CAGR driven by urbanization, infrastructure spending, and housing initiatives like PMAY (Pradhan Mantri Awas Yojana).

**Consolidation Trend:** The market is shifting from fragmented secondary producers to organized branded TMT manufacturers. Branded TMT bars now command 45-50% market share, up from 30% five years ago.

**Grade Upgradation:** Fe-500D is rapidly replacing Fe-500 as the default specification, driven by seismic design code enforcement and structural engineer preferences. Fe-550D adoption is growing in premium segments.

**Quality Enforcement:** BIS has intensified surveillance on TMT bar quality, conducting regular market testing and penalizing sub-standard production. This is improving overall market quality but also creating supply constraints for certified products.

**Regional Price Variations:** TMT bar prices vary significantly across India — northern markets (Delhi, Jaipur) typically trade ₹1,000–₹2,000/MT higher than eastern markets (Kolkata, Raipur) due to proximity to raw material sources.

**Sustainability Push:** Green TMT bars manufactured from recycled scrap using EAF (Electric Arc Furnace) route are gaining market acceptance, particularly for IGBC/LEED-certified green building projects.`,

      procurementChallenges: `TMT bar procurement in India faces several persistent challenges:

**Brand vs. Quality Perception:** Buyers often equate brand name with quality, paying premiums of ₹2,000–₹5,000/MT for branded products when equivalent BIS-certified products from smaller manufacturers may meet identical specifications at lower cost.

**Counterfeit Products:** Sub-standard TMT bars with fake BIS marks remain a significant concern, particularly in Tier-2 and Tier-3 cities. Physical testing and BIS verification are essential quality checks.

**Quantity Aggregation:** Small to medium construction projects (requiring 5–50 MT) face disadvantageous pricing compared to bulk buyers. Individual orders below 10 MT attract dealer margins of ₹1,500–₹3,000/MT.

**Size Mix Challenges:** Projects require multiple diameters (typically 8mm to 25mm) in specific ratios based on structural design. Matching this mix from a single source at competitive pricing requires sophisticated procurement planning.

**Payment Terms:** Manufacturer terms are typically advance payment or LC-based, while contractors need 15–45 day credit terms aligned with their project billing cycles.

**Delivery Scheduling:** Just-in-time delivery is critical for construction sites with limited storage. Coordinating delivery across multiple sizes from potentially different sources requires logistics expertise.`,

      pricingFactors: `TMT bar pricing in India is influenced by:

**Sponge Iron / Billet Prices:** Secondary TMT manufacturers use sponge iron (DRI) as primary raw material. Sponge iron prices (currently ₹25,000–₹35,000/MT) directly impact TMT bar production costs.

**Scrap Prices:** EAF-based producers use steel scrap as primary input. Ship-breaking scrap and imported shredded scrap prices influence production economics.

**Grade Premium:** Fe-500D trades at ₹500–₹1,500/MT premium over Fe-500. CRS grades command ₹2,000–₹4,000/MT premium.

**Diameter Premium:** Smaller diameters (6mm, 8mm) carry ₹1,000–₹2,500/MT premium over standard 12mm–16mm bars due to higher rolling costs.

**Brand Premium:** Major branded producers (Tata Tiscon, JSW Neosteel) command ₹2,000–₹5,000/MT premium over equivalent BIS-certified products from secondary producers.

**Seasonal Demand:** Prices peak during October–March construction season. Post-monsoon demand surge typically adds ₹1,000–₹3,000/MT seasonal premium.

**Government Policy:** Changes in GST rates (currently 18%), import duties on raw materials, and export incentives (MEIS/RoDTEP) impact effective pricing.`,
      gradeTable: [
        { grade: "Fe 415", yieldStrength: "415 MPa", elongation: "14.5%", application: "Residential low-rise construction" },
        { grade: "Fe 500", yieldStrength: "500 MPa", elongation: "12%", application: "General RCC structures" },
        { grade: "Fe 500D", yieldStrength: "500 MPa", elongation: "16%", application: "Seismic-prone zones & bridges" },
        { grade: "Fe 550D", yieldStrength: "550 MPa", elongation: "14%", application: "High-load infrastructure projects" }
      ],
      bendProperties: [
        "180° bend without surface crack (as per IS 1786)",
        "Re-bend test mandatory for D grades",
        "Higher elongation improves seismic resistance",
        "Rib geometry affects bond strength with concrete"
      ],
      complianceMatrix: [
        "IS 1786:2008 High Strength Deformed Steel Bars",
        "BIS certification mandatory for government tenders",
        "HSN Code: 7214 (GST 18%)",
        "Heat number traceability required for EPC"
      ],
      seismicPerformance: [
        "Fe 500D and Fe 550D recommended in Zone III–V",
        "Higher ductility prevents brittle structural failure",
        "Improved fatigue resistance under cyclic loads"
      ],
      indiaDemandIntelligence: [
        "PM Awas Yojana housing demand",
        "Metro rail & elevated corridor projects",
        "Smart city & highway infrastructure expansion",
        "Precast construction increasing rebars demand"
      ]
    },
    faqs: [
      { question: 'What is the current TMT bar price per kg in India?', answer: 'TMT bar prices in India currently range from ₹48 to ₹70 per kg depending on grade, diameter, brand, and location. Fe-500 grade 12mm bars from major brands trade between ₹52,000–₹62,000 per MT. Secondary producers offer BIS-certified equivalent at ₹48,000–₹55,000 per MT. Prices fluctuate monthly based on raw material costs and demand. ProcureSaathi provides real-time competitive pricing through sealed bidding.' },
      { question: 'What is the difference between Fe-500 and Fe-500D TMT bars?', answer: 'Fe-500D has the same minimum yield strength (500 MPa) as Fe-500 but with enhanced ductility — higher elongation (16% vs 12%), stricter UTS/YS ratio (≥1.08), and lower carbon content (max 0.25% vs 0.30%). Fe-500D is mandatory for structures in seismic zones III, IV, and V per IS 13920. The "D" stands for ductile, making these bars more resistant to earthquake forces.' },
      { question: 'Which TMT bar brand is best in India?', answer: 'Quality should be assessed by BIS certification and mill test certificates rather than brand alone. Major producers like Tata Tiscon, JSW Neosteel, SAIL, AMNS, and Shyam Steel all manufacture BIS-certified TMT bars meeting IS 1786 specifications. ProcureSaathi\'s AI-driven procurement evaluates supplier quality records, certification compliance, and delivery reliability rather than brand perception alone.' },
      { question: 'What diameter TMT bars are used for house construction?', answer: 'Typical residential construction uses: 8mm for stirrups and ties, 10mm and 12mm for secondary reinforcement and slabs, 16mm for main reinforcement in beams and columns, and 20mm or 25mm for heavily loaded columns and footings. The exact diameter is determined by the structural engineer\'s design based on load calculations and building code requirements.' },
      { question: 'How many TMT bars are in one bundle?', answer: 'Bundle composition varies by diameter and manufacturer. Typical bundles contain: 8mm — approximately 10 bars, 10mm — 7 bars, 12mm — 5 bars, 16mm — 3 bars, 20mm — 2 bars, 25mm — 2 bars, 32mm — 1 bar. Standard bundle weight is approximately 2–3 MT. Always verify exact count as it varies by manufacturer.' },
      { question: 'Is BIS certification mandatory for TMT bars?', answer: 'Yes, BIS certification (ISI mark) is mandatory for TMT bars manufactured and sold in India under the Steel and Steel Products (Quality Control) Order. Manufacturing or selling non-BIS-certified TMT bars is a punishable offense. Always verify the BIS license number on the bar surface marking and cross-reference with the BIS website.' },
      { question: 'What is earthquake-resistant TMT bar?', answer: 'Earthquake-resistant TMT bars are Fe-500D or Fe-550D grade bars that comply with IS 1786 ductility requirements and IS 13920 seismic detailing provisions. They have controlled carbon content, higher elongation, and superior UTS/YS ratio to absorb seismic energy through plastic deformation without brittle failure. Mandatory for all structures in Seismic Zones III–V across India.' },
      { question: 'How to calculate TMT bar weight?', answer: 'TMT bar weight per meter = (Diameter in mm)² ÷ 162. For example: 12mm bar = 144/162 = 0.888 kg/m. For a standard 12m length: 0.888 × 12 = 10.66 kg per bar. For total weight per MT: 1000/10.66 = approximately 94 bars of 12mm × 12m. This formula assumes standard IS 1786 density of 7,850 kg/m³.' }
    ],
    demandIntelligence: {
      intentScore: 93,
      confidencePercent: 95,
      recentRFQs: 56,
      avgDealSize: '₹24.2 Lakhs',
      corridors: ['India Domestic', 'India → Nepal', 'India → Bangladesh', 'India → Sri Lanka']
    },
    relatedProducts: ['ms-plates-india', 'structural-steel-india', 'hr-coil-india'],
    hsnCodes: ['7214', '7213'],
    standards: ['IS 1786:2008', 'IS 13920', 'ASTM A615'],
    isActivated: true
  },

  // ─── 3. HR COIL ──────────────────────────────────────────────
  {
    slug: 'hr-coil-india',
    name: 'HR Coil',
    country: 'India',
    countryCode: 'IN',
    industry: 'Metals',
    industrySlug: 'metals',
    subIndustry: 'Ferrous',
    subIndustrySlug: 'ferrous',
    h1: 'Buy HR Coils in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy HR Coils in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source Hot Rolled (HR) Coils from AI-verified Indian mills. IS 2062 E250/E350 grades, 1.6mm–25mm thickness. Competitive mill-direct pricing and managed procurement.',
    introText: 'Hot Rolled (HR) Coils are the most widely produced flat steel product in India, serving as feedstock for cold rolling, galvanizing, pipe manufacturing, and direct consumption in fabrication. ProcureSaathi\'s AI procurement engine connects industrial buyers with verified integrated and secondary steel mills for competitive, transparent HR Coil sourcing.',
    heroImage: '/images/products/hr-coil.webp',
    heroImageAlt: 'Hot rolled steel coils stacked in an Indian steel warehouse',
    sections: {
      whatIs: `Hot Rolled (HR) Coils are flat steel products manufactured by rolling heated steel slabs through a continuous hot strip mill at temperatures exceeding 900°C. The process begins with reheating steel slabs (200mm–250mm thick) to approximately 1,200°C, followed by successive reduction through roughing and finishing stands to achieve the desired gauge. The resulting strip is coiled at the exit end of the mill at temperatures of 500°C–700°C.

HR Coils represent the first stage of flat steel product manufacturing. They serve as the primary input for downstream products including Cold Rolled (CR) coils, galvanized sheets, color-coated products, and welded pipes. India produces approximately 60 million MT of HR coils annually, making it one of the world's largest markets.

The hot rolling process imparts a characteristic mill scale (iron oxide layer) on the surface, which must be removed through pickling for applications requiring clean surfaces. HR coils with mill scale are suitable for structural applications, general fabrication, and pipe manufacturing where surface finish is not critical.`,

      grades: `HR Coils in India conform primarily to IS 2062 and IS 10748 specifications:

**IS 2062 E250 A/BR/B0** — Structural grade with 250 MPa minimum yield strength. Most widely consumed for general applications.

**IS 2062 E350** — Higher strength grade for structural and load-bearing applications requiring 350 MPa minimum yield strength.

**IS 10748 (HR2/HR3)** — Specification for hot-rolled steel strips for general engineering purposes. HR2 grade for bending and moderate forming; HR3 for deep drawing.

**SAPH 440/SAPH 590** — Automotive hot-rolled pickled and oiled grades used by Indian auto manufacturers for structural and chassis components.

**API 5L Grade B/X42/X52** — Specification for line pipes used in oil & gas transmission. HR coils meeting API specifications are supplied to pipe mills.

Major Indian HR coil producers include Tata Steel, JSW Steel, SAIL (Bokaro), AMNS India (Hazira), and JSPL.`,

      specifications: `HR Coils are produced across a range of specifications:

**Thickness:** 1.6mm to 25mm (most common: 2mm–12mm)
**Width:** 900mm to 2100mm (standard widths: 1000mm, 1250mm, 1500mm)
**Coil Weight:** 5 MT to 30 MT (inner diameter: 762mm standard)
**Surface:** Mill scale (as-rolled), pickled and oiled (P&O), or shot-blasted
**Coil ID:** 508mm or 762mm (depending on mill capability)

**Mechanical Properties (E250):**
- Yield Strength: ≥250 MPa
- Tensile Strength: 410–530 MPa
- Elongation: ≥23%

Thickness tolerance as per IS 2062 varies from ±0.12mm (for 1.6mm nominal) to ±0.90mm (for 25mm nominal). Premium mills offer tighter tolerances for automotive and precision tube applications.`,

      applications: `HR Coils serve as foundational material across multiple industries:

**Pipe & Tube Manufacturing:** ERW pipes, spiral welded pipes, and structural hollow sections consume approximately 30% of India's HR coil production. API-grade coils feed oil & gas pipeline manufacturing.

**Construction & Fabrication:** Direct consumption for structural fabrication, shipbuilding, and general engineering. Cut-to-length sheets and plates from HR coils serve construction sites.

**Automotive:** Hot-rolled pickled and oiled coils (HRPO) are used for chassis components, wheel rims, and structural parts in automobile manufacturing.

**Cold Rolling Feedstock:** Approximately 25% of HR coil production feeds cold rolling mills for producing CR coils, galvanized products, and tin plates.

**General Engineering:** Machine frames, conveyor components, storage systems, and industrial equipment fabrication.

**LPG Cylinders:** Specific grades of HR coils are used for manufacturing LPG cylinders, requiring stringent quality control and BIS certification.`,

      marketTrends: `India's HR coil market is undergoing significant transformation:

**Capacity Surplus:** India currently has surplus HR coil capacity relative to domestic demand, resulting in competitive pricing and export-oriented production. Export volumes reached 6+ MT in FY2024.

**Quality Upgradation:** Indian mills are investing in advanced finishing capabilities to produce higher-grade automotive and API-specification coils, reducing dependence on imports for premium applications.

**Digital Trading:** HR coils are increasingly traded on digital B2B platforms, with AI-driven price discovery and demand matching replacing traditional trader-intermediary models.

**Green Steel Premium:** HR coils produced through hydrogen-based or renewable energy routes are beginning to command premiums in export markets, particularly for EU-destined products subject to CBAM regulations.

**Import Competition:** Despite safeguard duties, imports from China, Japan, and South Korea continue to influence domestic pricing, particularly for specialty grades not produced domestically.`,

      procurementChallenges: `HR coil procurement involves several complexities:

**Coil Weight Variation:** Individual coil weights vary from 5MT to 30MT, creating challenges in order fulfillment when buyers need specific total quantities. Partial coils are generally not available.

**Specification Matching:** Surface quality, mechanical properties, and dimensional tolerances vary between producers. Matching specific application requirements with available production schedules requires technical expertise.

**Lead Time Management:** Mill-program orders have lead times of 4–8 weeks. Spot market availability fluctuates, and premium coil grades may have extended wait times.

**Logistics:** HR coils require specialized handling equipment (coil clamps, saddles) and flatbed trailers for transportation. Damage during transit (edge damage, telescoping) is a persistent quality concern.

**Minimum Order Quantities:** Mill-direct orders typically require 50–100 MT minimum, with specific width and thickness combinations adding to complexity.

**Price Volatility:** HR coil prices can fluctuate by ₹3,000–₹5,000/MT within a single month, creating significant procurement cost uncertainty for project-based buyers.`,

      pricingFactors: `HR Coil pricing is driven by:

**Raw Material Costs:** Iron ore and coking coal prices constitute 60–65% of production cost. Indian iron ore prices and Australian coking coal benchmarks are the primary cost drivers.

**International Benchmarks:** HRC FOB China and CIS export prices set the floor for Indian pricing. Import parity pricing (landed cost of imports) acts as a ceiling.

**Demand-Supply Balance:** Domestic consumption patterns, export volumes, and mill inventory levels influence spot market pricing.

**Grade and Width Premium:** Wider coils (1500mm+) and higher grades (E350, API) command premiums of ₹1,500–₹5,000/MT over standard E250 in 1250mm width.

**Surface Treatment:** Pickled and oiled (P&O) coils trade at ₹3,000–₹5,000/MT premium over mill-scale coils.

**Payment Terms:** Cash/advance buyers receive ₹500–₹1,500/MT discount over credit-term purchases.`,
      gradeTable: [
        { grade: "IS 2062 E250", yieldStrength: "250 MPa", application: "Fabrication & general engineering" },
        { grade: "IS 2062 E350", yieldStrength: "350 MPa", application: "Heavy structural applications" },
        { grade: "API X42", yieldStrength: "290 MPa", application: "Pipeline manufacturing" }
      ],
      widthToleranceTable: [
        { width: "1000 mm", tolerance: "+/- 5 mm" },
        { width: "1250 mm", tolerance: "+/- 5 mm" },
        { width: "1500 mm", tolerance: "+/- 6 mm" }
      ],
      downstreamApplications: [
        "CR coil feedstock",
        "Pipe & tube manufacturing",
        "Auto component fabrication",
        "Pressure vessel forming"
      ],
      exportCompliance: [
        "Mill Test Certificate mandatory",
        "CE marking for EU exports",
        "SGS / TPI inspection for large consignments",
        "Packing compliance for container shipping"
      ],
      indiaDemandIntelligence: [
        "Automotive OEM recovery demand",
        "Infrastructure fabrication growth",
        "Pipe mills capacity expansion",
        "Export competitiveness of Indian flat steel"
      ]
    },
    faqs: [
      { question: 'What is the current HR Coil price in India?', answer: 'HR Coil (IS 2062 E250, 1250mm width, 2–6mm thickness) currently trades between ₹48,000–₹58,000 per MT in Indian markets. Prices vary by location, with western India (Mumbai, Hazira) typically offering the most competitive mill-gate pricing. ProcureSaathi provides real-time competitive quotes through its sealed bidding platform.' },
      { question: 'What is the difference between HR Coil and CR Coil?', answer: 'HR (Hot Rolled) Coils are rolled at high temperatures (900°C+) with mill scale surface, available in 1.6mm–25mm thickness. CR (Cold Rolled) Coils are HR coils further processed at room temperature to achieve thinner gauges (0.15mm–3mm), tighter tolerances, and smoother surface finish. CR coils are more expensive due to additional processing but essential for applications requiring surface quality.' },
      { question: 'What are the standard HR Coil sizes in India?', answer: 'Standard HR Coil sizes in India include widths of 900mm, 1000mm, 1250mm, 1500mm, and 2100mm, with thicknesses from 1.6mm to 25mm. Common coil weights range from 5MT to 30MT with inner diameter of 762mm. The most commonly traded specification is 1250mm width × 2mm–6mm thickness in E250 grade.' },
      { question: 'Which Indian mills produce HR Coils?', answer: 'Major HR coil producers in India include Tata Steel (Jamshedpur), JSW Steel (Vijayanagar, Dolvi), SAIL Bokaro Steel Plant, AMNS India (Hazira), JSPL (Angul), and Essar Steel (now AMNS). Together these integrated mills produce over 50 MTPA of HR coils. Secondary producers using EAF/IF route contribute additional capacity.' },
      { question: 'What is HRPO coil?', answer: 'HRPO (Hot Rolled Pickled and Oiled) is HR coil that has been acid-pickled to remove mill scale and then oiled for corrosion protection. The pickled surface provides better weldability, paintability, and dimensional accuracy compared to mill-scale HR coils. HRPO is widely used in automotive, appliance, and precision tube manufacturing.' },
      { question: 'How is HR Coil weight calculated?', answer: 'HR Coil weight = Width (m) × Thickness (mm) × Length (m) × 7.85 (density in kg/m² per mm). For a coil of 1.25m width × 3mm × 1000m length: 1.25 × 3 × 1000 × 7.85 = 29,437.5 kg ≈ 29.4 MT. Actual weight varies slightly due to thickness variation across the coil width and length.' },
      { question: 'What is the minimum order for HR Coils in India?', answer: 'Mill-direct orders typically require 50–100 MT minimum per width and thickness combination, with 4–8 week lead times. Stockist orders can be fulfilled from 1 MT upward at a premium of ₹1,500–₹4,000/MT. ProcureSaathi aggregates demand from multiple buyers to access mill-direct pricing for smaller individual requirements.' },
      { question: 'Can HR Coils be exported from India?', answer: 'Yes, India exports 6–8 MT of HR coils annually to Southeast Asia, Middle East, Africa, and Europe. Export-grade coils must meet destination country specifications (EN, ASTM, JIS). ProcureSaathi manages export procurement including quality certification, pre-shipment inspection, and FOB/CIF logistics coordination from major Indian ports.' }
    ],
    demandIntelligence: {
      intentScore: 82,
      confidencePercent: 88,
      recentRFQs: 28,
      avgDealSize: '₹35.8 Lakhs',
      corridors: ['India Domestic', 'India → Vietnam', 'India → UAE', 'India → Italy']
    },
    relatedProducts: ['ms-plates-india', 'cr-coil-india', 'gi-pipes-india'],
    hsnCodes: ['7208', '7211'],
    standards: ['IS 2062:2011', 'IS 10748', 'ASTM A1011', 'EN 10025'],
    isActivated: true
  },

  // ─── 4. CR COIL ──────────────────────────────────────────────
  {
    slug: 'cr-coil-india',
    name: 'CR Coil',
    country: 'India',
    countryCode: 'IN',
    industry: 'Metals',
    industrySlug: 'metals',
    subIndustry: 'Ferrous',
    subIndustrySlug: 'ferrous',
    h1: 'Buy CR Coils in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy CR Coils in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source Cold Rolled (CR) Coils from AI-verified Indian mills. IS 513 grades, 0.15mm–3mm thickness. Superior surface finish for automotive, appliance, and precision applications.',
    introText: 'Cold Rolled (CR) Coils are premium flat steel products with superior surface finish, tighter dimensional tolerances, and enhanced mechanical properties compared to hot-rolled products. Essential for automotive body panels, home appliances, furniture, and precision engineering applications. ProcureSaathi connects buyers with verified CR coil producers through AI-matched procurement.',
    heroImage: '/images/products/cr-coil.webp',
    heroImageAlt: 'Cold rolled steel coils with bright finish in Indian steel processing facility',
    sections: {
      whatIs: `Cold Rolled (CR) Coils are flat steel products manufactured by further processing Hot Rolled (HR) coils at room temperature through cold reduction mills. The process involves pickling HR coils to remove mill scale, then passing them through tandem cold rolling mills that reduce thickness by 40%–90% while improving surface finish, flatness, and mechanical properties. The cold rolling process work-hardens the steel, increasing strength but reducing ductility. To restore formability, CR coils are annealed (heated to 650°C–720°C in controlled atmospheres) and may be temper-rolled for final surface finish and mechanical property control.

India produces approximately 15 million MT of CR coils annually, with major production from Tata Steel, JSW Steel, AMNS India, SAIL (Bokaro), and several secondary cold rolling mills. CR coils command a premium of ₹8,000–₹15,000/MT over equivalent HR coils due to the additional processing required.

The superior surface quality and dimensional precision of CR coils make them indispensable for applications where appearance, formability, and tight tolerances are critical requirements.`,

      grades: `CR Coils are classified by application and mechanical properties under IS 513:2008 and international standards:

**IS 513 CR1 (Commercial Quality)** — General-purpose grade for mild forming and bending. Suitable for furniture, shelving, and non-critical fabrication.

**IS 513 CR2 (Drawing Quality)** — Enhanced formability for moderate drawing operations. Used in automotive components, appliance parts, and general presswork.

**IS 513 CR3 (Drawing Quality Special)** — High formability for deep drawing applications. Used in complex stampings, kitchen sinks, and automotive panels.

**IS 513 CR4 (Extra Deep Drawing Quality)** — Premium formability grade for severe deep drawing. Used in automotive body panels, LPG cylinder bodies, and complex pressed components.

**IS 513 CR5 (Super Extra Deep Drawing Quality)** — Maximum formability for the most demanding deep drawing applications. Limited production in India.

**SPCC/SPCD/SPCE (JIS equivalents)** — Japanese standard equivalents widely referenced by automotive OEMs operating in India.`,

      specifications: `CR Coils are produced in precision specifications:

**Thickness:** 0.15mm to 3.0mm (most common: 0.5mm–2.0mm)
**Width:** 600mm to 1650mm (standard widths: 900mm, 1000mm, 1250mm)
**Coil Weight:** 3 MT to 25 MT
**Surface Finish:** Bright, matte, or stone finish depending on application
**Coil ID:** 508mm or 610mm
**Flatness:** ≤5mm per 1000mm (tighter for automotive grades)
**Roughness (Ra):** 0.4–1.8 µm depending on finish type`,

      applications: `CR Coils serve precision-demanding industries:

**Automotive:** Body panels (doors, hoods, fenders), structural components, and closure panels. India's automotive sector consumes approximately 4 million MT of CR coils annually.

**Home Appliances:** Refrigerator bodies, washing machine drums, microwave enclosures, and air conditioner panels. White goods manufacturing is a major CR coil consumer.

**Furniture:** Office furniture, modular kitchen cabinets, storage systems, and commercial shelving. Steel furniture manufacturing is growing rapidly in India.

**Electrical Panels:** Control panels, distribution boards, and electrical enclosures requiring clean, paintable surfaces.

**Packaging:** Tin plate production (for food cans), crown caps, and industrial containers.

**General Engineering:** Precision tubes, stampings, and formed components requiring dimensional accuracy.`,

      marketTrends: `India's CR coil market trends reflect industrial growth:

**Automotive Demand Growth:** India's automotive sector is expanding with EV manufacturing adding new demand for specialized CR grades with enhanced formability and weldability.

**Import Substitution:** Indian mills are progressively improving CR coil quality to substitute imports from Japan and South Korea for automotive-grade applications, reducing the import bill.

**Surface Quality Focus:** Investment in advanced temper rolling and surface finishing technology is enabling Indian producers to offer globally competitive surface quality.

**Galvanizing Feedstock:** Increasing demand for galvanized and color-coated products is pulling CR coil demand upward as these downstream products require CR as base material.

**Digital Procurement:** CR coil buyers are adopting digital procurement platforms for price discovery and specification matching, reducing reliance on traditional trading channels.`,

      procurementChallenges: `CR coil procurement presents specific challenges:

**Grade Specification Complexity:** Application-specific grades (CR1 through CR5) require detailed understanding of formability requirements. Incorrect grade selection leads to production rejects.

**Surface Quality Variability:** Surface defects (scratches, roll marks, rust stains) can render CR coils unusable for visible applications. In-line inspection data and surface quality guarantees are essential.

**Tight Tolerances:** Thickness tolerance requirements for automotive applications (±0.01mm to ±0.05mm) are significantly tighter than HR products, limiting supplier options.

**Annealing Type:** Batch annealed vs. continuous annealed CR coils have different mechanical property profiles. Matching annealing type to application requirements requires metallurgical expertise.

**Minimum Order Constraints:** Grade-specific MOQs at mills are typically 50–100 MT, making procurement challenging for buyers with smaller or varied grade requirements.

**Inventory Carrying Cost:** CR coils are susceptible to surface rusting if stored improperly, adding quality risk to inventory holding.`,

      pricingFactors: `CR Coil pricing depends on:

**HR Coil Input Cost:** CR coil pricing is typically HR price plus ₹8,000–₹15,000/MT conversion cost depending on gauge and grade.

**Grade Premium:** Drawing grades (CR3, CR4) command ₹2,000–₹5,000/MT premium over commercial quality (CR1).

**Thickness Premium:** Ultra-thin gauges (below 0.5mm) carry significant premiums due to rolling difficulty and yield losses.

**Surface Finish Premium:** Bright finish and special textures add ₹1,000–₹3,000/MT over standard matte finish.

**Width Premium:** Non-standard widths and narrow slitting attract additional processing charges.

**Volume Discounts:** Annual contracts with committed volumes can achieve ₹2,000–₹4,000/MT savings over spot purchases.`
    },
    faqs: [
      { question: 'What is CR Coil price in India today?', answer: 'CR Coil (IS 513 CR2, 0.8mm–1.2mm, 1250mm width) currently trades between ₹58,000–₹72,000 per MT in Indian markets. Prices are ₹8,000–₹15,000/MT above equivalent HR coils. Automotive-grade CR4 commands additional ₹3,000–₹5,000/MT premium. ProcureSaathi provides competitive pricing through direct mill connections and sealed bidding.' },
      { question: 'What is the difference between CR and HR coils?', answer: 'CR coils are manufactured by cold rolling HR coils at room temperature. Key differences: CR has thinner gauge (0.15–3mm vs 1.6–25mm), superior surface finish (bright vs mill scale), tighter tolerances (±0.01mm vs ±0.5mm), and better formability. CR costs more (₹8,000–15,000/MT premium) but is essential for applications requiring surface quality, precision, and deep drawing capability.' },
      { question: 'What is IS 513 standard for CR Coils?', answer: 'IS 513:2008 is the BIS standard for Cold Reduced Low Carbon Steel Sheets and Strips. It classifies CR steel into grades CR1 (Commercial), CR2 (Drawing), CR3 (Drawing Special), CR4 (Extra Deep Drawing), and CR5 (Super Extra Deep Drawing) based on formability and mechanical properties. Each grade has specified yield strength, elongation, and strain hardening requirements.' },
      { question: 'What thickness of CR Coil is available?', answer: 'CR Coils are produced from 0.15mm to 3.0mm thickness in India. The most commonly procured range is 0.5mm–2.0mm. Ultra-thin gauges below 0.3mm (tin plate base) are produced by select mills. Standard widths range from 600mm to 1650mm. Thinner gauges command progressively higher per-MT prices due to rolling complexity.' },
      { question: 'Which Indian mills produce CR Coils?', answer: 'Major CR coil producers include Tata Steel (Jamshedpur), JSW Steel (Vijayanagar, Tarapur), AMNS India (Hazira), SAIL Bokaro Steel Plant, Bhushan Steel (now Tata BSL), and several secondary cold rolling mills. Combined installed capacity exceeds 20 MTPA. Mill selection depends on grade requirements, width, and delivery location.' },
      { question: 'What is CRCA steel coil?', answer: 'CRCA stands for Cold Rolled Close Annealed — a CR coil that has been annealed in a batch (box) annealing process. CRCA provides good formability and is commonly used in general engineering and furniture applications. It differs from CRCAL (Continuous Annealed) which provides more uniform properties but may have slightly different formability characteristics.' },
      { question: 'Can CR Coils be used for galvanizing?', answer: 'Yes, CR coils are the primary feedstock for hot-dip galvanized (GI/GP) products and electro-galvanized products. The CR substrate quality directly impacts galvanized coating adhesion, surface appearance, and formability. Drawing-grade CR coils (CR2, CR3) are preferred for galvanized products destined for automotive and appliance applications.' },
      { question: 'What is the weight of a CR Coil?', answer: 'CR Coil weights typically range from 3MT to 25MT depending on dimensions. Weight calculation: Width (m) × Thickness (mm) × Length (m) × 7.85. For a 1.25m × 1.0mm × 3000m coil: 1.25 × 1.0 × 3000 × 7.85 = 29,437 kg ≈ 29.4 MT. Actual weights vary; most mills produce coils in 8–15 MT range for handling convenience.' }
    ],
    demandIntelligence: {
      intentScore: 78,
      confidencePercent: 85,
      recentRFQs: 22,
      avgDealSize: '₹28.4 Lakhs',
      corridors: ['India Domestic', 'India → Bangladesh', 'India → Vietnam']
    },
    relatedProducts: ['hr-coil-india', 'gi-pipes-india', 'ms-plates-india'],
    hsnCodes: ['7209', '7211'],
    standards: ['IS 513:2008', 'JIS G3141', 'EN 10130', 'ASTM A1008'],
    isActivated: true
  },

  // ─── 5. STRUCTURAL STEEL ──────────────────────────────────────
  {
    slug: 'structural-steel-india',
    name: 'Structural Steel',
    country: 'India',
    countryCode: 'IN',
    industry: 'Metals',
    industrySlug: 'metals',
    subIndustry: 'Ferrous',
    subIndustrySlug: 'ferrous',
    h1: 'Buy Structural Steel in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy Structural Steel in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source Structural Steel sections (I-beams, H-beams, channels, angles) from AI-verified Indian mills. IS 2062 compliant. Competitive pricing for construction and infrastructure.',
    introText: 'Structural Steel encompasses a range of hot-rolled long products including I-beams, H-beams, channels, angles, and joists that form the skeletal framework of modern buildings and infrastructure. India\'s infrastructure boom is driving unprecedented demand for quality structural steel. ProcureSaathi connects construction companies with verified structural steel producers through AI-matched procurement.',
    heroImage: '/images/products/structural-steel.webp',
    heroImageAlt: 'Structural steel I-beams and H-beams at an Indian construction project',
    sections: {
      whatIs: `Structural Steel refers to a category of hot-rolled steel sections produced in standardized shapes designed to bear loads in construction and infrastructure applications. These sections are manufactured by passing heated billets or blooms through a series of specially designed rolls that progressively shape the steel into the desired cross-sectional profile. The most common structural steel sections include: ISMB (Indian Standard Medium Weight Beams), ISJB (Indian Standard Junior Beams), ISLB (Indian Standard Light Weight Beams), ISWB (Indian Standard Wide Flange Beams), H-beams (universal columns), channels (ISMC, ISJC), angles (equal and unequal leg), and tees. India's structural steel production exceeds 12 million MT annually, supplied primarily by SAIL, Jindal Steel & Power (JSPL), and JSW Steel.`,

      grades: `Structural Steel in India conforms to IS 2062:2011 specifications with the following key grades:

**E250** — Standard structural grade, 250 MPa yield strength. The workhorse grade for general construction applications including buildings, warehouses, and light industrial structures.

**E300** — Intermediate grade for applications requiring higher load capacity without the premium of E350.

**E350** — High-strength structural grade, 350 MPa yield strength. Specified for bridges, heavy industrial structures, and high-rise buildings where weight reduction through higher-strength steel is economically justified.

**E410** — Specialized high-strength grade for heavy structural applications including offshore platforms and heavy crane structures.

**Equivalent International Standards:** ASTM A992 (W-shapes), EN 10025 S275/S355, JIS G3101 SS400.`,

      specifications: `Common structural steel sections and their specifications:

**ISMB (Indian Standard Medium Beams):** Sizes from ISMB 100 to ISMB 600. Web depth 100mm to 600mm, flange width 75mm to 210mm. Weight from 11.5 kg/m to 122.6 kg/m.

**H-Beams:** Universal columns and beams from 100×100mm to 400×400mm. Heavier and wider flanges than I-beams for superior column applications.

**ISMC (Channels):** ISMC 75 to ISMC 400. Used for purlins, girts, and secondary structural members.

**ISA (Angles):** Equal angles from 20×20mm to 200×200mm; unequal angles available. Used for trusses, bracings, and connections.

**Standard Lengths:** 6m, 9m, 12m (custom lengths available at premium)

All sections manufactured per IS 808 (dimensions) and IS 2062 (material properties).`,

      applications: `Structural Steel sections serve critical roles in India's construction and infrastructure landscape:

**Pre-Engineered Buildings (PEB):** The fastest-growing segment consuming H-beams, angles, and channels for industrial warehouses, logistics parks, and manufacturing facilities. India's PEB market grows at 15%+ annually.

**Multi-Story Buildings:** Structural steel-framed buildings for commercial offices, IT parks, hospitals, and educational institutions. Steel framing reduces construction time by 30–40% compared to RCC.

**Bridges & Flyovers:** Plate girder and box girder bridges utilize heavy I-beams, H-beams, and plates. India's Bharatmala project includes thousands of steel bridges.

**Industrial Structures:** Process plant structures, pipe racks, conveyor galleries, and equipment support structures in refineries, power plants, and manufacturing facilities.

**Transmission Towers:** Angle sections form the structural framework of electrical transmission towers and communication masts.

**Railway Structures:** Station buildings, platform roofing, rail over bridges (ROBs), and foot over bridges (FOBs).`,

      marketTrends: `India's structural steel market reflects infrastructure-driven demand growth:

**PEB Revolution:** Pre-engineered buildings are driving structural section demand as India builds logistics infrastructure. Major PEB players like Zamil, Kirby, and Interarch consume significant structural steel volumes.

**High-Strength Adoption:** E350 grade adoption is increasing as engineers optimize designs for material efficiency. Higher-strength grades reduce steel tonnage requirements by 15–25%.

**JSPL and SAIL Dominance:** These two producers control approximately 70% of India's structural section market. JSW Steel is expanding structural section capacity to increase market competition.

**Fabrication Ecosystem Growth:** India's structural steel fabrication capacity has expanded significantly, with modern CNC-equipped fabrication shops enabling complex structural solutions.

**Imported H-Beams:** Heavy H-beam sections (above 400mm) are partially imported from China and South Korea as domestic production capacity for larger sizes is limited.`,

      procurementChallenges: `Structural steel procurement involves unique challenges:

**Size Mix Complexity:** A typical construction project requires 10–30 different section sizes and types, making procurement planning complex. Matching available mill production schedules with project requirements requires coordination.

**Length Constraints:** Standard 12m lengths may not suit all applications. Non-standard lengths increase wastage or require premium pricing. Transport constraints limit maximum length to 12m for road transport.

**Quality Certification:** Structural sections for government and infrastructure projects require BIS certification, mill test certificates, and sometimes third-party inspection. Documentation compliance is critical for tender participation.

**Limited Producer Options:** With SAIL and JSPL dominating production, buyer negotiation leverage is limited compared to flat products which have more producers. This concentrates pricing power with manufacturers.

**Delivery Lead Times:** Popular section sizes may have 4–8 week lead times for mill-direct orders. Stockist availability for heavy and uncommon sections is limited outside major metro areas.

**Transport Logistics:** Long structural sections require specialized transport (trailers with extendable beds). Oversize load permits may be required, adding cost and time.`,

      pricingFactors: `Structural steel pricing is influenced by:

**Billet/Bloom Input Cost:** Structural sections are rolled from billets or blooms. Input material cost constitutes 60–70% of finished section price.

**Section Size Premium:** Lighter sections (angles, junior beams) are priced per MT at ₹2,000–₹4,000/MT premium over heavier sections due to higher rolling costs per unit weight.

**Grade Premium:** E350 structural sections command ₹2,000–₹3,000/MT over E250 due to alloying additions and controlled rolling requirements.

**Mill vs. Stockist:** Mill-direct pricing is typically ₹2,000–₹5,000/MT lower than stockist prices but requires larger MOQ and longer lead times.

**Transport:** Structural sections have lower loading efficiency per truck compared to coils and plates, resulting in higher freight cost per MT (₹2,000–₹6,000/MT depending on distance).

**Market Dynamics:** Limited competition in structural sections means pricing is less volatile than flat products but also less responsive to downward corrections.`,
      sizeTable: [
        { section: "ISMB 200", weightPerMeter: "25.4 kg/m" },
        { section: "ISMB 300", weightPerMeter: "44.2 kg/m" },
        { section: "ISHB 250", weightPerMeter: "74.1 kg/m" },
        { section: "ISMC 150", weightPerMeter: "16.8 kg/m" }
      ],
      loadBearingInsights: [
        "ISHB sections used for heavy load industrial sheds",
        "ISMB preferred for general building frames",
        "Channel sections ideal for secondary structures",
        "Moment of inertia determines beam performance"
      ],
      fabricationImplications: [
        "Cutting and welding costs vary by flange thickness",
        "Pre-drilled beams reduce site labor time",
        "Galvanizing increases cost but improves durability"
      ],
      complianceMatrix: [
        "IS 2062 Structural Steel Standards",
        "IS 808 Beam dimensions",
        "BIS compliance required for public infrastructure",
        "MTC mandatory for EPC billing"
      ],
      indiaDemandIntelligence: [
        "Warehouse & logistics park expansion",
        "Industrial corridor steel demand",
        "Renewable energy mounting structures",
        "Oil & gas structural fabrication growth"
      ]
    },
    faqs: [
      { question: 'What is the price of structural steel per kg in India?', answer: 'Structural steel (I-beams, H-beams, channels) prices in India range from ₹52 to ₹68 per kg depending on section type, size, grade, and market conditions. ISMB sections from SAIL/JSPL typically trade between ₹55,000–₹65,000 per MT. H-beams command a premium of ₹2,000–₹4,000/MT over equivalent I-beams. ProcureSaathi provides competitive pricing through direct mill connections.' },
      { question: 'What is the difference between I-beam and H-beam?', answer: 'I-beams (ISMB) have tapered flanges and narrower width relative to depth, optimized for beam applications (horizontal spanning). H-beams (universal columns) have parallel flanges and wider width relative to depth, optimized for column applications (vertical load-bearing). H-beams provide superior moment of inertia about the weak axis, making them more resistant to buckling. Selection depends on structural design requirements.' },
      { question: 'What sizes of ISMB beams are available in India?', answer: 'ISMB sections range from ISMB 100 (100mm depth, 75mm flange, 11.5 kg/m) to ISMB 600 (600mm depth, 210mm flange, 122.6 kg/m). Popular sizes for construction include ISMB 150, ISMB 200, ISMB 250, ISMB 300, and ISMB 350. Sizes above ISMB 400 have limited stockist availability and typically require mill-direct ordering with 4–6 week lead times.' },
      { question: 'Which company manufactures structural steel in India?', answer: 'Major structural steel manufacturers in India include SAIL (Bhilai, Durgapur, Rourkela plants), JSPL (Raigarh, Angul), JSW Steel (expanding capacity), and Tata Steel (limited structural section production). SAIL and JSPL together account for approximately 70% of domestic structural section production. Imported sections from China and South Korea supplement domestic supply for certain sizes.' },
      { question: 'What IS standard applies to structural steel sections?', answer: 'Indian structural steel sections are governed by: IS 808 (dimensions and properties of standard sections), IS 2062 (material specification for structural steel), IS 12778 (for hot-rolled parallel flange beams/columns), and IS 800 (general construction code for structural steel). These standards specify dimensions, tolerances, mechanical properties, and design requirements.' },
      { question: 'What is structural steel grade E250?', answer: 'E250 is the most widely used structural steel grade in India per IS 2062:2011. It has a minimum yield strength of 250 MPa, tensile strength of 410–530 MPa, and minimum elongation of 23%. The "E" stands for structural steel, and "250" indicates the minimum yield strength in megapascals. Suitable for general buildings, warehouses, and moderate-load structures.' },
      { question: 'How to calculate structural steel weight?', answer: 'Structural steel weight is calculated using the theoretical unit weight (kg/m) published in IS 808 multiplied by the total length. For example: ISMB 300 has a unit weight of 44.2 kg/m. For 100 meters: 44.2 × 100 = 4,420 kg = 4.42 MT. For angles: ISA 75×75×6 = 6.8 kg/m. Always use IS 808 tables for accurate unit weights.' },
      { question: 'Can structural steel be exported from India?', answer: 'Yes, Indian structural steel is exported to the Middle East, Africa, and Southeast Asia. Export orders must meet destination country standards (ASTM, EN, JIS). ProcureSaathi facilitates export procurement including BIS/international certification, pre-shipment inspection coordination, and FOB/CIF logistics from Indian ports. Key export corridors include India to Saudi Arabia, UAE, Kenya, and Bangladesh.' }
    ],
    demandIntelligence: {
      intentScore: 84,
      confidencePercent: 90,
      recentRFQs: 31,
      avgDealSize: '₹22.6 Lakhs',
      corridors: ['India Domestic', 'India → Saudi Arabia', 'India → UAE', 'India → Bangladesh']
    },
    relatedProducts: ['ms-plates-india', 'tmt-bars-india', 'hr-coil-india'],
    hsnCodes: ['7216', '7228'],
    standards: ['IS 2062:2011', 'IS 808', 'IS 12778', 'IS 800'],
    isActivated: true
  },

  // ─── 6-10: Condensed product entries ──────────────────────────
  // GI Pipes, Aluminium Ingots, Bitumen VG30, HDPE Granules, Industrial Valves
  
  {
    slug: 'gi-pipes-india',
    name: 'GI Pipes',
    country: 'India',
    countryCode: 'IN',
    industry: 'Metals',
    industrySlug: 'metals',
    subIndustry: 'Ferrous',
    subIndustrySlug: 'ferrous',
    h1: 'Buy GI Pipes in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy GI Pipes in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source Galvanized Iron (GI) Pipes from AI-verified Indian manufacturers. IS 1239 compliant, Class A/B/C. For plumbing, water supply, structural, and fencing applications.',
    introText: 'Galvanized Iron (GI) Pipes are zinc-coated steel pipes widely used in plumbing, water supply, structural applications, and fencing across India. The galvanized coating provides corrosion resistance extending pipe life to 20–30 years. ProcureSaathi connects buyers with verified GI pipe manufacturers through AI-driven procurement.',
    heroImage: '/images/products/gi-pipes.webp',
    heroImageAlt: 'Galvanized iron pipes stacked in an Indian manufacturing facility',
    sections: {
      whatIs: `Galvanized Iron (GI) Pipes are mild steel pipes that have been coated with a layer of zinc through the hot-dip galvanizing process. The base pipe is manufactured by the Electric Resistance Welding (ERW) process from HR steel strips, then immersed in a bath of molten zinc at approximately 450°C. The resulting zinc coating (typically 300–600 g/m²) provides excellent corrosion resistance by acting as both a physical barrier and a sacrificial anode.

GI pipes are produced in light (Class A), medium (Class B), and heavy (Class C) grades per IS 1239, with wall thickness increasing from Class A to Class C. India produces over 5 million MT of GI pipes annually, with major producers including APL Apollo, Tata Steel BSL, Jindal Saw, Surya Roshni, and numerous regional manufacturers.

The pipes are available in sizes ranging from 15mm (1/2 inch) nominal bore to 150mm (6 inch) nominal bore, in standard lengths of 6 meters. Larger diameter GI pipes are produced by select manufacturers for specific applications.`,

      grades: `GI Pipes conform to IS 1239 (Part 1):2004 with three classes:

**Class A (Light)** — Thinnest wall, suitable for low-pressure plumbing and general-purpose water distribution in residential buildings. Most economical option.

**Class B (Medium)** — Standard wall thickness, widely used for water supply, fire protection, and general structural applications. The most commonly specified class.

**Class C (Heavy)** — Thickest wall, designed for high-pressure applications, external underground installation, and industrial process piping where maximum corrosion allowance is required.

**Zinc Coating Standards:** Minimum zinc coating per IS 4736: 300 g/m² for Class A, 400 g/m² for Class B, and 500 g/m² for Class C. Higher coating weights extend service life in corrosive environments.

**ERW vs. Seamless:** Most GI pipes in India are ERW (Electric Resistance Welded). Seamless GI pipes are available for high-pressure applications but at significantly higher cost.`,

      specifications: `Standard GI Pipe sizes and specifications per IS 1239:

**Nominal Bore:** 15mm (½"), 20mm (¾"), 25mm (1"), 32mm (1¼"), 40mm (1½"), 50mm (2"), 65mm (2½"), 80mm (3"), 100mm (4"), 125mm (5"), 150mm (6")
**Standard Length:** 6 meters (also available in 4m and custom lengths)
**Wall Thickness:** Varies by class — e.g., 25mm NB: Class A = 2.0mm, Class B = 2.65mm, Class C = 3.25mm
**Threading:** Plain end or threaded with sockets (BSP threads per IS 554)
**Surface:** Galvanized finish (zinc coating weight varies by class)
**Testing:** Hydraulic test pressure varies by class and size per IS 1239

Weight per meter varies by size and class. Example: 25mm NB Class B = 1.56 kg/m; 50mm NB Class B = 3.56 kg/m.`,

      applications: `GI Pipes serve diverse applications across India:

**Plumbing & Water Supply:** The primary application — residential, commercial, and municipal water distribution networks. Class B is the standard specification for potable water lines.

**Fire Protection:** Sprinkler systems, fire hydrant risers, and fire-fighting water supply lines. Class C heavy pipes are preferred for fire protection due to higher pressure rating.

**Structural Applications:** Fencing posts, scaffolding tubes, greenhouse structures, and light structural frameworks. GI pipes provide corrosion-resistant structural support for outdoor applications.

**Agricultural Irrigation:** Overhead irrigation systems, pump discharge lines, and bore well casing in agricultural applications.

**Electrical Conduit:** GI pipes serve as conduits for electrical wiring in industrial and commercial buildings where metal conduit is specified.

**Handrails & Guards:** Staircase handrails, balcony railings, and safety guards in buildings and industrial facilities.`,

      marketTrends: `India's GI pipe market is evolving:

**Jal Jeevan Mission Impact:** The government's program to provide tap water to every rural household by 2024 has created massive demand for GI pipes in water distribution networks.

**Shift to CPVC/PPR:** For internal plumbing in new residential construction, plastic pipes (CPVC, PPR) are progressively replacing GI pipes. However, GI remains dominant for larger diameters, external applications, and retrofit projects.

**Quality Enforcement:** BIS certification has become mandatory for GI pipes, reducing sub-standard production and improving overall market quality.

**Consolidation:** Large organized players like APL Apollo are gaining market share from small unorganized manufacturers through better quality, wider distribution, and brand building.

**Export Growth:** Indian GI pipe exports to Africa and the Middle East are growing, driven by competitive pricing and IS/ASTM dual certification capability.`,

      procurementChallenges: `GI pipe procurement challenges include:

**Size Mix Complexity:** Projects typically require 5–15 different pipe sizes, making single-source fulfillment challenging. Matching available stock across all required sizes and classes requires coordination.

**Threading Quality:** Threaded GI pipes must have clean, accurate threads for leak-free joints. Poor threading is a common quality complaint requiring inspection before acceptance.

**Zinc Coating Consistency:** Coating weight and uniformity vary between manufacturers. Inadequate galvanizing leads to premature corrosion, especially in buried or outdoor applications.

**Transport Damage:** GI pipes are susceptible to transport damage (dents, scratches, end damage) that can compromise both function and appearance. Proper packaging and careful handling are essential.

**Counterfeit Products:** Sub-standard pipes with fake BIS marks remain a concern in price-sensitive markets. Verification of BIS license and physical testing are recommended for large procurements.

**Length Wastage:** Standard 6m lengths may not align with project requirements, leading to cutting waste. Optimized length planning can reduce material waste by 5–10%.`,

      pricingFactors: `GI Pipe pricing depends on:

**HR Strip Input Cost:** GI pipe pricing closely tracks HR strip/coil prices, which constitute 60–65% of production cost.

**Zinc Prices:** International zinc prices (LME benchmark) directly impact galvanizing costs. Zinc constitutes 15–20% of finished GI pipe cost.

**Class/Wall Thickness:** Class C pipes cost 20–30% more per meter than Class A due to higher steel and zinc content.

**Size:** Larger diameter pipes have lower per-MT production costs but higher per-meter costs due to more material.

**Threading:** Threaded pipes with sockets cost ₹500–₹1,500/MT more than plain-end pipes.

**Brand Premium:** Major brands (APL Apollo, Tata, Jindal) command ₹1,000–₹3,000/MT premium over regional manufacturers.

**Quantity:** Truckload orders (10–20 MT) receive ₹500–₹1,500/MT better pricing than small-lot purchases.`
    },
    faqs: [
      { question: 'What is GI Pipe price per kg in India?', answer: 'GI Pipe prices in India range from ₹55 to ₹80 per kg depending on size, class, and manufacturer. Class B (medium) pipes from major brands trade between ₹58,000–₹72,000 per MT. Class C (heavy) pipes are 20–30% more expensive. Prices fluctuate with HR steel strip and LME zinc prices.' },
      { question: 'What is the difference between Class A, B, and C GI Pipes?', answer: 'Classes A, B, and C differ in wall thickness: Class A (Light) has the thinnest wall for low-pressure applications, Class B (Medium) is the standard for most water supply and general applications, and Class C (Heavy) has the thickest wall for high-pressure and underground installations. Higher class means more steel and zinc per meter, longer life, and higher cost.' },
      { question: 'What is IS 1239 standard for GI Pipes?', answer: 'IS 1239 is the Bureau of Indian Standards specification for mild steel tubes, covering dimensions, tolerances, mechanical properties, galvanizing requirements, and testing procedures for GI pipes. Part 1 covers tubes and Part 2 covers fittings. BIS certification per IS 1239 is mandatory for GI pipes sold in India.' },
      { question: 'What size GI Pipes are available?', answer: 'GI pipes are available in nominal bore sizes from 15mm (½") to 150mm (6") per IS 1239. Common residential sizes are 15mm, 20mm, and 25mm. Commercial and industrial applications use 32mm to 100mm. Standard length is 6 meters. Larger sizes above 150mm are available from select manufacturers but are not covered by IS 1239.' },
      { question: 'GI Pipe vs PVC Pipe — which is better?', answer: 'GI pipes offer higher pressure ratings, fire resistance, structural strength, and longer life in exposed applications. PVC pipes are lighter, cheaper, corrosion-immune, and easier to install. For potable water supply, both are acceptable. GI is preferred for fire protection, exposed outdoor installations, and high-temperature applications. PVC is preferred for drainage, underground cold water lines, and cost-sensitive installations.' },
      { question: 'How long does a GI Pipe last?', answer: 'Properly installed GI pipes last 20–30 years in normal conditions. Life depends on water quality (acidic water accelerates zinc consumption), soil conditions (for buried pipes), zinc coating weight, and installation quality. Class C pipes with higher zinc coating last longest. In aggressive environments, supplementary coatings (epoxy, PE) may be applied to extend life.' },
      { question: 'What is the weight of GI Pipe per meter?', answer: 'Weight varies by size and class. Examples (Class B): 15mm NB = 1.02 kg/m, 20mm NB = 1.24 kg/m, 25mm NB = 1.56 kg/m, 32mm NB = 2.17 kg/m, 40mm NB = 2.54 kg/m, 50mm NB = 3.56 kg/m, 80mm NB = 6.42 kg/m, 100mm NB = 8.36 kg/m. Multiply by 6 for weight per standard 6m length.' },
      { question: 'How to check GI Pipe quality?', answer: 'Quality checks include: (1) BIS mark verification — confirm license number on BIS website; (2) Zinc coating test — Preece test (copper sulphate dipping) per IS 4736; (3) Dimensional check — OD, wall thickness, and length per IS 1239; (4) Hydraulic test — pressure test per specification; (5) Visual inspection — uniform zinc coating, no bare spots, no surface defects; (6) Thread gauge check for threaded pipes.' }
    ],
    demandIntelligence: {
      intentScore: 76,
      confidencePercent: 83,
      recentRFQs: 19,
      avgDealSize: '₹8.2 Lakhs',
      corridors: ['India Domestic', 'India → Kenya', 'India → Nigeria']
    },
    relatedProducts: ['structural-steel-india', 'ms-plates-india', 'hr-coil-india'],
    hsnCodes: ['7306', '7304'],
    standards: ['IS 1239:2004', 'IS 4736', 'IS 554', 'ASTM A53'],
    isActivated: true
  },

  {
    slug: 'aluminium-ingots-india',
    name: 'Aluminium Ingots',
    country: 'India',
    countryCode: 'IN',
    industry: 'Metals',
    industrySlug: 'metals',
    subIndustry: 'Non-Ferrous',
    subIndustrySlug: 'non-ferrous',
    h1: 'Buy Aluminium Ingots in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy Aluminium Ingots in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source Aluminium Ingots (99.7% purity, ADC12, LM6) from AI-verified Indian producers. For die casting, extrusion, and alloy manufacturing. Live pricing and managed procurement.',
    introText: 'Aluminium Ingots are the primary raw material for India\'s aluminium downstream industry including die casting, extrusion, rolling, and alloy manufacturing. With India being the world\'s second-largest aluminium producer, ProcureSaathi connects foundries and manufacturers with verified aluminium smelters and recyclers through AI-driven procurement.',
    heroImage: '/images/products/aluminium-ingots.webp',
    heroImageAlt: 'Aluminium ingots stacked at a smelter facility in India',
    sections: {
      whatIs: `Aluminium Ingots are cast blocks of aluminium produced either from primary smelting of bauxite ore or from secondary recycling of aluminium scrap. Primary aluminium ingots are produced through the Hall-Héroult electrolytic smelting process, where alumina (extracted from bauxite) is dissolved in molten cryolite and reduced to metallic aluminium. The molten aluminium is then cast into standardized ingot forms. India produces approximately 4 million MT of primary aluminium annually, with Hindalco (Aditya Birla Group), Vedanta (BALCO/Jharsuguda), and NALCO being the major smelters. Secondary aluminium from scrap recycling contributes an additional 1.5+ million MT, processed by thousands of small and medium recyclers. Ingots are classified by purity (primary: 99.5%–99.9%) or alloy composition (secondary: ADC12, LM6, LM24, etc.) depending on end-use application.`,

      grades: `Aluminium Ingots are classified by purity and alloy designation:

**P1020 (99.7% Al)** — Standard primary aluminium ingot grade traded globally. Reference grade for LME pricing. Used as base metal for alloy manufacturing, rolling, and extrusion.

**EC Grade (99.5% Al)** — Electrical Conductor grade for manufacturing aluminium wire rods and conductors. Lower iron and silicon content for optimized conductivity.

**ADC12 (A383)** — The most widely used die casting alloy in India. Contains 10.5–13% silicon, 1.5–3.5% copper. Excellent castability and mechanical properties for automotive and electrical components.

**LM6 (A413)** — High-silicon casting alloy (11–13% Si) with excellent fluidity and corrosion resistance. Used for marine fittings, food processing equipment, and architectural castings.

**LM24 (A380)** — General-purpose die casting alloy with good combination of mechanical properties and castability. Second most popular die casting alloy after ADC12.

**LM25 (A356)** — Premium gravity/low-pressure casting alloy for automotive wheels, aerospace components, and structural castings requiring higher mechanical properties.`,

      specifications: `Standard aluminium ingot specifications:

**Primary Ingots:** Typically 22.5 kg standard weight, bundled in 1 MT packs on pallets. Chemical composition certified per IS 617 or equivalent international standards.
**Secondary Alloy Ingots:** 5–7 kg notch bar ingots or 15–20 kg slab ingots. Composition certified per IS 617, ASTM B179, or JIS H5302.
**Purity Levels:** Primary ingots: 99.50% to 99.97% aluminium minimum. Key impurity limits: Fe max 0.20%, Si max 0.10% for P1020 grade.
**Physical Properties:** Density 2.7 g/cm³, melting point 660°C, electrical conductivity 62% IACS (for EC grade).
**Packaging:** Strapped bundles of 1 MT on wooden or steel pallets, each ingot stamped with grade, heat number, and producer mark.`,

      applications: `Aluminium ingots feed diverse Indian industries:

**Automotive:** Die cast components (engine blocks, transmission housings, wheel hubs) consume over 40% of secondary aluminium ingots. India's automotive aluminium consumption is growing at 8% annually with increasing EV adoption.

**Electrical:** Wire rods, busbars, transformer windings, and cable conductors consume EC-grade primary ingots. India is one of the world's largest markets for aluminium electrical conductors.

**Construction:** Extruded profiles for windows, curtain walls, and structural sections consume significant primary ingot volumes. Green building mandates are driving aluminium adoption.

**Packaging:** Foil stock and can stock rolled from primary ingots for food packaging, pharmaceutical packaging, and beverage cans.

**Consumer Durables:** Cookware, utensils, and home appliance components use secondary alloy ingots.

**Infrastructure:** Power transmission conductors (ACSR, AAAC) for India's growing electricity grid consume large volumes of EC-grade aluminium.`,

      marketTrends: `India's aluminium ingot market reflects global and domestic dynamics:

**Primary Aluminium Pricing:** Ingot prices track LME aluminium prices (currently $2,200–$2,600/MT) plus Indian premiums of $50–$150/MT. Domestic prices include customs duty and GST.

**Secondary Aluminium Growth:** Scrap-based secondary aluminium production is growing rapidly as automobile scrapping policy creates domestic scrap supply, reducing dependence on imported scrap.

**EV Impact:** Electric vehicle manufacturing is creating new demand for high-purity casting alloys and extruded structural components, driving grade diversification.

**Energy Cost Factor:** Aluminium smelting is highly energy-intensive (14,000–16,000 kWh/MT). Indian smelters with captive coal-based power (Vedanta, Hindalco) have cost advantages over smelters dependent on grid power.

**Export Potential:** India exports approximately 1.5 MT of primary aluminium annually, primarily to Southeast Asia, the Middle East, and East Africa. Value-added exports (alloy ingots, wire rods) are growing.`,

      procurementChallenges: `Aluminium ingot procurement challenges:

**Quality Verification:** Secondary alloy ingot quality varies significantly between recyclers. Chemical composition consistency is critical for die casting applications — out-of-spec alloys cause casting defects.

**LME Price Volatility:** Aluminium prices can move ₹5,000–₹15,000/MT in a single month, creating significant procurement cost uncertainty. Forward contracting and hedging are important risk management tools.

**Supply Concentration:** Primary aluminium production is concentrated among three producers (Hindalco, Vedanta, NALCO), limiting competitive sourcing options for large buyers.

**Import Dependency:** India imports approximately 2 MT of aluminium annually despite domestic surplus, due to specific grade requirements not produced locally (high-purity, specialty alloys).

**Payment Terms:** Primary producers typically offer 7–15 day credit terms. Secondary recyclers often require advance payment, creating working capital challenges for smaller foundries.

**Logistics:** Aluminium ingots are heavy (density 2.7 g/cm³) but relatively compact, allowing efficient truck loading (20–22 MT per trailer). Rail freight from eastern India smelters to western/southern consuming centers adds significant logistics cost.`,

      pricingFactors: `Aluminium ingot pricing is influenced by:

**LME Benchmark:** Global aluminium prices on the London Metal Exchange are the primary reference. Indian domestic prices = LME + premium + customs duty + GST.

**Premium over LME:** India premium ranges from $50–$150/MT depending on demand-supply balance and import parity.

**Alloy Premium:** Specialized alloys (LM25, ADC12) command ₹5,000–₹15,000/MT premium over standard primary P1020 grade due to alloying additions and quality control.

**Primary vs. Secondary:** Secondary alloy ingots trade at significant discounts (₹15,000–₹30,000/MT) to primary ingots but with higher quality variability.

**Purity Premium:** Higher purity (99.85%+) commands ₹3,000–₹8,000/MT premium over standard 99.7% grade.

**Quantity Discounts:** Annual contracts with 50+ MT/month commitment achieve ₹2,000–₹5,000/MT better pricing than spot purchases.`
    },
    faqs: [
      { question: 'What is the current aluminium ingot price in India?', answer: 'Primary aluminium ingot (P1020, 99.7%) prices in India currently range from ₹205,000–₹230,000 per MT including GST. Secondary alloy ingots (ADC12) trade at ₹170,000–₹195,000 per MT. Prices track LME aluminium benchmarks plus Indian premiums. ProcureSaathi provides competitive quotes from verified smelters and recyclers.' },
      { question: 'What is ADC12 aluminium alloy?', answer: 'ADC12 (equivalent to ASTM A383/A384) is the most popular die casting aluminium alloy used in India. It contains 10.5–13% silicon and 1.5–3.5% copper, providing excellent castability, good mechanical strength, and dimensional stability. ADC12 is used extensively for automotive components (engine parts, housings), electrical fittings, and industrial castings.' },
      { question: 'What is the difference between primary and secondary aluminium ingots?', answer: 'Primary aluminium is produced by smelting bauxite ore through electrolysis — high purity (99.5%+), consistent quality, higher price. Secondary aluminium is produced by recycling aluminium scrap — available as alloy ingots (ADC12, LM6), 20–30% cheaper, but quality varies with scrap quality and recycler capability. Both serve different market segments.' },
      { question: 'Which companies produce aluminium ingots in India?', answer: 'Primary producers: Hindalco (Aditya Birla Group) — Renukoot, Hirakud, Mahan; Vedanta — BALCO (Korba), Jharsuguda; NALCO — Angul. These three produce 4+ MTPA. Secondary recyclers: thousands of small and medium units in Jamnagar, Faridabad, Haridwar, and other clusters producing alloy ingots from scrap.' },
      { question: 'What purity of aluminium ingots is available?', answer: 'Primary ingots are available in 99.50%, 99.70% (P1020 standard), 99.85%, and 99.97% purity levels. EC (Electrical Conductor) grade has specific purity requirements optimized for conductivity rather than absolute aluminium content. Secondary alloy ingots are classified by alloy designation (ADC12, LM6, etc.) rather than purity.' },
      { question: 'What is the weight of one aluminium ingot?', answer: 'Standard primary aluminium ingots weigh approximately 22.5 kg each, bundled in stacks of approximately 1 MT on pallets. Secondary alloy ingots come in varied formats: notch bar (5–7 kg), slab (15–20 kg), or T-bar (10–15 kg). Weight per MT: approximately 44 primary ingots or 50–200 secondary ingots depending on size.' },
      { question: 'Is aluminium ingot price linked to LME?', answer: 'Yes, domestic aluminium ingot prices closely track London Metal Exchange (LME) aluminium prices. Indian domestic price = LME cash settlement + regional premium ($50–$150/MT) + customs duty (7.5%–10%) + GST (18%). LME price movements are reflected in Indian prices with a 1–3 day lag for spot transactions and monthly average for contract pricing.' },
      { question: 'What are the applications of aluminium ingots?', answer: 'Major applications include: automotive die casting (engine blocks, transmission housings), electrical conductors (ACSR, busbars), extruded profiles (window frames, structural sections), rolled products (foil, sheets), utensils and cookware, and packaging (foil, cans). India consumes approximately 5.5 MT of aluminium annually across these applications.' }
    ],
    demandIntelligence: {
      intentScore: 74,
      confidencePercent: 80,
      recentRFQs: 16,
      avgDealSize: '₹42.5 Lakhs',
      corridors: ['India Domestic', 'India → UAE', 'India → Malaysia']
    },
    relatedProducts: ['ms-plates-india', 'cr-coil-india'],
    hsnCodes: ['7601', '7602'],
    standards: ['IS 617', 'ASTM B179', 'JIS H5302', 'EN 1706'],
    isActivated: true
  },

  {
    slug: 'bitumen-vg30-india',
    name: 'Bitumen VG30',
    country: 'India',
    countryCode: 'IN',
    industry: 'Industrial Supplies',
    industrySlug: 'industrial-supplies',
    subIndustry: 'Construction Materials',
    subIndustrySlug: 'construction-materials',
    h1: 'Buy Bitumen VG30 in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy Bitumen VG30 in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source Bitumen VG30 (IS 73:2013) from AI-verified Indian refineries and distributors. For road construction, waterproofing, and asphalt plants. Bulk and drummed supply.',
    introText: 'Bitumen VG30 is the most widely consumed viscosity grade bitumen in India, primarily used for road construction and maintenance under the National Highway Authority (NHAI) and state PWD specifications. ProcureSaathi connects road contractors and asphalt plants with verified refinery-direct and authorized distributor supply through AI-driven procurement.',
    heroImage: '/images/products/bitumen-vg30.webp',
    heroImageAlt: 'Bitumen VG30 being poured at an asphalt mixing plant for road construction in India',
    sections: {
      whatIs: `Bitumen VG30 is a viscosity-graded petroleum bitumen produced by the vacuum distillation of crude oil. It is classified under the IS 73:2013 standard, which replaced the older penetration-based grading system. VG30 indicates a minimum absolute viscosity of 2400 Poises at 60°C, making it suitable for most Indian climatic conditions and traffic loads. India consumes approximately 8 million MT of bitumen annually, with VG30 accounting for over 60% of total consumption. Major producers include Indian Oil Corporation (IOCL), Bharat Petroleum (BPCL), Hindustan Petroleum (HPCL), Mangalore Refinery (MRPL), and Chennai Petroleum (CPCL). Private sector bitumen producers include Reliance Industries and Nayara Energy. Bitumen is a critical infrastructure material, with over 80% consumed in road construction — national highways, state highways, and rural roads under the PMGSY (Pradhan Mantri Gram Sadak Yojana) program.`,

      grades: `Bitumen in India is classified by viscosity grades per IS 73:2013:

**VG10** — Softest grade (min viscosity 800 Poises at 60°C). Used for spraying applications, surface dressing, and in cold climates. Also used as base bitumen for modified bitumen production.

**VG30** — Standard paving grade (min viscosity 2400 Poises at 60°C). The most widely used grade for road construction in plain and moderate-temperature regions. Default specification for NHAI and most state PWD projects.

**VG40** — Stiffer grade (min viscosity 3200 Poises at 60°C). Used for high-stress intersections, heavy traffic roads, and hot climatic zones where rutting resistance is critical.

**Modified Bitumen (CRMB, PMB)** — VG30 modified with crumb rubber (CRMB-55, CRMB-60) or polymers (PMB-40, PMB-70) for enhanced performance. Mandatory for national highways and expressways.

**Emulsion Grades:** Bitumen emulsions (RS, MS, SS grades) for tack coats, prime coats, and cold-mix applications. Manufactured by emulsifying VG10/VG30 with water and emulsifying agents.`,

      specifications: `VG30 Bitumen specifications per IS 73:2013:

**Absolute Viscosity at 60°C:** Min 2400 Poises
**Kinematic Viscosity at 135°C:** Min 350 cSt
**Penetration at 25°C:** 50–70 dmm
**Softening Point (R&B):** Min 47°C
**Flash Point (Cleveland Open Cup):** Min 220°C
**Ductility at 25°C:** Min 40 cm
**Solubility in Trichloroethylene:** Min 99%
**Specific Gravity:** 1.00–1.06

**Packaging:** Bulk (heated tanker trucks, 15–24 MT capacity), drums (200 kg or 180 kg net weight, per IS 1554), bulk bitumen storage terminals.

**Storage Temperature:** 140°C–170°C for pumping and application. Must not be overheated above 180°C to prevent oxidative degradation.`,

      applications: `Bitumen VG30 serves critical infrastructure applications:

**National Highways:** Dense Bituminous Macadam (DBM) and Bituminous Concrete (BC) wearing courses for NH construction under NHAI specifications (MoRTH Section 500).

**State Highways & Urban Roads:** Surface dressing, premix carpeting, and hot-mix asphalt for state PWD and municipal corporation road projects.

**Airport Runways:** Modified VG30 (PMB/CRMB) for runway surfacing at Indian airports per DGCA specifications.

**Waterproofing:** Building terraces, basements, foundations, and water tanks using blown-grade bitumen derived from VG30.

**Industrial Applications:** Pipe coating, roofing felts, mastic compounds, and joint fillers.

**Rural Roads:** PMGSY (rural road program) consumes significant VG30 for connecting remote habitations with all-weather roads.`,

      marketTrends: `India's bitumen market is shaped by infrastructure spending:

**Road Construction Push:** India is building 30+ km of national highways daily, creating sustained bitumen demand. The Bharatmala program targets 65,000 km of highway construction.

**Modified Bitumen Mandate:** NHAI mandates use of CRMB/PMB for wearing courses on all new national highways, pushing demand toward modified grades over plain VG30.

**Price Volatility:** Bitumen prices are linked to global crude oil prices and domestic refinery economics. Prices can swing ₹3,000–₹8,000/MT within a quarter.

**Supply Constraints:** Seasonal demand peaks during October–May road construction season can create supply shortages in certain regions, particularly eastern and northeastern India.

**Warm Mix Adoption:** Warm Mix Asphalt (WMA) technology is being adopted to reduce bitumen heating temperature, improving worker safety and reducing carbon footprint.`,

      procurementChallenges: `Bitumen procurement challenges:

**Seasonal Demand Spikes:** The October–May construction season creates demand concentration, leading to supply bottlenecks, tanker shortages, and price spikes.

**Quality Concerns:** Adulteration of bitumen with lower-grade products (furnace oil, flux oil) is a persistent quality issue. Viscosity testing at receipt is essential.

**Storage Requirements:** Bitumen must be stored at 140°C–170°C in insulated heated tanks, requiring specialized infrastructure that smaller contractors may lack.

**Transport Logistics:** Heated tanker truck availability is limited and transport costs are significant (₹1,500–₹4,000/MT depending on distance from refinery).

**Payment Terms:** Oil company refineries typically offer 7–15 day credit through authorized distributors. Direct refinery purchases may require LC-backed orders.

**Specification Compliance:** NHAI and state PWDs increasingly require source-specific approval and laboratory test reports for each bitumen consignment.`,

      pricingFactors: `Bitumen VG30 pricing depends on:

**Crude Oil Prices:** Bitumen is a residual product of crude distillation. International crude prices (Brent/WTI) are the primary cost driver.

**Refinery Economics:** Bitumen production competes with fuel oil and other residual products for bottom-of-the-barrel refinery output. Refinery decisions on product slate influence bitumen availability and pricing.

**Regional Variation:** Prices vary by ₹2,000–₹5,000/MT across India based on proximity to refinery and local demand-supply balance.

**Packaging:** Bulk bitumen (tanker) is ₹2,000–₹4,000/MT cheaper than drummed bitumen due to drumming, handling, and inventory costs.

**Seasonal Factor:** Peak season (October–March) prices are ₹2,000–₹5,000/MT higher than off-season due to demand concentration.

**Oil Company Pricing:** IOCL, BPCL, HPCL publish monthly bitumen price circulars that serve as reference prices for the market.`
    },
    faqs: [
      { question: 'What is the current Bitumen VG30 price in India?', answer: 'Bitumen VG30 prices in India currently range from ₹38,000–₹48,000 per MT (bulk tanker delivery) depending on location and oil company. Drummed bitumen costs ₹2,000–₹4,000/MT more. Prices are published monthly by IOCL/BPCL/HPCL. ProcureSaathi provides competitive multi-source pricing through its procurement platform.' },
      { question: 'What is the difference between VG30 and VG40 bitumen?', answer: 'VG30 (viscosity min 2400 Poises) is the standard paving grade for normal traffic and climatic conditions. VG40 (viscosity min 3200 Poises) is stiffer, used for heavy traffic intersections, high-temperature zones, and expressways where rutting resistance is critical. VG40 costs ₹1,000–₹3,000/MT more than VG30 and is less commonly available.' },
      { question: 'What is IS 73:2013 for bitumen?', answer: 'IS 73:2013 is the Bureau of Indian Standards specification for Paving Bitumen. It replaced the older penetration-grading (60/70, 80/100) system with viscosity grading (VG10, VG30, VG40). The standard specifies physical properties including viscosity, penetration, softening point, ductility, and flash point that bitumen must meet for road construction applications.' },
      { question: 'How much bitumen is needed per km of road?', answer: 'Bitumen consumption per km varies by road width, layer thickness, and mix design. Approximate consumption for a 7m wide 2-lane road: Tack coat = 0.3 MT/km, DBM (50mm) = 15–18 MT/km, BC (40mm) = 12–15 MT/km. Total approximately 28–33 MT/km for a complete overlay. New construction with all layers may require 40–60 MT/km.' },
      { question: 'What is CRMB bitumen?', answer: 'CRMB (Crumb Rubber Modified Bitumen) is VG30 bitumen modified by adding 15–20% crumb rubber from recycled tires. Available in CRMB-55 and CRMB-60 grades per IS 15462. CRMB improves rutting resistance, fatigue life, and crack resistance. Mandatory for wearing courses on NHAI projects. CRMB costs ₹8,000–₹15,000/MT more than plain VG30.' },
      { question: 'Which oil companies supply bitumen in India?', answer: 'Major bitumen suppliers: Indian Oil Corporation (IOCL) — largest supplier from Haldia, Mathura, Panipat refineries; Bharat Petroleum (BPCL) — from Mumbai and Kochi refineries; Hindustan Petroleum (HPCL) — from Mumbai and Vizag refineries; MRPL, CPCL, Reliance Industries, and Nayara Energy also produce bitumen.' },
      { question: 'How is bitumen stored at site?', answer: 'Bitumen must be stored in insulated, heated steel tanks at 140°C–170°C. Tank heating is done through thermal oil coils, hot oil jacketing, or direct fire tubes. Tank capacity ranges from 10 MT to 500 MT depending on project size. Drummed bitumen (200 kg drums) is stored at ambient temperature but must be heated before use. Proper storage prevents bitumen degradation and ensures workability.' },
      { question: 'What is the GST rate on bitumen?', answer: 'Bitumen attracts 18% GST in India under HSN code 2713. Bitumen emulsions also attract 18% GST. Modified bitumen (CRMB, PMB) is classified under the same HSN code. Input tax credit is available for contractors registered under GST, effectively making it a pass-through cost for organized road construction companies.' }
    ],
    demandIntelligence: {
      intentScore: 71,
      confidencePercent: 78,
      recentRFQs: 14,
      avgDealSize: '₹15.3 Lakhs',
      corridors: ['India Domestic']
    },
    relatedProducts: ['ms-plates-india', 'structural-steel-india'],
    hsnCodes: ['2713'],
    standards: ['IS 73:2013', 'IS 15462', 'ASTM D3381', 'MoRTH Section 500'],
    isActivated: true
  },

  {
    slug: 'hdpe-granules-india',
    name: 'HDPE Granules',
    country: 'India',
    countryCode: 'IN',
    industry: 'Polymers',
    industrySlug: 'polymers',
    subIndustry: 'Resins',
    subIndustrySlug: 'resins',
    h1: 'Buy HDPE Granules in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy HDPE Granules in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source HDPE Granules (High Density Polyethylene) from AI-verified Indian producers. Blow molding, pipe, film, and injection grades. Live pricing and managed procurement.',
    introText: 'HDPE (High Density Polyethylene) Granules are among the most widely consumed polymer resins in India, serving packaging, pipe manufacturing, blow molding, and film applications. ProcureSaathi connects plastic processors and manufacturers with verified HDPE producers and authorized distributors through AI-matched procurement.',
    heroImage: '/images/products/hdpe-granules.webp',
    heroImageAlt: 'HDPE polyethylene granules being processed at an Indian polymer manufacturing plant',
    sections: {
      whatIs: `High Density Polyethylene (HDPE) is a thermoplastic polymer produced by the polymerization of ethylene monomer using Ziegler-Natta or metallocene catalysts. HDPE has a density range of 0.941–0.965 g/cm³, distinguishing it from LDPE (Low Density) and LLDPE (Linear Low Density) polyethylene variants. The linear molecular structure with minimal branching gives HDPE its characteristic high crystallinity, stiffness, and tensile strength. India produces approximately 2 million MT of HDPE annually, with major producers including Reliance Industries (Jamnagar), Indian Oil Corporation (Panipat), GAIL (Pata), OPAL (Dahej), and Haldia Petrochemicals. HDPE granules are sold in 25 kg bags or 1 MT jumbo bags, with grade-specific formulations for different processing methods and end applications.`,

      grades: `HDPE grades are classified by application and processing method:

**Blow Molding Grades (BM):** Designed for producing bottles, jerry cans, drums, and containers. Typical MFI: 0.3–1.0 g/10min. Examples: HDPE B54, HDPE BM46.

**Pipe Grades (PE80, PE100):** For water supply, gas distribution, and sewerage pipe manufacturing. PE100 has minimum 10 MPa stress rating for 50-year design life. Examples: HDPE P60, PE100 compound grades.

**Film Grades:** For carry bags, liner films, and agricultural mulch films. MFI: 0.3–0.8 g/10min with controlled die swell. These grades are increasingly restricted for single-use applications per CPCB guidelines.

**Injection Molding Grades (IM):** For crates, furniture, household items, and industrial components. Higher MFI (4–30 g/10min) for easy mold filling.

**Raffia Grades:** For woven sack production (cement bags, fertilizer bags, FIBC). MFI: 3–8 g/10min with good drawability.

**Wire & Cable Grades:** Insulation and jacketing for power cables. Specific requirements for dielectric properties and long-term thermal stability.`,

      specifications: `Standard HDPE Granule properties:

**Density:** 0.941–0.965 g/cm³
**Melt Flow Index (MFI):** 0.04–30 g/10min (varies by grade and application)
**Tensile Strength:** 20–37 MPa
**Flexural Modulus:** 800–1500 MPa
**ESCR (Environmental Stress Crack Resistance):** >1000 hours (for pipe grades)
**Vicat Softening Point:** 125–135°C
**Shore Hardness:** 60–70 (D scale)

**Packaging:** 25 kg bags (standard), 500 kg or 1000 kg jumbo bags (bulk), railcar/silobulker for large-volume deliveries.
**Color:** Natural (translucent white), black (carbon black masterbatch compounded), or custom colored.

Indian HDPE producers publish detailed technical data sheets for each grade with processing parameters, mechanical properties, and application guidelines.`,

      applications: `HDPE Granules serve diverse Indian industries:

**Water Infrastructure:** PE80 and PE100 pipes for drinking water supply, sewerage, and irrigation. Jal Jeevan Mission and AMRUT are driving massive HDPE pipe demand.

**Packaging:** Bottles, jerry cans, drums (blow molding); woven sacks for cement, fertilizer, and food grains (raffia); carry bags and liners (film extrusion).

**Industrial Containers:** Chemical drums (200L), IBCs (Intermediate Bulk Containers), and process tanks utilizing HDPE's chemical resistance.

**Agriculture:** Drip irrigation systems, greenhouse films, mulch films, and water storage tanks.

**Gas Distribution:** PE100 pipes for city gas distribution (CGD) networks expanding rapidly across India under PNGRB authorization.

**Consumer Products:** Household items, furniture, toys, and storage containers manufactured through injection molding.`,

      marketTrends: `India's HDPE market reflects petrochemical industry dynamics:

**Capacity Expansion:** New HDPE capacity from HPCL-Mittal (Barmer), IOCL (Paradip), and capacity expansions at existing sites are increasing domestic supply and reducing import dependence.

**Sustainability Pressure:** Extended Producer Responsibility (EPR) regulations and single-use plastic bans are reshaping HDPE application patterns, favoring recyclable and multi-use applications.

**PE100 Growth:** Premium PE100 pipe grade demand is growing at 12%+ annually driven by water infrastructure and gas distribution expansion.

**Import Parity:** Indian HDPE prices track Southeast Asian and Middle Eastern benchmarks. Import competition from Saudi Arabia (SABIC), UAE (Borouge), and Singapore keeps domestic pricing competitive.

**Recycled HDPE:** Demand for recycled HDPE (rHDPE) is growing as brand owners commit to recycled content targets, creating a parallel market for post-consumer and post-industrial HDPE scrap.`,

      procurementChallenges: `HDPE granule procurement challenges:

**Grade Selection:** Over 50 HDPE grades are available from Indian producers, each optimized for specific applications. Incorrect grade selection leads to processing issues and product failure.

**Supply Allocation:** During tight market conditions, petrochemical producers allocate supply to authorized distributors and large direct customers, limiting spot market availability.

**Price Volatility:** HDPE prices follow global polyethylene benchmarks (CFR SEA, FOB MEG) which can fluctuate by ₹5,000–₹15,000/MT within a month based on crude oil, naphtha, and ethylene prices.

**Quality Consistency:** Batch-to-batch variation in MFI, density, and additive levels can affect processing parameters. Consistent single-source supply is preferred for critical applications.

**Minimum Order Quantities:** Direct producer orders typically require 10–20 MT minimum per grade. Smaller quantities require distributor sourcing at ₹2,000–₹5,000/MT premium.

**Inventory Management:** HDPE has indefinite shelf life but requires proper storage to prevent contamination, moisture absorption, and UV degradation of packaging.`,

      pricingFactors: `HDPE Granule pricing factors:

**Crude Oil / Naphtha Prices:** HDPE production cost is fundamentally linked to petrochemical feedstock costs. Naphtha-based production (most Indian producers) tracks naphtha prices closely.

**International Benchmarks:** CFR South East Asia and FOB Middle East HDPE prices serve as reference for Indian domestic pricing.

**Grade Premium:** Specialty grades (PE100, wire & cable, automotive) command ₹5,000–₹15,000/MT premium over commodity blow molding grades.

**Producer vs. Distributor:** Direct producer pricing is ₹2,000–₹5,000/MT lower than authorized distributor pricing.

**Volume Commitment:** Annual contracts with committed monthly volumes achieve ₹1,500–₹3,000/MT better pricing than spot purchases.

**Import Competition:** Competitive import offers from Saudi Arabia and UAE cap domestic pricing at import parity levels.`
    },
    faqs: [
      { question: 'What is HDPE granule price in India today?', answer: 'HDPE granule prices in India currently range from ₹105,000–₹130,000 per MT depending on grade and application. Blow molding grades trade at the lower end, while PE100 pipe grades and specialty injection grades command higher prices. Prices track global polyethylene benchmarks. ProcureSaathi provides competitive multi-source pricing through AI-matched procurement.' },
      { question: 'What is the difference between HDPE, LDPE, and LLDPE?', answer: 'HDPE (density 0.941–0.965) is rigid with high strength, used for pipes, bottles, and crates. LDPE (density 0.910–0.940) is flexible with good clarity, used for squeeze bottles and flexible packaging. LLDPE (density 0.915–0.940) has superior tear and puncture resistance, used for stretch films and heavy-duty bags. The density and branching structure determine properties and applications.' },
      { question: 'Which companies produce HDPE in India?', answer: 'Major Indian HDPE producers: Reliance Industries (Jamnagar — largest), Indian Oil Corporation (Panipat), GAIL India (Pata), OPAL — ONGC Petro (Dahej), Haldia Petrochemicals. Combined capacity exceeds 3.5 MTPA. New capacity from HPCL-Mittal and IOCL Paradip will add 1+ MTPA. Reliance alone produces over 1.5 MTPA of HDPE.' },
      { question: 'What is PE100 HDPE grade?', answer: 'PE100 is a high-performance HDPE pipe grade with a Minimum Required Strength (MRS) of 10 MPa at 20°C for a 50-year design life. It allows thinner pipe walls compared to PE80 (MRS 8 MPa) for the same pressure rating, reducing material cost and installation effort. PE100 is the standard specification for new water supply and gas distribution pipe systems in India.' },
      { question: 'What is MFI of HDPE?', answer: 'Melt Flow Index (MFI) of HDPE varies by grade: Blow molding grades: 0.3–1.0 g/10min; Pipe grades: 0.2–0.4 g/10min; Film grades: 0.3–0.8 g/10min; Injection grades: 4–30 g/10min; Raffia grades: 3–8 g/10min. Lower MFI indicates higher molecular weight, better mechanical properties but harder processing. MFI is measured at 190°C/2.16 kg per ASTM D1238.' },
      { question: 'Can HDPE be recycled?', answer: 'Yes, HDPE (Resin Identification Code #2) is one of the most recyclable plastics. Post-consumer HDPE (milk bottles, detergent containers, pipes) can be mechanically recycled into granules for manufacturing lumber, drainage pipes, non-food containers, and industrial products. Recycled HDPE (rHDPE) trades at 30–50% discount to virgin grades. India\'s EPR framework mandates HDPE recycling by brand owners.' },
      { question: 'What is HDPE used for in India?', answer: 'Major applications: water supply and gas pipes (30%), packaging — bottles, jerry cans, drums (25%), woven sacks for cement and fertilizer (15%), film and bags (10%), injection molded products — crates, furniture, components (10%), and other applications including wire and cable, automotive, and industrial (10%). Infrastructure spending is driving the fastest growth in pipe-grade consumption.' },
      { question: 'What is the HSN code for HDPE granules?', answer: 'HDPE granules in India are classified under HSN code 3901 (Polymers of ethylene, in primary forms). Specific sub-codes: 39012000 for HDPE with specific gravity ≥0.94. GST rate is 18%. Custom duty on HDPE imports is 7.5% basic plus applicable surcharges. ISI mark is not mandatory for HDPE granules but is required for finished pipes and containers.' }
    ],
    demandIntelligence: {
      intentScore: 72,
      confidencePercent: 79,
      recentRFQs: 18,
      avgDealSize: '₹32.1 Lakhs',
      corridors: ['India Domestic', 'India → Bangladesh', 'India → East Africa']
    },
    relatedProducts: ['gi-pipes-india', 'industrial-valves-india'],
    hsnCodes: ['3901'],
    standards: ['IS 4984', 'IS 14151', 'ISO 4427', 'ASTM D3350'],
    isActivated: true
  },

  {
    slug: 'industrial-valves-india',
    name: 'Industrial Valves',
    country: 'India',
    countryCode: 'IN',
    industry: 'Industrial Supplies',
    industrySlug: 'industrial-supplies',
    subIndustry: 'Pumps & Valves',
    subIndustrySlug: 'pumps-valves',
    h1: 'Buy Industrial Valves in India — AI Verified Suppliers & Live Pricing',
    metaTitle: 'Buy Industrial Valves in India — AI Verified Suppliers & Live Pricing | ProcureSaathi',
    metaDescription: 'Source Industrial Valves (gate, globe, check, ball, butterfly) from AI-verified Indian manufacturers. API, ASME, and IS certified. For oil & gas, water, and process industries.',
    introText: 'Industrial Valves are critical flow control devices used across every process industry — from oil refineries and power plants to water treatment and chemical processing. India is a major global valve manufacturing hub, exporting to over 100 countries. ProcureSaathi connects EPC contractors and plant operators with verified Indian valve manufacturers through AI-matched procurement.',
    heroImage: '/images/products/industrial-valves.webp',
    heroImageAlt: 'Industrial gate and ball valves manufactured in India for oil and gas applications',
    sections: {
      whatIs: `Industrial Valves are mechanical devices used to control, regulate, and direct the flow of fluids (liquids, gases, slurries) in piping systems. They are among the most critical components in any process plant, as valve failure can lead to safety hazards, production losses, and environmental incidents. India's valve manufacturing industry is concentrated in clusters at Ahmedabad, Mumbai, Chennai, and Coimbatore, with over 500 organized manufacturers and thousands of small workshops. Indian valve manufacturers produce the full range of valve types including gate valves, globe valves, check valves, ball valves, butterfly valves, plug valves, diaphragm valves, and control valves. The industry generates over $3 billion in annual revenue, with approximately 40% exported globally. Key end-user industries include oil & gas (30%), water and wastewater (25%), power generation (15%), chemical and petrochemical (15%), and others (15%).`,

      grades: `Valve material grades are classified by body, trim, and seal materials:

**Carbon Steel:** ASTM A216 WCB (cast), ASTM A105 (forged) — the most widely used material for general-purpose applications up to 425°C. Accounts for 50%+ of all industrial valves.

**Stainless Steel:** ASTM A351 CF8M (316 cast), ASTM A182 F316 (forged) — for corrosive services, food/pharma, and cryogenic applications.

**Alloy Steel:** ASTM A217 WC6/WC9/C5/C12 — for high-temperature services in power plants and refineries (up to 600°C+).

**Duplex/Super Duplex:** ASTM A995 grades — for offshore, desalination, and highly corrosive chemical applications.

**Cast Iron:** IS 210 FG260, ASTM A126 — for water supply, fire protection, and low-pressure applications. Most economical option.

**Bronze:** ASTM B62/B584 — for marine, potable water, and corrosion-resistant applications.

**Exotic Alloys:** Inconel, Monel, Hastelloy, Titanium — for severe-service applications in petrochemical, offshore, and nuclear industries.`,

      specifications: `Industrial valve specifications cover:

**Size Range:** DN15 (½") to DN1200 (48") and larger for custom applications
**Pressure Rating:** Class 150, 300, 600, 900, 1500, 2500 (ASME B16.34); PN10, PN16, PN25, PN40 (EN/IS standards)
**End Connection:** Flanged (RF, RTJ), butt-weld, socket-weld, threaded (NPT, BSP)
**Design Standards:** API 600 (gate), API 602 (forged gate/globe/check), API 608 (ball), API 609 (butterfly), BS 1414, IS 14846
**Testing:** API 598 (shell and seat test), ISO 5208 (leakage rates A through E)
**Face-to-Face Dimensions:** ASME B16.10 (flanged and butt-welding end)
**Flange Dimensions:** ASME B16.5 (pipe flanges), ASME B16.47 (large diameter)

Valve certification typically includes material test certificates (EN 10204 3.1), pressure test certificates, dimensional reports, and painting/coating specifications.`,

      applications: `Industrial valves serve every process industry:

**Oil & Gas:** Wellhead valves, pipeline valves, refinery process valves, LNG terminal valves. India's oil & gas sector is the largest valve consumer, driving demand for API-certified products.

**Water & Wastewater:** Sluice valves, butterfly valves, and check valves for water treatment plants, distribution networks, and sewage systems. Municipal water projects are a major growth driver.

**Power Generation:** Steam isolation valves, feedwater control valves, and cooling water valves for thermal, nuclear, and hydroelectric power stations.

**Chemical & Petrochemical:** Corrosion-resistant valves for acid, alkali, and solvent services. Material selection is critical for chemical compatibility.

**Pharmaceutical & Food:** Sanitary valves (diaphragm, butterfly) meeting FDA/3A standards for hygienic process applications.

**HVAC & Building Services:** Balancing valves, isolation valves, and control valves for heating, ventilation, and air conditioning systems.`,

      marketTrends: `India's industrial valve market reflects industrial growth:

**Export Hub:** India has emerged as a global valve manufacturing hub, with Ahmedabad cluster alone exporting over $1 billion in valves annually. Key export markets include the Middle East, Southeast Asia, Africa, and Europe.

**Automation Trend:** Manual valves are progressively being replaced by actuated valves (pneumatic, electric, hydraulic) for remote operation and process control. Actuated valve share is growing at 10%+ annually.

**Digital Valve Intelligence:** Smart valve positioners and diagnostic systems are being adopted in critical applications for predictive maintenance and performance monitoring.

**Local Content Requirements:** Oil & gas projects in India and export markets increasingly mandate local content percentages, benefiting Indian manufacturers.

**Consolidation:** Large Indian valve companies (Kirloskar, L&T Valves, KOSO India, Audco) are acquiring smaller manufacturers to expand product range and market reach.`,

      procurementChallenges: `Valve procurement involves specialized challenges:

**Technical Specification Complexity:** Valve specifications span material, design, testing, end connection, actuator, and accessory requirements. Incomplete or incorrect specifications lead to delivery of unsuitable products.

**Quality Assurance:** Critical-service valves require third-party inspection (TPI), material traceability, and extensive documentation. Quality issues in valves can have catastrophic safety consequences.

**Lead Time Variability:** Standard valves may be available ex-stock (2–4 weeks). Engineered valves require 12–24 weeks for manufacturing. Exotic material valves can extend to 32+ weeks.

**Multi-Source Coordination:** A typical plant project requires 20–100+ valve types across multiple sizes, pressures, and materials. Coordinating multiple valve suppliers for a single project is logistically complex.

**Price-Quality Trade-off:** Low-cost valve suppliers may compromise on material quality, testing rigor, or documentation completeness. Lifecycle cost analysis (including maintenance and failure risk) should guide procurement rather than initial purchase price alone.

**Spare Parts Availability:** Long-term spare parts support is critical for valve lifecycle management. Sourcing interchangeable parts for installed valves requires manufacturer cooperation or reverse engineering capability.`,

      pricingFactors: `Industrial valve pricing depends on:

**Material:** Carbon steel is the most economical; stainless steel adds 80–150% premium; duplex/super duplex adds 200–400% premium; exotic alloys can be 5–10x carbon steel cost.

**Size and Pressure:** Larger sizes and higher pressure ratings exponentially increase cost. A 24" Class 600 gate valve can cost 50x more than a 2" Class 150 equivalent.

**Valve Type:** Ball valves are typically most expensive per size/pressure, followed by globe, gate, and butterfly (most economical for larger sizes).

**Certification:** API-certified valves cost 20–40% more than non-API products. NACE MR0175 (sour service) compliance adds 10–20%. PED/CE marking for European markets adds 5–15%.

**Actuator:** Adding pneumatic actuator typically adds 50–80% to bare valve cost. Electric actuators can double the total cost.

**Quantity:** Project orders (100+ valves) receive 10–25% discount over individual valve procurement.`
    },
    faqs: [
      { question: 'What is the price range for industrial valves in India?', answer: 'Industrial valve prices in India range enormously based on type, size, material, and pressure rating. Small carbon steel gate valves (2" Class 150) start from ₹2,000–₹5,000. Large stainless steel ball valves (12" Class 600) can cost ₹5–₹15 lakhs. Project-level pricing with multiple valve types is best obtained through competitive bidding. ProcureSaathi provides multi-manufacturer quotes for complete valve packages.' },
      { question: 'What types of industrial valves are used in India?', answer: 'Common valve types: Gate valves (isolation), Globe valves (throttling/regulation), Check valves (backflow prevention), Ball valves (quick isolation), Butterfly valves (large-diameter throttling), Plug valves (multi-port), Diaphragm valves (slurry/corrosive), and Control valves (automatic regulation). Selection depends on application, media, pressure, temperature, and operational requirements.' },
      { question: 'Which Indian companies manufacture industrial valves?', answer: 'Major Indian valve manufacturers: Kirloskar Brothers (gate, globe, check), L&T Valves (critical service), Audco India (ball, plug), KOSO India (control valves), Advance Valves, Flowserve India, Emerson (Fisher), Neway Valve India, BDK Industrial Valves, and Microfinish Valves. Ahmedabad, Mumbai, Chennai, and Coimbatore are major manufacturing clusters.' },
      { question: 'What is API 600 standard for valves?', answer: 'API 600 is the American Petroleum Institute standard for bolted bonnet steel gate valves for petroleum and natural gas industries. It specifies design, material, dimensions, pressure-temperature ratings, testing, inspection, and marking requirements. API 600 certification is widely required for oil & gas project valves in India and export markets.' },
      { question: 'What valve material is best for water applications?', answer: 'For potable water: Cast iron (IS 210 FG260) or ductile iron for cost-effectiveness, bronze trim for corrosion resistance. For corrosive water/wastewater: Stainless steel 316 or rubber-lined cast iron. For seawater/desalination: Super duplex stainless steel or bronze. Material selection depends on water chemistry, pressure, temperature, and design life requirements.' },
      { question: 'What is the difference between gate valve and ball valve?', answer: 'Gate valves use a sliding gate to isolate flow — best for full-open/full-close service with minimal pressure drop. Ball valves use a rotating sphere with a bore — provide quick quarter-turn operation, better sealing, and are suitable for both isolation and some throttling. Ball valves are more compact but more expensive. Gate valves are preferred for large sizes; ball valves for smaller sizes and frequent operation.' },
      { question: 'What testing is required for industrial valves?', answer: 'Standard testing per API 598 / IS 13049: Shell test (hydrostatic at 1.5x rating pressure), Low-pressure seat test (air/water at 0.4–0.7 bar), High-pressure seat test (hydrostatic at 1.1x rating). Additional tests for critical service: Fugitive emission testing (ISO 15848), Fire-safe testing (API 607), Cryogenic testing (BS 6364). All test results are documented in valve test certificates.' },
      { question: 'How to select the right industrial valve?', answer: 'Valve selection requires specifying: (1) Media (liquid/gas/slurry), (2) Size (pipe diameter), (3) Pressure rating (ASME class or PN), (4) Temperature range, (5) Function (isolation/regulation/check), (6) Material compatibility, (7) End connection type, (8) Actuation (manual/pneumatic/electric), (9) Design standard (API/ASME/IS). ProcureSaathi\'s AI matching helps identify optimal valve solutions from verified manufacturers.' }
    ],
    demandIntelligence: {
      intentScore: 69,
      confidencePercent: 76,
      recentRFQs: 12,
      avgDealSize: '₹28.7 Lakhs',
      corridors: ['India Domestic', 'India → Saudi Arabia', 'India → UAE', 'India → Nigeria']
    },
    relatedProducts: ['gi-pipes-india', 'structural-steel-india', 'ms-plates-india'],
    hsnCodes: ['8481'],
    standards: ['API 600', 'API 602', 'API 608', 'API 609', 'IS 14846', 'ASME B16.34'],
    isActivated: true
  }
];

// ─── LOOKUP HELPERS ──────────────────────────────────────────────

export function getProductBySlug(slug: string): IndustrialProduct | undefined {
  return industrialProducts.find(p => p.slug === slug);
}

export function getProductsByIndustry(industrySlug: string): IndustrialProduct[] {
  return industrialProducts.filter(p => p.industrySlug === industrySlug);
}

export function getProductsBySubIndustry(subIndustrySlug: string): IndustrialProduct[] {
  return industrialProducts.filter(p => p.subIndustrySlug === subIndustrySlug);
}

export function getAllProductSlugs(): string[] {
  return industrialProducts.map(p => p.slug);
}

// ─── INDUSTRY TAXONOMY ──────────────────────────────────────────

export interface IndustryAuthoritySection {
  heading: string;
  content: string;
}

export interface IndustryNode {
  slug: string;
  name: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  h1?: string;
  authoritySections?: IndustryAuthoritySection[];
  children?: IndustryNode[];
  productSlugs?: string[];
}

export const industryTaxonomy: IndustryNode[] = [
  {
    slug: 'metals',
    name: 'Metals & Steel',
    h1: 'Metals & Steel Suppliers in India — AI-Powered Industrial Procurement',
    description: 'Comprehensive AI-powered procurement for ferrous and non-ferrous metals across India\'s industrial ecosystem.',
    metaTitle: 'Metals & Steel Procurement — AI Verified Suppliers | ProcureSaathi',
    metaDescription: 'Source metals and steel products from AI-verified Indian mills and manufacturers. Ferrous (steel, iron) and non-ferrous (aluminium, copper) with managed procurement.',
    authoritySections: [
      {
        heading: 'India\'s Metals & Steel Industry Overview',
        content: 'India is the world\'s second-largest crude steel producer, with annual output exceeding 140 million metric tonnes. The nation\'s metals and steel sector is a cornerstone of its economic and industrial infrastructure, supporting everything from large-scale construction and heavy engineering to automotive manufacturing and energy generation. The industry is anchored by integrated steel plants operated by SAIL, Tata Steel, JSW Steel, AMNS India, and JSPL, alongside hundreds of secondary producers, re-rollers, and alloy steel mills spread across key steel corridors in Jharkhand, Odisha, Chhattisgarh, Karnataka, and Gujarat.\n\nThe non-ferrous metals segment — aluminium, copper, zinc, lead, and nickel — complements the ferrous ecosystem. India ranks among the top global aluminium producers, led by Hindalco and Vedanta, while copper cathode production and zinc smelting serve the electrical, automotive, and construction industries. ProcureSaathi aggregates demand intelligence across the full spectrum of metals, enabling procurement teams to source from verified mills and processors with transparent, competitive pricing.'
      },
      {
        heading: 'Major Metal Products for B2B Procurement',
        content: 'The metals procurement landscape in India encompasses flat products (MS Plates, HR Coils, CR Coils, GI Sheets), long products (TMT Bars, structural steel sections, wire rods, channels, angles), tubular products (GI Pipes, ERW tubes, seamless pipes), and non-ferrous products (aluminium ingots, copper cathode, zinc ingots, brass rods).\n\nFlat steel products dominate industrial procurement volumes. MS Plates conforming to IS 2062 are the highest-demand item for construction and heavy fabrication. HR Coils serve automotive stamping, pipe manufacturing, and general engineering. CR Coils and GI sheets are essential for appliance manufacturing, roofing, and precision applications. On the long products side, TMT Bars (Fe 500/550D per IS 1786) represent the single largest steel consumption category in India\'s construction sector.\n\nProcureSaathi\'s managed procurement platform enables buyers to source any of these products through sealed competitive bidding, with AI-driven supplier matching, real-time pricing intelligence, and complete procurement governance.'
      },
      {
        heading: 'Applications Across Infrastructure & EPC',
        content: 'Metals and steel are consumed across virtually every infrastructure and industrial vertical in India. The National Infrastructure Pipeline (NIP) and PM Gati Shakti programme collectively target over ₹100 lakh crore in infrastructure investment, creating sustained demand for structural steel, reinforcement bars, pipes, and plates.\n\nKey application sectors include: highways and bridges (structural steel, TMT bars, MS plates), urban metro rail (HR coils, structural sections, GI pipes), water and sewage infrastructure (DI pipes, GI pipes, industrial valves), power generation and transmission (aluminium conductors, transformer steel, structural supports), oil & gas (seamless pipes, alloy steel plates, industrial valves), and commercial and residential construction (TMT bars, cement, GI sheets).\n\nProcureSaathi\'s demand intelligence engine continuously monitors procurement activity across these sectors, identifying high-intent corridors and matching buyers with the most capable and competitively priced suppliers.'
      },
      {
        heading: 'Indian Demand Trends & Market Intelligence',
        content: 'India\'s steel demand is projected to grow at 6-7% CAGR through 2030, driven by urbanisation, infrastructure spending, and the manufacturing sector\'s expansion under the Production-Linked Incentive (PLI) scheme. The government\'s target of 300 million MT steelmaking capacity by 2030 signals a structural shift in domestic supply capabilities.\n\nKey demand trends include: rising consumption of high-strength and specialty steels (SAILMA grades, alloy steels) for infrastructure projects; increasing adoption of value-added flat products (pre-painted, galvanized, galvalume) in construction; growing non-ferrous metal demand driven by electric vehicle manufacturing and renewable energy infrastructure; and consolidation of procurement through digital platforms that offer price transparency and supplier verification.\n\nProcureSaathi tracks these trends through its AI demand intelligence system, providing procurement teams with real-time market signals, price benchmarks, and supplier capability assessments to optimise sourcing decisions.'
      },
      {
        heading: 'Procurement Standards & Compliance',
        content: 'Industrial metal procurement in India is governed by Bureau of Indian Standards (BIS) specifications. Key standards include IS 2062 (structural steel), IS 1786 (TMT reinforcement bars), IS 10748 (HR steel sheets and strips), IS 513 (CR steel sheets), IS 277 (galvanized steel sheets), and IS 1239 (steel tubes). For international trade, ASTM, EN, and JIS standards are commonly referenced.\n\nCompliance with Quality Control Orders (QCOs) issued by the Ministry of Steel mandates BIS certification for a growing list of steel products, making it illegal to sell non-certified products in the Indian market. ProcureSaathi\'s supplier verification process validates BIS license status, mill test certificates (MTCs), and manufacturing capabilities as part of the onboarding and bid evaluation workflow.\n\nFor specialised applications — pressure vessels (IS 2002, SA 516), boiler quality plates (IS 2002), and offshore structures — additional certifications from Lloyd\'s, IRS, DNV, and Bureau Veritas may be required. ProcureSaathi\'s managed procurement model ensures all compliance requirements are met before procurement is finalised.'
      },
      {
        heading: 'Related Products in Metals & Steel',
        content: 'ProcureSaathi\'s metals and steel procurement covers the following products: [MS Plates](/demand/ms-plates-india) (IS 2062), [TMT Bars](/demand/tmt-bars-india) (IS 1786), [HR Coils](/demand/hr-coil-india) (IS 10748), [CR Coils](/demand/cr-coil-india) (IS 513), [Structural Steel](/demand/structural-steel-india) (IS 2062), [GI Pipes](/demand/gi-pipes-india) (IS 1239), and [Aluminium Ingots](/demand/aluminium-ingots-india). Each product has a dedicated procurement intelligence page with live demand signals, supplier verification, and managed bidding.'
      }
    ],
    children: [
      {
        slug: 'ferrous',
        name: 'Ferrous Metals (Steel & Iron)',
        h1: 'Ferrous Metal Suppliers in India — Steel & Iron Procurement',
        description: 'India is the world\'s second-largest steel producer with over 140 million MT annual output. Ferrous metals — encompassing flat products (plates, coils, sheets), long products (TMT bars, structural sections, wire rods), and tubular products (pipes, tubes) — form the backbone of India\'s infrastructure and manufacturing sectors.',
        metaTitle: 'Ferrous Metals (Steel & Iron) Procurement — AI Verified Suppliers | ProcureSaathi',
        metaDescription: 'Source steel and iron products from AI-verified Indian mills. MS Plates, TMT Bars, HR/CR Coils, Structural Steel, GI Pipes. Live pricing and managed procurement.',
        authoritySections: [
          {
            heading: 'What are Ferrous Metals?',
            content: 'Ferrous metals are iron-based metals and alloys that form the largest segment of industrial metal consumption globally. The term "ferrous" derives from the Latin word "ferrum" meaning iron. In industrial procurement, ferrous metals primarily encompass carbon steel (mild steel, medium carbon steel, high carbon steel), alloy steel (containing chromium, nickel, molybdenum, vanadium), stainless steel (chromium content ≥10.5%), and cast iron.\n\nCarbon steel — specifically mild steel with 0.05-0.25% carbon content — accounts for the vast majority of industrial steel consumption in India. It is the base material for structural steel sections, plates, coils, sheets, bars, rods, pipes, and tubes. The combination of strength, weldability, machinability, and cost-effectiveness makes mild steel the default engineering material for construction, infrastructure, manufacturing, and general fabrication.'
          },
          {
            heading: 'Major Ferrous Products for B2B Procurement',
            content: 'The ferrous metals procurement ecosystem in India is organized into three broad product categories:\n\n**Flat Products:** MS Plates (IS 2062) for structural fabrication and heavy engineering, HR Coils (IS 10748) for automotive and pipe manufacturing, CR Coils (IS 513) for appliances and precision applications, and GI/GP sheets (IS 277) for roofing and construction. Flat products are predominantly sourced from integrated steel plants and hot strip mills.\n\n**Long Products:** TMT Bars (IS 1786 Fe 500/550D) for reinforced concrete construction, structural steel sections (I-beams, H-beams, channels, angles per IS 2062), wire rods for downstream wire drawing and fastener manufacturing, and rails for railway infrastructure.\n\n**Tubular Products:** GI Pipes (IS 1239) for water supply and plumbing, ERW steel tubes for structural and automotive applications, seamless pipes for oil & gas and high-pressure systems, and spiral welded pipes for large-diameter water and gas transmission.\n\nProcureSaathi enables procurement of all these products through verified Indian mills including SAIL, Tata Steel, JSW Steel, AMNS India, Jindal Steel, and Shyam Steel, along with quality-certified secondary producers.'
          },
          {
            heading: 'Applications in Infrastructure & EPC',
            content: 'Ferrous metals are the structural backbone of India\'s infrastructure development. Key application sectors include:\n\n**Construction & Real Estate:** TMT bars for reinforced concrete (RCC) structures, MS plates for base plates and connection details, structural steel sections for steel-framed buildings and industrial sheds.\n\n**Highways & Bridges:** High-strength structural steel plates (E350/E450), TMT bars for bridge decks and abutments, crash barriers and guardrails from GI steel.\n\n**Railways & Metro:** Rail steel for tracks, structural steel for station buildings and viaducts, TMT bars for tunnel lining and station foundations.\n\n**Water Infrastructure:** GI pipes for municipal water supply, MS plates for water storage tanks, DI pipes for trunk mains.\n\n**Oil & Gas:** Alloy steel plates for pressure vessels, seamless pipes for drilling and production, carbon steel pipes for transmission pipelines.\n\n**Power & Energy:** Structural steel for thermal and solar power plants, boiler quality plates for steam generators, transmission tower steel.'
          },
          {
            heading: 'Indian Demand Trends',
            content: 'India\'s ferrous metals demand is structurally driven by urbanisation (35% to 50% urban population by 2047), infrastructure investment (₹111 lakh crore NIP), and manufacturing expansion under Atmanirbhar Bharat and PLI schemes.\n\nSteel consumption per capita in India stands at approximately 80 kg, compared to the global average of 230 kg and China\'s 600+ kg, indicating massive growth headroom. The government\'s National Steel Policy targets 300 million MT capacity and 160 kg per capita consumption by 2030.\n\nKey trends shaping procurement: increasing specification of higher-strength grades (E350, SAILMA) reducing material weight in structures; growing preference for value-added products (pre-engineered buildings, pre-fabricated steel structures); shift toward digital procurement platforms for price transparency; and rising demand for quality-certified products following BIS Quality Control Orders.'
          },
          {
            heading: 'Procurement & Compliance (IS Standards)',
            content: 'Ferrous metal procurement in India operates within a well-defined standards and compliance framework:\n\n**IS 2062:2011** — Hot Rolled Medium and High Tensile Structural Steel (plates, sections, bars). Grades E250, E300, E350, E410, E450.\n**IS 1786:2008** — High Strength Deformed Steel Bars and Wires for Concrete Reinforcement. Grades Fe 500, Fe 500D, Fe 550, Fe 550D, Fe 600.\n**IS 10748:2004** — Hot Rolled Steel Strip for Welded Tubes and Pipes.\n**IS 513:2008** — Cold Rolled Low Carbon Steel Sheets and Strips.\n**IS 1239** — Mild Steel Tubes, Tubulars and Other Wrought Steel Fittings.\n**IS 277** — Galvanized Steel Sheets (Plain and Corrugated).\n\nAll procurement through ProcureSaathi requires valid BIS certification (CM/L license), mill test certificates (MTCs) with chemical composition and mechanical properties, and compliance with applicable Quality Control Orders. Our AI verification system cross-references supplier certifications with BIS databases to ensure procurement integrity.'
          }
        ],
        productSlugs: ['ms-plates-india', 'tmt-bars-india', 'hr-coil-india', 'cr-coil-india', 'structural-steel-india', 'gi-pipes-india']
      },
      {
        slug: 'non-ferrous',
        name: 'Non-Ferrous Metals',
        h1: 'Non-Ferrous Metal Suppliers in India — Aluminium, Copper & Zinc',
        description: 'Non-ferrous metals including aluminium, copper, zinc, and their alloys serve automotive, electrical, construction, and aerospace industries. India is a major aluminium producer and a growing hub for non-ferrous metal processing and value addition.',
        metaTitle: 'Non-Ferrous Metals Procurement — AI Verified Suppliers | ProcureSaathi',
        metaDescription: 'Source aluminium, copper, zinc, and alloy products from AI-verified Indian smelters and processors. Ingots, sheets, coils, and rods with managed procurement.',
        authoritySections: [
          {
            heading: 'What are Non-Ferrous Metals?',
            content: 'Non-ferrous metals are metals and alloys that do not contain iron as a primary constituent. This category includes aluminium, copper, zinc, lead, nickel, tin, titanium, and their alloys (brass, bronze, monel, inconel). Non-ferrous metals are valued for properties that ferrous metals lack: corrosion resistance, lightweight characteristics, electrical and thermal conductivity, non-magnetic properties, and recyclability.\n\nIn India\'s industrial procurement landscape, aluminium is the dominant non-ferrous metal by volume, followed by copper and zinc. The country is among the top five global aluminium producers, with Hindalco Industries and Vedanta operating large-scale smelters. Copper consumption is driven by the electrical and electronics sectors, while zinc finds primary use in galvanizing (corrosion protection for steel).'
          },
          {
            heading: 'Key Non-Ferrous Products',
            content: '**Aluminium:** Primary aluminium ingots (99.7% purity per IS 617), billets for extrusion, wire rods for electrical conductors, rolled products (sheets, coils, foil), and cast alloys for automotive components. India produces approximately 4 million MT of primary aluminium annually.\n\n**Copper:** Copper cathode (99.99% purity, LME Grade A), copper wire rods for electrical wiring, copper tubes for HVAC and plumbing, and copper alloy products (brass, bronze). Hindustan Copper and Sterlite Copper are major domestic producers.\n\n**Zinc:** Zinc ingots for hot-dip galvanizing, zinc alloys for die-casting, and zinc oxide for rubber and ceramics. Hindustan Zinc (Vedanta) is India\'s largest zinc producer.\n\nProcureSaathi facilitates procurement of these products from smelter-direct and authorized stockist channels with verified quality certifications and competitive pricing through sealed bidding.'
          },
          {
            heading: 'Applications & Demand Drivers',
            content: 'Non-ferrous metals serve critical roles across high-value industrial sectors:\n\n**Electrical & Electronics:** Copper wire and cables for power transmission and distribution, aluminium conductors for overhead power lines, copper busbars for switchgear and transformers.\n\n**Automotive & EV:** Aluminium castings for engine blocks and wheels, copper for EV motors and wiring harnesses, zinc for die-cast components. India\'s EV transition is driving significant incremental demand for copper and aluminium.\n\n**Construction:** Aluminium extrusions for windows, doors, and curtain walls; copper tubes for plumbing and HVAC; zinc for galvanizing structural steel.\n\n**Aerospace & Defence:** Titanium and high-grade aluminium alloys for airframe structures, copper-beryllium alloys for precision instruments.\n\n**Packaging:** Aluminium foil and cans for food and pharmaceutical packaging — one of the fastest-growing demand segments in India.\n\nProcureSaathi\'s AI demand intelligence tracks procurement signals across these sectors, identifying high-intent corridors for non-ferrous sourcing.'
          },
          {
            heading: 'Standards & Quality Compliance',
            content: 'Non-ferrous metals procurement follows specific BIS and international standards:\n\n**Aluminium:** IS 617 (aluminium ingots), IS 737 (wrought aluminium alloy plates), IS 739 (aluminium alloy castings). LME-registered brands command premium pricing.\n\n**Copper:** IS 191 (copper cathode), IS 613 (copper rods), IS 1545 (copper tubes). Cathode quality is graded per LME standards.\n\n**Zinc:** IS 209 (zinc ingots), IS 3981 (zinc alloy die-casting). Purity levels (SHG 99.995%, HG 99.99%) determine pricing and application suitability.\n\nProcureSaathi verifies smelter origin, assay certificates, and BIS compliance for all non-ferrous procurement, ensuring buyers receive material that meets specified quality parameters.'
          }
        ],
        productSlugs: ['aluminium-ingots-india']
      }
    ]
  },
  {
    slug: 'polymers',
    name: 'Polymers & Resins',
    h1: 'Polymer & Resin Suppliers in India — HDPE, PP, PVC Procurement',
    description: 'AI-powered procurement for thermoplastic and thermoset polymers serving India\'s rapidly growing plastics processing industry.',
    metaTitle: 'Polymers & Resins Procurement — AI Verified Suppliers | ProcureSaathi',
    metaDescription: 'Source HDPE, LDPE, PP, PVC, and specialty polymers from AI-verified Indian petrochemical producers. Grade-specific procurement with live pricing.',
    authoritySections: [
      {
        heading: 'India\'s Polymer & Petrochemical Industry',
        content: 'India is the world\'s third-largest polymer consumer, with annual consumption exceeding 20 million metric tonnes of commodity thermoplastics. The polymer industry is driven by India\'s petrochemical majors — Reliance Industries, Indian Oil Corporation (IOCL), GAIL, Haldia Petrochemicals, ONGC Petro additions (OPaL), and Brahmaputra Cracker and Polymer Limited (BCPL). These producers operate naphtha and gas-based crackers that produce ethylene, propylene, and other monomers for downstream polymerisation.\n\nThe sector is experiencing rapid capacity expansion, with Reliance\'s Jamnagar complex alone producing over 5 million MT of polymers annually. New investments by HPCL (Rajasthan refinery-cum-petrochemical complex), BPCL (Kochi), and IOCL (Paradip) are expected to add significant capacity over the next five years, reducing India\'s import dependence for specialty grades.\n\nProcureSaathi\'s polymer procurement platform connects processors with verified producer-direct and authorized distributor channels, offering grade-specific sourcing with competitive pricing through sealed bidding.'
      },
      {
        heading: 'Major Polymer Products for Procurement',
        content: '**Polyethylene (PE):** The largest-volume polymer family. HDPE (High-Density Polyethylene) for pipes, containers, and geomembranes. LDPE (Low-Density Polyethylene) for films and packaging. LLDPE (Linear Low-Density Polyethylene) for stretch films and flexible packaging. Key grades are defined by density and melt flow index (MFI).\n\n**Polypropylene (PP):** The second-largest polymer by volume. Homopolymer grades for packaging, fibres, and automotive. Copolymer grades (random and impact) for containers, appliances, and automotive bumpers. Raffia grades for woven sacks and FIBC bags.\n\n**Polyvinyl Chloride (PVC):** Suspension-grade PVC resin for pipes, fittings, profiles, and cables. Emulsion-grade PVC for specialty coatings and flooring. PVC pipe compounds are the largest single application segment.\n\n**Engineering & Specialty Polymers:** ABS, Nylon (PA6/PA66), Polycarbonate, PET, and POM for automotive, electronics, and industrial applications.\n\nProcureSaathi enables grade-specific procurement with verified MFI, density, and additive specifications, ensuring processors receive material that meets their exact processing requirements.'
      },
      {
        heading: 'Applications Across Industry Verticals',
        content: 'Polymers serve as versatile engineering materials across virtually every industrial sector in India:\n\n**Packaging:** The largest polymer-consuming sector, including flexible packaging (LDPE/LLDPE films), rigid packaging (HDPE/PP containers), and woven sacks (PP raffia). India\'s packaging industry is growing at 15%+ annually.\n\n**Infrastructure & Construction:** HDPE and PVC pipes for water supply, sewage, and gas distribution. India\'s Jal Jeevan Mission alone targets piped water to 190 million rural households, driving massive HDPE/PVC demand.\n\n**Automotive:** PP compounds for interior and exterior trim, nylon for under-the-hood components, HDPE for fuel tanks, ABS for dashboard components.\n\n**Agriculture:** LDPE and LLDPE for mulch films, drip irrigation tubing, greenhouse covers, and silage wraps. India\'s agricultural film consumption exceeds 500,000 MT annually.\n\n**Textiles & Fibres:** PP for non-woven fabrics and carpet fibres, PET for polyester staple fibre and filament yarn.\n\nProcureSaathi tracks demand signals across these application sectors, matching buyers with the most competitive and reliable polymer suppliers.'
      },
      {
        heading: 'Pricing Dynamics & Market Intelligence',
        content: 'Polymer pricing in India is influenced by global crude oil and naphtha prices, petrochemical cracker operating rates, seasonal demand patterns, and import parity pricing. Unlike metals which trade on exchanges (LME, MCX), polymer pricing in India follows a producer-announced pricing model where Reliance, IOCL, and other producers set monthly base prices that serve as market benchmarks.\n\nKey pricing factors include: feedstock costs (naphtha and natural gas), cracker utilisation rates, import parity (particularly from Middle East and Southeast Asian producers), seasonal demand cycles (packaging season peaks, monsoon construction slowdowns), and grade-specific supply-demand dynamics.\n\nProcureSaathi\'s AI pricing intelligence aggregates these signals to provide buyers with real-time benchmark pricing, historical trend analysis, and forward price indicators. This enables procurement teams to time purchases optimally and negotiate from a position of market intelligence.'
      },
      {
        heading: 'Quality Standards & Compliance',
        content: 'Polymer procurement in India follows BIS and international quality standards:\n\n**HDPE:** IS 7328 (PE pipes), IS 4984 (HDPE pipes for water supply), ASTM D3350 (cell classification). Grade selection based on density (0.940-0.965 g/cm³) and MFI.\n**PVC:** IS 4985 (PVC pipes for potable water), IS 12818 (PVC pipes for sewage), ASTM D1784. K-value and polymerisation method (suspension vs emulsion) define grade categories.\n**PP:** IS 10910 (PP moulded containers), ASTM D4101. MFI ranges from 0.5 (blow moulding) to 35+ (injection moulding fibre grade).\n\nProcureSaathi verifies producer certifications, batch test certificates, and regulatory compliance (including food-contact grade approvals where applicable) for all polymer procurement transactions.'
      }
    ],
    children: [
      {
        slug: 'resins',
        name: 'Commodity Resins',
        h1: 'Commodity Resin Suppliers in India — HDPE, PP, PVC Granules',
        description: 'Commodity thermoplastic resins — polyethylene (HDPE, LDPE, LLDPE), polypropylene, and PVC — are the highest-volume polymer materials consumed in India. These resins serve packaging, pipe manufacturing, automotive, agriculture, and construction sectors.',
        metaTitle: 'Commodity Resins Procurement — HDPE, PP, PVC | ProcureSaathi',
        metaDescription: 'Source commodity polymer resins (HDPE, LDPE, PP, PVC) from AI-verified Indian producers. Grade-specific procurement for packaging, pipes, and industrial applications.',
        authoritySections: [
          {
            heading: 'What are Commodity Resins?',
            content: 'Commodity resins are high-volume thermoplastic polymers produced in petrochemical plants from ethylene, propylene, and vinyl chloride monomers. Unlike engineering plastics (nylon, polycarbonate, ABS), commodity resins are produced and traded in large volumes with relatively lower unit costs, making them the foundation of India\'s plastics processing industry.\n\nThe primary commodity resins are polyethylene (PE — including HDPE, LDPE, LLDPE), polypropylene (PP), and polyvinyl chloride (PVC). Together, these three polymer families account for over 80% of India\'s total polymer consumption. They are traded as granules or pellets, with each grade defined by specific density, melt flow index, and additive package specifications that determine processing behaviour and end-product properties.'
          },
          {
            heading: 'Procurement & Grade Selection',
            content: 'Effective commodity resin procurement requires precise grade specification. Each resin family contains dozens of grades optimised for specific processing methods and end applications:\n\n**HDPE Grades:** Pipe grades (PE 80, PE 100) with high ESCR and slow crack growth resistance. Blow moulding grades for containers and drums. Film grades for carry bags and liners. Injection moulding grades for crates and household products.\n\n**PP Grades:** Homopolymer grades for BOPP film, raffia, and injection moulding. Random copolymer grades for transparent containers and medical packaging. Impact copolymer grades for automotive and appliance applications.\n\n**PVC Grades:** Suspension K-67 and K-68 grades for pipe manufacturing. K-65 grades for rigid profiles and fittings. Emulsion grades for paste applications (flooring, leather cloth).\n\nProcureSaathi\'s managed procurement system matches buyer requirements with verified grades, ensuring correct MFI, density, and additive specifications for each application.'
          }
        ],
        productSlugs: ['hdpe-granules-india']
      }
    ]
  },
  {
    slug: 'industrial-supplies',
    name: 'Industrial Supplies',
    h1: 'Industrial Supplies Procurement in India — Valves, Bitumen & Equipment',
    description: 'AI-powered procurement for industrial equipment, materials, and supplies supporting India\'s manufacturing and infrastructure sectors.',
    metaTitle: 'Industrial Supplies Procurement — AI Verified Suppliers | ProcureSaathi',
    metaDescription: 'Source industrial valves, pumps, bitumen, tools, and equipment from AI-verified Indian manufacturers. Managed procurement with competitive pricing.',
    authoritySections: [
      {
        heading: 'India\'s Industrial Supplies Ecosystem',
        content: 'India\'s industrial supplies sector encompasses a vast range of products that support manufacturing, infrastructure, energy, and process industries. Unlike primary raw materials (steel, polymers), industrial supplies include finished and semi-finished products such as valves, pumps, fittings, construction chemicals, bitumen, tools, abrasives, and safety equipment. This fragmented sector presents unique procurement challenges — thousands of manufacturers, inconsistent quality standards, complex specification matching, and limited price transparency.\n\nThe Indian industrial supplies market is estimated at over ₹8 lakh crore, with double-digit growth driven by infrastructure investment (roads, railways, ports, airports), industrial capacity expansion (refineries, petrochemicals, steel plants), urban development (smart cities, water supply, sewage treatment), and maintenance-repair-operations (MRO) spending by existing industrial facilities.\n\nProcureSaathi\'s AI-powered procurement platform addresses the fragmentation challenge by aggregating verified suppliers, standardising specifications, and enabling competitive bidding across industrial supply categories.'
      },
      {
        heading: 'Major Industrial Supply Categories',
        content: '**Flow Control Equipment:** Industrial valves (gate, globe, ball, butterfly, check, control), pumps (centrifugal, reciprocating, submersible), and actuators. These products serve oil & gas, water treatment, power generation, and chemical process industries. Key standards: API 600/602/608, IS 14846, ASME B16.34.\n\n**Construction Materials:** Bitumen (VG 10/20/30/40 per IS 73), construction chemicals (waterproofing, admixtures, grouts), cement additives, geosynthetics, and specialty materials for road construction, building construction, and waterproofing.\n\n**Industrial Hardware:** Fasteners (bolts, nuts, washers per IS 1364/IS 1367), flanges (IS 6392, ASME B16.5), gaskets, O-rings, and sealing solutions for industrial assembly and maintenance.\n\n**Safety & Compliance Equipment:** PPE (helmets, gloves, harnesses), fire safety equipment, gas detection systems, and industrial hygiene products mandated by Indian Factories Act and OISD guidelines.\n\nProcureSaathi enables specification-matched procurement across all these categories with verified manufacturer credentials and competitive pricing through sealed bidding.'
      },
      {
        heading: 'Applications & End-Use Sectors',
        content: 'Industrial supplies serve as critical components and consumables across India\'s major industrial verticals:\n\n**Oil & Gas:** Industrial valves and fittings for refineries, pipelines, and offshore platforms. India operates 23 refineries with combined capacity exceeding 250 MTPA, each requiring ongoing procurement of valves, gaskets, fasteners, and maintenance supplies.\n\n**Water & Wastewater:** Butterfly valves, sluice gates, pipes, and fittings for water treatment plants, pumping stations, and distribution networks. India\'s Jal Jeevan Mission and AMRUT schemes are driving unprecedented water infrastructure investment.\n\n**Roads & Highways:** Bitumen (VG 30/VG 40), modified bitumen (CRMB, PMB), and road construction equipment. India constructs approximately 12,000 km of national highways annually, consuming over 8 million MT of bitumen.\n\n**Power Generation:** Valves, fittings, boiler spares, and turbine components for thermal, hydro, and renewable power plants.\n\n**Manufacturing & Process Industry:** MRO supplies, industrial chemicals, abrasives, cutting tools, and machine spares for factories and workshops across India.'
      },
      {
        heading: 'Procurement Challenges & How ProcureSaathi Helps',
        content: 'Industrial supplies procurement faces unique challenges that ProcureSaathi\'s managed model is designed to solve:\n\n**Fragmentation:** Thousands of small and medium manufacturers across India, making supplier discovery and qualification time-intensive. ProcureSaathi\'s AI engine pre-qualifies suppliers based on manufacturing capabilities, certifications, and past performance.\n\n**Specification Complexity:** Products like industrial valves have dozens of parameters (size, pressure rating, material, end connection, actuation type) that must be precisely specified. ProcureSaathi\'s structured RFQ system ensures complete specification capture and accurate supplier matching.\n\n**Quality Variance:** Inconsistent quality across manufacturers, particularly for critical items like pressure-rated valves and structural fasteners. ProcureSaathi validates manufacturer certifications (ISO 9001, API monogram, PED, IBR) and requires compliance documentation with every bid.\n\n**Price Opacity:** Limited price benchmarking data in the industrial supplies sector. ProcureSaathi\'s sealed competitive bidding creates real market pricing, while AI pricing intelligence provides historical benchmarks for informed procurement decisions.\n\nOur governance framework — immutable audit trails, two-way anonymity, and AI-driven evaluation — brings enterprise-grade procurement discipline to what has traditionally been a relationship-driven market.'
      },
      {
        heading: 'Quality Standards & Certifications',
        content: 'Industrial supplies procurement requires compliance with a range of Indian and international standards:\n\n**Valves:** IS 14846 (industrial valves general requirements), API 600 (gate valves), API 602 (compact gate valves), API 608 (ball valves), BS EN 593 (butterfly valves). Pressure ratings per ASME B16.34.\n**Bitumen:** IS 73:2013 (paving bitumen VG grades), IS 15462 (modified bitumen), IRC SP 53 (bituminous surfacing guidelines).\n**Fasteners:** IS 1364 (hexagon bolts), IS 1367 (technical supply conditions), IS 6623 (high-strength friction grip bolts). Mechanical properties per ISO 898.\n**Safety Equipment:** IS 2925 (safety helmets), IS 6994 (safety gloves), BIS certification mandatory for several PPE categories.\n\nProcureSaathi verifies all applicable certifications, test reports, and regulatory compliance as part of the supplier qualification and bid evaluation process.'
      }
    ],
    children: [
      {
        slug: 'construction-materials',
        name: 'Construction Materials',
        h1: 'Construction Material Suppliers in India — Bitumen & Specialty Materials',
        description: 'Essential construction materials including bitumen, cement additives, waterproofing compounds, and specialty materials for India\'s massive infrastructure development programs.',
        metaTitle: 'Construction Materials Procurement — AI Verified Suppliers | ProcureSaathi',
        metaDescription: 'Source bitumen, construction chemicals, and specialty building materials from AI-verified suppliers. Managed procurement for infrastructure projects.',
        authoritySections: [
          {
            heading: 'Construction Materials in India',
            content: 'India\'s construction sector is the second-largest employer and a key driver of GDP growth. The construction materials segment encompasses a wide range of products essential for roads, buildings, bridges, dams, and industrial structures. Major construction materials include bitumen for road surfacing, cement and concrete additives, waterproofing systems, structural adhesives, grouting compounds, and specialty chemical formulations.\n\nThe sector is undergoing rapid modernisation driven by government programmes like Bharatmala (road construction), Sagarmala (port development), Smart Cities Mission, and PMAY (housing). These programmes collectively represent over ₹30 lakh crore in planned investment, creating sustained demand for quality construction materials.\n\nProcureSaathi\'s procurement platform addresses the unique challenges of construction material sourcing — seasonal demand fluctuations, transport logistics, quality consistency, and project-specific specification requirements — through verified supplier networks and competitive sealed bidding.'
          },
          {
            heading: 'Key Products & Standards',
            content: '**Bitumen:** VG 10, VG 20, VG 30, and VG 40 grades per IS 73:2013 for different climatic zones and traffic conditions. Modified bitumen (CRMB 55/60, PMB 40/70) for heavy-traffic highways. Bitumen emulsions (RS, MS, SS grades) for surface dressing and cold mix applications.\n\n**Concrete Admixtures:** Plasticizers, superplasticizers (SNF, PCE-based), retarders, accelerators per IS 9103. Silica fume and fly ash as supplementary cementitious materials.\n\n**Waterproofing:** Integral waterproofing compounds, crystalline waterproofing systems, bituminous membranes (APP/SBS modified), PVC and TPO membranes for roofing.\n\nProcureSaathi ensures all construction material procurement meets applicable BIS, IRC, and project-specific standards with verified test certificates and manufacturer warranties.'
          }
        ],
        productSlugs: ['bitumen-vg30-india']
      },
      {
        slug: 'pumps-valves',
        name: 'Pumps & Valves',
        h1: 'Industrial Valve & Pump Suppliers in India — Oil & Gas, Water & Process',
        description: 'Industrial flow control equipment including gate valves, ball valves, butterfly valves, globe valves, control valves, and pumps for oil & gas, water, power, and chemical process industries.',
        metaTitle: 'Industrial Valves & Pumps Procurement — AI Verified Suppliers | ProcureSaathi',
        metaDescription: 'Source industrial valves and pumps from AI-verified Indian manufacturers. API/ASME certified. For oil & gas, water treatment, and process industries.',
        authoritySections: [
          {
            heading: 'Industrial Valves & Pumps Overview',
            content: 'Industrial valves and pumps are critical flow control and fluid transfer equipment used across every process industry. Valves regulate, direct, and control the flow of fluids (liquids, gases, slurries) by opening, closing, or partially obstructing passageways. Pumps convert mechanical energy into hydraulic energy to move fluids through piping systems.\n\nIndia\'s valve manufacturing industry is concentrated in key clusters — Ahmedabad (Gujarat), Coimbatore (Tamil Nadu), and Delhi-NCR — producing everything from commodity cast iron gate valves to high-specification forged steel ball valves for offshore applications. The Indian valve market is estimated at over ₹15,000 crore, growing at 8-10% annually driven by oil & gas, water infrastructure, and industrial expansion.\n\nProcureSaathi\'s managed procurement platform enables specification-matched valve and pump sourcing through verified manufacturers with API, ASME, and BIS certifications.'
          },
          {
            heading: 'Applications & Specification Requirements',
            content: '**Oil & Gas:** API 600/602 gate valves, API 608 ball valves, API 594 butterfly valves for refineries and pipelines. Material specifications range from carbon steel (A216 WCB) to stainless steel (A351 CF8M) and special alloys (Duplex, Inconel) depending on service conditions.\n\n**Water & Wastewater:** IS 14846 sluice valves, butterfly valves (PN 10/16) for water treatment plants, non-return valves for pumping stations. Materials include cast iron (FG 260), ductile iron (SG 500/7), and rubber-lined valves for corrosive service.\n\n**Power Generation:** High-pressure globe and gate valves for boiler feed water systems, steam isolation, and turbine bypass applications. IBR (Indian Boiler Regulations) certification required for pressure parts.\n\n**Chemical Process:** Lined valves (PTFE, PFA, rubber) for corrosive chemical service, knife gate valves for slurry applications, control valves with positioners for automated process control.\n\nProcureSaathi captures complete technical specifications — valve type, size, pressure class, material, end connection, actuation, and applicable standards — to ensure accurate supplier matching and bid comparison.'
          }
        ],
        productSlugs: ['industrial-valves-india']
      }
    ]
  }
];

export function getIndustryBySlug(slug: string): IndustryNode | undefined {
  for (const industry of industryTaxonomy) {
    if (industry.slug === slug) return industry;
    if (industry.children) {
      const child = industry.children.find(c => c.slug === slug);
      if (child) return child;
    }
  }
  return undefined;
}

export function getIndustryBreadcrumb(industrySlug: string, subIndustrySlug?: string): { name: string; slug: string }[] {
  const crumbs: { name: string; slug: string }[] = [{ name: 'Industries', slug: '/industries' }];
  
  for (const industry of industryTaxonomy) {
    if (industry.slug === industrySlug) {
      crumbs.push({ name: industry.name, slug: `/industries/${industry.slug}` });
      if (subIndustrySlug && industry.children) {
        const child = industry.children.find(c => c.slug === subIndustrySlug);
        if (child) {
          crumbs.push({ name: child.name, slug: `/industries/${industry.slug}/${child.slug}` });
        }
      }
      break;
    }
  }
  
  return crumbs;
}
