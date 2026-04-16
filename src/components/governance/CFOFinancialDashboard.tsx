/**
 * CFO Financial Intelligence Dashboard (Global)
 * Executive-style expandable cards — click to expand inline
 * Multi-currency decision-grade data using base_currency normalization
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
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CFODecisionEngine } from './CFODecisionEngine';
import { CFOVisualizationDashboard } from './CFOVisualizationDashboard';

/* ── Interfaces ── */
interface PayablesSummary {
  totalPayable: number;
  totalPaid: number;
  totalOverdue: number;
  payableNext7Days: number;
  payableNext30Days: number;
}

interface CurrencyBreakdown {
  currency: string;
  payable: number;
  paid: number;
  poCount: number;
}

interface VendorExposure {
  supplierId: string;
  supplierName: string;
  totalPoValue: number;
  totalPaid: number;
  openPayables: number;
  poCount: number;
  currency: string;
  baseCurrencyValue: number;
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

interface CashBurnMetrics {
  dailyBurn: number;
  weeklyBurn: number;
  monthlyBurn: number;
  confirmedPayments30d: number;
  pendingPayables: number;
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

/* ── Formatting ── */
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: '﷼',
  JPY: '¥', CNY: '¥', SGD: 'S$', AUD: 'A$', CAD: 'C$', CHF: 'CHF',
};

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

let _orgBaseCurrency = 'INR';
const formatBase = (val: number) => formatCompact(val, _orgBaseCurrency);

/* ── Expandable Section Type ── */
type SectionId = 'payable' | 'due7' | 'overdue' | 'burn' | 'cashburn' | 'vendors' | 'delayed' | 'decision' | 'intelligence';

/* ── Main Component ── */
export function CFOFinancialDashboard() {
  const [payables, setPayables] = useState<PayablesSummary | null>(null);
  const [currencyBreakdown, setCurrencyBreakdown] = useState<CurrencyBreakdown[]>([]);
  const [vendors, setVendors] = useState<VendorExposure[]>([]);
  const [delayed, setDelayed] = useState<DelayedPayment[]>([]);
  const [cashBurn, setCashBurn] = useState<CashBurnMetrics | null>(null);
  const [openPOs, setOpenPOs] = useState<OpenPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<SectionId>>(new Set());

  const toggle = (id: SectionId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const isOpen = (id: SectionId) => expanded.has(id);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchServerSummary(),
        fetchDelayedPayments(),
        fetchOpenPOs(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerSummary = async () => {
    const { data, error } = await supabase.rpc('get_cfo_financial_summary' as any);
    if (error || !data) { console.error('CFO summary RPC error:', error); return; }
    const d = data as any;
    const orgBase = d.org_base_currency || d.payables?.org_base_currency || 'INR';
    _orgBaseCurrency = orgBase;
    setPayables({
      totalPayable: d.payables?.total_payable_base || 0,
      totalPaid: d.payables?.total_paid_base || 0,
      totalOverdue: d.aging?.overdue_base || 0,
      payableNext7Days: d.aging?.due_7d_base || 0,
      payableNext30Days: d.aging?.due_30d_base || 0,
    });
    const byCurrency = (d.payables?.by_currency || []) as Array<{ currency: string; payable: number; paid: number }>;
    setCurrencyBreakdown(byCurrency.map(c => ({ currency: c.currency, payable: c.payable, paid: c.paid, poCount: 0 })).sort((a, b) => b.payable - a.payable));
    setCashBurn({
      dailyBurn: (d.burn_rate?.burn_30d || 0) / 30,
      weeklyBurn: d.burn_rate?.burn_7d || 0,
      monthlyBurn: d.burn_rate?.burn_30d || 0,
      confirmedPayments30d: d.burn_rate?.burn_30d || 0,
      pendingPayables: d.payables?.total_payable_base || 0,
    });
    const vendorData = (d.vendor_exposure || []) as Array<{ contract_id: string; total_exposure_base: number; po_count: number; currencies: string[] }>;
    setVendors(vendorData.map((v, i) => ({
      supplierId: v.contract_id || `vendor-${i}`,
      supplierName: (v as any).supplier_name || `Contract-${(v.contract_id || '').substring(0, 8).toUpperCase()}`,
      totalPoValue: v.total_exposure_base, totalPaid: 0, openPayables: v.total_exposure_base,
      poCount: v.po_count, currency: v.currencies?.[0] || 'INR', baseCurrencyValue: v.total_exposure_base,
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

  const fetchOpenPOs = async () => {
    const { data } = await supabase
      .from('purchase_orders')
      .select('id, po_number, vendor_name, po_value, currency, status, payment_workflow_status, expected_delivery_date, order_date')
      .neq('payment_workflow_status', 'payment_confirmed')
      .neq('status', 'cancelled')
      .order('order_date', { ascending: false })
      .limit(20);
    setOpenPOs((data || []).map(po => ({
      id: po.id,
      po_number: po.po_number,
      vendor_name: po.vendor_name,
      po_value: po.po_value || 0,
      currency: po.currency || 'INR',
      status: po.status || 'draft',
      payment_workflow_status: po.payment_workflow_status || 'pending',
      expected_delivery_date: (po as any).expected_delivery_date,
      order_date: po.order_date,
    })));
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

  const totalExposure = payables ? payables.totalPayable + payables.totalPaid : 0;
  const overdueRatio = payables && payables.totalPayable > 0 ? (payables.totalOverdue / payables.totalPayable) * 100 : 0;

  // ── Centralized Insight Engine ──
  const topVendor = vendors.length > 0 ? vendors[0] : null;
  const topVendorShare = topVendor && payables && payables.totalPayable > 0
    ? Math.round((topVendor.openPayables / payables.totalPayable) * 100) : 0;

  const due7POs = openPOs.filter(po => {
    if (!po.expected_delivery_date) return false;
    const diff = (new Date(po.expected_delivery_date).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  });
  const due7VendorCount = new Set(due7POs.map(p => p.vendor_name)).size;
  const due7Total = due7POs.reduce((s, po) => s + po.po_value, 0);

  const worstOverdue = delayed.length > 0 ? delayed.reduce((a, b) => a.daysOverdue > b.daysOverdue ? a : b) : null;
  const overdueVendorCount = new Set(delayed.map(d => d.supplierName)).size;
  const overdueTotal = delayed.reduce((s, d) => s + d.amount, 0);

  const avgDailyBurn = cashBurn?.dailyBurn || 0;
  const burnMultiplier = avgDailyBurn > 0 && due7Total > 0 ? +(due7Total / (avgDailyBurn * 7)).toFixed(1) : 0;

  const insights = {
    payable: {
      concentrationRisk: topVendorShare >= 60,
      topVendorShare,
      vendorCount: new Set(openPOs.map(p => p.vendor_name)).size,
      severity: topVendorShare >= 80 ? 'critical' as const : topVendorShare >= 60 ? 'high' as const : 'normal' as const,
    },
    due7: {
      burnMultiplier,
      severity: burnMultiplier >= 2 ? 'critical' as const : burnMultiplier >= 1.5 ? 'high' as const : due7POs.length > 0 ? 'moderate' as const : 'clear' as const,
      total: due7Total,
    },
    overdue: {
      severity: (worstOverdue?.daysOverdue || 0) > 14 ? 'critical' as const : (worstOverdue?.daysOverdue || 0) > 7 ? 'high' as const : delayed.length > 0 ? 'moderate' as const : 'clear' as const,
      worstDays: worstOverdue?.daysOverdue || 0,
      total: overdueTotal,
    },
    decision: {
      topAction: delayed.length > 0
        ? { action: `Clear ${formatBase(delayed[0].amount)} to ${delayed[0].supplierName.substring(0, 15)}`, impact: `Reduce overdue by ${Math.round((delayed[0].amount / (overdueTotal || 1)) * 100)}%` }
        : due7Total > 0
          ? { action: `Prepare ${formatBase(due7Total)} for 7d outflow`, impact: `${due7POs.length} POs due this week` }
          : cashBurn && cashBurn.pendingPayables > 0
            ? { action: `Review ${formatBase(cashBurn.pendingPayables)} pending`, impact: 'Optimize payment timing' }
            : { action: 'No urgent actions', impact: 'All payments on track' },
    },
    vendor: {
      concentrationPct: topVendorShare,
      riskLevel: topVendorShare >= 70 ? 'high' as const : topVendorShare >= 40 ? 'moderate' as const : 'diversified' as const,
    },
  };

  const severityBadge = (severity: 'critical' | 'high' | 'moderate' | 'clear' | 'normal') => {
    const map = {
      critical: { label: '🔴 Critical', className: 'bg-destructive/10 text-destructive border-destructive/30' },
      high: { label: '🟠 High', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
      moderate: { label: '🟡 Monitor', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' },
      clear: { label: '✓ Clear', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
      normal: { label: '✓ OK', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    };
    const s = map[severity];
    return <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-medium", s.className)}>{s.label}</Badge>;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'payment_confirmed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'payment_initiated': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-3">
      {/* ─── KPI Summary Cards (always visible, clickable) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Payable (Open) */}
        <Card
          className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('payable') && "ring-2 ring-primary/20")}
          onClick={() => toggle('payable')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Payable (Open)</p>
              <div className="flex items-center gap-1">
                <Wallet className="w-4 h-4 text-amber-500" />
                {isOpen('payable') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{formatBase(payables?.totalPayable || 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {openPOs.length} POs{topVendor ? ` · ${topVendorShare}% from ${topVendor.supplierName.substring(0, 20)}` : ''}
            </p>
          </CardContent>
        </Card>

        {/* Due in 7 Days */}
        <Card
          className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('due7') && "ring-2 ring-destructive/20")}
          onClick={() => toggle('due7')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Due in 7 Days</p>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-red-500" />
                {isOpen('due7') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-destructive">{formatBase(payables?.payableNext7Days || 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {due7POs.length > 0 ? `${due7POs.length} POs · ${due7VendorCount} vendor${due7VendorCount !== 1 ? 's' : ''}` : 'No immediate dues ✓'}
            </p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card
          className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('overdue') && "ring-2 ring-destructive/20")}
          onClick={() => toggle('overdue')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Overdue</p>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                {isOpen('overdue') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-destructive">{formatBase(payables?.totalOverdue || 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {delayed.length > 0
                ? `↑ ${overdueVendorCount} vendor${overdueVendorCount !== 1 ? 's' : ''} · worst ${worstOverdue?.daysOverdue}d late`
                : 'All clear ✓'}
            </p>
          </CardContent>
        </Card>

        {/* 30-Day Burn */}
        <Card
          className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('burn') && "ring-2 ring-primary/20")}
          onClick={() => toggle('burn')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">30-Day Burn</p>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-primary" />
                {isOpen('burn') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-primary">{formatBase(cashBurn?.monthlyBurn || 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">~{formatCurrency(cashBurn?.dailyBurn || 0, _orgBaseCurrency)}/day</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Expanded: Payable → PO List ─── */}
      {isOpen('payable') && (
        <Card className="bg-card border-border border-l-4 border-l-amber-500 animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Open Purchase Orders
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              All active POs contributing to open payables
            </CardDescription>
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
              <Clock className="w-4 h-4 text-red-500" />
              Payments Due Within 7 Days
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
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Overdue Payments
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

      {/* ─── Expanded: 30-Day Burn Details ─── */}
      {isOpen('burn') && (
        <Card className="bg-card border-border border-l-4 border-l-primary animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" />
              Cash Burn Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Confirmed Outflow (30d)</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatBase(cashBurn?.confirmedPayments30d || 0)}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <ArrowDownRight className="w-3 h-3" /> Already paid out
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pending Payables</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatBase(cashBurn?.pendingPayables || 0)}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <ArrowUpRight className="w-3 h-3" /> Upcoming outflow
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Weekly Burn Rate</p>
                <p className="text-lg font-bold text-primary">{formatBase(cashBurn?.weeklyBurn || 0)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Based on last 30 days</p>
              </div>
            </div>
            {cashBurn && cashBurn.pendingPayables > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Paid vs Payable</span>
                  <span>{((cashBurn.confirmedPayments30d / (cashBurn.confirmedPayments30d + cashBurn.pendingPayables)) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(cashBurn.confirmedPayments30d / (cashBurn.confirmedPayments30d + cashBurn.pendingPayables)) * 100} className="h-2 bg-muted" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Second Row: Section Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Vendor Exposure */}
        <Card
          className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('vendors') && "ring-2 ring-purple-500/20")}
          onClick={() => toggle('vendors')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vendor Exposure</p>
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-purple-500" />
                {isOpen('vendors') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{vendors.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {topVendor ? `Top: ${topVendor.supplierName.substring(0, 18)} (${formatBase(topVendor.openPayables)})` : 'No vendors'}
            </p>
          </CardContent>
        </Card>

        {/* Delayed Payments */}
        <Card
          className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('delayed') && "ring-2 ring-red-500/20")}
          onClick={() => toggle('delayed')}
        >
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
              {delayed.length === 0 ? 'All clear ✓' : `⚠ ${formatBase(delayed.reduce((s, d) => s + d.amount, 0))} at risk`}
            </p>
          </CardContent>
        </Card>

        {/* Total Exposure */}
        <Card className="bg-gradient-to-r from-muted/80 to-muted/50 border-border col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-4 h-4 text-emerald-500" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Exposure</p>
            </div>
            <p className="text-xl font-bold text-foreground">{formatBase(totalExposure)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Paid: {formatBase(payables?.totalPaid || 0)} • Open: {formatBase(payables?.totalPayable || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Expanded: Vendor Exposure ─── */}
      {isOpen('vendors') && (
        <Card className="bg-card border-border border-l-4 border-l-purple-500 animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              Top 5 Vendor Exposure
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Highest open payables by supplier ({_orgBaseCurrency} normalized)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No vendor exposure data</p>
            ) : (
              <div className="space-y-3">
                {vendors.map((v, i) => {
                  const maxExposure = vendors[0]?.openPayables || 1;
                  return (
                    <div key={v.supplierId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-muted text-muted-foreground text-xs">#{i + 1}</Badge>
                          <span className="text-sm text-foreground font-medium">{v.supplierName}</span>
                          <span className="text-[10px] text-muted-foreground">({v.poCount} POs)</span>
                        </div>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatBase(v.openPayables)}</span>
                      </div>
                      <Progress value={(v.openPayables / maxExposure) * 100} className="h-1.5 bg-muted" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Expanded: Delayed Payments Risk ─── */}
      {isOpen('delayed') && (
        <Card className="bg-card border-border border-l-4 border-l-red-500 animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Delayed Payments Risk
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">POs past expected delivery with unpaid balances</CardDescription>
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

      {/* ─── Third Row: Decision Engine & Intelligence Cards ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card
          className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('decision') && "ring-2 ring-emerald-500/20")}
          onClick={() => toggle('decision')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Decision Engine</p>
              <div className="flex items-center gap-1">
                <Banknote className="w-4 h-4 text-emerald-500" />
                {isOpen('decision') ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <p className="text-sm font-medium text-foreground">Predictive cash intelligence</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {delayed.length > 0
                ? `Top action: Clear ${formatBase(delayed[0]?.amount || 0)} overdue to ${delayed[0]?.supplierName?.substring(0, 15)}`
                : cashBurn && cashBurn.pendingPayables > 0
                  ? `${formatBase(cashBurn.pendingPayables)} pending — review priority`
                  : 'Runway, priority queue, actions'}
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn("bg-card border-border cursor-pointer transition-all hover:shadow-md", isOpen('intelligence') && "ring-2 ring-primary/20")}
          onClick={() => toggle('intelligence')}
        >
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
              {vendors.length > 0 ? `Tracking ${vendors.length} vendor${vendors.length !== 1 ? 's' : ''} · ${openPOs.length} open POs` : 'Burn trend, risk heatmap, feedback'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Expanded: Decision Engine ─── */}
      {isOpen('decision') && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <CFODecisionEngine />
        </div>
      )}

      {/* ─── Expanded: Financial Intelligence ─── */}
      {isOpen('intelligence') && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <CFOVisualizationDashboard />
        </div>
      )}
    </div>
  );
}

export default CFOFinancialDashboard;
