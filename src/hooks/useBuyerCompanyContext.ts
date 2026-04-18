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
const HR_ROLES: UserRole[] = ['buyer_hr', 'hr'];

// Purchaser/Buyer roles that can see purchaser dropdown
const PURCHASER_ROLES: UserRole[] = ['buyer_purchaser', 'purchaser', 'buyer'];

const STORAGE_KEY_PURCHASER_BASE = 'ps_selected_purchaser';
const STORAGE_KEY_MGMT_VIEW = 'ps_management_view';
// Per-user namespacing prevents cross-account leakage on shared browsers:
// without this, User A's saved "view as" ID is briefly applied to User B
// on first render after login, producing the illusion of seeing A's data.
const purchaserStorageKey = (userId: string) => `${STORAGE_KEY_PURCHASER_BASE}:${userId}`;

export function useBuyerCompanyContext(): BuyerCompanyContext {
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  
  const [purchasers, setPurchasers] = useState<CompanyPurchaser[]>([]);
  const [selectedPurchaserId, setSelectedPurchaserIdState] = useState<string | null>(null);
  const [managementView, setManagementViewState] = useState<ManagementViewType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // All buyer roles can access management views (secured by PIN verification)
  const canSelectPurchaser = [...MANAGEMENT_ROLES, ...HR_ROLES, ...PURCHASER_ROLES].includes(role);
  const canViewManagement = canSelectPurchaser; // Any buyer role can access management views
  const isManagementMode = managementView !== null;
  const isReadOnly = canViewManagement && isManagementMode;

  // Get selected purchaser object
  const selectedPurchaser = purchasers.find(p => p.user_id === selectedPurchaserId) || null;

  // Persist purchaser selection (per-user namespaced).
  // On an actual user-initiated change, trigger a full page refresh so every
  // scoped query (RFQs, auctions, POs, dashboards) re-fetches against the
  // newly selected purchaser context — no stale UI from cached state.
  const setSelectedPurchaserId = useCallback((id: string | null) => {
    if (!user?.id) {
      setSelectedPurchaserIdState(id);
      return;
    }
    const key = purchaserStorageKey(user.id);
    const prev = localStorage.getItem(key);
    setSelectedPurchaserIdState(id);
    if (id) {
      localStorage.setItem(key, id);
    } else {
      localStorage.removeItem(key);
    }
    // Only reload if this is a real change (avoids reload loop on initial hydration)
    if (id && prev && id !== prev && typeof window !== 'undefined') {
      window.location.reload();
    }
  }, [user?.id]);

  // Persist management view selection + dispatch custom event for cross-component sync
  const setManagementView = useCallback((view: ManagementViewType) => {
    setManagementViewState(view);
    if (view) {
      localStorage.setItem(STORAGE_KEY_MGMT_VIEW, view);
    } else {
      localStorage.removeItem(STORAGE_KEY_MGMT_VIEW);
    }
    // Dispatch custom event so Dashboard.tsx can react
    window.dispatchEvent(new CustomEvent('ps-management-view-change', { detail: { view } }));
  }, []);

  // Ensure buyer company exists (auto-provision if needed)
  const ensureBuyerCompany = useCallback(async () => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await supabase.rpc(
        'ensure_buyer_company' as any,
        { _user_id: user.id }
      );
      
      if (error) {
        console.warn('[useBuyerCompanyContext] ensure_buyer_company error:', error);
        return false;
      }
      
      console.log('[useBuyerCompanyContext] Company ensured:', data);
      return data?.success || false;
    } catch (err) {
      console.warn('[useBuyerCompanyContext] ensure_buyer_company failed:', err);
      return false;
    }
  }, [user?.id]);

  // Fetch company purchasers
  const fetchPurchasers = useCallback(async () => {
    if (!user?.id) {
      setPurchasers([]);
      setIsLoading(false);
      return;
    }

    // Check if user is a buyer role (includes 'buyer' base role)
    const roleStr = role?.toString() || '';
    const isBuyerRole = roleStr && (
      roleStr === 'buyer' ||
      roleStr.startsWith('buyer') || 
      ['purchaser', 'cfo', 'ceo', 'manager', 'hr'].includes(roleStr)
    );

    if (!isBuyerRole) {
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
        setError('Company setup pending');
        
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

      let purchaserList = (data || []) as CompanyPurchaser[];

      // SECURITY/UX: purchaser & buyer_purchaser roles are hard-scoped to self
      // by the DB (RPC ignores p_selected_purchaser). Filtering the list here
      // keeps the UI consistent with that contract — no misleading "view as"
      // option that would silently fall back to the caller's own data.
      const isSelfOnlyRole = role === 'purchaser' || role === 'buyer_purchaser';
      if (isSelfOnlyRole) {
        purchaserList = purchaserList.filter(p => p.is_current_user || p.user_id === user.id);
      }

      // If no purchasers found, create fallback with current user
      if (purchaserList.length === 0) {
        // No membership found — try auto-provision as last resort
        await ensureBuyerCompany();
        
        // Retry fetch after provisioning
        const { data: retryData } = await supabase.rpc(
          'get_company_purchasers' as any,
          { _user_id: user.id }
        );
        
        let retryList = (retryData || []) as CompanyPurchaser[];
        if (isSelfOnlyRole) {
          retryList = retryList.filter(p => p.is_current_user || p.user_id === user.id);
        }
        if (retryList.length > 0) {
          setPurchasers(retryList);
          const currentUser = retryList.find(p => p.is_current_user);
          setSelectedPurchaserIdState((currentUser || retryList[0]).user_id);
          return;
        }

        // Still nothing — fallback to profile
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

      setPurchasers(purchaserList);

      // For self-only roles, always force selection to self regardless of saved value
      if (isSelfOnlyRole) {
        setSelectedPurchaserIdState(user.id);
        localStorage.setItem(purchaserStorageKey(user.id), user.id);
      } else {
        // Restore saved selection (per-user) or default to current user
        const savedPurchaserId = localStorage.getItem(purchaserStorageKey(user.id));
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
      }

    } catch (err) {
      console.error('[useBuyerCompanyContext] Error:', err);
      setError('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, role, ensureBuyerCompany]);

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
