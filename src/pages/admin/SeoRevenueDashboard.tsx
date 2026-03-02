import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Globe, FileText } from "lucide-react";

interface RevenueRow {
  sku_slug: string | null;
  country_slug: string | null;
  source_page_type: string | null;
  rfq_count: number;
  total_revenue: number;
}

export default function SeoRevenueDashboard() {
  const [data, setData] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: rows, error } = await supabase
        .from("seo_revenue_dashboard" as any)
        .select("*")
        .order("total_revenue", { ascending: false })
        .limit(100);

      if (!error && rows) setData(rows as unknown as RevenueRow[]);
      setLoading(false);
    })();
  }, []);

  const totalRevenue = data.reduce((s, r) => s + (r.total_revenue || 0), 0);
  const totalRFQs = data.reduce((s, r) => s + (r.rfq_count || 0), 0);

  // Group by SKU
  const bySku = new Map<string, { rfqs: number; revenue: number }>();
  data.forEach(r => {
    const key = r.sku_slug || "unknown";
    const existing = bySku.get(key) || { rfqs: 0, revenue: 0 };
    bySku.set(key, { rfqs: existing.rfqs + r.rfq_count, revenue: existing.revenue + (r.total_revenue || 0) });
  });
  const skuRanking = [...bySku.entries()].sort((a, b) => b[1].revenue - a[1].revenue);

  // Group by page type
  const byType = new Map<string, { rfqs: number; revenue: number }>();
  data.forEach(r => {
    const key = r.source_page_type || "direct";
    const existing = byType.get(key) || { rfqs: 0, revenue: 0 };
    byType.set(key, { rfqs: existing.rfqs + r.rfq_count, revenue: existing.revenue + (r.total_revenue || 0) });
  });
  const typeRanking = [...byType.entries()].sort((a, b) => b[1].revenue - a[1].revenue);

  // Group by country
  const byCountry = new Map<string, { rfqs: number; revenue: number }>();
  data.forEach(r => {
    const key = r.country_slug || "india";
    const existing = byCountry.get(key) || { rfqs: 0, revenue: 0 };
    byCountry.set(key, { rfqs: existing.rfqs + r.rfq_count, revenue: existing.revenue + (r.total_revenue || 0) });
  });
  const countryRanking = [...byCountry.entries()].sort((a, b) => b[1].revenue - a[1].revenue);

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
        <h1 className="text-3xl font-bold text-foreground mb-2">SEO Revenue Dashboard</h1>
        <p className="text-muted-foreground mb-8">Revenue attribution from SEO pages → RFQ conversions</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">SKUs Tracked</p>
                <p className="text-2xl font-bold text-foreground">{bySku.size}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By SKU */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Revenue by SKU</CardTitle></CardHeader>
            <CardContent>
              {skuRanking.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data yet. Revenue flows in after RFQ submissions with attribution tracking.</p>
              ) : (
                <div className="space-y-2">
                  {skuRanking.slice(0, 15).map(([slug, v]) => (
                    <div key={slug} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-sm font-medium text-foreground capitalize">{slug.replace(/-/g, " ")}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">₹{v.revenue.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-2">({v.rfqs} RFQs)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Page Type */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Revenue by Page Type</CardTitle></CardHeader>
            <CardContent>
              {typeRanking.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {typeRanking.map(([type, v]) => (
                    <div key={type} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-sm font-medium text-foreground capitalize">{type.replace(/-/g, " ")}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">₹{v.revenue.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-2">({v.rfqs} RFQs)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Country */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5" /> Revenue by Country Corridor</CardTitle></CardHeader>
            <CardContent>
              {countryRanking.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {countryRanking.slice(0, 12).map(([country, v]) => (
                    <div key={country} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                      <span className="text-sm font-medium text-foreground capitalize">{country.replace(/-/g, " ")}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">₹{v.revenue.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground block">{v.rfqs} RFQs</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
