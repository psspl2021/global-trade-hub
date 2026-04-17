/**
 * useGovernanceNotifications — list + mark-read for in-app governance alerts.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface GovNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  read: boolean;
  created_at: string;
}

export function useGovernanceNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<GovNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('governance_notifications' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) setItems((data as any) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription — apply deltas instead of refetching
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`gov-notif-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'governance_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const next = payload.new as GovNotification;
            setItems((cur) => {
              if (cur.some((n) => n.id === next.id)) return cur;
              return [next, ...cur]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 50);
            });
          } else if (payload.eventType === 'UPDATE') {
            const next = payload.new as GovNotification;
            setItems((cur) => cur.map((n) => (n.id === next.id ? next : n)));
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            setItems((cur) => cur.filter((n) => n.id !== old.id));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markRead = async (id: string) => {
    await supabase.rpc('mark_governance_notification_read' as any, { p_id: id } as any);
    setItems((cur) => cur.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await supabase.rpc('mark_all_governance_notifications_read' as any);
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return { items, loading, unreadCount, markRead, markAllRead, reload: load };
}
