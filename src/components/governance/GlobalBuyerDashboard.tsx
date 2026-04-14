/**
 * ============================================================
 * GLOBAL BUYER DASHBOARD
 * ============================================================
 * 
 * Unified procurement analytics dashboard for global buyers.
 * Region-adaptive: multi-currency, Incoterms, compliance fields.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  BarChart3,
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
  po_status: string | null;
  expected_delivery_date: string | null;
  payment_due_date: string | null;
  payment_workflow_status: string | null;
  region_type: string | null;
  incoterms: string | null;
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [poSummary, setPoSummary] = useState<POSummary | null>(null);
  const [activePOs, setActivePOs] = useState<ActivePO[]>([]);
  const [compliance, setCompliance] = useState<ComplianceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ctx.isLoading && user?.id) {
      fetchDashboardData();
    }
  }, [ctx.isLoading, user?.id]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
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
      .select('id, po_value, po_value_base_currency, status, po_status, payment_workflow_status, expected_delivery_date, payment_due_date')
      .eq('created_by', user!.id) as any;

    if (!pos || !Array.isArray(pos)) { setPoSummary(null); return; }

    const now = new Date();
    const summary: POSummary = {
      total: pos.length,
      active: pos.filter((p: any) => p.status !== 'delivered' && p.status !== 'cancelled').length,
      delivered: pos.filter((p: any) => p.status === 'delivered').length,
      overdue: pos.filter((p: any) => {
        const dueDate = p.payment_due_date || p.expected_delivery_date;
        return dueDate && new Date(dueDate) < now && p.payment_workflow_status !== 'payment_confirmed';
      }).length,
      totalValue: pos.reduce((s: number, p: any) => s + (p.po_value_base_currency || p.po_value || 0), 0),
      totalPaid: pos.filter((p: any) => p.payment_workflow_status === 'payment_confirmed')
        .reduce((s: number, p: any) => s + (p.po_value_base_currency || p.po_value || 0), 0),
      totalPending: pos.filter((p: any) => p.payment_workflow_status !== 'payment_confirmed')
        .reduce((s: number, p: any) => s + (p.po_value_base_currency || p.po_value || 0), 0),
    };
    setPoSummary(summary);
  };

  const fetchActivePOs = async () => {
    const now = new Date();
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, po_number, supplier_id, po_value, currency, status, po_status, expected_delivery_date, payment_due_date, payment_workflow_status, region_type, incoterms')
      .eq('created_by', user!.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(20) as any;

    if (!pos || !Array.isArray(pos)) { setActivePOs([]); return; }

    setActivePOs(pos.map((po: any) => {
      const dueDate = po.payment_due_date || po.expected_delivery_date;
      const dueMs = dueDate ? new Date(dueDate).getTime() : null;
      const daysUntil = dueMs ? Math.ceil((dueMs - now.getTime()) / 86400000) : null;
      return {
        id: po.id,
        po_number: po.po_number,
        supplier_id: po.supplier_id,
        po_value: po.po_value || 0,
        currency: po.currency || ctx.baseCurrency,
        status: po.status,
        po_status: po.po_status,
        expected_delivery_date: po.expected_delivery_date,
        payment_due_date: po.payment_due_date,
        payment_workflow_status: po.payment_workflow_status,
        region_type: po.region_type,
        incoterms: po.incoterms,
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
        .eq('created_by', user!.id)
        .eq('region_type', 'international')
        .is('incoterms', null) as any;

      metrics.push({
        label: 'Incoterms Coverage',
        value: (missingIncoterms || 0) === 0 ? '100%' : `${missingIncoterms} POs missing`,
        status: (missingIncoterms || 0) === 0 ? 'ok' : 'warning',
      });
    }

    metrics.push({
      label: `${ctx.complianceFields.taxType} Status`,
      value: ctx.gstin ? 'Registered' : 'Not Registered',
      status: ctx.gstin ? 'ok' : 'error',
    });

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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Loading global procurement dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  const completionRate = poSummary && poSummary.total > 0
    ? Math.round((poSummary.delivered / poSummary.total) * 100) : 0;
  const paymentRate = poSummary && poSummary.totalValue > 0
    ? Math.round((poSummary.totalPaid / poSummary.totalValue) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Region Context Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {ctx.companyName || 'Procurement Dashboard'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {ctx.isGlobal ? 'Global procurement' : 'Domestic procurement'} • {ctx.baseCurrency} base
              {ctx.country && ` • ${ctx.country}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs gap-1">
            <Globe className="w-3 h-3" />
            {ctx.baseCurrency}
          </Badge>
          {ctx.isGlobal && (
            <Badge variant="outline" className="text-xs gap-1 border-amber-600 text-amber-500">
              <Shield className="w-3 h-3" />
              Incoterms Required
            </Badge>
          )}
          {ctx.memberRole && (
            <Badge variant="secondary" className="text-xs">
              {ctx.memberRole.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total POs</p>
              <Package className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{poSummary?.total || 0}</p>
            <p className="text-xs text-muted-foreground">{poSummary?.active || 0} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Open Payables</p>
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-500">
              {ctx.formatAmount(poSummary?.totalPending || 0)}
            </p>
            <p className="text-xs text-muted-foreground">{ctx.baseCurrency} normalized</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Overdue</p>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <p className={cn("text-2xl font-bold", (poSummary?.overdue || 0) > 0 ? "text-destructive" : "text-primary")}>
              {poSummary?.overdue || 0}
            </p>
            <p className="text-xs text-muted-foreground">payment due date passed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Completion</p>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{completionRate}%</p>
            <Progress value={completionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders">
            <FileText className="w-4 h-4 mr-2" />
            PO Tracking
          </TabsTrigger>
          {ctx.isGlobal && (
            <TabsTrigger value="compliance">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Compliance
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Payment Progress
                </CardTitle>
                <CardDescription className="text-xs">
                  {ctx.baseCurrency} normalized across all POs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Paid</span>
                  <span className="text-sm font-semibold text-primary">
                    {ctx.formatAmount(poSummary?.totalPaid || 0)}
                  </span>
                </div>
                <Progress value={paymentRate} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-semibold text-amber-500">
                    {ctx.formatAmount(poSummary?.totalPending || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="text-xs text-muted-foreground">Total Value</span>
                  <span className="text-sm font-bold">
                    {ctx.formatAmount(poSummary?.totalValue || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Procurement Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Delivered</p>
                    <p className="text-xl font-bold text-primary">{poSummary?.delivered || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/50 border">
                    <p className="text-xs text-muted-foreground mb-1">In Transit</p>
                    <p className="text-xl font-bold">{poSummary?.active || 0}</p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg border",
                    (poSummary?.overdue || 0) > 0 ? "bg-destructive/5 border-destructive/20" : ""
                  )}>
                    <p className="text-xs text-muted-foreground mb-1">Overdue</p>
                    <p className={cn("text-xl font-bold", (poSummary?.overdue || 0) > 0 ? "text-destructive" : "text-muted-foreground")}>
                      {poSummary?.overdue || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Payment Rate</p>
                    <p className="text-xl font-bold">{paymentRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PO Tracking Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Active Purchase Orders
              </CardTitle>
              <CardDescription className="text-xs">
                Payment due dates shown for financial tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activePOs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No active purchase orders</p>
              ) : (
                <div className="space-y-2">
                  {activePOs.map((po) => (
                    <div key={po.id} className={cn(
                      "p-3 rounded-lg border flex items-center justify-between gap-3",
                      po.is_overdue ? "bg-destructive/5 border-destructive/20" : ""
                    )}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          po.is_overdue ? "bg-destructive" :
                          po.payment_workflow_status === 'payment_confirmed' ? "bg-primary" :
                          "bg-amber-500"
                        )} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-mono">
                              {po.po_number || `PO-${po.id.substring(0, 6)}`}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {po.po_status || po.status}
                            </Badge>
                            {po.region_type === 'international' && po.incoterms && (
                              <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
                                {po.incoterms}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>PS-{(po.supplier_id || '').substring(0, 6).toUpperCase()}</span>
                            {po.days_until_due !== null && (
                              <span className={cn(
                                po.is_overdue ? "text-destructive" :
                                po.days_until_due <= 7 ? "text-amber-500" : ""
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
                        <p className="text-sm font-semibold">
                          {ctx.formatAmount(po.po_value, po.currency)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {po.payment_workflow_status === 'payment_confirmed' ? '✓ Paid' : (po.payment_workflow_status || 'pending')?.replace(/_/g, ' ')}
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Trade Compliance Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Region-specific compliance requirements for {ctx.country || 'your region'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {compliance.map((metric, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {metric.status === 'ok' ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : metric.status === 'warning' ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        )}
                        <span className="text-sm">{metric.label}</span>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        metric.status === 'ok' ? "border-primary/50 text-primary" :
                        metric.status === 'warning' ? "border-amber-500/50 text-amber-500" :
                        "border-destructive/50 text-destructive"
                      )}>
                        {metric.value}
                      </Badge>
                    </div>
                  ))}

                  <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
                    <h4 className="text-sm font-medium mb-3">
                      Required for {ctx.regionType} trade
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: 'Incoterms', active: ctx.complianceFields.requiresIncoterms },
                        { label: 'HS Code', active: ctx.complianceFields.requiresHSCode },
                        { label: 'Export Docs', active: ctx.complianceFields.requiresExportDocs },
                        { label: ctx.complianceFields.taxType, active: true },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {item.active ? (
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                          ) : (
                            <span className="w-3 h-3 rounded-full bg-muted-foreground/30 inline-block" />
                          )}
                          <span className="text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
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
