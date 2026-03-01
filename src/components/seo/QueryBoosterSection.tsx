import { gscOpportunities } from "@/data/gscOpportunities";

interface Props {
  slug: string;
}

export default function QueryBoosterSection({ slug }: Props) {
  const opportunities = gscOpportunities.filter(o => o.pageSlug === slug);

  if (!opportunities.length) return null;

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-semibold text-foreground mb-4">
        Detailed Technical Clarifications
      </h2>
      {opportunities.map((o, i) => (
        <div key={i} className="mb-6 rounded-lg border border-border p-5">
          <h3 className="mb-2 font-semibold text-foreground capitalize">
            {o.query}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This section addresses the exact query: <strong>{o.query}</strong>.
            Procurement decisions must consider mechanical properties, compliance
            standards, and application suitability before finalizing grade selection.
          </p>
        </div>
      ))}
    </section>
  );
}
