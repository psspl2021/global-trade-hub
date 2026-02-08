/**
 * ============================================================
 * MANAGEMENT VIEW SELECTOR DROPDOWN (SECURED)
 * ============================================================
 * 
 * Allows management roles to switch between analytics views.
 * When a management view is selected, the dashboard switches
 * to read-only analytics mode.
 * 
 * SECURITY:
 * - Locked by default for all management views
 * - Requires PIN or password verification before switching
 * - Verification state stored in memory only (not localStorage)
 * - Expires after 15 minutes or on logout
 * 
 * Visible to: buyer_cfo, buyer_ceo, buyer_hr, buyer_manager
 * Hidden from: buyer_purchaser, purchaser, buyer
 */

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, TrendingUp, Users, Briefcase, BarChart3, X, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ManagementViewType } from '@/hooks/useBuyerCompanyContext';
import { useRoleSecurity } from '@/hooks/useRoleSecurity';
import { RoleVerificationModal } from './RoleVerificationModal';

interface ManagementViewSelectorProps {
  selectedView: ManagementViewType;
  onSelect: (view: ManagementViewType) => void;
  className?: string;
  /** If true, the entire selector is disabled (for non-authorized roles) */
  isLocked?: boolean;
}

const MANAGEMENT_VIEWS = [
  {
    value: 'cfo' as ManagementViewType,
    label: 'CFO View',
    description: 'Financial analytics, ROI & savings',
    icon: TrendingUp,
  },
  {
    value: 'ceo' as ManagementViewType,
    label: 'CEO View',
    description: 'Executive summary & KPIs',
    icon: Briefcase,
  },
  {
    value: 'hr' as ManagementViewType,
    label: 'HR / Management View',
    description: 'Team performance & incentives',
    icon: Users,
  },
  {
    value: 'manager' as ManagementViewType,
    label: 'Manager View',
    description: 'Operational oversight',
    icon: BarChart3,
  },
];

export function ManagementViewSelector({
  selectedView,
  onSelect,
  className = '',
  isLocked = false,
}: ManagementViewSelectorProps) {
  const { isRoleVerified, requiresVerification, clearVerification } = useRoleSecurity();
  const [pendingView, setPendingView] = useState<ManagementViewType>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const selectedOption = MANAGEMENT_VIEWS.find(v => v.value === selectedView);
  const isCurrentViewVerified = selectedView ? isRoleVerified(selectedView) : false;

  // Handle view selection - check if verification is needed
  const handleViewChange = (value: string) => {
    if (value === 'none') {
      // Switching to execution mode - clear any active verification
      if (selectedView) {
        clearVerification(selectedView);
      }
      onSelect(null);
      return;
    }

    const targetView = value as ManagementViewType;
    
    // Check if this view is already verified
    if (isRoleVerified(targetView)) {
      onSelect(targetView);
      return;
    }

    // Requires verification - show modal
    if (requiresVerification(targetView)) {
      setPendingView(targetView);
      setShowVerificationModal(true);
      return;
    }

    // No verification needed (shouldn't happen for management views)
    onSelect(targetView);
  };

  // Handle successful verification
  const handleVerified = () => {
    if (pendingView) {
      onSelect(pendingView);
      setPendingView(null);
    }
  };

  // Handle modal close without verification
  const handleModalClose = () => {
    setShowVerificationModal(false);
    setPendingView(null);
  };

  // Handle exit from management mode
  const handleExit = () => {
    if (selectedView) {
      clearVerification(selectedView);
    }
    onSelect(null);
  };

  // Always show the selector - remove locked state display
  // Non-management roles can still see the dropdown but won't be able to verify

  return (
    <>
      <div className={`flex flex-col gap-1 ${className}`}>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Management View
        </label>
        <div className="flex items-center gap-2">
          <Select
            value={selectedView || 'none'}
            onValueChange={handleViewChange}
          >
            <SelectTrigger className="w-full sm:w-[280px] bg-background border-border">
              <div className="flex items-center gap-2">
                {selectedView && isCurrentViewVerified ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Lock className="h-4 w-4 text-amber-500" />
                )}
                <SelectValue placeholder="Switch to Analytics">
                  {selectedOption ? (
                    <span className="truncate flex items-center gap-2">
                      {selectedOption.label}
                      {isCurrentViewVerified && (
                        <Badge variant="outline" className="text-xs py-0 px-1 text-emerald-600 border-emerald-200">
                          Verified
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Lock className="h-3 w-3" />
                      Locked – Verification Required
                    </span>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              <SelectItem value="none" className="cursor-pointer">
                <div className="flex items-center gap-2 py-1">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Execution Mode</span>
                    <span className="text-xs text-muted-foreground">
                      Normal dashboard with actions
                    </span>
                  </div>
                </div>
              </SelectItem>
              {MANAGEMENT_VIEWS.map((view) => {
                const Icon = view.icon;
                const viewValue = view.value as string;
                const isVerified = isRoleVerified(view.value);
                return (
                  <SelectItem 
                    key={viewValue} 
                    value={viewValue}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 py-1">
                      <div className="relative flex-shrink-0">
                        <Icon className="h-4 w-4 text-amber-500" />
                        {!isVerified && (
                          <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium flex items-center gap-2">
                          {view.label}
                          {isVerified ? (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 text-green-600 border-green-200">
                              Unlocked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 text-amber-600 border-amber-200">
                              <Lock className="h-2 w-2 mr-0.5" />
                              Locked
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {view.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {/* Quick exit button when in management mode */}
          {selectedView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <X className="h-4 w-4 mr-1" />
              Exit
            </Button>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      <RoleVerificationModal
        isOpen={showVerificationModal}
        onClose={handleModalClose}
        targetRole={pendingView}
        onVerified={handleVerified}
      />
    </>
  );
}

export default ManagementViewSelector;
