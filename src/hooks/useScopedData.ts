/**
 * useScopedData — single primitive for purchaser-context-aware reads.
 *
 * Architectural contract:
 *   UI = intent → DB = enforcement.
 * The RPCs called here HARD-OVERRIDE p_selected_purchaser when the caller
 * is a purchaser role (DB enforces self-only). This hook never filters by
 * buyer_id/customer_id on the client — that path is forbidden.
 *
 * Usage:
 *   const { data, loading, refetch } = useScopedData('rfq');
 *   const { data, loading, refetch } = useScopedData('auction');
 *   const { data, loading, refetch } = useScopedData('logistics');
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';

export type ScopedEntity = 'rfq' | 'auction' | 'logistics';

const RPC_BY_ENTITY: Record<ScopedEntity, string> = {
  rfq: 'get_scoped_rfqs_by_purchaser',
  auction: 'get_scoped_auctions_by_purchaser',
  logistics: 'get_scoped_logistics_by_purchaser',
};

interface UseScopedDataOptions {
  /** Auto-refresh interval in ms. 0 disables polling. */
  pollMs?: number;
  /** Skip fetching (e.g., entity is gated by another condition). */
  enabled?: boolean;
}

export function useScopedData<T = any>(
  entity: ScopedEntity,
  options: UseScopedDataOptions = {}
) {
  const { pollMs = 0, enabled = true } = options;
  const { user } = useAuth();
  const { selectedPurchaserId } = useBuyerCompanyContext();

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Latest-args ref defeats stale-closure bugs in polling intervals.
  const argsRef = useRef({ userId: user?.id, selectedPurchaserId });
  argsRef.current = { userId: user?.id, selectedPurchaserId };

  const fetchData = useCallback(async () => {
    const { userId, selectedPurchaserId: spid } = argsRef.current;
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    try {
      const { data: rows, error: rpcErr } = await (supabase as any).rpc(
        RPC_BY_ENTITY[entity],
        { p_user_id: userId, p_selected_purchaser: spid }
      );
      if (rpcErr) throw rpcErr;
      setData((rows || []) as T[]);
      setError(null);
    } catch (e: any) {
      console.error(`[useScopedData:${entity}]`, e);
      setError(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetchData();
    if (pollMs > 0) {
      const id = setInterval(fetchData, pollMs);
      return () => clearInterval(id);
    }
  }, [enabled, pollMs, fetchData, user?.id, selectedPurchaserId]);

  return { data, loading, error, refetch: fetchData };
}
