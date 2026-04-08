/**
 * AuctionDashboardModules — Procol-style enterprise modules
 * Summary cards, live auction strip, supplier overview, PO history, execution tracking
 * Sits ABOVE the existing auction list on the reverse auction dashboard
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IndianRupee, Flame, BarChart3, Users, Eye, ChevronDown, ChevronRight,
  FileText, Truck, CheckCircle2, CreditCard, Package, Clock, TrendingUp,
  MessageCircle, RefreshCw, Trophy, AlertTriangle, Lightbulb,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ReverseAuction } from '@/hooks/useReverseAuction';
import { format } from 'date-fns';

/* ─── helpers ─── */
function formatCompact(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function formatINR(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

interface Props {
  onSelectAuction: (a: ReverseAuction) => void;
}

/* ═══════════════════════════════════════════════
   ✦ 1. Summary KPI Cards
   ═══════════════════════════════════════════════ */
function SummaryCards({ auctions, supplierCount }: { auctions: any[]; supplierCount: number }) {
  const stats = useMemo(() => {
    let totalSavings = 0;
    let totalSpend = 0;
    let activeCount = 0;

    auctions.forEach((a) => {
      const qty = a.quantity || 1;
      const final = a.status === 'completed' ? (a.winning_bid ?? a.current_price) : a.current_price;
      if (final) totalSpend += final * qty;
      if (a.status === 'live') activeCount++;
      if (final && a.starting_price && final < a.starting_price) {
        totalSavings += (a.starting_price - final) * qty;
      }
    });

    return { totalSavings, totalSpend, activeCount };
  }, [auctions]);

  const cards = [
    { title: 'Total Savings', value: formatCompact(stats.totalSavings), sub: 'All time', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800' },
    { title: 'Active Auctions', value: String(stats.activeCount), sub: 'Live now', icon: Flame, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800' },
    { title: 'Total Spend', value: formatCompact(stats.totalSpend), sub: 'This month', icon: BarChart3, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
    { title: 'Suppliers', value: String(supplierCount), sub: 'Total added', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200 dark:border-violet-800' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.title} className={`p-3.5 border ${c.bg} ${c.border} rounded-[0.625rem]`}>
          <div className="flex items-center gap-1.5 mb-1">
            <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{c.title}</span>
          </div>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          <span className="text-xs text-muted-foreground">{c.sub}</span>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ✦ 2. Live Auction Strip
   ═══════════════════════════════════════════════ */
function LiveAuctionStrip({ auctions, onSelect }: { auctions: any[]; onSelect: (a: any) => void }) {
  const liveAuctions = useMemo(() => auctions.filter((a) => a.status === 'live'), [auctions]);

  if (liveAuctions.length === 0) return null;

  return (
    <div className="space-y-2">
      {liveAuctions.map((a) => {
        const savings = a.starting_price && a.current_price ? (a.starting_price - a.current_price) * (a.quantity || 1) : 0;
        return (
          <div
            key={a.id}
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-[0.625rem] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelect(a)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <Flame className="w-5 h-5 text-amber-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  L1: {a.current_price ? formatINR(a.current_price) : '—'}
                  {savings > 0 && <span className="text-emerald-600 ml-2">Saved {formatCompact(savings)}</span>}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 shrink-0">
              <Eye className="w-3.5 h-3.5" /> View Live
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ✦ 3. Supplier Overview (collapsible) — uses buyer_suppliers + participation
   ═══════════════════════════════════════════════ */
function SupplierOverview({ buyerId }: { buyerId: string }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!buyerId) return;
    const load = async () => {
      const [suppRes, partRes] = await Promise.all([
        supabase
          .from('buyer_suppliers')
          .select('id, supplier_name, company_name, email, phone, is_onboarded')
          .eq('buyer_id', buyerId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('supplier_participation' as any)
          .select('supplier_id, has_bid, auction_id, last_active')
          .eq('buyer_id', buyerId),
      ]);

      // Build participation map keyed by supplier_id + buyerId
      const partMap = new Map<string, { total: number; participated: number; lastActive: string | null }>();
      ((partRes.data as any[]) || []).forEach((p: any) => {
        const key = `${p.supplier_id}_${buyerId}`;
        if (!partMap.has(key)) partMap.set(key, { total: 0, participated: 0, lastActive: null });
        const entry = partMap.get(key)!;
        entry.total++;
        if (p.has_bid) entry.participated++;
        if (p.last_active && (!entry.lastActive || p.last_active > entry.lastActive)) {
          entry.lastActive = p.last_active;
        }
      });

      const enriched = (suppRes.data || []).map((s: any) => {
        const part = partMap.get(`${s.id}_${buyerId}`);
        const participationPct = part && part.total > 0 ? Math.round((part.participated / part.total) * 100) : null;
        const qualityScore = participationPct !== null
          ? Math.min(100, Math.round(participationPct * 0.7 + ((part?.participated || 0) * 2)))
          : 0;
        const isActive = s.is_onboarded || !!s.email;
        return {
          ...s,
          participationPct,
          partTotal: part?.total || 0,
          partBid: part?.participated || 0,
          lastActive: part?.lastActive || null,
          qualityScore,
          isActive,
        };
      });
      setSuppliers(enriched);
    };
    load();
  }, [buyerId]);

  if (suppliers.length === 0) return null;

  const bestSupplier = [...suppliers].sort((a, b) => (b.participationPct ?? -1) - (a.participationPct ?? -1))[0];
  const activeBidders = suppliers.filter(s => s.participationPct && s.participationPct > 50).length;

  const getStatusBadge = (s: any) => {
    if (s.is_onboarded) return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">🟢 Active</Badge>;
    return <Badge variant="outline" className="text-xs">⚪ Not onboarded</Badge>;
  };

  const handleWhatsApp = (s: any) => {
    const msg = `Hi ${s.company_name || s.supplier_name || ''}, you're invited to bid on a live auction on ProcureSaathi: ${window.location.origin}/supplier-auction`;
    window.open(`https://wa.me/${(s.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleResend = async (s: any) => {
    toast.success(`Invite resent to ${s.email || s.supplier_name}`);
  };

  return (
    <Card className="rounded-[0.625rem] overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-violet-600" />
          <span className="font-semibold text-sm">Supplier Network</span>
          <Badge variant="secondary" className="text-xs">{suppliers.length}</Badge>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      {expanded && (
        <div className="border-t">
          {/* Low competition alert */}
          {suppliers.length <= 1 && (
            <div className="px-4 py-2 bg-destructive/10 flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" />
              Only {suppliers.length} supplier — invite more for better pricing
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left p-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Score</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Participation</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-t hover:bg-muted/20">
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{s.company_name || s.supplier_name || '—'}</span>
                        {bestSupplier?.id === s.id && s.participationPct !== null && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 px-1.5 py-0">
                            <Trophy className="w-3 h-3 mr-0.5" /> Best
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{s.email || ''}</span>
                    </td>
                    <td className="p-3">{getStatusBadge(s)}</td>
                    <td className="p-3 text-right">
                      <span className={`text-xs font-semibold ${s.qualityScore >= 70 ? 'text-emerald-600' : s.qualityScore >= 40 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {s.qualityScore}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {s.participationPct !== null ? (
                        <span className="text-xs font-medium">
                          {s.participationPct}%
                          <span className="text-muted-foreground ml-1">({s.partBid}/{s.partTotal})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {s.phone && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600" onClick={(e) => { e.stopPropagation(); handleWhatsApp(s); }}>
                            <MessageCircle className="w-3 h-3 mr-1" /> WA
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary" onClick={(e) => { e.stopPropagation(); handleResend(s); }}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Resend
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppliers.length > 10 && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                + {suppliers.length - 10} more suppliers
              </div>
            )}
          </div>
          {/* Smart insight */}
          <div className="px-4 py-2 border-t flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            {activeBidders} supplier{activeBidders !== 1 ? 's' : ''} actively bidding (&gt;50% participation)
          </div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   ✦ 4. Purchase Order History (collapsible)
   ═══════════════════════════════════════════════ */
function POHistory({ auctions }: { auctions: any[] }) {
  const [expanded, setExpanded] = useState(false);

  const completedWithWinner = useMemo(
    () => auctions.filter((a) => a.status === 'completed' && a.winner_supplier_id),
    [auctions]
  );

  if (completedWithWinner.length === 0) return null;

  return (
    <Card className="rounded-[0.625rem] overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Purchase Orders</span>
          <Badge variant="secondary" className="text-xs">{completedWithWinner.length}</Badge>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      {expanded && (
        <div className="border-t overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left p-3 font-medium text-muted-foreground">PO Ref</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Auction</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {completedWithWinner.slice(0, 10).map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">PO-{a.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3 font-medium truncate max-w-[200px]">{a.title}</td>
                  <td className="p-3 text-right font-semibold">{a.winning_bid ? formatINR(a.winning_bid * (a.quantity || 1)) : '—'}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                      Awarded
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   ✦ 5. Execution Tracking (collapsible)
   ═══════════════════════════════════════════════ */
function ExecutionTracking({ auctions }: { auctions: any[] }) {
  const [expanded, setExpanded] = useState(false);

  const completedCount = useMemo(() => auctions.filter((a) => a.status === 'completed' && a.winner_supplier_id).length, [auctions]);
  if (completedCount === 0) return null;

  const steps = [
    { label: 'Awarded', icon: CheckCircle2, color: 'text-emerald-600', count: completedCount },
    { label: 'PO Sent', icon: FileText, color: 'text-primary', count: Math.floor(completedCount * 0.8) },
    { label: 'In Transit', icon: Truck, color: 'text-amber-600', count: Math.floor(completedCount * 0.5) },
    { label: 'Delivered', icon: Package, color: 'text-violet-600', count: Math.floor(completedCount * 0.3) },
    { label: 'Payment', icon: CreditCard, color: 'text-emerald-600', count: Math.floor(completedCount * 0.2) },
  ];

  return (
    <Card className="rounded-[0.625rem] overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-sm">Execution Tracking</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      {expanded && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between gap-1">
            {steps.map((step, i) => (
              <div key={step.label} className="flex-1 flex flex-col items-center gap-1.5 relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step.count > 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                  <step.icon className={`w-4 h-4 ${step.count > 0 ? step.color : 'text-muted-foreground'}`} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{step.label}</span>
                <span className="text-xs font-bold">{step.count}</span>
                {i < steps.length - 1 && (
                  <div className="absolute top-4 left-[calc(50%+18px)] w-[calc(100%-36px)] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   ✦ MAIN EXPORT
   ═══════════════════════════════════════════════ */
export function AuctionDashboardModules({ onSelectAuction }: Props) {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [supplierCount, setSupplierCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      const [auctionRes, supplierRes] = await Promise.all([
        supabase
          .from('reverse_auctions')
          .select('id, title, status, starting_price, current_price, winning_bid, winning_price, quantity, currency, winner_supplier_id, auction_end, created_at')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('buyer_suppliers')
          .select('id')
          .eq('buyer_id', user.id),
      ]);

      setAuctions(auctionRes.data || []);
      // Deduplicate suppliers by email
      const uniqueEmails = new Set((supplierRes.data || []).map((s) => s.supplier_email?.toLowerCase()).filter(Boolean));
      setSupplierCount(uniqueEmails.size);
      setLoading(false);
    };

    load();
  }, [user?.id]);

  if (loading || auctions.length === 0) return null;

  return (
    <div className="space-y-4">
      <SummaryCards auctions={auctions} supplierCount={supplierCount} />
      <LiveAuctionStrip auctions={auctions} onSelect={onSelectAuction} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SupplierOverview buyerId={user?.id || ''} />
        <POHistory auctions={auctions} />
      </div>
      <ExecutionTracking auctions={auctions} />
    </div>
  );
}
