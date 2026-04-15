/**
 * ============================================================
 * BUYER COMPANY CONTEXT (Shared React Context)
 * ============================================================
 * 
 * Wraps useBuyerCompanyContext hook logic into a proper React Context
 * so that header selectors and dashboard content share the SAME state.
 */

import { createContext, useContext, ReactNode } from 'react';
import { useBuyerCompanyContext as useBuyerCompanyContextHook } from '@/hooks/useBuyerCompanyContext';
import type { ManagementViewType, CompanyPurchaser } from '@/hooks/useBuyerCompanyContext';

interface BuyerCompanyContextValue {
  purchasers: CompanyPurchaser[];
  selectedPurchaserId: string | null;
  selectedPurchaser: CompanyPurchaser | null;
  setSelectedPurchaserId: (id: string | null) => void;
  managementView: ManagementViewType;
  setManagementView: (view: ManagementViewType) => void;
  isManagementMode: boolean;
  canSelectPurchaser: boolean;
  canViewManagement: boolean;
  isReadOnly: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const BuyerCompanyCtx = createContext<BuyerCompanyContextValue | null>(null);

export function BuyerCompanyProvider({ children }: { children: ReactNode }) {
  const value = useBuyerCompanyContextHook();
  return (
    <BuyerCompanyCtx.Provider value={value}>
      {children}
    </BuyerCompanyCtx.Provider>
  );
}

export function useSharedBuyerCompanyContext(): BuyerCompanyContextValue {
  const ctx = useContext(BuyerCompanyCtx);
  if (!ctx) {
    throw new Error('useSharedBuyerCompanyContext must be used within BuyerCompanyProvider');
  }
  return ctx;
}
