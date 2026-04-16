/**
 * CFO Financial Intelligence Dashboard (Global)
 * Single-RPC architecture — all data from get_cfo_decision_intelligence()
 * Frontend is render layer only
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Globe,
  IndianRupee,
  Loader2,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CFODecisionEngine } from './CFODecisionEngine';
import { CFOVisualizationDashboard } from './CFOVisualizationDashboard';

/* ── Types from consolidated RPC ── */
interface StructuredAlert {
  type: string;
  severity: string;
  metric: number;
  message: string;
}

interface ConsolidatedIntelligence {
  headline: string;
  severity: string;
  health_score: number;
  pressure_score: number;
  confidence: number;
  insights: {
    payable: { total_payable: number; payable_7d: number; overdue: number; overdue_worst_days: number };
    burn: { burn_30d: number; avg_daily_burn: number; burn_multiplier: number; clearance_days: number };
    concentration: { top_vendor: string; top_vendor_amount: number; top_vendor_share: number; total_vendors: number; concentration_risk: boolean };
  };
  trends: Array<{ metric: string; value: number; direction: string; impact: string }>;
  alerts: StructuredAlert[];
  actions: Array<{ action: string; priority: number; severity: string; description: string }>;
  meta: { company_id: string; currency: string; fx_rate: number; computed_at: string };
}

interface OpenPO {
  id: string;
  po_number: string;
  vendor_name: string;
  po_value: number;
  currency: string;
  status: string;
  payment_workflow_status: string;
  expected_delivery_date: string | null;
  order_date: string;
}

interface DelayedPayment {
  poId: string;
  poNumber: string;
  supplierName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  currency: string;
  regionType: string;
}

/* ── Formatting ── */
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: '﷼',
  JPY: '¥', CNY: '¥', SGD: 'S$', AUD: 'A$', CAD: 'C$', CHF: 'CHF',
};

let _orgBaseCurrency = 'INR';

const formatCurrency = (val: number, currency: string = 'INR') => {
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(val);
  } catch {
    return `${CURRENCY_SYMBOLS[currency] || currency} ${val.toLocaleString()}`;
  }
};

const formatCompact = (val: number, currency: string = 'INR') => {
  if (currency === 'INR') {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  } else {
    if (val >= 1000000) return `${CURRENCY_SYMBOLS[currency] || currency}${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${CURRENCY_SYMBOLS[currency] || currency}${(val / 1000).toFixed(0)}K`;
  }
  return formatCurrency(val, currency);
};

const formatBase = (val: number) => formatCompact(val, _orgBaseCurrency);

/* ── Section IDs ── */
type SectionId = 'payable' | 'due7' | 'overdue' | 'burn' | 'vendors' | 'delayed' | 'decision' | 'intelligence';

/* ── Main Component ── */
export function CFOFinancialDashboard() {
  const [intel, setIntel] = useState<ConsolidatedIntelligence | null>(null);
  const [openPOs, setOpenPOs] = useState<OpenPO[]>([]);
  const [delayed, setDelayed] = useState<DelayedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<SectionId>>(new Set());

  const toggle = (id: SectionId) => {
    setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const isOpen = (id: SectionId) => expanded.has(id);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchIntelligence(), fetchOpenPOs(), fetchDelayedPayments()]);
    } finally {
      setLoading(false);
    }
  };

  /* Single source of truth RPC */
  const fetchIntelligence = async () => {
    const { data, error } = await supabase.rpc('get_cfo_decision_intelligence' as any);
    if (error || !data) { console.error('CFO intelligence RPC error:', error); return; }
    setIntel(data as any);
  };

  /* PO list for drill-down (render only) */
  const fetchOpenPOs = async () => {
    const { data } = await supabase
      .from('purchase_orders')
      .select('id, po_number, vendor_name, po_value, currency, status, payment_workflow_status, expected_delivery_date, order_date')
      .neq('payment_workflow_status', 'payment_confirmed')
      .neq('status', 'cancelled')
      .order('order_date', { ascending: false })
      .limit(20);
    setOpenPOs((data || []).map(po => ({
      id: po.id, po_number: po.po_number, vendor_name: po.vendor_name,
      po_value: po.po_value || 0, currency: po.currency || 'INR',
      status: po.status || 'draft', payment_workflow_status: po.payment_workflow_status || 'pending',
      expected_delivery_date: (po as any).expected_delivery_date, order_date: po.order_date,
    })));
  };

  const fetchDelayedPayments = async () => {
    const now = new Date();
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, po_number, supplier_id, po_value, po_value_base_currency, effective_due_date, currency, payment_workflow_status, region_type, buyer_suppliers(supplier_name)')
      .neq('payment_workflow_status', 'payment_confirmed')
      .neq('status', 'cancelled')
      .lt('effective_due_date', now.toISOString())
      .not('effective_due_date', 'is', null)
      .order('effective_due_date', { ascending: true })
      .limit(15);
    setDelayed((pos || []).map(po => {
      const dueDate = (po as any).effective_due_date || '';
      const supplierData = (po as any).buyer_suppliers;
      return {
        poId: po.id, poNumber: po.po_number || `PO-${po.id.substring(0, 6)}`,
        supplierName: supplierData?.supplier_name || 'Unknown Supplier',
        amount: po.po_value || 0, dueDate,
        daysOverdue: Math.floor((now.getTime() - new Date(dueDate).getTime()) / 86400000),
        currency: po.currency || 'INR', regionType: (po as any).region_type || 'domestic',
      };
    }));
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Loading financial intelligence...</p>
        </CardContent>
      </Card>
    );
  }

  const s = intel ? { 
    total_payable: intel.insights?.payable?.total_payable || 0,
    payable_7d: intel.insights?.payable?.payable_7d || 0,
    overdue: intel.insights?.payable?.overdue || 0,
    overdue_worst_days: intel.insights?.payable?.overdue_worst_days || 0,
    burn_30d: intel.insights?.burn?.burn_30d || 0,
    avg_daily_burn: intel.insights?.burn?.avg_daily_burn || 0,
    clearance_days: intel.insights?.burn?.clearance_days || 0,
    burn_multiplier: intel.insights?.burn?.burn_multiplier || 0,
    top_vendor: intel.insights?.concentration?.top_vendor || '',
    top_vendor_amount: intel.insights?.concentration?.top_vendor_amount || 0,
    top_vendor_share: intel.insights?.concentration?.top_vendor_share || 0,
    total_vendors: intel.insights?.concentration?.total_vendors || 0,
  } : null;
  const ins = intel?.insights;
  const actions = (intel?.actions || []).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const topAction = actions[0];

  const severityBadge = (severity: string) => {
    const map: Record<string, { label: string; className: string }> = {
      critical: { label: '🔴 Critical', className: 'bg-destructive/10 text-destructive border-destructive/30' },
      high: { label: '🟠 High', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
      moderate: { label: '🟡 Monitor', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' },
      clear: { label: '✓ Clear', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
      normal: { label: '✓ OK', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    };
    const sv = map[severity] || map.normal;
    return <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-medium", sv.className)}>{sv.label}</Badge>;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'payment_confirmed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'payment_initiated': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  const getTrend = (metric: string) => (intel?.trends || []).find(t => t.metric === metric)?.value || 0;
  const burnTrendPct = getTrend('burn_30d_vs_prev_pct');
  const overdueTrendPct = getTrend('overdue_change_pct');
  const payableTrendPct = getTrend('payable_growth_pct');

  return (
    <div className="space-y-3">
      {/* ─── CFO Headline Banner ─── */}
      {intel?.headline && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-foreground leading-relaxed">{intel.headline}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Stacked Alerts ─── */}
      {(intel?.alerts || []).filter(Boolean).length > 0 && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-destructive mb-1">Active Signals ({intel!.alerts.length})</p>
                {intel!.alerts.map((alert: StructuredAlert, i: number) => (
                  <p key={i} className="text-[11px] text-destructive/80">• {alert.message}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Payable (Open) */}
        <Card className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('payable') && "ring-2 ring-primary/20")} onClick={() => toggle('payable')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Payable (Open)</p>
              <div className="flex items-center gap-1">
                <Wallet className="w-4 h-4 text-amber-500" />
                {isOpen('payable') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{formatBase(s?.total_payable || 0)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {severityBadge(intel?.severity || 'normal')}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{(s?.clearance_days ?? 0) > 0 ? `~${s!.clearance_days}d payable clearance` : 'Loading...'}</p>
            {(s?.clearance_days ?? 0) > 0 && (
              <p className="text-[10px] text-primary font-medium mt-0.5">= {s!.clearance_days}d at current burn</p>
            )}
          </CardContent>
        </Card>

        {/* Due in 7 Days */}
        <Card className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('due7') && "ring-2 ring-destructive/20")} onClick={() => toggle('due7')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Due in 7 Days</p>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-red-500" />
                {isOpen('due7') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-destructive">{formatBase(s?.payable_7d || 0)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {severityBadge(ins?.burn?.severity || 'normal')}
              {(ins?.burn?.multiplier ?? 0) >= 1.5 && (
                <span className="text-[9px] text-destructive font-medium">{ins!.burn.multiplier}x burn</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {(ins?.burn?.multiplier ?? 0) >= 1.5 ? `${ins!.burn.multiplier}x weekly burn — review outflow` : 'No immediate dues'}
            </p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('overdue') && "ring-2 ring-destructive/20")} onClick={() => toggle('overdue')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Overdue</p>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                {isOpen('overdue') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-destructive">{formatBase(s?.overdue || 0)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {severityBadge(s?.overdue_worst_days && s.overdue_worst_days >= 7 ? 'critical' : s?.overdue ? 'high' : 'normal')}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {(s?.overdue_worst_days ?? 0) > 0 ? `Worst: ${s!.overdue_worst_days}d overdue` : 'No overdue payments'}
            </p>
          </CardContent>
        </Card>

        {/* 30-Day Burn */}
        <Card className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('burn') && "ring-2 ring-primary/20")} onClick={() => toggle('burn')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">30-Day Burn</p>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-primary" />
                {isOpen('burn') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-primary">{formatBase(s?.burn_30d || 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">~{formatCurrency(s?.avg_daily_burn || 0, _orgBaseCurrency)}/day</p>
            {burnTrendPct !== 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                {burnTrendPct > 0 ? <TrendingUp className="w-3 h-3 text-destructive" /> : <TrendingDown className="w-3 h-3 text-emerald-500" />}
                <span className={cn("text-[10px] font-medium", burnTrendPct > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                  {burnTrendPct > 0 ? '↑' : '↓'} {Math.abs(burnTrendPct)}% vs prev week
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Expanded: Payable → PO List ─── */}
      {isOpen('payable') && (
        <Card className="bg-card border-border border-l-4 border-l-amber-500 animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" /> Open Purchase Orders
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">All active POs contributing to open payables</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {openPOs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No open POs</p>
            ) : (
              <div className="space-y-2">
                {openPOs.map(po => (
                  <div key={po.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{po.po_number}</p>
                        <Badge className={cn("text-[10px] px-1.5 py-0", statusColor(po.payment_workflow_status))}>
                          {po.payment_workflow_status?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{po.vendor_name}</p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-bold text-foreground">{formatCompact(po.po_value, po.currency)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {po.expected_delivery_date ? `Due ${new Date(po.expected_delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : po.order_date ? `Ordered ${new Date(po.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Expanded: Due 7 Days ─── */}
      {isOpen('due7') && (
        <Card className="bg-card border-border border-l-4 border-l-red-500 animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" /> Payments Due Within 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {openPOs.filter(po => {
              if (!po.expected_delivery_date) return false;
              const diff = (new Date(po.expected_delivery_date).getTime() - Date.now()) / 86400000;
              return diff >= 0 && diff <= 7;
            }).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payments due in next 7 days ✓</p>
            ) : (
              <div className="space-y-2">
                {openPOs.filter(po => {
                  if (!po.expected_delivery_date) return false;
                  const diff = (new Date(po.expected_delivery_date).getTime() - Date.now()) / 86400000;
                  return diff >= 0 && diff <= 7;
                }).map(po => (
                  <div key={po.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{po.po_number}</p>
                      <p className="text-xs text-muted-foreground">{po.vendor_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">{formatCompact(po.po_value, po.currency)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Due {new Date(po.expected_delivery_date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Expanded: Overdue ─── */}
      {isOpen('overdue') && (
        <Card className="bg-card border-border border-l-4 border-l-destructive animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {delayed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No overdue payments — all clear ✓</p>
            ) : (
              <div className="space-y-2">
                {delayed.map(d => (
                  <div key={d.poId} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{d.poNumber}</p>
                      <p className="text-xs text-muted-foreground">{d.supplierName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">{formatCompact(d.amount, d.currency)}</p>
                      <Badge variant="outline" className={cn("text-[10px]", d.daysOverdue > 14 ? "border-destructive text-destructive" : "border-amber-500 text-amber-600")}>
                        {d.daysOverdue}d overdue
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Expanded: 30-Day Burn ─── */}
      {isOpen('burn') && (
        <Card className="bg-card border-border border-l-4 border-l-primary animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" /> Cash Burn Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Confirmed Outflow (30d)</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatBase(s?.burn_30d || 0)}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <ArrowDownRight className="w-3 h-3" /> Already paid out
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pending Payables</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatBase(s?.total_payable || 0)}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <ArrowUpRight className="w-3 h-3" /> Upcoming outflow
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Weekly Burn Rate</p>
                <p className="text-lg font-bold text-primary">{formatBase(s?.burn_30d || 0)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {burnTrendPct !== 0 ? `${burnTrendPct > 0 ? '↑' : '↓'} ${Math.abs(burnTrendPct)}% vs prev week` : 'Based on last 30 days'}
                </p>
              </div>
            </div>
            {(s?.total_payable || 0) > 0 && (s?.burn_30d || 0) > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Paid vs Payable</span>
                  <span>{(((s?.burn_30d || 0) / ((s?.burn_30d || 0) + (s?.total_payable || 0))) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={((s?.burn_30d || 0) / ((s?.burn_30d || 0) + (s?.total_payable || 0))) * 100} className="h-2 bg-muted" />
              </div>
            )}
            {(s?.clearance_days ?? 0) > 0 && (
              <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-primary font-medium">
                  ⏱ Payable clearance: ~{s!.clearance_days} days at current burn rate
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Second Row: Vendor, Delayed, Exposure ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('vendors') && "ring-2 ring-purple-500/20")} onClick={() => toggle('vendors')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vendor Exposure</p>
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-purple-500" />
                {isOpen('vendors') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{s?.total_vendors || 0}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-medium",
                (s?.top_vendor_share ?? 0) >= 60 ? 'bg-destructive/10 text-destructive border-destructive/30' :
                (s?.top_vendor_share ?? 0) >= 40 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
              )}>
                {(s?.top_vendor_share ?? 0) >= 60 ? '⚠ Concentrated' : (s?.top_vendor_share ?? 0) >= 40 ? 'Moderate' : '✓ Diversified'}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {s?.top_vendor ? `${s?.top_vendor}: ${s.top_vendor_share}% exposure` : 'No vendors'}
            </p>
          </CardContent>
        </Card>

        <Card className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('delayed') && "ring-2 ring-red-500/20")} onClick={() => toggle('delayed')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Delayed Risk</p>
              <div className="flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                {isOpen('delayed') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{delayed.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {delayed.length === 0 ? 'All clear ✓' : `⚠ ${formatBase(delayed.reduce((sum, d) => sum + d.amount, 0))} at risk`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-muted/80 to-muted/50 border-border col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-4 h-4 text-emerald-500" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Exposure</p>
            </div>
            <p className="text-xl font-bold text-foreground">{formatBase(s?.total_payable || 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {s?.total_vendors || 0} vendors · {openPOs.length} open POs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Expanded: Vendors ─── */}
      {isOpen('vendors') && (
        <Card className="bg-card border-border border-l-4 border-l-purple-500 animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" /> Vendor Concentration
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Top vendor: {s?.top_vendor || 'N/A'} ({s?.top_vendor_share || 0}%)</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {s?.top_vendor ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground font-medium">{s?.top_vendor}</span>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatBase(s.top_vendor_amount)}</span>
                  </div>
                  <Progress value={s.top_vendor_share} className="h-1.5 bg-muted" />
                  <p className="text-[10px] text-muted-foreground mt-1">{s.top_vendor_share}% of total payable</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No vendor exposure data</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Expanded: Delayed ─── */}
      {isOpen('delayed') && (
        <Card className="bg-card border-border border-l-4 border-l-red-500 animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Delayed Payments Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {delayed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No overdue payments — all clear ✓</p>
            ) : (
              <div className="space-y-2">
                {delayed.map(d => (
                  <div key={d.poId} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/40 border border-border/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{d.poNumber}</p>
                        {d.regionType === 'global' && <Globe className="w-3 h-3 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{d.supplierName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCompact(d.amount, d.currency)}</p>
                      <Badge variant="outline" className={cn("text-[10px]", d.daysOverdue > 14 ? "border-destructive text-destructive" : "border-amber-500 text-amber-600")}>
                        {d.daysOverdue}d overdue
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Decision Engine & Intelligence ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('decision') && "ring-2 ring-emerald-500/20")} onClick={() => toggle('decision')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Decision Engine</p>
              <div className="flex items-center gap-1">
                <Banknote className="w-4 h-4 text-emerald-500" />
                {isOpen('decision') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            {topAction ? (
              <>
                <p className="text-sm font-semibold text-foreground">{topAction.action}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">→ {topAction.impact}</p>
                {topAction?.impact && (
                  <p className="text-[10px] text-destructive/70 mt-1 italic">⚠ If no action: {topAction?.impact}</p>
                )}
                <Badge variant="outline" className="text-[9px] mt-1 border-emerald-500/30 text-emerald-600">
                  Priority: {topAction.priority_score}/100
                </Badge>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">No urgent actions</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">All payments on track</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('intelligence') && "ring-2 ring-primary/20")} onClick={() => toggle('intelligence')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Financial Intelligence</p>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-primary" />
                {isOpen('intelligence') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-sm font-medium text-foreground">Visualization & Trends</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {openPOs.length > 0 ? `Tracking ${s?.total_vendors || 0} vendors · ${openPOs.length} open POs` : 'Burn trend, risk heatmap, feedback'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Expanded: Decision Engine (full actions list) ─── */}
      {isOpen('decision') && (
        <div className="animate-in slide-in-from-top-2 duration-200 space-y-2">
          {actions.length > 1 && (
            <Card className="bg-card border-border border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-foreground">All Actions (Priority Ranked)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {actions.map((a, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground">{a.action}</p>
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">{a.priority_score}/100</Badge>
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">→ {a.impact}</p>
                    {a?.impact && <p className="text-[10px] text-destructive/60 italic mt-0.5">⚠ {a?.impact}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <CFODecisionEngine />
        </div>
      )}

      {isOpen('intelligence') && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <CFOVisualizationDashboard />
        </div>
      )}
    </div>
  );
}

export default CFOFinancialDashboard;
