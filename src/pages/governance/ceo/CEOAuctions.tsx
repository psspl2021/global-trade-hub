import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Gavel } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RequireCapability } from '@/components/governance/RequireCapability';
import { format } from 'date-fns';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';

interface AuctionItem {
  id: string;
  title: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  reserve_price: number | null;
  current_lowest_bid: number | null;
  total_bids: number;
  unique_suppliers: number;
}

function CEOAuctionsInner() {
  const { formatAmount } = useGlobalBuyerContext();
  const fmtINR = (n: number | null) => (n == null ? '—' : formatAmount(n));
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_ceo_auctions' as any);
      if (error) console.error(error);
      setItems(Array.isArray(data) ? (data as AuctionItem[]) : []);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Card className="mb-4 border-yellow-200 bg-yellow-50/50">
        <CardContent className="py-3 flex items-start gap-2 text-sm">
          <ShieldAlert className="h-4 w-4 text-yellow-700 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-yellow-900">Executive View — read-only</div>
            <div className="text-yellow-800 text-xs">
              Supplier identities are visible. Every view is recorded in the audit log.
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="py-10 flex justify-center text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading auctions…
        </CardContent></Card>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No auctions found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Gavel className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{a.title}</span>
                      <Badge variant="outline">{a.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.starts_at && `Started ${format(new Date(a.starts_at), 'dd MMM, HH:mm')}`}
                      {a.ends_at && ` · Ends ${format(new Date(a.ends_at), 'dd MMM, HH:mm')}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.total_bids} bids from {a.unique_suppliers} suppliers
                    </div>
                  </div>
                  <div className="text-right space-y-1 flex-shrink-0">
                    <div className="text-xs text-muted-foreground">Lowest bid</div>
                    <div className="text-lg font-semibold tabular-nums">{fmtINR(a.current_lowest_bid)}</div>
                    <div className="text-xs text-muted-foreground">Reserve {fmtINR(a.reserve_price)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function CEOAuctions() {
  return (
    <RequireCapability cap="can_view_all_auctions">
      <CEOAuctionsInner />
    </RequireCapability>
  );
}
