export interface ComparisonTable {
  headers: string[];
  rows: string[][];
}

export interface ComparisonFAQ {
  question: string;
  answer: string;
}

export interface ComparisonPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  gradeA: string;
  gradeB: string;
  chemicalComposition: ComparisonTable;
  mechanicalProperties: ComparisonTable;
  standards: { code: string; description: string }[];
  standardsExplanation: string;
  useCaseDifferences: { gradeA: string[]; gradeB: string[] };
  priceImplication: string;
  procurementRecommendation: string;
  faqs: ComparisonFAQ[];
  relatedDemandSlug: string;
  relatedCountrySlug: string;
}

export const comparisonPagesData: ComparisonPage[] = [
  {
    slug: "fe-500-vs-fe-500d-tmt-bars",
    title: "Fe 500 vs Fe 500D TMT Bars – Technical Comparison, Strength, Use Cases",
    metaTitle: "Fe 500 vs Fe 500D TMT Bars | Strength, Ductility & IS Code Comparison",
    metaDescription: "Detailed technical comparison of Fe 500 vs Fe 500D TMT bars covering yield strength, elongation, IS 1786 compliance, and EPC procurement guidance.",
    intro: "For structural engineers and EPC procurement heads, the choice between Fe 500 and Fe 500D TMT bars directly impacts structural integrity, seismic resilience, and project compliance. Both grades conform to IS 1786, but Fe 500D offers superior ductility — a critical factor in seismic zones III, IV, and V. This comparison provides the technical data needed to make informed procurement decisions for infrastructure, residential high-rise, and industrial construction projects.",
    gradeA: "Fe 500",
    gradeB: "Fe 500D",
    chemicalComposition: {
      headers: ["Element", "Fe 500 (Max %)", "Fe 500D (Max %)"],
      rows: [
        ["Carbon (C)", "0.30", "0.25"],
        ["Sulphur (S)", "0.055", "0.040"],
        ["Phosphorus (P)", "0.055", "0.040"],
        ["S + P Combined", "0.105", "0.075"],
        ["Carbon Equivalent", "0.42", "0.42"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "Fe 500", "Fe 500D"],
      rows: [
        ["Yield Strength (min)", "500 MPa", "500 MPa"],
        ["UTS (min)", "545 MPa", "565 MPa"],
        ["Elongation % (min)", "12%", "16%"],
        ["UTS/YS Ratio (min)", "1.08", "1.10"],
        ["Bend Test (mandrel)", "3d", "3d"],
        ["Re-Bend Test", "7d", "7d"],
        ["Weldability", "Good", "Superior"]
      ]
    },
    standards: [
      { code: "IS 1786:2008", description: "Specification for high strength deformed steel bars and wires for concrete reinforcement" },
      { code: "IS 13920:2016", description: "Ductile detailing of reinforced concrete structures subjected to seismic forces" },
      { code: "IS 456:2000", description: "Plain and reinforced concrete – code of practice" }
    ],
    standardsExplanation: "Both Fe 500 and Fe 500D comply with IS 1786:2008. However, IS 13920:2016 mandates Fe 500D or equivalent for ductile detailing in seismic zones III–V. The 'D' designation specifically indicates controlled chemistry for enhanced ductility, making it the mandatory choice for earthquake-resistant design as per current BIS standards.",
    useCaseDifferences: {
      gradeA: [
        "Non-seismic residential construction (Zone I–II)",
        "Industrial flooring and foundations",
        "Standard infrastructure projects without seismic requirements",
        "Cost-sensitive projects where ductility is not critical",
        "Boundary walls, compound structures, non-load-bearing elements"
      ],
      gradeB: [
        "High-rise buildings in seismic zones III–V (mandatory per IS 13920)",
        "Bridge piers, abutments, and deck reinforcement",
        "Nuclear and critical infrastructure facilities",
        "EPC projects with international compliance requirements",
        "Flyovers, metros, and elevated corridors"
      ]
    },
    priceImplication: "Fe 500D commands a premium of ₹500–1,500 per tonne over Fe 500 due to tighter chemistry controls during manufacturing. The additional cost is marginal compared to the structural safety benefits. For a typical 1,000 MT reinforcement project, the incremental cost of switching to Fe 500D is approximately ₹5–15 lakhs — a negligible fraction of overall project cost but a significant upgrade in seismic resilience and structural longevity.",
    procurementRecommendation: "For all new construction projects in India's seismic zones III, IV, and V, Fe 500D is not just recommended — it is mandatory under IS 13920:2016. Even for Zone I–II projects, specifying Fe 500D provides a safety margin against dynamic loads, blast resistance, and future code revisions. EPC contractors should standardize on Fe 500D to simplify inventory management and ensure compliance across multi-site operations. When sourcing through ProcureSaathi, specify the grade explicitly in your RFQ to receive competitive sealed bids from BIS-certified mills.",
    faqs: [
      { question: "Which TMT bar is better for seismic zones — Fe 500 or Fe 500D?", answer: "Fe 500D is mandatory for seismic zones III–V as per IS 13920:2016. Its higher elongation (16% vs 12%) and superior UTS/YS ratio (1.10 vs 1.08) provide the ductility needed to absorb seismic energy without brittle failure." },
      { question: "What is the elongation difference between Fe 500 and Fe 500D?", answer: "Fe 500 requires minimum 12% elongation while Fe 500D requires minimum 16% elongation. This 33% improvement in ductility is achieved through tighter control of carbon, sulphur, and phosphorus content during steelmaking." },
      { question: "Is Fe 500D more expensive than Fe 500?", answer: "Fe 500D carries a premium of approximately ₹500–1,500 per tonne due to stricter chemistry controls. For a typical project, this translates to less than 1% additional reinforcement cost while significantly improving structural safety." },
      { question: "Can Fe 500 be used in high-rise buildings?", answer: "Fe 500 can be used in non-seismic zones for high-rise construction. However, most structural engineers now recommend Fe 500D universally due to its superior ductility, better weldability, and compliance with the latest IS codes." },
      { question: "What does the 'D' in Fe 500D stand for?", answer: "The 'D' stands for 'Ductility'. Fe 500D TMT bars have controlled levels of carbon (≤0.25%), sulphur (≤0.040%), and phosphorus (≤0.040%), resulting in higher elongation and energy absorption capacity compared to standard Fe 500 bars." }
    ],
    relatedDemandSlug: "tmt-bars-india",
    relatedCountrySlug: "japan"
  },
  {
    slug: "fe-415-vs-fe-500-tmt",
    title: "Fe 415 vs Fe 500 TMT Bars – Technical Comparison, Strength, Use Cases",
    metaTitle: "Fe 415 vs Fe 500 TMT | Yield Strength, Cost & Application Comparison",
    metaDescription: "Compare Fe 415 and Fe 500 TMT bars on yield strength, elongation, IS 1786 standards, and procurement suitability for residential and infrastructure projects.",
    intro: "Fe 415 and Fe 500 are the two most commonly specified TMT bar grades in Indian construction. While Fe 415 was historically the default for residential projects, the industry has progressively shifted towards Fe 500 for its higher yield strength and material efficiency. This comparison helps procurement managers and structural consultants evaluate both grades for specific project requirements — from low-rise residential to heavy infrastructure.",
    gradeA: "Fe 415",
    gradeB: "Fe 500",
    chemicalComposition: {
      headers: ["Element", "Fe 415 (Max %)", "Fe 500 (Max %)"],
      rows: [
        ["Carbon (C)", "0.30", "0.30"],
        ["Sulphur (S)", "0.060", "0.055"],
        ["Phosphorus (P)", "0.060", "0.055"],
        ["S + P Combined", "0.110", "0.105"],
        ["Carbon Equivalent", "0.42", "0.42"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "Fe 415", "Fe 500"],
      rows: [
        ["Yield Strength (min)", "415 MPa", "500 MPa"],
        ["UTS (min)", "485 MPa", "545 MPa"],
        ["Elongation % (min)", "14.5%", "12%"],
        ["UTS/YS Ratio (min)", "1.10", "1.08"],
        ["Bend Test (mandrel)", "3d", "3d"],
        ["Re-Bend Test", "7d", "7d"],
        ["Weldability", "Good", "Good"]
      ]
    },
    standards: [
      { code: "IS 1786:2008", description: "High strength deformed steel bars for concrete reinforcement" },
      { code: "IS 456:2000", description: "Plain and reinforced concrete – code of practice" }
    ],
    standardsExplanation: "Both grades comply with IS 1786:2008. Fe 415 offers higher elongation (14.5% vs 12%), making it marginally more ductile, while Fe 500 provides 20% higher yield strength. IS 456 permits both grades for reinforced concrete, but Fe 500 allows reduced steel quantity for the same load capacity, offering material savings of 10–15%.",
    useCaseDifferences: {
      gradeA: [
        "Low-rise residential buildings (up to G+3)",
        "Rural infrastructure and Pradhan Mantri Awas Yojana (PMAY) projects",
        "Structures requiring high ductility without seismic mandate",
        "Legacy projects where drawings specify Fe 415",
        "Precast concrete elements where formability is critical"
      ],
      gradeB: [
        "High-rise residential and commercial construction",
        "Infrastructure projects — highways, bridges, flyovers",
        "Industrial structures and factories",
        "Projects requiring material optimization and cost efficiency",
        "Government projects complying with latest NBC codes"
      ]
    },
    priceImplication: "Fe 500 is typically priced ₹300–800 per tonne higher than Fe 415. However, the 20% higher yield strength of Fe 500 means 10–15% less steel is required for equivalent structural capacity. On a ₹50 crore reinforcement budget, switching from Fe 415 to Fe 500 can save ₹3–5 crore in material costs despite the higher per-tonne price — a net saving that makes Fe 500 economically superior for most projects.",
    procurementRecommendation: "Fe 500 has effectively replaced Fe 415 as the default grade in modern Indian construction. Major BIS-certified mills prioritize Fe 500 production, and Fe 415 availability is declining. Unless legacy drawings specifically require Fe 415, procurement teams should standardize on Fe 500 (or Fe 500D for seismic zones) for better structural performance, material efficiency, and supply availability. Submit RFQs through ProcureSaathi specifying grade, diameter, and delivery schedule for competitive pricing.",
    faqs: [
      { question: "Is Fe 415 still used in construction?", answer: "Fe 415 is still used in low-rise residential and rural construction. However, its usage is declining as Fe 500 offers superior strength, material savings, and better availability from major mills. Most new projects now specify Fe 500 or Fe 500D." },
      { question: "How much steel can be saved by using Fe 500 instead of Fe 415?", answer: "Fe 500 provides 20% higher yield strength (500 MPa vs 415 MPa), translating to approximately 10–15% steel savings for equivalent structural capacity. This material reduction often more than offsets the higher per-tonne cost of Fe 500." },
      { question: "Which grade is more ductile — Fe 415 or Fe 500?", answer: "Fe 415 has higher minimum elongation (14.5%) compared to Fe 500 (12%), making it marginally more ductile. However, for seismic applications, Fe 500D (16% elongation) is the recommended choice over both grades." },
      { question: "Can Fe 415 and Fe 500 be mixed in the same structure?", answer: "Technically possible but not recommended. Mixing grades complicates structural design calculations, quality control, and on-site inventory management. Standardizing on a single grade reduces procurement complexity and construction errors." },
      { question: "What is the cost difference between Fe 415 and Fe 500?", answer: "Fe 500 is typically ₹300–800 per tonne more expensive than Fe 415. However, the net project cost with Fe 500 is usually lower due to 10–15% material savings from higher yield strength." }
    ],
    relatedDemandSlug: "tmt-bars-india",
    relatedCountrySlug: "uae"
  },
  {
    slug: "e250-vs-e350-structural-steel",
    title: "E250 vs E350 Structural Steel – Technical Comparison, Strength, Use Cases",
    metaTitle: "E250 vs E350 Structural Steel | IS 2062 Grade Comparison for EPC",
    metaDescription: "Compare IS 2062 E250 and E350 structural steel grades on yield strength, impact toughness, weldability, and suitability for EPC and industrial fabrication.",
    intro: "E250 and E350 are the two most widely specified structural steel grades under IS 2062 in India. E250 (formerly Grade A) is the workhorse for general structural applications, while E350 (formerly Grade C) offers significantly higher yield strength for heavy-duty fabrication. This comparison provides procurement intelligence for EPC contractors, fabricators, and structural consultants evaluating the right grade for their project loads, environmental exposure, and budget constraints.",
    gradeA: "E250",
    gradeB: "E350",
    chemicalComposition: {
      headers: ["Element", "E250 (Max %)", "E350 (Max %)"],
      rows: [
        ["Carbon (C)", "0.22", "0.20"],
        ["Manganese (Mn)", "1.50", "1.50"],
        ["Sulphur (S)", "0.045", "0.040"],
        ["Phosphorus (P)", "0.045", "0.040"],
        ["Silicon (Si)", "0.40", "0.40"],
        ["Carbon Equivalent (CE)", "0.42", "0.44"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "E250", "E350"],
      rows: [
        ["Yield Strength (min)", "250 MPa", "350 MPa"],
        ["UTS (min)", "410 MPa", "490 MPa"],
        ["Elongation % (min)", "23%", "22%"],
        ["Charpy Impact (J, 0°C)", "Not specified", "25 J min"],
        ["Bend Test", "Satisfactory", "Satisfactory"],
        ["Weldability", "Excellent", "Good (preheat may be needed for thick sections)"]
      ]
    },
    standards: [
      { code: "IS 2062:2011", description: "Hot rolled medium and high tensile structural steel" },
      { code: "IS 800:2007", description: "General construction in steel — code of practice" },
      { code: "IS 816:1969", description: "Code of practice for use of metal arc welding" }
    ],
    standardsExplanation: "Both E250 and E350 are specified under IS 2062:2011. E250 (sub-grade BR/BO) is used for general structures where impact toughness is not critical. E350 provides Charpy impact testing at 0°C (25 J minimum for BR sub-grade), making it suitable for structures exposed to dynamic loads, low temperatures, or fatigue cycling. IS 800:2007 design calculations differ significantly between grades due to the 40% yield strength differential.",
    useCaseDifferences: {
      gradeA: [
        "General purpose structural steel frames and trusses",
        "Industrial sheds and warehouses (light to medium span)",
        "Residential and commercial building structures",
        "Non-critical supports, bracings, and secondary members",
        "Standard fabricated components — ladders, platforms, railings"
      ],
      gradeB: [
        "Heavy industrial structures — power plants, refineries, cement plants",
        "Long-span portal frames (>30m span)",
        "Bridge girders and deck structures",
        "Crane girders and heavy lifting structures",
        "Offshore and cold-region structures requiring impact toughness"
      ]
    },
    priceImplication: "E350 is typically priced ₹3,000–5,000 per tonne above E250 due to tighter chemistry controls and additional testing requirements. However, E350's 40% higher yield strength enables lighter sections for the same load, reducing steel weight by 15–25%. For a typical 500 MT industrial shed, switching to E350 from E250 can reduce total steel quantity by 75–125 MT, yielding net savings despite the higher per-tonne cost.",
    procurementRecommendation: "For light to medium structures (spans ≤20m, loads ≤10 kN/m²), E250 offers the best cost-performance balance. For heavy industrial, high-span, or dynamically loaded structures, E350 is technically and economically superior. Always specify the sub-grade (BR, BO, or A) to ensure appropriate impact testing. When sourcing through ProcureSaathi, include section profiles, quantities, and delivery location for accurate mill pricing.",
    faqs: [
      { question: "Is E350 suitable for welded structures?", answer: "Yes, E350 is weldable with standard electrodes (E7018). However, for sections thicker than 25mm, preheat to 100–150°C may be required to prevent hydrogen-induced cracking. Carbon equivalent (CE ≤ 0.44) should be verified on mill test certificates." },
      { question: "What is the yield strength difference between E250 and E350?", answer: "E250 has a minimum yield strength of 250 MPa while E350 provides 350 MPa — a 40% improvement. This means E350 can carry 40% more load per unit area, enabling lighter structural sections and material savings." },
      { question: "Which grade is recommended for industrial sheds?", answer: "E250 is suitable for light-duty industrial sheds with spans up to 20m. For heavy-duty sheds, crane-supporting structures, or spans exceeding 25m, E350 is recommended for its superior load capacity and material efficiency." },
      { question: "Can E250 and E350 be used together in one structure?", answer: "Yes, it is common practice to use E350 for primary members (columns, rafters) and E250 for secondary members (purlins, girts) to optimize costs. This requires careful design documentation and segregated site storage." },
      { question: "Does E350 have better impact resistance than E250?", answer: "Yes, E350 BR sub-grade requires minimum 25 J Charpy impact energy at 0°C, while standard E250 does not mandate impact testing. This makes E350 suitable for structures exposed to dynamic loads, vibrations, or sub-zero temperatures." }
    ],
    relatedDemandSlug: "structural-steel-india",
    relatedCountrySlug: "germany"
  },
  {
    slug: "ismb-vs-ishb-beam-comparison",
    title: "ISMB vs ISHB Beam – Technical Comparison, Load Capacity, Use Cases",
    metaTitle: "ISMB vs ISHB Beam Comparison | Section Properties & Structural Use",
    metaDescription: "Compare ISMB and ISHB steel beams on section modulus, weight, flange width, and suitability for industrial structures, sheds, and multi-story buildings.",
    intro: "Indian Standard Medium Weight Beam (ISMB) and Indian Standard Heavy Weight Beam (ISHB) are the two most commonly specified hot-rolled beam sections in structural steel construction. While they share similar depth ranges, ISHB sections offer significantly wider flanges and greater section modulus — critical for heavy load applications. This comparison guides procurement managers and structural engineers in selecting the right beam profile for their load, span, and fabrication requirements.",
    gradeA: "ISMB",
    gradeB: "ISHB",
    chemicalComposition: {
      headers: ["Section Property", "ISMB 300", "ISHB 300"],
      rows: [
        ["Depth (mm)", "300", "300"],
        ["Flange Width (mm)", "140", "250"],
        ["Flange Thickness (mm)", "12.4", "10.6"],
        ["Web Thickness (mm)", "7.5", "7.6"],
        ["Weight (kg/m)", "44.2", "58.8"],
        ["Material Grade", "IS 2062 E250/E350", "IS 2062 E250/E350"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "ISMB 300", "ISHB 300"],
      rows: [
        ["Section Modulus Zxx (cm³)", "573.6", "836.3"],
        ["Moment of Inertia Ixx (cm⁴)", "8603.6", "12545.2"],
        ["Radius of Gyration rxx (cm)", "12.4", "12.9"],
        ["Section Modulus Zyy (cm³)", "86.0", "210.6"],
        ["Moment of Inertia Iyy (cm⁴)", "602.2", "2634.0"],
        ["Lateral Stability", "Moderate", "Superior"]
      ]
    },
    standards: [
      { code: "IS 808:1989", description: "Dimensions for hot rolled steel beam, column, channel and angle sections" },
      { code: "IS 2062:2011", description: "Hot rolled medium and high tensile structural steel" },
      { code: "IS 800:2007", description: "General construction in steel" }
    ],
    standardsExplanation: "Both ISMB and ISHB sections are dimensionally specified under IS 808:1989 and manufactured from IS 2062 grade steel. The key difference lies in the flange-to-depth ratio — ISHB has nearly 80% wider flanges at the same depth, providing superior lateral stability and biaxial bending capacity. IS 800:2007 design provisions for lateral-torsional buckling are more favorable for ISHB sections due to their wider compression flanges.",
    useCaseDifferences: {
      gradeA: [
        "Standard floor beams in multi-story buildings",
        "Purlins and secondary beams in industrial sheds",
        "Light crane girders (up to 5T capacity)",
        "Composite floor systems with concrete deck",
        "General purpose structural framing"
      ],
      gradeB: [
        "Primary columns in multi-story steel frames",
        "Heavy crane girders (10T–50T capacity)",
        "Transfer beams carrying concentrated loads",
        "Portal frame rafters with wide spans",
        "Built-up sections and plate girder alternatives"
      ]
    },
    priceImplication: "ISHB sections cost approximately 5–10% more per kg than ISMB due to higher material content per meter. However, ISHB's 46% higher section modulus (at same depth) means fewer beams or lighter secondary members may be needed. For crane girder applications, a single ISHB 300 can replace twin ISMB 250 beams, reducing fabrication cost and installation time by 30–40%.",
    procurementRecommendation: "For standard beam applications in buildings and light industrial structures, ISMB is the cost-effective default. For heavy-duty applications requiring high section modulus, biaxial bending resistance, or column applications, ISHB is the superior choice. Always verify section availability with mills — ISHB in uncommon sizes may have longer lead times. ProcureSaathi provides real-time availability checks from SAIL, JSW, Tata Steel, and RINL stockists.",
    faqs: [
      { question: "What is the main difference between ISMB and ISHB?", answer: "The primary difference is flange width. ISHB has significantly wider flanges (e.g., 250mm vs 140mm for 300mm depth), providing 46% higher section modulus and far superior lateral stability. ISHB is essentially a 'wide-flange' variant of the same depth beam." },
      { question: "Which beam is better for crane girders?", answer: "ISHB is preferred for crane girders above 5T capacity due to its wider flange providing better lateral stability against crane wheel loads. For girders supporting EOT cranes of 10T and above, ISHB with E350 grade is the standard specification." },
      { question: "Is ISHB heavier than ISMB?", answer: "Yes, ISHB is 30–40% heavier per meter than ISMB at the same depth due to wider flanges. ISHB 300 weighs 58.8 kg/m versus ISMB 300 at 44.2 kg/m. The additional weight provides proportionally higher structural capacity." },
      { question: "Can ISMB be used as columns?", answer: "ISMB can be used as columns in light structures, but ISHB is preferred for columns due to its superior radius of gyration about both axes, providing better buckling resistance. For multi-story frames, ISHB or built-up columns are standard practice." },
      { question: "Where can I find IS 808 section tables?", answer: "IS 808:1989 provides complete dimensional and sectional property tables for all Indian Standard beam sections. ProcureSaathi's procurement intelligence includes section property data integrated into the RFQ process to help specify the right section for your load requirements." }
    ],
    relatedDemandSlug: "structural-steel-india",
    relatedCountrySlug: "china"
  },
  {
    slug: "ismb-vs-ismc-channel",
    title: "ISMB vs ISMC – Beam vs Channel Section Comparison for Structural Use",
    metaTitle: "ISMB vs ISMC | Beam vs Channel Steel Section Comparison",
    metaDescription: "Compare ISMB beams and ISMC channels on section properties, load capacity, and structural use cases for industrial sheds, purlin design, and fabrication.",
    intro: "ISMB (Indian Standard Medium Weight Beam) and ISMC (Indian Standard Medium Weight Channel) are fundamentally different section profiles serving distinct structural roles. Beams are symmetric I-sections designed for bending, while channels are asymmetric C-sections used for purlins, bracings, and built-up members. This comparison helps procurement engineers and fabricators select the right profile for span, load, and connection requirements.",
    gradeA: "ISMB",
    gradeB: "ISMC",
    chemicalComposition: {
      headers: ["Section Property", "ISMB 200", "ISMC 200"],
      rows: [
        ["Depth (mm)", "200", "200"],
        ["Flange Width (mm)", "100", "75"],
        ["Flange Thickness (mm)", "10.8", "11.4"],
        ["Web Thickness (mm)", "5.7", "6.1"],
        ["Weight (kg/m)", "25.4", "22.1"],
        ["Section Type", "Symmetric I-section", "Asymmetric C-section"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "ISMB 200", "ISMC 200"],
      rows: [
        ["Section Modulus Zxx (cm³)", "223.5", "181.9"],
        ["Moment of Inertia Ixx (cm⁴)", "2235.4", "1819.3"],
        ["Radius of Gyration rxx (cm)", "8.3", "8.1"],
        ["Section Modulus Zyy (cm³)", "32.2", "19.4"],
        ["Shear Center", "At centroid", "Offset from web"],
        ["Torsional Resistance", "Moderate", "Low (prone to twisting)"]
      ]
    },
    standards: [
      { code: "IS 808:1989", description: "Dimensions for hot rolled sections" },
      { code: "IS 800:2007", description: "General construction in steel" },
      { code: "IS 875 Part 3", description: "Wind loads on buildings and structures" }
    ],
    standardsExplanation: "Both sections are dimensionally governed by IS 808:1989. The critical design difference per IS 800:2007 is the shear center location. ISMB's shear center coincides with its centroid (symmetric), while ISMC's shear center is offset from the web, creating a torsional moment under transverse loading. This makes channels unsuitable as primary bending members unless used in back-to-back pairs or with lateral restraint.",
    useCaseDifferences: {
      gradeA: [
        "Primary floor beams and roof beams",
        "Portal frame rafters",
        "Crane girders and runway beams",
        "Composite construction with concrete slabs",
        "Main structural framing members"
      ],
      gradeB: [
        "Purlins and girts in metal building systems",
        "Stringer beams in staircases",
        "Bracing and strut members",
        "Built-up sections (back-to-back channels as columns)",
        "Edge beams, lintels, and parapet framing"
      ]
    },
    priceImplication: "ISMC is approximately 10–15% lighter per meter than ISMB at the same depth, making it more economical for secondary member applications like purlins. However, using channels as primary bending members requires pairing (back-to-back), doubling the material cost and fabrication effort. For purlin applications, ISMC 150 or ISMC 200 at ₹52,000–58,000/MT offers the best cost-performance ratio for spans up to 6m.",
    procurementRecommendation: "Use ISMB for all primary bending members (beams, girders, rafters) where symmetric behavior and torsional resistance are essential. Use ISMC for purlins, girts, bracings, and secondary framing where the asymmetric section is structurally acceptable. For procurement, ISMC is more widely available in lighter sizes (75–200mm) while ISMB availability is better in heavier sections (200–600mm). Specify section size, grade, length, and quantity in your ProcureSaathi RFQ for competitive mill pricing.",
    faqs: [
      { question: "Can ISMC channels be used as beams?", answer: "ISMC channels can carry bending loads but are prone to lateral-torsional buckling and twisting due to their asymmetric cross-section. For beam applications, back-to-back paired channels or ISMB sections are recommended. Single channels should only be used as beams with adequate lateral restraint." },
      { question: "Which is better for purlin design — ISMB or ISMC?", answer: "ISMC is the standard choice for purlins due to its lighter weight, adequate section modulus for typical purlin loads, and ease of connection to rafter flanges. ISMB is overdesigned and uneconomical for most purlin applications." },
      { question: "What is the weight difference between ISMB and ISMC?", answer: "At the same depth (e.g., 200mm), ISMB weighs 25.4 kg/m while ISMC weighs 22.1 kg/m — approximately 13% lighter. This weight saving is significant when specifying hundreds of meters of purlins in industrial sheds." },
      { question: "Can ISMC be used as columns?", answer: "Single ISMC sections are not ideal for columns due to asymmetric buckling behavior. However, back-to-back ISMC channels (laced or battened) are commonly used as built-up columns, providing symmetric properties comparable to ISHB sections." },
      { question: "What IS code governs ISMB and ISMC dimensions?", answer: "IS 808:1989 specifies the dimensions, weight, and sectional properties for all Indian Standard hot-rolled sections including ISMB, ISHB, ISMC, and ISMC. IS 2062:2011 governs the material grade and chemical composition." }
    ],
    relatedDemandSlug: "structural-steel-india",
    relatedCountrySlug: "south-korea"
  },
  {
    slug: "hr-coil-vs-cr-coil",
    title: "HR Coil vs CR Coil – Technical Comparison, Properties, Use Cases",
    metaTitle: "HR Coil vs CR Coil | Hot Rolled vs Cold Rolled Steel Comparison",
    metaDescription: "Compare HR Coil and CR Coil on thickness tolerance, surface finish, yield strength, and procurement suitability for automotive, construction, and manufacturing.",
    intro: "Hot Rolled (HR) Coil and Cold Rolled (CR) Coil represent two fundamental steel processing stages with dramatically different surface quality, dimensional tolerance, and mechanical properties. HR Coil is rolled at temperatures above 900°C, while CR Coil undergoes additional cold reduction below recrystallization temperature. This comparison is essential for procurement managers sourcing flat steel for automotive, white goods, construction, or industrial manufacturing applications.",
    gradeA: "HR Coil",
    gradeB: "CR Coil",
    chemicalComposition: {
      headers: ["Property", "HR Coil (Typical)", "CR Coil (Typical)"],
      rows: [
        ["Base Grade", "IS 2062 E250 / SAE 1008", "IS 513 CR1–CR5 / SAE 1008"],
        ["Carbon (C)", "0.15–0.22%", "0.06–0.12%"],
        ["Manganese (Mn)", "0.60–1.50%", "0.25–0.60%"],
        ["Processing Temp", ">900°C (austenitic range)", "Room temperature"],
        ["Scale/Oxide Layer", "Present (mill scale)", "Absent (bright finish)"],
        ["Available Thickness", "1.6mm–25mm", "0.15mm–3.0mm"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "HR Coil", "CR Coil"],
      rows: [
        ["Yield Strength (typical)", "250–350 MPa", "180–300 MPa (annealed)"],
        ["UTS (typical)", "410–550 MPa", "280–450 MPa"],
        ["Elongation %", "20–25%", "28–42% (annealed)"],
        ["Surface Finish", "Rough (mill scale)", "Smooth (bright/matte)"],
        ["Thickness Tolerance", "±0.3mm", "±0.05mm"],
        ["Formability", "Moderate", "Excellent (deep drawing grades)"]
      ]
    },
    standards: [
      { code: "IS 2062:2011", description: "Hot rolled structural steel specification" },
      { code: "IS 513:2018", description: "Cold rolled low carbon steel sheet and strip" },
      { code: "IS 10748:2004", description: "Hot rolled steel strip for welded tubes" }
    ],
    standardsExplanation: "HR Coil is primarily governed by IS 2062:2011 for structural applications and IS 10748 for tube-making grades. CR Coil follows IS 513:2018 which classifies grades from CR1 (commercial quality) to CR5 (deep drawing extra deep quality). The cold rolling process introduces work hardening, which is relieved through annealing to achieve the desired formability. Drawing quality grades (CR3–CR5) are essential for automotive body panels and white goods enclosures.",
    useCaseDifferences: {
      gradeA: [
        "Structural sections — beams, columns, plates",
        "Pipe and tube manufacturing (ERW, spiral welded)",
        "Heavy equipment chassis and frames",
        "Construction — roofing, cladding (galvanized HR)",
        "Ship building and heavy fabrication"
      ],
      gradeB: [
        "Automotive body panels and stampings",
        "White goods — refrigerator panels, washing machine drums",
        "Precision tubes and small-diameter pipes",
        "Electrical laminations and transformer cores",
        "Furniture, enclosures, and consumer appliances"
      ]
    },
    priceImplication: "CR Coil commands a premium of ₹8,000–15,000 per tonne over HR Coil due to the additional cold rolling, annealing, and skin-pass operations. For a typical automotive stamping plant consuming 500 MT/month of CR Coil, the annual premium over HR Coil is ₹4.8–9.0 crore. However, CR Coil eliminates the need for surface preparation (pickling, grinding) and provides the dimensional precision required for press operations, making it indispensable for quality-critical applications.",
    procurementRecommendation: "Specify HR Coil for structural, fabrication, and tube-making applications where surface finish and tight tolerance are not critical. Specify CR Coil (with appropriate IS 513 drawing quality grade) for automotive, appliance, and precision component applications. For export-oriented manufacturing, ensure compliance with destination country standards (JIS, EN, ASTM). ProcureSaathi provides mill-direct pricing for both HR and CR Coils with quality certification and logistics support.",
    faqs: [
      { question: "Why is CR Coil more expensive than HR Coil?", answer: "CR Coil undergoes additional processing — cold reduction, annealing, skin-pass rolling, and sometimes temper rolling — after the hot rolling stage. These operations improve surface finish, dimensional precision, and formability but add ₹8,000–15,000/MT to the cost." },
      { question: "Can HR Coil be used instead of CR Coil?", answer: "HR Coil cannot substitute CR Coil in applications requiring smooth surface finish, tight thickness tolerance (±0.05mm), or deep drawing capability. HR Coil's mill scale surface and wider tolerance (±0.3mm) make it unsuitable for automotive panels, appliance enclosures, and precision components." },
      { question: "What thickness range is available for HR vs CR Coil?", answer: "HR Coil is available in 1.6mm–25mm thickness (and thicker as plates). CR Coil is available in 0.15mm–3.0mm thickness. For applications requiring sub-1.6mm flat steel, CR Coil is the only option." },
      { question: "Which coil type is used for pipe manufacturing?", answer: "HR Coil (IS 10748 grade) is the standard feedstock for ERW and spiral welded pipes. CR Coil is used for precision tubes, small-diameter pipes, and cold-drawn seamless tubes where surface finish and dimensional accuracy are critical." },
      { question: "What IS codes apply to HR and CR Coil?", answer: "HR Coil follows IS 2062:2011 (structural) and IS 10748:2004 (tube grades). CR Coil follows IS 513:2018 which specifies grades CR1 through CR5 based on drawing quality. Always specify the applicable IS grade in procurement to ensure correct mechanical properties." }
    ],
    relatedDemandSlug: "hr-coil-india",
    relatedCountrySlug: "japan"
  },
  {
    slug: "ms-plate-vs-hr-sheet",
    title: "MS Plate vs HR Sheet – Technical Comparison, Thickness, Use Cases",
    metaTitle: "MS Plate vs HR Sheet | Thickness, Weight & Application Comparison",
    metaDescription: "Compare MS Plates and HR Sheets on thickness range, weight per sqm, IS 2062 grades, and procurement suitability for fabrication and construction projects.",
    intro: "Mild Steel (MS) Plates and Hot Rolled (HR) Sheets are both flat-rolled products from IS 2062 grade steel, distinguished primarily by thickness. By convention, flat products ≤5mm are classified as sheets, while those >5mm are classified as plates. This distinction impacts procurement specifications, weight calculations, cutting methods, and end-use applications. Understanding this classification is essential for fabricators, EPC contractors, and procurement managers to avoid specification errors and optimize material costs.",
    gradeA: "MS Plate",
    gradeB: "HR Sheet",
    chemicalComposition: {
      headers: ["Property", "MS Plate (≥6mm)", "HR Sheet (≤5mm)"],
      rows: [
        ["Grade", "IS 2062 E250 / SA 516 Gr.70", "IS 2062 E250 / IS 10748"],
        ["Carbon (C)", "0.20–0.22%", "0.15–0.20%"],
        ["Manganese (Mn)", "0.80–1.50%", "0.60–1.20%"],
        ["Thickness Range", "6mm–300mm", "1.6mm–5.0mm"],
        ["Width (typical)", "1250mm–3000mm", "900mm–1500mm"],
        ["Supply Form", "Sheared/flame cut plates", "Coil or sheared sheets"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "MS Plate", "HR Sheet"],
      rows: [
        ["Yield Strength", "250 MPa (E250)", "250 MPa (E250)"],
        ["UTS", "410 MPa min", "410 MPa min"],
        ["Elongation %", "23% min", "23% min"],
        ["Cutting Method", "Gas/plasma/laser cutting", "Shearing/laser/punching"],
        ["Flatness Tolerance", "IS 2062 Table 7", "IS 2062 Table 7"],
        ["Weight per sqm (10mm / 3mm)", "78.5 kg/sqm", "23.6 kg/sqm"]
      ]
    },
    standards: [
      { code: "IS 2062:2011", description: "Hot rolled structural steel" },
      { code: "IS 2002:2009", description: "Steel plates for pressure vessels" },
      { code: "IS 1852:1985", description: "Rolling and cutting tolerances for hot-rolled steel" }
    ],
    standardsExplanation: "Both MS Plates and HR Sheets are manufactured under IS 2062:2011 for structural applications. For pressure vessel applications, plates must comply with IS 2002 or ASTM SA 516 standards with additional impact testing. IS 1852 governs dimensional tolerances for both plates and sheets. For procurement purposes, always specify thickness, width, length, grade, and any special testing requirements (UT, impact, HIC).",
    useCaseDifferences: {
      gradeA: [
        "Heavy fabrication — pressure vessels, tanks, hoppers",
        "Earth-moving equipment — excavator buckets, bulldozer blades",
        "Shipbuilding — hull plates, deck structures",
        "Structural steel bases — column base plates, gusset plates",
        "Wear-resistant applications — chute liners, conveyor beds"
      ],
      gradeB: [
        "Light fabrication — enclosures, panels, covers",
        "HVAC ductwork and ventilation systems",
        "Automotive chassis and bus body building",
        "Storage tanks and silos (thin wall)",
        "Roofing and cladding (corrugated after processing)"
      ]
    },
    priceImplication: "MS Plates in standard thickness (6–25mm) are priced at ₹52,000–60,000/MT for IS 2062 E250 grade. HR Sheets in thinner gauges (1.6–5mm) trade at similar or slightly higher per-tonne rates due to additional rolling passes. However, the per-piece cost of HR Sheets is lower due to lighter weight. For fabrication projects requiring mixed thicknesses, consolidating procurement of plates and sheets from a single source reduces logistics costs and ensures grade consistency.",
    procurementRecommendation: "Specify MS Plates for all applications requiring thickness ≥6mm, including structural fabrication, pressure vessels, and heavy equipment. Specify HR Sheets for applications requiring 1.6–5mm thickness, such as ductwork, light fabrication, and automotive components. Always specify thickness tolerance, edge condition (mill/sheared), and surface quality in RFQ specifications. ProcureSaathi provides integrated sourcing for both plates and sheets from SAIL, JSW, Essar, and Tata Steel.",
    faqs: [
      { question: "What is the thickness cutoff between MS Plate and HR Sheet?", answer: "By industry convention and IS standards, flat products ≤5mm thick are classified as sheets/strips, while those >5mm (typically ≥6mm) are classified as plates. Products at exactly 5mm may be classified as either, depending on the mill and supply form (coil vs. cut-to-length)." },
      { question: "Are MS Plate and HR Sheet the same grade?", answer: "Both can be manufactured from the same IS 2062 E250 grade steel. The difference is in thickness and processing — plates are typically rolled on plate mills and supplied as cut pieces, while sheets may be sourced from hot strip mills and supplied as coils or sheared sheets." },
      { question: "How do I calculate the weight of MS Plate per sqm?", answer: "Weight (kg/sqm) = Thickness (mm) × 7.85. For example, a 10mm MS Plate weighs 78.5 kg/sqm, and a 3mm HR Sheet weighs 23.55 kg/sqm. This formula applies to standard mild steel with density 7,850 kg/m³." },
      { question: "Which is more cost-effective for fabrication?", answer: "For components requiring thickness ≥6mm, MS Plates are the standard and most economical choice. For components ≤5mm, HR Sheets from coil stock offer better yield (less wastage) and lower cutting costs compared to cutting from thicker plates." },
      { question: "Can MS Plates be used for pressure vessels?", answer: "Standard IS 2062 MS Plates can be used for atmospheric storage tanks but NOT for pressure vessels. Pressure vessels require plates conforming to IS 2002, SA 516, or equivalent specifications with mandatory UT testing, impact testing, and mill test certificates showing compliance." }
    ],
    relatedDemandSlug: "ms-plates-india",
    relatedCountrySlug: "china"
  },
  {
    slug: "api-grade-vs-is-2062-steel",
    title: "API Grade vs IS 2062 Steel – Technical Comparison for Pipe & Structural Use",
    metaTitle: "API Grade vs IS 2062 Steel | Pipe vs Structural Steel Comparison",
    metaDescription: "Compare API 5L and IS 2062 steel on mechanical properties, chemical composition, and suitability for oil & gas pipelines vs structural steel applications.",
    intro: "API 5L (American Petroleum Institute) and IS 2062 (Bureau of Indian Standards) represent fundamentally different steel specification systems serving distinct industrial domains. API grades are designed for line pipe in oil, gas, and petrochemical transmission, while IS 2062 covers structural steel for construction and fabrication. Procurement managers sourcing steel for EPC projects — especially those spanning both structural and pipeline scopes — must understand the interchangeability limitations and compliance requirements of each standard.",
    gradeA: "API 5L",
    gradeB: "IS 2062",
    chemicalComposition: {
      headers: ["Element", "API 5L Gr.B (Max %)", "IS 2062 E250 (Max %)"],
      rows: [
        ["Carbon (C)", "0.26", "0.22"],
        ["Manganese (Mn)", "1.20", "1.50"],
        ["Sulphur (S)", "0.030", "0.045"],
        ["Phosphorus (P)", "0.030", "0.045"],
        ["Carbon Equivalent (CE)", "0.45 (IIW)", "0.42"],
        ["Nb + V + Ti", "Restricted for X-grades", "Not specified"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "API 5L Gr.B", "IS 2062 E250"],
      rows: [
        ["Yield Strength (min)", "245 MPa", "250 MPa"],
        ["UTS (min)", "415 MPa", "410 MPa"],
        ["Elongation %", "Per formula (gauge dependent)", "23% min"],
        ["Hydrostatic Test", "Mandatory (per D/t ratio)", "Not required"],
        ["Impact Test (Charpy)", "Required for PSL2", "Sub-grade BR only"],
        ["Weldability", "Qualified per API 1104", "Per IS 816/IS 9595"]
      ]
    },
    standards: [
      { code: "API 5L (46th Ed.)", description: "Specification for line pipe" },
      { code: "IS 2062:2011", description: "Hot rolled medium and high tensile structural steel" },
      { code: "API 1104", description: "Welding of pipelines and related facilities" },
      { code: "ASME B31.3", description: "Process piping" }
    ],
    standardsExplanation: "API 5L specifies two Product Specification Levels: PSL1 (standard quality) and PSL2 (enhanced quality with mandatory Charpy impact testing, CE limits, and traceability). IS 2062 has no equivalent PSL system but uses sub-grades (A, BR, BO) for impact testing requirements. API 5L higher grades (X42, X52, X65, X70) use microalloying (Nb, V, Ti) for controlled rolling — a metallurgical approach not available in IS 2062. IS 2062 steel must NEVER be used as a substitute for API pipe grades in pressurized service.",
    useCaseDifferences: {
      gradeA: [
        "Oil and gas transmission pipelines",
        "Water transmission mains (large diameter)",
        "Refinery and petrochemical process piping",
        "Cross-country and subsea pipelines",
        "CNG/LNG distribution networks"
      ],
      gradeB: [
        "Structural steel frames and trusses",
        "Industrial buildings and warehouses",
        "Bridge construction and infrastructure",
        "Heavy fabrication — tanks, hoppers, equipment",
        "General purpose construction steel"
      ]
    },
    priceImplication: "API 5L pipe grades command a 20–40% premium over IS 2062 structural steel due to stricter chemistry controls, mandatory hydrostatic testing, and third-party inspection requirements. API X-grades (X52 and above) require microalloyed steel from specialized mills, further increasing costs. For EPC projects with both pipeline and structural scopes, separate procurement strategies are essential — API pipe should be sourced from API-licensed mills, while structural steel can leverage broader supplier networks.",
    procurementRecommendation: "Never substitute IS 2062 for API pipe grades in pressurized or pipeline service — this is a safety and compliance violation. For structural supports and non-pressure components in oil & gas facilities, IS 2062 E350 provides adequate mechanical properties at lower cost. When procuring API pipe through ProcureSaathi, always specify: grade (Gr.B/X42/X52 etc.), PSL level, pipe dimensions (OD × WT), coating requirements, and third-party inspection agency.",
    faqs: [
      { question: "Can IS 2062 steel be used for pipelines?", answer: "IS 2062 should NOT be used for pressurized pipelines. It lacks the mandatory hydrostatic testing, controlled chemistry, and quality assurance requirements of API 5L. IS 2062 pipes (structural hollow sections) are suitable only for non-pressure structural applications." },
      { question: "What is the difference between API PSL1 and PSL2?", answer: "PSL1 is standard quality with basic chemical and mechanical requirements. PSL2 adds mandatory Charpy impact testing, tighter CE limits, full material traceability, and stricter manufacturing tolerances. PSL2 is required for sour service (H2S) and offshore pipelines." },
      { question: "Which is stronger — API 5L X52 or IS 2062 E350?", answer: "API 5L X52 has a minimum yield of 360 MPa while IS 2062 E350 requires 350 MPa — nearly equivalent in strength. However, X52 is specifically designed for pipe applications with controlled microstructure, while E350 is optimized for structural sections. They are not interchangeable." },
      { question: "What mills produce API 5L pipe in India?", answer: "Major Indian API pipe producers include Jindal SAW, Welspun Corp, Ratnamani Metals, Maharashtra Seamless, and ISMT. These mills hold API monogram licenses and produce ERW, LSAW, HSAW, and seamless pipes in API grades. ProcureSaathi facilitates competitive sourcing from these mills." },
      { question: "Is API 1104 welding qualification required for structural steel?", answer: "No, API 1104 applies only to pipeline welding. Structural steel welding is governed by IS 816 (metal arc welding) and IS 9595 (welded construction). Using the wrong welding qualification standard is a compliance violation and may void structural warranties." }
    ],
    relatedDemandSlug: "structural-steel-india",
    relatedCountrySlug: "usa"
  },
  {
    slug: "erw-pipe-vs-seamless-pipe",
    title: "ERW Pipe vs Seamless Pipe – Technical Comparison, Standards, Use Cases",
    metaTitle: "ERW vs Seamless Pipe | Manufacturing, Strength & Cost Comparison",
    metaDescription: "Compare ERW and seamless steel pipes on weld integrity, pressure rating, IS and API standards, and procurement for oil & gas, structural, and industrial use.",
    intro: "Electric Resistance Welded (ERW) and Seamless pipes represent two fundamentally different manufacturing processes with distinct pressure capabilities, cost structures, and application domains. ERW pipes are formed from flat strip/coil and seam-welded, while seamless pipes are produced by piercing a solid billet — eliminating any weld seam. This comparison is essential for procurement managers in oil & gas, power, process, and structural industries where pipe selection impacts safety, compliance, and cost.",
    gradeA: "ERW Pipe",
    gradeB: "Seamless Pipe",
    chemicalComposition: {
      headers: ["Property", "ERW Pipe", "Seamless Pipe"],
      rows: [
        ["Manufacturing Method", "Coil → forming → HF welding", "Billet → piercing → rolling"],
        ["Weld Seam", "Longitudinal weld present", "No weld seam"],
        ["Raw Material", "HR Coil / Strip (IS 10748)", "Round billets / blooms"],
        ["OD Range (typical)", "21mm–610mm", "15mm–660mm"],
        ["Wall Thickness", "1.0mm–16mm", "2.5mm–75mm"],
        ["Length (standard)", "6m / 12m random", "5–12m random"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "ERW Pipe", "Seamless Pipe"],
      rows: [
        ["Yield Strength (API Gr.B)", "245 MPa min", "245 MPa min"],
        ["UTS (API Gr.B)", "415 MPa min", "415 MPa min"],
        ["Hydrostatic Test Pressure", "Lower (per D/t and seam factor)", "Higher (no seam derating)"],
        ["Seam Factor (ASME B31.3)", "0.85 (EW)", "1.00"],
        ["Weld Integrity Test", "NDT mandatory on weld seam", "Full body UT optional"],
        ["Fatigue Resistance", "Lower (weld is weak point)", "Superior"]
      ]
    },
    standards: [
      { code: "IS 3589:2001", description: "ERW steel pipes for water and sewage" },
      { code: "IS 1239:2004", description: "Mild steel tubes, tubulars, and fittings" },
      { code: "API 5L", description: "Specification for line pipe" },
      { code: "ASTM A106", description: "Seamless carbon steel pipe for high-temperature service" },
      { code: "IS 1161:2014", description: "Steel tubes for structural purposes" }
    ],
    standardsExplanation: "ERW pipes for structural use follow IS 1161 (structural) or IS 3589 (water). For process piping, ERW pipes are manufactured to API 5L or ASTM A53 Type E. Seamless pipes follow API 5L (line pipe), ASTM A106 (high temperature), ASTM A333 (low temperature), or IS 1239 (general purpose). The seam factor in ASME B31.3 derate ERW pipe allowable pressure by 15% compared to seamless — a critical consideration in pressure system design.",
    useCaseDifferences: {
      gradeA: [
        "Water and sewage transmission (IS 3589)",
        "Structural hollow sections — columns, trusses (IS 1161)",
        "Low-pressure gas distribution",
        "Fire hydrant and sprinkler systems",
        "Scaffolding and general purpose tubing"
      ],
      gradeB: [
        "Oil & gas production and transmission pipelines",
        "High-pressure process piping in refineries",
        "Boiler tubes and heat exchanger tubing",
        "Hydraulic cylinders and precision instruments",
        "Subsea and downhole applications"
      ]
    },
    priceImplication: "Seamless pipe costs 30–60% more than ERW pipe in equivalent sizes and grades due to the billet-based manufacturing process, lower yield, and additional finishing operations. A 6\" seamless pipe may cost ₹85,000–95,000/MT compared to ₹55,000–65,000/MT for ERW equivalent. However, seamless pipe's higher allowable pressure (seam factor 1.0 vs 0.85) may allow thinner wall selection, partially offsetting the cost premium in high-pressure applications.",
    procurementRecommendation: "Use ERW pipe for structural, water, low-pressure, and general industrial applications where cost efficiency is paramount. Use seamless pipe for high-pressure, high-temperature, critical-service, and sour-service applications where weld seam integrity is a concern. Never substitute ERW for seamless in boiler, nuclear, or subsea applications. When sourcing through ProcureSaathi, specify pipe standard, grade, size schedule, and testing requirements for accurate mill quotations.",
    faqs: [
      { question: "Is ERW pipe safe for gas pipelines?", answer: "ERW pipe is used for gas distribution (low/medium pressure) per API 5L. However, for high-pressure gas transmission pipelines, seamless or LSAW pipe is preferred due to the seam factor derating. Always verify design pressure against the pipe's derated allowable pressure using ASME B31.8." },
      { question: "Why is seamless pipe more expensive than ERW?", answer: "Seamless pipe is manufactured from solid steel billets through piercing and rolling — a more complex, lower-yield process than ERW's coil-forming-welding method. Additionally, seamless pipe requires more post-production testing and has higher raw material costs." },
      { question: "What is the seam factor in ASME B31.3?", answer: "The seam factor (E) is a derating multiplier applied to pipe allowable stress based on manufacturing method. Seamless pipe has E=1.00 (no derating), ERW has E=0.85, and furnace-butt-welded pipe has E=0.60. This directly impacts the maximum allowable working pressure." },
      { question: "Can ERW pipe be used for boilers?", answer: "Standard ERW pipe should not be used for boiler applications. Boiler tubes must comply with IBR (Indian Boiler Regulations) or ASME standards, which typically require seamless manufacture (ASTM A106/SA 106 or equivalent). Only seamless tubes with IBR certification should be used in pressure parts." },
      { question: "Which type is better for structural applications?", answer: "ERW pipe (IS 1161) is the standard and most cost-effective choice for structural hollow sections — columns, trusses, and frames. Seamless pipe is overspecified and uneconomical for structural applications where internal pressure is not a factor." }
    ],
    relatedDemandSlug: "structural-steel-india",
    relatedCountrySlug: "saudi-arabia"
  },
  {
    slug: "structural-steel-vs-tmt-bars",
    title: "Structural Steel vs TMT Bars – Use Case Difference, Strength, Applications",
    metaTitle: "Structural Steel vs TMT Bars | When to Use Each in Construction",
    metaDescription: "Compare structural steel (IS 2062) and TMT bars (IS 1786) on strength, applications, and procurement for RCC vs steel-frame construction projects.",
    intro: "Structural Steel (IS 2062) and TMT Bars (IS 1786) are both essential construction materials but serve fundamentally different structural roles. Structural steel forms the primary load-bearing frame in steel-frame construction — beams, columns, trusses — while TMT bars provide tensile reinforcement within concrete in RCC (Reinforced Cement Concrete) construction. Understanding when to specify each material is critical for EPC contractors, structural consultants, and procurement heads managing mixed-construction projects.",
    gradeA: "Structural Steel",
    gradeB: "TMT Bars",
    chemicalComposition: {
      headers: ["Property", "Structural Steel (E250)", "TMT Bar (Fe 500D)"],
      rows: [
        ["IS Standard", "IS 2062:2011", "IS 1786:2008"],
        ["Carbon (C) Max", "0.22%", "0.25%"],
        ["Manganese (Mn) Max", "1.50%", "Not specified (controlled)"],
        ["Sulphur + Phosphorus", "0.090% combined", "0.075% combined"],
        ["Product Forms", "Beams, channels, angles, plates", "Deformed bars (6mm–40mm dia)"],
        ["Manufacturing Process", "Hot rolling from billets/blooms", "TMT quenching after hot rolling"]
      ]
    },
    mechanicalProperties: {
      headers: ["Property", "Structural Steel (E250)", "TMT Bar (Fe 500D)"],
      rows: [
        ["Yield Strength", "250 MPa", "500 MPa"],
        ["UTS", "410 MPa min", "565 MPa min"],
        ["Elongation %", "23%", "16%"],
        ["Primary Function", "Carries compressive + bending loads", "Resists tensile forces in concrete"],
        ["Connection Method", "Bolted / Welded joints", "Lap splice / Mechanical coupler / Weld"],
        ["Fire Resistance", "Requires fire protection", "Concrete provides fire cover"]
      ]
    },
    standards: [
      { code: "IS 2062:2011", description: "Structural steel specification" },
      { code: "IS 1786:2008", description: "TMT bar specification" },
      { code: "IS 800:2007", description: "Steel structure design code" },
      { code: "IS 456:2000", description: "RCC design code" }
    ],
    standardsExplanation: "Structural steel design follows IS 800:2007 (limit state method), while RCC design with TMT reinforcement follows IS 456:2000. These are fundamentally different design philosophies. IS 800 deals with member stability, connection design, and fatigue in exposed steel frames. IS 456 addresses concrete strength, reinforcement detailing, durability, and cover requirements. Most modern EPC projects use hybrid construction — steel frames with RCC slabs — requiring procurement of both material types.",
    useCaseDifferences: {
      gradeA: [
        "Pre-engineered buildings (PEB) and metal building systems",
        "Industrial sheds and warehouse structures",
        "Multi-story steel frame buildings",
        "Bridge girders and truss structures",
        "Transmission towers and communication masts"
      ],
      gradeB: [
        "RCC residential buildings (G+3 to high-rise)",
        "Foundation systems — pile caps, rafts, footings",
        "Retaining walls and underground structures",
        "RCC bridges — deck, pier, abutment reinforcement",
        "Water tanks, silos, and containment structures"
      ]
    },
    priceImplication: "Structural steel (sections) costs ₹55,000–70,000/MT including fabrication, while TMT bars cost ₹48,000–58,000/MT. However, the total structural cost comparison depends on the construction system. Steel-frame buildings have 15–20% lighter foundations due to lower dead weight, faster construction timelines (30–40% faster than RCC), and easier future modification. RCC structures offer lower per-sqft material cost for standard residential buildings, better fire resistance without additional protection, and longer design life for aggressive environments.",
    procurementRecommendation: "For industrial sheds, warehouses, and buildings requiring speed and flexibility, structural steel is the preferred system. For residential high-rises, foundations, and structures in aggressive environments, RCC with TMT reinforcement is standard. Most large EPC projects require both — structural steel for the superstructure and TMT bars for foundations and concrete elements. ProcureSaathi enables consolidated procurement of both categories from verified mills with synchronized delivery scheduling.",
    faqs: [
      { question: "Which is stronger — structural steel or TMT bars?", answer: "TMT Fe 500D has higher yield strength (500 MPa) than structural E250 (250 MPa), but they serve different purposes. Structural steel carries loads as standalone members, while TMT bars reinforce concrete. Comparing their strengths directly is misleading — it's the structural system (steel frame vs RCC) that determines overall building capacity." },
      { question: "Can TMT bars be used as structural members?", answer: "TMT bars are designed exclusively as reinforcement within concrete and should never be used as standalone structural members. They lack the cross-sectional properties (moment of inertia, section modulus) required for bending and buckling resistance. Structural steel sections (ISMB, ISHB, ISA) are designed for this purpose." },
      { question: "Which is more economical for industrial buildings?", answer: "Structural steel (PEB/conventional steel) is typically more economical for industrial buildings due to faster construction (30–40% time saving), lighter foundations, clear span capability, and ease of future expansion. RCC industrial buildings are heavier, require more formwork, and limit future layout modifications." },
      { question: "Is structural steel fireproof?", answer: "No, structural steel loses about 50% of its strength at 550°C and requires fire protection — either intumescent coatings (2 hour rating) or cementitious sprays. RCC structures benefit from concrete cover providing inherent fire resistance, typically rated at 1–4 hours depending on cover thickness." },
      { question: "What is hybrid construction?", answer: "Hybrid construction combines structural steel frames (columns, beams) with RCC elements (slabs, foundations, shear walls). This approach leverages the speed and flexibility of steel with the fire resistance and vibration dampening of concrete. Most modern commercial and institutional buildings use hybrid systems, requiring procurement of both structural steel and TMT bars." }
    ],
    relatedDemandSlug: "structural-steel-india",
    relatedCountrySlug: "vietnam"
  }
];
