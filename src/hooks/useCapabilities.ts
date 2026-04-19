/**
 * useCapabilities — single source of truth for governance permissions on the client.
 *
 * Backend `get_my_capabilities()` resolves the caller's role via user_company_access
 * + user_roles, joins role_capabilities, returns granted capability strings.
 *
 * Never check `role === 'ceo'` in components. Always check capabilities.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Capability =
  | 'can_view_all_auctions'
  | 'can_view_all_quotes'
  | 'can_override_po_approval'
  | 'can_view_full_supplier_identity'
  | 'can_view_all_pos'
  | 'can_view_purchaser_leaderboard'
  | 'can_switch_purchaser'
  | 'can_view_management_dashboard'
  | string;

let _cache: { userId: string; caps: Set<string>; at: number } | null = null;
const TTL_MS = 60_000;

export function useCapabilities() {
  const { user } = useAuth();
  const [caps, setCaps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchCaps = useCallback(async () => {
    if (!user?.id) {
      setCaps(new Set());
      setLoading(false);
      return;
    }
    if (_cache && _cache.userId === user.id && Date.now() - _cache.at < TTL_MS) {
      setCaps(_cache.caps);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_my_capabilities' as any);
    if (error) {
      console.error('[useCapabilities]', error);
      setCaps(new Set());
    } else {
      const set = new Set<string>(Array.isArray(data) ? (data as string[]) : []);
      _cache = { userId: user.id, caps: set, at: Date.now() };
      setCaps(set);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchCaps();
  }, [fetchCaps]);

  const has = useCallback((c: Capability) => caps.has(c), [caps]);

  return { capabilities: caps, has, loading, refetch: fetchCaps };
}

export default useCapabilities;
