import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Truck, CheckCircle2, FileText, Package, CreditCard, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';

interface ExecutionTrackingPageProps {
  userId: string;
  onBack: () => void;
}

function formatINR(v: number) {
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const STAGE_CONFIG = [
  { key: 'awarded', label: 'Awarded', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
  { key: 'po_sent', label: 'PO Sent', icon: FileText, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
  { key: 'in_transit', label: 'In Transit', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
  { key: 'delivered', label: 'Delivered', icon: Package, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800' },
  { key: 'payment', label: 'Payment', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
];

export function ExecutionTrackingPage({ userId, onBack }: ExecutionTrackingPageProps) {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedPurchaserId } = useBuyerCompanyContext();

  useEffect(() => {
    const load = async () => {
      // Scoped via RPC — DB enforces purchaser isolation. Filter completed+winner client-side.
      const { data: scoped } = await (supabase as any).rpc(
        'get_scoped_auctions_by_purchaser',
        { p_user_id: userId, p_selected_purchaser: selectedPurchaserId }
      );
      const data = (scoped || []).filter((a: any) => a.status === 'completed' && a.winner_supplier_id);

      // Enrich with supplier company names
      const enriched = await Promise.all(
        (data || []).map(async (a: any) => {
          const { data: sup } = await supabase
            .from('reverse_auction_suppliers')
            .select('supplier_company_name')
            .eq('auction_id', a.id)
            .eq('supplier_id', a.winner_supplier_id)
            .maybeSingle();
          return { ...a, supplier_company_name: sup?.supplier_company_name || '—', stage: 'awarded' };
        })
      );
      setAuctions(enriched);
      setLoading(false);
    };
    load();
  }, [userId, selectedPurchaserId]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STAGE_CONFIG.forEach(s => { counts[s.key] = 0; });
    auctions.forEach(a => { counts[a.stage] = (counts[a.stage] || 0) + 1; });
    return counts;
  }, [auctions]);

  const getStageBadge = (stage: string) => {
    const cfg = STAGE_CONFIG.find(s => s.key === stage);
    if (!cfg) return null;
    return (
      <Badge variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border} text-xs`}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">Execution Tracking</h2>
        <p className="text-sm text-muted-foreground">Track order lifecycle from award to payment</p>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAGE_CONFIG.map((stage) => (
          <Card key={stage.key} className={`p-3.5 border ${stage.bg} ${stage.border} rounded-[0.625rem]`}>
            <div className="flex items-center gap-1.5 mb-1">
              <stage.icon className={`w-3.5 h-3.5 ${stage.color}`} />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stage.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stage.color}`}>{stageCounts[stage.key]}</p>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="rounded-[0.625rem] overflow-hidden">
        <div className="flex items-center gap-2.5 p-4 border-b">
          <Truck className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-sm">All Orders</span>
          <Badge variant="secondary" className="text-xs">{auctions.length}</Badge>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading orders...</div>
        ) : auctions.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No awarded orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">Complete an auction to start tracking execution</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left p-3 font-medium text-muted-foreground">Order Ref</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Auction</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Supplier</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Stage</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">ORD-{a.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-3 font-medium truncate max-w-[200px]">{a.title}</td>
                    <td className="p-3 text-muted-foreground">{a.supplier_company_name}</td>
                    <td className="p-3 text-right font-semibold">
                      {a.winning_bid ? formatINR(a.winning_bid * (a.quantity || 1)) : '—'}
                    </td>
                    <td className="p-3">{getStageBadge(a.stage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
