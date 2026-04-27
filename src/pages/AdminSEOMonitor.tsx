import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PHASE_1_CORRIDORS, PHASE_1_SLUGS } from '@/data/seoPhaseConfig';
import { canExpandToPhase2 } from '@/utils/seoPhaseGate';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertTriangle, Clock, Shield, Rocket, Loader2, ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const SYNC_STEPS = [
  'Authenticating with Google Search Console',
  'Fetching demand URL performance',
  'Updating seo_demand_pages',
  'Refreshing striking-distance keywords',
] as const;

interface CorridorRow {
  slug: string;
  gsc_status: string | null;
  impressions: number | null;
  clicks: number | null;
  last_checked: string | null;
  ctr: number | null;
  ctr_status: string | null;
  rewrite_required: boolean | null;
}

type MergedCorridor = {
  slug: string;
  country: string;
  category: string;
  gsc_status: 'pending' | 'indexed' | 'warning';
  impressions: number;
  clicks: number;
  last_checked: string | null;
  ctr: number;
  ctr_status: 'healthy' | 'warning' | 'critical';
  rewrite_required: boolean;
};

export default function AdminSEOMonitor() {
  const [corridors, setCorridors] = useState<MergedCorridor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const autoRanRef = useRef(false);

  async function triggerGscSync() {
    if (syncing) return;
    setSyncing(true);
    setLastResult(null);
    setStepIdx(0);
    setProgress(8);

    const stepTimer = setInterval(() => {
      setStepIdx((s) => Math.min(s + 1, SYNC_STEPS.length - 1));
      setProgress((p) => Math.min(p + 22, 90));
    }, 1200);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Please sign in as admin first');
        clearInterval(stepTimer);
        setSyncing(false);
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-gsc-sync`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-admin-trigger': 'true',
          'Content-Type': 'application/json',
        },
      });
      const result = await res.json();
      setLastResult(result);
      setProgress(100);

      if (result.success) {
        toast.success(
          `✅ Sync done: ${result.gsc_rows_fetched} rows • ${result.seo_demand_pages_updated} pages • ${result.gsc_queries_inserted} queries • ${result.gsc_striking_distance_upserted} striking`
        );
        // Refresh the table after a short delay so user sees the completed progress
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error(`❌ ${result.error || result.message || 'Sync failed'}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearInterval(stepTimer);
      setSyncing(false);
    }
  }

  // Auto-trigger when navigated with ?action=gsc-sync
  useEffect(() => {
    if (autoRanRef.current) return;
    if (searchParams.get('action') === 'gsc-sync') {
      autoRanRef.current = true;
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
      void triggerGscSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('seo_demand_pages')
        .select('slug, gsc_status, impressions, clicks, last_checked')
        .in('slug', PHASE_1_SLUGS) as { data: CorridorRow[] | null };

      const dbMap = new Map<string, CorridorRow>();
      (data || []).forEach(row => dbMap.set(row.slug, row));

      const merged: MergedCorridor[] = PHASE_1_CORRIDORS.map(c => {
        const db = dbMap.get(c.slug);
        const status = db?.gsc_status as 'pending' | 'indexed' | 'warning' | undefined;
        const ctrStatus = db?.ctr_status as 'healthy' | 'warning' | 'critical' | undefined;
        return {
          slug: c.slug,
          country: c.country,
          category: c.category,
          gsc_status: status && ['pending', 'indexed', 'warning'].includes(status) ? status : 'pending',
          impressions: db?.impressions ?? 0,
          clicks: db?.clicks ?? 0,
          last_checked: db?.last_checked ?? null,
          ctr: db?.ctr ?? 0,
          ctr_status: ctrStatus && ['healthy', 'warning', 'critical'].includes(ctrStatus) ? ctrStatus : 'healthy',
          rewrite_required: db?.rewrite_required ?? false,
        };
      });

      setCorridors(merged);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading SEO Governance…</span>
      </main>
    );
  }

  const indexedCount = corridors.filter(c => c.gsc_status === 'indexed').length;
  const warningCount = corridors.filter(c => c.gsc_status === 'warning').length;
  const pendingCount = corridors.filter(c => c.gsc_status === 'pending').length;
  const criticalCount = corridors.filter(c => c.ctr_status === 'critical').length;
  const phase2Ready = canExpandToPhase2(indexedCount, warningCount, criticalCount);

  const lastSync = corridors
    .map(c => c.last_checked)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SEO Rollout Monitoring – Phase 1</h1>
            <p className="text-sm text-muted-foreground">10 Strategic Corridors • Live Governance</p>
          </div>
          <Badge variant={phase2Ready ? 'default' : 'secondary'} className="gap-1">
            <Rocket className="h-3 w-3" />
            {phase2Ready ? 'Phase 2 Ready' : 'Phase 1 Active'}
          </Badge>
        </div>

        {/* GSC Last Sync + Manual Trigger */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium">GSC Last Sync</p>
                <p className="text-xs text-muted-foreground">
                  {lastSync ? new Date(lastSync).toLocaleString() : "Not synced yet"}
                </p>
              </div>
              <Button onClick={triggerGscSync} disabled={syncing} size="sm" className="gap-2">
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {syncing ? 'Syncing GSC…' : 'Run GSC Sync Now'}
              </Button>
            </div>

            {(syncing || progress > 0) && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {syncing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : lastResult && (lastResult as { success?: boolean }).success ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                  )}
                  <span>
                    {syncing
                      ? `Step ${stepIdx + 1} of ${SYNC_STEPS.length}: ${SYNC_STEPS[stepIdx]}`
                      : lastResult && (lastResult as { success?: boolean }).success
                      ? 'Sync complete — refreshing data…'
                      : 'Idle'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          {lastResult && (
            <CardContent className="pt-0">
              <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </CardContent>
          )}
        </Card>

        {/* Warning Block */}
        {warningCount > 0 && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6 flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                Phase 2 expansion locked. Resolve {warningCount} warning corridor{warningCount > 1 ? 's' : ''} before scaling.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{indexedCount}/10</p>
              <p className="text-xs text-muted-foreground">Indexed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{warningCount}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Corridor Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Priority Corridors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {corridors.map((corridor) => (
              <div key={corridor.slug} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="font-medium text-sm">{corridor.category} – {corridor.country}</p>
                  <p className="text-xs text-muted-foreground font-mono">/demand/{corridor.slug}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Impressions: {corridor.impressions} • Clicks: {corridor.clicks} • CTR: {corridor.ctr.toFixed(2)}%
                    {corridor.last_checked && ` • Checked: ${new Date(corridor.last_checked).toLocaleDateString()}`}
                  </p>
                </div>
                <div>
                  {corridor.gsc_status === 'indexed' && (
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <CheckCircle className="h-3 w-3" /> Indexed
                    </Badge>
                  )}
                  {corridor.gsc_status === 'pending' && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  )}
                  {corridor.gsc_status === 'warning' && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" /> Warning
                    </Badge>
                  )}
                  {corridor.ctr_status === 'warning' && (
                    <Badge variant="destructive" className="gap-1 ml-1">
                      Low CTR
                    </Badge>
                  )}
                  {corridor.ctr_status === 'critical' && (
                    <Badge variant="destructive" className="gap-1 ml-1">
                      Critical CTR
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Red Flags */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              <h2 className="font-semibold text-lg">Red Flags to Watch</h2>
            </div>
            <ul className="list-disc ml-6 space-y-1 text-sm text-muted-foreground">
              <li>"Crawled – Currently Not Indexed"</li>
              <li>"Duplicate – Google Chose Different Canonical"</li>
              <li>"Soft 404"</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              If these appear, increase content depth + internal links. Do NOT change URL structure.
            </p>
          </CardContent>
        </Card>

        {/* Healthy Rollout Pattern */}
        <Card>
          <CardContent className="pt-6 space-y-2">
            <h2 className="font-semibold text-lg">Healthy Rollout Pattern</h2>
            <ul className="list-disc ml-6 space-y-1 text-sm text-muted-foreground">
              <li>Day 1–2 → 3–4 Indexed</li>
              <li>Day 3–5 → 6–8 Indexed</li>
              <li>Week 2 → All 10 Indexed</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
