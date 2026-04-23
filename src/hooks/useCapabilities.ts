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
  // ── Visibility (read) ──────────────────────────────────────
  | 'can_view_all_auctions'
  | 'can_view_all_quotes'
  | 'can_view_all_pos'
  | 'can_view_full_supplier_identity'
  | 'can_view_purchaser_leaderboard'
  | 'can_view_management_dashboard'
  | 'can_view_company_rfqs'      // purchaser+ : company-wide RFQ read
  | 'can_view_company_auctions'  // purchaser+ : company-wide auction read
  | 'can_view_company_pos'       // purchaser+ : company-wide PO read
  // ── Control (write / approve) ──────────────────────────────
  | 'can_edit_any_rfq'           // manager+   : edit RFQs not authored by self
  | 'can_close_auction'          // manager+   : force-close live auction
  | 'can_award_auction'          // manager+   : award reverse auction
  | 'can_override_pricing'       // exec       : override negotiated/locked price
  | 'can_override_po_approval'   // CEO        : bypass approval chain
  | 'can_switch_purchaser'       // manager+   : peek other purchaser's view
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
