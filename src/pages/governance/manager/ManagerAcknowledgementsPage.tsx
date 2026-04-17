/**
 * ManagerAcknowledgementsPage — POs that were CEO-overridden and need this manager's acknowledgement.
 * Visually elevated (alert tone) so it cannot be buried.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface PendingAck {
  id: string;
  po_number: string;
  po_value: number;
  ceo_override_at: string;
  ceo_override_reason: string;
  ceo_name: string;
  supplier_name: string;
}

const fmtINR = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

export default function ManagerAcknowledgementsPage() {
  const [items, setItems] = useState<PendingAck[]>([]);
  const [loading, setLoading] = useState(true);
  const [acking, setAcking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_my_pending_override_acks' as any);
    if (error) console.error(error);
    setItems(Array.isArray(data) ? (data as PendingAck[]) : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const acknowledge = async (po: PendingAck) => {
    if (
      !confirm(
        `Acknowledge CEO override on ${po.po_number}?\n\nThis finalizes the PO and is permanently logged in the audit trail.`
      )
    ) {
      return;
    }
    setAcking(po.id);
    const { data, error } = await supabase.rpc('manager_acknowledge_override' as any, {
      p_po_id: po.id,
    } as any);
    setAcking(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as any;
    if (result?.success) {
      toast.success('Override acknowledged. PO finalized.');
      load();
    } else {
      toast.error(result?.error ?? 'Acknowledgement failed');
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-yellow-600" />
          Override Acknowledgements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Purchase orders the CEO has approved via override. Your acknowledgement is required to
          finalize them.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 flex justify-center text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No pending acknowledgements. You're up to date.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((po) => (
            <Card
              key={po.id}
              className="border-yellow-300 bg-yellow-50/40"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-yellow-700" />
                    {po.po_number}
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-900 border-yellow-300"
                    >
                      CEO override · awaiting your ack
                    </Badge>
                  </CardTitle>
                  <div className="text-lg font-semibold tabular-nums">{fmtINR(po.po_value)}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Supplier:</span>{' '}
                  <span className="font-medium">{po.supplier_name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Overridden by:</span>{' '}
                  <span className="font-medium">{po.ceo_name}</span>{' '}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(po.ceo_override_at), { addSuffix: true })} (
                    {format(new Date(po.ceo_override_at), 'dd MMM yyyy HH:mm')})
                  </span>
                </div>
                <div className="rounded-md bg-white border border-yellow-200 p-3">
                  <div className="text-xs font-medium text-yellow-900 mb-1">Reason given</div>
                  <div className="text-sm text-foreground">{po.ceo_override_reason}</div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button onClick={() => acknowledge(po)} disabled={acking === po.id}>
                    {acking === po.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Acknowledging…
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" /> Acknowledge & Finalize
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
