/**
 * ============================================================
 * REWARDS GOVERNANCE HOOK
 * ============================================================
 * 
 * Centralized governance logic for purchaser rewards system.
 * Controls:
 * - Kill switch (rewards_enabled)
 * - Access control
 * - Audit logging
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RewardsSettings {
  id: string;
  rewards_enabled: boolean;
  paused_reason: string | null;
  paused_at: string | null;
  compliance_tier: 'standard' | 'enterprise' | 'psu' | 'global';
}

interface UseRewardsGovernanceReturn {
  rewardsEnabled: boolean;
  pausedReason: string | null;
  isLoading: boolean;
  hasAccess: boolean;
  logAccess: (action: string, resourceType: string, resourceId?: string) => Promise<void>;
  toggleRewards: (enabled: boolean, reason?: string) => Promise<boolean>;
}

export function useRewardsGovernance(): UseRewardsGovernanceReturn {
  const { user } = useAuth();
  const [settings, setSettings] = useState<RewardsSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Fetch settings and access on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch rewards settings using raw query to avoid type issues
        const { data: settingsData } = await supabase
          .from('purchaser_rewards_settings' as any)
          .select('*')
          .limit(1)
          .single();

        if (settingsData) {
          setSettings(settingsData as unknown as RewardsSettings);
        }

        // Check access if user exists
        if (user?.id) {
          const { data: accessData } = await supabase.rpc(
            'can_access_purchaser_rewards' as any,
            { p_user_id: user.id }
          );
          setHasAccess(accessData === true);
        }
      } catch (err) {
        console.error('[useRewardsGovernance] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user?.id]);

  // Log access for audit trail
  const logAccess = useCallback(async (
    action: string,
    resourceType: string,
    resourceId?: string
  ) => {
    if (!user?.id) return;

    try {
      await supabase.from('purchaser_rewards_access_log' as any).insert({
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId || null,
      });
    } catch (err) {
      console.error('[useRewardsGovernance] Log error:', err);
    }
  }, [user?.id]);

  // Toggle rewards (admin only)
  const toggleRewards = useCallback(async (
    enabled: boolean,
    reason?: string
  ): Promise<boolean> => {
    if (!user?.id || !settings?.id) return false;

    try {
      const { error } = await supabase
        .from('purchaser_rewards_settings' as any)
        .update({
          rewards_enabled: enabled,
          paused_reason: enabled ? null : (reason || 'Paused by admin'),
          paused_by: enabled ? null : user.id,
          paused_at: enabled ? null : new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? {
        ...prev,
        rewards_enabled: enabled,
        paused_reason: enabled ? null : (reason || 'Paused by admin'),
        paused_at: enabled ? null : new Date().toISOString(),
      } : null);

      return true;
    } catch (err) {
      console.error('[useRewardsGovernance] Toggle error:', err);
      return false;
    }
  }, [user?.id, settings?.id]);

  return {
    rewardsEnabled: settings?.rewards_enabled ?? true,
    pausedReason: settings?.paused_reason ?? null,
    isLoading,
    hasAccess,
    logAccess,
    toggleRewards,
  };
}

export default useRewardsGovernance;
