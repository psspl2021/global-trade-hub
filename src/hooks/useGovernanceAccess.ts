/**
 * ============================================================
 * GOVERNANCE ACCESS HOOK
 * ============================================================
 * 
 * Central access control for the governance system.
 * Uses the check_governance_access RPC to determine permissions.
 * 
 * Roles:
 * - purchaser: Read-only access to savings & incentives
 * - manager: Management dashboard access
 * - cfo/ceo: Full incentive management
 * - ps_admin: Read-only audit view
 * - supplier/external_guest: Access denied (404)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type GovernanceRole = 
  | 'purchaser' 
  | 'buyer_purchaser'
  | 'manager' 
  | 'buyer_manager'
  | 'cfo' 
  | 'buyer_cfo'
  | 'ceo' 
  | 'buyer_ceo'
  | 'ps_admin' 
  | 'admin'
  | 'buyer'
  | 'supplier' 
  | 'logistics_partner'
  | 'affiliate'
  | 'external_guest' 
  | 'unknown';

interface GovernanceAccess {
  canViewPurchaserDashboard: boolean;
  canViewManagementDashboard: boolean;
  canViewControlTower: boolean;
  canEditIncentives: boolean;
  canToggleRewards: boolean;
  isReadOnly: boolean;
  primaryRole: GovernanceRole;
}

interface UseGovernanceAccessReturn extends GovernanceAccess {
  isLoading: boolean;
  isAccessDenied: boolean;
  defaultLandingRoute: string;
  refetch: () => Promise<void>;
}

const DEFAULT_ACCESS: GovernanceAccess = {
  canViewPurchaserDashboard: false,
  canViewManagementDashboard: false,
  canViewControlTower: false,
  canEditIncentives: false,
  canToggleRewards: false,
  isReadOnly: true,
  primaryRole: 'unknown',
};

export function useGovernanceAccess(): UseGovernanceAccessReturn {
  const { user } = useAuth();
  const [access, setAccess] = useState<GovernanceAccess>(DEFAULT_ACCESS);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultLandingRoute, setDefaultLandingRoute] = useState('/');

  const fetchAccess = useCallback(async () => {
    if (!user?.id) {
      setAccess(DEFAULT_ACCESS);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch governance access using the RPC
      const { data, error } = await supabase.rpc(
        'check_governance_access' as any,
        { p_user_id: user.id }
      );

      if (error) throw error;

      if (data && data.length > 0) {
        const row = data[0];
        const role = (row.primary_role as GovernanceRole) || 'unknown';
        
        // Control Tower access: cfo, ceo, manager (including buyer variants), ps_admin, admin
        const canAccessControlTower = ['cfo', 'buyer_cfo', 'ceo', 'buyer_ceo', 'manager', 'buyer_manager', 'ps_admin', 'admin'].includes(role);
        
        setAccess({
          canViewPurchaserDashboard: row.can_view_purchaser_dashboard ?? false,
          canViewManagementDashboard: row.can_view_management_dashboard ?? false,
          canViewControlTower: canAccessControlTower,
          canEditIncentives: row.can_edit_incentives ?? false,
          canToggleRewards: row.can_toggle_rewards ?? false,
          isReadOnly: row.is_read_only ?? true,
          primaryRole: role,
        });

        // Set default landing route based on role
        // Management roles (CFO/CEO/Manager including buyer variants) → /management
        if (['cfo', 'buyer_cfo', 'ceo', 'buyer_ceo', 'manager', 'buyer_manager'].includes(row.primary_role)) {
          setDefaultLandingRoute('/management');
        // Purchaser/Buyer roles → /dashboard
        } else if (['purchaser', 'buyer_purchaser', 'buyer'].includes(row.primary_role)) {
          setDefaultLandingRoute('/dashboard');
        // Admin roles → /admin
        } else if (row.primary_role === 'ps_admin' || row.primary_role === 'admin') {
          setDefaultLandingRoute('/admin');
        } else {
          setDefaultLandingRoute('/');
        }
      }
    } catch (err) {
      console.error('[useGovernanceAccess] Error:', err);
      setAccess(DEFAULT_ACCESS);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const isAccessDenied = 
    access.primaryRole === 'supplier' || 
    access.primaryRole === 'external_guest';

  return {
    ...access,
    isLoading,
    isAccessDenied,
    defaultLandingRoute,
    refetch: fetchAccess,
  };
}

export default useGovernanceAccess;
