/**
 * POApprovalQueue — Manager / Head of Procurement queue for auction-derived POs.
 * - Manager sees POs in 'pending_manager' status awaiting their approval.
 * - Head of Procurement (purchase_head) sees POs in 'pending_purchase_head'.
 * - Both can approve or reject. Final approval auto-sends PO to supplier.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldCheck, FileText, AlertTriangle, CheckCircle2, X, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';

type Stage = 'pending_manager' | 'pending_purchase_head';

interface ApprovalRow {
  id: string;
  po_number: string;
  vendor_name: string | null;
  total_amount: number | null;
  currency: string | null;
  order_date: string | null;
  approval_status: string;
  notes: string | null;
  expected_delivery_date: string | null;
  auction_id: string | null;
  created_at: string;
}

interface Props {
  /** 'manager' shows pending_manager queue; 'purchase_head' shows pending_purchase_head queue. */
  stage: 'manager' | 'purchase_head';
}

export function POApprovalQueue({ stage }: Props) {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const dbStage: Stage = stage === 'manager' ? 'pending_manager' : 'pending_purchase_head';

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(
        'id, po_number, vendor_name, total_amount, currency, order_date, approval_status, notes, expected_delivery_date, auction_id, created_at'
      )
      .eq('po_source', 'auction')
      .eq('approval_status', dbStage)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error(error);
    }
    setRows((data as ApprovalRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel(`po-approval-${dbStage}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_orders' },
        () => fetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbStage]);

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

  const handleApprove = async (poId: string) => {
    setActingId(poId);
    try {
      const fn = stage === 'manager' ? 'approve_po_as_manager' : 'approve_po_as_purchase_head';
      const { error } = await (supabase as any).rpc(fn, { _po_id: poId, _notes: null });
      if (error) throw error;
      toast.success(
        stage === 'manager'
          ? 'Approved — forwarded to Head of Procurement'
          : 'Approved — Purchase Order sent to supplier'
      );
      fetch();
    } catch (err: any) {
      toast.error(err?.message || 'Approval failed');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActingId(rejectId);
    try {
      const { error } = await (supabase as any).rpc('reject_po_approval', {
        _po_id: rejectId,
        _reason: rejectReason.trim(),
      });
      if (error) throw error;
      toast.success('Purchase Order rejected');
      setRejectId(null);
      setRejectReason('');
      fetch();
    } catch (err: any) {
      toast.error(err?.message || 'Rejection failed');
    } finally {
      setActingId(null);
    }
  };

  const title = stage === 'manager' ? 'Manager Approval Queue' : 'Head of Procurement Approval Queue';
  const subtitle =
    stage === 'manager'
      ? 'Auction POs awaiting your approval before forwarding to Head of Procurement'
      : 'Auction POs cleared by Manager — your approval sends them to the supplier';

  return (
    <>
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[0.625rem] bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium">
                {rows.length} pending
              </Badge>
              <Button size="sm" variant="ghost" onClick={fetch} disabled={loading}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              No purchase orders awaiting your approval.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((po) => (
                <div
                  key={po.id}
                  className="border border-amber-200 bg-amber-50/30 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="font-semibold text-sm truncate">{po.po_number}</span>
                        <Badge variant="secondary" className="text-[10px]">From Auction</Badge>
                        <Badge className="text-[10px] bg-amber-600 text-white capitalize">
                          {dbStage.replace('pending_', 'awaiting ').replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span>Supplier: {po.vendor_name || '—'}</span>
                        {po.order_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(po.order_date), 'dd MMM yyyy')}
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
                      <div className="text-[10px] text-muted-foreground mt-0.5">PO Value</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      disabled={actingId === po.id}
                      onClick={() => {
                        setRejectId(po.id);
                        setRejectReason('');
                      }}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={actingId === po.id}
                      onClick={() => handleApprove(po.id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {stage === 'manager' ? 'Approve & Forward' : 'Approve & Send to Supplier'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Reject Purchase Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Provide a clear reason. The PO will be marked as rejected and the supplier will not receive it.
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Pricing exceeds approved budget for this category…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || !!actingId}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
