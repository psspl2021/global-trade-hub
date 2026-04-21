import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RequireCapability } from '@/components/governance/RequireCapability';
import { OverridePOModal } from './OverridePOModal';
import { format } from 'date-fns';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';

interface POItem {
  id: string;
  po_number: string;
  po_value: number;
  approval_status: string | null;
  approval_required: boolean | null;
  manager_approved_at: string | null;
  ceo_override: boolean;
  ceo_override_reason: string | null;
  ceo_override_at: string | null;
  manager_ack_at: string | null;
  supplier_name: string;
  created_by_name: string;
  created_at: string;
  payment_due_date: string | null;
}

// Region-aware currency formatting via useGlobalBuyerContext

function statusBadge(po: POItem) {
  if (po.ceo_override && !po.manager_ack_at)
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-900 border-yellow-300">CEO override · manager pending</Badge>;
  if (po.ceo_override && po.manager_ack_at)
    return <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-300">Override acknowledged</Badge>;
  if (po.manager_approved_at) return <Badge variant="outline">Manager approved</Badge>;
  if (po.approval_required) return <Badge variant="outline" className="bg-orange-50 text-orange-900 border-orange-300">Pending approval</Badge>;
  return <Badge variant="outline">{po.approval_status ?? 'Draft'}</Badge>;
}

function CEOPurchaseOrdersInner() {
  const [items, setItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideTarget, setOverrideTarget] = useState<POItem | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_ceo_purchase_orders' as any);
    if (error) console.error(error);
    setItems(Array.isArray(data) ? (data as POItem[]) : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <Card><CardContent className="py-10 flex justify-center text-muted-foreground gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading purchase orders…
    </CardContent></Card>
  );

  if (items.length === 0) return (
    <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
      No purchase orders to review.
    </CardContent></Card>
  );

  return (
    <>
      <div className="space-y-3">
        {items.map((po) => {
          const canOverride = !po.ceo_override && (po.approval_required || !po.manager_approved_at);
          return (
            <Card key={po.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{po.po_number}</span>
                      {statusBadge(po)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Supplier: <span className="text-foreground">{po.supplier_name}</span>
                      {' · '}Raised by: <span className="text-foreground">{po.created_by_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {format(new Date(po.created_at), 'dd MMM yyyy')}
                      {po.payment_due_date && ` · Due ${format(new Date(po.payment_due_date), 'dd MMM yyyy')}`}
                    </div>
                    {po.ceo_override && po.ceo_override_reason && (
                      <div className="mt-2 text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                        <div className="font-medium text-yellow-900 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Override reason
                        </div>
                        <div className="text-yellow-800">{po.ceo_override_reason}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-lg font-semibold tabular-nums">₹{fmtINR(po.po_value)}</div>
                    {canOverride && (
                      <Button size="sm" variant="default" onClick={() => setOverrideTarget(po)}>
                        Override & Approve
                      </Button>
                    )}
                    {po.ceo_override && !po.manager_ack_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="h-3 w-3" /> Awaiting manager ack
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {overrideTarget && (
        <OverridePOModal
          po={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onSuccess={() => { setOverrideTarget(null); load(); }}
        />
      )}
    </>
  );
}

export default function CEOPurchaseOrders() {
  return (
    <RequireCapability cap="can_view_all_pos">
      <CEOPurchaseOrdersInner />
    </RequireCapability>
  );
}
