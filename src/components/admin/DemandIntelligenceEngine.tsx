/**
 * ============================================================
 * EXTERNAL DEMAND INTELLIGENCE ENGINE - ADMIN COMMAND CENTER
 * ============================================================
 * 
 * This component provides the admin interface for managing demand
 * intelligence signals. It allows admins to:
 * 
 * 1. View ranked demand signals with priority levels
 * 2. See multi-dimensional scores (intent, urgency, value, feasibility)
 * 3. Approve signals for RFQ conversion with one click
 * 4. Configure auto-RFQ thresholds
 * 5. Monitor conversion funnel metrics
 * 
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Loader2, 
  RefreshCw, 
  TrendingUp, 
  Target,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Factory,
  IndianRupee,
  Eye,
  Play,
  Settings,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  BarChart3,
  Filter,
  Check,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  getMappedCategories, 
  getAIDiscoverySubcategories,
  getAllIndustriesForCategory 
} from "@/data/categorySubcategoryMap";
import {
  calculateAllScores,
  checkSupplierAvailability,
  createDemandSignal,
  calculateDIMetrics,
  convertSignalToInternalRFQ,
  executeAutoRFQIfQualified,
  type DemandSignal,
  type DISettings,
  type DIMetrics,
  type ScoreFactors
} from "@/lib/demandIntelligence";

interface Signal {
  id: string;
  classification: string;
  signal_source: string;
  category: string | null;
  subcategory: string | null;
  industry: string | null;
  product_description: string | null;
  estimated_value: number | null;
  delivery_location: string | null;
  delivery_timeline_days: number | null;
  intent_score: number | null;
  urgency_score: number | null;
  value_score: number | null;
  feasibility_score: number | null;
  matching_suppliers_count: number | null;
  fulfilment_feasible: boolean | null;
  decision_action: string | null;
  converted_to_rfq_id: string | null;
  discovered_at: string | null;
  created_at: string | null;
}

export function DemandIntelligenceEngine() {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [metrics, setMetrics] = useState<DIMetrics | null>(null);
  const [settings, setSettings] = useState<DISettings | null>(null);
  const [activeTab, setActiveTab] = useState("signals");
  
  // Scan parameters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("india");
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  
  // Filter states
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  
  const categories = getMappedCategories();
  const countries = [
    { value: "india", label: "India" },
    { value: "uae", label: "UAE" },
    { value: "usa", label: "USA" },
    { value: "germany", label: "Germany" },
    { value: "saudi-arabia", label: "Saudi Arabia" },
  ];

  // Update subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subs = getAIDiscoverySubcategories(selectedCategory);
      setAvailableSubcategories(subs);
      if (subs.length > 0) {
        setSelectedSubcategory(subs[0]);
      }
    }
  }, [selectedCategory]);

  // Initial data fetch
  useEffect(() => {
    fetchSignals();
    fetchSettings();
    fetchMetrics();
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, []);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('demand_intelligence_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (classificationFilter !== 'all') {
        query = query.eq('classification', classificationFilter);
      }
      if (decisionFilter !== 'all') {
        query = query.eq('decision_action', decisionFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setSignals(data || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('demand_intelligence_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (data) {
        setSettings({
          id: data.id,
          autoRfqMinScore: Number(data.auto_rfq_min_score) || 8.0,
          adminReviewMinScore: Number(data.admin_review_min_score) || 5.0,
          buyClassificationMinScore: Number(data.buy_classification_min_score) || 7.0,
          requireSupplierAvailability: data.require_supplier_availability ?? true,
          minMatchingSuppliers: data.min_matching_suppliers ?? 1,
          minSupplierMatchScore: Number(data.min_supplier_match_score) || 6.0,
          enabledCategories: (data.enabled_categories as string[]) || [],
          enabledCountries: (data.enabled_countries as string[]) || ['india'],
          enabled: data.enabled ?? false,
          frequency: (data.frequency as 'hourly' | 'daily' | 'weekly') || 'daily',
          lastRunAt: data.last_run_at ?? undefined,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const metricsData = await calculateDIMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const runDemandScan = async () => {
    if (!selectedCategory || !selectedSubcategory) {
      toast.error("Select category and subcategory first");
      return;
    }
    
    setRunning(true);
    try {
      toast.info("Scanning for demand signals...");
      
      // Check supplier availability
      const supplierData = await checkSupplierAvailability(
        selectedCategory,
        selectedSubcategory,
        selectedCountry
      );
      
      // Generate sample signals based on category/subcategory
      const industries = getAllIndustriesForCategory(selectedCategory);
      const sampleIndustry = industries[0] || 'general';
      
      // Calculate scores for this opportunity
      const scoreFactors: ScoreFactors = {
        estimatedValue: 2500000, // Default 25L
        category: selectedCategory,
        subcategory: selectedSubcategory,
        industry: sampleIndustry,
        country: selectedCountry,
        deliveryTimelineDays: 30,
        buyerType: 'industrial',
        matchingSuppliersCount: supplierData.count,
        avgSupplierMatchScore: supplierData.bestMatchScore,
      };
      
      const scores = calculateAllScores(scoreFactors);
      
      // Create the signal
      const signal = await createDemandSignal({
        signalSource: 'keyword_scan',
        confidenceScore: scores.overallScore,
        intentScore: scores.intentScore,
        urgencyScore: scores.urgencyScore,
        valueScore: scores.valueScore,
        feasibilityScore: scores.feasibilityScore,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        industry: sampleIndustry,
        productDescription: `${selectedSubcategory} for ${sampleIndustry} project in ${selectedCountry}`,
        estimatedValue: 2500000,
        deliveryLocation: selectedCountry === 'india' ? 'Mumbai, Maharashtra' : selectedCountry,
        deliveryTimelineDays: 30,
        buyerType: 'industrial',
        matchingSuppliersCount: supplierData.count,
        bestSupplierMatchScore: supplierData.bestMatchScore,
        fulfilmentFeasible: supplierData.feasible,
      }, settings || undefined);
      
      if (signal) {
        toast.success(`Signal discovered: ${signal.classification.toUpperCase()} (Score: ${signal.overallScore?.toFixed(1)})`);
      }
      
      // Refresh data
      await fetchSignals();
      await fetchMetrics();
      
    } catch (error) {
      console.error('Demand scan failed:', error);
      toast.error('Scan failed');
    } finally {
      setRunning(false);
    }
  };

  const approveSignal = async (signalId: string) => {
    try {
      // Find the signal data
      const signal = signals.find(s => s.id === signalId);
      if (!signal) {
        toast.error('Signal not found');
        return;
      }
      
      // Convert signal to DemandSignal format for RFQ creation
      const demandSignal: DemandSignal = {
        id: signal.id,
        signalSource: signal.signal_source as any,
        classification: signal.classification as any,
        confidenceScore: getOverallScore(signal),
        intentScore: signal.intent_score || 0,
        urgencyScore: signal.urgency_score || 0,
        valueScore: signal.value_score || 0,
        feasibilityScore: signal.feasibility_score || 0,
        category: signal.category || '',
        subcategory: signal.subcategory || '',
        industry: signal.industry || '',
        productDescription: signal.product_description || '',
        estimatedQuantity: 1,
        estimatedUnit: 'MT',
        estimatedValue: signal.estimated_value || 0,
        deliveryLocation: signal.delivery_location || 'India',
        deliveryTimelineDays: signal.delivery_timeline_days || 30,
        matchingSuppliersCount: signal.matching_suppliers_count || 0,
        bestSupplierMatchScore: 0,
        fulfilmentFeasible: signal.fulfilment_feasible || false,
        decisionAction: 'auto_rfq',
      };
      
      toast.info('Creating internal RFQ...');
      
      // Actually create the RFQ!
      const result = await convertSignalToInternalRFQ(demandSignal);
      
      if (result.success) {
        toast.success(`✅ RFQ created successfully! ID: ${result.rfqId?.substring(0, 8)}...`);
      } else {
        toast.error(`Failed: ${result.error}`);
      }
      
      fetchSignals();
      fetchMetrics();
    } catch (error) {
      console.error('Error approving signal:', error);
      toast.error('Failed to convert signal to RFQ');
    }
  };

  const ignoreSignal = async (signalId: string) => {
    try {
      const { error } = await supabase
        .from('demand_intelligence_signals')
        .update({
          decision_action: 'ignore',
          decision_made_at: new Date().toISOString(),
        })
        .eq('id', signalId);
      
      if (error) throw error;
      
      toast.success('Signal ignored');
      fetchSignals();
    } catch (error) {
      console.error('Error ignoring signal:', error);
      toast.error('Failed to ignore signal');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      const { error } = await supabase
        .from('demand_intelligence_settings')
        .update({
          auto_rfq_min_score: settings.autoRfqMinScore,
          admin_review_min_score: settings.adminReviewMinScore,
          require_supplier_availability: settings.requireSupplierAvailability,
          min_matching_suppliers: settings.minMatchingSuppliers,
          enabled: settings.enabled,
          frequency: settings.frequency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);
      
      if (error) throw error;
      toast.success('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'buy':
        return <Badge className="bg-green-100 text-green-700 border-green-200">BUY</Badge>;
      case 'research':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">RESEARCH</Badge>;
      case 'noise':
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">NOISE</Badge>;
      default:
        return <Badge variant="outline">{classification}</Badge>;
    }
  };

  const getDecisionBadge = (decision: string | null) => {
    switch (decision) {
      case 'auto_rfq':
        return <Badge className="bg-emerald-100 text-emerald-700">Auto-RFQ</Badge>;
      case 'admin_review':
        return <Badge className="bg-amber-100 text-amber-700">Review</Badge>;
      case 'ignore':
        return <Badge className="bg-gray-100 text-gray-500">Ignored</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getOverallScore = (signal: Signal): number => {
    const { intent_score, urgency_score, value_score, feasibility_score } = signal;
    return ((intent_score || 0) + (urgency_score || 0) + (value_score || 0) + (feasibility_score || 0)) / 4;
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  const getTimeAgo = (date: string | null) => {
    if (!date) return "Never";
    const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  /**
   * Calculate expected margin based on deal value and scores
   * Higher feasibility + value score = higher margin potential
   */
  const calculateExpectedMargin = (signal: Signal): { percent: number; amount: number } => {
    const value = signal.estimated_value || 0;
    const feasibility = signal.feasibility_score || 0;
    const valueScore = signal.value_score || 0;
    
    // Base margin 3-8% depending on scores
    let marginPercent = 3; // Base 3%
    
    // Feasibility bonus (good suppliers = better negotiation)
    if (feasibility >= 8) marginPercent += 2;
    else if (feasibility >= 6) marginPercent += 1.5;
    else if (feasibility >= 4) marginPercent += 1;
    
    // Value bonus (larger deals = more margin opportunity)
    if (valueScore >= 8) marginPercent += 2;
    else if (valueScore >= 6) marginPercent += 1.5;
    else if (valueScore >= 4) marginPercent += 1;
    
    // Cap at 8%
    marginPercent = Math.min(8, marginPercent);
    
    return {
      percent: marginPercent,
      amount: Math.round(value * marginPercent / 100),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <Brain className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">External Demand Intelligence</h3>
            <p className="text-sm text-muted-foreground">
              Signal Detection → Classification → Scoring → Auto-RFQ Pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => { fetchSignals(); fetchMetrics(); }} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="p-4 border-blue-200 bg-blue-50/50">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{metrics.totalSignalsToday}</p>
                <p className="text-xs text-muted-foreground">Signals Today</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-green-200 bg-green-50/50">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{metrics.buySignalsToday}</p>
                <p className="text-xs text-muted-foreground">BUY Signals</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-700">{metrics.autoRfqsCreated}</p>
                <p className="text-xs text-muted-foreground">Auto-RFQs</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-amber-200 bg-amber-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{metrics.pendingReview}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{metrics.avgOverallScore.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{metrics.avgFeasibilityScore.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Feasibility</p>
            </div>
          </Card>
          
          <Card className="p-4 border-purple-200 bg-purple-50/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{metrics.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="signals">Demand Signals</TabsTrigger>
          <TabsTrigger value="scan">Run Scan</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Signals Tab */}
        <TabsContent value="signals" className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={classificationFilter} onValueChange={setClassificationFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="buy">BUY</SelectItem>
                  <SelectItem value="research">RESEARCH</SelectItem>
                  <SelectItem value="noise">NOISE</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="admin_review">Review</SelectItem>
                  <SelectItem value="auto_rfq">Auto-RFQ</SelectItem>
                  <SelectItem value="ignore">Ignored</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={fetchSignals} size="sm" variant="outline">
                Apply
              </Button>
            </div>
          </Card>

          {/* Signals Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demand Signals</CardTitle>
              <CardDescription>
                Ranked by overall score. High priority signals require immediate action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No demand signals detected yet.</p>
                  <p className="text-sm">Run a scan to discover buyer opportunities.</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Classification</TableHead>
                        <TableHead>Category / Product</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Est. Margin</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead>Suppliers</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signals.map((signal) => {
                        const overallScore = getOverallScore(signal);
                        const isHighPriority = overallScore >= 8.0 && signal.fulfilment_feasible;
                        const margin = calculateExpectedMargin(signal);
                        const isConverted = signal.converted_to_rfq_id != null;
                        
                        return (
                          <TableRow 
                            key={signal.id}
                            className={isHighPriority ? 'bg-green-50/50' : isConverted ? 'bg-blue-50/30' : ''}
                          >
                            <TableCell>{getClassificationBadge(signal.classification)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium capitalize">{signal.subcategory || signal.category}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-48">
                                  {signal.product_description}
                                </p>
                                {signal.delivery_location && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Truck className="w-3 h-3" /> {signal.delivery_location}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(signal.estimated_value)}
                            </TableCell>
                            <TableCell>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(margin.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ~{margin.percent}%
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <Badge 
                                  className={`${overallScore >= 8 ? 'bg-green-600' : overallScore >= 6 ? 'bg-amber-500' : 'bg-gray-400'}`}
                                >
                                  {overallScore.toFixed(1)}
                                </Badge>
                                <div className="flex gap-0.5 text-[10px]">
                                  <span title="Intent">I:{(signal.intent_score || 0).toFixed(0)}</span>
                                  <span title="Urgency">U:{(signal.urgency_score || 0).toFixed(0)}</span>
                                  <span title="Value">V:{(signal.value_score || 0).toFixed(0)}</span>
                                  <span title="Feasibility">F:{(signal.feasibility_score || 0).toFixed(0)}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Factory className="w-3 h-3 text-muted-foreground" />
                                <span className={signal.fulfilment_feasible ? 'text-green-600 font-medium' : 'text-red-500'}>
                                  {signal.matching_suppliers_count || 0}
                                </span>
                                {signal.fulfilment_feasible && (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getDecisionBadge(signal.decision_action)}</TableCell>
                            <TableCell>
                              {isConverted ? (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">RFQ Created</span>
                                </div>
                              ) : signal.decision_action === 'pending' || signal.decision_action === 'admin_review' ? (
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                                    onClick={() => approveSignal(signal.id)}
                                  >
                                    <Zap className="w-3 h-3 mr-1" />
                                    Execute
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-gray-400 hover:bg-gray-50"
                                    onClick={() => ignoreSignal(signal.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : signal.decision_action === 'ignore' ? (
                                <span className="text-xs text-muted-foreground">Ignored</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {getTimeAgo(signal.created_at)}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scan Tab */}
        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run Demand Scan</CardTitle>
              <CardDescription>
                Scan market for demand signals in selected category and region
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/[_-]/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub.charAt(0).toUpperCase() + sub.slice(1).replace(/[_-]/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={runDemandScan}
                disabled={running || !selectedCategory || !selectedSubcategory}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {running ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Run Demand Scan
              </Button>
              
              <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium mb-2">What happens during a scan:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Checks supplier availability for the selected product</li>
                  <li>Calculates multi-dimensional scores (intent, urgency, value, feasibility)</li>
                  <li>Classifies signal as BUY, RESEARCH, or NOISE</li>
                  <li>Determines action: Auto-RFQ (≥8.0), Review (≥5.0), or Ignore (&lt;5.0)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Intelligence Engine Settings
              </CardTitle>
              <CardDescription>
                Configure thresholds for auto-RFQ creation and signal classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  {/* Auto-Run Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Auto-Run Enabled</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically scan for demand signals
                      </p>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
                    />
                  </div>
                  
                  {settings.enabled && (
                    <div className="space-y-2">
                      <Label>Scan Frequency</Label>
                      <Select 
                        value={settings.frequency} 
                        onValueChange={(v: 'hourly' | 'daily' | 'weekly') => setSettings({ ...settings, frequency: v })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Thresholds */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Decision Thresholds</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Auto-RFQ Minimum Score (Conservative: 8.0)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={settings.autoRfqMinScore}
                          onChange={(e) => setSettings({ ...settings, autoRfqMinScore: parseFloat(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Signals above this score are automatically converted to internal RFQs
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Admin Review Minimum Score</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={settings.adminReviewMinScore}
                          onChange={(e) => setSettings({ ...settings, adminReviewMinScore: parseFloat(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Signals between this and auto-RFQ go to admin review
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fulfilment Requirements */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Fulfilment Requirements</h4>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">Require Supplier Availability</p>
                        <p className="text-sm text-muted-foreground">
                          Only create RFQs if matching suppliers exist
                        </p>
                      </div>
                      <Switch
                        checked={settings.requireSupplierAvailability}
                        onCheckedChange={(v) => setSettings({ ...settings, requireSupplierAvailability: v })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Minimum Matching Suppliers</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.minMatchingSuppliers}
                        onChange={(e) => setSettings({ ...settings, minMatchingSuppliers: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <Button onClick={saveSettings} className="w-full">
                    Save Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
