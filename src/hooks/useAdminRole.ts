/**
 * useAdminRole — Resolves admin dashboard persona
 * Maps user_roles to one of: ceo | ops_manager | sales_manager | admin
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AdminDashboardRole = 'ceo' | 'ops_manager' | 'sales_manager' | 'admin' | null;

// Maps DB roles → admin dashboard persona
const ROLE_TO_DASHBOARD: Record<string, AdminDashboardRole> = {
  ps_admin: 'admin',
  admin: 'admin',
  ceo: 'ceo',
  buyer_ceo: 'ceo',
  ops_manager: 'ops_manager',
  sales_manager: 'sales_manager',
};

export function useAdminRole(userId: string | undefined) {
  const [dashboardRole, setDashboardRole] = useState<AdminDashboardRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setDashboardRole(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (error) throw error;

        const roles = (data || []).map(r => r.role as string);

        // Priority: admin > ceo > ops_manager > sales_manager
        if (roles.includes('ps_admin') || roles.includes('admin')) {
          setDashboardRole('admin');
        } else if (roles.includes('ceo') || roles.includes('buyer_ceo')) {
          setDashboardRole('ceo');
        } else if (roles.includes('ops_manager')) {
          setDashboardRole('ops_manager');
        } else if (roles.includes('sales_manager')) {
          setDashboardRole('sales_manager');
        } else {
          setDashboardRole(null);
        }
      } catch {
        setDashboardRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  return { dashboardRole, loading };
}
