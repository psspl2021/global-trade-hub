/**
 * CFO Decision Engine (Global)
 * Converts passive financial reporting into active decision intelligence.
 * Region-aware: adapts currency formatting, labels, and alerts for global vs India.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Clock,
  Flame,
  Globe,
  Loader2,
  Pause,
  Play,
  ShieldAlert,
  Target,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRegionFeatures } from '@/hooks/useRegionFeatures';

interface RunwayData {
  daily_burn: number;
  pending_payable: number;
  runway_days: number;
  burn_7d: number;
  burn_30d: number;
  burn_ratio_7d_vs_avg: number;
}

interface PriorityVendor {
  supplier_id: string;
  po_count: number;
  total_exposure: number;
  overdue_amount: number;
  max_days_overdue: number;
  risk_score: number;
}

interface Alert {
  alert_type: string;
  severity: string;
  details: Record<string, any>;
}

interface SuggestedAction {
  action_type: string;
  details: Record<string, any>;
  priority_val: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: '﷼',
  JPY: '¥', CNY: '¥', SGD: 'S$', AUD: 'A$', CAD: 'C$', CHF: 'CHF',
};

const formatAmount = (val: number, baseCurrency: string = 'INR') => {
  const sym = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency;
  if (baseCurrency === 'INR') {
    if (val >= 10000000) return `${sym}${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `${sym}${(val / 100000).toFixed(1)} L`;
    if (val >= 1000) return `${sym}${(val / 1000).toFixed(0)}K`;
    return `${sym}${Math.round(val).toLocaleString('en-IN')}`;
  }
  if (val >= 1000000) return `${sym}${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${sym}${(val / 1000).toFixed(0)}K`;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: baseCurrency, maximumFractionDigits: 0,
    }).format(val);
  } catch {
    return `${sym}${Math.round(val).toLocaleString()}`;
  }
};

const formatCompactNum = (val: number, baseCurrency: string = 'INR') => {
  const sym = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency;
  if (baseCurrency === 'INR') {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
    return Math.round(val).toLocaleString('en-IN');
  }
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return Math.round(val).toLocaleString();
};

export function CFODecisionEngine() {
  const { isGlobal, userCurrency, isLoading: regionLoading } = useRegionFeatures();
  const [runway, setRunway] = useState<RunwayData | null>(null);
  const [vendors, setVendors] = useState<PriorityVendor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [actions, setActions] = useState<SuggestedAction[]>([]);
  const [loading, setLoading] = useState(true);

  // Base currency for normalized display: INR for India, org currency for global
  const baseCurrency = isGlobal ? (userCurrency || 'USD') : 'INR';
  const fmt = (val: number) => formatAmount(val, baseCurrency);

  useEffect(() => {
    if (!regionLoading) fetchDecisionData();
  }, [regionLoading]);

  const fetchDecisionData = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_cfo_decision_intelligence' as any);
    if (error || !data) {
      console.error('Decision engine RPC error:', error);
      setLoading(false);
      return;
    }
    const d = data as any;
    setRunway(d.runway || null);
    setVendors(d.priority_vendors || []);
    setAlerts(d.alerts || []);
    setActions(d.suggested_actions || []);
    setLoading(false);
  };

  if (loading || regionLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-400" />
          <p className="text-slate-400">Loading decision intelligence...</p>
        </CardContent>
      </Card>
    );
  }

  const runwayColor = !runway ? 'slate' :
    runway.runway_days < 14 ? 'red' :
    runway.runway_days < 30 ? 'amber' : 'emerald';

  const runwayLabel = !runway ? 'N/A' :
    runway.runway_days >= 9999 ? 'No active burn' :
    `${Math.round(runway.runway_days)} days`;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Decision Engine</h3>
            <p className="text-xs text-slate-400">Predictive cash intelligence — what to do next</p>
          </div>
        </div>
        {isGlobal && (
          <Badge variant="outline" className="text-xs border-sky-700 text-sky-400 gap-1">
            <Globe className="w-3 h-3" />
            {baseCurrency} Base
          </Badge>
        )}
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <Card key={i} className={cn(
              "border",
              alert.severity === 'critical'
                ? "bg-red-950/30 border-red-800/50"
                : "bg-amber-950/20 border-amber-800/40"
            )}>
              <CardContent className="py-3 px-4 flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 p-1 rounded",
                  alert.severity === 'critical' ? "bg-red-500/20" : "bg-amber-500/20"
                )}>
                  {alert.severity === 'critical'
                    ? <ShieldAlert className="w-4 h-4 text-red-400" />
                    : <AlertTriangle className="w-4 h-4 text-amber-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    alert.severity === 'critical' ? "text-red-300" : "text-amber-300"
                  )}>
                    {formatAlertMessage(alert, baseCurrency)}
                  </p>
                </div>
                <Badge variant="outline" className={cn(
                  "text-xs shrink-0",
                  alert.severity === 'critical'
                    ? "border-red-700 text-red-400"
                    : "border-amber-700 text-amber-400"
                )}>
                  {alert.severity}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cash Runway Projection */}
      {runway && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Flame className={cn("w-5 h-5", `text-${runwayColor}-400`)} />
              Cash Runway Projection
              {isGlobal && (
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 ml-2">
                  {baseCurrency} Normalized
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Runway</p>
                <p className={cn("text-2xl font-bold", `text-${runwayColor}-300`)}>
                  {runwayLabel}
                </p>
                <p className="text-xs text-slate-500">at current burn rate</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Daily Burn</p>
                <p className="text-xl font-semibold text-sky-300">{fmt(runway.daily_burn)}</p>
                <p className="text-xs text-slate-500">30-day average</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Open Payables</p>
                <p className="text-xl font-semibold text-amber-300">{fmt(runway.pending_payable)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">7-Day Trend</p>
                <div className="flex items-center gap-1">
                  <p className="text-xl font-semibold text-slate-200">
                    {runway.burn_ratio_7d_vs_avg > 0 ? `${runway.burn_ratio_7d_vs_avg}x` : '—'}
                  </p>
                  {runway.burn_ratio_7d_vs_avg > 1.5 && (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <p className="text-xs text-slate-500">vs 30-day avg</p>
              </div>
            </div>
            {runway.pending_payable > 0 && runway.runway_days < 9999 && (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Burn progress</span>
                  <span>{Math.min(100, Math.round((1 - runway.runway_days / Math.max(runway.runway_days + 30, 60)) * 100))}%</span>
                </div>
                <Progress
                  value={Math.min(100, Math.max(5, (1 - runway.runway_days / Math.max(runway.runway_days + 30, 60)) * 100))}
                  className={cn("h-2", runway.runway_days < 14 ? "bg-red-900/30" : "bg-slate-700")}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Two columns: Priority Vendors + Suggested Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Prioritization */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Payment Priority Queue
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Vendors ranked by overdue risk × exposure × dependency
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No outstanding vendor payments</p>
            ) : (
              <div className="space-y-3">
                {vendors.slice(0, 7).map((v, i) => {
                  const maxScore = vendors[0]?.risk_score || 1;
                  const riskPct = (v.risk_score / maxScore) * 100;
                  return (
                    <div key={v.supplier_id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn(
                            "text-xs w-6 justify-center",
                            i === 0 ? "border-red-600 text-red-400" :
                            i < 3 ? "border-amber-600 text-amber-400" :
                            "border-slate-600 text-slate-400"
                          )}>
                            {i + 1}
                          </Badge>
                          <span className="text-sm text-slate-300 font-mono">
                            PS-{v.supplier_id.substring(0, 6).toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">({v.po_count} POs)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-amber-300">{fmt(v.total_exposure)}</span>
                          {v.overdue_amount > 0 && (
                            <span className="text-xs text-red-400 ml-2">
                              ({v.max_days_overdue}d late)
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress
                        value={riskPct}
                        className={cn(
                          "h-1",
                          i === 0 ? "bg-red-900/20" : "bg-slate-700"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suggested Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Suggested Actions
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              AI-generated recommendations based on current position
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">No actions needed — finances look healthy ✓</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action, i) => (
                  <div key={i} className={cn(
                    "p-3 rounded-lg border",
                    action.action_type === 'release_payment'
                      ? "bg-red-950/20 border-red-800/30"
                      : "bg-emerald-950/20 border-emerald-800/30"
                  )}>
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "mt-0.5 p-1.5 rounded",
                        action.action_type === 'release_payment' ? "bg-red-500/20" : "bg-emerald-500/20"
                      )}>
                        {action.action_type === 'release_payment'
                          ? <Play className="w-3.5 h-3.5 text-red-400" />
                          : <Pause className="w-3.5 h-3.5 text-emerald-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">
                          {formatActionTitle(action, baseCurrency)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {action.details.reason}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {fmt(action.details.amount || action.details.overdue_amount || 0)}
                          </Badge>
                          {action.details.suggested_delay_days && (
                            <Badge variant="outline" className="text-xs border-emerald-700 text-emerald-400">
                              <Clock className="w-3 h-3 mr-1" />
                              Delay {action.details.suggested_delay_days}d
                            </Badge>
                          )}
                          {action.details.days_overdue && (
                            <Badge variant="outline" className="text-xs border-red-700 text-red-400">
                              {action.details.days_overdue}d overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatAlertMessage(alert: Alert, baseCurrency: string): string {
  const sym = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency;
  switch (alert.alert_type) {
    case 'high_outflow_week':
      return `${sym}${formatCompactNum(alert.details.due_7d, baseCurrency)} payable in next 7 days — ${alert.details.multiplier}x your average weekly burn`;
    case 'low_runway':
      return `Cash runway is ${alert.details.runway_days} days at current burn rate`;
    case 'vendor_concentration':
      return `Vendor PS-${(alert.details.vendor_id || '').substring(0, 6).toUpperCase()} holds ${alert.details.pct}% of open payables — concentration risk`;
    default:
      return alert.alert_type;
  }
}

function formatActionTitle(action: SuggestedAction, baseCurrency: string): string {
  const vendorId = action.details.vendor_id || '';
  const label = `PS-${vendorId.substring(0, 6).toUpperCase()}`;
  switch (action.action_type) {
    case 'delay_payment':
      return `Delay ${label} by ${action.details.suggested_delay_days}d → frees ${formatAmount(action.details.amount, baseCurrency)}`;
    case 'release_payment':
      return `Release payment for ${label} to avoid supply risk`;
    default:
      return action.action_type;
  }
}

export default CFODecisionEngine;
