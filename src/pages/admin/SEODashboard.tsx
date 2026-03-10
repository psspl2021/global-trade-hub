import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Activity, Globe, Link2, TrendingUp, FileSearch } from 'lucide-react';
import { demandProducts } from '@/data/demandProducts';
import { autoComparisonPairs } from '@/data/autoComparisonPairs';
import { procurementGuides } from '@/data/procurementGuides';

/* ─── Types ────────────────────────────────────── */
interface QueryHistoryRow {
  query: string;
  clicks: number;
  impressions: number;
  date: string;
}

interface InternalLinkRow {
  target_slug: string;
  link_count: number;
}

interface RFQAnalyticsRow {
  page_slug: string;
  organic_visits: number;
  rfqs: number;
  date: string;
}

interface IndexedPageRow {
  url: string;
  indexed: boolean;
  last_checked: string;
}
interface InternalLinkRow {
  target_slug: string;
  link_count: number;
}

interface RFQAnalyticsRow {
  page_slug: string;
  organic_visits: number;
  rfqs: number;
  date: string;
}

/* ─── Component ────────────────────────────────── */
export default function SEODashboard() {
  const [queryHistory, setQueryHistory] = useState<QueryHistoryRow[]>([]);
  const [internalLinks, setInternalLinks] = useState<InternalLinkRow[]>([]);
  const [rfqAnalytics, setRFQAnalytics] = useState<RFQAnalyticsRow[]>([]);
  const [indexedPages, setIndexedPages] = useState<IndexedPageRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Page counts
  const totalDemandPages = demandProducts.length;
  const totalComparisonPages = autoComparisonPairs.length;
  const totalGuidePages = procurementGuides.length;
  const totalPages = totalDemandPages + totalComparisonPages + totalGuidePages;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [qRes, lRes, rRes, iRes] = await Promise.all([
        supabase.from('query_history').select('*').order('date', { ascending: true }).limit(500),
        supabase.from('internal_links').select('*').order('link_count', { ascending: false }).limit(20),
        supabase.from('rfq_analytics').select('*').order('date', { ascending: false }).limit(100),
        supabase.from('indexed_pages').select('*'),
      ]);

      if (qRes.data) setQueryHistory(qRes.data as QueryHistoryRow[]);
      if (lRes.data) setInternalLinks(lRes.data as InternalLinkRow[]);
      if (rRes.data) setRFQAnalytics(rRes.data as RFQAnalyticsRow[]);
      if (iRes.data) setIndexedPages(iRes.data as IndexedPageRow[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Aggregate query growth by date
  const queryGrowthData = queryHistory.reduce<Record<string, { date: string; clicks: number; impressions: number }>>((acc, row) => {
    if (!acc[row.date]) acc[row.date] = { date: row.date, clicks: 0, impressions: 0 };
    acc[row.date].clicks += row.clicks;
    acc[row.date].impressions += row.impressions;
    return acc;
  }, {});
  const queryGrowthChart = Object.values(queryGrowthData).sort((a, b) => a.date.localeCompare(b.date));

  // Top pages by RFQ conversion
  const rfqByPage = rfqAnalytics.reduce<Record<string, { page_slug: string; organic_visits: number; rfqs: number }>>((acc, row) => {
    if (!acc[row.page_slug]) acc[row.page_slug] = { page_slug: row.page_slug, organic_visits: 0, rfqs: 0 };
    acc[row.page_slug].organic_visits += row.organic_visits;
    acc[row.page_slug].rfqs += row.rfqs;
    return acc;
  }, {});
  const rfqConversionTable = Object.values(rfqByPage)
    .map(r => ({ ...r, conversion: r.organic_visits > 0 ? ((r.rfqs / r.organic_visits) * 100).toFixed(2) : '0' }))
    .sort((a, b) => Number(b.conversion) - Number(a.conversion))
    .slice(0, 20);

  // Real indexation from indexed_pages table
  const realIndexedCount = indexedPages.filter(p => p.indexed).length;
  const realTotal = indexedPages.length;
  const hasRealData = realTotal > 0;
  const indexedCount = hasRealData ? realIndexedCount : Math.round(totalPages * 0.85);
  const indexedTotal = hasRealData ? realTotal : totalPages;
  const indexationRate = indexedTotal > 0 ? ((indexedCount / indexedTotal) * 100).toFixed(1) : '0';

  return (
    <>
      <Helmet>
        <title>SEO Dashboard | ProcureSaathi Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-7xl py-10">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">SEO Monitoring Dashboard</h1>
              <p className="text-muted-foreground">Track organic growth, crawl efficiency, and RFQ conversions</p>
            </div>
          </div>

          {/* ─── SECTION 1: SEO HEALTH ──────────── */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" /> SEO Health
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-bold text-primary">{indexationRate}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Indexation Rate</p>
                  <p className="text-xs text-muted-foreground">{indexedCount} / {indexedTotal} pages{hasRealData ? '' : ' (estimated)'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-bold text-primary">{totalDemandPages}</p>
                  <p className="text-sm text-muted-foreground mt-1">Demand Pages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-bold text-primary">{totalComparisonPages}</p>
                  <p className="text-sm text-muted-foreground mt-1">Comparison Pages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-bold text-primary">{totalGuidePages}</p>
                  <p className="text-sm text-muted-foreground mt-1">Guide Pages</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ─── SECTION 2: TOP LANDING PAGES ───── */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> Top Landing Pages
            </h2>
            {queryHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No query data yet. Data will populate once GSC sync runs.</p>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryHistory.slice(0, 15).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-foreground">{row.query}</TableCell>
                      <TableCell>{row.clicks}</TableCell>
                      <TableCell>{row.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          {/* ─── SECTION 3: QUERY GROWTH ────────── */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Query Growth Over Time
            </h2>
            {queryGrowthChart.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No growth data available yet. Connect GSC to start tracking.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={queryGrowthChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} name="Clicks" />
                      <Line type="monotone" dataKey="impressions" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" name="Impressions" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </section>

          {/* ─── SECTION 4: INTERNAL LINK FLOW ──── */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" /> Internal Link Authority
            </h2>
            {internalLinks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No internal link data. Link tracking will populate automatically.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={internalLinks.slice(0, 15)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" />
                      <YAxis dataKey="target_slug" type="category" width={180} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="link_count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Links" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </section>

          {/* ─── SECTION 5: RFQ CONVERSIONS ─────── */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> RFQ Conversion Rate
            </h2>
            {rfqConversionTable.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No RFQ conversion data yet. Analytics will populate as organic traffic grows.</p>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Organic Visits</TableHead>
                    <TableHead>RFQs</TableHead>
                    <TableHead>Conversion %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqConversionTable.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-foreground">{row.page_slug}</TableCell>
                      <TableCell>{row.organic_visits.toLocaleString()}</TableCell>
                      <TableCell>{row.rfqs}</TableCell>
                      <TableCell>
                        <Badge variant={Number(row.conversion) > 2 ? 'default' : 'secondary'}>
                          {row.conversion}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
