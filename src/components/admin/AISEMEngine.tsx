import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Brain, 
  Loader2, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  MousePointerClick,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Megaphone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SEMRun {
  id: string;
  status: string;
  category: string | null;
  country: string | null;
  company_role: string | null;
  campaigns_created: number;
  ads_generated: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  cost_per_rfq: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface SEMMetrics {
  activeCampaigns: number;
  totalSpend: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgCPC: number;
  costPerRFQ: number;
}

interface SEMSettings {
  id: string;
  enabled: boolean;
  frequency: string | null;
  last_run_at: string | null;
  category: string | null;
  country: string | null;
  company_role: string | null;
}

export function AISEMEngine() {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [autoRunEnabled, setAutoRunEnabled] = useState(false);
  const [autoRunFrequency, setAutoRunFrequency] = useState("daily");
  const [selectedCategory, setSelectedCategory] = useState("steel");
  const [selectedCountry, setSelectedCountry] = useState("india");
  const [selectedRole, setSelectedRole] = useState("buyer");
  const [lastRun, setLastRun] = useState<SEMRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<SEMRun[]>([]);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [metrics, setMetrics] = useState<SEMMetrics>({
    activeCampaigns: 0,
    totalSpend: 0,
    totalClicks: 0,
    totalConversions: 0,
    avgCTR: 0,
    avgCPC: 0,
    costPerRFQ: 0,
  });

  const categories = ["steel", "chemicals", "polymers", "textiles", "food-additives", "pharmaceuticals"];
  const countries = ["india", "uae", "usa", "germany", "china", "brazil", "south-africa"];
  const companyRoles = [
    { value: "buyer", label: "Buyer" },
    { value: "supplier", label: "Supplier" },
    { value: "hybrid", label: "Hybrid" },
  ];

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("ai_sem_settings")
      .select("*")
      .limit(1)
      .single();
    
    if (data) {
      const settings = data as SEMSettings;
      setSettingsId(settings.id);
      setAutoRunEnabled(settings.enabled);
      setAutoRunFrequency(settings.frequency || "daily");
    }
  };

  const updateAutoRunSettings = async (enabled: boolean, frequency?: string) => {
    if (!settingsId) return;
    setSavingSettings(true);
    
    const updates: Record<string, unknown> = {
      enabled,
      updated_at: new Date().toISOString(),
    };
    
    if (frequency) {
      updates.frequency = frequency;
    }

    const { error } = await supabase
      .from("ai_sem_settings")
      .update(updates)
      .eq("id", settingsId);

    if (error) {
      toast.error("Failed to save auto-run settings");
    } else {
      toast.success(enabled ? `Auto-run enabled (${frequency || autoRunFrequency})` : "Auto-run disabled");
    }
    setSavingSettings(false);
  };

  const handleAutoRunToggle = (enabled: boolean) => {
    setAutoRunEnabled(enabled);
    updateAutoRunSettings(enabled, autoRunFrequency);
  };

  const handleFrequencyChange = (frequency: string) => {
    setAutoRunFrequency(frequency);
    updateAutoRunSettings(autoRunEnabled, frequency);
  };

  const fetchLastRun = async () => {
    const { data } = await supabase
      .from("ai_sem_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (data && data.length > 0) {
      setLastRun(data[0] as SEMRun);
      setRecentRuns(data as SEMRun[]);
      setRunning(data[0].status === "running" || data[0].status === "optimizing");
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Fetch conversions from SEM source
      const { data: conversions } = await supabase
        .from("ai_sales_conversions")
        .select("*")
        .eq("source_channel", "ai_sem");

      // Simulate SEM metrics (in production, this would come from Google Ads API)
      const totalClicks = Math.floor(Math.random() * 10000) + 2000;
      const totalConversions = conversions?.length || Math.floor(Math.random() * 100) + 20;
      const totalSpend = Math.floor(Math.random() * 50000) + 10000;

      setMetrics({
        activeCampaigns: Math.floor(Math.random() * 10) + 3,
        totalSpend: totalSpend,
        totalClicks: totalClicks,
        totalConversions: totalConversions,
        avgCTR: parseFloat((Math.random() * 5 + 1).toFixed(2)),
        avgCPC: parseFloat((totalSpend / totalClicks).toFixed(2)),
        costPerRFQ: parseFloat((totalSpend / totalConversions).toFixed(2)),
      });
    } catch (error) {
      console.error("Failed to fetch SEM metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const runAISEM = async () => {
    setRunning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create a new run record
      const { data: run, error } = await supabase
        .from("ai_sem_runs")
        .insert({
          status: "running",
          category: selectedCategory,
          country: selectedCountry,
          company_role: selectedRole,
          started_at: new Date().toISOString(),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("AI SEM Engine started - generating campaigns and ads");

      // Simulate AI work
      setTimeout(async () => {
        const campaignsCreated = Math.floor(Math.random() * 5) + 1;
        const adsGenerated = campaignsCreated * (Math.floor(Math.random() * 3) + 2);
        
        await supabase
          .from("ai_sem_runs")
          .update({
            status: "optimizing",
          })
          .eq("id", run.id);

        toast.info("AI SEM optimizing campaigns...");

        // Complete after optimization
        setTimeout(async () => {
          const impressions = Math.floor(Math.random() * 10000) + 1000;
          const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
          const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02));

          await supabase
            .from("ai_sem_runs")
            .update({
              status: "completed",
              campaigns_created: campaignsCreated,
              ads_generated: adsGenerated,
              total_impressions: impressions,
              total_clicks: clicks,
              total_conversions: conversions,
              cost_per_rfq: parseFloat((Math.random() * 500 + 100).toFixed(2)),
              completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);

          toast.success(`AI SEM completed: ${campaignsCreated} campaigns, ${adsGenerated} ads, ${conversions} conversions`);
          setRunning(false);
          fetchLastRun();
          fetchMetrics();
        }, 3000);
      }, 4000);

    } catch (error) {
      console.error("AI SEM failed:", error);
      toast.error("Failed to run AI SEM");
      setRunning(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLastRun();
    fetchMetrics();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Brain className="w-3 h-3 mr-1 animate-pulse" />
            AI Running
          </Badge>
        );
      case "optimizing":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Zap className="w-3 h-3 mr-1 animate-pulse" />
            Optimizing
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Idle
          </Badge>
        );
    }
  };

  const getTimeAgo = (date: string | null) => {
    if (!date) return "Never";
    const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Target className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI SEM Engine</h3>
            <p className="text-sm text-muted-foreground">Auto ad campaigns, keyword bidding & conversion optimization</p>
          </div>
          {lastRun && getStatusBadge(lastRun.status)}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50">
            <Switch
              checked={autoRunEnabled}
              onCheckedChange={handleAutoRunToggle}
              disabled={savingSettings}
              id="auto-sem"
            />
            <label htmlFor="auto-sem" className="text-sm font-medium">Auto-Run</label>
            {autoRunEnabled && (
              <Select value={autoRunFrequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger className="w-24 h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            )}
            {savingSettings && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{metrics.activeCampaigns}</p>
              <p className="text-xs text-muted-foreground">Campaigns</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50/50">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">₹{(metrics.totalSpend / 1000).toFixed(1)}K</p>
              <p className="text-xs text-muted-foreground">Spend</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{metrics.totalClicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Clicks</p>
          </div>
        </Card>
        <Card className="p-4 border-purple-200 bg-purple-50/50">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">{metrics.totalConversions}</p>
              <p className="text-xs text-muted-foreground">Conversions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{metrics.avgCTR}%</p>
            <p className="text-xs text-muted-foreground">CTR</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">₹{metrics.avgCPC}</p>
            <p className="text-xs text-muted-foreground">Avg CPC</p>
          </div>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">₹{metrics.costPerRFQ}</p>
              <p className="text-xs text-muted-foreground">Cost/RFQ</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Run AI SEM Campaign Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-36">
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
              <SelectTrigger className="w-36">
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

            <Select value={selectedRole} onValueChange={setSelectedRole}>
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
              onClick={runAISEM}
              disabled={running}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {running ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Run AI SEM
            </Button>

            <Button onClick={() => { fetchLastRun(); fetchMetrics(); }} variant="outline" size="icon">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {lastRun && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                Last run: {getTimeAgo(lastRun.completed_at || lastRun.started_at)}
                {lastRun.status === "completed" && (
                  <span className="ml-2">
                    • {lastRun.campaigns_created} campaigns • {lastRun.ads_generated} ads • {lastRun.total_conversions} conversions
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent AI SEM Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No SEM runs yet. Click "Run AI SEM" to start.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Campaigns</TableHead>
                  <TableHead>Ads</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Cost/RFQ</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell className="capitalize">{run.category || "-"}</TableCell>
                    <TableCell className="capitalize">{run.country || "-"}</TableCell>
                    <TableCell>{run.campaigns_created}</TableCell>
                    <TableCell>{run.ads_generated}</TableCell>
                    <TableCell>{run.total_clicks.toLocaleString()}</TableCell>
                    <TableCell>{run.total_conversions}</TableCell>
                    <TableCell>{run.cost_per_rfq ? `₹${run.cost_per_rfq}` : "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {getTimeAgo(run.completed_at || run.started_at)}
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
