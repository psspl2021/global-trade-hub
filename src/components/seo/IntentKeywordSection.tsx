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
      heading: `Top ${productBase} Suppliers in ${country}`,
      content: `Verified ${productBase} suppliers are screened for capacity, compliance, delivery reliability, and pricing competitiveness. ${recentRFQs ? `${recentRFQs}+ recent RFQs indicate active buyer demand.` : ''}`,
    },
    {
      heading: `Bulk Procurement of ${productBase}`,
      content: `Run sealed reverse auctions where verified suppliers compete on price, delivery, and terms without manual negotiation overhead.`,
    },
    {
      heading: `Leading ${productBase} Manufacturers in ${country}`,
      content: `Match with the right manufacturing tier: primary mills for large tonnage, processors for custom grades, and authorized stockists for faster dispatch.`,
    },
    {
      heading: `Latest ${productBase} Price Trends in ${country}`,
      content: priceRange ? `Indicative range: ${priceRange}. Final quotes vary by grade, quantity, location, and delivery timeline.` : `Prices vary by raw material cost, grade, order size, location, and demand cycle.`,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Procurement Intelligence for {productBase}</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((s, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground mb-2">{s.heading}</h2>
          <p className="text-sm text-muted-foreground leading-snug">{s.content}</p>
        </div>
        ))}
      </div>

      {/* Contextual internal links after keyword content */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
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
