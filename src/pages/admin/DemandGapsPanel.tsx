import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getTopMissingSlugs, type MissingSlugInsight } from '@/utils/missingSlugs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Flame, AlertTriangle, TrendingUp, BarChart3, Clock } from 'lucide-react';

const HOT_THRESHOLD = 5;
const MEDIUM_THRESHOLD = 3;

function PriorityBadge({ count }: { count: number }) {
  if (count >= HOT_THRESHOLD) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Flame className="h-3 w-3" /> High
      </Badge>
    );
  }
  if (count >= MEDIUM_THRESHOLD) {
    return (
      <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <AlertTriangle className="h-3 w-3" /> Medium
      </Badge>
    );
  }
  return <Badge variant="outline">Low</Badge>;
}

function timeAgo(ts: number): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DemandGapsPanel() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const slugs = useMemo(() => getTopMissingSlugs(50), []);

  const categories = useMemo(() => {
    const cats = new Set(slugs.map((s) => s.category));
    return ['all', ...Array.from(cats).sort()];
  }, [slugs]);

  const filtered = useMemo(
    () => categoryFilter === 'all' ? slugs : slugs.filter((s) => s.category === categoryFilter),
    [slugs, categoryFilter]
  );

  const stats = useMemo(() => {
    const hot = slugs.filter((s) => s.count >= HOT_THRESHOLD).length;
    const medium = slugs.filter((s) => s.count >= MEDIUM_THRESHOLD && s.count < HOT_THRESHOLD).length;
    const totalHits = slugs.reduce((sum, s) => sum + s.count, 0);
    return { total: slugs.length, hot, medium, totalHits };
  }, [slugs]);

  return (
    <>
      <Helmet>
        <title>Demand Gaps | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Missing Demand Gaps</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Top product slugs users searched but no page exists — ranked by frequency × recency.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" /> Tracked Gaps
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{stats.total}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Total Hits
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{stats.totalHits}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <Flame className="h-4 w-4" /> High Priority
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-destructive">{stats.hot}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Medium
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.medium}</p></CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Category:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Hits</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Last Seen</span>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      No demand gaps tracked yet. Data populates as users visit missing product pages.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item, i) => (
                    <TableRow key={item.slug}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-sm text-foreground">{item.slug}</TableCell>
                      <TableCell className="text-center font-semibold text-foreground">{item.count}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{timeAgo(item.lastSeen)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <PriorityBadge count={item.count} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
