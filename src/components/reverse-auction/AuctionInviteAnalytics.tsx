import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('reverse_auction_suppliers')
        .select('invite_status')
        .eq('auction_id', auctionId);

      if (!data) return;

      const counts: InviteStats = { sent: 0, opened: 0, clicked: 0, bid_submitted: 0 };
      // Total sent = all rows (every invited supplier counts as sent)
      counts.sent = data.length;
      for (const row of data) {
        const s = (row as any).invite_status;
        if (s === 'opened') counts.opened++;
        if (s === 'clicked') counts.clicked++;
        if (s === 'bid_submitted') counts.bid_submitted++;
        // opened/clicked/bid_submitted also count as opened
        if (s === 'clicked' || s === 'bid_submitted') counts.opened++;
        if (s === 'bid_submitted') counts.clicked++;
      }
      setStats(counts);
    };
    fetch();
  }, [auctionId]);

  if (!stats || stats.sent === 0) return null;

  const items = [
    { icon: Mail, label: 'Sent', value: stats.sent, color: 'text-blue-600' },
    { icon: Eye, label: 'Opened', value: stats.opened, color: 'text-amber-600' },
    { icon: MousePointerClick, label: 'Clicked', value: stats.clicked, color: 'text-purple-600' },
    { icon: Gavel, label: 'Bidding', value: stats.bid_submitted, color: 'text-emerald-600' },
  ];

  return (
    <div className="flex items-center gap-3 text-xs">
      {items.map(({ icon: Icon, label, value, color }) => (
        <span key={label} className={`flex items-center gap-1 ${color}`}>
          <Icon className="w-3 h-3" />
          {value} {label}
        </span>
      ))}
    </div>
  );
}
