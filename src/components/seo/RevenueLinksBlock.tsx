import { Link } from "react-router-dom";
import { getTopRevenueLinks } from "@/utils/revenueLinkEngine";
import { TrendingUp } from "lucide-react";

interface Props {
  limit?: number;
}

export default function RevenueLinksBlock({ limit = 5 }: Props) {
  const topLinks = getTopRevenueLinks(limit);

  if (topLinks.length === 0) return null;

  return (
    <section className="mt-12 rounded-xl border border-border bg-primary/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">
          High Demand Industrial Guides
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {topLinks.map(link => (
          <Link
            key={link.slug}
            to={link.url}
            className="rounded-lg border border-border p-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/30 capitalize"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
