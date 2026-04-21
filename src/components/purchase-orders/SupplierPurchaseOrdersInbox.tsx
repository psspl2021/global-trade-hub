/**
 * SupplierPurchaseOrdersInbox — Lists purchase_orders received by the logged-in supplier.
 * Wired to public.purchase_orders via RLS (auth.uid() = supplier_id).
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Inbox, FileText, RefreshCw, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface POItem {
  id: string;
  po_number: string;
  vendor_name: string | null;
  total_amount: number | null;
  currency: string | null;
  order_date: string | null;
  status: string;
  po_status: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  auction_id: string | null;
  created_at: string;
}

interface Props {
  supplierId: string;
}

export function SupplierPurchaseOrdersInbox({ supplierId }: Props) {
  const [pos, setPOs] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPOs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('purchase_orders')
      .select('id, po_number, vendor_name, total_amount, currency, order_date, status, po_status, expected_delivery_date, notes, auction_id, created_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(50);
    setPOs((data as POItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!supplierId) return;
    fetchPOs();

    const channel = supabase
      .channel(`supplier-pos-${supplierId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_orders', filter: `supplier_id=eq.${supplierId}` },
        () => fetchPOs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  const formatMoney = (amt: number | null, ccy: string | null) => {
    if (amt == null) return '—';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: (ccy || 'INR').toUpperCase(),
        maximumFractionDigits: 2,
      }).format(amt);
    } catch {
      return `${ccy || ''} ${amt.toFixed(2)}`;
    }
  };

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[0.625rem] bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Purchase Orders Received</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                POs sent to you by buyers (auctions, contracts, direct)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium">
              {pos.length} total
            </Badge>
            <Button size="sm" variant="ghost" onClick={fetchPOs} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="text-center py-6 text-sm text-muted-foreground">Loading…</div>
        ) : pos.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
            No purchase orders yet. POs from buyers will appear here automatically.
          </div>
        ) : (
          <div className="space-y-2">
            {pos.map((po) => (
              <div
                key={po.id}
                className="border border-border/60 rounded-lg p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold text-sm truncate">{po.po_number}</span>
                      {po.auction_id && (
                        <Badge variant="secondary" className="text-[10px]">From Auction</Badge>
                      )}
                      <Badge
                        variant={po.po_status === 'sent' || po.status === 'sent' ? 'default' : 'outline'}
                        className="text-[10px] capitalize"
                      >
                        {po.po_status || po.status || 'draft'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {po.vendor_name || 'Buyer'}
                      </span>
                      {po.order_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(po.order_date), 'dd MMM yyyy')}
                        </span>
                      )}
                      {po.expected_delivery_date && (
                        <span>
                          Expected: {format(new Date(po.expected_delivery_date), 'dd MMM yyyy')}
                        </span>
                      )}
                    </div>
                    {po.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{po.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-foreground">
                      {formatMoney(po.total_amount, po.currency)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
