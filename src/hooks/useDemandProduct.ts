import { useState, useEffect } from 'react';
import { getDemandProductBySlug, type DemandProduct } from '@/data/demandProducts';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to resolve a demand product from static taxonomy OR the demand_generated DB table.
 * Static taxonomy is checked first (source of truth), then falls back to AI-generated pages.
 */
export function useDemandProduct(slug: string | undefined) {
  const [product, setProduct] = useState<DemandProduct | null | undefined>(undefined); // undefined = loading
  const [source, setSource] = useState<'static' | 'generated' | null>(null);

  useEffect(() => {
    if (!slug) {
      setProduct(null);
      setSource(null);
      return;
    }

    // 1. Check static taxonomy first
    const staticProduct = getDemandProductBySlug(slug);
    if (staticProduct) {
      setProduct(staticProduct);
      setSource('static');
      return;
    }

    // 2. Check demand_generated DB
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('demand_generated' as any)
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        if (cancelled) return;

        if (error || !data) {
          setProduct(null);
          setSource(null);
          return;
        }

        // Map DB row to DemandProduct interface
        const row = data as any;
        const mapped: DemandProduct = {
          slug: row.slug,
          name: row.name,
          category: row.category || 'Industrial Materials',
          categorySlug: row.category_slug || 'industrial-materials',
          industrySlug: row.industry_slug || 'general',
          subIndustrySlug: row.sub_industry_slug || row.category_slug || 'general',
          definition: row.definition || '',
          industries: row.industries || [],
          grades: row.grades || [],
          specifications: row.specifications || [],
          standards: row.standards || [],
          hsnCodes: row.hsn_codes || [],
          orderSizes: row.order_sizes || '',
          importCountries: row.import_countries || [],
          relatedSlugs: row.related_slugs || [],
          priceRange: row.price_range || '',
          applications: row.applications || [],
          challenges: row.challenges || [],
          marketTrend: row.market_trend || '',
        };

        setProduct(mapped);
        setSource('generated');
      } catch {
        if (!cancelled) {
          setProduct(null);
          setSource(null);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [slug]);

  return { product, source, isLoading: product === undefined };
}
