import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Globe } from 'lucide-react';

interface CorridorLink {
  label: string;
  url: string;
}

export function GlobalProcurementCorridors() {
  const [links, setLinks] = useState<CorridorLink[]>([]);

  useEffect(() => {
    async function fetchTopCorridors() {
      // Get high-intent signals to build dynamic links
      const { data } = await supabase
        .from('seo_demand_pages')
        .select('slug, category, country_iso, intent_weight')
        .eq('is_active', true)
        .order('intent_weight', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setLinks(data.map(d => ({
          label: `${d.category} in ${d.country_iso}`,
          url: `/demand/${(d.country_iso || 'global').toLowerCase()}-${d.category.toLowerCase().replace(/[&,()]/g, '').replace(/\s+/g, '-')}`,
        })));
      } else {
        // Fallback static corridors
        const fallback = [
          { label: 'Steel in India', url: '/demand/in-metals-ferrous-steel-iron' },
          { label: 'Chemicals in UAE', url: '/demand/ae-chemicals-raw-materials' },
          { label: 'Machinery in USA', url: '/demand/us-machinery-equipment' },
          { label: 'Textiles in UK', url: '/demand/gb-textiles-fabrics' },
          { label: 'Pharmaceuticals in Kenya', url: '/demand/ke-pharmaceuticals-drugs' },
          { label: 'Construction in Saudi Arabia', url: '/demand/sa-building-construction' },
          { label: 'Electronics in Singapore', url: '/demand/sg-electronic-components' },
          { label: 'Food in Nigeria', url: '/demand/ng-food-beverages' },
          { label: 'Pipes in Qatar', url: '/demand/qa-pipes-tubes' },
          { label: 'Energy in Germany', url: '/demand/de-energy-power' },
        ];
        setLinks(fallback);
      }
    }
    fetchTopCorridors();
  }, []);

  if (links.length === 0) return null;

  return (
    <section className="py-12 px-4 border-t border-border bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Explore Global Procurement Corridors</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((link, i) => (
            <Link
              key={i}
              to={link.url}
              className="text-sm px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/explore"
            className="text-sm px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            View All 196 Countries →
          </Link>
        </div>
      </div>
    </section>
  );
}
