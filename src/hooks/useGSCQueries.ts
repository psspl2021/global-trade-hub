import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GSCQuery {
  page_slug: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function useGSCQueries(slug: string) {
  return useQuery({
    queryKey: ['gsc-queries', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_queries')
        .select('page_slug, query, clicks, impressions, ctr, position')
        .eq('page_slug', slug)
        .order('impressions', { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data || []) as GSCQuery[];
    },
    staleTime: 1000 * 60 * 60,
  });
}
