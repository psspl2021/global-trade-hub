import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StrikingDistanceQuery {
  page_slug: string;
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export function useGSCStrikingDistance(slug: string) {
  return useQuery({
    queryKey: ['gsc-striking', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_striking_distance')
        .select('page_slug, query, position, impressions, clicks, ctr')
        .eq('page_slug', slug)
        .eq('is_active', true)
        .order('impressions', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as StrikingDistanceQuery[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
