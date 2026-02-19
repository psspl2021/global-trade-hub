import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { priorityCorridors } from '@/data/priorityCorridors';

export function GlobalProcurementCorridors() {
  return (
    <section className="py-12 px-4 border-t border-border bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Explore Global Procurement Corridors</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {priorityCorridors.map((corridor) => (
            <Link
              key={corridor.slug}
              to={`/demand/${corridor.slug}`}
              className="text-sm px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              {corridor.categoryDisplay} in {corridor.country}
            </Link>
          ))}
          <Link
            to="/explore"
            className="text-sm px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            View All Countries →
          </Link>
        </div>
      </div>
    </section>
  );
}
