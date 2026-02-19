import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO, injectStructuredData, getBreadcrumbSchema } from '@/hooks/useSEO';
import { Globe, MapPin, ArrowRight } from 'lucide-react';

interface RegionData {
  region: string;
  countries: { iso_code: string; country_name: string }[];
}

const regionIcons: Record<string, string> = {
  'Africa': '🌍', 'Americas': '🌎', 'Asia': '🌏',
  'Europe': '🏛️', 'Middle East': '🕌', 'Oceania': '🏝️',
};

export default function ExplorePage() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Explore Global Procurement Corridors | ProcureSaathi',
    description: 'Discover AI-verified procurement opportunities across 196 countries and 6 regions. Browse by region and category for live demand intelligence.',
    canonical: 'https://www.procuresaathi.com/explore',
  });

  useEffect(() => {
    injectStructuredData(getBreadcrumbSchema([
      { name: 'Home', url: 'https://www.procuresaathi.com' },
      { name: 'Explore', url: 'https://www.procuresaathi.com/explore' },
    ]), 'breadcrumb-explore');
  }, []);

  useEffect(() => {
    async function fetchRegions() {
      const { data } = await supabase
        .from('countries_master')
        .select('iso_code, country_name, region')
        .eq('is_active', true)
        .order('country_name');

      if (data) {
        const grouped: Record<string, { iso_code: string; country_name: string }[]> = {};
        data.forEach(c => {
          const r = c.region || 'Other';
          if (!grouped[r]) grouped[r] = [];
          grouped[r].push({ iso_code: c.iso_code, country_name: c.country_name });
        });
        setRegions(Object.entries(grouped).map(([region, countries]) => ({ region, countries })).sort((a, b) => a.region.localeCompare(b.region)));
      }
      setLoading(false);
    }
    fetchRegions();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <nav className="text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">→</span>
            <span className="text-foreground font-medium">Explore</span>
          </nav>

          <div className="text-center mb-12">
            <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Explore Global Procurement Corridors
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse AI-verified demand intelligence across 196 countries. Select a region to discover procurement opportunities.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regions.map(({ region, countries }) => (
                <div key={region} className="border border-border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{regionIcons[region] || '🌐'}</span>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{region}</h2>
                      <p className="text-sm text-muted-foreground">{countries.length} countries</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {countries.slice(0, 8).map(c => (
                      <Link
                        key={c.iso_code}
                        to={`/explore/${encodeURIComponent(region.toLowerCase().replace(/\s+/g, '-'))}/${c.iso_code.toLowerCase()}`}
                        className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {c.country_name}
                      </Link>
                    ))}
                    {countries.length > 8 && (
                      <span className="text-xs px-2 py-1 text-muted-foreground">+{countries.length - 8} more</span>
                    )}
                  </div>
                  <Link
                    to={`/explore/${encodeURIComponent(region.toLowerCase().replace(/\s+/g, '-'))}/${countries[0]?.iso_code.toLowerCase()}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Browse {region} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
