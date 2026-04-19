/**
 * ============================================================
 * BUYER DASHBOARD ACCESS HOOK (capability-driven)
 * ============================================================
 *
 * Determines which dashboard a buyer user lands on:
 *  - Management capability → /management (Analytics)
 *  - Otherwise (purchaser/buyer)        → /dashboard (Operational)
 *
 * Authorization is sourced from `useUserScope` + `useCapabilities`,
 * which mirror the DB's `get_user_scope()` + `get_my_capabilities()`.
 * No role-string arrays are kept here.
 */

import { useUserScope } from '@/hooks/useUserScope';

export type BuyerDashboardType = 'purchaser' | 'management' | 'none';

interface BuyerDashboardAccess {
  dashboardType: BuyerDashboardType;
  primaryRole: string | null;
  isManagement: boolean;
  isPurchaser: boolean;
  canEditIncentives: boolean;
  canViewSavings: boolean;
  defaultRoute: string;
  isLoading: boolean;
}

export function useBuyerDashboardAccess(): BuyerDashboardAccess {
  const scope = useUserScope();

  const isManagement = scope.isManagement || scope.isExecutive;
  const isPurchaser = scope.isSelfOnly;

  let dashboardType: BuyerDashboardType = 'none';
  let defaultRoute = '/';
  if (isManagement) {
    dashboardType = 'management';
    defaultRoute = '/management';
  } else if (isPurchaser) {
    dashboardType = 'purchaser';
    defaultRoute = '/dashboard';
  }

  return {
    dashboardType,
    primaryRole: scope.role,
    isManagement,
    isPurchaser,
    // Executive-only edit rights for incentives (capability-gated upstream).
    canEditIncentives: scope.isExecutive,
    canViewSavings: isManagement || isPurchaser,
    defaultRoute,
    isLoading: scope.loading,
  };
}

export default useBuyerDashboardAccess;
