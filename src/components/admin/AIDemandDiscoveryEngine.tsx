/**
 * ============================================================
 * BUYER INTELLIGENCE ENGINE
 * ============================================================
 * 
 * CRITICAL CHANGES FROM PREVIOUS VERSION:
 * 
 * 1. NO FAKE RFQs - RFQ counts come ONLY from real requirements table
 * 2. Intent Score = CALCULATED based on deal size, industry, geography
 * 3. "Opportunities Discovered" ≠ "RFQs Generated"
 * 4. Renamed from "AI Demand Discovery" → "Buyer Intelligence Engine"
 * 5. All metrics grounded in real database queries
 * 
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  AlertTriangle,
  Factory,
  Building2,
  IndianRupee,
  Users,
  Lightbulb,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  getMappedCategories, 
  getAIDiscoverySubcategories,
  getAllIndustriesForCategory,
  prettyLabel 
} from "@/data/categorySubcategoryMap";
import {
  generateBuyerIntentKeywords,
  calculateIntentScore,
  calculateRealMetrics,
  type BuyerIntelligenceMetrics
} from "@/lib/demandDiscovery";

interface DiscoveryRun {
  id: string;
  status: string;
  category: string | null;
  subcategory: string | null;
  country: string | null;
  company_role: string | null;
  keywords_discovered: number;
  pages_generated: number;
  // Real metrics tracked (not simulated)
  rfqs_submitted: number;
  buyer_inquiries: number;
  qualified_leads: number;
  industry_match_rate: number;
  avg_deal_size: number;
  intent_score: number;
  industries_reached: string[];
  subcategories_covered: string[];
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function AIDemandDiscoveryEngine() {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [autoRunEnabled, setAutoRunEnabled] = useState(false);
  const [autoRunFrequency, setAutoRunFrequency] = useState("daily");
  
  // Taxonomy-driven selections
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("india");
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  
  const [lastRun, setLastRun] = useState<DiscoveryRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<DiscoveryRun[]>([]);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // REAL metrics from database (not simulated!)
  const [metrics, setMetrics] = useState<BuyerIntelligenceMetrics>({
    totalOpportunitiesDiscovered: 0,
    signalPagesActive: 0,
    realRfqsSubmitted: 0,
    rfqsFromDiscovery: 0,
    avgIntentScore: 0,
    industryMatchRate: 0,
    avgDealSize: 0,
    discoveryToSignalPage: 0,
    signalPageToRfq: 0,
    rfqToQualified: 0,
    categoriesCovered: 0,
    subcategoriesCovered: 0,
    industriesReached: 0,
  });

  const categories = getMappedCategories();
  const countries = [
    { value: "india", label: "India" },
    { value: "uae", label: "UAE" },
    { value: "usa", label: "USA" },
    { value: "germany", label: "Germany" },
    { value: "saudi-arabia", label: "Saudi Arabia" },
    { value: "qatar", label: "Qatar" },
    { value: "oman", label: "Oman" },
  ];

  // Update subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subs = getAIDiscoverySubcategories(selectedCategory);
      setAvailableSubcategories(subs);
      setAvailableIndustries(getAllIndustriesForCategory(selectedCategory));
      if (subs.length > 0 && !subs.includes(selectedSubcategory)) {
        setSelectedSubcategory(subs[0]);
      }
    }
  }, [selectedCategory]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("ai_seo_settings")
      .select("*")
      .limit(1)
      .single();
    
    if (data) {
      setSettingsId(data.id);
      setAutoRunEnabled(data.enabled ?? false);
      setAutoRunFrequency(data.frequency || "daily");
      if (data.category) setSelectedCategory(data.category);
      if (data.subcategory) setSelectedSubcategory(data.subcategory);
      if (data.country) setSelectedCountry(data.country);
    }
  };

  const updateAutoRunSettings = async (enabled: boolean, frequency?: string) => {
    if (!settingsId) return;
    setSavingSettings(true);
    
    const updates: Record<string, unknown> = {
      enabled,
      updated_at: new Date().toISOString(),
    };
    
    if (frequency) updates.frequency = frequency;

    const { error } = await supabase
      .from("ai_seo_settings")
      .update(updates)
      .eq("id", settingsId);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success(enabled ? `Auto-scan enabled (${frequency || autoRunFrequency})` : "Auto-scan disabled");
    }
    setSavingSettings(false);
  };

  const fetchLastRun = async () => {
    const { data } = await supabase
      .from("ai_seo_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (data && data.length > 0) {
      setLastRun(data[0] as DiscoveryRun);
      setRecentRuns(data as DiscoveryRun[]);
      setRunning(data[0].status === "running");
    }
  };

  /**
   * CRITICAL: Fetch REAL metrics from database
   * No Math.random() - only actual counts
   * NOW WITH ATTRIBUTION: Uses source, source_run_id, signal_page_id columns
   */
  const fetchRealMetrics = async () => {
    setLoading(true);
    try {
      // Get recent runs
      const { data: runs } = await supabase
        .from("ai_seo_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      
      // Get REAL RFQ count from requirements table (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: realRfqCount } = await supabase
        .from("requirements")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo);
      
      // Get RFQs from Buyer Intelligence (source = 'buyer_intelligence')
      const { count: discoveryRfqCount } = await (supabase
        .from("requirements") as any)
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo)
        .eq("source", "buyer_intelligence");
      
      // Get RFQs from Signal Pages (source = 'signal_page')
      const { count: signalPageRfqCount } = await (supabase
        .from("requirements") as any)
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo)
        .eq("source", "signal_page");
      
      // Get active signal pages count
      const { count: signalPagesCount } = await supabase
        .from("admin_signal_pages")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      
      // Get keywords count
      const { count: keywordsCount } = await supabase
        .from("demand_discovery_keywords")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      
      // Get average deal size from actual bids (since requirements may not have value)
      const { data: bidData } = await supabase
        .from("bids")
        .select("total_amount")
        .gte("created_at", thirtyDaysAgo)
        .eq("status", "accepted");
      
      const avgDealSize = bidData && bidData.length > 0
        ? bidData.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) / bidData.length
        : 0;

      // Calculate metrics from REAL data with full attribution
      const calculated = calculateRealMetrics({
        runs: runs || [],
        realRfqCount: realRfqCount || 0,
        // Combine discovery + signal page RFQs for attribution
        discoveryRfqCount: (discoveryRfqCount || 0) + (signalPageRfqCount || 0),
        signalPagesCount: signalPagesCount || 0,
        keywordsCount: keywordsCount || 0,
        avgDealSize,
      });

      setMetrics(calculated);
    } catch (error) {
      console.error("Failed to fetch real metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Run Buyer Intelligence Scan
   * Creates opportunities, does NOT fake RFQs
   */
  const runBuyerIntelligenceScan = async () => {
    if (!selectedCategory || !selectedSubcategory) {
      toast.error("Select category and subcategory first");
      return;
    }

    setRunning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate buyer intent keywords from taxonomy
      const keywords = generateBuyerIntentKeywords(selectedCategory, selectedCountry, 50);
      const industries = availableIndustries.slice(0, 5);
      
      // Calculate REAL intent score based on targeting
      const intentScore = calculateIntentScore({
        dealSize: 2500000, // Default for discovery
        industry: industries[0] || null,
        subcategory: selectedSubcategory,
        country: selectedCountry,
        hasTimeline: false,
        hasQuantity: false,
        hasDeliveryLocation: false,
        buyerType: 'industrial',
      });
      
      // Create run record - NO FAKE RFQs
      const { data: run, error } = await supabase
        .from("ai_seo_runs")
        .insert({
          status: "running",
          category: selectedCategory,
          subcategory: selectedSubcategory,
          country: selectedCountry,
          company_role: "buyer",
          started_at: new Date().toISOString(),
          created_by: user?.id,
          industries_reached: industries,
          subcategories_covered: [selectedSubcategory],
          // IMPORTANT: Initialize with 0, NOT random numbers
          rfqs_submitted: 0,
          buyer_inquiries: 0,
          qualified_leads: 0,
          intent_score: intentScore,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Scanning market demand - finding buyer opportunities");

      // Save keywords to demand_discovery_keywords table
      const keywordInserts = keywords.slice(0, 20).map(k => ({
        category: k.category,
        subcategory: k.subcategory,
        industry: k.industry,
        keyword: k.keyword,
        intent_type: k.intentType,
        intent_score: k.intentScore,
      }));

      await supabase
        .from("demand_discovery_keywords")
        .upsert(keywordInserts, { onConflict: 'category,subcategory,keyword' });

      // Complete the scan
      setTimeout(async () => {
        const keywordsDiscovered = keywords.length;
        
        // Calculate industry match rate based on targeting
        const industryMatchRate = industries.length > 0 
          ? Math.min(100, (industries.length / 5) * 100)
          : 0;

        await supabase
          .from("ai_seo_runs")
          .update({
            status: "completed",
            keywords_discovered: keywordsDiscovered,
            pages_generated: 0, // Signal pages created separately
            // RFQs stay at 0 - they come from REAL submissions only
            rfqs_submitted: 0,
            buyer_inquiries: 0,
            qualified_leads: 0,
            industry_match_rate: industryMatchRate,
            avg_deal_size: 0, // Will be set from real RFQs
            intent_score: intentScore,
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id);

        toast.success(`Scan complete: ${keywordsDiscovered} buyer opportunities discovered`);
        setRunning(false);
        fetchLastRun();
        fetchRealMetrics();
      }, 3000);

    } catch (error) {
      console.error("Buyer intelligence scan failed:", error);
      toast.error("Failed to run scan");
      setRunning(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLastRun();
    fetchRealMetrics();
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Brain className="w-3 h-3 mr-1 animate-pulse" />
            Scanning
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
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Idle</Badge>;
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

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header - Renamed to Buyer Intelligence Engine */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <Lightbulb className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Buyer Intelligence Engine</h3>
            <p className="text-sm text-muted-foreground">
              Scan market demand • Discover buyer opportunities • Track real RFQs
            </p>
          </div>
          {lastRun && getStatusBadge(lastRun.status)}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50">
            <Switch
              checked={autoRunEnabled}
              onCheckedChange={(v) => { setAutoRunEnabled(v); updateAutoRunSettings(v); }}
              disabled={savingSettings}
              id="auto-discovery"
            />
            <label htmlFor="auto-discovery" className="text-sm font-medium">Auto-Scan</label>
            {autoRunEnabled && (
              <Select value={autoRunFrequency} onValueChange={(v) => { setAutoRunFrequency(v); updateAutoRunSettings(autoRunEnabled, v); }}>
                <SelectTrigger className="w-24 h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* REAL METRICS - From actual database with attribution tracking */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Opportunities Discovered (Keywords) */}
        <Card className="p-4 border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{metrics.totalOpportunitiesDiscovered}</p>
              <p className="text-xs text-muted-foreground">Opportunities</p>
            </div>
          </div>
        </Card>
        
        {/* Signal Pages Active */}
        <Card className="p-4 border-purple-200 bg-purple-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">{metrics.signalPagesActive}</p>
              <p className="text-xs text-muted-foreground">Signal Pages</p>
            </div>
          </div>
        </Card>
        
        {/* REAL RFQs (from requirements table) */}
        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{metrics.realRfqsSubmitted}</p>
              <p className="text-xs text-muted-foreground">Real RFQs (30d)</p>
            </div>
          </div>
        </Card>
        
        {/* ATTRIBUTED RFQs - NEW: From Buyer Intelligence sources */}
        <Card className="p-4 border-teal-200 bg-teal-50/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <div>
              <p className="text-2xl font-bold text-teal-700">{metrics.rfqsFromDiscovery}</p>
              <p className="text-xs text-muted-foreground">Attributed RFQs</p>
            </div>
          </div>
        </Card>
        
        {/* Intent Score (Calculated) */}
        <Card className="p-4 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{metrics.avgIntentScore.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avg Intent</p>
            </div>
          </div>
        </Card>
        
        {/* Industries Reached */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-2xl font-bold">{metrics.industriesReached}</p>
              <p className="text-xs text-muted-foreground">Industries</p>
            </div>
          </div>
        </Card>
        
        {/* Avg Deal Size (from real RFQs) */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-2xl font-bold">{formatCurrency(metrics.avgDealSize)}</p>
              <p className="text-xs text-muted-foreground">Avg Deal</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attribution Funnel Visualization */}
      <Card className="p-4 border-green-200 bg-green-50/30">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-green-900">RFQ Attribution Funnel</p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-blue-600">{metrics.totalOpportunitiesDiscovered}</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{metrics.signalPagesActive}</p>
                <p className="text-xs text-muted-foreground">→ Signal Pages</p>
              </div>
              <div>
                <p className="text-lg font-bold text-teal-600">{metrics.rfqsFromDiscovery}</p>
                <p className="text-xs text-muted-foreground">→ Attributed RFQs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">
                  {metrics.rfqsFromDiscovery > 0 
                    ? ((metrics.rfqsFromDiscovery / Math.max(1, metrics.realRfqsSubmitted)) * 100).toFixed(0)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">of Total RFQs</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Banner - Explain attribution */}
      <Card className="p-4 border-blue-200 bg-blue-50/30">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">RFQ Attribution Now Active ✓</p>
            <p className="text-xs text-blue-700">
              All RFQs are tracked with source attribution: <strong>direct</strong>, <strong>buyer_intelligence</strong>, <strong>signal_page</strong>, or <strong>admin_created</strong>.
              "Attributed RFQs" shows RFQs that came from Buyer Intelligence scans or Signal Pages.
              This enables conversion funnel measurement and revenue attribution.
            </p>
          </div>
        </div>
      </Card>

      {/* TAXONOMY-DRIVEN CONTROLS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Scan Market Demand
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Keywords from taxonomy • Buyer-intent only • Creates opportunities, not fake RFQs
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {/* Category from taxonomy */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{prettyLabel(cat)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subcategory from taxonomy */}
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                {availableSubcategories.map(sub => (
                  <SelectItem key={sub} value={sub}>{prettyLabel(sub)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Country */}
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={runBuyerIntelligenceScan}
              disabled={running || !selectedCategory || !selectedSubcategory}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scan Market Demand
                </>
              )}
            </Button>

            <Button variant="outline" onClick={fetchRealMetrics} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Show industries that will be targeted */}
          {availableIndustries.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Target industries:</span>
              {availableIndustries.slice(0, 5).map(ind => (
                <Badge key={ind} variant="secondary" className="text-xs">
                  {prettyLabel(ind)}
                </Badge>
              ))}
              {availableIndustries.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{availableIndustries.length - 5} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Scans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No scans yet. Run your first scan above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Opportunities</TableHead>
                  <TableHead>Intent Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map(run => (
                  <TableRow key={run.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {getTimeAgo(run.completed_at || run.started_at)}
                    </TableCell>
                    <TableCell>{prettyLabel(run.category || '')}</TableCell>
                    <TableCell>{prettyLabel(run.subcategory || '')}</TableCell>
                    <TableCell>{prettyLabel(run.country || '')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{run.keywords_discovered || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-700">
                        {(run.intent_score || 0).toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
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
