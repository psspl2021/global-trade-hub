import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';

interface IntentKeywordSectionProps {
  productName: string;
  slug: string;
  country?: string;
  priceRange?: string;
  recentRFQs?: number;
}

/**
 * Generates keyword-rich H2 sections targeting long-tail procurement queries.
 * Each block produces unique content to avoid thin-page signals.
 */
export default function IntentKeywordSection({
  productName,
  slug,
  country = 'India',
  priceRange,
  recentRFQs,
}: IntentKeywordSectionProps) {
  const productBase = productName.replace(/\s+in\s+India$/i, '');

  const sections = [
    {
      heading: `${productBase} Suppliers in ${country}`,
      content: `Finding verified ${productBase} suppliers in ${country} requires evaluating production capacity, certifications, delivery reliability, and pricing competitiveness. ProcureSaathi's AI engine pre-qualifies suppliers based on BIS/ISO compliance, past transaction performance, and real-time capacity data — so buyers receive quotes only from suppliers capable of fulfilling their specific requirements. ${recentRFQs ? `Over ${recentRFQs} RFQs have been processed for ${productBase} in the last quarter alone.` : ''}`,
    },
    {
      heading: `Bulk ${productBase} Procurement`,
      content: `Bulk procurement of ${productBase} is streamlined through ProcureSaathi's reverse auction model, where multiple verified suppliers compete on price, delivery, and terms — giving buyers transparent, market-competitive pricing without manual negotiation. Buyers typically achieve 8–15% savings on bulk orders compared to traditional sourcing channels. The sealed-bid format ensures pricing integrity and eliminates supplier collusion.`,
    },
    {
      heading: `${productBase} Manufacturers in ${country}`,
      content: `${country}'s ${productBase} manufacturing ecosystem spans mill-direct producers, secondary processors, and authorized stockists. ProcureSaathi maps this supply chain to match each buyer's requirement with the right manufacturing tier — whether that's a primary mill for large-tonnage orders or a specialized processor for custom grades and dimensions. All manufacturers on the platform undergo verification for production licenses, quality systems, and financial stability.`,
    },
    {
      heading: `${productBase} Price Per Ton in ${country}`,
      content: `${productBase} pricing in ${country} is influenced by raw material costs, grade specifications, order volume, delivery location, and market demand cycles. ${priceRange ? `Current indicative pricing ranges around ${priceRange}, though actual quotes vary by grade and quantity.` : `Prices fluctuate based on steel index movements and seasonal demand patterns.`} ProcureSaathi provides real-time competitive pricing through its reverse auction mechanism, ensuring buyers access the most current market rates from multiple suppliers simultaneously.`,
    },
  ];

  return (
    <section className="space-y-10">
      <div className="flex items-center gap-3 mb-2">
        <Search className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Procurement Intelligence for {productBase}</h2>
      </div>

      {sections.map((s, i) => (
        <div key={i}>
          <h2 className="text-xl font-semibold text-foreground mb-3">{s.heading}</h2>
          <p className="text-muted-foreground leading-relaxed">{s.content}</p>
        </div>
      ))}

      {/* Contextual internal links after keyword content */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
        <Link
          to={`/demand/${slug}`}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <ArrowRight className="h-3 w-3" /> {productBase} Procurement Page
        </Link>
        <Link
          to="/reverse-auction-procurement"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <ArrowRight className="h-3 w-3" /> Reverse Auction Process
        </Link>
        <Link
          to="/demand"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <ArrowRight className="h-3 w-3" /> All Demand Categories
        </Link>
      </div>
    </section>
  );
}
