/**
 * ============================================================
 * BUYER DASHBOARD HEADER WITH CONTEXT SELECTORS
 * ============================================================
 * 
 * Unified header component for buyer dashboard that includes:
 * - Purchaser selection dropdown (visible to all buyer roles)
 * - Management view dropdown (visible to CFO/CEO/HR/Manager only)
 * - User info and sign out
 * 
 * Role behavior:
 * - buyer_purchaser: Only sees Purchaser dropdown, can only view own data
 * - buyer_cfo/ceo/hr/manager: Sees BOTH dropdowns, can switch context
 */

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { LogOut, Settings, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';
import { PurchaserSelector } from './PurchaserSelector';
import { ManagementViewSelector } from './ManagementViewSelector';
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
  } = useBuyerCompanyContext();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        {/* Top row: Logo and actions */}
        <div className="flex items-center justify-between mb-3">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-14 sm:h-20 w-auto object-contain cursor-pointer"
              width={80}
              height={80}
              loading="eager"
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell />
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

        {/* Context Selectors Row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 pt-2 border-t border-border/50">
          {/* Purchaser Selector - Always visible for buyer roles */}
          {!isLoading && purchasers.length > 0 && (
            <PurchaserSelector
              purchasers={purchasers}
              selectedPurchaserId={selectedPurchaserId}
              onSelect={setSelectedPurchaserId}
              disabled={false}
            />
          )}

          {/* Management View Selector - Only for management roles */}
          {canViewManagement && (
            <ManagementViewSelector
              selectedView={managementView}
              onSelect={setManagementView}
            />
          )}

          {/* Management Mode Indicator */}
          {isManagementMode && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Eye className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Read-Only Analytics Mode
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default BuyerDashboardHeader;
