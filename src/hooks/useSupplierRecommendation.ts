/**
 * Supplier Recommendation Engine (Buyer Network-Scoped)
 * Ranks suppliers from buyer's OWN network based on:
 * - Past invitations by this buyer
 * - Participation in this buyer's auctions
 * - Win rate, price competitiveness, relationship strength
 * Includes new supplier boost and relationship boost
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
  isNewSupplier: boolean;
  hasWorkedWithBuyer: boolean;
  badge: 'trusted' | 'high_performer' | 'new_promising' | null;
}

export function useSupplierRecommendation() {
  const [recommendations, setRecommendations] = useState<SupplierRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNetworkMode, setIsNetworkMode] = useState(true);

  const getRecommendations = useCallback(async (category: string, buyerId?: string): Promise<SupplierRecommendation[]> => {
    if (!category) return [];
    setIsLoading(true);
    try {
      let networkSupplierIds: string[] = [];

      if (buyerId && isNetworkMode) {
        // Step 1: Get suppliers previously invited by this buyer
        const { data: invited } = await supabase
          .from('reverse_auction_suppliers')
          .select('supplier_id, auction_id')
          .not('supplier_id', 'is', null);

        // Filter to only this buyer's auctions
        const { data: buyerAuctions } = await supabase
          .from('reverse_auctions')
          .select('id')
          .eq('buyer_id', buyerId);

        const buyerAuctionIds = new Set((buyerAuctions || []).map(a => a.id));

        const invitedByBuyer = (invited || [])
          .filter(i => buyerAuctionIds.has(i.auction_id) && i.supplier_id)
          .map(i => i.supplier_id!);

        // Step 2: Get suppliers who bid in this buyer's auctions
        const { data: bids } = await supabase
          .from('reverse_auction_bids')
          .select('supplier_id, auction_id');

        const participatedInBuyer = (bids || [])
          .filter(b => buyerAuctionIds.has(b.auction_id))
          .map(b => b.supplier_id);

        // Merge + deduplicate
        networkSupplierIds = [...new Set([...invitedByBuyer, ...participatedInBuyer])];
      }

      // Get supplier stats for category
      const { data: stats } = await supabase
        .from('supplier_auction_stats')
        .select('*')
        .eq('category', category)
        .order('win_rate', { ascending: false });

      // Get supplier profiles - scoped to network or all
      let suppliersQuery = supabase
        .from('profiles')
        .select('id, company_name, contact_person, city, email')
        .eq('business_type', 'supplier');

      if (buyerId && isNetworkMode && networkSupplierIds.length > 0) {
        suppliersQuery = suppliersQuery.in('id', networkSupplierIds);
      } else if (buyerId && isNetworkMode && networkSupplierIds.length === 0) {
        // No network suppliers yet - return empty
        setRecommendations([]);
        return [];
      }

      const { data: suppliers } = await suppliersQuery;
      if (!suppliers || suppliers.length === 0) {
        setRecommendations([]);
        return [];
      }

      const statsMap = new Map((stats || []).map((s: any) => [s.supplier_id, s]));
      const networkSet = new Set(networkSupplierIds);

      // Score: 30% win_rate + 30% competitiveness + 20% participation + 10% new boost + 10% relationship
      const scored: SupplierRecommendation[] = suppliers.map((s: any) => {
        const stat = statsMap.get(s.id);
        const winRate = stat ? Number(stat.win_rate || 0) : 0;
        const competitiveness = stat ? Number(stat.avg_price_competitiveness || 0) : 0.5;
        const participations = stat ? Number(stat.total_participations || 0) : 0;
        const maxPart = Math.max(...(stats || []).map((st: any) => Number(st.total_participations || 1)), 1);
        const participationRate = participations / maxPart;
        const isNewSupplier = participations < 3;
        const hasWorkedWithBuyer = networkSet.has(s.id);
        const relationshipBoost = hasWorkedWithBuyer ? 0.1 : 0;

        const score =
          (winRate * 0.3) +
          (competitiveness * 0.3) +
          (participationRate * 0.2) +
          (isNewSupplier ? 0.1 : 0) +
          relationshipBoost;

        // Assign badge
        let badge: SupplierRecommendation['badge'] = null;
        if (hasWorkedWithBuyer && participations >= 3) badge = 'trusted';
        else if (winRate > 0.3) badge = 'high_performer';
        else if (isNewSupplier) badge = 'new_promising';

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
          isNewSupplier,
          hasWorkedWithBuyer,
          badge,
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
  }, [isNetworkMode]);

  return { recommendations, isLoading, getRecommendations, isNetworkMode, setIsNetworkMode };
}
