/**
 * ============================================================
 * USE SUPPLIER DEMAND ACCESS HOOK
 * ============================================================
 * 
 * Hook for suppliers to check their access tier and view
 * monetisation-filtered demand data.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AccessTier = 'free' | 'premium' | 'exclusive';

export interface SupplierAccessInfo {
  tier: AccessTier;
  minIntentVisible: number;
  maxAlertsPerDay: number;
  earlyAccessHours: number;
  expiresAt: string | null;
}

export interface VisibleDemandRow {
  category: string;
  country: string;
  intent: number;
  rfqs: number;
  source: string;
  is_locked: boolean;
  can_access: boolean;
  access_reason: string;
}

interface UseSupplierDemandAccessOptions {
  daysBack?: number;
}

export function useSupplierDemandAccess(options: UseSupplierDemandAccessOptions = {}) {
  const { daysBack = 7 } = options;
  const { user } = useAuth();
  const [accessInfo, setAccessInfo] = useState<SupplierAccessInfo | null>(null);
  const [visibleDemand, setVisibleDemand] = useState<VisibleDemandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccessInfo = useCallback(async () => {
    if (!user) {
      setAccessInfo(null);
      return;
    }

    try {
      const { data, error: queryError } = await supabase
        .from('supplier_demand_access')
        .select('*')
        .eq('supplier_id', user.id)
        .maybeSingle();

      if (queryError) throw queryError;

      if (data) {
        setAccessInfo({
          tier: data.access_tier as AccessTier,
          minIntentVisible: data.min_intent_visible,
          maxAlertsPerDay: data.max_alerts_per_day,
          earlyAccessHours: data.early_access_hours,
          expiresAt: data.expires_at,
        });
      } else {
        // Default to free tier
        setAccessInfo({
          tier: 'free',
          minIntentVisible: 0,
          maxAlertsPerDay: 5,
          earlyAccessHours: 0,
          expiresAt: null,
        });
      }
    } catch (err) {
      console.error('[useSupplierDemandAccess] Error fetching access:', err);
      setError(err as Error);
    }
  }, [user]);

  const fetchVisibleDemand = useCallback(async () => {
    if (!user) {
      setVisibleDemand([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('get_supplier_visible_demand', {
        p_supplier_id: user.id,
        p_days_back: daysBack,
      });

      if (rpcError) throw rpcError;
      setVisibleDemand((data || []) as VisibleDemandRow[]);
      setError(null);
    } catch (err) {
      console.error('[useSupplierDemandAccess] Error fetching demand:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, daysBack]);

  useEffect(() => {
    Promise.all([fetchAccessInfo(), fetchVisibleDemand()]);
  }, [fetchAccessInfo, fetchVisibleDemand]);

  const refresh = useCallback(() => {
    setLoading(true);
    return Promise.all([fetchAccessInfo(), fetchVisibleDemand()]);
  }, [fetchAccessInfo, fetchVisibleDemand]);

  // Computed stats
  const stats = {
    totalSignals: visibleDemand.length,
    accessibleSignals: visibleDemand.filter(d => d.can_access).length,
    lockedLanes: visibleDemand.filter(d => d.is_locked).length,
    highIntentCount: visibleDemand.filter(d => d.intent >= 70).length,
  };

  return {
    accessInfo,
    visibleDemand,
    loading,
    error,
    stats,
    refresh,
    isFreeTier: accessInfo?.tier === 'free',
    isPremium: accessInfo?.tier === 'premium',
    isExclusive: accessInfo?.tier === 'exclusive',
  };
}

export default useSupplierDemandAccess;
