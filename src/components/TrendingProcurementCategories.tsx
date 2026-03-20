import { Link } from "react-router-dom";
import { demandProducts } from "@/data/demandProducts";
import { TrendingUp } from "lucide-react";

/**
 * Trending Procurement Categories — internal link boost for crawl priority.
 * Surfaces top 12 demand pages directly from homepage for authority distribution.
 */
export default function TrendingProcurementCategories() {
  const topPages = demandProducts.slice(0, 12);

  if (!topPages.length) return null;

  return (
    <section className="py-12 px-4 bg-background border-t border-border/40">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            Trending Procurement Categories
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          High-demand industrial materials with active buyer interest and verified supplier availability.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {topPages.map((p) => (
            <Link
              key={p.slug}
              to={`/demand/${p.slug}`}
              className="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors py-1"
            >
              {p.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
