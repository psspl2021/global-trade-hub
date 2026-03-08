import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useTopRFQSignals } from '@/hooks/useRFQSignals';
import { getTopRevenueLinks } from '@/utils/revenueLinkEngine';

interface Props {
  currentSlug?: string;
}

/**
 * Module 2: Revenue Weighted Internal Linking
 * Shows high-demand products from live RFQ signals, falling back to static engine.
 */
export default function RevenueWeightedLinksLive({ currentSlug }: Props) {
  const { data: rfqSignals } = useTopRFQSignals(8);

  // Use live DB signals if available, otherwise fall back to static engine
  const liveLinks = rfqSignals && rfqSignals.length > 0
    ? rfqSignals
        .filter(s => s.product_slug !== currentSlug)
        .slice(0, 8)
        .map(s => ({
          slug: s.product_slug,
          url: `/demand/${s.product_slug}`,
          label: s.product_name || s.product_slug.replace(/-/g, ' '),
          rfqCount: s.rfq_count,
        }))
    : getTopRevenueLinks(8)
        .filter(l => l.slug !== currentSlug)
        .slice(0, 8)
        .map(l => ({
          slug: l.slug,
          url: l.url,
          label: l.label,
          rfqCount: 0,
        }));

  if (liveLinks.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">High Demand Procurement Materials</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        These materials are seeing the highest procurement activity on ProcureSaathi. Internal linking prioritized by live RFQ demand signals.
      </p>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {liveLinks.map(link => (
          <Link
            key={link.slug}
            to={link.url}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group"
          >
            <ArrowRight className="h-4 w-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
            <div>
              <span className="text-sm font-medium text-foreground capitalize">{link.label}</span>
              {link.rfqCount > 0 && (
                <p className="text-xs text-muted-foreground">{link.rfqCount} RFQs</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
