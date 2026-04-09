/**
 * High-intent blog keywords mapped to categories for the content pipeline.
 * Each keyword targets top-of-funnel problem/intent searches that funnel
 * readers into /solutions/:slug conversion pages via internal links.
 */

export interface BlogKeyword {
  keyword: string;
  category: string;
  tradeType: 'Domestic' | 'Export' | 'Import';
  /** Slug of the best-matching /solutions/ page for internal linking */
  linkedSolutionSlug: string;
}

export const highIntentBlogs: BlogKeyword[] = [
  // Cost & Savings Intent
  { keyword: "how to reduce procurement cost in india", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "reduce-procurement-cost-india" },
  { keyword: "reverse auction procurement benefits india", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "reverse-auction-procurement-india" },
  { keyword: "how to get lowest supplier price b2b", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "compare-supplier-quotes-india" },
  { keyword: "steel procurement cost saving strategies", category: "Metals & Steel", tradeType: "Domestic", linkedSolutionSlug: "steel-procurement-india" },
  { keyword: "bulk buying vs negotiation which is better", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "best-way-to-buy-in-bulk-india" },
  
  // Problem Awareness
  { keyword: "top procurement challenges in india", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "industrial-procurement-platform-india" },
  { keyword: "how reverse auction saves cost in manufacturing", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "reverse-auction-procurement-india" },
  { keyword: "supplier comparison methods india", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "supplier-comparison-platform-india" },
  { keyword: "how to find verified suppliers in india", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "b2b-procurement-platform-india" },
  { keyword: "digital procurement vs traditional procurement", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "digital-procurement-solutions-india" },

  // Supply Chain Optimization
  { keyword: "how to optimize supply chain cost india", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "cost-optimization-procurement-india" },
  { keyword: "b2b procurement mistakes to avoid", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "procurement-software-india" },
  { keyword: "industrial procurement process explained", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "industrial-procurement-platform-india" },
  { keyword: "how to source raw materials efficiently", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "raw-material-procurement-india" },
  { keyword: "best procurement strategies for construction", category: "Construction Materials", tradeType: "Domestic", linkedSolutionSlug: "construction-procurement-platform-india" },

  // Vendor Management
  { keyword: "how to reduce vendor dependency", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "supplier-comparison-platform-india" },
  { keyword: "procurement automation benefits india", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "automate-procurement-process-india" },
  { keyword: "strategic sourcing vs traditional buying", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "strategic-sourcing-india" },
  { keyword: "how to improve supplier competition", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "reverse-auction-procurement-india" },
  { keyword: "cost saving case studies procurement india", category: "Industrial Procurement", tradeType: "Domestic", linkedSolutionSlug: "procurement-cost-saving-strategies" },
];
