/**
 * ============================================================
 * BUYER COMPANY CONTEXT HOOK
 * ============================================================
 * 
 * Manages purchaser selection and management view context
 * for enterprise buyer organizations with hierarchy support.
 * 
 * Features:
 * - Fetches purchasers within same company
 * - Tracks selected purchaser for filtering
 * - Provides management view state
 * - Persists selection across page refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, UserRole } from '@/hooks/useUserRole';

export type ManagementViewType = 'cfo' | 'ceo' | 'hr' | 'manager' | null;

export interface CompanyPurchaser {
  member_id: string;
  user_id: string;
  display_name: string;
  role: string;
  assigned_categories: string[];
  is_current_user: boolean;
}

interface BuyerCompanyContext {
  // Purchaser selection
  purchasers: CompanyPurchaser[];
  selectedPurchaserId: string | null;
  selectedPurchaser: CompanyPurchaser | null;
  setSelectedPurchaserId: (id: string | null) => void;
  
  // Management view
  managementView: ManagementViewType;
  setManagementView: (view: ManagementViewType) => void;
  isManagementMode: boolean;
  
  // Role checks
  canSelectPurchaser: boolean;
  canViewManagement: boolean;
  isReadOnly: boolean;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Refresh function
  refetch: () => Promise<void>;
}

// Management roles that can see both dropdowns
const MANAGEMENT_ROLES: UserRole[] = ['buyer_cfo', 'buyer_ceo', 'buyer_manager', 'cfo', 'ceo', 'manager'];

// HR role also sees management view
const HR_ROLES: UserRole[] = ['buyer_hr'];

// Purchaser roles that can only see purchaser dropdown
const PURCHASER_ROLES: UserRole[] = ['buyer_purchaser', 'purchaser', 'buyer'];

const STORAGE_KEY_PURCHASER = 'ps_selected_purchaser';
const STORAGE_KEY_MGMT_VIEW = 'ps_management_view';

export function useBuyerCompanyContext(): BuyerCompanyContext {
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  
  const [purchasers, setPurchasers] = useState<CompanyPurchaser[]>([]);
  const [selectedPurchaserId, setSelectedPurchaserIdState] = useState<string | null>(null);
  const [managementView, setManagementViewState] = useState<ManagementViewType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role-based permissions
  const canSelectPurchaser = [...MANAGEMENT_ROLES, ...HR_ROLES, ...PURCHASER_ROLES].includes(role);
  const canViewManagement = [...MANAGEMENT_ROLES, ...HR_ROLES].includes(role);
  const isManagementMode = managementView !== null;
  const isReadOnly = canViewManagement && isManagementMode;

  // Get selected purchaser object
  const selectedPurchaser = purchasers.find(p => p.user_id === selectedPurchaserId) || null;

  // Persist purchaser selection
  const setSelectedPurchaserId = useCallback((id: string | null) => {
    setSelectedPurchaserIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY_PURCHASER, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_PURCHASER);
    }
  }, []);

  // Persist management view selection
  const setManagementView = useCallback((view: ManagementViewType) => {
    setManagementViewState(view);
    if (view) {
      localStorage.setItem(STORAGE_KEY_MGMT_VIEW, view);
    } else {
      localStorage.removeItem(STORAGE_KEY_MGMT_VIEW);
    }
  }, []);

  // Fetch company purchasers
  const fetchPurchasers = useCallback(async () => {
    if (!user?.id) {
      setPurchasers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Call the RPC function to get purchasers in same company
      const { data, error: rpcError } = await supabase.rpc(
        'get_company_purchasers' as any,
        { _user_id: user.id }
      );

      if (rpcError) {
        // If no company setup yet, fall back to showing just current user
        console.warn('[useBuyerCompanyContext] RPC error, using fallback:', rpcError);
        
        // Fetch current user's profile as fallback
        const { data: profile } = await supabase
          .from('profiles')
          .select('contact_person, company_name')
          .eq('id', user.id)
          .single();
        
        const fallbackPurchaser: CompanyPurchaser = {
          member_id: user.id,
          user_id: user.id,
          display_name: profile?.contact_person || profile?.company_name || 'You',
          role: role || 'buyer',
          assigned_categories: [],
          is_current_user: true
        };
        
        setPurchasers([fallbackPurchaser]);
        setSelectedPurchaserIdState(user.id);
        return;
      }

      const purchaserList = (data || []) as CompanyPurchaser[];
      setPurchasers(purchaserList);

      // Restore saved selection or default to current user
      const savedPurchaserId = localStorage.getItem(STORAGE_KEY_PURCHASER);
      const validSavedSelection = purchaserList.find(p => p.user_id === savedPurchaserId);
      
      if (validSavedSelection) {
        setSelectedPurchaserIdState(savedPurchaserId);
      } else {
        // Default to current user if they're a purchaser, otherwise first purchaser
        const currentUser = purchaserList.find(p => p.is_current_user);
        const defaultPurchaser = currentUser || purchaserList[0];
        if (defaultPurchaser) {
          setSelectedPurchaserIdState(defaultPurchaser.user_id);
        }
      }

    } catch (err) {
      console.error('[useBuyerCompanyContext] Error:', err);
      setError('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, role]);

  // Initial fetch
  useEffect(() => {
    fetchPurchasers();
    
    // Restore management view from storage
    const savedView = localStorage.getItem(STORAGE_KEY_MGMT_VIEW) as ManagementViewType;
    if (savedView && canViewManagement) {
      setManagementViewState(savedView);
    }
  }, [fetchPurchasers, canViewManagement]);

  return {
    purchasers,
    selectedPurchaserId,
    selectedPurchaser,
    setSelectedPurchaserId,
    managementView,
    setManagementView,
    isManagementMode,
    canSelectPurchaser,
    canViewManagement,
    isReadOnly,
    isLoading,
    error,
    refetch: fetchPurchasers
  };
}

export default useBuyerCompanyContext;
