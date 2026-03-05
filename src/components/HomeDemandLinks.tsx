import { Link } from "react-router-dom";
import { getTopRevenueLinks } from "@/utils/revenueLinkEngine";
import { ArrowRight } from "lucide-react";

/**
 * Internal link boost section for homepage.
 * Surfaces top revenue-weighted demand pages for crawl priority & authority flow.
 */
export default function HomeDemandLinks() {
  const topLinks = getTopRevenueLinks(8);

  if (!topLinks.length) return null;

  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Top Industrial Procurement Categories
        </h2>
        <p className="text-muted-foreground mb-8">
          High-demand materials sourced through managed procurement for EPC, infrastructure, and manufacturing projects.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {topLinks.map((link) => (
            <Link
              key={link.slug}
              to={link.url}
              className="group flex items-center justify-between border border-border rounded-lg p-4 bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">
                {link.label}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
