/**
 * Supplier Relationship Graph
 * Builds a frequency-based relationship map for a buyer's supplier network
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierNode {
  supplier_id: string;
  participation_count: number;
  wins: number;
  avg_bid_ratio: number; // avg(bid_price / starting_price)
  categories: string[];
  last_active: string | null;
  strength: 'strong' | 'moderate' | 'weak';
}

export function useSupplierGraph(buyerId: string | null) {
  const [nodes, setNodes] = useState<SupplierNode[]>([]);
  const [loading, setLoading] = useState(false);

  const buildGraph = useCallback(async () => {
    if (!buyerId) return;
    setLoading(true);
    try {
      // Get all buyer's auctions
      const { data: auctions } = await supabase
        .from('reverse_auctions')
        .select('id, category, starting_price, winner_supplier_id')
        .eq('buyer_id', buyerId);

      if (!auctions || auctions.length === 0) { setNodes([]); return; }

      const auctionIds = auctions.map(a => a.id);
      const auctionMap = new Map(auctions.map(a => [a.id, a]));

      // Get all bids for these auctions
      const { data: bids } = await supabase
        .from('reverse_auction_bids')
        .select('supplier_id, auction_id, bid_price, created_at')
        .in('auction_id', auctionIds);

      if (!bids) { setNodes([]); return; }

      // Aggregate per supplier
      const supplierMap = new Map<string, {
        count: number;
        wins: number;
        bidRatios: number[];
        categories: Set<string>;
        lastActive: string | null;
      }>();

      for (const bid of bids) {
        const auction = auctionMap.get(bid.auction_id);
        if (!auction) continue;

        let entry = supplierMap.get(bid.supplier_id);
        if (!entry) {
          entry = { count: 0, wins: 0, bidRatios: [], categories: new Set(), lastActive: null };
          supplierMap.set(bid.supplier_id, entry);
        }

        // Count unique auctions (use Set if needed, but count is fine for frequency)
        entry.count++;
        if (auction.starting_price > 0) {
          entry.bidRatios.push(bid.bid_price / auction.starting_price);
        }
        if (auction.category) entry.categories.add(auction.category);
        if (!entry.lastActive || bid.created_at > entry.lastActive) {
          entry.lastActive = bid.created_at;
        }
        if (auction.winner_supplier_id === bid.supplier_id) {
          entry.wins++;
        }
      }

      // Deduplicate auction count per supplier
      const auctionParticipation = new Map<string, Set<string>>();
      for (const bid of bids) {
        if (!auctionParticipation.has(bid.supplier_id)) {
          auctionParticipation.set(bid.supplier_id, new Set());
        }
        auctionParticipation.get(bid.supplier_id)!.add(bid.auction_id);
      }

      const result: SupplierNode[] = [];
      for (const [supplierId, entry] of supplierMap) {
        const uniqueAuctions = auctionParticipation.get(supplierId)?.size || 0;
        const avgRatio = entry.bidRatios.length > 0
          ? entry.bidRatios.reduce((a, b) => a + b, 0) / entry.bidRatios.length
          : 1;

        const strength: SupplierNode['strength'] =
          uniqueAuctions >= 5 ? 'strong' :
          uniqueAuctions >= 2 ? 'moderate' : 'weak';

        result.push({
          supplier_id: supplierId,
          participation_count: uniqueAuctions,
          wins: entry.wins,
          avg_bid_ratio: Math.round(avgRatio * 100) / 100,
          categories: Array.from(entry.categories),
          last_active: entry.lastActive,
          strength,
        });
      }

      result.sort((a, b) => b.participation_count - a.participation_count);
      setNodes(result);
    } catch (err) {
      console.error('Failed to build supplier graph:', err);
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => { buildGraph(); }, [buildGraph]);

  return { nodes, loading, refresh: buildGraph };
}
