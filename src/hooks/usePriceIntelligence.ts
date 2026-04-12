import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PriceIntelligence {
  available: boolean;
  price_min?: number;
  price_max?: number;
  price_avg?: number;
  recorded_at?: string;
}

export interface PriceComparison {
  intelligence: PriceIntelligence;
  yourPrice: number;
  overpayPercent: number | null;
  verdict: 'good' | 'fair' | 'overpaying' | 'no_data';
}

export function usePriceIntelligence(product: string | null, city?: string | null) {
  const [intel, setIntel] = useState<PriceIntelligence>({ available: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!product) { setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_price_intelligence', {
          p_product: product,
          p_city: city || null,
        });
        if (error) throw error;
        setIntel(data as any as PriceIntelligence);
      } catch {
        setIntel({ available: false });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [product, city]);

  const compare = (yourPrice: number): PriceComparison => {
    if (!intel.available || !intel.price_avg) {
      return { intelligence: intel, yourPrice, overpayPercent: null, verdict: 'no_data' };
    }
    const overpayPercent = ((yourPrice - intel.price_avg) / intel.price_avg) * 100;
    let verdict: PriceComparison['verdict'] = 'good';
    if (overpayPercent > 10) verdict = 'overpaying';
    else if (overpayPercent > 3) verdict = 'fair';

    return { intelligence: intel, yourPrice, overpayPercent, verdict };
  };

  return { intel, loading, compare };
}
