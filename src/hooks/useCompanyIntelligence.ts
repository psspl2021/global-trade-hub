/**
 * ============================================================
 * useCompanyIntelligence — Single source of truth (frontend)
 * ============================================================
 *
 * Architectural contract:
 *   - Backend RPC `get_company_intelligence_v2` is the single
 *     authority on role resolution and data scope.
 *   - Frontend NEVER decides role or scope.
 *   - Frontend NEVER falls back, simulates, or denies access.
 *   - Frontend only renders what the RPC returns.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CompanyIntelligenceRole =
  | 'ceo'
  | 'cfo'
  | 'manager'
  | 'hr'
  | 'purchaser'
  | string;

export interface CompanyIntelligenceData {
  role: CompanyIntelligenceRole | null;
  company_ids?: string[];
  scope_users?: string[] | null;
  summary?: {
    total_payable?: number;
    overdue?: number;
    payable_7d?: number;
    burn_30d?: number;
  };
  kpis?: any[];
  alerts?: any[];
  actions?: any[];
  [key: string]: any;
}

interface UseCompanyIntelligenceArgs {
  userId?: string | null;
}

interface UseCompanyIntelligenceResult {
  data: CompanyIntelligenceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCompanyIntelligence({
  userId,
}: UseCompanyIntelligenceArgs): UseCompanyIntelligenceResult {
  const [data, setData] = useState<CompanyIntelligenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_company_intelligence_v2' as any,
      { p_user_id: userId } as any
    );

    if (rpcError) {
      console.error('[useCompanyIntelligence] RPC error:', rpcError);
      setError(rpcError.message);
      setData(null);
    } else {
      setData((rpcData as unknown as CompanyIntelligenceData) ?? null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export default useCompanyIntelligence;
