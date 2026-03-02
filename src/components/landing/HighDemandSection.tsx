import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { getTopRevenueLinks } from "@/utils/revenueLinkEngine";

/**
 * Dynamic "High Demand This Week" section for homepage
 * Pulls top 5 SKUs by revenue score
 */
export default function HighDemandSection() {
  const topLinks = getTopRevenueLinks(5);

  if (!topLinks.length) return null;

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <TrendingUp className="h-4 w-4" />
            Live Demand Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
            High Demand Industrial Products
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Top procurement categories ranked by RFQ volume, deal value, and market weight
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {topLinks.map((link, i) => (
            <Link
              key={link.slug}
              to={link.url}
              className="group rounded-xl border border-border bg-background p-5 text-center transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="text-xs text-muted-foreground mb-2">#{i + 1}</div>
              <div className="font-semibold text-foreground capitalize group-hover:text-primary transition-colors text-sm">
                {link.label}
              </div>
              <div className="mt-2 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                View Details →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
