import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { TrendingUp, Globe, ArrowRight } from 'lucide-react';
import { priorityCorridors } from '@/data/priorityCorridors';

export default function DemandIndex() {
  useSEO({
    title: 'AI Demand Intelligence — Live Procurement Corridors | ProcureSaathi',
    description: 'Explore live AI-detected demand signals across global procurement corridors. Real-time intent scores, verified suppliers, and transparent market pricing.',
    canonical: 'https://www.procuresaathi.com/demand',
  });

  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-sm text-muted-foreground mb-8 flex gap-1">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>→</span>
            <span className="text-foreground font-medium">Demand Intelligence</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            AI Demand Intelligence
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl">
            Live procurement demand signals detected across global trade corridors. 
            Each corridor is scored by AI for intent, supplier readiness, and market activity.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorityCorridors.map((corridor) => (
              <Link
                key={corridor.slug}
                to={`/demand/${corridor.slug}`}
                className="border border-border rounded-xl p-6 bg-card hover:border-primary/50 transition group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{corridor.country}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition">
                      {corridor.categoryDisplay}
                    </h2>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition mt-1" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center py-10">
            <Link
              to="/post-rfq"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
            >
              Submit RFQ to Activate a Corridor
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              Can't find your category? Submit an RFQ and our AI will create the corridor.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
