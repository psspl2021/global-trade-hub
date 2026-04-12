import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Zap, Trophy, Users, Mail, BarChart3, TrendingDown, AlertTriangle } from 'lucide-react';
import { useAuctionIntelligence } from '@/hooks/useAuctionIntelligence';

export default function ReverseAuctionIntelligence() {
  const { awardInsights, supplierLeaderboard, buyerBehavior, emailStats, overviewMetrics } = useAuctionIntelligence();
  const [tab, setTab] = useState('overview');

  const metrics = overviewMetrics.data || {} as Record<string, number | null>;
  const emails = emailStats.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="h-6 w-6 text-amber-500" />
        <h2 className="text-xl font-bold text-foreground">Reverse Auction Intelligence</h2>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Completed Auctions" value={metrics.completed_auctions ?? 0} />
        <KPI label="Avg Bids/Auction" value={metrics.avg_bids_per_auction ?? 0} />
        <KPI label="Avg Suppliers/Auction" value={metrics.avg_suppliers_per_auction ?? 0} />
        <KPI label="Avg Price Drop %" value={`${metrics.avg_price_drop_pct ?? 0}%`} accent />
      </div>

      {/* Alerts */}
      <AlertsStrip awards={awardInsights.data || []} emails={emails} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview"><Trophy className="h-4 w-4 mr-1" />Awards</TabsTrigger>
          <TabsTrigger value="buyers"><Users className="h-4 w-4 mr-1" />Buyers</TabsTrigger>
          <TabsTrigger value="suppliers"><BarChart3 className="h-4 w-4 mr-1" />Suppliers</TabsTrigger>
          <TabsTrigger value="comms"><Mail className="h-4 w-4 mr-1" />Comms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="bg-card border">
            <CardHeader><CardTitle className="text-base">🏆 Award Insights</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead className="text-right">Final Price</TableHead>
                    <TableHead className="text-right">Price Drop</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(awardInsights.data || []).slice(0, 15).map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">{a.title || a.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{a.winner_supplier_id?.slice(0, 8) || '—'}</TableCell>
                      <TableCell className="text-right text-sm">₹{(a.winning_price ?? 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={a.price_drop_pct > 5 ? 'default' : a.price_drop_pct > 2 ? 'secondary' : 'destructive'}>
                          <TrendingDown className="h-3 w-3 mr-1" />{a.price_drop_pct}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!(awardInsights.data || []).length && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No completed auctions yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyers" className="mt-4">
          <Card className="bg-card border">
            <CardHeader><CardTitle className="text-base">👤 Buyer Behavior</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-right">Auctions</TableHead>
                    <TableHead className="text-right">Total Bids</TableHead>
                    <TableHead className="text-right">Avg Suppliers</TableHead>
                    <TableHead className="text-right">Avg Bids</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(buyerBehavior.data || []).slice(0, 20).map(b => (
                    <TableRow key={b.buyer_id}>
                      <TableCell className="font-medium text-sm">{b.buyer_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-right text-sm">{b.auctions_created}</TableCell>
                      <TableCell className="text-right text-sm">{b.total_bids_received}</TableCell>
                      <TableCell className="text-right text-sm">{b.avg_suppliers}</TableCell>
                      <TableCell className="text-right text-sm">{b.avg_bids}</TableCell>
                    </TableRow>
                  ))}
                  {!(buyerBehavior.data || []).length && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No buyer data yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <Card className="bg-card border">
            <CardHeader><CardTitle className="text-base">📊 Supplier Leaderboard</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Participated</TableHead>
                    <TableHead className="text-right">Wins</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Avg Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(supplierLeaderboard.data || []).map((s, i) => (
                    <TableRow key={s.supplier_id}>
                      <TableCell className="font-medium text-sm">
                        {i < 3 && <span className="mr-1">{['🥇','🥈','🥉'][i]}</span>}
                        {s.supplier_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-right text-sm">{s.auctions_participated}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{s.wins}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.win_rate > 50 ? 'default' : 'secondary'}>{s.win_rate}%</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{s.avg_bid_rank}</TableCell>
                    </TableRow>
                  ))}
                  {!(supplierLeaderboard.data || []).length && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No supplier data yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comms" className="mt-4">
          <Card className="bg-card border">
            <CardHeader><CardTitle className="text-base">📩 PO Email Communication</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CommStat label="Total Sent" value={emails?.total ?? 0} />
                <CommStat label="Open Rate" value={`${emails?.open_rate ?? 0}%`} good={(emails?.open_rate ?? 0) > 30} />
                <CommStat label="Delivery Rate" value={`${emails?.delivery_rate ?? 0}%`} good={(emails?.delivery_rate ?? 0) > 90} />
                <CommStat label="Failure Rate" value={`${emails?.failure_rate ?? 0}%`} good={(emails?.failure_rate ?? 0) < 5} invert />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className="bg-card border">
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${accent ? 'text-emerald-500' : 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function CommStat({ label, value, good, invert }: { label: string; value: string | number; good?: boolean; invert?: boolean }) {
  const color = good ? (invert ? 'text-destructive' : 'text-emerald-500') : (invert ? 'text-emerald-500' : 'text-muted-foreground');
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function AlertsStrip({ awards, emails }: { awards: { price_drop_pct: number }[]; emails?: { failure_rate: number } | null }) {
  const alerts: { msg: string; severity: 'warning' | 'destructive' }[] = [];

  const lowCompetition = awards.filter(a => a.price_drop_pct < 2).length;
  if (lowCompetition > 0) alerts.push({ msg: `${lowCompetition} auctions with <2% price drop (weak competition)`, severity: 'warning' });
  if (emails && emails.failure_rate > 10) alerts.push({ msg: `Email failure rate ${emails.failure_rate}% — system issue`, severity: 'destructive' });

  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center gap-2 p-3 rounded-lg text-sm ${a.severity === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />{a.msg}
        </div>
      ))}
    </div>
  );
}
