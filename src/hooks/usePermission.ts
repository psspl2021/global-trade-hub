import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePermission(userId: string | null, permission: string) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const check = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('check_permission', {
          p_user_id: userId,
          p_permission: permission,
        });
        if (error) throw error;
        setAllowed(data === true);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [userId, permission]);

  return { allowed, loading };
}
