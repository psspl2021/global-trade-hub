/**
 * Historical Price Intelligence Engine
 * Computes avg/min/max with outlier removal, trend detection, volatility
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
  trend: 'up' | 'down' | 'stable';
  volatility: 'low' | 'medium' | 'high';
  trendPct: number;
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

      const rawPrices = data.map((d: any) => d.winning_price).filter(Boolean);
      
      // Remove outliers (prices > 2x average)
      const rawAvg = rawPrices.reduce((a: number, b: number) => a + b, 0) / rawPrices.length;
      const cleanPrices = rawPrices.filter((p: number) => p < rawAvg * 2 && p > rawAvg * 0.2);
      const prices = cleanPrices.length > 2 ? cleanPrices : rawPrices;

      const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      // Trend: compare first half avg vs second half avg
      const mid = Math.floor(prices.length / 2);
      const recentAvg = prices.slice(0, mid || 1).reduce((a: number, b: number) => a + b, 0) / (mid || 1);
      const olderAvg = prices.slice(mid).reduce((a: number, b: number) => a + b, 0) / (prices.length - mid || 1);
      const trendPct = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      const trend: 'up' | 'down' | 'stable' = trendPct > 3 ? 'up' : trendPct < -3 ? 'down' : 'stable';

      // Volatility: coefficient of variation
      const variance = prices.reduce((sum: number, p: number) => sum + Math.pow(p - avg, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);
      const cv = avg > 0 ? (stdDev / avg) * 100 : 0;
      const volatility: 'low' | 'medium' | 'high' = cv < 10 ? 'low' : cv < 25 ? 'medium' : 'high';

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
        trend,
        volatility,
        trendPct: Math.round(trendPct * 10) / 10,
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
