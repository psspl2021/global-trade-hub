/**
 * Supplier Recommendation Engine
 * Ranks suppliers based on: category match, win rate, price competitiveness, participation
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierRecommendation {
  supplier_id: string;
  company_name: string;
  contact_person: string;
  city: string | null;
  email: string | null;
  category: string;
  win_rate: number;
  participation_rate: number;
  avg_price_competitiveness: number;
  score: number;
  total_participations: number;
  total_wins: number;
}

export function useSupplierRecommendation() {
  const [recommendations, setRecommendations] = useState<SupplierRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getRecommendations = useCallback(async (category: string): Promise<SupplierRecommendation[]> => {
    if (!category) return [];
    setIsLoading(true);
    try {
      // Get supplier stats for category
      const { data: stats } = await supabase
        .from('supplier_auction_stats')
        .select('*')
        .eq('category', category)
        .order('win_rate', { ascending: false });

      // Get supplier profiles
      const { data: suppliers } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person, city, email')
        .eq('business_type', 'supplier');

      if (!suppliers) return [];

      const statsMap = new Map((stats || []).map((s: any) => [s.supplier_id, s]));

      // Score: 40% win_rate + 40% price_competitiveness + 20% participation_rate
      const scored: SupplierRecommendation[] = suppliers.map((s: any) => {
        const stat = statsMap.get(s.id);
        const winRate = stat ? Number(stat.win_rate || 0) : 0;
        const competitiveness = stat ? Number(stat.avg_price_competitiveness || 0) : 0.5;
        const participations = stat ? Number(stat.total_participations || 0) : 0;
        const maxPart = Math.max(...(stats || []).map((st: any) => Number(st.total_participations || 1)), 1);
        const participationRate = participations / maxPart;

        const score = (winRate * 0.4) + (competitiveness * 0.4) + (participationRate * 0.2);

        return {
          supplier_id: s.id,
          company_name: s.company_name || 'Unknown',
          contact_person: s.contact_person || '',
          city: s.city,
          email: s.email,
          category,
          win_rate: winRate,
          participation_rate: participationRate,
          avg_price_competitiveness: competitiveness,
          score,
          total_participations: participations,
          total_wins: stat ? Number(stat.total_wins || 0) : 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

      setRecommendations(scored);
      return scored;
    } catch (err) {
      console.error('Failed to get supplier recommendations:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { recommendations, isLoading, getRecommendations };
}
