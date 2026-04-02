import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Eye, FileText, BarChart3, Clock } from "lucide-react";

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

export default function RevenueDashboard() {
  const [data, setData] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">💰 Revenue Dashboard</h1>
        <p className="text-muted-foreground mb-8">Demand pages ranked by revenue impact</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Page Performance Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet. Revenue signals will appear after demand pages receive traffic and RFQ clicks.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-3 px-2 text-muted-foreground font-medium">#</th>
                      <th className="py-3 px-2 text-muted-foreground font-medium">Page Slug</th>
                      <th className="py-3 px-2 text-muted-foreground font-medium text-right">Views</th>
                      <th className="py-3 px-2 text-muted-foreground font-medium text-right">Visitors</th>
                      <th className="py-3 px-2 text-muted-foreground font-medium text-right">RFQs</th>
                      <th className="py-3 px-2 text-muted-foreground font-medium text-right">Conv %</th>
                      <th className="py-3 px-2 text-muted-foreground font-medium text-right">Revenue Score</th>
                      <th className="py-3 px-2 text-muted-foreground font-medium text-right">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
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
                        <td className="py-3 px-2 text-right text-muted-foreground flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {row.last_activity_at ? timeAgo(row.last_activity_at) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
