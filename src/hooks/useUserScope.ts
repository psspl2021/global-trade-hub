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

let _cache: { userId: string; scope: Omit<UserScope, 'loading'>; at: number } | null = null;
const TTL_MS = 60_000;

export function useUserScope(): UserScope & { refetch: () => Promise<void> } {
  const { user } = useAuth();
  const { has, loading: capsLoading } = useCapabilities();
  const [scope, setScope] = useState<Omit<UserScope, 'loading'>>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const fetchScope = useCallback(async () => {
    if (!user?.id) {
      setScope(DEFAULT);
      setLoading(false);
      return;
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
      const row = Array.isArray(data) && data.length > 0 ? (data[0] as any) : null;
      const next: Omit<UserScope, 'loading'> = {
        companyId: row?.company_id ?? null,
        role: row?.role ?? null,
        isSelfOnly: !!row?.is_self_only,
        isManagement: !!row?.is_management,
        isExecutive: !!row?.is_executive,
        // Capabilities are layered in below from useCapabilities; keep the
        // raw scope here and merge in the return statement.
        canSwitchPurchaser: false,
        canViewManagementDashboard: false,
        canViewLeaderboard: false,
      };
      _cache = { userId: user.id, scope: next, at: Date.now() };
      setScope(next);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchScope();
  }, [fetchScope]);

  return {
    ...scope,
    canSwitchPurchaser: has('can_switch_purchaser'),
    canViewManagementDashboard: has('can_view_management_dashboard'),
    canViewLeaderboard: has('can_view_purchaser_leaderboard'),
    loading: loading || capsLoading,
    refetch: fetchScope,
  };
}

export default useUserScope;
