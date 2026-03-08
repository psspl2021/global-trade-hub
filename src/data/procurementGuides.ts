/**
 * Module 5: Procurement Guide Authority Pages
 * Registry of long-form procurement guides (2500+ words each).
 */

export interface GuideSection {
  title: string;
  content: string;
}

export interface ProcurementGuide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  heroIntro: string;
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
  relatedDemandSlugs: string[];
  relatedGuideSlugs: string[];
}

export const procurementGuides: ProcurementGuide[] = [
  {
    slug: 'steel-procurement-india',
    title: 'Complete Guide to Steel Procurement in India',
    metaTitle: 'Steel Procurement in India – Complete Buyer\'s Guide 2026 | ProcureSaathi',
    metaDescription: 'Comprehensive guide to procuring steel in India covering grades, pricing, supplier selection, import options, and compliance requirements for industrial buyers.',
    category: 'Metals',
    heroIntro: 'Steel procurement in India is a complex, high-value process that requires deep understanding of grades, standards, pricing dynamics, supplier landscapes, and logistics infrastructure. This guide is designed for procurement heads, project managers, and sourcing professionals involved in steel buying for construction, manufacturing, infrastructure, and industrial applications. Whether you are sourcing HR Coils for automotive manufacturing, TMT bars for construction, or structural steel for infrastructure projects, this guide provides the actionable intelligence you need to optimize your procurement strategy.',
    sections: [
      {
        title: 'Market Overview',
        content: `India is the world's second-largest steel producer, with crude steel production exceeding 140 million tonnes annually. The domestic steel industry is dominated by major producers including Tata Steel, JSW Steel, SAIL, JSPL, and AMNS India. The market is segmented into flat products (HR Coil, CR Coil, Galvanized Steel) and long products (TMT Bars, Structural Steel, Wire Rods).

Steel pricing in India is influenced by multiple factors: raw material costs (iron ore, coking coal), international benchmark prices, domestic demand-supply dynamics, government policy interventions (safeguard duties, quality control orders), and seasonal construction activity cycles.

For procurement professionals, understanding these dynamics is essential for timing purchases, negotiating with suppliers, and managing inventory costs. The Indian steel market has become increasingly transparent with the introduction of managed procurement platforms like ProcureSaathi, which provide real-time pricing intelligence and verified supplier networks.

Key market trends to watch include: increasing adoption of high-strength grades (Fe 500D, E350) driven by infrastructure projects; growing import substitution through quality control orders; rising demand for coated steel products for industrial roofing and construction; and the shift towards managed procurement from traditional broker-based sourcing.`
      },
      {
        title: 'Procurement Process',
        content: `The steel procurement process in India typically follows these stages:

1. **Requirement Definition:** Clearly specify grade, thickness/diameter, quantity, delivery schedule, and quality requirements. Include IS/BIS/ASTM standards compliance needs and any special testing requirements (e.g., third-party inspection, specific mechanical property thresholds).

2. **Supplier Identification:** Identify potential suppliers from multiple channels: direct mill sourcing, authorized distributors, secondary steel market, and import corridors. ProcureSaathi's AI verification engine evaluates suppliers across financial health, quality history, capacity, and compliance parameters.

3. **RFQ & Bidding:** Issue Request for Quotation (RFQ) to shortlisted suppliers. Sealed bidding ensures competitive pricing while maintaining supplier confidentiality. Evaluate bids on total cost of ownership including material price, logistics, quality assurance costs, and payment terms.

4. **Negotiation & Contracting:** Negotiate final pricing, delivery milestones, quality guarantees, rejection/replacement terms, and payment conditions. Framework agreements for repeat procurement enable stable pricing and assured supply.

5. **Order Execution:** Monitor production schedules, arrange quality inspection, coordinate logistics, and track delivery. ProcureSaathi's managed procurement model handles end-to-end execution from order placement to site delivery.

6. **Quality Verification:** Verify mill test certificates, conduct dimensional checks, and perform third-party testing for critical applications. Maintain documentation trail for audit compliance.

7. **Payment & Reconciliation:** Process payments per agreed terms, reconcile quantities against delivery challans, and close procurement cycle with complete documentation.`
      },
      {
        title: 'Supplier Selection',
        content: `Effective supplier selection is the cornerstone of successful steel procurement. Key evaluation criteria include:

**Production Capacity:** Assess the supplier's annual production capacity relative to your order volume. Preferred suppliers should have capacity headroom of at least 2x your order requirement to ensure delivery reliability.

**Quality Certification:** Verify BIS certification (ISI mark), ISO 9001 quality management systems, and specific product certifications. For specialized applications, look for NABL-accredited testing laboratory affiliations.

**Financial Stability:** Evaluate financial health through credit reports, GST compliance history, and payment track record. Financially unstable suppliers pose delivery and quality risks.

**Delivery Reliability:** Track historical on-time delivery performance. Late deliveries can cascade into project delays, penalty charges, and production disruptions.

**Geographic Proximity:** Proximity to delivery location reduces logistics costs and transit time. Consider multiple sourcing points for pan-India requirements.

**Price Competitiveness:** Compare pricing across multiple suppliers, adjusted for quality, delivery terms, and payment conditions. The lowest price is not always the best value.

ProcureSaathi's AI-driven supplier matching engine evaluates all these parameters automatically, providing buyers with pre-verified supplier recommendations ranked by overall procurement value rather than price alone.`
      },
      {
        title: 'Import Regulations',
        content: `Steel imports into India are subject to several regulatory requirements:

**Bureau of Indian Standards (BIS):** Quality Control Orders (QCOs) mandate BIS certification for 144+ steel products imported into India. Importers must obtain a BIS registration for each product category and ensure every consignment carries the ISI mark.

**Customs Duty:** Basic customs duty on most steel products ranges from 7.5% to 12.5%. Social Welfare Surcharge of 10% on basic duty applies. GST at 18% is charged on CIF value plus customs duty.

**Anti-Dumping Duty:** India has active anti-dumping duties on certain steel products from specific countries including China, Japan, South Korea, Brazil, Russia, and Indonesia. Rates vary by product and origin country.

**Safeguard Duty:** Periodically imposed to protect domestic industry from import surges. Currently applicable on certain flat steel products.

**Import Documentation:** Required documents include commercial invoice, packing list, bill of lading, certificate of origin, mill test certificate, BIS registration certificate, and inspection certificate from an approved agency.

ProcureSaathi's import intelligence module provides real-time duty calculation, compliance documentation support, and port clearance coordination for steel imports from all major source countries.`
      },
      {
        title: 'Cost Optimization Strategies',
        content: `Optimizing steel procurement costs requires a multi-dimensional approach:

**Volume Consolidation:** Aggregate requirements across multiple projects or delivery locations to qualify for volume discounts. Framework agreements with annual volume commitments can secure 2–5% savings over spot purchases.

**Strategic Timing:** Monitor market price cycles and seasonal demand patterns. Steel prices typically soften during monsoon months (July–September) when construction activity slows, offering procurement windows at lower prices.

**Import-Domestic Arbitrage:** Compare landed cost of imports against domestic prices. Currency fluctuations, duty changes, and international price movements create periodic arbitrage opportunities that informed buyers can exploit.

**Grade Optimization:** Avoid over-specification by matching grade to actual application requirements. Using Fe 500D TMT bars where Fe 415 would suffice increases material cost by 5–8% without proportional value.

**Logistics Optimization:** Optimize logistics by consolidating shipments, selecting nearest supplier sources, and negotiating freight rates. Rail transport for distances over 500 km can save 15–25% compared to road transport for steel products.

**Payment Term Negotiation:** Extended payment terms (30-60-90 day credit) have an inherent cost. Compare supplier credit pricing against your actual cost of capital to determine optimal payment structures.

ProcureSaathi's procurement intelligence engine automatically identifies these optimization opportunities and factors them into supplier recommendations and bid evaluations.`
      }
    ],
    faqs: [
      { question: 'What is the minimum order quantity for steel procurement?', answer: 'Minimum order quantities vary by product and supplier. For flat products like HR Coils, typical MOQ is 20-50 MT. For long products like TMT bars, MOQ can be as low as 5-10 MT from distributors. ProcureSaathi helps consolidate smaller requirements to access mill-direct pricing.' },
      { question: 'How long does steel delivery take in India?', answer: 'Domestic deliveries typically take 7-21 days depending on product availability, supplier location, and transport mode. Import shipments take 30-60 days from order confirmation to site delivery including port clearance.' },
      { question: 'What certifications should I verify for steel suppliers?', answer: 'Key certifications include BIS/ISI certification, ISO 9001 quality management, GST registration, and product-specific QCO compliance. For exports, verify ISO 14001, OHSAS 18001, and relevant international standard compliance.' },
    ],
    relatedDemandSlugs: ['hr-coil-india', 'cr-coil-india', 'tmt-bars-india', 'ms-plates-india', 'structural-steel-india', 'galvanized-coils-india'],
    relatedGuideSlugs: ['import-steel-from-vietnam', 'polymer-procurement-guide'],
  },
  {
    slug: 'import-steel-from-vietnam',
    title: 'How to Import Steel from Vietnam to India – Complete Guide',
    metaTitle: 'Import Steel from Vietnam to India | Procurement Guide 2026 | ProcureSaathi',
    metaDescription: 'Step-by-step guide to importing steel from Vietnam to India. Covers suppliers, duty structures, BIS compliance, logistics, and cost optimization for industrial buyers.',
    category: 'Import',
    heroIntro: 'Vietnam has emerged as a strategic steel sourcing corridor for Indian buyers, offering competitive pricing on HR Coils, CR Coils, galvanized steel, and steel pipes. With growing production capacity from Formosa Ha Tinh Steel, Hoa Phat Group, and Vietnam Steel Corporation, the country now produces over 30 million tonnes annually. This guide provides Indian procurement professionals with everything they need to source steel from Vietnam efficiently and compliantly.',
    sections: [
      {
        title: 'Market Overview',
        content: `Vietnam's steel industry has undergone rapid transformation, evolving from a net importer to a significant exporter in the Asia-Pacific region. The commissioning of Formosa Ha Tinh's integrated steel complex (annual capacity 22 million tonnes) fundamentally changed the regional supply dynamics.

For Indian buyers, Vietnam offers several advantages: competitive pricing (typically 5-12% below domestic Indian prices for certain grades), consistent quality aligned with international standards, shorter lead times compared to China due to proximity and smaller lot flexibility, and no anti-dumping duties on most product categories.

Key steel products available from Vietnam include HR Coils (IS2062 equivalent grades), CR Coils, Galvanized Steel, Steel Wire Rods, and Construction Steel. Most Vietnamese mills produce to JIS, ASTM, and EN standards, which can be correlated to Indian IS standards for procurement purposes.

The bilateral trade relationship benefits from the ASEAN-India Free Trade Agreement (AIFTA), which provides preferential duty rates for qualifying products with proper Certificate of Origin documentation.`
      },
      {
        title: 'Procurement Process',
        content: `Importing steel from Vietnam requires careful attention to regulatory compliance and logistics planning:

1. **Supplier Identification:** Research and shortlist Vietnamese steel manufacturers and trading companies. ProcureSaathi maintains a verified Vietnamese supplier directory with production capacity data, quality certifications, and export track records.

2. **BIS Registration:** Ensure the Vietnamese manufacturer has valid BIS registration for the specific product categories under Quality Control Orders. Without this, steel imports cannot clear Indian customs.

3. **Sample Testing:** Before committing to bulk orders, procure test samples for verification against your technical specifications. Conduct chemical and mechanical testing per IS standards.

4. **Commercial Negotiation:** Negotiate FOB/CFR/CIF pricing, payment terms (typically 30-90 day LC or TT), quality guarantees, and rejection/replacement terms.

5. **Documentation:** Prepare all required import documentation including commercial invoice, packing list, bill of lading, certificate of origin (for AIFTA preferential duty), BIS certificate, and mill test certificates.

6. **Pre-Shipment Inspection:** Arrange pre-shipment inspection (PSI) through an approved agency to verify quality and quantity before the vessel loads.

7. **Logistics & Customs:** Coordinate shipping (typically 7-12 days from Ho Chi Minh/Hai Phong to Indian ports), customs clearance, and inland logistics.`
      },
      {
        title: 'Supplier Selection',
        content: `The Vietnamese steel supplier landscape includes integrated mills, re-rolling mills, and trading companies. Key suppliers include:

**Integrated Producers:** Formosa Ha Tinh Steel (HR Coil, CR Coil, flat products), Hoa Phat Group (construction steel, HR Coil), and Pomina Steel (long products). These mills offer consistent quality with full MTC documentation and international standard compliance.

**Selection Criteria for Vietnamese Suppliers:**
- Valid BIS registration for target product categories
- Export track record to India (check past shipment records)
- Quality management certification (ISO 9001 minimum)
- Production capacity vs your requirement volume
- Financial stability and LC acceptance capability
- English language commercial documentation capability

**Red Flags:** Suppliers unable to provide BIS certificate, those offering significantly below-market pricing, and trading companies without verified mill relationships.`
      },
      {
        title: 'Import Regulations',
        content: `**Customs Duty Structure (Vietnam to India):**
- Basic Customs Duty: 7.5-12.5% (standard) or reduced rate under AIFTA (typically 0-5% with Certificate of Origin)
- Social Welfare Surcharge: 10% on basic duty
- IGST: 18% on assessable value + duty
- Anti-Dumping Duty: Currently nil on most Vietnamese steel products (verify current notifications)

**BIS Quality Control Order:**
All steel products covered under QCOs must carry valid BIS registration. The Vietnamese manufacturer must obtain this directly from BIS India. Products without BIS registration will be held at port and may be re-exported.

**Certificate of Origin (COO):**
To claim preferential AIFTA duty rates, the shipment must be accompanied by a COO issued by authorized Vietnamese chambers of commerce. The COO must be in the prescribed format with correct HS code classification.

**Port of Entry:**
Major Indian ports for Vietnamese steel imports include JNPT (Mumbai), Mundra, Chennai, Vizag, and Kolkata. Port selection impacts customs processing time and inland logistics cost.`
      },
      {
        title: 'Cost Optimization Strategies',
        content: `**FOB vs CIF Pricing:** Vietnamese mills typically quote FOB Ho Chi Minh City or Hai Phong. For Indian buyers, negotiating CFR or CIF terms simplifies logistics but may cost 2-5% more than arranging own shipping. For regular volumes, establishing freight contracts directly with shipping lines can reduce logistics costs by 10-15%.

**Volume Consolidation:** Combining orders from multiple Vietnamese mills into full container loads (FCL) reduces per-tonne freight costs. For smaller quantities, LCL consolidation services are available at Hai Phong and Ho Chi Minh ports.

**AIFTA Duty Benefits:** Ensure all documentation for preferential duty claims is properly prepared. Incorrect or incomplete COO documentation results in full duty assessment, erasing the cost advantage of Vietnamese sourcing.

**Currency Management:** Steel transactions with Vietnam are typically in USD. Monitor VND/USD and INR/USD exchange rates to optimize purchase timing. Forward contracts can hedge currency risk for large orders.

**Quality Cost Prevention:** Investing in pre-shipment inspection (PSI) costs $500-1500 per shipment but prevents costly rejection at Indian ports. Quality non-conformance discovered after customs clearance has limited legal remedy.

ProcureSaathi's import intelligence module provides end-to-end cost modeling including all duties, logistics, inspection, and handling charges to give buyers accurate landed cost comparisons before committing to import purchases.`
      }
    ],
    faqs: [
      { question: 'Is there anti-dumping duty on steel from Vietnam?', answer: 'Currently, most Vietnamese steel products are not subject to anti-dumping duties in India. However, this is subject to periodic review by the Directorate General of Trade Remedies (DGTR). Always verify current duty status before placing import orders.' },
      { question: 'How long does shipping from Vietnam to India take?', answer: 'Sea freight from Ho Chi Minh City or Hai Phong to major Indian ports typically takes 7-12 days. Adding customs clearance and inland logistics, total lead time is approximately 15-25 days from vessel loading to site delivery.' },
      { question: 'Can I import steel from Vietnam without BIS certification?', answer: 'No. Steel products covered under Quality Control Orders must have valid BIS registration. Importing without BIS certification will result in goods being held at the port and potentially re-exported at the importer\'s cost.' },
    ],
    relatedDemandSlugs: ['hr-coil-india', 'cr-coil-india', 'galvanized-coils-india'],
    relatedGuideSlugs: ['steel-procurement-india', 'polymer-procurement-guide'],
  },
  {
    slug: 'polymer-procurement-guide',
    title: 'Polymer & Resin Procurement Guide for Indian Industries',
    metaTitle: 'Polymer Procurement Guide India | PP, PE, PVC Sourcing | ProcureSaathi',
    metaDescription: 'Comprehensive guide to procuring polymers and resins in India. Covers PP, PE, PVC, HDPE grades, pricing, supplier landscape, and import strategies for industrial buyers.',
    category: 'Polymers',
    heroIntro: 'The Indian polymer market is one of the fastest-growing globally, driven by demand from packaging, automotive, construction, agriculture, and consumer goods sectors. With domestic production capacity of over 15 million tonnes and imports exceeding 5 million tonnes annually, effective polymer procurement requires deep understanding of grades, pricing mechanisms, supplier dynamics, and quality parameters. This guide equips procurement professionals with actionable intelligence for sourcing polypropylene (PP), polyethylene (PE), PVC, and engineering plastics in India.',
    sections: [
      {
        title: 'Market Overview',
        content: `India's polymer consumption has grown at a CAGR of 8-10% over the past decade, outpacing global averages. Major domestic producers include Reliance Industries (largest private sector refiner and polymer producer globally), Indian Oil Corporation (IOCL), GAIL, Haldia Petrochemicals, and ONGC Petro-additions Limited (OPaL).

The polymer market is segmented into commodity polymers (PP, PE, PVC – accounting for 85% of consumption) and engineering plastics (ABS, Polycarbonate, Nylon – 15%). Commodity polymer pricing is closely linked to crude oil and naphtha prices, creating significant price volatility that procurement teams must manage.

Key market dynamics include: the growing shift from metal and glass to plastics in automotive and packaging; increasing use of HDPE and PVC in infrastructure (water supply, gas distribution); government policies promoting domestic manufacturing (PLI scheme for petrochemicals); and import dependence for specialty grades and engineering plastics.

Understanding the relationship between crude oil prices, naphtha feedstock costs, and polymer pricing is essential for procurement timing and cost management. ProcureSaathi's polymer intelligence module tracks these correlations and provides procurement timing recommendations.`
      },
      {
        title: 'Procurement Process',
        content: `Polymer procurement follows a structured process adapted to the unique characteristics of the plastics industry:

1. **Grade Selection:** Polymers have hundreds of grades optimized for specific applications. Specify the exact grade, MFI (Melt Flow Index), additives, colour requirements, and end-use application. Incorrect grade selection leads to processing failures and product quality issues.

2. **Quantity Planning:** Balance inventory holding costs against price volatility. For commodity polymers, maintaining 2-4 weeks safety stock is standard. For specialty grades with longer lead times, 4-8 weeks stock may be required.

3. **Supplier Sourcing:** Identify sources from primary producers (IPCL, RIL, IOCL), authorized distributors, and import channels. Each source has different pricing, credit terms, and minimum order requirements.

4. **Price Benchmarking:** Monitor domestic price lists published by major producers (updated weekly/fortnightly), import parity pricing, and secondary market rates. ProcureSaathi aggregates these data points for real-time benchmarking.

5. **Quality Assurance:** Verify grade compliance through MFI testing, density measurement, and processing trials. Maintain Approved Supplier List (ASL) based on historical quality performance.

6. **Logistics Management:** Polymer logistics require covered transport (moisture protection), proper stacking (prevent pellet damage), and FIFO inventory management to prevent degradation.`
      },
      {
        title: 'Supplier Selection',
        content: `The polymer supplier landscape in India includes:

**Primary Producers:** Reliance Industries, IOCL, GAIL, Haldia Petrochemicals, OPaL, and Supreme Petrochemicals. Direct procurement from producers offers the best pricing but requires larger order quantities (typically 20+ MT) and advance payment or LC terms.

**Authorized Distributors:** Channel partners of primary producers who offer smaller lot sizes, credit terms, and local inventory. Pricing is typically 2-5% above direct producer prices but offers flexibility and working capital benefits.

**Import Sources:** Middle Eastern producers (SABIC, Borouge, QAPCO), Southeast Asian suppliers, and European specialty producers. Import sourcing is viable for grades not produced domestically and when import parity is favourable.

**Selection Criteria:**
- Grade availability and consistency
- Pricing competitiveness and terms
- Delivery reliability and lead time
- Credit terms and financial flexibility
- Technical support for processing issues
- Regulatory compliance (BIS, FSSAI for food-grade)

ProcureSaathi's polymer supplier network includes verified producers, distributors, and importers, providing buyers with multi-source options for every grade requirement.`
      },
      {
        title: 'Import Regulations',
        content: `**Customs Duty on Polymer Imports:**
- Basic Customs Duty: 7.5% (commodity polymers) to 10% (engineering plastics)
- Social Welfare Surcharge: 10% on basic duty
- IGST: 18% on CIF + duty
- Preferential rates available under FTAs with ASEAN, South Korea, Japan, and UAE

**BIS Certification:** Quality Control Orders apply to select polymer grades including PVC resin, HDPE pipes, and certain PE grades. Verify current QCO applicability before importing.

**FSSAI Compliance:** Polymers used in food contact applications must comply with FSSAI regulations on migration limits and approved additives. Additional testing and certification required for food-grade applications.

**Antidumping Duties:** India maintains anti-dumping duties on certain polymer products from specific countries. Verify current DGTR notifications for the specific grade and origin country.

**Documentation:** Import requires commercial invoice, packing list, bill of lading, certificate of origin, grade specification sheet, MSDS (Material Safety Data Sheet), and applicable quality certifications.`
      },
      {
        title: 'Cost Optimization Strategies',
        content: `**Feedstock-Based Timing:** Polymer prices follow crude oil and naphtha trends with a 2-4 week lag. Monitoring crude oil futures provides advance signals for procurement timing. Build inventory during price troughs and minimize purchases during upswings.

**Producer vs Distributor Analysis:** For regular consumption above 20 MT/month, direct producer sourcing saves 2-5% over distributor pricing. For intermittent requirements or multiple grade needs, distributor sourcing offers flexibility.

**Import Substitution Review:** Periodically compare domestic pricing against import landed costs. For standard grades, import arbitrage windows open 3-4 times annually when international prices drop below domestic parity.

**Grade Rationalization:** Review your grade portfolio to identify consolidation opportunities. Reducing 10 grades to 6-7 through reformulation can improve procurement leverage and reduce inventory complexity.

**Consignment Stocking:** Negotiate consignment stock arrangements with key suppliers where inventory is held at your warehouse but paid for only upon consumption. This reduces working capital while ensuring supply security.

**Long-Term Contracts:** Annual or semi-annual volume commitments with formula-based pricing (linked to naphtha or international benchmarks) provide price predictability and supply assurance.

ProcureSaathi's AI-powered procurement engine optimizes these strategies automatically, monitoring market signals and recommending optimal purchase timing and sourcing mix for each grade.`
      }
    ],
    faqs: [
      { question: 'What is MFI and why is it important in polymer procurement?', answer: 'Melt Flow Index (MFI) measures a polymer\'s viscosity and flowability at a specific temperature and load. It determines processability in injection moulding, extrusion, and blow moulding. Specifying the correct MFI range is critical – too high leads to weak products, too low causes processing difficulties.' },
      { question: 'How are polymer prices determined in India?', answer: 'Domestic polymer prices are set by producers based on international benchmarks (crude oil, naphtha), production costs, and demand-supply dynamics. Major producers publish price lists weekly or fortnightly. Market prices may differ from list prices based on demand conditions.' },
      { question: 'Can I source food-grade polymers through ProcureSaathi?', answer: 'Yes. ProcureSaathi sources food-grade polymers (PP, PE, PET) from FSSAI-compliant manufacturers with full migration testing reports and regulatory documentation. All food-contact grades undergo additional verification.' },
    ],
    relatedDemandSlugs: ['polypropylene-pp-india', 'polyethylene-pe-india', 'pvc-resin-india', 'hdpe-granules-india', 'pet-resin-india'],
    relatedGuideSlugs: ['steel-procurement-india', 'import-steel-from-vietnam'],
  },
];

export function getGuideBySlug(slug: string): ProcurementGuide | undefined {
  return procurementGuides.find(g => g.slug === slug);
}
