/**
 * ============================================================
 * MANAGEMENT VIEW SELECTOR DROPDOWN (SECURED)
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, Users, Briefcase, BarChart3, X, Lock, ShieldCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ManagementViewType } from '@/hooks/useBuyerCompanyContext';
import { useRoleSecurity } from '@/hooks/useRoleSecurity';
import { RoleVerificationModal } from './RoleVerificationModal';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';
import { supabase } from '@/integrations/supabase/client';

interface ManagementViewSelectorProps {
  selectedView: ManagementViewType;
  onSelect: (view: ManagementViewType) => void;
  className?: string;
  isLocked?: boolean;
}

const MANAGEMENT_VIEWS = [
  { value: 'cfo' as ManagementViewType, label: 'CFO View', description: 'Financial analytics, ROI & savings', icon: TrendingUp, dbRole: 'buyer_cfo' },
  { value: 'ceo' as ManagementViewType, label: 'CEO View', description: 'Executive summary & KPIs', icon: Briefcase, dbRole: 'buyer_ceo' },
  { value: 'hr' as ManagementViewType, label: 'HR / Management View', description: 'Team performance & incentives', icon: Users, dbRole: 'buyer_hr' },
  { value: 'manager' as ManagementViewType, label: 'Manager View', description: 'Operational oversight', icon: BarChart3, dbRole: 'buyer_manager' },
];

export function ManagementViewSelector({
  selectedView,
  onSelect,
  className = '',
  isLocked = false,
}: ManagementViewSelectorProps) {
  const { user } = useAuth();
  const { companyId: activeCompanyId } = useGlobalBuyerContext();
  const { isRoleVerified, requiresVerification, clearVerification, hasPinConfigured } = useRoleSecurity();
  const [pendingView, setPendingView] = useState<ManagementViewType>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pinStates, setPinStates] = useState<Record<string, boolean | null>>({});

  // Check PIN states for all management views on mount
  useEffect(() => {
    const checkPins = async () => {
      const states: Record<string, boolean | null> = {};
      for (const view of MANAGEMENT_VIEWS) {
        if (view.value) {
          states[view.value] = await hasPinConfigured(view.value);
        }
      }
      setPinStates(states);
    };
    checkPins();
  }, [hasPinConfigured]);

  const selectedOption = MANAGEMENT_VIEWS.find(v => v.value === selectedView);
  const isCurrentViewVerified = selectedView ? isRoleVerified(selectedView) : false;

  // Simplified status logic: Any buyer can access any management view
  // Status is based only on PIN verification state:
  // 1. PIN verified this session → unlocked
  // 2. PIN exists but not verified → locked (needs PIN)
  // 3. No PIN configured yet → setup_required (first-time setup)
  const getViewStatus = useCallback((viewValue: ManagementViewType): 'unlocked' | 'setup_required' | 'locked' => {
    if (!viewValue) return 'locked';
    
    // If already verified this session → unlocked
    if (isRoleVerified(viewValue)) return 'unlocked';
    
    // Check PIN state
    const hasPinState = pinStates[viewValue];
    if (hasPinState === false) return 'setup_required';
    
    // PIN exists but not verified → locked (session-level)
    return 'locked';
  }, [isRoleVerified, pinStates]);

  const handleViewChange = (value: string) => {
    if (value === 'none') {
      if (selectedView) clearVerification(selectedView);
      onSelect(null);
      return;
    }
    const targetView = value as ManagementViewType;
    if (isRoleVerified(targetView)) {
      onSelect(targetView);
      return;
    }
    if (requiresVerification(targetView)) {
      setPendingView(targetView);
      setShowVerificationModal(true);
      return;
    }
    onSelect(targetView);
  };

  const handleVerified = () => {
    if (pendingView) {
      // PIN verification already sets role as verified in useRoleSecurity state
      // Update local PIN state so dropdown instantly shows "Unlocked"
      setPinStates(prev => ({ ...prev, [pendingView]: true }));
      onSelect(pendingView);
      setPendingView(null);
    }
  };

  const handleModalClose = () => {
    setShowVerificationModal(false);
    setPendingView(null);
  };

  const handleExit = () => {
    if (selectedView) clearVerification(selectedView);
    onSelect(null);
  };

  const renderStatusBadge = (status: 'unlocked' | 'setup_required' | 'locked') => {
    switch (status) {
      case 'unlocked':
        return (
          <Badge variant="outline" className="text-[10px] py-0 px-1 text-green-600 border-green-200">
            Unlocked
          </Badge>
        );
      case 'setup_required':
        return (
          <Badge variant="outline" className="text-[10px] py-0 px-1 text-blue-600 border-blue-200">
            <Settings className="h-2 w-2 mr-0.5" />
            Setup Required
          </Badge>
        );
      case 'locked':
        return (
          <Badge variant="outline" className="text-[10px] py-0 px-1 text-amber-600 border-amber-200">
            <Lock className="h-2 w-2 mr-0.5" />
            Locked
          </Badge>
        );
    }
  };

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${className}`}>
        <label className="shrink-0 whitespace-nowrap text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Management View
        </label>
        <div className="flex items-center gap-2 min-w-0">
          <Select value={selectedView || 'none'} onValueChange={handleViewChange}>
            <SelectTrigger className="w-[280px] bg-background border-border">
              <div className="flex items-center gap-2 min-w-0">
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
                    <span className="text-muted-foreground">
                      Switch to Analytics
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
                    <span className="text-xs text-muted-foreground">Normal dashboard with actions</span>
                  </div>
                </div>
              </SelectItem>
              {MANAGEMENT_VIEWS.map((view) => {
                const Icon = view.icon;
                const viewValue = view.value as string;
                const status = getViewStatus(view.value);
                return (
                  <SelectItem key={viewValue} value={viewValue} className="cursor-pointer">
                    <div className="flex items-center gap-2 py-1">
                      <div className="relative flex-shrink-0">
                        <Icon className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium flex items-center gap-2">
                          {view.label}
                          {renderStatusBadge(status)}
                        </span>
                        <span className="text-xs text-muted-foreground">{view.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

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
