/**
 * CFO Visualization Dashboard
 * Runway graph, burn trend, risk heatmap, action effectiveness, and feedback loop.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Activity, BarChart3, Brain, Check, Clock, Flame, Loader2,
  Star, ThumbsDown, ThumbsUp, TrendingDown, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricSnapshot {
  snapshot_date: string;
  runway_days: number | null;
  daily_burn: number;
  pending_payable: number;
  overdue_amount: number;
  burn_7d: number;
  burn_30d: number;
  total_exposure: number;
  active_po_count: number;
}

interface ActionLog {
  id: string;
  action_type: string;
  outcome: string | null;
  impact_realized: number | null;
  created_at: string;
  target_supplier_id: string | null;
  confidence_at_execution: number | null;
  execution_params: any;
}

interface FeedbackEntry {
  action_log_id: string;
  accepted: boolean;
  effectiveness_score: number | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', JPY: '¥', CNY: '¥',
};

const fmtCompact = (val: number, cur: string = 'INR') => {
  const s = CURRENCY_SYMBOLS[cur] || cur;
  if (cur === 'INR') {
    if (val >= 10000000) return `${s}${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${s}${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${s}${(val / 1000).toFixed(0)}K`;
    return `${s}${Math.round(val).toLocaleString('en-IN')}`;
  }
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return `${s}${Math.round(val).toLocaleString()}`;
};

export function CFOVisualizationDashboard() {
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackEntry>>({});
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: membership } = await supabase
      .from('buyer_company_members')
      .select('company_id, buyer_companies(base_currency)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!membership) { setLoading(false); return; }
    const cId = membership.company_id;
    setCompanyId(cId);
    const bc = (membership as any).buyer_companies?.base_currency || 'INR';
    setBaseCurrency(bc);

    // Parallel fetches
    const [snapshotRes, actionRes, feedbackRes] = await Promise.all([
      supabase
        .from('cfo_metrics_snapshots')
        .select('*')
        .eq('company_id', cId)
        .order('snapshot_date', { ascending: true })
        .limit(90),
      supabase
        .from('cfo_action_log')
        .select('*')
        .eq('company_id', cId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('cfo_action_feedback')
        .select('action_log_id, accepted, effectiveness_score')
        .eq('company_id', cId),
    ]);

    setSnapshots((snapshotRes.data as MetricSnapshot[]) || []);
    setActionLogs((actionRes.data as ActionLog[]) || []);

    const fbMap: Record<string, FeedbackEntry> = {};
    (feedbackRes.data || []).forEach((f: any) => { fbMap[f.action_log_id] = f; });
    setFeedbackMap(fbMap);
    setLoading(false);
  };

  const submitFeedback = useCallback(async (actionLogId: string, accepted: boolean, score: number) => {
    if (!companyId) return;
    setSubmittingFeedback(actionLogId);
    const { error } = await supabase.from('cfo_action_feedback').upsert({
      action_log_id: actionLogId,
      company_id: companyId,
      accepted,
      effectiveness_score: score,
      feedback_notes: feedbackNotes[actionLogId] || null,
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      reviewed_at: new Date().toISOString(),
    } as any, { onConflict: 'action_log_id' });

    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } else {
      setFeedbackMap(prev => ({
        ...prev,
        [actionLogId]: { action_log_id: actionLogId, accepted, effectiveness_score: score },
      }));
      toast({ title: 'Feedback Recorded', description: 'This improves future recommendations.' });
    }
    setSubmittingFeedback(null);
  }, [companyId, feedbackNotes, toast]);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-violet-400" />
          <p className="text-muted-foreground">Loading financial intelligence...</p>
        </CardContent>
      </Card>
    );
  }

  const hasSnapshots = snapshots.length > 1;
  const latestSnapshot = snapshots[snapshots.length - 1];
  const prevSnapshot = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

  // Compute trend deltas
  const runwayDelta = latestSnapshot && prevSnapshot
    ? (latestSnapshot.runway_days || 0) - (prevSnapshot.runway_days || 0)
    : 0;
  const burnDelta = latestSnapshot && prevSnapshot
    ? latestSnapshot.daily_burn - prevSnapshot.daily_burn
    : 0;

  const chartData = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    runway: s.runway_days || 0,
    burn: s.daily_burn,
    payable: s.pending_payable,
    overdue: s.overdue_amount,
    exposure: s.total_exposure,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Financial Intelligence</h3>
          <p className="text-xs text-muted-foreground">
            {hasSnapshots ? `${snapshots.length}-day trend · ` : ''}
            Learning from {Object.keys(feedbackMap).length} action outcomes
          </p>
        </div>
      </div>

      {/* KPI Delta Cards */}
      {latestSnapshot && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            label="Runway"
            value={`${Math.round(latestSnapshot.runway_days || 0)}d`}
            delta={runwayDelta}
            deltaLabel={`${runwayDelta > 0 ? '+' : ''}${Math.round(runwayDelta)}d`}
            positive={runwayDelta >= 0}
            icon={<Clock className="w-4 h-4" />}
          />
          <KPICard
            label="Daily Burn"
            value={fmtCompact(latestSnapshot.daily_burn, baseCurrency)}
            delta={burnDelta}
            deltaLabel={`${burnDelta > 0 ? '+' : ''}${fmtCompact(Math.abs(burnDelta), baseCurrency)}`}
            positive={burnDelta <= 0}
            icon={<Flame className="w-4 h-4" />}
          />
          <KPICard
            label="Open Payables"
            value={fmtCompact(latestSnapshot.pending_payable, baseCurrency)}
            icon={<Activity className="w-4 h-4" />}
          />
          <KPICard
            label="Overdue"
            value={fmtCompact(latestSnapshot.overdue_amount, baseCurrency)}
            icon={<TrendingDown className="w-4 h-4" />}
            alert={latestSnapshot.overdue_amount > 0}
          />
        </div>
      )}

      {/* Charts Row */}
      {hasSnapshots && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Runway Trend */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm">Runway Trend</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">Days of cash remaining over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="runwayGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Area type="monotone" dataKey="runway" stroke="#34d399" fill="url(#runwayGrad)" strokeWidth={2} name="Runway (days)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Burn Rate Trend */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm">Burn & Exposure</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">Daily burn vs total exposure</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    formatter={(val: number) => fmtCompact(val, baseCurrency)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
                  <Line type="monotone" dataKey="burn" stroke="#f59e0b" strokeWidth={2} dot={false} name="Daily Burn" />
                  <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} dot={false} name="Overdue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Effectiveness & Feedback Loop */}
      {actionLogs.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              Action History & Learning Loop
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Rate past actions to improve future recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionLogs.map(log => {
                const fb = feedbackMap[log.id];
                const hasFeedback = !!fb;
                const isSubmitting = submittingFeedback === log.id;
                return (
                  <div key={log.id} className={cn(
                    "p-3 rounded-lg border",
                    hasFeedback
                      ? fb.accepted ? "bg-emerald-950/20 border-emerald-800/30" : "bg-red-950/20 border-red-800/30"
                      : "bg-muted/30 border-border/50"
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {log.action_type.replace(/_/g, ' ')}
                          </span>
                          {log.outcome && (
                            <Badge variant="outline" className={cn(
                              "text-[10px]",
                              log.outcome === 'success' ? "border-emerald-700 text-emerald-400" :
                              log.outcome === 'duplicate' ? "border-amber-700 text-amber-400" :
                              "border-red-700 text-red-400"
                            )}>
                              {log.outcome}
                            </Badge>
                          )}
                          {log.confidence_at_execution != null && (
                            <Badge variant="outline" className="text-[10px] border-muted text-muted-foreground">
                              {Math.round(log.confidence_at_execution * 100)}% conf
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString()} ·
                          {log.target_supplier_id ? ` PS-${log.target_supplier_id.substring(0, 6).toUpperCase()}` : ' Global'}
                          {log.impact_realized ? ` · Impact: ${fmtCompact(log.impact_realized, baseCurrency)}` : ''}
                        </p>
                      </div>

                      {/* Feedback Controls */}
                      <div className="shrink-0 flex items-center gap-1">
                        {hasFeedback ? (
                          <div className="flex items-center gap-1.5">
                            {fb.accepted
                              ? <ThumbsUp className="w-4 h-4 text-emerald-400" />
                              : <ThumbsDown className="w-4 h-4 text-red-400" />
                            }
                            {fb.effectiveness_score != null && (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} className={cn(
                                    "w-3 h-3",
                                    s <= (fb.effectiveness_score || 0) * 5
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-muted-foreground/60"
                                  )} />
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/30"
                              disabled={isSubmitting}
                              onClick={() => submitFeedback(log.id, true, 0.8)}
                            >
                              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-950/30"
                              disabled={isSubmitting}
                              onClick={() => submitFeedback(log.id, false, 0.2)}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasSnapshots && actionLogs.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-10 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Financial intelligence builds over time.</p>
            <p className="text-xs text-muted-foreground mt-1">Snapshots and action data will appear as the system operates.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- KPI Card ---
function KPICard({ label, value, delta, deltaLabel, positive, icon, alert: isAlert }: {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  positive?: boolean;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <Card className={cn(
      "border",
      isAlert ? "bg-red-950/20 border-red-800/30" : "bg-card border-border"
    )}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-muted-foreground", isAlert && "text-red-400")}>{icon}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={cn("text-xl font-bold", isAlert ? "text-red-600 dark:text-red-400" : "text-foreground")}>{value}</p>
        {deltaLabel && delta !== undefined && delta !== 0 && (
          <div className="flex items-center gap-1 mt-1">
            {positive
              ? <TrendingUp className="w-3 h-3 text-emerald-400" />
              : <TrendingDown className="w-3 h-3 text-red-400" />
            }
            <span className={cn("text-xs", positive ? "text-emerald-400" : "text-red-400")}>{deltaLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
