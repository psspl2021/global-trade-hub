/**
 * useScopedAuctionMetrics — single-call auction analytics.
 *
 * Returns lifetime + recent-window metrics in ONE RPC round-trip.
 * Replaces the previous double-fetch pattern (recent + all).
 *
 * DB enforces purchaser-self-only for purchaser role; UI is advisory.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';

export interface ScopedAuctionMetrics {
  total_auctions: number;
  completed_auctions: number;
  total_savings: number;
  recent_auctions: number;
  recent_completed: number;
  recent_savings: number;
  avg_savings_pct: number;
}

const ZERO: ScopedAuctionMetrics = {
  total_auctions: 0,
  completed_auctions: 0,
  total_savings: 0,
  recent_auctions: 0,
  recent_completed: 0,
  recent_savings: 0,
  avg_savings_pct: 0,
};

export function useScopedAuctionMetrics(recentMonths = 6, enabled = true) {
  const { user } = useAuth();
  const { selectedPurchaserId } = useBuyerCompanyContext();

  const [metrics, setMetrics] = useState<ScopedAuctionMetrics>(ZERO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const argsRef = useRef({ userId: user?.id, spid: selectedPurchaserId, recentMonths });
  argsRef.current = { userId: user?.id, spid: selectedPurchaserId, recentMonths };

  const fetchMetrics = useCallback(async () => {
    const { userId, spid, recentMonths: rm } = argsRef.current;
    if (!userId) {
      setMetrics(ZERO);
      setLoading(false);
      return;
    }
    try {
      const { data, error: rpcErr } = await (supabase as any).rpc(
        'get_scoped_auction_metrics',
        {
          p_user_id: userId,
          p_selected_purchaser: spid,
          p_recent_months: rm,
        }
      );
      if (rpcErr) throw rpcErr;
      const row = Array.isArray(data) ? data[0] : data;
      setMetrics(row ? {
        total_auctions: Number(row.total_auctions) || 0,
        completed_auctions: Number(row.completed_auctions) || 0,
        total_savings: Number(row.total_savings) || 0,
        recent_auctions: Number(row.recent_auctions) || 0,
        recent_completed: Number(row.recent_completed) || 0,
        recent_savings: Number(row.recent_savings) || 0,
        avg_savings_pct: Number(row.avg_savings_pct) || 0,
      } : ZERO);
      setError(null);
    } catch (e: any) {
      console.error('[useScopedAuctionMetrics]', e);
      setError(e);
      setMetrics(ZERO);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetchMetrics();
  }, [enabled, fetchMetrics, user?.id, selectedPurchaserId, recentMonths]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
