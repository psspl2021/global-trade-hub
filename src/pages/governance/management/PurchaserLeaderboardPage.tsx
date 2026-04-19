/**
 * ============================================================
 * PurchaserLeaderboardPage — Phase 2 management observability
 * ============================================================
 *
 * Read-only projection of `get_purchaser_leaderboard`. No charts,
 * no approvals, no policy config. Pure visibility layer.
 *
 * Access:
 *   - Gated by `can_view_purchaser_leaderboard` capability.
 *   - Backend RPC additionally enforces management/executive scope.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCapabilities } from '@/hooks/useCapabilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCurrencyFormatter } from '@/lib/currency';

interface LeaderboardRow {
  purchaser_id: string;
  display_name: string;
  role: string;
  total_auctions: number;
  completed_auctions: number;
  total_pos: number;
  total_savings: number;
  avg_savings_pct: number;
  avg_quality_score: number;
}

export default function PurchaserLeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { has, loading: capsLoading } = useCapabilities();
  const fmt = useCurrencyFormatter();

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allowed = has('can_view_purchaser_leaderboard');

  useEffect(() => {
    if (capsLoading || !user?.id) return;
    if (!allowed) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_purchaser_leaderboard', {
        p_user_id: user.id,
      });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        setRows((data || []) as LeaderboardRow[]);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, allowed, capsLoading]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (b.total_savings || 0) - (a.total_savings || 0)),
    [rows]
  );

  if (capsLoading || loading) {
    return (
      <div className="container max-w-6xl py-10 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading leaderboard…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container max-w-6xl py-10">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You don't have access to the purchaser leaderboard.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Purchaser Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Read-only view of purchaser performance across your company.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No purchaser activity yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Purchaser</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Auctions</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">POs</TableHead>
                  <TableHead className="text-right">Savings</TableHead>
                  <TableHead className="text-right">Avg Savings %</TableHead>
                  <TableHead className="text-right">Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r, i) => (
                  <TableRow key={r.purchaser_id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{r.display_name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {r.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.total_auctions ?? 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.completed_auctions ?? 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.total_pos ?? 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(r.total_savings || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(r.avg_savings_pct ?? 0).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(r.avg_quality_score ?? 0).toFixed(1)}
                    </TableCell>
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
