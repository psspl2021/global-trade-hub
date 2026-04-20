/**
 * Shared, deduped fetcher for `get_scoped_auctions_by_purchaser`.
 *
 * Without this, the reverse-auction dashboard fires the same scoped RPC
 * 4–5 times in parallel (list, count, modules, savings analytics ×2),
 * which makes the page take several seconds to load — especially when the
 * acting purchaser has many auctions. This module:
 *   - Dedupes concurrent in-flight calls with identical params
 *   - Caches results per scope key for a short TTL
 *   - Lets components subscribe to the same underlying data
 */
import { supabase } from '@/integrations/supabase/client';

type Params = {
  p_user_id: string;
  p_selected_purchaser: string | null;
  p_status?: string | null;
  p_from?: string | null;
  p_to?: string | null;
  p_has_winner?: boolean | null;
  p_limit?: number;
  p_offset?: number;
};

const TTL_MS = 30_000;

const cache = new Map<string, { ts: number; rows: any[] }>();
const inflight = new Map<string, Promise<any[]>>();

function keyOf(p: Params): string {
  return JSON.stringify({
    u: p.p_user_id,
    s: p.p_selected_purchaser ?? null,
    st: p.p_status ?? null,
    f: p.p_from ?? null,
    t: p.p_to ?? null,
    w: p.p_has_winner ?? null,
    l: p.p_limit ?? null,
    o: p.p_offset ?? null,
  });
}

export async function fetchScopedAuctions(p: Params): Promise<any[]> {
  const key = keyOf(p);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.rows;
  }
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const { data, error } = await (supabase as any).rpc(
      'get_scoped_auctions_by_purchaser',
      p
    );
    if (error) {
      inflight.delete(key);
      throw error;
    }
    const rows = (data || []) as any[];
    cache.set(key, { ts: Date.now(), rows });
    inflight.delete(key);
    return rows;
  })();

  inflight.set(key, promise);
  return promise;
}

export function invalidateScopedAuctions() {
  cache.clear();
  inflight.clear();
}
