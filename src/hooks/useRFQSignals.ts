import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RFQSignal {
  product_slug: string;
  product_name: string | null;
  rfq_count: number;
  avg_order_size: number;
  top_industries: string[];
  price_trend: string;
}

/** Top products by RFQ count for revenue-weighted internal linking */
export function useTopRFQSignals(limit = 8) {
  return useQuery({
    queryKey: ['rfq-signals-top', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfq_signals')
        .select('product_slug, product_name, rfq_count, avg_order_size, top_industries, price_trend')
        .order('rfq_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as RFQSignal[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

/** Single product RFQ signal */
export function useRFQSignal(slug: string) {
  return useQuery({
    queryKey: ['rfq-signal', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfq_signals')
        .select('product_slug, product_name, rfq_count, avg_order_size, top_industries, price_trend')
        .eq('product_slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as RFQSignal | null;
    },
    staleTime: 1000 * 60 * 30,
  });
}
