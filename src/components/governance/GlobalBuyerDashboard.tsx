/**
 * ============================================================
 * GLOBAL BUYER DASHBOARD
 * ============================================================
 * 
 * Unified procurement analytics dashboard for global buyers.
 * Region-adaptive: multi-currency, Incoterms, compliance fields.
 * Uses single atomic RPC (get_global_buyer_dashboard) for consistent data.
 * Scoped to buyer_company_id — NOT created_by.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';
import { PurchaserSelector } from '@/components/dashboard/PurchaserSelector';
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

interface DashboardData {
  summary: {
    total_pos: number;
    open_pos: number;
    total_value: number;
    open_payables: number;
    overdue_count: number;
    overdue_value: number;
    completed_count: number;
    avg_po_value: number;
  };
  active_pos: Array<{
    id: string;
    po_number: string;
    status: string;
    total_amount: number;
    currency: string;
    supplier_name: string;
    created_at: string;
    expected_delivery_date: string | null;
    payment_due_date: string | null;
    is_overdue: boolean;
  }>;
  active_pos_total: number;
  active_pos_has_more: boolean;
  overdue_pos: Array<{
    id: string;
    po_number: string;
    status: string;
    total_amount: number;
    currency: string;
    supplier_name: string;
    due_date: string;
    days_overdue: number;
  }>;
  overdue_pos_total: number;
  overdue_pos_has_more: boolean;
  compliance: {
    missing_incoterms: number;
    missing_payment_terms: number;
    total_active: number;
  };
}
export function GlobalBuyerDashboard() {
  const ctx = useGlobalBuyerContext();
  const companyCtx = useBuyerCompanyContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ctx.isLoading && ctx.companyId) {
      fetchDashboardData();
    } else if (!ctx.isLoading && !ctx.companyId) {
      setLoading(false);
    }
  }, [ctx.isLoading, ctx.companyId]);

  const fetchDashboardData = async () => {
    if (!ctx.companyId) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.rpc(
        'get_global_buyer_dashboard' as any,
        { p_company_id: ctx.companyId }
      );

      if (error) {
        console.error('[GlobalBuyerDashboard] RPC error:', error);
        return;
      }

      setData(result as unknown as DashboardData);
    } catch (err) {
      console.error('[GlobalBuyerDashboard] Error:', err);
    } finally {
      setLoading(false);
    }
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

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No procurement data available. Ensure your company is set up.</p>
        </CardContent>
      </Card>
    );
  }

  const s = data.summary;
  const completionRate = s.total_pos > 0 ? Math.round((s.completed_count / s.total_pos) * 100) : 0;
  const paidValue = s.total_value - s.open_payables;
  const paymentRate = s.total_value > 0 ? Math.round((paidValue / s.total_value) * 100) : 0;

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

      {/* Purchaser Selector + Add Team Member */}
      {!companyCtx.isLoading && companyCtx.purchasers.length > 0 && (
        <PurchaserSelector
          purchasers={companyCtx.purchasers}
          selectedPurchaserId={companyCtx.selectedPurchaserId}
          onSelect={companyCtx.setSelectedPurchaserId}
          showAllOption={true}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total POs</p>
              <Package className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.total_pos}</p>
            <p className="text-xs text-muted-foreground">{s.open_pos} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Open Payables</p>
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-500">
              {ctx.formatAmount(s.open_payables)}
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
            <p className={cn("text-2xl font-bold", s.overdue_count > 0 ? "text-destructive" : "text-primary")}>
              {s.overdue_count}
            </p>
            <p className="text-xs text-muted-foreground">
              {s.overdue_count > 0 ? ctx.formatAmount(s.overdue_value) + ' at risk' : 'all on track'}
            </p>
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
                    {ctx.formatAmount(paidValue)}
                  </span>
                </div>
                <Progress value={paymentRate} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-semibold text-amber-500">
                    {ctx.formatAmount(s.open_payables)}
                  </span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="text-xs text-muted-foreground">Total Value</span>
                  <span className="text-sm font-bold">
                    {ctx.formatAmount(s.total_value)}
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
                    <p className="text-xl font-bold text-primary">{s.completed_count}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/50 border">
                    <p className="text-xs text-muted-foreground mb-1">In Transit</p>
                    <p className="text-xl font-bold">{s.open_pos}</p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg border",
                    s.overdue_count > 0 ? "bg-destructive/5 border-destructive/20" : ""
                  )}>
                    <p className="text-xs text-muted-foreground mb-1">Overdue</p>
                    <p className={cn("text-xl font-bold", s.overdue_count > 0 ? "text-destructive" : "text-muted-foreground")}>
                      {s.overdue_count}
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

          {/* Overdue Alerts */}
          {data.overdue_pos.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Overdue Payments ({data.overdue_pos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.overdue_pos.slice(0, 8).map((po) => (
                    <div key={po.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono">{po.po_number}</span>
                          <Badge variant="destructive" className="text-[10px]">
                            {po.days_overdue}d overdue
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{po.supplier_name}</p>
                      </div>
                      <span className="text-sm font-semibold text-destructive whitespace-nowrap">
                        {ctx.formatAmount(po.total_amount, po.currency)}
                      </span>
                    </div>
                  ))}
                  {data.overdue_pos_has_more && (
                    <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                      Showing {data.overdue_pos.length} of {data.overdue_pos_total} overdue POs
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
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
                Payment due dates shown for financial tracking • Company-wide visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.active_pos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No active purchase orders</p>
              ) : (
                <div className="space-y-2">
                  {data.active_pos.map((po) => {
                    const dueDate = po.payment_due_date || po.expected_delivery_date;
                    const daysUntil = dueDate ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <div key={po.id} className={cn(
                        "p-3 rounded-lg border flex items-center justify-between gap-3",
                        po.is_overdue ? "bg-destructive/5 border-destructive/20" : ""
                      )}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            po.is_overdue ? "bg-destructive" :
                            po.status === 'payment_done' ? "bg-primary" :
                            "bg-amber-500"
                          )} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-mono">
                                {po.po_number || `PO-${po.id.substring(0, 6)}`}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {po.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <span>{po.supplier_name}</span>
                              {daysUntil !== null && (
                                <span className={cn(
                                  po.is_overdue ? "text-destructive" :
                                  daysUntil <= 7 ? "text-amber-500" : ""
                                )}>
                                  {po.is_overdue
                                    ? `${Math.abs(daysUntil)}d overdue`
                                    : `${daysUntil}d remaining`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap">
                          {ctx.formatAmount(po.total_amount, po.currency)}
                        </span>
                      </div>
                    );
                  })}
                  {data.active_pos_has_more && (
                    <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                      Showing {data.active_pos.length} of {data.active_pos_total} active POs
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab (Global Only) */}
        {ctx.isGlobal && (
          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Trade Compliance
                </CardTitle>
                <CardDescription className="text-xs">
                  International trade compliance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ctx.complianceFields.requiresIncoterms && (
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">Incoterms Coverage</p>
                        <p className="text-xs text-muted-foreground">
                          {data.compliance.missing_incoterms === 0
                            ? 'All international POs have Incoterms set'
                            : `${data.compliance.missing_incoterms} POs missing Incoterms`}
                        </p>
                      </div>
                      {data.compliance.missing_incoterms === 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{ctx.complianceFields.taxType} Status</p>
                      <p className="text-xs text-muted-foreground">
                        {ctx.taxIdLabel}: {ctx.gstin || 'Not registered'}
                      </p>
                    </div>
                    {ctx.gstin ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Payment Terms Coverage</p>
                      <p className="text-xs text-muted-foreground">
                        {data.compliance.missing_payment_terms === 0
                          ? 'All POs have payment terms'
                          : `${data.compliance.missing_payment_terms} POs missing payment terms`}
                      </p>
                    </div>
                    {data.compliance.missing_payment_terms === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">ERP Sync Policy</p>
                      <p className="text-xs text-muted-foreground">
                        {ctx.erpSyncPolicy === 'auto' ? 'Auto-sync enabled' : 'Manual sync mode'}
                      </p>
                    </div>
                    {ctx.erpSyncPolicy === 'auto' ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
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
