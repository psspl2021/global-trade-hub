import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuctionAwardInsight {
  id: string;
  title: string;
  winner_supplier_id: string | null;
  winning_price: number | null;
  starting_price: number | null;
  status: string;
  auction_start: string | null;
  auction_end: string | null;
  buyer_id: string;
  price_drop_pct: number;
}

export interface SupplierLeaderEntry {
  supplier_id: string;
  auctions_participated: number;
  wins: number;
  win_rate: number;
  avg_bid_rank: number;
}

export interface BuyerBehavior {
  buyer_id: string;
  auctions_created: number;
  total_bids_received: number;
  avg_suppliers: number;
  avg_bids: number;
}

export interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
  open_rate: number;
  delivery_rate: number;
  failure_rate: number;
}

export function useAuctionIntelligence() {
  const awardInsights = useQuery({
    queryKey: ['auction-award-insights'],
    queryFn: async (): Promise<AuctionAwardInsight[]> => {
      const { data, error } = await supabase
        .from('reverse_auctions')
        .select('id, title, winner_supplier_id, winning_price, starting_price, status, auction_start, auction_end, buyer_id')
        .eq('status', 'completed')
        .order('auction_end', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map(a => ({
        ...a,
        price_drop_pct: a.starting_price && a.winning_price
          ? Math.round(((a.starting_price - a.winning_price) / a.starting_price) * 10000) / 100
          : 0
      }));
    }
  });

  const supplierLeaderboard = useQuery({
    queryKey: ['supplier-auction-leaderboard'],
    queryFn: async (): Promise<SupplierLeaderEntry[]> => {
      const { data, error } = await supabase.rpc('get_supplier_auction_leaderboard');
      if (error) throw error;
      return (data || []) as SupplierLeaderEntry[];
    }
  });

  const buyerBehavior = useQuery({
    queryKey: ['buyer-auction-behavior'],
    queryFn: async (): Promise<BuyerBehavior[]> => {
      // Aggregate from reverse_auctions + bids
      const { data: auctions, error } = await supabase
        .from('reverse_auctions')
        .select('id, buyer_id, status');
      if (error) throw error;

      const { data: bids, error: bidsErr } = await supabase
        .from('reverse_auction_bids')
        .select('auction_id, supplier_id');
      if (bidsErr) throw bidsErr;

      const buyerMap = new Map<string, BuyerBehavior>();
      for (const a of auctions || []) {
        const existing = buyerMap.get(a.buyer_id) || {
          buyer_id: a.buyer_id,
          auctions_created: 0,
          total_bids_received: 0,
          avg_suppliers: 0,
          avg_bids: 0
        };
        existing.auctions_created++;
        const auctionBids = (bids || []).filter(b => b.auction_id === a.id);
        existing.total_bids_received += auctionBids.length;
        const uniqueSuppliers = new Set(auctionBids.map(b => b.supplier_id)).size;
        existing.avg_suppliers = Math.round(
          (existing.avg_suppliers * (existing.auctions_created - 1) + uniqueSuppliers) / existing.auctions_created * 10
        ) / 10;
        existing.avg_bids = Math.round(existing.total_bids_received / existing.auctions_created * 10) / 10;
        buyerMap.set(a.buyer_id, existing);
      }
      return Array.from(buyerMap.values()).sort((a, b) => b.auctions_created - a.auctions_created);
    }
  });

  const emailStats = useQuery({
    queryKey: ['po-email-stats'],
    queryFn: async (): Promise<EmailStats> => {
      const { data, error } = await supabase.from('po_email_logs').select('status, opened_at');
      if (error) throw error;
      const logs = data || [];
      const total = logs.length;
      const sent = logs.filter(l => l.status === 'sent').length;
      const delivered = logs.filter(l => l.status === 'delivered').length;
      const opened = logs.filter(l => l.opened_at).length;
      const failed = logs.filter(l => l.status === 'failed').length;
      return {
        total, sent, delivered, opened, failed,
        open_rate: total > 0 ? Math.round(opened / total * 1000) / 10 : 0,
        delivery_rate: total > 0 ? Math.round((sent + delivered) / total * 1000) / 10 : 0,
        failure_rate: total > 0 ? Math.round(failed / total * 1000) / 10 : 0,
      };
    }
  });

  const overviewMetrics = useQuery({
    queryKey: ['auction-overview-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_auction_intelligence');
      if (error) throw error;
      return data as Record<string, number | null>;
    }
  });

  return { awardInsights, supplierLeaderboard, buyerBehavior, emailStats, overviewMetrics };
}
