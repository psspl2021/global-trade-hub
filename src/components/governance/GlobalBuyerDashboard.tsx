/**
 * ============================================================
 * GLOBAL BUYER DASHBOARD
 * ============================================================
 * 
 * Unified procurement analytics dashboard for global buyers.
 * Region-adaptive: multi-currency, Incoterms, compliance fields.
 * 
 * Features:
 * - Procurement KPIs (region-formatted)
 * - PO Tracking with payment_due_date
 * - Financial Overview (CFO Decision Engine)
 * - Compliance Status (Incoterms, export docs)
 * - Supplier Priority Management
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Loader2,
  Package,
  Shield,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface POSummary {
  total: number;
  active: number;
  delivered: number;
  overdue: number;
  totalValue: number;
  totalPaid: number;
  totalPending: number;
}

interface ActivePO {
  id: string;
  po_number: string;
  supplier_id: string;
  po_value: number;
  currency: string;
  status: string;
  current_step: string;
  expected_delivery_date: string | null;
  payment_due_date: string | null;
  payment_workflow_status: string;
  region_type: string;
  incoterm: string | null;
  days_until_due: number | null;
  is_overdue: boolean;
}

interface ComplianceMetric {
  label: string;
  value: string | number;
  status: 'ok' | 'warning' | 'error';
}

export function GlobalBuyerDashboard() {
  const ctx = useGlobalBuyerContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [poSummary, setPoSummary] = useState<POSummary | null>(null);
  const [activePOs, setActivePOs] = useState<ActivePO[]>([]);
  const [compliance, setCompliance] = useState<ComplianceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ctx.isLoading && ctx.companyId) {
      fetchDashboardData();
    }
  }, [ctx.isLoading, ctx.companyId]);

  const fetchDashboardData = async () => {
    if (!ctx.companyId) return;
    setLoading(true);

    try {
      await Promise.all([
        fetchPOSummary(),
        fetchActivePOs(),
        buildComplianceMetrics(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPOSummary = async () => {
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, po_value, po_value_base_currency, status, current_step, payment_workflow_status, expected_delivery_date, payment_due_date')
      .eq('company_id', ctx.companyId!);

    if (!pos) { setPoSummary(null); return; }

    const now = new Date();
    const summary: POSummary = {
      total: pos.length,
      active: pos.filter(p => !['delivered', 'cancelled', 'closed'].includes(p.status || '')).length,
      delivered: pos.filter(p => p.status === 'delivered').length,
      overdue: pos.filter(p => {
        const dueDate = p.payment_due_date || p.expected_delivery_date;
        return dueDate && new Date(dueDate) < now && p.payment_workflow_status !== 'payment_confirmed';
      }).length,
      totalValue: pos.reduce((s, p) => s + (p.po_value_base_currency || p.po_value || 0), 0),
      totalPaid: pos.filter(p => p.payment_workflow_status === 'payment_confirmed')
        .reduce((s, p) => s + (p.po_value_base_currency || p.po_value || 0), 0),
      totalPending: pos.filter(p => p.payment_workflow_status !== 'payment_confirmed')
        .reduce((s, p) => s + (p.po_value_base_currency || p.po_value || 0), 0),
    };
    setPoSummary(summary);
  };

  const fetchActivePOs = async () => {
    const now = new Date();
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, po_number, supplier_id, po_value, currency, status, current_step, expected_delivery_date, payment_due_date, payment_workflow_status, region_type, incoterm')
      .eq('company_id', ctx.companyId!)
      .not('status', 'in', '("cancelled","closed")')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!pos) { setActivePOs([]); return; }

    setActivePOs(pos.map(po => {
      const dueDate = po.payment_due_date || po.expected_delivery_date;
      const dueMs = dueDate ? new Date(dueDate).getTime() : null;
      const daysUntil = dueMs ? Math.ceil((dueMs - now.getTime()) / 86400000) : null;
      return {
        ...po,
        days_until_due: daysUntil,
        is_overdue: daysUntil !== null && daysUntil < 0 && po.payment_workflow_status !== 'payment_confirmed',
      };
    }));
  };

  const buildComplianceMetrics = async () => {
    const metrics: ComplianceMetric[] = [];

    if (ctx.complianceFields.requiresIncoterms) {
      const { count: missingIncoterms } = await supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', ctx.companyId!)
        .eq('region_type', 'international')
        .is('incoterm', null);

      metrics.push({
        label: 'Incoterms Coverage',
        value: missingIncoterms === 0 ? '100%' : `${missingIncoterms} POs missing`,
        status: missingIncoterms === 0 ? 'ok' : 'warning',
      });
    }

    // Tax compliance
    metrics.push({
      label: `${ctx.complianceFields.taxType} Status`,
      value: ctx.gstin ? 'Registered' : 'Not Registered',
      status: ctx.gstin ? 'ok' : 'error',
    });

    // ERP sync
    metrics.push({
      label: 'ERP Sync Policy',
      value: ctx.erpSyncPolicy === 'auto' ? 'Auto-sync' : 'Manual',
      status: ctx.erpSyncPolicy === 'auto' ? 'ok' : 'warning',
    });

    setCompliance(metrics);
  };

  if (ctx.isLoading || loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-400" />
          <p className="text-slate-400">Loading global procurement dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  const completionRate = poSummary && poSummary.total > 0
    ? Math.round((poSummary.delivered / poSummary.total) * 100)
    : 0;

  const paymentRate = poSummary && poSummary.totalValue > 0
    ? Math.round((poSummary.totalPaid / poSummary.totalValue) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Region Context Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-600/20 to-blue-600/20 border border-sky-500/30">
            <Globe className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {ctx.companyName || 'Procurement Dashboard'}
            </h2>
            <p className="text-xs text-slate-400">
              {ctx.isGlobal ? 'Global procurement' : 'Domestic procurement'} • {ctx.baseCurrency} base
              {ctx.country && ` • ${ctx.country}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs border-sky-700 text-sky-400 gap-1">
            <Globe className="w-3 h-3" />
            {ctx.baseCurrency}
          </Badge>
          {ctx.isGlobal && (
            <Badge variant="outline" className="text-xs border-amber-700 text-amber-400 gap-1">
              <Shield className="w-3 h-3" />
              Incoterms Required
            </Badge>
          )}
          {ctx.memberRole && (
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
              {ctx.memberRole.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Total POs</p>
              <Package className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-white">{poSummary?.total || 0}</p>
            <p className="text-xs text-slate-500">{poSummary?.active || 0} active</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Open Payables</p>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-300">
              {ctx.formatAmount(poSummary?.totalPending || 0)}
            </p>
            <p className="text-xs text-slate-500">{ctx.baseCurrency} normalized</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Overdue</p>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className={cn("text-2xl font-bold", (poSummary?.overdue || 0) > 0 ? "text-red-400" : "text-emerald-400")}>
              {poSummary?.overdue || 0}
            </p>
            <p className="text-xs text-slate-500">payment due date passed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Completion</p>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-300">{completionRate}%</p>
            <Progress value={completionRate} className="h-1.5 mt-2 bg-slate-700" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300">
            <FileText className="w-4 h-4 mr-2" />
            PO Tracking
          </TabsTrigger>
          {ctx.isGlobal && (
            <TabsTrigger value="compliance" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Compliance
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Progress */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  Payment Progress
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  {ctx.baseCurrency} normalized across all POs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Paid</span>
                  <span className="text-sm font-semibold text-emerald-300">
                    {ctx.formatAmount(poSummary?.totalPaid || 0)}
                  </span>
                </div>
                <Progress value={paymentRate} className="h-2 bg-slate-700" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Pending</span>
                  <span className="text-sm font-semibold text-amber-300">
                    {ctx.formatAmount(poSummary?.totalPending || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between">
                  <span className="text-xs text-slate-500">Total Value</span>
                  <span className="text-sm font-bold text-white">
                    {ctx.formatAmount(poSummary?.totalValue || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Procurement Health */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-sky-400" />
                  Procurement Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                    <p className="text-xs text-slate-400 mb-1">Delivered</p>
                    <p className="text-xl font-bold text-emerald-300">{poSummary?.delivered || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/40">
                    <p className="text-xs text-slate-400 mb-1">In Transit</p>
                    <p className="text-xl font-bold text-sky-300">{poSummary?.active || 0}</p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg border",
                    (poSummary?.overdue || 0) > 0
                      ? "bg-red-950/30 border-red-800/40"
                      : "bg-slate-800/50 border-slate-700"
                  )}>
                    <p className="text-xs text-slate-400 mb-1">Overdue</p>
                    <p className={cn(
                      "text-xl font-bold",
                      (poSummary?.overdue || 0) > 0 ? "text-red-400" : "text-slate-500"
                    )}>
                      {poSummary?.overdue || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Payment Rate</p>
                    <p className="text-xl font-bold text-white">{paymentRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PO Tracking Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                Active Purchase Orders
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Payment due dates shown (not delivery dates) for financial tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activePOs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No active purchase orders</p>
              ) : (
                <div className="space-y-2">
                  {activePOs.map((po) => (
                    <div key={po.id} className={cn(
                      "p-3 rounded-lg border flex items-center justify-between gap-3",
                      po.is_overdue
                        ? "bg-red-950/20 border-red-800/40"
                        : "bg-slate-700/30 border-slate-600/50"
                    )}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          po.is_overdue ? "bg-red-400" :
                          po.payment_workflow_status === 'payment_confirmed' ? "bg-emerald-400" :
                          "bg-amber-400"
                        )} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-mono text-slate-200">
                              {po.po_number || `PO-${po.id.substring(0, 6)}`}
                            </span>
                            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                              {po.current_step || po.status}
                            </Badge>
                            {po.region_type === 'international' && po.incoterm && (
                              <Badge variant="outline" className="text-[10px] border-sky-700 text-sky-400">
                                {po.incoterm}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>PS-{(po.supplier_id || '').substring(0, 6).toUpperCase()}</span>
                            {po.days_until_due !== null && (
                              <span className={cn(
                                po.is_overdue ? "text-red-400" :
                                po.days_until_due <= 7 ? "text-amber-400" : "text-slate-400"
                              )}>
                                {po.is_overdue 
                                  ? `${Math.abs(po.days_until_due)}d overdue`
                                  : `Due in ${po.days_until_due}d`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-white">
                          {ctx.formatAmount(po.po_value, po.currency)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {po.payment_workflow_status === 'payment_confirmed' ? '✓ Paid' : po.payment_workflow_status?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab (Global only) */}
        {ctx.isGlobal && (
          <TabsContent value="compliance" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Trade Compliance Status
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Region-specific compliance requirements for {ctx.country || 'your region'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {compliance.map((metric, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                      <div className="flex items-center gap-3">
                        {metric.status === 'ok' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : metric.status === 'warning' ? (
                          <Clock className="w-4 h-4 text-amber-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-sm text-slate-300">{metric.label}</span>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        metric.status === 'ok' ? "border-emerald-700 text-emerald-400" :
                        metric.status === 'warning' ? "border-amber-700 text-amber-400" :
                        "border-red-700 text-red-400"
                      )}>
                        {metric.value}
                      </Badge>
                    </div>
                  ))}

                  {/* Compliance Requirements */}
                  <div className="mt-4 p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">
                      Required for {ctx.regionType} trade
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {ctx.complianceFields.requiresIncoterms ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-slate-600 inline-block" />
                        )}
                        <span className="text-slate-400">Incoterms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ctx.complianceFields.requiresHSCode ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-slate-600 inline-block" />
                        )}
                        <span className="text-slate-400">HS Code</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ctx.complianceFields.requiresExportDocs ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-slate-600 inline-block" />
                        )}
                        <span className="text-slate-400">Export Docs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-400">{ctx.complianceFields.taxType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default GlobalBuyerDashboard;
