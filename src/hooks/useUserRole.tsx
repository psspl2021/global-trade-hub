import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Extended user roles including governance roles and buyer sub-roles
 */
export type UserRole = 
  | 'buyer' 
  | 'buyer_purchaser'
  | 'buyer_cfo'
  | 'buyer_ceo'
  | 'buyer_hr'
  | 'buyer_manager'
  | 'supplier' 
  | 'admin' 
  | 'logistics_partner' 
  | 'affiliate' 
  | 'purchaser'
  | 'manager'
  | 'cfo'
  | 'ceo'
  | 'hr'
  | 'external_guest'
  | 'ps_admin'
  | null;

// Priority order: governance roles have highest priority
const ROLE_PRIORITY: UserRole[] = [
  'ceo',
  'buyer_ceo',
  'cfo', 
  'buyer_cfo',
  'hr',
  'buyer_hr',
  'manager',
  'buyer_manager',
  'ps_admin',
  'admin', 
  'purchaser',
  'buyer_purchaser',
  'buyer',
  'logistics_partner', 
  'supplier', 
  'affiliate',
  'external_guest'
];

export const useUserRole = (userId: string | undefined) => {
  const [role, setRole] = useState<UserRole>(null);
  const [allRoles, setAllRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setAllRoles([]);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        // Fetch ALL roles for the user
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (error) throw error;
        
        if (!data || data.length === 0) {
          setRole(null);
          setAllRoles([]);
          return;
        }
        
        // Get all roles the user has
        const userRoles = data.map(r => r.role) as UserRole[];
        setAllRoles(userRoles);
        
        // Return highest priority role
        for (const priorityRole of ROLE_PRIORITY) {
          if (priorityRole && userRoles.includes(priorityRole)) {
            setRole(priorityRole);
            return;
          }
        }
        
        // Fallback to first role
        setRole(data[0]?.role as UserRole);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching user role:', error);
        setRole(null);
        setAllRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [userId]);

  // Helper functions for governance checks
  const isManagement = ['cfo', 'buyer_cfo', 'ceo', 'buyer_ceo', 'manager', 'buyer_manager'].includes(role || '');
  const isAdmin = role === 'admin' || role === 'ps_admin';
  const isPurchaser = ['purchaser', 'buyer_purchaser', 'buyer'].includes(role || '');
  const isSupplier = role === 'supplier';
  const isRestricted = role === 'supplier' || role === 'external_guest';
  const isBuyerManagement = ['buyer_cfo', 'buyer_ceo', 'buyer_manager'].includes(role || '');
  const isBuyerPurchaser = ['buyer_purchaser', 'purchaser', 'buyer'].includes(role || '');

  return { 
    role, 
    allRoles,
    loading,
    isManagement,
    isAdmin,
    isPurchaser,
    isSupplier,
    isRestricted,
    isBuyerManagement,
    isBuyerPurchaser
  };
};
