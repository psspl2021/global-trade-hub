import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Eye, MousePointerClick, Gavel } from 'lucide-react';

interface InviteStats {
  sent: number;
  opened: number;
  clicked: number;
  bid_submitted: number;
}

export function AuctionInviteAnalytics({ auctionId }: { auctionId: string }) {
  const [stats, setStats] = useState<InviteStats | null>(null);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase
      .from('reverse_auction_suppliers')
      .select('invite_status')
      .eq('auction_id', auctionId);

    if (!data) return;

    const counts: InviteStats = { sent: 0, opened: 0, clicked: 0, bid_submitted: 0 };
    counts.sent = data.length;
    for (const row of data) {
      const s = (row as any).invite_status;
      if (s === 'opened') {
        counts.opened++;
      } else if (s === 'clicked') {
        counts.opened++;
        counts.clicked++;
      } else if (s === 'bid_submitted') {
        counts.opened++;
        counts.clicked++;
        counts.bid_submitted++;
      }
    }
    setStats(counts);
  }, [auctionId]);

  useEffect(() => {
    fetchStats();

    // Realtime subscription for live updates
    const channel = supabase
      .channel(`invite-analytics-${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reverse_auction_suppliers',
          filter: `auction_id=eq.${auctionId}`,
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, fetchStats]);

  if (!stats || stats.sent === 0) return null;

  const items = [
    { icon: Mail, label: 'Sent', value: stats.sent, color: 'text-blue-600' },
    { icon: Eye, label: 'Opened', value: stats.opened, color: 'text-amber-600' },
    { icon: MousePointerClick, label: 'Clicked', value: stats.clicked, color: 'text-purple-600' },
    { icon: Gavel, label: 'Bidding', value: stats.bid_submitted, color: 'text-emerald-600' },
  ];

  const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;
  const clickRate = stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0;
  const bidRate = stats.sent > 0 ? Math.round((stats.bid_submitted / stats.sent) * 100) : 0;

  return (
    <div className="flex items-center gap-3 text-xs flex-wrap">
      {items.map(({ icon: Icon, label, value, color }) => (
        <span key={label} className={`flex items-center gap-1 ${color}`}>
          <Icon className="w-3 h-3" />
          {value} {label}
        </span>
      ))}
      <span className="text-muted-foreground">
        📈 {openRate}% opened • {clickRate}% clicked • 🔨 {bidRate}% bidding
      </span>
      {stats.sent > 5 && stats.opened < stats.sent * 0.3 && (
        <span className="text-xs text-destructive">
          ⚠️ Low response — invite more suppliers
        </span>
      )}
    </div>
  );
}
