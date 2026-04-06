/**
 * Award Recommendation Engine
 * AI-scored supplier ranking beyond just lowest price
 * Factors: price competitiveness, reliability, win history, relationship strength
 */
import { useMemo } from 'react';
import { ReverseAuctionBid, getRankedBids } from './useReverseAuction';

export interface SupplierScore {
  supplier_id: string;
  bid_price: number;
  rank: number;
  // Sub-scores (0-100)
  price_score: number;
  reliability_score: number;
  relationship_score: number;
  // Composite
  composite_score: number;
  recommendation: 'strong' | 'good' | 'consider';
  reasoning: string[];
}

interface SupplierHistory {
  supplier_id: string;
  total_auctions: number;
  wins: number;
  avg_price_ratio: number; // avg bid / avg starting price
}

export function computeAwardScores(
  bids: ReverseAuctionBid[],
  startingPrice: number,
  supplierHistory?: Map<string, SupplierHistory>
): SupplierScore[] {
  const ranked = getRankedBids(bids);
  if (ranked.length === 0) return [];

  const lowestPrice = ranked[0].bid_price;
  const highestPrice = ranked[ranked.length - 1]?.bid_price || lowestPrice;
  const priceRange = Math.max(1, highestPrice - lowestPrice);

  return ranked.map((bid) => {
    const history = supplierHistory?.get(bid.supplier_id);

    // Price competitiveness (40% weight) — lower is better
    const price_score = Math.round(
      100 - ((bid.bid_price - lowestPrice) / priceRange) * 100
    );

    // Reliability (30% weight) — based on past participation & wins
    let reliability_score = 50; // default for unknown suppliers
    if (history) {
      const winRate = history.wins / Math.max(1, history.total_auctions);
      reliability_score = Math.round(
        Math.min(100, winRate * 100 * 0.6 + Math.min(history.total_auctions, 10) * 4)
      );
    }

    // Relationship strength (30% weight) — frequency of engagement
    let relationship_score = 30; // default
    if (history) {
      relationship_score = Math.round(
        Math.min(100, history.total_auctions * 10 + (history.wins > 0 ? 20 : 0))
      );
    }

    // Composite: weighted average
    const composite_score = Math.round(
      price_score * 0.4 + reliability_score * 0.3 + relationship_score * 0.3
    );

    // Reasoning
    const reasoning: string[] = [];
    const savingsPct = ((startingPrice - bid.bid_price) / startingPrice * 100).toFixed(1);
    reasoning.push(`${savingsPct}% savings from starting price`);

    if (bid.rank === 1) reasoning.push('Lowest bid (L1)');
    else reasoning.push(`L${bid.rank} — ₹${(bid.bid_price - lowestPrice).toLocaleString('en-IN')} above L1`);

    if (history) {
      reasoning.push(`${history.total_auctions} past auctions, ${history.wins} wins`);
      if (history.avg_price_ratio < 0.85) reasoning.push('Consistently competitive pricing');
    } else {
      reasoning.push('New supplier — no past history');
    }

    const recommendation: SupplierScore['recommendation'] =
      composite_score >= 75 ? 'strong' :
      composite_score >= 50 ? 'good' : 'consider';

    return {
      supplier_id: bid.supplier_id,
      bid_price: bid.bid_price,
      rank: bid.rank,
      price_score,
      reliability_score,
      relationship_score,
      composite_score,
      recommendation,
      reasoning,
    };
  }).sort((a, b) => b.composite_score - a.composite_score);
}

export function useAwardRecommendation(
  bids: ReverseAuctionBid[],
  startingPrice: number,
  supplierHistory?: Map<string, SupplierHistory>
) {
  return useMemo(
    () => computeAwardScores(bids, startingPrice, supplierHistory),
    [bids, startingPrice, supplierHistory]
  );
}
