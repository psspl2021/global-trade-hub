/**
 * ============================================================
 * CONTROL TOWER - EXECUTIVE COMMAND MODE
 * ============================================================
 * 
 * RULE 5: KPI COMPRESSION (TOP ROW ONLY)
 * Show ONLY these 4 primary metrics at the top:
 * 1. Total AI-Verified Savings (₹ / $)
 * 2. Revenue Protected by AI (Risk Avoided)
 * 3. Live High-Risk RFQs (Alert Count)
 * 4. Platform ROI Ratio = Savings ÷ Platform Fee
 * 
 * RULE 6: AI ALERT SYSTEM (MANDATORY)
 * RULE 7: AI INVENTORY = PREDICTIVE
 * RULE 8: FINANCIAL GOVERNANCE VIEW
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Shield,
  AlertTriangle,
  RefreshCw,
  CircleDollarSign,
  AlertCircle,
  Bell,
  Package,
  TrendingDown,
  CheckCircle2,
  Clock,
  Brain,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { GovernanceLegalArmor } from '@/components/governance/GovernanceLegalArmor';

interface ExecutiveMetrics {
  total_ai_verified_savings: number;
  revenue_protected: number;
  live_high_risk_rfqs: number;
  platform_roi_ratio: number;
  total_platform_volume: number;
  total_platform_fee: number;
}

interface ControlTowerAlert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string | null;
  related_category: string | null;
  risk_value: number | null;
  impact_value: number | null;
  is_resolved: boolean;
  created_at: string;
}

interface InventoryPrediction {
  id: string;
  category: string;
  subcategory: string | null;
  stockout_risk_days: number | null;
  reorder_recommendation_qty: number | null;
  price_trend_signal: 'rising' | 'stable' | 'falling' | null;
  demand_velocity: 'high' | 'medium' | 'low' | null;
  prediction_confidence: number;
}

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount?.toFixed(0) || 0}`;
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'supplier_delay_risk': return <Clock className="w-4 h-4" />;
    case 'demand_spike_detected': return <TrendingUp className="w-4 h-4" />;
    case 'inventory_shortage_forecast': return <Package className="w-4 h-4" />;
    case 'price_volatility': return <TrendingDown className="w-4 h-4" />;
    case 'quality_risk': return <AlertTriangle className="w-4 h-4" />;
    default: return <AlertCircle className="w-4 h-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-600 text-white';
    case 'warning': return 'bg-amber-500 text-white';
    default: return 'bg-blue-500 text-white';
  }
};

const getPriceTrendIcon = (trend: string | null) => {
  switch (trend) {
    case 'rising': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    case 'falling': return <ArrowDownRight className="w-4 h-4 text-emerald-500" />;
    default: return <span className="text-muted-foreground">→</span>;
  }
};

export function ControlTowerExecutive() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [alerts, setAlerts] = useState<ControlTowerAlert[]>([]);
  const [predictions, setPredictions] = useState<InventoryPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch executive metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('control_tower_executive_metrics' as any)
        .select('*')
        .single();

      if (!metricsError && metricsData) {
        setMetrics(metricsData as unknown as ExecutiveMetrics);
      }

      // Fetch alerts
      const { data: alertsData } = await supabase
        .from('control_tower_alerts' as any)
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(20);

      setAlerts((alertsData || []) as unknown as ControlTowerAlert[]);

      // Fetch inventory predictions
      const { data: predictionsData } = await supabase
        .from('ai_inventory_predictions' as any)
        .select('*')
        .order('stockout_risk_days', { ascending: true, nullsFirst: false })
        .limit(20);

      setPredictions((predictionsData || []) as unknown as InventoryPrediction[]);
    } catch (err) {
      console.error('[ControlTowerExecutive] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('control_tower_alerts' as any)
        .update({ 
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Alert resolved');
      fetchData();
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Loading executive dashboard...</p>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Control Tower
            <Badge className="bg-primary text-primary-foreground">
              <Sparkles className="w-3 h-3 mr-1" />
              Executive Mode
            </Badge>
          </h2>
          <p className="text-muted-foreground text-sm">
            AI-powered command center • Value Created vs Platform Fee
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* RULE 5: Compressed KPIs - TOP ROW ONLY */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total AI-Verified Savings */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">
                  AI-Verified Savings
                </p>
                <p className="text-3xl font-bold text-emerald-700">
                  {formatCurrency(metrics?.total_ai_verified_savings || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-200/50">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600/70 mt-2">
              Verified procurement cost reduction
            </p>
          </CardContent>
        </Card>

        {/* 2. Revenue Protected by AI */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Revenue Protected
                </p>
                <p className="text-3xl font-bold text-blue-700">
                  {formatCurrency(metrics?.revenue_protected || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-200/50">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600/70 mt-2">
              Risk avoided by AI monitoring
            </p>
          </CardContent>
        </Card>

        {/* 3. Live High-Risk RFQs */}
        <Card className={cn(
          "border-2",
          (metrics?.live_high_risk_rfqs || 0) > 0 
            ? "bg-gradient-to-br from-red-50 to-red-100/50 border-red-300" 
            : "bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  (metrics?.live_high_risk_rfqs || 0) > 0 ? "text-red-600" : "text-gray-600"
                )}>
                  High-Risk RFQs
                </p>
                <p className={cn(
                  "text-3xl font-bold",
                  (metrics?.live_high_risk_rfqs || 0) > 0 ? "text-red-700" : "text-gray-700"
                )}>
                  {metrics?.live_high_risk_rfqs || 0}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                (metrics?.live_high_risk_rfqs || 0) > 0 ? "bg-red-200/50" : "bg-gray-200/50"
              )}>
                <AlertTriangle className={cn(
                  "w-6 h-6",
                  (metrics?.live_high_risk_rfqs || 0) > 0 ? "text-red-600" : "text-gray-600"
                )} />
              </div>
            </div>
            <p className={cn(
              "text-xs mt-2",
              (metrics?.live_high_risk_rfqs || 0) > 0 ? "text-red-600/70" : "text-gray-600/70"
            )}>
              {(metrics?.live_high_risk_rfqs || 0) > 0 ? 'Requires immediate attention' : 'All clear'}
            </p>
          </CardContent>
        </Card>

        {/* 4. Platform ROI Ratio */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Platform ROI Ratio
                </p>
                <p className="text-3xl font-bold text-purple-700">
                  {(metrics?.platform_roi_ratio || 0).toFixed(1)}x
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-200/50">
                <CircleDollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-purple-600/70 mt-2">
              Savings ÷ Platform Fee
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Alerts and Predictions */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="w-4 h-4" />
            Alerts
            {criticalAlerts.length > 0 && (
              <Badge className="bg-red-600 text-white ml-1">
                {criticalAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="w-4 h-4" />
            AI Inventory
          </TabsTrigger>
          <TabsTrigger value="governance" className="gap-2">
            <CircleDollarSign className="w-4 h-4" />
            Governance
          </TabsTrigger>
        </TabsList>

        {/* RULE 6: AI Alert System */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Live AI Alerts
              </CardTitle>
              <CardDescription>
                Real-time risk monitoring and demand signals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p>No active alerts</p>
                  <p className="text-sm mt-1">All systems operating normally</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          alert.severity === 'critical' && "bg-red-50 border-red-200",
                          alert.severity === 'warning' && "bg-amber-50 border-amber-200",
                          alert.severity === 'info' && "bg-blue-50 border-blue-200"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {getAlertIcon(alert.alert_type)}
                            </Badge>
                            <div>
                              <p className="font-medium">{alert.title}</p>
                              {alert.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {alert.description}
                                </p>
                              )}
                              {alert.related_category && (
                                <Badge variant="outline" className="mt-2">
                                  {alert.related_category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                        {alert.risk_value && (
                          <div className="mt-3 flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Risk Value: <strong className="text-red-600">{formatCurrency(alert.risk_value)}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RULE 7: AI Inventory = Predictive */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                AI Inventory Predictions
              </CardTitle>
              <CardDescription>
                Predictive analytics • Not static inventory counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No inventory predictions available</p>
                  <p className="text-sm mt-1">AI is building predictive models</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {predictions.map((pred) => (
                      <div 
                        key={pred.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          pred.stockout_risk_days && pred.stockout_risk_days <= 7 
                            ? "bg-red-50 border-red-200"
                            : pred.stockout_risk_days && pred.stockout_risk_days <= 14
                            ? "bg-amber-50 border-amber-200"
                            : "bg-muted/30"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{pred.category}</p>
                            {pred.subcategory && (
                              <p className="text-sm text-muted-foreground">
                                {pred.subcategory}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {(pred.prediction_confidence || 0).toFixed(0)}% confident
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Stock-out Risk:</span>
                            <p className={cn(
                              "font-semibold",
                              pred.stockout_risk_days && pred.stockout_risk_days <= 7 && "text-red-600"
                            )}>
                              {pred.stockout_risk_days ? `${pred.stockout_risk_days} days` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reorder Qty:</span>
                            <p className="font-semibold">
                              {pred.reorder_recommendation_qty?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price Trend:</span>
                            <p className="font-semibold flex items-center gap-1">
                              {getPriceTrendIcon(pred.price_trend_signal)}
                              <span className="capitalize">{pred.price_trend_signal || 'Stable'}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RULE 8: Financial Governance View */}
        <TabsContent value="governance" className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Value Created vs Platform Governance Fee</CardTitle>
              <CardDescription>
                Financial governance overview • Savings-focused view
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-sm text-emerald-600">Total Value Created</p>
                    <p className="text-3xl font-bold text-emerald-700">
                      {formatCurrency(metrics?.total_ai_verified_savings || 0)}
                    </p>
                    <p className="text-xs text-emerald-600/70 mt-1">
                      AI-verified procurement savings
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-600">Risk Reduction Value</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {formatCurrency(metrics?.revenue_protected || 0)}
                    </p>
                    <p className="text-xs text-blue-600/70 mt-1">
                      Losses prevented by AI monitoring
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">Platform Governance Fee</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(metrics?.total_platform_fee || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on transacted volume
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-sm text-purple-600">Net Value Multiplier</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {(metrics?.platform_roi_ratio || 0).toFixed(1)}x
                    </p>
                    <p className="text-xs text-purple-600/70 mt-1">
                      Every ₹1 fee generates ₹{(metrics?.platform_roi_ratio || 0).toFixed(1)} savings
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Armor */}
          <GovernanceLegalArmor variant="billing" />
          <GovernanceLegalArmor variant="positioning" />
        </TabsContent>
      </Tabs>

      {/* Footer Legal Armor */}
      <GovernanceLegalArmor variant="footer" />
    </div>
  );
}

export default ControlTowerExecutive;
