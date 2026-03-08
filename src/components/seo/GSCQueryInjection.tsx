import { useGSCQueries } from '@/hooks/useGSCQueries';

interface Props {
  slug: string;
  productName: string;
}

/**
 * Module 1: GSC Query Intelligence Engine
 * Injects top 3 performing search queries to avoid keyword stuffing.
 */
export default function GSCQueryInjection({ slug, productName }: Props) {
  const { data: queries } = useGSCQueries(slug);

  const topQueries = (queries ?? [])
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 3);

  if (topQueries.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-foreground">
          What Buyers Search About {productName}
        </h2>
      </div>
      <p className="text-muted-foreground mb-6">
        Based on real search demand intelligence, these are the most common procurement queries related to {productName} in India.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {topQueries.map((q, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
            <h3 className="font-semibold text-foreground capitalize mb-2">
              {q.query}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Industrial buyers searching for "{q.query}" typically evaluate supplier reliability,
              pricing benchmarks, compliance standards, and delivery timelines.
              ProcureSaathi provides verified suppliers and procurement intelligence
              to support informed sourcing decisions for {productName}.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-medium text-foreground">{q.impressions.toLocaleString()}</span> impressions
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-foreground">{q.clicks}</span> clicks
              </span>
              <span className="flex items-center gap-1">
                Pos <span className="font-medium text-foreground">{q.position.toFixed(1)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
