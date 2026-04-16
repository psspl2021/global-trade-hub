/**
 * ============================================================
 * useCompanyIntelligence — Single source of truth (frontend)
 * ============================================================
 *
 * Architectural contract:
 *   - Backend RPC `get_company_intelligence` is the single
 *     authority on scope, role, and data visibility.
 *   - Frontend NEVER falls back to another view if data is empty.
 *   - Frontend NEVER simulates missing data.
 *   - Frontend NEVER denies access — backend already enforces scope.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useCompanyIntelligence({
 *     companyId, userId, view,
 *   });
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CompanyIntelligenceView = 'CEO' | 'MANAGER' | 'HR';
export type CompanyIntelligenceRole = 'CEO' | 'CFO' | 'MANAGER' | 'HR' | 'PURCHASER' | string;

export interface CompanyIntelligenceData {
  role: CompanyIntelligenceRole;
  type?: string;
  base_currency?: string;
  summary?: {
    total_payable?: number;
    overdue?: number;
    payable_7d?: number;
  };
  access_scope?: {
    categories?: string[] | null;
    team_size?: number;
  };
  // HR-only payload
  team_size?: number;
  active_purchasers?: number;
  active_managers?: number;
  [key: string]: any;
}

interface UseCompanyIntelligenceArgs {
  companyId?: string | null;
  userId?: string | null;
  view: CompanyIntelligenceView;
}

interface UseCompanyIntelligenceResult {
  data: CompanyIntelligenceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCompanyIntelligence({
  companyId,
  userId,
  view,
}: UseCompanyIntelligenceArgs): UseCompanyIntelligenceResult {
  const [data, setData] = useState<CompanyIntelligenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId || !userId || !view) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_company_intelligence',
      {
        p_company_id: companyId,
        p_user_id: userId,
        p_view: view,
      }
    );

    if (rpcError) {
      console.error('[useCompanyIntelligence] RPC error:', rpcError);
      setError(rpcError.message);
      setData(null);
    } else {
      // Render exactly what backend returns. No fallback. No simulation.
      setData((rpcData as unknown as CompanyIntelligenceData) ?? null);
    }
    setLoading(false);
  }, [companyId, userId, view]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export default useCompanyIntelligence;
