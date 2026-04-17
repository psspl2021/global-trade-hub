/**
 * GovernanceNotificationBell — header bell + dropdown for governance alerts.
 */
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useGovernanceNotifications } from '@/hooks/useGovernanceNotifications';

export function GovernanceNotificationBell() {
  const navigate = useNavigate();
  const { items, loading, unreadCount, markRead, markAllRead } = useGovernanceNotifications();

  const onItemClick = async (n: (typeof items)[number]) => {
    if (!n.read) await markRead(n.id);
    if (n.entity_type === 'purchase_order') {
      navigate('/governance/manager/acknowledgements');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Governance notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="font-semibold text-sm">Governance</div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs">
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onItemClick(n)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition ${
                    !n.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{n.title}</span>
                        {n.type === 'po_override_pending_ack' && (
                          <Badge variant="outline" className="text-[10px] h-4">
                            ACK NEEDED
                          </Badge>
                        )}
                      </div>
                      {n.message && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
