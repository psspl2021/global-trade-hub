import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { highIntentPages, highIntentCategories, getHighIntentPagesByCategory } from '@/data/highIntentPages';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, ArrowRight, Factory, Layers, Building,
  Zap, Package, Globe, BarChart3, ChevronRight
} from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
  metals: Factory,
  'pipes-fittings': Layers,
  construction: Building,
  electrical: Zap,
  packaging: Package,
  chemicals: Globe,
  'industrial-procurement': BarChart3,
  'cost-reduction': TrendingUp,
  'industry-specific': Factory,
};

export default function SolutionsIndex() {
  const canonicalUrl = 'https://www.procuresaathi.com/solutions';

  const indexSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "B2B Procurement Solutions India",
    "description": "100+ high-intent procurement solutions for Indian businesses.",
    "numberOfItems": highIntentPages.length,
    "itemListElement": highIntentPages.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `https://www.procuresaathi.com/solutions/${p.slug}`,
      "name": p.h1
    }))
  };

  return (
    <>
      <Helmet>
        <title>B2B Procurement Solutions India – 100+ Categories | ProcureSaathi</title>
        <meta name="description" content="Explore 100+ procurement solutions across metals, pipes, construction, electrical, chemicals & more. Verified suppliers, reverse auctions, 12-25% cost savings." />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="B2B Procurement Solutions India | ProcureSaathi" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(indexSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <nav className="text-sm text-muted-foreground mb-8 flex gap-1">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <span>→</span>
              <span className="text-foreground font-medium">Procurement Solutions</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              B2B Procurement Solutions
            </h1>
            <p className="text-lg text-muted-foreground mb-12 max-w-3xl">
              {highIntentPages.length} high-intent procurement pages covering metals, pipes, construction, 
              electrical, chemicals, and more. Each page connects you to verified suppliers through 
              AI-powered reverse auctions.
            </p>

            {highIntentCategories.map((cat) => {
              const Icon = categoryIcons[cat.slug] || Factory;
              const pages = getHighIntentPagesByCategory(cat.slug);

              return (
                <div key={cat.slug} className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">{cat.name}</h2>
                    <Badge variant="secondary" className="text-xs">{pages.length} pages</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pages.map((p) => (
                      <Link
                        key={p.slug}
                        to={`/solutions/${p.slug}`}
                        className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {p.h1}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="text-center py-10">
              <Link
                to="/post-rfq"
                className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
              >
                Post Your Requirement Now
              </Link>
              <p className="text-sm text-muted-foreground mt-2">
                Can't find your category? Submit an RFQ and our AI will match you with the right suppliers.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
