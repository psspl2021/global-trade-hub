/**
 * ============================================================
 * BUYER DASHBOARD HEADER WITH CONTEXT SELECTORS
 * ============================================================
 * 
 * Unified header component for buyer dashboard that includes:
 * - Purchaser selection dropdown (visible to all buyer roles)
 * - Management view dropdown (LOCKED by default, requires verification)
 * - User info and sign out
 * 
 * Role behavior:
 * - buyer_purchaser: Only sees Purchaser dropdown, can only view own data
 * - buyer_cfo/ceo/hr/manager: Sees BOTH dropdowns, management view is LOCKED
 * 
 * Security:
 * - Management views require PIN or password verification
 * - Verification expires after 15 minutes or on logout
 * - All verification state is in-memory only (no localStorage)
 */

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { LogOut, Settings, ShieldCheck, AlertTriangle, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';
import { useRoleSecurity } from '@/hooks/useRoleSecurity';
import { PurchaserSelector } from './PurchaserSelector';
import { ManagementViewSelector } from './ManagementViewSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

interface BuyerDashboardHeaderProps {
  onOpenSettings: () => void;
}

export function BuyerDashboardHeader({ onOpenSettings }: BuyerDashboardHeaderProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    purchasers,
    selectedPurchaserId,
    setSelectedPurchaserId,
    managementView,
    setManagementView,
    canViewManagement,
    isManagementMode,
    isLoading,
    error,
  } = useBuyerCompanyContext();
  
  const { isRoleVerified } = useRoleSecurity();
  const isCurrentViewVerified = managementView ? isRoleVerified(managementView) : false;

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        {/* Top row: Logo and actions */}
        <div className="flex items-center justify-between mb-3">
          <a href="https://www.procuresaathi.com" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-14 sm:h-20 w-auto object-contain cursor-pointer"
              width={80}
              height={80}
              loading="eager"
            />
          </a>
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex" 
              onClick={() => window.location.href = 'https://www.procuresaathi.com'}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 sm:hidden" 
              onClick={() => window.location.href = 'https://www.procuresaathi.com'}
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 sm:h-10 sm:w-10" 
              onClick={onOpenSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex" 
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 sm:hidden" 
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Company Setup Warning */}
        {error && (
          <Alert variant="default" className="mb-3 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              {error} — Your company context is being set up. Some features may be limited.
            </AlertDescription>
          </Alert>
        )}

        {/* Context Selectors Row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 pt-2 border-t border-border/50">
          {/* Purchaser Selector - Always visible for buyer roles when there are purchasers */}
          {!isLoading && purchasers.length > 0 && (
            <PurchaserSelector
              purchasers={purchasers}
              selectedPurchaserId={selectedPurchaserId}
              onSelect={setSelectedPurchaserId}
              disabled={false}
            />
          )}

          {/* Loading state for purchasers */}
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
              <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />
              <div className="h-4 w-24 rounded bg-muted-foreground/20" />
            </div>
          )}

          {/* Management View Selector - Visible to ALL buyer roles, but LOCKED for non-management */}
          <ManagementViewSelector
            selectedView={managementView}
            onSelect={setManagementView}
            isLocked={!canViewManagement}
          />

          {/* Secure Management Mode Indicator */}
          {isManagementMode && isCurrentViewVerified && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Secure Management Mode Enabled – Read-Only Analytics
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default BuyerDashboardHeader;
