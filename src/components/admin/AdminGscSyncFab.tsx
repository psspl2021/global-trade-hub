/**
 * Admin-only Floating Action Button: "Run GSC Sync Now"
 * Visible only to ps_admin / admin users on public pages.
 * Navigates to /admin?action=gsc-sync which auto-triggers the sync widget.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw } from 'lucide-react';

export function AdminGscSyncFab() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (cancelled) return;
      const roles = (data || []).map((r) => r.role as string);
      setIsAdmin(roles.includes('ps_admin') || roles.includes('admin'));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isAdmin) return null;

  return (
    <Link
      to="/admin?action=gsc-sync"
      className="fixed bottom-20 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-medium shadow-lg hover:opacity-90 transition"
      title="Run Google Search Console sync"
    >
      <RefreshCw className="h-4 w-4" />
      Run GSC Sync Now
    </Link>
  );
}

export default AdminGscSyncFab;
