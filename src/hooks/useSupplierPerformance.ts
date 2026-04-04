/**
 * Supplier Performance Tracking Engine
 * Updates stats after auction completion
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSupplierPerformance() {
  const updateStats = useCallback(async (
    supplierId: string,
    category: string,
    isWinner: boolean,
    bidDelta: number,
    bidValue: number
  ) => {
    try {
      // Get existing stats
      const { data: existing } = await supabase
        .from('supplier_auction_stats')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('category', category)
        .maybeSingle();

      if (existing) {
        const prev = existing as any;
        const newParticipations = (prev.total_participations || 0) + 1;
        const newWins = (prev.total_wins || 0) + (isWinner ? 1 : 0);
        const newWinRate = newWins / newParticipations;
        const newAvgDelta = ((prev.avg_bid_delta || 0) * prev.total_participations + bidDelta) / newParticipations;
        const competitiveness = isWinner ? 1 : Math.max(0, 1 - Math.abs(bidDelta) / 100);

        await supabase
          .from('supplier_auction_stats')
          .update({
            total_participations: newParticipations,
            total_wins: newWins,
            win_rate: newWinRate,
            avg_bid_delta: newAvgDelta,
            avg_price_competitiveness: ((prev.avg_price_competitiveness || 0) * prev.total_participations + competitiveness) / newParticipations,
            total_bid_value: (prev.total_bid_value || 0) + bidValue,
            last_participated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', prev.id);
      } else {
        await supabase
          .from('supplier_auction_stats')
          .insert({
            supplier_id: supplierId,
            category,
            total_participations: 1,
            total_wins: isWinner ? 1 : 0,
            win_rate: isWinner ? 1 : 0,
            avg_bid_delta: bidDelta,
            avg_price_competitiveness: isWinner ? 1 : 0.5,
            total_bid_value: bidValue,
            last_participated_at: new Date().toISOString(),
          } as any);
      }
    } catch (err) {
      console.error('Failed to update supplier stats:', err);
    }
  }, []);

  return { updateStats };
}
