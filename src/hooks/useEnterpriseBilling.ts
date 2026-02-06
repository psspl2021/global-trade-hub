/**
 * ============================================================
 * ENTERPRISE BILLING GOVERNANCE HOOK
 * ============================================================
 * 
 * Manages enterprise billing config and fee calculations.
 * 
 * FINANCIAL STRUCTURE (LOCKED):
 * - Fees charged to BUYER ORGANISATION quarterly
 * - NOT commission, NOT per RFQ, NOT supplier-paid
 * - Q1 onboarding is FREE
 * - 0.5% domestic / 2% import-export from Q2
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnterpriseBillingConfig {
  id: string;
  enterprise_id: string;
  enterprise_name: string | null;
  onboarding_start_date: string;
  onboarding_end_date: string;
  billing_active: boolean;
  domestic_fee_percent: number;
  import_export_fee_percent: number;
  billing_cycle: string;
  total_transacted_value: number;
  total_verified_savings: number;
  created_at: string;
  updated_at: string;
}

export interface BillingQuarter {
  id: string;
  enterprise_id: string;
  quarter_start: string;
  quarter_end: string;
  domestic_volume: number;
  import_export_volume: number;
  domestic_fee: number;
  import_export_fee: number;
  total_fee: number;
  is_onboarding_quarter: boolean;
  invoice_status: string;
  invoice_generated_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export function useEnterpriseBilling(enterpriseId?: string) {
  const [config, setConfig] = useState<EnterpriseBillingConfig | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingQuarter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('enterprise_billing_config' as any)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const configData = data as unknown as EnterpriseBillingConfig;
        setConfig(configData);
        
        // Calculate onboarding status
        const endDate = new Date(configData.onboarding_end_date);
        const today = new Date();
        const isStillOnboarding = today <= endDate;
        setIsOnboarding(isStillOnboarding);
        
        // Calculate days remaining
        if (isStillOnboarding) {
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(diffDays);
        } else {
          setDaysRemaining(0);
        }
      }
    } catch (err) {
      console.error('[useEnterpriseBilling] Error fetching config:', err);
    }
  }, [enterpriseId]);

  const fetchBillingHistory = useCallback(async () => {
    if (!config?.id) return;

    try {
      const { data, error } = await supabase
        .from('enterprise_billing_history' as any)
        .select('*')
        .eq('enterprise_id', config.id)
        .order('quarter_start', { ascending: false });

      if (error) throw error;
      setBillingHistory((data || []) as unknown as BillingQuarter[]);
    } catch (err) {
      console.error('[useEnterpriseBilling] Error fetching history:', err);
    }
  }, [config?.id]);

  const calculateFee = useCallback(async (quarterStart: string, quarterEnd: string) => {
    if (!config?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('calculate_enterprise_platform_fee', {
          p_enterprise_id: config.id,
          p_quarter_start: quarterStart,
          p_quarter_end: quarterEnd,
        });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[useEnterpriseBilling] Error calculating fee:', err);
      return null;
    }
  }, [config?.id]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchConfig();
      setIsLoading(false);
    };
    loadData();
  }, [fetchConfig]);

  useEffect(() => {
    if (config?.id) {
      fetchBillingHistory();
    }
  }, [config?.id, fetchBillingHistory]);

  return {
    config,
    billingHistory,
    isLoading,
    isOnboarding,
    daysRemaining,
    calculateFee,
    refetch: fetchConfig,
  };
}

export default useEnterpriseBilling;
