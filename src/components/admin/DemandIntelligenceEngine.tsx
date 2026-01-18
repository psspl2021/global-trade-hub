/**
 * ============================================================
 * ADMIN DEMAND INTELLIGENCE COMMAND CENTER
 * ============================================================
 * 
 * PROCURESAATHI MANAGED FULFILMENT CORE LAW
 * 
 * This is NOT a CRM. This is NOT a lead dashboard.
 * This is a DECISION & REVENUE CONTROL ROOM.
 * 
 * Admins manage DEMAND, not LEADS.
 * Buyers are abstract demand sources.
 * Suppliers are execution resources.
 * 
 * Admin decisions control:
 * - Revenue
 * - Margin
 * - Risk
 * - Fulfilment
 * 
 * No admin action may:
 * ❌ Expose buyer identity
 * ❌ Expose supplier identity
 * ❌ Enable direct contact
 * 
 * Buyer → ProcureSaathi → Supplier
 * 
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  EyeOff,
  Play,
  Pause,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Truck,
  BarChart3,
  Filter,
  Check,
  X,
  Info,
  Gauge,
  TrendingDown,
  CircleDollarSign,
  Users,
  Package,
  MapPin,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  DollarSign,
  Percent,
  Building2,
  Globe
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

// ============================================================
// TYPES
// ============================================================

interface Signal {
  id: string;
  classification: string;
  signal_source: string;
  category: string | null;
  subcategory: string | null;
  industry: string | null;
  product_description: string | null;
  estimated_value: number | null;
  estimated_quantity: number | null;
  estimated_unit: string | null;
  delivery_location: string | null;
  delivery_timeline_days: number | null;
  buyer_type: string | null;
  intent_score: number | null;
  urgency_score: number | null;
  value_score: number | null;
  feasibility_score: number | null;
  overall_score: number | null;
  matching_suppliers_count: number | null;
  best_supplier_match_score: number | null;
  fulfilment_feasible: boolean | null;
  decision_action: string | null;
  decision_notes: string | null;
  converted_to_rfq_id: string | null;
  discovered_at: string | null;
  created_at: string | null;
}

interface SupplierMatch {
  supplierId: string;
  matchScore: number;
  categoryMatch: boolean;
  locationMatch: boolean;
}

interface MarginSettings {
  baseMarginPercent: number;
  riskPremiumPercent: number;
  logisticsMarkupPercent: number;
  serviceFeePercent: number;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function DemandIntelligenceEngine() {
  // Core state
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [metrics, setMetrics] = useState<DIMetrics | null>(null);
  const [settings, setSettings] = useState<DISettings | null>(null);
  const [activeTab, setActiveTab] = useState("inbox");
  
  // Signal detail view
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [showSignalDetail, setShowSignalDetail] = useState(false);
  const [supplierMatches, setSupplierMatches] = useState<SupplierMatch[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  // Margin control - persisted to database
  const [marginSettings, setMarginSettings] = useState<MarginSettings>({
    baseMarginPercent: 3,
    riskPremiumPercent: 1,
    logisticsMarkupPercent: 2,
    serviceFeePercent: 0.5
  });
  const [marginDirty, setMarginDirty] = useState(false);
  const [savingMargins, setSavingMargins] = useState(false);
  
  // Revenue at Risk - margin exposure on unsafe demand
  const [revenueAtRisk, setRevenueAtRisk] = useState<{ amount: number; signalCount: number }>({
    amount: 0,
    signalCount: 0
  });
  
  // Hold dialog
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [holdNotes, setHoldNotes] = useState("");
  const [signalToHold, setSignalToHold] = useState<Signal | null>(null);
  
  // Scan parameters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("india");
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  
  // Filters
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("pending");
  
  const categories = getMappedCategories();
  const countries = [
    { value: "india", label: "India" },
    { value: "uae", label: "UAE" },
    { value: "usa", label: "USA" },
    { value: "germany", label: "Germany" },
    { value: "saudi-arabia", label: "Saudi Arabia" },
  ];

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchSignals = useCallback(async () => {
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
  }, [classificationFilter, decisionFilter]);

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

  // ✅ FIX #2: Fetch persisted margin settings from database
  const fetchMarginSettings = async () => {
    try {
      const { data, error } = await (supabase
        .from('margin_settings') as any)
        .select('*')
        .limit(1)
        .single();
      
      if (data && !error) {
        setMarginSettings({
          baseMarginPercent: Number(data.base_margin_percent) || 3,
          riskPremiumPercent: Number(data.risk_premium_percent) || 1,
          logisticsMarkupPercent: Number(data.logistics_markup_percent) || 2,
          serviceFeePercent: Number(data.service_fee_percent) || 0.5,
        });
        setMarginDirty(false);
      }
    } catch (error) {
      console.error('Error fetching margin settings:', error);
    }
  };

  // ✅ FIX #2: Save margin settings to database
  const saveMarginSettings = async () => {
    setSavingMargins(true);
    try {
      // Get the first (and only) row, then update it
      const { data: existing } = await (supabase
        .from('margin_settings') as any)
        .select('id')
        .limit(1)
        .single();
      
      if (existing) {
        const { error } = await (supabase
          .from('margin_settings') as any)
          .update({
            base_margin_percent: marginSettings.baseMarginPercent,
            risk_premium_percent: marginSettings.riskPremiumPercent,
            logistics_markup_percent: marginSettings.logisticsMarkupPercent,
            service_fee_percent: marginSettings.serviceFeePercent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) throw error;
        toast.success('✅ Margin settings saved');
        setMarginDirty(false);
      }
    } catch (error) {
      console.error('Error saving margin settings:', error);
      toast.error('Failed to save margin settings');
    } finally {
      setSavingMargins(false);
    }
  };

  // Handle margin changes (mark as dirty)
  const updateMargin = (key: keyof MarginSettings, value: number) => {
    setMarginSettings(prev => ({ ...prev, [key]: value }));
    setMarginDirty(true);
  };

  // ============================================================
  // REVENUE AT RISK CALCULATION
  // ============================================================
  
  /**
   * Revenue at Risk = Margin exposure on demand that looks profitable 
   * but is operationally unsafe.
   * 
   * A signal is AT RISK if:
   * - fulfilment_feasible = false
   * - OR matching_suppliers_count < minMatchingSuppliers
   * - OR feasibility_score < threshold (5)
   * - AND it's still pending/admin_review (not resolved)
   */
  const calculateRevenueAtRisk = useCallback(() => {
    const totalMarginPercent = 
      marginSettings.baseMarginPercent + 
      marginSettings.riskPremiumPercent + 
      marginSettings.logisticsMarkupPercent + 
      marginSettings.serviceFeePercent;
    
    const riskySignals = signals.filter(signal => {
      // Only count pending or on-hold signals (unresolved)
      const isUnresolved = signal.decision_action === 'pending' || signal.decision_action === 'admin_review';
      if (!isUnresolved) return false;
      
      // Check risk conditions
      const lowFeasibility = (signal.feasibility_score || 0) < 5;
      const noSuppliers = !signal.fulfilment_feasible;
      const fewSuppliers = (signal.matching_suppliers_count || 0) < (settings?.minMatchingSuppliers || 1);
      
      // Signal is at risk if ANY unsafe condition is true
      return lowFeasibility || noSuppliers || fewSuppliers;
    });
    
    // Calculate margin exposure
    const totalAtRisk = riskySignals.reduce((sum, signal) => {
      const dealValue = signal.estimated_value || 0;
      const marginExposure = dealValue * (totalMarginPercent / 100);
      return sum + marginExposure;
    }, 0);
    
    setRevenueAtRisk({
      amount: Math.round(totalAtRisk),
      signalCount: riskySignals.length
    });
  }, [signals, marginSettings, settings]);
  
  // Recalculate whenever signals or margins change
  useEffect(() => {
    calculateRevenueAtRisk();
  }, [calculateRevenueAtRisk]);

  useEffect(() => {
    if (selectedCategory) {
      const subs = getAIDiscoverySubcategories(selectedCategory);
      setAvailableSubcategories(subs);
      if (subs.length > 0) {
        setSelectedSubcategory(subs[0]);
      }
    }
  }, [selectedCategory]);

  // ✅ FIX #3: Remove duplicate useEffect - keep only one initial fetch
  useEffect(() => {
    fetchSettings();
    fetchMetrics();
    fetchMarginSettings(); // ✅ Load persisted margins on boot
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch signals when filters change (includes initial mount via fetchSignals dependency)
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // ============================================================
  // SIGNAL DETAIL & SUPPLIER ALLOCATION
  // ============================================================

  const openSignalDetail = async (signal: Signal) => {
    setSelectedSignal(signal);
    setShowSignalDetail(true);
    
    // Fetch supplier matches for this signal
    if (signal.category && signal.subcategory) {
      setLoadingSuppliers(true);
      try {
        const result = await checkSupplierAvailability(
          signal.category,
          signal.subcategory,
          signal.delivery_location || undefined
        );
        setSupplierMatches(result.matches);
      } catch (error) {
        console.error('Error fetching supplier matches:', error);
      } finally {
        setLoadingSuppliers(false);
      }
    }
  };

  // ============================================================
  // ADMIN DECISIONS
  // ============================================================

  /**
   * APPROVE → CREATE INTERNAL RFQ
   * Revenue pipeline starts here
   */
  const executeSignal = async (signal: Signal) => {
    // ✅ FIX #2B: Lock execution if feasibility < threshold
    if (!signal.fulfilment_feasible) {
      toast.error("Cannot execute: No suppliers available for fulfilment");
      return;
    }
    
    try {
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
        estimatedQuantity: signal.estimated_quantity || 1,
        estimatedUnit: signal.estimated_unit || 'MT',
        estimatedValue: signal.estimated_value || 0,
        deliveryLocation: signal.delivery_location || 'India',
        deliveryTimelineDays: signal.delivery_timeline_days || 30,
        matchingSuppliersCount: signal.matching_suppliers_count || 0,
        // ✅ FIX #3: Pass through real supplier match score
        bestSupplierMatchScore: signal.best_supplier_match_score || 0,
        fulfilmentFeasible: signal.fulfilment_feasible || false,
        decisionAction: 'auto_rfq',
      };
      
      toast.info('Creating internal RFQ...');
      
      const result = await convertSignalToInternalRFQ(demandSignal);
      
      if (result.success) {
        toast.success(`✅ RFQ created! Pipeline active.`);
        setShowSignalDetail(false);
        setSelectedSignal(null);
      } else {
        toast.error(`Failed: ${result.error}`);
      }
      
      // ✅ FIX #4: Consistent refetch after mutation
      await Promise.all([fetchSignals(), fetchMetrics()]);
    } catch (error) {
      console.error('Error executing signal:', error);
      toast.error('Failed to execute signal');
    }
  };

  /**
   * HOLD FOR REVIEW
   * Admin needs more analysis
   */
  const holdSignalForReview = async () => {
    if (!signalToHold) return;
    
    try {
      const { error } = await supabase
        .from('demand_intelligence_signals')
        .update({
          decision_action: 'admin_review',
          decision_notes: holdNotes || 'Held for further review',
          decision_made_at: new Date().toISOString(),
        })
        .eq('id', signalToHold.id);
      
      if (error) throw error;
      
      toast.success('Signal held for review');
      setShowHoldDialog(false);
      setHoldNotes("");
      setSignalToHold(null);
      setShowSignalDetail(false);
      // ✅ FIX #4: Consistent refetch after mutation
      await Promise.all([fetchSignals(), fetchMetrics()]);
    } catch (error) {
      console.error('Error holding signal:', error);
      toast.error('Failed to hold signal');
    }
  };

  /**
   * IGNORE
   * Signal is noise or not feasible
   */
  const ignoreSignal = async (signal: Signal, reason?: string) => {
    try {
      const { error } = await supabase
        .from('demand_intelligence_signals')
        .update({
          decision_action: 'ignore',
          decision_notes: reason || 'Ignored by admin',
          decision_made_at: new Date().toISOString(),
        })
        .eq('id', signal.id);
      
      if (error) throw error;
      
      toast.success('Signal ignored');
      setShowSignalDetail(false);
      setSelectedSignal(null);
      // ✅ FIX #4: Consistent refetch after mutation
      await Promise.all([fetchSignals(), fetchMetrics()]);
    } catch (error) {
      console.error('Error ignoring signal:', error);
      toast.error('Failed to ignore signal');
    }
  };

  // ============================================================
  // DEMAND SCAN
  // ============================================================

  const runDemandScan = async () => {
    if (!selectedCategory || !selectedSubcategory) {
      toast.error("Select category and subcategory first");
      return;
    }
    
    setRunning(true);
    try {
      toast.info("Scanning for demand signals...");
      
      const supplierData = await checkSupplierAvailability(
        selectedCategory,
        selectedSubcategory,
        selectedCountry
      );
      
      const industries = getAllIndustriesForCategory(selectedCategory);
      const sampleIndustry = industries[0] || 'general';
      
      // ✅ FIX #5: Simulation flag for demo data
      const isSimulation = true; // TODO: Set false for production with real signal ingestion
      
      const scoreFactors: ScoreFactors = {
        estimatedValue: 2500000,
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
      
      const signal = await createDemandSignal({
        // ✅ FIX #5: Tag as simulation or real signal
        signalSource: isSimulation ? 'simulation' as any : 'keyword_scan',
        confidenceScore: scores.overallScore,
        intentScore: scores.intentScore,
        urgencyScore: scores.urgencyScore,
        valueScore: scores.valueScore,
        feasibilityScore: scores.feasibilityScore,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        industry: sampleIndustry,
        productDescription: `${isSimulation ? '[SIM] ' : ''}${selectedSubcategory} for ${sampleIndustry} project in ${selectedCountry}`,
        estimatedValue: 2500000,
        deliveryLocation: selectedCountry === 'india' ? 'Mumbai, Maharashtra' : selectedCountry,
        deliveryTimelineDays: 30,
        buyerType: 'industrial',
        matchingSuppliersCount: supplierData.count,
        bestSupplierMatchScore: supplierData.bestMatchScore,
        fulfilmentFeasible: supplierData.feasible,
      }, settings || undefined);
      
      if (signal) {
        toast.success(`Signal: ${signal.classification.toUpperCase()} (Score: ${signal.overallScore?.toFixed(1)})`);
        
        // ✅ FIX #1: Auto-execute if qualified (TRUE AUTOMATION)
        if (settings?.enabled) {
          const autoResult = await executeAutoRFQIfQualified(signal, settings);
          if (autoResult.executed) {
            toast.success(`🚀 Auto-RFQ created! Pipeline active.`);
          }
        }
      }
      
      // ✅ FIX #4: Consistent refetch after mutation
      await Promise.all([fetchSignals(), fetchMetrics()]);
      
    } catch (error) {
      console.error('Demand scan failed:', error);
      toast.error('Scan failed');
    } finally {
      setRunning(false);
    }
  };

  // ============================================================
  // SETTINGS
  // ============================================================

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

  // ============================================================
  // HELPERS
  // ============================================================

  const getOverallScore = (signal: Signal): number => {
    if (signal.overall_score) return signal.overall_score;
    const { intent_score, urgency_score, value_score, feasibility_score } = signal;
    return ((intent_score || 0) + (urgency_score || 0) + (value_score || 0) + (feasibility_score || 0)) / 4;
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  const calculateMargin = (signal: Signal): { percent: number; amount: number } => {
    const value = signal.estimated_value || 0;
    const totalMarginPercent = 
      marginSettings.baseMarginPercent + 
      marginSettings.riskPremiumPercent + 
      marginSettings.logisticsMarkupPercent + 
      marginSettings.serviceFeePercent;
    
    // Adjust based on feasibility
    const feasibility = signal.feasibility_score || 0;
    let adjustedPercent = totalMarginPercent;
    if (feasibility >= 8) adjustedPercent += 1;
    else if (feasibility < 4) adjustedPercent -= 1;
    
    return {
      percent: Math.max(2, Math.min(12, adjustedPercent)),
      amount: Math.round(value * adjustedPercent / 100),
    };
  };

  const getTimeAgo = (date: string | null) => {
    if (!date) return "Never";
    const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  // ✅ FIX #2: Check if signal qualifies for BUY based on admin threshold
  const isBuyQualified = (signal: Signal): boolean => {
    const overallScore = getOverallScore(signal);
    return overallScore >= (settings?.buyClassificationMinScore ?? 7);
  };

  // Calculate margin confidence (Strategic Improvement C)
  const getMarginConfidence = (signal: Signal): { level: 'high' | 'medium' | 'low'; score: number } => {
    const feasibility = signal.feasibility_score || 0;
    const value = signal.value_score || 0;
    const confidence = (feasibility + value) / 2;
    return {
      score: confidence,
      level: confidence >= 7 ? 'high' : confidence >= 4 ? 'medium' : 'low'
    };
  };

  const getClassificationBadge = (classification: string, signal?: Signal) => {
    // Strategic Improvement A: Auto-Execute badge
    const isAutoQualified = signal && signal.decision_action === 'auto_rfq';
    
    switch (classification) {
      case 'buy':
        return (
          <div className="flex items-center gap-1" title={isAutoQualified ? "AI Approved" : undefined}>
            <Badge className="bg-green-600 text-white">BUY</Badge>
            {isAutoQualified && (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
          </div>
        );
      case 'research':
        return <Badge className="bg-blue-500 text-white">RESEARCH</Badge>;
      case 'noise':
        return <Badge variant="outline" className="text-gray-500">NOISE</Badge>;
      default:
        return <Badge variant="outline">{classification}</Badge>;
    }
  };

  const getDecisionBadge = (decision: string | null) => {
    switch (decision) {
      case 'auto_rfq':
        return <Badge className="bg-emerald-600 text-white">RFQ CREATED</Badge>;
      case 'admin_review':
        return <Badge className="bg-amber-500 text-white">ON HOLD</Badge>;
      case 'ignore':
        return <Badge variant="outline" className="text-gray-400">IGNORED</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">PENDING</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getIndustryLabel = (industry: string | null) => {
    if (!industry) return 'General';
    return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Priority signals for quick access
  const highPrioritySignals = signals.filter(s => 
    s.decision_action === 'pending' && getOverallScore(s) >= 7 && s.fulfilment_feasible
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* HEADER - Command Center Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Demand Intelligence Command Center</h2>
            <p className="text-sm text-muted-foreground">
              Decision & Revenue Control Room • Buyer → ProcureSaathi → Supplier
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {settings?.enabled && (
            <Badge variant="outline" className="border-green-500 text-green-600">
              <Sparkles className="w-3 h-3 mr-1" />
              Auto-Scan Active
            </Badge>
          )}
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

      {/* CEO/INVESTOR METRICS DASHBOARD */}
      {metrics && (
        <div className="space-y-3">
          {/* REVENUE AT RISK - Prominent investor-grade metric */}
          {revenueAtRisk.amount > 0 && (
            <Card className="p-4 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-2 border-red-300 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800 uppercase tracking-wide">
                      Revenue at Risk
                    </p>
                    <p className="text-3xl font-bold text-red-700">
                      {formatCurrency(revenueAtRisk.amount)}
                    </p>
                    <p className="text-xs text-red-600/70">
                      Margin exposure locked in {revenueAtRisk.signalCount} unsafe demand signal{revenueAtRisk.signalCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Risk Factors:</p>
                  <div className="flex flex-wrap gap-1 justify-end">
                    <Badge variant="outline" className="text-[10px] border-red-300 text-red-600">
                      Low Feasibility
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">
                      No Suppliers
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">
                      Pending Review
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setDecisionFilter('pending');
                      setClassificationFilter('all');
                      setActiveTab('inbox');
                    }}
                  >
                    Review Risky Signals
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xl font-bold text-blue-700">{metrics.totalSignalsToday}</p>
                  <p className="text-[10px] text-blue-600/70 uppercase tracking-wide">Signals Today</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xl font-bold text-green-700">{metrics.buySignalsToday}</p>
                  <p className="text-[10px] text-green-600/70 uppercase tracking-wide">BUY Signals</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xl font-bold text-emerald-700">{metrics.autoRfqsCreated}</p>
                  <p className="text-[10px] text-emerald-600/70 uppercase tracking-wide">RFQs Created</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-xl font-bold text-amber-700">{metrics.pendingReview}</p>
                  <p className="text-[10px] text-amber-600/70 uppercase tracking-wide">Pending</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xl font-bold">{metrics.avgOverallScore.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Score</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xl font-bold">{metrics.avgFeasibilityScore.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Feasibility</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xl font-bold text-purple-700">{metrics.conversionRate}%</p>
                  <p className="text-[10px] text-purple-600/70 uppercase tracking-wide">Conversion</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-rose-600" />
                <div>
                  <p className="text-xl font-bold text-rose-700">
                    {marginSettings.baseMarginPercent + marginSettings.riskPremiumPercent + marginSettings.logisticsMarkupPercent}%
                  </p>
                  <p className="text-[10px] text-rose-600/70 uppercase tracking-wide">Avg Margin</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* HIGH PRIORITY ALERT */}
      {highPrioritySignals.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <AlertCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">
                  {highPrioritySignals.length} High-Priority Signal{highPrioritySignals.length > 1 ? 's' : ''} Ready
                </p>
                <p className="text-sm text-green-600/80">
                  Score ≥7.0, suppliers available. One-click to execute.
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setDecisionFilter('pending');
                setClassificationFilter('buy');
              }}
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox" className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            Signal Inbox
          </TabsTrigger>
          <TabsTrigger value="margin" className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Margin Control
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center gap-1">
            <Play className="w-4 h-4" />
            Run Scan
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* SIGNAL INBOX TAB */}
        {/* ============================================================ */}
        <TabsContent value="inbox" className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={classificationFilter} onValueChange={setClassificationFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">BUY</SelectItem>
                  <SelectItem value="research">RESEARCH</SelectItem>
                  <SelectItem value="noise">NOISE</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="admin_review">🔍 On Hold</SelectItem>
                  <SelectItem value="auto_rfq">✅ RFQ Created</SelectItem>
                  <SelectItem value="ignore">❌ Ignored</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="text-sm text-muted-foreground">
                {signals.length} signals found
              </div>
            </div>
          </Card>

          {/* Signals Table */}
          <Card>
            <CardContent className="p-0">
              {signals.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No signals in queue</p>
                  <p className="text-sm">Run a scan to discover demand opportunities.</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[80px]">Type</TableHead>
                        <TableHead>Category / Product</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-center">Timeline</TableHead>
                        <TableHead className="text-center">Scores</TableHead>
                        <TableHead className="text-center">Suppliers</TableHead>
                        <TableHead>Margin</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[160px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signals.map((signal) => {
                        const overallScore = getOverallScore(signal);
                        const isHighPriority = overallScore >= 7.0 && signal.fulfilment_feasible;
                        const margin = calculateMargin(signal);
                        const isConverted = signal.converted_to_rfq_id != null;
                        const marginConfidence = getMarginConfidence(signal);
                        const canExecute = isBuyQualified(signal) && signal.fulfilment_feasible;
                        const isSimulation = signal.signal_source === 'simulation';
                        
                        return (
                          <TableRow 
                            key={signal.id}
                            className={`cursor-pointer hover:bg-muted/50 ${isHighPriority ? 'bg-green-50/50' : isConverted ? 'bg-blue-50/30' : ''}`}
                            onClick={() => openSignalDetail(signal)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getClassificationBadge(signal.classification, signal)}
                                {isSimulation && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-purple-500 border-purple-300">SIM</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[180px]">
                                <p className="font-medium capitalize truncate">{signal.subcategory || signal.category}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {signal.product_description?.substring(0, 50)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {getIndustryLabel(signal.industry)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(signal.estimated_value)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{signal.delivery_location || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                {signal.delivery_timeline_days || '-'}d
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-center gap-0.5">
                                <Badge 
                                  className={`text-xs ${overallScore >= 8 ? 'bg-green-600' : overallScore >= 6 ? 'bg-amber-500' : 'bg-gray-400'}`}
                                >
                                  {overallScore.toFixed(1)}
                                </Badge>
                                <div className="flex gap-0.5 text-[9px] text-muted-foreground">
                                  <span>I:{signal.intent_score?.toFixed(0) || 0}</span>
                                  <span>U:{signal.urgency_score?.toFixed(0) || 0}</span>
                                  <span>V:{signal.value_score?.toFixed(0) || 0}</span>
                                  <span>F:{signal.feasibility_score?.toFixed(0) || 0}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Factory className="w-3 h-3 text-muted-foreground" />
                                <span className={signal.fulfilment_feasible ? 'text-green-600 font-semibold' : 'text-red-500'}>
                                  {signal.matching_suppliers_count || 0}
                                </span>
                                {signal.fulfilment_feasible && (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(margin.amount)}
                                </p>
                                <div className="flex items-center justify-end gap-1">
                                  <p className="text-[10px] text-muted-foreground">
                                    ~{margin.percent.toFixed(1)}%
                                  </p>
                                  {/* Strategic Improvement C: Margin Confidence */}
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[8px] px-1 py-0 ${
                                      marginConfidence.level === 'high' ? 'border-green-400 text-green-600' :
                                      marginConfidence.level === 'medium' ? 'border-amber-400 text-amber-600' :
                                      'border-red-400 text-red-600'
                                    }`}
                                  >
                                    {marginConfidence.level.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getDecisionBadge(signal.decision_action)}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {isConverted ? (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">RFQ Active</span>
                                </div>
                              ) : signal.decision_action === 'pending' || signal.decision_action === 'admin_review' ? (
                                <div className="flex items-center gap-1">
                                  {/* ✅ FIX #2B: Lock execution if feasibility < threshold */}
                                  <Button 
                                    size="sm" 
                                    className={`h-7 px-2 text-white text-xs ${
                                      canExecute 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                                    onClick={() => executeSignal(signal)}
                                    disabled={!canExecute}
                                    title={!canExecute ? 'Score or suppliers insufficient' : 'Execute signal'}
                                  >
                                    <Zap className="w-3 h-3 mr-1" />
                                    Execute
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-amber-500 hover:bg-amber-50"
                                    onClick={() => {
                                      setSignalToHold(signal);
                                      setShowHoldDialog(true);
                                    }}
                                  >
                                    <Pause className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-gray-400 hover:bg-gray-50"
                                    onClick={() => ignoreSignal(signal)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : signal.decision_action === 'ignore' ? (
                                <span className="text-xs text-muted-foreground italic">Ignored</span>
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

        {/* ============================================================ */}
        {/* MARGIN CONTROL TAB */}
        {/* ============================================================ */}
        <TabsContent value="margin" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CircleDollarSign className="w-5 h-5 text-green-600" />
                    Margin Control Panel
                  </CardTitle>
                  <CardDescription>
                    Control pricing spread. Buyer sees ONE PRICE. Supplier sees ANOTHER. ProcureSaathi owns the spread.
                  </CardDescription>
                </div>
                {/* ✅ FIX #2: Save button for margin persistence */}
                <Button
                  onClick={saveMarginSettings}
                  disabled={!marginDirty || savingMargins}
                  className={marginDirty 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-gray-400"
                  }
                >
                  {savingMargins ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {marginDirty ? 'Save Changes' : 'Saved'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Unsaved changes warning */}
              {marginDirty && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-700">You have unsaved changes. Click Save to persist.</p>
                </div>
              )}

              {/* Base Margin */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Base Margin
                  </Label>
                  <span className="font-bold text-lg">{marginSettings.baseMarginPercent}%</span>
                </div>
                <Slider
                  value={[marginSettings.baseMarginPercent]}
                  onValueChange={([v]) => updateMargin('baseMarginPercent', v)}
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Standard platform margin on all transactions</p>
              </div>

              <Separator />

              {/* Risk Premium */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Risk Premium
                  </Label>
                  <span className="font-bold text-lg">{marginSettings.riskPremiumPercent}%</span>
                </div>
                <Slider
                  value={[marginSettings.riskPremiumPercent]}
                  onValueChange={([v]) => updateMargin('riskPremiumPercent', v)}
                  min={0}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Additional buffer for supplier/delivery risk</p>
              </div>

              <Separator />

              {/* Logistics Markup */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-500" />
                    Logistics Markup
                  </Label>
                  <span className="font-bold text-lg">{marginSettings.logisticsMarkupPercent}%</span>
                </div>
                <Slider
                  value={[marginSettings.logisticsMarkupPercent]}
                  onValueChange={([v]) => updateMargin('logisticsMarkupPercent', v)}
                  min={0}
                  max={8}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Margin on logistics coordination</p>
              </div>

              <Separator />

              {/* Service Fee */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    Service Fee
                  </Label>
                  <span className="font-bold text-lg">{marginSettings.serviceFeePercent}%</span>
                </div>
                <Slider
                  value={[marginSettings.serviceFeePercent]}
                  onValueChange={([v]) => updateMargin('serviceFeePercent', v)}
                  min={0}
                  max={3}
                  step={0.25}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Quality assurance & documentation fee</p>
              </div>

              <Separator />

              {/* Total Margin Preview */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Total Margin</p>
                    <p className="text-xs text-green-600/70">Applied to all new RFQs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700">
                      {(marginSettings.baseMarginPercent + marginSettings.riskPremiumPercent + marginSettings.logisticsMarkupPercent + marginSettings.serviceFeePercent).toFixed(1)}%
                    </p>
                    <p className="text-xs text-green-600/70">
                      ₹{((25 * (marginSettings.baseMarginPercent + marginSettings.riskPremiumPercent + marginSettings.logisticsMarkupPercent + marginSettings.serviceFeePercent)) / 100 * 100000).toLocaleString()} per ₹25L deal
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* RUN SCAN TAB */}
        {/* ============================================================ */}
        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Run Demand Scan
              </CardTitle>
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
                <p className="font-medium mb-2">Scan Process:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check supplier availability & match scores</li>
                  <li>Calculate multi-dimensional scores (Intent, Urgency, Value, Feasibility)</li>
                  <li>Classify signal (BUY / RESEARCH / NOISE)</li>
                  <li>Determine action: Auto-RFQ (&gt;8.0), Review (&gt;5.0), Ignore (&lt;5.0)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* ANALYTICS TAB */}
        {/* ============================================================ */}
        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Daily Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daily Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Signals Detected</span>
                  <span className="font-bold">{metrics?.totalSignalsToday || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Buy vs Noise Ratio</span>
                  <span className="font-bold">
                    {metrics?.totalSignalsToday 
                      ? `${Math.round((metrics.buySignalsToday / metrics.totalSignalsToday) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <span className="text-sm text-green-700">RFQs Created</span>
                  <span className="font-bold text-green-700">{metrics?.autoRfqsCreated || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Signal → RFQ Conversion</span>
                  <span className="font-bold">{metrics?.conversionRate || 0}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.topCategories && metrics.topCategories.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.topCategories.map((cat, idx) => (
                      <div key={cat.category} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{cat.category.replace(/_/g, ' ')}</p>
                          <Progress value={(cat.count / metrics.totalSignalsToday) * 100} className="h-1.5 mt-1" />
                        </div>
                        <span className="text-sm font-bold">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No category data yet</p>
                )}
              </CardContent>
            </Card>

            {/* AI ROI */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  AI ROI Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
                    <p className="text-xs text-blue-600/70 uppercase tracking-wide mb-1">Signals Processed</p>
                    <p className="text-2xl font-bold text-blue-700">{signals.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50">
                    <p className="text-xs text-green-600/70 uppercase tracking-wide mb-1">Revenue Pipeline</p>
                    <p className="text-2xl font-bold text-green-700">{metrics?.autoRfqsCreated || 0} RFQs</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
                    <p className="text-xs text-purple-600/70 uppercase tracking-wide mb-1">Avg Margin</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {(marginSettings.baseMarginPercent + marginSettings.riskPremiumPercent).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50">
                    <p className="text-xs text-amber-600/70 uppercase tracking-wide mb-1">Supplier Match Rate</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {signals.length ? `${Math.round(signals.filter(s => s.fulfilment_feasible).length / signals.length * 100)}%` : '0%'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* SETTINGS TAB */}
        {/* ============================================================ */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                  
                  <Separator />
                  
                  {/* Score Thresholds */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Score Thresholds</Label>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Auto-RFQ Min Score</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[settings.autoRfqMinScore]}
                            onValueChange={([v]) => setSettings({ ...settings, autoRfqMinScore: v })}
                            min={5}
                            max={10}
                            step={0.5}
                            className="flex-1"
                          />
                          <span className="w-12 text-center font-bold">{settings.autoRfqMinScore}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Signals above this score auto-create RFQs
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Admin Review Min Score</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[settings.adminReviewMinScore]}
                            onValueChange={([v]) => setSettings({ ...settings, adminReviewMinScore: v })}
                            min={1}
                            max={8}
                            step={0.5}
                            className="flex-1"
                          />
                          <span className="w-12 text-center font-bold">{settings.adminReviewMinScore}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Signals above this are flagged for review
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Supplier Requirements */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Require Supplier Availability</p>
                        <p className="text-sm text-muted-foreground">
                          Only create RFQs when suppliers are available
                        </p>
                      </div>
                      <Switch
                        checked={settings.requireSupplierAvailability}
                        onCheckedChange={(v) => setSettings({ ...settings, requireSupplierAvailability: v })}
                      />
                    </div>
                    
                    {settings.requireSupplierAvailability && (
                      <div className="space-y-2">
                        <Label className="text-sm">Minimum Matching Suppliers</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[settings.minMatchingSuppliers]}
                            onValueChange={([v]) => setSettings({ ...settings, minMatchingSuppliers: v })}
                            min={1}
                            max={5}
                            step={1}
                            className="flex-1"
                          />
                          <span className="w-12 text-center font-bold">{settings.minMatchingSuppliers}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={saveSettings} className="w-full">
                    <Check className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* SIGNAL DETAIL DIALOG (EXPLAINABLE AI) */}
      {/* ============================================================ */}
      <Dialog open={showSignalDetail} onOpenChange={setShowSignalDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSignal && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getClassificationBadge(selectedSignal.classification)}
                  <span>Signal Detail - Explainable AI</span>
                </DialogTitle>
                <DialogDescription>
                  Signal ID: {selectedSignal.id.substring(0, 8)}... • 
                  Discovered {getTimeAgo(selectedSignal.created_at)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* LEFT: Signal Info */}
                <div className="space-y-4">
                  {/* Product Info */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">DEMAND DETAILS</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <span className="font-medium capitalize">{selectedSignal.category?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Subcategory</span>
                        <span className="font-medium capitalize">{selectedSignal.subcategory?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Industry</span>
                        <span className="font-medium">{getIndustryLabel(selectedSignal.industry)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Est. Value</span>
                        <span className="font-bold text-lg">{formatCurrency(selectedSignal.estimated_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <span className="font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedSignal.delivery_location}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Timeline</span>
                        <span className="font-medium">{selectedSignal.delivery_timeline_days} days</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Description */}
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">PRODUCT DESCRIPTION</h4>
                    <p className="text-sm">{selectedSignal.product_description || 'No description'}</p>
                  </div>
                  
                  {/* Expected Margin */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 border">
                    <h4 className="font-semibold text-sm text-green-700 mb-2">EXPECTED MARGIN</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-green-700">
                          {formatCurrency(calculateMargin(selectedSignal).amount)}
                        </p>
                        <p className="text-sm text-green-600/70">
                          {calculateMargin(selectedSignal).percent.toFixed(1)}% of deal value
                        </p>
                      </div>
                      <CircleDollarSign className="w-10 h-10 text-green-300" />
                    </div>
                  </div>
                </div>
                
                {/* RIGHT: Explainable AI Scores */}
                <div className="space-y-4">
                  {/* Score Breakdown */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">SCORE BREAKDOWN (WHY AI THINKS THIS)</h4>
                    
                    {/* Overall Score */}
                    <div className="mb-4 p-3 rounded-lg bg-white border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Overall Score</span>
                        <Badge className={`text-lg px-3 py-1 ${getOverallScore(selectedSignal) >= 8 ? 'bg-green-600' : getOverallScore(selectedSignal) >= 6 ? 'bg-amber-500' : 'bg-gray-400'}`}>
                          {getOverallScore(selectedSignal).toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Individual Scores */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            Intent Score
                          </span>
                          <span className="font-bold">{(selectedSignal.intent_score || 0).toFixed(1)}</span>
                        </div>
                        <Progress value={(selectedSignal.intent_score || 0) * 10} className="h-2" />
                        <p className="text-[10px] text-muted-foreground">
                          Based on value ({formatCurrency(selectedSignal.estimated_value)}), industry ({getIndustryLabel(selectedSignal.industry)}), specificity
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Urgency Score
                          </span>
                          <span className="font-bold">{(selectedSignal.urgency_score || 0).toFixed(1)}</span>
                        </div>
                        <Progress value={(selectedSignal.urgency_score || 0) * 10} className="h-2" />
                        <p className="text-[10px] text-muted-foreground">
                          Based on timeline ({selectedSignal.delivery_timeline_days}d), project type, value urgency
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-green-500" />
                            Value Score
                          </span>
                          <span className="font-bold">{(selectedSignal.value_score || 0).toFixed(1)}</span>
                        </div>
                        <Progress value={(selectedSignal.value_score || 0) * 10} className="h-2" />
                        <p className="text-[10px] text-muted-foreground">
                          Based on deal size, export potential, buyer LTV
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Factory className="w-4 h-4 text-purple-500" />
                            Feasibility Score
                          </span>
                          <span className="font-bold">{(selectedSignal.feasibility_score || 0).toFixed(1)}</span>
                        </div>
                        <Progress value={(selectedSignal.feasibility_score || 0) * 10} className="h-2" />
                        <p className="text-[10px] text-muted-foreground">
                          Based on {selectedSignal.matching_suppliers_count} matching suppliers, location ({selectedSignal.delivery_location})
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Flags */}
                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50">
                    <h4 className="font-semibold text-sm text-amber-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      RISK FLAGS
                    </h4>
                    <ul className="text-sm space-y-1 text-amber-800">
                      {(selectedSignal.feasibility_score || 0) < 5 && (
                        <li>• Low supplier availability ({selectedSignal.matching_suppliers_count} matched)</li>
                      )}
                      {(selectedSignal.intent_score || 0) < 5 && (
                        <li>• Low purchase intent signals</li>
                      )}
                      {(selectedSignal.delivery_location?.toLowerCase().includes('export') || !selectedSignal.delivery_location?.toLowerCase().includes('india')) && (
                        <li>• Export/International delivery - higher logistics complexity</li>
                      )}
                      {(selectedSignal.estimated_value || 0) > 10000000 && (
                        <li>• High value deal (&gt;₹1Cr) - requires careful supplier vetting</li>
                      )}
                      {(selectedSignal.feasibility_score || 0) >= 5 && (selectedSignal.intent_score || 0) >= 5 && (
                        <li className="text-green-700">✓ No major risk flags detected</li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Supplier Pool (INTERNAL ONLY) */}
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      SUPPLIER POOL (INTERNAL)
                    </h4>
                    {loadingSuppliers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : supplierMatches.length > 0 ? (
                      <div className="space-y-2">
                        {supplierMatches.slice(0, 5).map((match, idx) => (
                          <div key={match.supplierId} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                {idx + 1}
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">
                                S-{match.supplierId.substring(0, 6)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {match.categoryMatch && <Badge variant="outline" className="text-[10px]">Cat ✓</Badge>}
                              {match.locationMatch && <Badge variant="outline" className="text-[10px]">Loc ✓</Badge>}
                              <Badge className={`text-[10px] ${match.matchScore >= 8 ? 'bg-green-600' : match.matchScore >= 5 ? 'bg-amber-500' : 'bg-gray-400'}`}>
                                {match.matchScore.toFixed(1)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {supplierMatches.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{supplierMatches.length - 5} more suppliers available
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No matching suppliers found</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                      ❌ Buyer never sees this. ❌ Suppliers don't know buyer.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* DECISION PANEL */}
              <DialogFooter className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    Current status: {getDecisionBadge(selectedSignal.decision_action)}
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedSignal.converted_to_rfq_id && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => ignoreSignal(selectedSignal, 'Manually ignored by admin')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Ignore
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-amber-300 text-amber-600 hover:bg-amber-50"
                          onClick={() => {
                            setSignalToHold(selectedSignal);
                            setShowHoldDialog(true);
                          }}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Hold for Review
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => executeSignal(selectedSignal)}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Approve & Create RFQ
                        </Button>
                      </>
                    )}
                    {selectedSignal.converted_to_rfq_id && (
                      <Badge className="bg-blue-600 text-white px-4 py-2">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        RFQ Already Created
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* HOLD DIALOG */}
      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hold Signal for Review</DialogTitle>
            <DialogDescription>
              Add notes for why this signal needs further review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="E.g., Margin unclear, need to verify supplier capacity, high value requires additional vetting..."
              value={holdNotes}
              onChange={(e) => setHoldNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600"
              onClick={holdSignalForReview}
            >
              <Pause className="w-4 h-4 mr-2" />
              Hold for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
