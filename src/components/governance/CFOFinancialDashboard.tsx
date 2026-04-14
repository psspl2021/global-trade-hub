/**
 * CFO Financial Intelligence Dashboard (Global)
 * Multi-currency decision-grade data using base_currency normalization
 * Supports INR domestic + global currencies (USD, AED, EUR, etc.)
 * ACCESS: CFO, CEO roles only
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Building2,
  Clock,
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

/** Base currency formatting for normalized cross-currency totals — uses org setting */
let _orgBaseCurrency = 'INR';
const formatBase = (val: number) => formatCompact(val, _orgBaseCurrency);

export function CFOFinancialDashboard() {
  const [payables, setPayables] = useState<PayablesSummary | null>(null);
  const [currencyBreakdown, setCurrencyBreakdown] = useState<CurrencyBreakdown[]>([]);
  const [vendors, setVendors] = useState<VendorExposure[]>([]);
  const [delayed, setDelayed] = useState<DelayedPayment[]>([]);
  const [cashBurn, setCashBurn] = useState<CashBurnMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'normalized' | 'by-currency'>('normalized');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchServerSummary(),
        fetchDelayedPayments(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  /** Primary aggregation — server-side RPC (currency-normalized, FX-safe) */
  const fetchServerSummary = async () => {
    const { data, error } = await supabase.rpc('get_cfo_financial_summary' as any);

    if (error || !data) {
      console.error('CFO summary RPC error:', error);
      return;
    }

    const d = data as any;

    // Set org base currency from server
    const orgBase = d.org_base_currency || d.payables?.org_base_currency || 'INR';
    _orgBaseCurrency = orgBase;

    // Payables
    setPayables({
      totalPayable: d.payables?.total_payable_base || 0,
      totalPaid: d.payables?.total_paid_base || 0,
      totalOverdue: d.aging?.overdue_base || 0,
      payableNext7Days: d.aging?.due_7d_base || 0,
      payableNext30Days: d.aging?.due_30d_base || 0,
    });

    // Currency breakdown from server
    const byCurrency = (d.payables?.by_currency || []) as Array<{ currency: string; payable: number; paid: number }>;
    setCurrencyBreakdown(byCurrency.map(c => ({
      currency: c.currency,
      payable: c.payable,
      paid: c.paid,
      poCount: 0,
    })).sort((a, b) => b.payable - a.payable));

    // Cash burn (from server, FX-normalized)
    setCashBurn({
      dailyBurn: (d.burn_rate?.burn_30d || 0) / 30,
      weeklyBurn: (d.burn_rate?.burn_7d || 0),
      monthlyBurn: d.burn_rate?.burn_30d || 0,
      confirmedPayments30d: d.burn_rate?.burn_30d || 0,
      pendingPayables: d.payables?.total_payable_base || 0,
    });

    // Vendor exposure from server
    const vendorData = (d.vendor_exposure || []) as Array<{
      contract_id: string; total_exposure_base: number; po_count: number; currencies: string[];
    }>;
    setVendors(vendorData.map((v, i) => ({
      supplierId: v.contract_id || `vendor-${i}`,
      supplierName: `Contract-${(v.contract_id || '').substring(0, 8).toUpperCase()}`,
      totalPoValue: v.total_exposure_base,
      totalPaid: 0,
      openPayables: v.total_exposure_base,
      poCount: v.po_count,
      currency: v.currencies?.[0] || 'INR',
      baseCurrencyValue: v.total_exposure_base,
    })));
  };

  /** Delayed payments — server-side overdue filter using COALESCE(payment_due_date, expected_delivery_date) */
  const fetchDelayedPayments = async () => {
    const now = new Date();
    // Server-side filter: only fetch actually overdue POs
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, po_number, supplier_id, po_value, po_value_base_currency, expected_delivery_date, payment_due_date, currency, payment_workflow_status, region_type')
      .neq('payment_workflow_status', 'payment_confirmed')
      .neq('status', 'cancelled')
      .lt('payment_due_date', now.toISOString())
      .order('payment_due_date', { ascending: true })
      .limit(15);

    // Also fetch POs where payment_due_date is null but expected_delivery_date is overdue
    const { data: fallbackPos } = await supabase
      .from('purchase_orders')
      .select('id, po_number, supplier_id, po_value, po_value_base_currency, expected_delivery_date, payment_due_date, currency, payment_workflow_status, region_type')
      .neq('payment_workflow_status', 'payment_confirmed')
      .neq('status', 'cancelled')
      .is('payment_due_date', null)
      .lt('expected_delivery_date', now.toISOString())
      .order('expected_delivery_date', { ascending: true })
      .limit(10);

    const allOverdue = [...(pos || []), ...(fallbackPos || [])].slice(0, 15);

    setDelayed(allOverdue.map(po => {
      const dueDate = po.payment_due_date || po.expected_delivery_date || '';
      return {
        poId: po.id,
        poNumber: po.po_number || `PO-${po.id.substring(0, 6)}`,
        supplierName: (po as any).supplier_name || `Vendor-${(po.supplier_id || '').substring(0, 8).toUpperCase()}`,
        amount: po.po_value || 0,
        dueDate,
        daysOverdue: Math.floor((now.getTime() - new Date(dueDate).getTime()) / 86400000),
        currency: po.currency || 'INR',
        regionType: po.region_type || 'domestic',
      };
    }));
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-400" />
          <p className="text-slate-400">Loading financial intelligence...</p>
        </CardContent>
      </Card>
    );
  }

  const totalExposure = payables ? payables.totalPayable + payables.totalPaid : 0;
  const overdueRatio = payables && payables.totalPayable > 0
    ? (payables.totalOverdue / payables.totalPayable) * 100
    : 0;
  const isMultiCurrency = currencyBreakdown.length > 1;

  return (
    <div className="space-y-6">
      {/* Multi-currency indicator */}
      {isMultiCurrency && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-slate-400">
              {currencyBreakdown.length} currencies active — totals normalized to {_orgBaseCurrency} (base currency)
            </span>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
            <TabsList className="bg-slate-700 h-8">
              <TabsTrigger value="normalized" className="text-xs h-6 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300">
                Normalized
              </TabsTrigger>
              <TabsTrigger value="by-currency" className="text-xs h-6 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300">
                <Globe className="w-3 h-3 mr-1" /> By Currency
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Top-line Decision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Payable (Open)</p>
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-300">{formatBase(payables?.totalPayable || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">
              {isMultiCurrency ? `${_orgBaseCurrency}-normalized across all currencies` : 'Across all active POs'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Due in 7 Days</p>
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-300">{formatBase(payables?.payableNext7Days || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Overdue</p>
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">{formatBase(payables?.totalOverdue || 0)}</p>
            <Badge variant="outline" className={cn(
              "mt-1 text-xs",
              overdueRatio > 20 ? "border-destructive text-destructive" : "border-slate-600 text-slate-400"
            )}>
              {overdueRatio.toFixed(0)}% of payables
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">30-Day Burn</p>
              <TrendingDown className="w-5 h-5 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-sky-300">{formatBase(cashBurn?.monthlyBurn || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">
              ~{formatCurrency(cashBurn?.dailyBurn || 0, _orgBaseCurrency)}/day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currency Breakdown (shown in by-currency mode or when multi-currency) */}
      {isMultiCurrency && viewMode === 'by-currency' && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              Currency-wise Exposure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currencyBreakdown.map(cb => (
                <div key={cb.currency} className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-slate-600 text-white text-sm font-mono">
                      {CURRENCY_SYMBOLS[cb.currency] || ''} {cb.currency}
                    </Badge>
                    <span className="text-xs text-slate-400">{cb.poCount} POs</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Open</span>
                      <span className="text-amber-300 font-semibold">{formatCompact(cb.payable, cb.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Paid</span>
                      <span className="text-emerald-300 font-semibold">{formatCompact(cb.paid, cb.currency)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Burn vs Budget Outlook */}
      {cashBurn && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              Cash Burn vs Budget Outlook
              {isMultiCurrency && (
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 ml-2">
                  {_orgBaseCurrency} Normalized
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Confirmed Outflow (30d)</p>
                <p className="text-xl font-semibold text-emerald-300">{formatBase(cashBurn.confirmedPayments30d)}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                  <ArrowDownRight className="w-3 h-3" /> Already paid out
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Pending Payables</p>
                <p className="text-xl font-semibold text-amber-300">{formatBase(cashBurn.pendingPayables)}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                  <ArrowUpRight className="w-3 h-3" /> Upcoming outflow
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Weekly Burn Rate</p>
                <p className="text-xl font-semibold text-sky-300">{formatBase(cashBurn.weeklyBurn)}</p>
                <p className="text-xs text-slate-500 mt-1">Based on last 30 days</p>
              </div>
            </div>
            {cashBurn.pendingPayables > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Paid vs Payable</span>
                  <span>{((cashBurn.confirmedPayments30d / (cashBurn.confirmedPayments30d + cashBurn.pendingPayables)) * 100).toFixed(0)}%</span>
                </div>
                <Progress
                  value={(cashBurn.confirmedPayments30d / (cashBurn.confirmedPayments30d + cashBurn.pendingPayables)) * 100}
                  className="h-2 bg-slate-700"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Two-column: Vendor Exposure + Delayed Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Vendor Exposure */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Top 5 Vendor Exposure
            </CardTitle>
            <CardDescription className="text-slate-400">
              Highest open payables by supplier ({_orgBaseCurrency} normalized)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No vendor exposure data</p>
            ) : (
              <div className="space-y-3">
                {vendors.map((v, i) => {
                  const maxExposure = vendors[0]?.openPayables || 1;
                  return (
                    <div key={v.supplierId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                            #{i + 1}
                          </Badge>
                          <span className="text-sm text-slate-300 font-medium">{v.supplierName}</span>
                          <span className="text-xs text-slate-500">({v.poCount} POs)</span>
                        </div>
                        <span className="text-sm font-semibold text-amber-300">
                          {formatBase(v.openPayables)}
                        </span>
                      </div>
                      <Progress
                        value={(v.openPayables / maxExposure) * 100}
                        className="h-1.5 bg-slate-700"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delayed Payments Risk */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              Delayed Payments Risk
            </CardTitle>
            <CardDescription className="text-slate-400">
              POs past expected delivery with unpaid balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            {delayed.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No overdue payments — all clear ✓</p>
            ) : (
              <div className="space-y-2">
                {delayed.map(d => (
                  <div key={d.poId} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200">{d.poNumber}</p>
                        {d.regionType === 'global' && (
                          <Globe className="w-3 h-3 text-sky-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{d.supplierName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-300">
                        {formatCompact(d.amount, d.currency)}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          d.daysOverdue > 14 ? "border-destructive text-destructive" :
                          d.daysOverdue > 7 ? "border-amber-500 text-amber-400" :
                          "border-slate-600 text-slate-400"
                        )}
                      >
                        {d.daysOverdue}d overdue
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decision Summary */}
      <Card className="bg-gradient-to-r from-slate-800/80 to-slate-700/50 border-slate-600">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-200">
                Total Procurement Exposure: <span className="text-emerald-300">{formatBase(totalExposure)}</span>
                {isMultiCurrency && <span className="text-slate-500 text-xs ml-1">({_orgBaseCurrency} base)</span>}
              </p>
              <p className="text-xs text-slate-400">
                Paid: {formatBase(payables?.totalPaid || 0)} • Open: {formatBase(payables?.totalPayable || 0)} •
                Overdue: {formatBase(payables?.totalOverdue || 0)}
                {isMultiCurrency && ` • ${currencyBreakdown.length} currencies`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CFO Decision Engine */}
      <CFODecisionEngine />

      {/* Financial Intelligence Visualization */}
      <CFOVisualizationDashboard />
    </div>
  );
}

export default CFOFinancialDashboard;
