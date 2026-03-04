/**
 * Enterprise SEO Intelligence Dashboard
 * Admin-only command center for corridor, industry, trend and keyword→revenue data.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGovernanceAccess } from "@/hooks/useGovernanceAccess";
import { AccessDenied } from "@/components/purchaser/AccessDenied";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Globe, BarChart3, Search } from "lucide-react";

interface CorridorRow {
  sku_slug: string;
  country_slug: string;
  source_page_type: string;
  rfq_count: number;
  total_revenue: number;
  revenue_component: number;
}

interface IndustryRow {
  industry_slug: string;
  sub_cluster: string;
  total_revenue: number;
  total_rfqs: number;
}

interface TrendRow {
  day: string;
  revenue: number;
  rfqs: number;
}

interface SeoFunnelRow {
  keyword: string;
  landing_page: string;
  position: number;
  clicks: number;
  rfqs: number;
  revenue: number;
}

export default function AdminIntelligenceDashboard() {
  const { loading: authLoading } = useAuth();
  const { isLoading: accessLoading, isAccessDenied, primaryRole } = useGovernanceAccess();

  const [corridors, setCorridors] = useState<CorridorRow[]>([]);
  const [industries, setIndustries] = useState<IndustryRow[]>([]);
  const [trend7, setTrend7] = useState<TrendRow[]>([]);
  const [seoFunnel, setSeoFunnel] = useState<SeoFunnelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || accessLoading) return;
    if (isAccessDenied || !['ps_admin', 'admin'].includes(primaryRole)) return;

    async function load() {
      setLoading(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        if (!token) return;

        const fetchView = async (view: string) => {
          const res = await supabase.functions.invoke("admin-analytics", {
            body: { view, limit: 50 },
          });
          return res.data?.data || [];
        };

        const [c, i, t, f] = await Promise.all([
          fetchView("admin_corridor_intelligence"),
          fetchView("admin_industry_revenue"),
          fetchView("admin_revenue_trend_7d"),
          fetchView("admin_seo_funnel"),
        ]);

        setCorridors(c);
        setIndustries(i);
        setTrend7(t);
        setSeoFunnel(f);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authLoading, accessLoading, isAccessDenied, primaryRole]);

  if (authLoading || accessLoading) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (isAccessDenied || !['ps_admin', 'admin'].includes(primaryRole)) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <AccessDenied variant="404" />
        </div>
      </main>
    );
  }

  const formatCurrency = (v: number) =>
    `₹${(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Enterprise SEO Intelligence</h1>
          <p className="text-muted-foreground mt-1">Revenue-weighted demand graph command center</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Corridors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-primary" />
                  Top Revenue Corridors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {corridors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Insufficient data</p>
                ) : (
                  corridors.slice(0, 8).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm border-b border-border/50 pb-1.5">
                      <div>
                        <span className="font-medium text-foreground">{c.sku_slug}</span>
                        <span className="text-muted-foreground"> → {c.country_slug || "india"}</span>
                        <span className="text-xs text-muted-foreground ml-1">({c.source_page_type})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-foreground">{formatCurrency(c.total_revenue)}</span>
                        <span className="text-xs text-muted-foreground ml-2">{c.rfq_count} RFQs</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Industry Revenue */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Industry Revenue Rollup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {industries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Insufficient data</p>
                ) : (
                  industries.map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm border-b border-border/50 pb-1.5">
                      <div>
                        <span className="font-medium text-foreground capitalize">{i.industry_slug}</span>
                        {i.sub_cluster && (
                          <span className="text-xs text-muted-foreground ml-1">/ {i.sub_cluster}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-foreground">{formatCurrency(i.total_revenue)}</span>
                        <span className="text-xs text-muted-foreground ml-2">{i.total_rfqs} RFQs</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* 7 Day Trend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  7-Day Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {trend7.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Insufficient data</p>
                ) : (
                  trend7.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm border-b border-border/50 pb-1.5">
                      <span className="text-muted-foreground">
                        {new Date(t.day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-foreground">{formatCurrency(t.revenue)}</span>
                        <span className="text-xs text-muted-foreground ml-2">{t.rfqs} RFQs</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Keyword → Revenue */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-4 w-4 text-primary" />
                  Keyword → Revenue Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {seoFunnel.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Insufficient data</p>
                ) : (
                  seoFunnel.slice(0, 10).map((k, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm border-b border-border/50 pb-1.5">
                      <div className="truncate max-w-[55%]">
                        <span className="font-medium text-foreground">{k.keyword}</span>
                        <span className="text-xs text-muted-foreground ml-1">(Pos {k.position})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-foreground">{formatCurrency(k.revenue)}</span>
                        <span className="text-xs text-muted-foreground ml-2">{k.rfqs} RFQs</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
