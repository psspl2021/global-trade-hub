import { Link } from "react-router-dom";
import { ArrowRight, Globe, BarChart3, Wrench } from "lucide-react";
import { countrySkuMapping, type CountrySkuEntry } from "@/data/countrySkuMapping";
import { comparisonPagesData } from "@/data/comparisonPages";
import { useCasePagesData } from "@/data/useCasePages";
import { getPriorityScore } from "@/data/skuPriority";

interface Props {
  /** Product slugs belonging to this industry/sub-industry */
  productSlugs: string[];
  industryName: string;
}

/**
 * Bridge component surfacing revenue-sorted corridors,
 * comparisons, and use cases on industry detail pages.
 */
export default function IndustryCorridorBridge({ productSlugs, industryName }: Props) {
  // --- Top Import Corridors ---
  const corridors = countrySkuMapping
    .filter((e) => productSlugs.includes(e.sku))
    .sort((a, b) => getPriorityScore(b.sku) - getPriorityScore(a.sku))
    .slice(0, 5);

  // --- Top Comparisons ---
  const comparisons = comparisonPagesData
    .filter((p) => productSlugs.includes(p.relatedDemandSlug))
    .sort((a, b) => getPriorityScore(b.relatedDemandSlug) - getPriorityScore(a.relatedDemandSlug))
    .slice(0, 4);

  // --- Top Use Cases ---
  const useCases = useCasePagesData
    .filter((p) => productSlugs.includes(p.relatedDemandSlug))
    .sort((a, b) => getPriorityScore(b.relatedDemandSlug) - getPriorityScore(a.relatedDemandSlug))
    .slice(0, 4);

  if (corridors.length === 0 && comparisons.length === 0 && useCases.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10 mt-10">
      {/* Import Corridors */}
      {corridors.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Top Import Corridors for {industryName}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corridors.map((c, i) => (
              <CorridorCard key={i} entry={c} />
            ))}
          </div>
        </section>
      )}

      {/* Comparisons */}
      {comparisons.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Grade Comparisons
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparisons.map((p) => (
              <Link
                key={p.slug}
                to={`/compare/${p.slug}`}
                className="flex items-center justify-between border border-border rounded-lg p-4 bg-card hover:border-primary/50 transition"
              >
                <div>
                  <h3 className="font-semibold text-foreground">
                    {p.gradeA} vs {p.gradeB}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {p.title}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Use Cases */}
      {useCases.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Industrial Use Cases
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {useCases.map((p) => (
              <Link
                key={p.slug}
                to={`/use-case/${p.slug}`}
                className="flex items-center justify-between border border-border rounded-lg p-4 bg-card hover:border-primary/50 transition"
              >
                <div>
                  <h3 className="font-semibold text-foreground">
                    {p.title.split("–")[0].trim()}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {p.title.split("–")[1]?.trim() || "Procurement guide"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CorridorCard({ entry }: { entry: CountrySkuEntry }) {
  const importSlug = `${entry.sku}-from-${entry.countrySlug}`;
  return (
    <Link
      to={`/import/${importSlug}`}
      className="border border-border rounded-xl p-5 bg-card hover:border-primary/50 transition group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-primary uppercase tracking-wide">
          {entry.bestCountry}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">
        Import {entry.skuLabel} from {entry.bestCountry}
      </h3>
      <p className="text-sm text-muted-foreground">{entry.costAdvantage}</p>
      <p className="text-xs text-muted-foreground mt-2">
        Lead time: {entry.leadTimeDays} days
      </p>
    </Link>
  );
}
