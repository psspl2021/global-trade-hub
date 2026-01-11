import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Target, FileText, TrendingUp, Globe, RefreshCw, Mail, Brain, Loader2, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Lazy load heavy tab components
const AISalesLeadsManager = lazy(() => import("./AISalesLeadsManager").then(m => ({ default: m.AISalesLeadsManager })));
const AISalesMessaging = lazy(() => import("./AISalesMessaging").then(m => ({ default: m.AISalesMessaging })));
const AISalesLandingPages = lazy(() => import("./AISalesLandingPages").then(m => ({ default: m.AISalesLandingPages })));

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

interface DiscoveryJob {
  id: string;
  status: string;
  category: string;
  country: string;
  leads_found: number | null;
  completed_at: string | null;
  created_at: string;
}

const TabFallback = ({ label }: { label: string }) => (
  <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
    <Loader2 className="w-4 h-4 animate-spin" />
    Loading {label}…
  </div>
);

export function AISalesDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // AI Discovery state
  const [discoveryRunning, setDiscoveryRunning] = useState(false);
  const [lastJob, setLastJob] = useState<DiscoveryJob | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("steel");
  const [selectedCountry, setSelectedCountry] = useState("india");
  const [selectedCompanyRole, setSelectedCompanyRole] = useState("buyer");

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

  const fetchLastJob = async () => {
    try {
      const { data } = await supabase
        .from("ai_sales_discovery_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setLastJob(data as DiscoveryJob);
        setDiscoveryRunning(data.status === "running" || data.status === "pending");
      }
    } catch {
      // No jobs yet
    }
  };

  const runDiscovery = async () => {
    setDiscoveryRunning(true);
    try {
      const response = await supabase.functions.invoke("ai-sales-discover", {
        body: {
          action: "run_discovery",
          category: selectedCategory,
          country: selectedCountry,
          buyer_type: "importer",
          company_role: selectedCompanyRole,
        },
      });

      if (response.error) throw response.error;
      toast.success("AI discovery started - leads will appear shortly");
      
      // Refresh job status after a delay
      setTimeout(() => {
        fetchLastJob();
        fetchMetrics();
      }, 3000);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Discovery failed:", err);
      toast.error("Failed to start AI discovery");
      setDiscoveryRunning(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLastJob();
  }, []);

  const getStatusBadge = () => {
    if (discoveryRunning || lastJob?.status === "running") {
      return (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          <Brain className="w-3 h-3 mr-1 animate-pulse" />
          Discovering…
        </Badge>
      );
    }
    if (lastJob?.status === "completed") {
      const completedAt = lastJob.completed_at ? new Date(lastJob.completed_at) : null;
      const timeAgo = completedAt 
        ? `${Math.round((Date.now() - completedAt.getTime()) / 60000)}m ago`
        : "";
      return (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          ✅ Last run: {timeAgo} ({lastJob.leads_found || 0} leads)
        </Badge>
      );
    }
    if (lastJob?.status === "failed") {
      return (
        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
          ⚠️ Last discovery failed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        <Brain className="w-3 h-3 mr-1" />
        AI Ready
      </Badge>
    );
  };

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

  const categories = ["steel", "chemicals", "polymers", "textiles", "food-additives", "pharmaceuticals"];
  const countries = ["india", "uae", "usa", "germany", "china", "brazil", "south-africa"];
  const companyRoles = [
    { value: "buyer", label: "Buyer" },
    { value: "supplier", label: "Supplier" },
    { value: "hybrid", label: "Hybrid (Both)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">AI Sales Engine</h2>
            <p className="text-muted-foreground">Discover global buyers, generate outreach, and convert leads to RFQs</p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCompanyRole} onValueChange={setSelectedCompanyRole}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {companyRoles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={runDiscovery} 
            disabled={discoveryRunning}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {discoveryRunning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Discover Companies
          </Button>
          
          <Button onClick={fetchMetrics} variant="outline" size="icon">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
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
          <Suspense fallback={<TabFallback label="leads" />}>
            <AISalesLeadsManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="messaging">
          <Suspense fallback={<TabFallback label="messages" />}>
            <AISalesMessaging />
          </Suspense>
        </TabsContent>

        <TabsContent value="landing">
          <Suspense fallback={<TabFallback label="landing pages" />}>
            <AISalesLandingPages />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
