import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, Eye, FileText, BarChart3, Clock, ArrowUp, ArrowDown, Search } from "lucide-react";

type SortKey = "slug" | "views" | "unique_visitors" | "rfq_clicks" | "conversion_rate" | "revenue_score" | "last_activity_at";
type SortDir = "asc" | "desc";

interface DashboardRow {
  slug: string;
  views: number;
  unique_visitors: number;
  rfq_clicks: number;
  conversion_rate: number;
  last_activity_at: string;
  revenue_score: number;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RevenueDashboardView() {
  const [data, setData] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("revenue_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    (async () => {
      const { data: rows, error } = await supabase
        .from("demand_revenue_dashboard" as any)
        .select("*")
        .order("revenue_score", { ascending: false })
        .limit(50);

      if (!error && rows) setData(rows as unknown as DashboardRow[]);
      setLoading(false);
    })();
  }, []);

  const totalViews = data.reduce((s, d) => s + (d.views || 0), 0);
  const totalRFQs = data.reduce((s, d) => s + (d.rfq_clicks || 0), 0);
  const avgConversion = data.length
    ? (data.reduce((s, d) => s + (d.conversion_rate || 0), 0) / data.length).toFixed(2)
    : "0";

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? data.filter((d) => d.slug?.toLowerCase().includes(q)) : data;
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (sortKey === "slug") {
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      }
      if (sortKey === "last_activity_at") {
        const at = av ? new Date(av as string).getTime() : 0;
        const bt = bv ? new Date(bv as string).getTime() : 0;
        return sortDir === "asc" ? at - bt : bt - at;
      }
      const an = Number(av) || 0;
      const bn = Number(bv) || 0;
      return sortDir === "asc" ? an - bn : bn - an;
    });
    return sorted;
  }, [data, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "slug" ? "asc" : "desc");
    }
  };

  const SortHeader = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <th className={`py-3 px-2 text-muted-foreground font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${align === "right" ? "justify-end w-full" : ""}`}
      >
        {label}
        {sortKey === k && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">💰 Revenue Dashboard</h2>
        <p className="text-muted-foreground">Demand pages ranked by revenue impact</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Pages</p>
              <p className="text-2xl font-bold text-foreground">{data.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Eye className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total RFQs</p>
              <p className="text-2xl font-bold text-foreground">{totalRFQs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Conversion</p>
              <p className="text-2xl font-bold text-foreground">{avgConversion}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Page Performance Ranking</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 px-2 text-muted-foreground font-medium">#</th>
                    <SortHeader k="slug" label="Page Slug" />
                    <SortHeader k="views" label="Views" align="right" />
                    <SortHeader k="unique_visitors" label="Visitors" align="right" />
                    <SortHeader k="rfq_clicks" label="RFQs" align="right" />
                    <SortHeader k="conversion_rate" label="Conv %" align="right" />
                    <SortHeader k="revenue_score" label="Revenue Score" align="right" />
                    <SortHeader k="last_activity_at" label="Last Active" align="right" />
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-muted-foreground">
                        No pages match "{search}".
                      </td>
                    </tr>
                  ) : (
                    filteredSorted.map((row, i) => (
                      <tr key={row.slug} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-3 px-2 font-medium text-foreground capitalize">{row.slug.replace(/-/g, " ")}</td>
                        <td className="py-3 px-2 text-right text-foreground">{row.views.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right text-foreground">{row.unique_visitors.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right text-foreground">{row.rfq_clicks}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`font-medium ${row.conversion_rate > 2 ? "text-green-600" : "text-foreground"}`}>
                            {row.conversion_rate}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="font-bold text-primary">{row.revenue_score}</span>
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground">
                          <span className="inline-flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" />
                            {row.last_activity_at ? timeAgo(row.last_activity_at) : "—"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
        </CardContent>
      </Card>
    </div>
  );
}
