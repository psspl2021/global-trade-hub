import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO, injectStructuredData, getBreadcrumbSchema } from '@/hooks/useSEO';
import { Building2, ArrowRight } from 'lucide-react';

interface CountryInfo {
  iso_code: string;
  country_name: string;
  region: string;
}

const nameToSlug = (name: string) =>
  name.toLowerCase().replace(/[&,()]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

// Top-level categories for the directory grid
const categories = [
  'Agriculture Equipment & Supplies', 'Auto Vehicle & Accessories', 'Building & Construction',
  'Chemicals & Raw Materials', 'Electrical Equipment & Supplies', 'Electronic Components',
  'Energy & Power', 'Food & Beverages', 'Hardware & Tools', 'Industrial Supplies',
  'Machinery & Equipment', 'Medical & Healthcare', 'Metals - Ferrous (Steel, Iron)',
  'Metals - Non-Ferrous (Copper, Aluminium)', 'Mining & Minerals', 'Packaging & Printing',
  'Pharmaceuticals & Drugs', 'Pipes & Tubes', 'Polymers & Resins', 'Petroleum & Bitumen',
  'Rubber Products', 'Safety & Security', 'Textiles & Fabrics', 'Cosmetics & Personal Care',
  'Flavors & Fragrances', 'Industrial Storage Tanks', 'Steel Fabrication & Structures',
  'GFRP & Composites', 'Road Safety & Infrastructure', 'Paper & Paper Products',
  'Environment & Recycling',
];

export default function ExploreCountryPage() {
  const { region, country } = useParams<{ region: string; country: string }>();
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!country) return;
      const { data } = await supabase
        .from('countries_master')
        .select('iso_code, country_name, region')
        .eq('is_active', true)
        .ilike('iso_code', country.toUpperCase())
        .single();

      if (data) setCountryInfo(data);
      setLoading(false);
    }
    fetch();
  }, [country]);

  const displayName = countryInfo?.country_name || country?.toUpperCase() || '';
  const regionDisplay = countryInfo?.region || region?.replace(/-/g, ' ') || '';

  useSEO({
    title: `${displayName} Procurement Directory — Categories & Demand | ProcureSaathi`,
    description: `Explore procurement categories available in ${displayName}. View live AI demand signals, supplier intelligence, and market pricing for industrial sourcing.`,
    canonical: `https://www.procuresaathi.com/explore/${region}/${country}`,
  });

  useEffect(() => {
    if (!countryInfo) return;
    injectStructuredData(getBreadcrumbSchema([
      { name: 'Home', url: 'https://www.procuresaathi.com' },
      { name: 'Explore', url: 'https://www.procuresaathi.com/explore' },
      { name: regionDisplay, url: `https://www.procuresaathi.com/explore/${region}` },
      { name: displayName, url: `https://www.procuresaathi.com/explore/${region}/${country}` },
    ]), 'breadcrumb-country');
  }, [countryInfo]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <nav className="text-sm text-muted-foreground mb-8 flex flex-wrap gap-1">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>→</span>
            <Link to="/explore" className="hover:text-primary">Explore</Link>
            <span>→</span>
            <span className="capitalize">{regionDisplay}</span>
            <span>→</span>
            <span className="text-foreground font-medium">{displayName}</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Procurement in {displayName}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Browse {categories.length} industrial categories with AI-powered demand signals and verified supplier intelligence for {displayName}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const catSlug = nameToSlug(cat);
              const demandSlug = `${(country || '').toLowerCase()}-${catSlug}`;
              return (
                <Link
                  key={cat}
                  to={`/demand/${demandSlug}`}
                  className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card hover:border-primary hover:shadow-md transition-all group"
                >
                  <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{cat}</p>
                    <p className="text-xs text-muted-foreground">View demand signals</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
