/**
 * FxRatesAdmin — view/refresh live FX rates anchored to INR.
 * Calls the `refresh-fx-rates` edge function to repull from open.er-api.com.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Globe2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FxRow {
  currency_code: string;
  rate_to_inr: number;
  source: string | null;
  fetched_at: string;
}

export default function FxRatesAdmin() {
  const [rows, setRows] = useState<FxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fx_rates' as any)
      .select('currency_code, rate_to_inr, source, fetched_at')
      .order('currency_code', { ascending: true });
    if (error) toast.error('Failed to load rates: ' + error.message);
    setRows(((data as any) || []) as FxRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-fx-rates', { body: {} });
      if (error) throw error;
      toast.success(`Refreshed ${(data as any)?.updated ?? 0} rates`);
      await load();
    } catch (err: any) {
      toast.error('Refresh failed: ' + (err?.message || 'unknown'));
    } finally {
      setRefreshing(false);
    }
  };

  // Compute the freshest fetched_at across rows + staleness
  const freshestMs = rows.reduce((max, r) => {
    const t = new Date(r.fetched_at).getTime();
    return Number.isFinite(t) && t > max ? t : max;
  }, 0);
  const lastFetched = freshestMs > 0 ? new Date(freshestMs).toISOString() : null;
  const ageHours = freshestMs > 0 ? (Date.now() - freshestMs) / 3_600_000 : 0;
  const isStale = freshestMs > 0 && ageHours > 48;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-primary" />
            FX Rates Console
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All rates anchored to INR · auto-refreshed daily at 02:30 IST
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh now'}
        </Button>
      </header>

      {isStale && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 flex items-start gap-3">
          <Clock className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-destructive">Rates are stale ({ageHours.toFixed(0)}h old)</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily refresh appears to have failed. Click <strong>Refresh now</strong>, or check the
              <code className="mx-1 px-1 py-0.5 rounded bg-muted text-[10px]">refresh-fx-rates</code>
              edge function logs. Conversions are still served from cache.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Live conversion table</CardTitle>
          {lastFetched && (
            <Badge variant="outline" className="gap-1.5">
              <Clock className="w-3 h-3" />
              Updated {formatDistanceToNow(new Date(lastFetched), { addSuffix: true })}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No rates yet — click Refresh to fetch.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">1 unit = ₹</TableHead>
                  <TableHead className="text-right">₹100 = </TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.currency_code}>
                    <TableCell className="font-mono font-semibold">{r.currency_code}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ₹{Number(r.rate_to_inr).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.rate_to_inr > 0 ? (100 / Number(r.rate_to_inr)).toFixed(2) : '—'} {r.currency_code}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.source || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
