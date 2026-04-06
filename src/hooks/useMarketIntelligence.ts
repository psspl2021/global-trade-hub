/**
 * Market Intelligence Engine
 * Replaces prediction with real DB-driven market range, delta insight, and decision confidence
 */
import { useMemo, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReverseAuctionBid } from './useReverseAuction';

export interface MarketInsight {
  marketLow: number;
  marketHigh: number;
  avgPrice: number;
  sampleSize: number;
  dropPotential: 'low' | 'medium' | 'high';
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Compute market insight from historical prices + live bid context
 */
export function computeMarketInsight(
  bids: ReverseAuctionBid[],
  startingPrice: number,
  historicalPrices: number[]
): MarketInsight | null {
  if (historicalPrices.length === 0) return null;

  const sorted = [...historicalPrices].sort((a, b) => a - b);

  const marketLow = sorted[Math.floor(sorted.length * 0.2)];
  const marketHigh = sorted[Math.floor(sorted.length * 0.8)];
  const avgPrice = sorted.reduce((sum, p) => sum + p, 0) / sorted.length;

  const uniqueBidders = new Set(bids.map(b => b.supplier_id)).size;
  const bidCount = bids.length;

  // Drop potential based on competition density
  let dropPotential: MarketInsight['dropPotential'] = 'low';
  if (uniqueBidders >= 4 && bidCount > 5) dropPotential = 'high';
  else if (uniqueBidders >= 2) dropPotential = 'medium';

  // Confidence based on historical sample size
  let confidence: MarketInsight['confidence'] = 'low';
  if (historicalPrices.length >= 20) confidence = 'high';
  else if (historicalPrices.length >= 8) confidence = 'medium';

  return {
    marketLow,
    marketHigh,
    avgPrice,
    sampleSize: historicalPrices.length,
    dropPotential,
    confidence,
  };
}

/**
 * Hook: fetches historical winning prices for same category and computes market insight
 */
export function useMarketIntelligence(
  bids: ReverseAuctionBid[],
  startingPrice: number,
  productSlug: string | null
) {
  const [historicalPrices, setHistoricalPrices] = useState<number[]>([]);
  const [latestAuctionDaysAgo, setLatestAuctionDaysAgo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productSlug) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Fetch winning prices from completed auctions in same category
        const { data } = await supabase
          .from('reverse_auctions')
          .select('current_price, starting_price, created_at')
          .eq('product_slug', productSlug)
          .eq('status', 'completed')
          .not('current_price', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!cancelled && data) {
          const prices = data
            .map((a: any) => a.current_price as number)
            .filter((p: number) => p > 0);

          if (prices.length > 2) {
            const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
            const filtered = prices.filter(p => p < avg * 2);
            setHistoricalPrices(filtered.length >= 2 ? filtered : prices);
          } else {
            setHistoricalPrices(prices);
          }

          // Data freshness — robust reduce instead of index-based
          const latest = data.reduce((max: string | null, row: any) => {
            if (!row.created_at) return max;
            return !max || new Date(row.created_at) > new Date(max) ? row.created_at : max;
          }, null);
          if (latest) {
            setLatestAuctionDaysAgo(Math.floor((Date.now() - new Date(latest).getTime()) / (1000 * 60 * 60 * 24)));
          }
        }
      } catch (err) {
        console.error('[MarketIntelligence] fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [productSlug]);

  const insight = useMemo(
    () => computeMarketInsight(bids, startingPrice, historicalPrices),
    [bids, startingPrice, historicalPrices]
  );

  return { insight, loading, latestAuctionDaysAgo };
}
