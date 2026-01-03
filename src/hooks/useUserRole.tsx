import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'buyer' | 'supplier' | 'admin' | 'logistics_partner' | 'affiliate' | null;

// Priority order: admin has highest priority
const ROLE_PRIORITY: UserRole[] = ['admin', 'logistics_partner', 'supplier', 'buyer', 'affiliate'];

export const useUserRole = (userId: string | undefined) => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
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
          return;
        }
        
        // Get all roles the user has
        const userRoles = data.map(r => r.role) as UserRole[];
        
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
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [userId]);

  return { role, loading };
};
