/**
 * ============================================================
 * useUserScope — frontend mirror of backend `get_user_scope()`
 * ============================================================
 *
 * Single source of truth on the client for governance scope.
 * Backend `get_user_scope(p_user_id)` returns:
 *   { company_id, role, is_self_only, is_management, is_executive }
 *
 * Components MUST use this hook + capabilities. They MUST NOT
 * re-derive scope from role strings (e.g. role === 'cfo'). Doing
 * so re-fragments the model the DB has already centralized and
 * causes UI/backend divergence bugs.
 *
 * Pair with `useCapabilities()` for action-level gating:
 *   - scope flags  → "what shape of data this user sees"
 *   - capabilities → "what operations they can perform"
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCapabilities } from '@/hooks/useCapabilities';

export interface UserScope {
  companyId: string | null;
  role: string | null;
  isSelfOnly: boolean;
  isManagement: boolean;
  isExecutive: boolean;
  canSwitchPurchaser: boolean;
  canViewManagementDashboard: boolean;
  canViewLeaderboard: boolean;
  loading: boolean;
}

const DEFAULT: Omit<UserScope, 'loading'> = {
  companyId: null,
  role: null,
  isSelfOnly: false,
  isManagement: false,
  isExecutive: false,
  canSwitchPurchaser: false,
  canViewManagementDashboard: false,
  canViewLeaderboard: false,
};

// Module-level cache, keyed by userId. Invalidated on:
//   - user change (different userId in the key check below)
//   - explicit refetch() (e.g. after company/role switch)
//   - clearUserScopeCache() on logout (called from auth layer)
// Intentionally NOT cross-tab synced — auth state already drives this per tab.
let _cache: { userId: string; scope: Omit<UserScope, 'loading'>; at: number } | null = null;
const TTL_MS = 60_000;

export function clearUserScopeCache() {
  _cache = null;
}

export function useUserScope(): UserScope & { refetch: () => Promise<void> } {
  const { user } = useAuth();
  const { has, loading: capsLoading } = useCapabilities();
  const [scope, setScope] = useState<Omit<UserScope, 'loading'>>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const fetchScope = useCallback(async () => {
    if (!user?.id) {
      // Identity gone → drop any stale cache from the previous user.
      _cache = null;
      setScope(DEFAULT);
      setLoading(false);
      return;
    }
    // Defensive: any cache that doesn't match the current user is invalid.
    if (_cache && _cache.userId !== user.id) {
      _cache = null;
    }
    if (_cache && _cache.userId === user.id && Date.now() - _cache.at < TTL_MS) {
      setScope(_cache.scope);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_user_scope' as any, { p_user_id: user.id });
    if (error) {
      console.error('[useUserScope]', error);
      setScope(DEFAULT);
    } else {
      // Tolerant unwrap: works for SETOF (array), single RECORD (object),
      // or null. Future signature changes won't silently break gating.
      const row: any = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
      const next: Omit<UserScope, 'loading'> = {
        companyId: row?.company_id ?? null,
        role: row?.role ?? null,
        isSelfOnly: !!row?.is_self_only,
        isManagement: !!row?.is_management,
        isExecutive: !!row?.is_executive,
        // Capabilities are layered in from useCapabilities at return-time.
        canSwitchPurchaser: false,
        canViewManagementDashboard: false,
        canViewLeaderboard: false,
      };
      _cache = { userId: user.id, scope: next, at: Date.now() };
      setScope(next);
    }
    setLoading(false);
  }, [user?.id]);

  const refetch = useCallback(async () => {
    // Force-bypass the cache (used after company switch / role change).
    _cache = null;
    await fetchScope();
  }, [fetchScope]);

  useEffect(() => {
    fetchScope();
  }, [fetchScope]);

  // CRITICAL: scope and capabilities resolve independently. If we expose
  // capability flags before useCapabilities has loaded, gated UI flickers
  // (rendered → hidden, or vice versa). Hold capability flags at `false`
  // until BOTH are ready, and keep `loading` true until both resolve.
  const ready = !loading && !capsLoading;

  return {
    ...scope,
    canSwitchPurchaser: ready ? has('can_switch_purchaser') : false,
    canViewManagementDashboard: ready ? has('can_view_management_dashboard') : false,
    canViewLeaderboard: ready ? has('can_view_purchaser_leaderboard') : false,
    loading: !ready,
    refetch,
  };
}

export default useUserScope;

