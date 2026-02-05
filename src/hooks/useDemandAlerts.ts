/**
 * ============================================================
 * USE DEMAND ALERTS HOOK
 * ============================================================
 * 
 * Hook for fetching and managing demand alerts.
 * Works for both admin (all alerts) and suppliers (filtered).
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DemandAlert {
  id: string;
  alert_type: 'intent_threshold' | 'rfq_spike' | 'cross_country_spike';
  category: string;
  country: string;
  intent_score: number;
  rfq_count: number;
  suggested_action: string;
  created_at: string;
  expires_at: string;
  is_read: boolean;
  is_actioned: boolean;
}

interface UseDemandAlertsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useDemandAlerts(options: UseDemandAlertsOptions = {}) {
  const { limit = 50, autoRefresh = true, refreshInterval = 60000 } = options;
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<DemandAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('get_demand_alerts', {
        p_user_id: user.id,
        p_limit: limit,
      });

      if (rpcError) throw rpcError;
      setAlerts((data || []) as DemandAlert[]);
      setError(null);
    } catch (err) {
      console.error('[useDemandAlerts] Error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  const triggerAlertCheck = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('check_and_create_demand_alerts');
      if (rpcError) throw rpcError;
      toast.success(`Created ${data} new alerts`);
      fetchAlerts();
      return data as number;
    } catch (err) {
      console.error('[useDemandAlerts] Trigger error:', err);
      toast.error('Failed to check for alerts');
      return 0;
    }
  }, [fetchAlerts]);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('demand_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (updateError) throw updateError;
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
    } catch (err) {
      console.error('[useDemandAlerts] Mark read error:', err);
    }
  }, []);

  const markAsActioned = useCallback(async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('demand_alerts')
        .update({ 
          is_actioned: true,
          actioned_at: new Date().toISOString(),
          actioned_by: user?.id,
        })
        .eq('id', alertId);

      if (updateError) throw updateError;
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_actioned: true } : a
      ));
      toast.success('Alert marked as actioned');
    } catch (err) {
      console.error('[useDemandAlerts] Action error:', err);
      toast.error('Failed to update alert');
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchAlerts, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAlerts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('demand-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'demand_alerts',
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const unactionedCount = alerts.filter(a => !a.is_actioned).length;

  return {
    alerts,
    loading,
    error,
    unreadCount,
    unactionedCount,
    fetchAlerts,
    triggerAlertCheck,
    markAsRead,
    markAsActioned,
  };
}

export default useDemandAlerts;
