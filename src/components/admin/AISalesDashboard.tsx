import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, FileText, TrendingUp, Globe, RefreshCw, Mail, MessageSquare, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AISalesLeadsManager } from "./AISalesLeadsManager";
import { AISalesMessaging } from "./AISalesMessaging";
import { AISalesLandingPages } from "./AISalesLandingPages";

interface Metrics {
  total_leads: number;
  new_leads: number;
  contacted: number;
  rfqs_created: number;
  deals_closed: number;
  avg_confidence: number;
  by_category: Record<string, number>;
  by_country: Record<string, number>;
}

export function AISalesDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("ai-sales-discover", {
        body: { action: "get_metrics" },
      });

      if (response.error) throw response.error;
      setMetrics(response.data.metrics);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Failed to fetch metrics:", err);
      toast.error("Failed to load AI Sales metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const kpiCards = [
    {
      title: "Total Leads",
      value: metrics?.total_leads || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "New Leads",
      value: metrics?.new_leads || 0,
      icon: Target,
      color: "text-green-500",
    },
    {
      title: "Contacted",
      value: metrics?.contacted || 0,
      icon: Mail,
      color: "text-yellow-500",
    },
    {
      title: "RFQs Created",
      value: metrics?.rfqs_created || 0,
      icon: FileText,
      color: "text-purple-500",
    },
    {
      title: "Deals Closed",
      value: metrics?.deals_closed || 0,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      title: "Avg Confidence",
      value: `${((metrics?.avg_confidence || 0) * 100).toFixed(0)}%`,
      icon: Globe,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Sales Engine</h2>
          <p className="text-muted-foreground">Discover global buyers, generate outreach, and convert leads to RFQs</p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="p-4">
            <div className="flex items-center gap-3">
              <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="landing">Landing Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* By Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leads by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(metrics?.by_category || {})
                    .slice(0, 10)
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-sm">{cat}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  {Object.keys(metrics?.by_category || {}).length === 0 && (
                    <p className="text-sm text-muted-foreground">No leads discovered yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* By Country */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leads by Country</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(metrics?.by_country || {})
                    .slice(0, 10)
                    .map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span className="text-sm">{country}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  {Object.keys(metrics?.by_country || {}).length === 0 && (
                    <p className="text-sm text-muted-foreground">No leads discovered yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                {[
                  { label: "Discovered", value: metrics?.total_leads || 0, color: "bg-blue-500" },
                  { label: "Contacted", value: metrics?.contacted || 0, color: "bg-yellow-500" },
                  { label: "RFQs", value: metrics?.rfqs_created || 0, color: "bg-purple-500" },
                  { label: "Closed", value: metrics?.deals_closed || 0, color: "bg-emerald-500" },
                ].map((stage, i, arr) => (
                  <div key={stage.label} className="flex-1 text-center">
                    <div
                      className={`h-16 ${stage.color} rounded flex items-center justify-center text-white font-bold text-xl`}
                    >
                      {stage.value}
                    </div>
                    <p className="text-sm mt-1">{stage.label}</p>
                    {i < arr.length - 1 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {arr[i + 1].value > 0 && stage.value > 0
                          ? `${((arr[i + 1].value / stage.value) * 100).toFixed(0)}%`
                          : "-"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <AISalesLeadsManager />
        </TabsContent>

        <TabsContent value="messaging">
          <AISalesMessaging />
        </TabsContent>

        <TabsContent value="landing">
          <AISalesLandingPages />
        </TabsContent>
      </Tabs>
    </div>
  );
}
