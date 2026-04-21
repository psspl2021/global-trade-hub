import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RequireCapability } from '@/components/governance/RequireCapability';
import { format } from 'date-fns';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';

interface RFQItem {
  id: string;
  title: string;
  category: string | null;
  status: string;
  created_at: string;
  bid_count: number;
  lowest_bid: number | null;
  highest_bid: number | null;
  awarded: boolean;
}

function CEORFQsInner() {
  const { formatAmount } = useGlobalBuyerContext();
  const fmtINR = (n: number | null) => (n == null ? '—' : formatAmount(n));
  const [items, setItems] = useState<RFQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_ceo_rfqs' as any);
      if (error) console.error(error);
      setItems(Array.isArray(data) ? (data as RFQItem[]) : []);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <Card><CardContent className="py-10 flex justify-center text-muted-foreground gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading RFQs…
    </CardContent></Card>
  );

  if (items.length === 0) return (
    <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No RFQs found.</CardContent></Card>
  );

  return (
    <div className="space-y-3">
      {items.map((r) => {
        const variancePct = r.lowest_bid && r.highest_bid && r.lowest_bid > 0
          ? Math.round(((r.highest_bid - r.lowest_bid) / r.lowest_bid) * 100)
          : null;
        return (
          <Card key={r.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{r.title}</span>
                    <Badge variant="outline">{r.status}</Badge>
                    {r.awarded && <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-300">Awarded</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.category && `${r.category} · `}{format(new Date(r.created_at), 'dd MMM yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.bid_count} quote{r.bid_count === 1 ? '' : 's'}
                    {variancePct != null && ` · spread ${variancePct}%`}
                  </div>
                </div>
                <div className="text-right space-y-1 flex-shrink-0">
                  <div className="text-xs text-muted-foreground">Lowest / Highest</div>
                  <div className="text-sm font-semibold tabular-nums">{fmtINR(r.lowest_bid)} <span className="text-muted-foreground">/</span> {fmtINR(r.highest_bid)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function CEORFQs() {
  return (
    <RequireCapability cap="can_view_all_quotes">
      <CEORFQsInner />
    </RequireCapability>
  );
}
