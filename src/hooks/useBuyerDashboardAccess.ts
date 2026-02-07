/**
 * ============================================================
 * BUYER DASHBOARD ACCESS HOOK
 * ============================================================
 * 
 * Determines which dashboard a buyer user should access:
 * - buyer_purchaser, purchaser, buyer → /dashboard (Operational)
 * - buyer_cfo, buyer_ceo, buyer_manager, cfo, ceo, manager → /management (Analytics)
 * 
 * This hook is the source of truth for buyer-side role routing.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type BuyerDashboardType = 'purchaser' | 'management' | 'none';
export type BuyerRole = 
  | 'buyer_purchaser' 
  | 'buyer_cfo' 
  | 'buyer_ceo'
  | 'buyer_hr' 
  | 'buyer_manager'
  | 'purchaser'
  | 'buyer'
  | 'cfo'
  | 'ceo'
  | 'manager'
  | null;

// Management roles get analytics dashboard
const MANAGEMENT_ROLES = ['buyer_cfo', 'buyer_ceo', 'buyer_hr', 'buyer_manager', 'cfo', 'ceo', 'manager'];

// Purchaser roles get execution dashboard
const PURCHASER_ROLES = ['buyer_purchaser', 'purchaser', 'buyer'];

interface BuyerDashboardAccess {
  dashboardType: BuyerDashboardType;
  primaryRole: BuyerRole;
  isManagement: boolean;
  isPurchaser: boolean;
  canEditIncentives: boolean;
  canViewSavings: boolean;
  defaultRoute: string;
  isLoading: boolean;
}

export function useBuyerDashboardAccess(): BuyerDashboardAccess {
  const { user } = useAuth();
  const [dashboardType, setDashboardType] = useState<BuyerDashboardType>('none');
  const [primaryRole, setPrimaryRole] = useState<BuyerRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccess = useCallback(async () => {
    if (!user?.id) {
      setDashboardType('none');
      setPrimaryRole(null);
      setIsLoading(false);
      return;
    }

    try {
      // Try RPC first for buyer dashboard type
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_buyer_dashboard_type' as any,
        { _user_id: user.id }
      );

      if (!rpcError && rpcData) {
        setDashboardType(rpcData as BuyerDashboardType);
      }

      // Get the primary role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!roleError && roleData && roleData.length > 0) {
        // Sort by priority and get highest
        const sortedRoles = roleData.map(r => r.role as string).sort((a, b) => {
          const priority: Record<string, number> = {
            'buyer_ceo': 1, 'ceo': 1,
            'buyer_cfo': 2, 'cfo': 2,
            'buyer_manager': 3, 'manager': 3,
            'buyer_purchaser': 4, 'purchaser': 4,
            'buyer': 5,
          };
          return (priority[a] || 99) - (priority[b] || 99);
        });

        const topRole = sortedRoles[0] as BuyerRole;
        setPrimaryRole(topRole);

        // Set dashboard type based on role
        if (MANAGEMENT_ROLES.includes(topRole || '')) {
          setDashboardType('management');
        } else if (PURCHASER_ROLES.includes(topRole || '')) {
          setDashboardType('purchaser');
        }
      }
    } catch (err) {
      console.error('[useBuyerDashboardAccess] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const isManagement = MANAGEMENT_ROLES.includes(primaryRole || '');
  const isPurchaser = PURCHASER_ROLES.includes(primaryRole || '');
  const canEditIncentives = ['buyer_cfo', 'buyer_ceo', 'cfo', 'ceo'].includes(primaryRole || '');
  const canViewSavings = isManagement || isPurchaser;

  // Default route based on dashboard type
  let defaultRoute = '/';
  if (dashboardType === 'management') {
    defaultRoute = '/management';
  } else if (dashboardType === 'purchaser') {
    defaultRoute = '/dashboard';
  }

  return {
    dashboardType,
    primaryRole,
    isManagement,
    isPurchaser,
    canEditIncentives,
    canViewSavings,
    defaultRoute,
    isLoading,
  };
}

export default useBuyerDashboardAccess;
