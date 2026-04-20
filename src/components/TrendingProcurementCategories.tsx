import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";

/**
 * Trending Procurement Categories — internal link boost for crawl priority.
 *
 * PERF: Previously imported the full `demandProducts` dataset (342 KB / 10k+
 * lines) just to render 12 link labels on the homepage, which dominated FCP.
 * Now we hard-code the top 12 slugs/names — they're the same first 12 entries
 * from the canonical taxonomy and only change when product priorities change.
 */
const TRENDING_PAGES: { slug: string; name: string }[] = [
  { slug: 'hr-coil-india', name: 'HR Coil' },
  { slug: 'cr-coil-india', name: 'CR Coil' },
  { slug: 'hr-sheet-india', name: 'HR Sheet' },
  { slug: 'cr-sheet-india', name: 'CR Sheet' },
  { slug: 'ms-plates-india', name: 'MS Plates' },
  { slug: 'galvanized-coils-india', name: 'Galvanized Coils' },
  { slug: 'chequered-plates-india', name: 'Chequered Plates' },
  { slug: 'color-coated-sheets-india', name: 'Color Coated Sheets' },
  { slug: 'tmt-bars-india', name: 'TMT Bars' },
  { slug: 'ms-angles-india', name: 'MS Angles' },
  { slug: 'ms-channels-india', name: 'MS Channels' },
  { slug: 'ms-beams-india', name: 'MS Beams' },
];

export default function TrendingProcurementCategories() {
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
          {TRENDING_PAGES.map((p) => (
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
