/**
 * Nudge Impact Panel
 * Shows real-time nudge performance: sent today, success rate, conversions, revenue unlocked
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, Target, IndianRupee, RefreshCw, Send, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NudgeStats {
  nudge_type: string;
  total_sent: number;
  delivered: number;
  failed: number;
  converted: number;
  conversion_rate: number;
  sent_today: number;
  converted_today: number;
  failed_today: number;
}

export function NudgeImpactPanel() {
  const [stats, setStats] = useState<NudgeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('nudge_impact_analytics')
      .select('*');

    if (error) {
      console.error('[NudgeImpactPanel] Error:', error);
      return;
    }
    setStats((data as unknown as NudgeStats[]) || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    toast({ title: 'Refreshed', description: 'Nudge analytics updated' });
  };

  const totals = stats.reduce(
    (acc, s) => ({
      sent: acc.sent + (s.total_sent || 0),
      delivered: acc.delivered + (s.delivered || 0),
      failed: acc.failed + (s.failed || 0),
      converted: acc.converted + (s.converted || 0),
      sentToday: acc.sentToday + (s.sent_today || 0),
      convertedToday: acc.convertedToday + (s.converted_today || 0),
      failedToday: acc.failedToday + (s.failed_today || 0),
    }),
    { sent: 0, delivered: 0, failed: 0, converted: 0, sentToday: 0, convertedToday: 0, failedToday: 0 }
  );

  const overallRate = totals.delivered > 0
    ? Math.round((totals.converted / totals.delivered) * 100)
    : 0;

  const avgCommission = 5000;
  const estimatedRevenue = totals.converted * avgCommission;
  const estimatedRevenueToday = totals.convertedToday * avgCommission;

  const nudgeTypeLabel: Record<string, string> = {
    activation: '🚀 Activation',
    conversion_push: '💪 Conversion Push',
    scale_up: '📈 Scale Up',
  };

  const nudgeTypeColor: Record<string, string> = {
    activation: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    conversion_push: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    scale_up: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading nudge analytics...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Nudge Impact Panel</h3>
          <Badge variant="outline" className="text-xs">Live</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Send className="h-3.5 w-3.5" />
              Sent Today
            </div>
            <p className="text-2xl font-bold">{totals.sentToday}</p>
            <p className="text-xs text-muted-foreground">{totals.sent} all time</p>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Target className="h-3.5 w-3.5" />
              Success Rate
            </div>
            <p className="text-2xl font-bold">{overallRate}%</p>
            <p className="text-xs text-muted-foreground">{totals.converted}/{totals.delivered} converted</p>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Conversions Today
            </div>
            <p className="text-2xl font-bold text-emerald-600">{totals.convertedToday}</p>
            <p className="text-xs text-muted-foreground">{totals.converted} all time</p>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <XCircle className="h-3.5 w-3.5" />
              Failed Today
            </div>
            <p className={`text-2xl font-bold ${totals.failedToday > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {totals.failedToday}
            </p>
            <p className="text-xs text-muted-foreground">{totals.failed} all time</p>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <IndianRupee className="h-3.5 w-3.5" />
              Revenue Unlocked
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{estimatedRevenueToday > 0 ? estimatedRevenueToday.toLocaleString('en-IN') : '0'}
            </p>
            <p className="text-xs text-muted-foreground">₹{estimatedRevenue.toLocaleString('en-IN')} all time</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Nudge Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance by Nudge Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No nudges sent yet. The system runs daily at 10:00 AM IST.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.map((s) => {
                const rate = s.conversion_rate || 0;
                return (
                  <div
                    key={s.nudge_type}
                    className={`flex items-center justify-between p-3 rounded-lg border ${nudgeTypeColor[s.nudge_type] || 'bg-muted/50'}`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {nudgeTypeLabel[s.nudge_type] || s.nudge_type}
                      </p>
                      <p className="text-xs opacity-70">
                        {s.total_sent} sent • {s.delivered} delivered • {s.failed} failed • {s.converted} converted
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{rate}%</p>
                      <p className="text-xs opacity-70">conversion</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
