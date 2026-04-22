/**
 * ManagerAcknowledgementsPage — POs that were CEO-overridden and need this manager's acknowledgement.
 * Visually elevated (alert tone) so it cannot be buried.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Flag, Loader2, ShieldAlert } from 'lucide-react';
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
  const [flagging, setFlagging] = useState<string | null>(null);

  const flagForReview = async (po: PendingAck) => {
    const reason = window.prompt(
      `Flag override on ${po.po_number} for review.\n\nProvide a reason (min 10 chars). PO will remain open.`,
      ''
    );
    if (!reason || reason.trim().length < 10) {
      if (reason !== null) toast.error('Reason must be at least 10 characters');
      return;
    }
    setFlagging(po.id);
    const { data, error } = await supabase.rpc('manager_flag_override' as any, {
      p_po_id: po.id,
      p_reason: reason.trim(),
    } as any);
    setFlagging(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as any;
    if (result?.success) {
      toast.success('Flagged for review. CEO has been notified.');
      load();
    } else {
      toast.error(result?.error ?? 'Flag failed');
    }
  };

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
    const ageHours = Math.round(
      (Date.now() - new Date(po.ceo_override_at).getTime()) / 36e5
    );
    const confirmMsg = [
      `Acknowledge CEO override on ${po.po_number}?`,
      ``,
      `Supplier: ${po.supplier_name}`,
      `Value:    ${fmtINR(po.po_value)}`,
      `Overridden by: ${po.ceo_name} (${ageHours}h ago)`,
      `Reason: "${po.ceo_override_reason}"`,
      ``,
      `This finalizes the PO and is permanently logged in the audit trail.`,
    ].join('\n');
    if (!confirm(confirmMsg)) return;

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
    <div className="container mx-auto px-3 py-4 sm:p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 shrink-0" />
          <span className="leading-tight">Override Acknowledgements</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
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
              className="border-yellow-300 bg-yellow-50/40 overflow-hidden"
            >
              <CardHeader className="pb-2 px-4 sm:px-6">
                {/* Mobile-first: stack title, badge, and amount vertically; row on sm+ */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <CardTitle className="flex items-start gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-yellow-700 shrink-0 mt-0.5" />
                      <span className="font-mono text-sm sm:text-base break-all">{po.po_number}</span>
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-900 border-yellow-300 text-[11px] whitespace-normal text-left h-auto py-0.5"
                    >
                      CEO override · awaiting your ack
                    </Badge>
                  </div>
                  <div className="text-lg sm:text-xl font-semibold tabular-nums shrink-0 sm:text-right">
                    {fmtINR(po.po_value)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-4 sm:px-6 pb-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Supplier:</span>{' '}
                  <span className="font-medium break-words">{po.supplier_name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Overridden by:</span>{' '}
                  <span className="font-medium break-words">{po.ceo_name}</span>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(po.ceo_override_at), { addSuffix: true })} (
                    {format(new Date(po.ceo_override_at), 'dd MMM yyyy HH:mm')})
                  </div>
                </div>
                <div className="rounded-md bg-white border border-yellow-200 p-3">
                  <div className="text-xs font-medium text-yellow-900 mb-1">Reason given</div>
                  <div className="text-sm text-foreground break-words">{po.ceo_override_reason}</div>
                </div>
                {/* Buttons: full-width stacked on mobile, inline on sm+ */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => flagForReview(po)}
                    disabled={flagging === po.id || acking === po.id}
                    className="w-full sm:w-auto"
                  >
                    {flagging === po.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Flagging…
                      </>
                    ) : (
                      <>
                        <Flag className="h-4 w-4 mr-2" /> Flag for Review
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => acknowledge(po)}
                    disabled={acking === po.id || flagging === po.id}
                    className="w-full sm:w-auto"
                  >
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
