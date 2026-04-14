/**
 * CFO Financial Intelligence Dashboard
 * Decision-grade data: payables, vendor exposure, delayed payments, cash burn
 * ACCESS: CFO, CEO roles only
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Building2,
  Calendar,
  Clock,
  IndianRupee,
  Loader2,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayablesSummary {
  totalPayable: number;
  totalPaid: number;
  totalOverdue: number;
  payableNext7Days: number;
  payableNext30Days: number;
}

interface VendorExposure {
  supplierId: string;
  supplierName: string;
  totalPoValue: number;
  totalPaid: number;
  openPayables: number;
  poCount: number;
}

interface DelayedPayment {
  poId: string;
  poNumber: string;
  supplierName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  currency: string;
}

interface CashBurnMetrics {
  dailyBurn: number;
  weeklyBurn: number;
  monthlyBurn: number;
  confirmedPayments30d: number;
  pendingPayables: number;
}

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatLakh = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return formatINR(val);
};

export function CFOFinancialDashboard() {
  const [payables, setPayables] = useState<PayablesSummary | null>(null);
  const [vendors, setVendors] = useState<VendorExposure[]>([]);
  const [delayed, setDelayed] = useState<DelayedPayment[]>([]);
  const [cashBurn, setCashBurn] = useState<CashBurnMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPayablesSummary(),
        fetchVendorExposure(),
        fetchDelayedPayments(),
        fetchCashBurn(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayablesSummary = async () => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString();
    const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString();

    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, po_value, payment_workflow_status, expected_delivery_date, currency')
      .in('po_status', ['approved', 'in_transit', 'delivered', 'quality_check']);

    if (!pos) return;

    const totalPayable = pos
      .filter(p => p.payment_workflow_status !== 'payment_confirmed')
      .reduce((s, p) => s + (p.po_value || 0), 0);

    const totalPaid = pos
      .filter(p => p.payment_workflow_status === 'payment_confirmed')
      .reduce((s, p) => s + (p.po_value || 0), 0);

    const overdue = pos.filter(p => 
      p.payment_workflow_status !== 'payment_confirmed' &&
      p.expected_delivery_date &&
      new Date(p.expected_delivery_date) < now
    );
    const totalOverdue = overdue.reduce((s, p) => s + (p.po_value || 0), 0);

    const next7 = pos.filter(p =>
      p.payment_workflow_status !== 'payment_confirmed' &&
      p.expected_delivery_date &&
      new Date(p.expected_delivery_date) <= new Date(in7Days) &&
      new Date(p.expected_delivery_date) >= now
    ).reduce((s, p) => s + (p.po_value || 0), 0);

    const next30 = pos.filter(p =>
      p.payment_workflow_status !== 'payment_confirmed' &&
      p.expected_delivery_date &&
      new Date(p.expected_delivery_date) <= new Date(in30Days) &&
      new Date(p.expected_delivery_date) >= now
    ).reduce((s, p) => s + (p.po_value || 0), 0);

    setPayables({ totalPayable, totalPaid, totalOverdue, payableNext7Days: next7, payableNext30Days: next30 });
  };

  const fetchVendorExposure = async () => {
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, supplier_id, po_value, payment_workflow_status')
      .in('po_status', ['approved', 'in_transit', 'delivered', 'quality_check', 'closed']);

    if (!pos || pos.length === 0) { setVendors([]); return; }

    const supplierMap = new Map<string, VendorExposure>();
    pos.forEach(po => {
      const sid = po.supplier_id || 'unknown';
      const existing = supplierMap.get(sid) || {
        supplierId: sid,
        supplierName: `PS-${sid.substring(0, 6).toUpperCase()}`,
        totalPoValue: 0,
        totalPaid: 0,
        openPayables: 0,
        poCount: 0,
      };
      existing.totalPoValue += po.po_value || 0;
      existing.poCount += 1;
      if (po.payment_workflow_status === 'payment_confirmed') {
        existing.totalPaid += po.po_value || 0;
      } else {
        existing.openPayables += po.po_value || 0;
      }
      supplierMap.set(sid, existing);
    });

    const sorted = Array.from(supplierMap.values())
      .sort((a, b) => b.openPayables - a.openPayables)
      .slice(0, 5);
    setVendors(sorted);
  };

  const fetchDelayedPayments = async () => {
    const now = new Date();
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, po_number, supplier_id, po_value, expected_delivery_date, currency, payment_workflow_status')
      .neq('payment_workflow_status', 'payment_confirmed')
      .not('expected_delivery_date', 'is', null)
      .lt('expected_delivery_date', now.toISOString())
      .order('expected_delivery_date', { ascending: true })
      .limit(10);

    if (!pos) { setDelayed([]); return; }

    setDelayed(pos.map(po => ({
      poId: po.id,
      poNumber: po.po_number || `PO-${po.id.substring(0, 6)}`,
      supplierName: `PS-${(po.supplier_id || '').substring(0, 6).toUpperCase()}`,
      amount: po.po_value || 0,
      dueDate: po.expected_delivery_date || '',
      daysOverdue: Math.floor((now.getTime() - new Date(po.expected_delivery_date!).getTime()) / 86400000),
      currency: po.currency || 'INR',
    })));
  };

  const fetchCashBurn = async () => {
    const now = new Date();
    const d30Ago = new Date(now.getTime() - 30 * 86400000).toISOString();

    const { data: logs } = await supabase
      .from('po_payment_audit_logs')
      .select('amount, created_at')
      .eq('to_status', 'payment_confirmed')
      .gte('created_at', d30Ago);

    const total30d = logs?.reduce((s, l) => s + (l.amount || 0), 0) || 0;

    const { data: pendingPos } = await supabase
      .from('purchase_orders')
      .select('po_value, payment_workflow_status')
      .neq('payment_workflow_status', 'payment_confirmed')
      .in('po_status', ['approved', 'in_transit', 'delivered', 'quality_check']);

    const pending = pendingPos?.reduce((s, p) => s + (p.po_value || 0), 0) || 0;

    setCashBurn({
      dailyBurn: total30d / 30,
      weeklyBurn: total30d / 4.3,
      monthlyBurn: total30d,
      confirmedPayments30d: total30d,
      pendingPayables: pending,
    });
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

  return (
    <div className="space-y-6">
      {/* Top-line Decision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Payable (Open)</p>
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-300">{formatLakh(payables?.totalPayable || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">Across all active POs</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Due in 7 Days</p>
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-300">{formatLakh(payables?.payableNext7Days || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Overdue</p>
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">{formatLakh(payables?.totalOverdue || 0)}</p>
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
            <p className="text-2xl font-bold text-sky-300">{formatLakh(cashBurn?.monthlyBurn || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">
              ~{formatINR(cashBurn?.dailyBurn || 0)}/day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Burn vs Pending Payables */}
      {cashBurn && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              Cash Burn vs Budget Outlook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Confirmed Outflow (30d)</p>
                <p className="text-xl font-semibold text-emerald-300">{formatLakh(cashBurn.confirmedPayments30d)}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                  <ArrowDownRight className="w-3 h-3" /> Already paid out
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Pending Payables</p>
                <p className="text-xl font-semibold text-amber-300">{formatLakh(cashBurn.pendingPayables)}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                  <ArrowUpRight className="w-3 h-3" /> Upcoming outflow
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Weekly Burn Rate</p>
                <p className="text-xl font-semibold text-sky-300">{formatLakh(cashBurn.weeklyBurn)}</p>
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
              Highest open payables by supplier
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
                          {formatLakh(v.openPayables)}
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
                      <p className="text-sm font-medium text-slate-200">{d.poNumber}</p>
                      <p className="text-xs text-slate-500">{d.supplierName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-300">{formatLakh(d.amount)}</p>
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
                Total Procurement Exposure: <span className="text-emerald-300">{formatLakh(totalExposure)}</span>
              </p>
              <p className="text-xs text-slate-400">
                Paid: {formatLakh(payables?.totalPaid || 0)} • Open: {formatLakh(payables?.totalPayable || 0)} • 
                Overdue: {formatLakh(payables?.totalOverdue || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CFOFinancialDashboard;
