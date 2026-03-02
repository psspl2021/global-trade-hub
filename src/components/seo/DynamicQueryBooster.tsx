import { useGSCStrikingDistance } from "@/hooks/useGSCStrikingDistance";
import { gscOpportunities } from "@/data/gscOpportunities";

interface Props {
  slug: string;
}

/**
 * Hybrid QueryBooster: uses live GSC striking distance data when available,
 * falls back to static gscOpportunities data.
 */
export default function DynamicQueryBooster({ slug }: Props) {
  const { data: liveQueries } = useGSCStrikingDistance(slug);

  // Merge live + static, preferring live data
  const staticQueries = gscOpportunities
    .filter(o => o.pageSlug === slug)
    .map(o => ({ query: o.query, position: o.position, impressions: o.impressions }));

  const allQueries = liveQueries && liveQueries.length > 0
    ? liveQueries.map(q => ({ query: q.query, position: q.position, impressions: q.impressions }))
    : staticQueries;

  if (!allQueries.length) return null;

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-semibold text-foreground mb-4">
        Detailed Technical Clarifications
      </h2>
      {allQueries.map((q, i) => (
        <div key={i} className="mb-6 rounded-lg border border-border p-5">
          <h3 className="mb-2 font-semibold text-foreground capitalize">
            {q.query}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This section addresses the exact query: <strong>{q.query}</strong>.
            Procurement decisions must consider mechanical properties, compliance
            standards, and application suitability before finalizing grade selection.
          </p>
          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
            <span>Position: {typeof q.position === 'number' ? q.position.toFixed(1) : q.position}</span>
            <span>•</span>
            <span>Impressions: {q.impressions}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
