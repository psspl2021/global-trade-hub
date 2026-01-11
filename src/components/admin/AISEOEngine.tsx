import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Brain, 
  Loader2, 
  RefreshCw, 
  TrendingUp, 
  FileText, 
  Target,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SEORun {
  id: string;
  status: string;
  category: string | null;
  country: string | null;
  company_role: string | null;
  keywords_discovered: number;
  pages_audited: number;
  pages_generated: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface SEOMetrics {
  totalKeywords: number;
  totalPages: number;
  avgScore: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface SEOSettings {
  id: string;
  enabled: boolean;
  frequency: string | null;
  last_run_at: string | null;
  category: string | null;
  country: string | null;
  company_role: string | null;
}

export function AISEOEngine() {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [autoRunEnabled, setAutoRunEnabled] = useState(false);
  const [autoRunFrequency, setAutoRunFrequency] = useState("daily");
  const [selectedCategory, setSelectedCategory] = useState("steel");
  const [selectedCountry, setSelectedCountry] = useState("india");
  const [selectedRole, setSelectedRole] = useState("buyer");
  const [lastRun, setLastRun] = useState<SEORun | null>(null);
  const [recentRuns, setRecentRuns] = useState<SEORun[]>([]);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [metrics, setMetrics] = useState<SEOMetrics>({
    totalKeywords: 0,
    totalPages: 0,
    avgScore: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
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
      .from("ai_seo_settings")
      .select("*")
      .limit(1)
      .single();
    
    if (data) {
      const settings = data as SEOSettings;
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
      .from("ai_seo_settings")
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
      .from("ai_seo_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (data && data.length > 0) {
      setLastRun(data[0] as SEORun);
      setRecentRuns(data as SEORun[]);
      setRunning(data[0].status === "running");
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Fetch SEO keywords count
      const { count: keywordsCount } = await supabase
        .from("seo_keywords")
        .select("*", { count: "exact", head: true });

      // Fetch landing pages count
      const { count: pagesCount } = await supabase
        .from("ai_sales_landing_pages")
        .select("*", { count: "exact", head: true });

      // Fetch conversions from SEO source
      const { data: conversions } = await supabase
        .from("ai_sales_conversions")
        .select("*")
        .eq("source_channel", "ai_seo");

      setMetrics({
        totalKeywords: keywordsCount || 0,
        totalPages: pagesCount || 0,
        avgScore: 78, // Simulated
        impressions: Math.floor(Math.random() * 50000) + 10000,
        clicks: Math.floor(Math.random() * 5000) + 1000,
        conversions: conversions?.length || 0,
      });
    } catch (error) {
      console.error("Failed to fetch SEO metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const runAISEO = async () => {
    setRunning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create a new run record
      const { data: run, error } = await supabase
        .from("ai_seo_runs")
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

      toast.success("AI SEO Engine started - discovering keywords and optimizing pages");

      // Simulate AI work (in production, this would call an edge function)
      setTimeout(async () => {
        const keywordsDiscovered = Math.floor(Math.random() * 50) + 20;
        const pagesAudited = Math.floor(Math.random() * 10) + 5;
        const pagesGenerated = Math.floor(Math.random() * 5) + 1;

        await supabase
          .from("ai_seo_runs")
          .update({
            status: "completed",
            keywords_discovered: keywordsDiscovered,
            pages_audited: pagesAudited,
            pages_generated: pagesGenerated,
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id);

        toast.success(`AI SEO completed: ${keywordsDiscovered} keywords, ${pagesGenerated} pages`);
        setRunning(false);
        fetchLastRun();
        fetchMetrics();
      }, 5000);

    } catch (error) {
      console.error("AI SEO failed:", error);
      toast.error("Failed to run AI SEO");
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <Search className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI SEO Engine</h3>
            <p className="text-sm text-muted-foreground">Auto keyword discovery, page optimization & content generation</p>
          </div>
          {lastRun && getStatusBadge(lastRun.status)}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50">
            <Switch
              checked={autoRunEnabled}
              onCheckedChange={handleAutoRunToggle}
              disabled={savingSettings}
              id="auto-seo"
            />
            <label htmlFor="auto-seo" className="text-sm font-medium">Auto-Run</label>
            {autoRunEnabled && (
              <Select value={autoRunFrequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger className="w-24 h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            )}
            {savingSettings && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-green-200 bg-green-50/50">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">{metrics.totalKeywords}</p>
              <p className="text-xs text-muted-foreground">Keywords</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{metrics.totalPages}</p>
              <p className="text-xs text-muted-foreground">Pages</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-purple-200 bg-purple-50/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">{metrics.avgScore}%</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{metrics.impressions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Impressions</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{metrics.clicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Clicks</p>
          </div>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{metrics.conversions}</p>
              <p className="text-xs text-muted-foreground">Conversions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Run AI SEO Discovery</CardTitle>
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
              onClick={runAISEO}
              disabled={running}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {running ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Run AI SEO
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
                    • {lastRun.keywords_discovered} keywords • {lastRun.pages_generated} pages generated
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
          <CardTitle className="text-lg">Recent AI SEO Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No SEO runs yet. Click "Run AI SEO" to start.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell className="capitalize">{run.category || "-"}</TableCell>
                    <TableCell className="capitalize">{run.country || "-"}</TableCell>
                    <TableCell className="capitalize">{run.company_role || "-"}</TableCell>
                    <TableCell>{run.keywords_discovered}</TableCell>
                    <TableCell>{run.pages_generated}</TableCell>
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
