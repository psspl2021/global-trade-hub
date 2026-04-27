/**
 * GSC Sync Quick Action
 * --------------------------------------------------
 * One-click "Run GSC Sync Now" widget for the admin dashboard.
 * - Triggers the seo-gsc-sync edge function
 * - Shows live progress (indeterminate bar + step status)
 * - Surfaces row counts on success
 * - Auto-runs when ?action=gsc-sync is present in the URL
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';

type SyncResult = {
  success: boolean;
  gsc_rows_fetched?: number;
  seo_demand_pages_updated?: number;
  gsc_queries_inserted?: number;
  gsc_striking_distance_upserted?: number;
  error?: string;
  message?: string;
};

const STEPS = [
  'Authenticating with Google Search Console',
  'Fetching demand URL performance',
  'Updating seo_demand_pages',
  'Refreshing striking-distance keywords',
] as const;

export function GscSyncQuickAction() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [syncing, setSyncing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SyncResult | null>(null);
  const autoRanRef = useRef(false);

  async function runSync() {
    if (syncing) return;
    setSyncing(true);
    setResult(null);
    setStepIdx(0);
    setProgress(8);

    // Animate progress through steps while the request is in-flight
    const stepTimer = setInterval(() => {
      setStepIdx((s) => Math.min(s + 1, STEPS.length - 1));
      setProgress((p) => Math.min(p + 22, 90));
    }, 1200);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Please sign in as admin first');
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-gsc-sync`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-trigger': 'true',
          'Content-Type': 'application/json',
        },
      });
      const json: SyncResult = await res.json();
      setResult(json);
      setProgress(100);

      if (json.success) {
        toast.success(
          `Sync complete · ${json.seo_demand_pages_updated ?? 0} demand pages updated`
        );
      } else {
        toast.error(json.error || json.message || 'Sync failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({ success: false, error: msg });
      toast.error(`Network error: ${msg}`);
    } finally {
      clearInterval(stepTimer);
      setSyncing(false);
    }
  }

  // Auto-run when navigated with ?action=gsc-sync
  useEffect(() => {
    if (autoRanRef.current) return;
    if (searchParams.get('action') === 'gsc-sync') {
      autoRanRef.current = true;
      // Strip the param so refreshes don't re-trigger
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
      void runSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-5 w-5 text-primary" />
          Google Search Console Sync
          {result?.success && (
            <Badge variant="secondary" className="ml-auto gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Up to date
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pull the latest impressions, clicks & positions from GSC and refresh demand URL metrics.
        </p>

        <Button
          onClick={runSync}
          disabled={syncing}
          size="lg"
          className="w-full sm:w-auto"
        >
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing GSC…
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run GSC Sync Now
            </>
          )}
        </Button>

        {(syncing || progress > 0) && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {syncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : result?.success ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-600" />
              )}
              <span>
                {syncing
                  ? `Step ${stepIdx + 1} of ${STEPS.length}: ${STEPS[stepIdx]}`
                  : result?.success
                  ? 'Done'
                  : result?.error || 'Idle'}
              </span>
            </div>
          </div>
        )}

        {result?.success && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t">
            <Stat label="GSC rows" value={result.gsc_rows_fetched ?? 0} />
            <Stat label="Pages updated" value={result.seo_demand_pages_updated ?? 0} />
            <Stat label="Queries inserted" value={result.gsc_queries_inserted ?? 0} />
            <Stat label="Striking distance" value={result.gsc_striking_distance_upserted ?? 0} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export default GscSyncQuickAction;
