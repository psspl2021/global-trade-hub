/**
 * 100 High-Intent SEO Landing Pages
 * Keyword-driven procurement pages mapped to reverse auction funnel.
 * Each page targets a specific buyer-intent search query.
 */

export interface HighIntentPage {
  slug: string;
  keyword: string;
  title: string;
  metaDescription: string;
  h1: string;
  category: string;
  categorySlug: string;
  intro: string;
  problemPoints: string[];
  solution: string;
  benefits: string[];
  howItWorks: string[];
  trustPoints: string[];
  ctaPrimary: string;
  ctaSecondary: string;
  relatedSlugs: string[];
}

function toSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

interface RawKeyword {
  keyword: string;
  category: string;
  categorySlug: string;
}

const rawKeywords: RawKeyword[] = [
  // Metals
  { keyword: "steel procurement india", category: "Metals", categorySlug: "metals" },
  { keyword: "tmt bars bulk purchase india", category: "Metals", categorySlug: "metals" },
  { keyword: "hr coil suppliers india", category: "Metals", categorySlug: "metals" },
  { keyword: "cr coil procurement india", category: "Metals", categorySlug: "metals" },
  { keyword: "ms plates bulk suppliers india", category: "Metals", categorySlug: "metals" },
  { keyword: "gi sheets suppliers india", category: "Metals", categorySlug: "metals" },
  { keyword: "wire rods procurement india", category: "Metals", categorySlug: "metals" },
  { keyword: "iron procurement india", category: "Metals", categorySlug: "metals" },
  { keyword: "alloy steel suppliers india", category: "Metals", categorySlug: "metals" },
  { keyword: "structural steel procurement india", category: "Metals", categorySlug: "metals" },

  // Pipes & Fittings
  { keyword: "hdpe pipe suppliers india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },
  { keyword: "pvc pipe procurement india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },
  { keyword: "ms pipe bulk purchase india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },
  { keyword: "gi pipe suppliers india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },
  { keyword: "industrial pipe procurement india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },
  { keyword: "pipe fittings suppliers india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },
  { keyword: "valve suppliers industrial india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },
  { keyword: "flange suppliers india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },
  { keyword: "seamless pipe suppliers india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },
  { keyword: "pipeline material procurement india", category: "Pipes & Fittings", categorySlug: "pipes-fittings" },

  // Construction Materials
  { keyword: "cement bulk purchase india", category: "Construction Materials", categorySlug: "construction" },
  { keyword: "ready mix concrete suppliers india", category: "Construction Materials", categorySlug: "construction" },
  { keyword: "construction materials procurement india", category: "Construction Materials", categorySlug: "construction" },
  { keyword: "building materials suppliers india", category: "Construction Materials", categorySlug: "construction" },
  { keyword: "roofing sheets suppliers india", category: "Construction Materials", categorySlug: "construction" },
  { keyword: "tiles bulk suppliers india", category: "Construction Materials", categorySlug: "construction" },
  { keyword: "sand suppliers bulk india", category: "Construction Materials", categorySlug: "construction" },
  { keyword: "aggregate suppliers india", category: "Construction Materials", categorySlug: "construction" },
  { keyword: "brick suppliers bulk india", category: "Construction Materials", categorySlug: "construction" },
  { keyword: "rebar suppliers india", category: "Construction Materials", categorySlug: "construction" },

  // Electrical
  { keyword: "cable suppliers india bulk", category: "Electrical", categorySlug: "electrical" },
  { keyword: "electrical wire procurement india", category: "Electrical", categorySlug: "electrical" },
  { keyword: "transformer suppliers india", category: "Electrical", categorySlug: "electrical" },
  { keyword: "switchgear suppliers india", category: "Electrical", categorySlug: "electrical" },
  { keyword: "electrical panel suppliers india", category: "Electrical", categorySlug: "electrical" },
  { keyword: "industrial cable procurement india", category: "Electrical", categorySlug: "electrical" },
  { keyword: "power cable suppliers india", category: "Electrical", categorySlug: "electrical" },
  { keyword: "control panel suppliers india", category: "Electrical", categorySlug: "electrical" },
  { keyword: "electrical equipment procurement india", category: "Electrical", categorySlug: "electrical" },
  { keyword: "industrial lighting suppliers india", category: "Electrical", categorySlug: "electrical" },

  // Packaging
  { keyword: "corrugated box suppliers india", category: "Packaging", categorySlug: "packaging" },
  { keyword: "packaging material bulk suppliers india", category: "Packaging", categorySlug: "packaging" },
  { keyword: "plastic packaging suppliers india", category: "Packaging", categorySlug: "packaging" },
  { keyword: "industrial packaging procurement india", category: "Packaging", categorySlug: "packaging" },
  { keyword: "carton box manufacturers india", category: "Packaging", categorySlug: "packaging" },
  { keyword: "stretch film suppliers india", category: "Packaging", categorySlug: "packaging" },
  { keyword: "pallet suppliers india", category: "Packaging", categorySlug: "packaging" },
  { keyword: "packaging solutions for industries india", category: "Packaging", categorySlug: "packaging" },
  { keyword: "export packaging suppliers india", category: "Packaging", categorySlug: "packaging" },
  { keyword: "protective packaging suppliers india", category: "Packaging", categorySlug: "packaging" },

  // Chemicals
  { keyword: "industrial chemical suppliers india", category: "Chemicals", categorySlug: "chemicals" },
  { keyword: "solvent suppliers india bulk", category: "Chemicals", categorySlug: "chemicals" },
  { keyword: "resin suppliers india", category: "Chemicals", categorySlug: "chemicals" },
  { keyword: "polymer suppliers india", category: "Chemicals", categorySlug: "chemicals" },
  { keyword: "adhesive suppliers india", category: "Chemicals", categorySlug: "chemicals" },
  { keyword: "paint chemical suppliers india", category: "Chemicals", categorySlug: "chemicals" },
  { keyword: "coating chemicals procurement india", category: "Chemicals", categorySlug: "chemicals" },
  { keyword: "specialty chemicals suppliers india", category: "Chemicals", categorySlug: "chemicals" },
  { keyword: "bulk chemical procurement india", category: "Chemicals", categorySlug: "chemicals" },
  { keyword: "industrial acid suppliers india", category: "Chemicals", categorySlug: "chemicals" },

  // Industrial Procurement
  { keyword: "industrial procurement platform india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },
  { keyword: "bulk material procurement india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },
  { keyword: "raw material procurement india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },
  { keyword: "factory procurement solutions india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },
  { keyword: "manufacturing procurement platform india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },
  { keyword: "b2b procurement platform india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },
  { keyword: "procurement software india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },
  { keyword: "supplier comparison platform india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },
  { keyword: "reverse auction procurement india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },
  { keyword: "online procurement system india", category: "Industrial Procurement", categorySlug: "industrial-procurement" },

  // Cost Reduction Intent
  { keyword: "reduce procurement cost india", category: "Cost Reduction", categorySlug: "cost-reduction" },
  { keyword: "how to get lowest supplier price", category: "Cost Reduction", categorySlug: "cost-reduction" },
  { keyword: "compare supplier quotes india", category: "Cost Reduction", categorySlug: "cost-reduction" },
  { keyword: "best way to buy in bulk india", category: "Cost Reduction", categorySlug: "cost-reduction" },
  { keyword: "procurement cost saving strategies", category: "Cost Reduction", categorySlug: "cost-reduction" },
  { keyword: "strategic sourcing india", category: "Cost Reduction", categorySlug: "cost-reduction" },
  { keyword: "supplier negotiation alternatives", category: "Cost Reduction", categorySlug: "cost-reduction" },
  { keyword: "digital procurement solutions india", category: "Cost Reduction", categorySlug: "cost-reduction" },
  { keyword: "automate procurement process india", category: "Cost Reduction", categorySlug: "cost-reduction" },
  { keyword: "cost optimization procurement india", category: "Cost Reduction", categorySlug: "cost-reduction" },

  // Industry Specific
  { keyword: "construction procurement platform india", category: "Industry Specific", categorySlug: "industry-specific" },
  { keyword: "manufacturing raw material sourcing india", category: "Industry Specific", categorySlug: "industry-specific" },
  { keyword: "infrastructure material procurement india", category: "Industry Specific", categorySlug: "industry-specific" },
  { keyword: "factory supply chain procurement india", category: "Industry Specific", categorySlug: "industry-specific" },
  { keyword: "real estate material procurement india", category: "Industry Specific", categorySlug: "industry-specific" },
  { keyword: "industrial buying platform india", category: "Industry Specific", categorySlug: "industry-specific" },
  { keyword: "contractor procurement solutions india", category: "Industry Specific", categorySlug: "industry-specific" },
  { keyword: "engineering procurement platform india", category: "Industry Specific", categorySlug: "industry-specific" },
  { keyword: "project material sourcing india", category: "Industry Specific", categorySlug: "industry-specific" },
  { keyword: "bulk sourcing platform india", category: "Industry Specific", categorySlug: "industry-specific" },
];

function generatePage(raw: RawKeyword, index: number): HighIntentPage {
  const slug = toSlug(raw.keyword);
  const title = capitalize(raw.keyword);
  const sameCat = rawKeywords.filter(r => r.categorySlug === raw.categorySlug && r.keyword !== raw.keyword);
  const relatedSlugs = sameCat.slice(0, 4).map(r => toSlug(r.keyword));

  const isSupplierQuery = raw.keyword.includes('supplier');
  const isProcurementQuery = raw.keyword.includes('procurement') || raw.keyword.includes('sourcing');
  const isCostQuery = raw.keyword.includes('cost') || raw.keyword.includes('price') || raw.keyword.includes('compare');
  const isPlatformQuery = raw.keyword.includes('platform') || raw.keyword.includes('software') || raw.keyword.includes('system');

  let intro: string;
  let problemPoints: string[];
  let solution: string;
  let benefits: string[];

  if (isSupplierQuery) {
    intro = `Finding verified ${title.toLowerCase().replace(' india', '')} is a major challenge for Indian manufacturers and project managers. Traditional sourcing relies on broker networks, outdated directories, and opaque pricing — leading to inflated costs, inconsistent quality, and delivery delays. ProcureSaathi's AI-powered reverse auction platform connects you directly with pre-qualified suppliers who compete for your business, ensuring you get the best price, guaranteed quality, and transparent terms — all without the middleman markup.`;
    problemPoints = [
      "Broker networks add 8-15% hidden markup to every order",
      "No way to verify supplier capacity or quality certifications before ordering",
      "Price quotes vary wildly — no market benchmark visibility",
      "Delivery delays are common with unverified suppliers"
    ];
  } else if (isCostQuery) {
    intro = `Indian enterprises lose crores annually to inefficient procurement processes — from manual RFQ handling to lack of competitive bidding. ${title} is achievable when you shift from traditional negotiation to structured reverse auctions. ProcureSaathi's AI engine benchmarks market prices in real time, invites verified suppliers to bid competitively, and ensures you lock in the lowest total cost of ownership — not just the lowest sticker price.`;
    problemPoints = [
      "Manual procurement processes waste 40+ hours per sourcing cycle",
      "Single-supplier dependency eliminates competitive pressure on pricing",
      "No real-time market price benchmarks for informed negotiation",
      "Hidden costs in logistics, quality failures, and payment terms go untracked"
    ];
  } else if (isPlatformQuery) {
    intro = `India's B2B procurement landscape is rapidly digitizing, and businesses need a ${title.toLowerCase().replace(' india', '')} that delivers real cost savings — not just digital catalogs. ProcureSaathi goes beyond listing: our AI-driven reverse auction engine actively matches your requirements with verified suppliers, runs competitive bidding rounds, and provides transparent price discovery — turning procurement from a cost center into a strategic advantage.`;
    problemPoints = [
      "Most procurement platforms are glorified directories with no price transparency",
      "No competitive bidding mechanism means you accept the first quote you get",
      "Supplier verification is left to the buyer — increasing risk",
      "Integration with existing ERP and approval workflows is missing"
    ];
  } else {
    intro = `${title} in India demands a strategic approach that balances cost efficiency, quality assurance, and supply chain reliability. Traditional procurement channels are fragmented, opaque, and favor intermediaries over actual buyers. ProcureSaathi eliminates these friction points through AI-powered reverse auctions that bring verified suppliers to your requirement — ensuring competitive pricing, quality-certified materials, and on-time delivery at scale.`;
    problemPoints = [
      "Fragmented supplier landscape makes it hard to find the best match",
      "Opaque pricing with no market benchmark visibility",
      "Quality inconsistencies due to lack of pre-qualification processes",
      "Long procurement cycles from RFQ to PO — often 2-4 weeks"
    ];
  }

  solution = `ProcureSaathi's reverse auction model flips traditional procurement: instead of you chasing suppliers for quotes, verified suppliers compete to win your business. You post your requirement once, our AI matches it with qualified suppliers in the ${raw.category} category, and suppliers bid competitively in real time. The result? Lowest prices, verified quality, transparent terms — and you save 12-25% compared to traditional procurement.`;

  benefits = [
    "Save 12-25% on every order through competitive reverse auctions",
    "Access 500+ pre-verified suppliers across India with quality certifications",
    "Get multiple competitive quotes within 24 hours — not weeks",
    "Full transparency: see every bid, compare terms, and choose with confidence"
  ];

  const howItWorks = [
    "Post your requirement — specify material, quantity, grade, and delivery timeline",
    "AI matches your requirement with verified suppliers in the right category and region",
    "Suppliers submit competitive bids in a transparent reverse auction format",
    "Compare bids on price, quality, delivery terms — and award with one click"
  ];

  const trustPoints = [
    "500+ verified industrial suppliers across India",
    "AI-powered price benchmarking against live market rates",
    "Transparent bidding — no hidden fees or broker markups",
    "Average 18% cost savings per transaction"
  ];

  return {
    slug,
    keyword: raw.keyword,
    title: `${title} – Verified Suppliers & Best Prices | ProcureSaathi`,
    metaDescription: `${title} made simple. Compare verified supplier quotes, run reverse auctions, and save 12-25% on every order. 500+ pre-qualified ${raw.category.toLowerCase()} suppliers across India.`,
    h1: title,
    category: raw.category,
    categorySlug: raw.categorySlug,
    intro,
    problemPoints,
    solution,
    benefits,
    howItWorks,
    trustPoints,
    ctaPrimary: getSmartCTA(raw.keyword),
    ctaSecondary: getSmartSecondaryCTA(raw.keyword),
    relatedSlugs,
  };
}

/** Smart CTA — keyword-aware primary button text */
function getSmartCTA(keyword: string): string {
  if (keyword.includes('supplier')) return 'Get Verified Suppliers Now';
  if (keyword.includes('cost') || keyword.includes('price') || keyword.includes('compare')) return 'Reduce Your Procurement Cost';
  if (keyword.includes('platform') || keyword.includes('software') || keyword.includes('system')) return 'See Reverse Auction Demo';
  if (keyword.includes('bulk')) return 'Get Bulk Pricing Now';
  return 'Start Reverse Auction';
}

function getSmartSecondaryCTA(keyword: string): string {
  if (keyword.includes('supplier')) return 'Compare Supplier Quotes';
  if (keyword.includes('cost') || keyword.includes('price')) return 'See Savings Calculator';
  return 'Get Supplier Quotes';
}

export const highIntentPages: HighIntentPage[] = rawKeywords.map((raw, i) => generatePage(raw, i));

export function getHighIntentPageBySlug(slug: string): HighIntentPage | undefined {
  return highIntentPages.find(p => p.slug === slug);
}

export function getHighIntentPagesByCategory(categorySlug: string): HighIntentPage[] {
  return highIntentPages.filter(p => p.categorySlug === categorySlug);
}

export function getAllHighIntentSlugs(): string[] {
  return highIntentPages.map(p => p.slug);
}

export const highIntentCategories = [
  { name: "Metals", slug: "metals", count: 10 },
  { name: "Pipes & Fittings", slug: "pipes-fittings", count: 10 },
  { name: "Construction Materials", slug: "construction", count: 10 },
  { name: "Electrical", slug: "electrical", count: 10 },
  { name: "Packaging", slug: "packaging", count: 10 },
  { name: "Chemicals", slug: "chemicals", count: 10 },
  { name: "Industrial Procurement", slug: "industrial-procurement", count: 10 },
  { name: "Cost Reduction", slug: "cost-reduction", count: 10 },
  { name: "Industry Specific", slug: "industry-specific", count: 10 },
];

// ─── CITY-LEVEL SEO EXPANSION ───────────────────────────────
export const targetCities = [
  { name: "Mumbai", slug: "mumbai" },
  { name: "Delhi", slug: "delhi" },
  { name: "Bangalore", slug: "bangalore" },
  { name: "Chennai", slug: "chennai" },
  { name: "Pune", slug: "pune" },
  { name: "Hyderabad", slug: "hyderabad" },
  { name: "Kolkata", slug: "kolkata" },
  { name: "Ahmedabad", slug: "ahmedabad" },
];

/** Generate city-variant page from a base page */
export function getCityVariantPage(baseSlug: string, citySlug: string): HighIntentPage | undefined {
  const basePage = getHighIntentPageBySlug(baseSlug);
  if (!basePage) return undefined;

  const city = targetCities.find(c => c.slug === citySlug);
  if (!city) return undefined;

  return {
    ...basePage,
    slug: `${basePage.slug}-${city.slug}`,
    keyword: `${basePage.keyword} ${city.name.toLowerCase()}`,
    title: `${basePage.h1} in ${city.name} – Verified Suppliers | ProcureSaathi`,
    metaDescription: `${basePage.h1} in ${city.name}. Compare verified local suppliers, run reverse auctions, save 12-25%. Fast delivery in ${city.name} region.`,
    h1: `${basePage.h1} in ${city.name}`,
    intro: basePage.intro.replace(/India/g, city.name).replace(/indian/gi, `${city.name}-based`),
    ctaPrimary: getSmartCTA(basePage.keyword),
    ctaSecondary: getSmartSecondaryCTA(basePage.keyword),
    relatedSlugs: basePage.relatedSlugs.map(s => `${s}-${city.slug}`),
  };
}

/** Parse slug into base + city components */
export function parseSlugForCity(slug: string): { baseSlug: string; citySlug: string | null } {
  for (const city of targetCities) {
    if (slug.endsWith(`-${city.slug}`)) {
      return { baseSlug: slug.replace(`-${city.slug}`, ''), citySlug: city.slug };
    }
  }
  return { baseSlug: slug, citySlug: null };
}
