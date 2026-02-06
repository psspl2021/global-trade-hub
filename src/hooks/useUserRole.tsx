import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Extended user roles including governance roles
 */
export type UserRole = 
  | 'buyer' 
  | 'supplier' 
  | 'admin' 
  | 'logistics_partner' 
  | 'affiliate' 
  | 'purchaser'
  | 'manager'
  | 'cfo'
  | 'ceo'
  | 'external_guest'
  | 'ps_admin'
  | null;

// Priority order: governance roles have highest priority
const ROLE_PRIORITY: UserRole[] = [
  'ceo',
  'cfo', 
  'manager',
  'ps_admin',
  'admin', 
  'purchaser',
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
  const isManagement = role === 'cfo' || role === 'ceo' || role === 'manager';
  const isAdmin = role === 'admin' || role === 'ps_admin';
  const isPurchaser = role === 'purchaser' || role === 'buyer';
  const isSupplier = role === 'supplier';
  const isRestricted = role === 'supplier' || role === 'external_guest';

  return { 
    role, 
    allRoles,
    loading,
    isManagement,
    isAdmin,
    isPurchaser,
    isSupplier,
    isRestricted
  };
};
