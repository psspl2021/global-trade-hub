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
import { useCapabilities } from '@/hooks/useCapabilities';
import { useUserScope } from '@/hooks/useUserScope';

export type ManagementViewType = 'cfo' | 'ceo' | 'hr' | 'manager' | 'purchase_head' | 'vp' | null;

export interface CompanyPurchaser {
  member_id: string;
  user_id: string;
  display_name: string;
  email?: string | null;
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

// Authorization is driven entirely by capabilities (useCapabilities) and
// scope flags from the DB (useUserScope). No role-string arrays remain in
// this file — `is_self_only` comes straight from get_user_scope().

const STORAGE_KEY_PURCHASER_BASE = 'ps_selected_purchaser';
const STORAGE_KEY_MGMT_VIEW = 'ps_management_view';
const PURCHASER_CHANGE_EVENT = 'ps-purchaser-change';
// Per-user namespacing prevents cross-account leakage on shared browsers:
// without this, User A's saved "view as" ID is briefly applied to User B
// on first render after login, producing the illusion of seeing A's data.
const purchaserStorageKey = (userId: string) => `${STORAGE_KEY_PURCHASER_BASE}:${userId}`;

export function useBuyerCompanyContext(): BuyerCompanyContext {
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  const { has: hasCapability } = useCapabilities();
  // get_user_scope() is the single source of truth for self-only identity.
  const { isSelfOnly } = useUserScope();

  const [purchasers, setPurchasers] = useState<CompanyPurchaser[]>([]);
  const [selectedPurchaserId, setSelectedPurchaserIdState] = useState<string | null>(null);
  const [managementView, setManagementViewState] = useState<ManagementViewType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pure capability-driven gating. The DB has normalized roles via
  // get_user_scope and seeded role_capabilities; the UI must NOT
  // re-fragment that logic with role arrays.
  const canSelectPurchaser = hasCapability('can_switch_purchaser');
  const canViewManagement = hasCapability('can_view_management_dashboard');
  const isManagementMode = managementView !== null;
  const isReadOnly = canViewManagement && isManagementMode;

  // Get selected purchaser object
  const selectedPurchaser = purchasers.find(p => p.user_id === selectedPurchaserId) || null;

  // Hydrate saved purchaser immediately for this hook instance so sibling
  // components don't briefly render self/default scope before fetchPurchasers
  // finishes restoring the persisted acting purchaser.
  useEffect(() => {
    if (!user?.id) {
      setSelectedPurchaserIdState(null);
      return;
    }
    const saved = localStorage.getItem(purchaserStorageKey(user.id));
    if (saved === 'ALL') {
      setSelectedPurchaserIdState(null);
    } else if (saved) {
      setSelectedPurchaserIdState(saved);
    }
  }, [user?.id]);

  // Keep all hook instances on the page in sync. This hook is used directly
  // from multiple components, so local state must broadcast purchaser changes
  // immediately instead of waiting for an async refetch/localStorage restore.
  useEffect(() => {
    if (!user?.id) return;

    const handlePurchaserChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId?: string; purchaserId: string | null }>;
      if (customEvent.detail?.userId !== user.id) return;
      setSelectedPurchaserIdState(customEvent.detail?.purchaserId ?? null);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== purchaserStorageKey(user.id)) return;
      setSelectedPurchaserIdState(event.newValue ?? null);
    };

    window.addEventListener(PURCHASER_CHANGE_EVENT, handlePurchaserChange as EventListener);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(PURCHASER_CHANGE_EVENT, handlePurchaserChange as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user?.id]);

  // Persist purchaser selection (per-user namespaced).
  // No page reload — every scoped hook (useScopedData, etc.) already keys its
  // queries on selectedPurchaserId, so changing this state instantly triggers
  // a refetch in-place. Much faster than window.location.reload().
  const setSelectedPurchaserId = useCallback((id: string | null) => {
    setSelectedPurchaserIdState(id);
    if (!user?.id) return;
    const key = purchaserStorageKey(user.id);
    if (id) {
      localStorage.setItem(key, id);
    } else {
      // Persist explicit "All Purchasers" choice so refresh doesn't snap back
      // to a default. Reading code treats 'ALL' as null (company-wide).
      localStorage.setItem(key, 'ALL');
    }
    window.dispatchEvent(new CustomEvent(PURCHASER_CHANGE_EVENT, {
      detail: { userId: user.id, purchaserId: id ?? null },
    }));
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
          .select('contact_person, company_name, email')
          .eq('id', user.id)
          .single();
        
        const fallbackPurchaser: CompanyPurchaser = {
          member_id: user.id,
          user_id: user.id,
          display_name: profile?.contact_person || profile?.company_name || (profile?.email ? profile.email.split('@')[0] : 'You'),
          email: profile?.email ?? user.email ?? null,
          role: role || 'buyer',
          assigned_categories: [],
          is_current_user: true
        };
        
        setPurchasers([fallbackPurchaser]);
        setSelectedPurchaserIdState(user.id);
        return;
      }

      let purchaserList = (data || []) as CompanyPurchaser[];

      // SECURITY/UX: self-only users (e.g. purchasers) are hard-scoped to self
      // by the DB (RPC ignores p_selected_purchaser). The is_self_only flag
      // from get_user_scope() is the authoritative signal — no role-string
      // matching here.
      const isSelfOnlyRole = isSelfOnly;
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
          .select('contact_person, company_name, email')
          .eq('id', user.id)
          .single();
        
        const fallbackPurchaser: CompanyPurchaser = {
          member_id: user.id,
          user_id: user.id,
          display_name: profile?.contact_person || profile?.company_name || (profile?.email ? profile.email.split('@')[0] : 'You'),
          email: profile?.email ?? user.email ?? null,
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
        // Restore saved selection (per-user). For management:
        //   - saved 'ALL' (or empty) → company-wide (null)
        //   - saved valid user id → view-as that purchaser
        //   - no saved value → DEFAULT to company-wide (null) so co-owners
        //     immediately see all team data, not just their own.
        const savedPurchaserId = localStorage.getItem(purchaserStorageKey(user.id));

        if (savedPurchaserId === 'ALL') {
          setSelectedPurchaserIdState(null);
        } else if (savedPurchaserId) {
          const validSavedSelection = purchaserList.find(p => p.user_id === savedPurchaserId);
          if (validSavedSelection) {
            setSelectedPurchaserIdState(savedPurchaserId);
          } else {
            // Stale id (e.g. removed teammate) → fall back to company-wide
            setSelectedPurchaserIdState(null);
          }
        } else {
          // First load for a management user → company-wide view
          setSelectedPurchaserIdState(null);
        }
      }

    } catch (err) {
      console.error('[useBuyerCompanyContext] Error:', err);
      setError('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, role, ensureBuyerCompany, isSelfOnly]);

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
