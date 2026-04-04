/**
 * Historical Price Intelligence Engine
 * Computes avg/min/max from past completed auctions for a category
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PriceInsight {
  category: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  auctionCount: number;
  lastAuctions: { title: string; winning_price: number; starting_price: number; savings_pct: number; date: string }[];
  suggestedStartingPrice: number;
}

export function useHistoricalPricing() {
  const [insight, setInsight] = useState<PriceInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getPriceInsight = useCallback(async (category: string): Promise<PriceInsight | null> => {
    if (!category) return null;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('reverse_auctions')
        .select('title, starting_price, winning_price, created_at')
        .eq('category', category)
        .eq('status', 'completed')
        .not('winning_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!data || data.length === 0) {
        setInsight(null);
        return null;
      }

      const prices = data.map((d: any) => d.winning_price).filter(Boolean);
      const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      // Suggest 10% above historical avg as starting price
      const suggested = Math.round(avg * 1.1);

      const result: PriceInsight = {
        category,
        avgPrice: Math.round(avg),
        minPrice: min,
        maxPrice: max,
        auctionCount: data.length,
        lastAuctions: data.slice(0, 5).map((d: any) => ({
          title: d.title,
          winning_price: d.winning_price,
          starting_price: d.starting_price,
          savings_pct: d.starting_price > 0 ? ((d.starting_price - d.winning_price) / d.starting_price * 100) : 0,
          date: d.created_at,
        })),
        suggestedStartingPrice: suggested,
      };

      setInsight(result);
      return result;
    } catch (err) {
      console.error('Failed to get price insight:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { insight, isLoading, getPriceInsight };
}
