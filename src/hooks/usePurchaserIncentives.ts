/**
 * ============================================================
 * PURCHASER INCENTIVE HOOK
 * ============================================================
 * 
 * Manages purchaser incentive declarations.
 * 
 * CRITICAL:
 * - ProcureSaathi does NOT pay incentives
 * - Buyer organisation declares, approves, and pays
 * - ProcureSaathi only MEASURES, DISPLAYS, and AUDITS
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IncentiveDeclaration {
  id: string;
  enterprise_id: string;
  purchaser_id: string;
  period_start: string;
  period_end: string;
  incentive_percentage: number;
  incentive_amount: number;
  currency: string;
  total_savings_basis: number;
  approved_by: string | null;
  approval_role: 'cfo' | 'ceo' | 'admin' | 'hr' | null;
  approved_at: string | null;
  incentive_status: 'declared' | 'approved' | 'paid' | 'cancelled';
  paid_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IncentiveSummary {
  purchaser_id: string;
  total_declared: number;
  total_approved: number;
  total_paid: number;
  current_quarter: {
    id: string;
    percentage: number;
    amount: number;
    currency: string;
    status: string;
    period_start: string;
    period_end: string;
  } | null;
}

export function usePurchaserIncentives(purchaserId?: string) {
  const [declarations, setDeclarations] = useState<IncentiveDeclaration[]>([]);
  const [summary, setSummary] = useState<IncentiveSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getUser();
  }, []);

  const fetchDeclarations = useCallback(async () => {
    const userId = purchaserId || currentUser;
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('purchaser_incentive_declarations' as any)
        .select('*')
        .eq('purchaser_id', userId)
        .order('period_start', { ascending: false });

      if (error) throw error;
      setDeclarations((data || []) as unknown as IncentiveDeclaration[]);
    } catch (err) {
      console.error('[usePurchaserIncentives] Error fetching declarations:', err);
    }
  }, [purchaserId, currentUser]);

  const fetchSummary = useCallback(async () => {
    const userId = purchaserId || currentUser;
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_purchaser_incentive_summary', { p_purchaser_id: userId });

      if (error) throw error;
      setSummary(data as unknown as IncentiveSummary);
    } catch (err) {
      console.error('[usePurchaserIncentives] Error fetching summary:', err);
    }
  }, [purchaserId, currentUser]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDeclarations(), fetchSummary()]);
      setIsLoading(false);
    };

    if (currentUser || purchaserId) {
      loadData();
    }
  }, [fetchDeclarations, fetchSummary, currentUser, purchaserId]);

  return {
    declarations,
    summary,
    isLoading,
    refetch: () => Promise.all([fetchDeclarations(), fetchSummary()]),
  };
}

export default usePurchaserIncentives;
