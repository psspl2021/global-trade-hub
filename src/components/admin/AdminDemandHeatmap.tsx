/**
 * ============================================================
 * ADMIN DEMAND HEATMAP DASHBOARD
 * ============================================================
 * 
 * INVESTOR-GRADE GLOBAL DEMAND INTELLIGENCE CONTROL ROOM
 * 
 * This dashboard answers ONE question:
 * "Where is real procurement demand emerging, how hot is it,
 * and how much revenue is at risk right now?"
 * 
 * Features:
 * - Lane State Machine (detected → pending → activated → fulfilling → closed → lost)
 * - Capacity Overlay with demand vs supply matching
 * - Time-to-Activation metrics
 * - Revenue pipeline visualization
 * 
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Flame, 
  Globe, 
  Building2, 
  IndianRupee, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Zap,
  Users,
  ArrowUpRight,
  RefreshCw,
  Timer,
  Gauge,
  Package,
  CheckCircle2,
  Crown,
  Radar,
  Shield,
  Brain
} from 'lucide-react';
import { AIInsightsCard } from './AIInsightsCard';
import { AIRecommendedActionsCard } from './AIRecommendedActionsCard';
import { AIMonitoringBadge } from './AIMonitoringBadge';
import { 
  type LaneState, 
  type LaneCapacityStatus,
  computeLaneCapacityStatus,
  LANE_STATE_CONFIG 
} from '@/lib/laneStateTransitions';
import { isEnterpriseCategory } from '@/data/replicationConfig';

interface HeatmapCell {
  country: string;
  category: string;
  intent_score: number;
  rfqs_submitted: number;
  rfqs_pending: number;
  estimated_value: number;
  priority_score: number;
  lane_state: LaneState;
  // Enterprise priority
  priority: 'revenue_high' | 'normal';
  // Capacity overlay
  capacity_status: 'OK' | 'DEFICIT' | 'NO_CAPACITY';
  available_capacity: number;
  deficit_value: number;
  utilization_pct: number;
}

interface CapacityLane {
  id: string;
  country: string;
  category: string;
  monthly_capacity_value: number;
  allocated_capacity_value: number;
  active: boolean;
}

interface UrgentAction {
  category: string;
  country: string;
  intent_score: number;
  rfqs_pending: number;
  estimated_value: number;
  reason: string;
  lane_state: LaneState;
  can_allocate: boolean;
  priority?: 'revenue_high' | 'normal';
}

interface DashboardTiles {
  totalSignals: number;
  totalRevenueAtRisk: number;
  topCountry: { label: string; value: number } | null;
  topCategory: { label: string; value: number } | null;
  rfqsLast7Days: number;
  // New investor-grade KPIs
  avgCapacityUtilization: number;
  demandCapacityGap: number;
  activeLanes: number;
  avgTimeToActivation: number; // in days
}

interface PreTenderOpportunity {
  id: string;
  category: string;
  country: string;
  intent_score: number;
  priority: string;
  status: string;
  estimated_value: number;
  created_at: string;
}

interface SupplierMatch {
  supplier_id: string;
  company_name: string;
  supplier_country: string;
  is_verified: boolean;
}

export function AdminDemandHeatmap() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tiles, setTiles] = useState<DashboardTiles>({
    totalSignals: 0,
    totalRevenueAtRisk: 0,
    topCountry: null,
    topCategory: null,
    rfqsLast7Days: 0,
    avgCapacityUtilization: 0,
    demandCapacityGap: 0,
    activeLanes: 0,
    avgTimeToActivation: 0,
  });
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [urgentActions, setUrgentActions] = useState<UrgentAction[]>([]);
  const [capacityLanes, setCapacityLanes] = useState<CapacityLane[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLaneState, setSelectedLaneState] = useState<string | null>(null);
  
  // Pre-Tender Opportunities state
  const [preTenderOpportunities, setPreTenderOpportunities] = useState<PreTenderOpportunity[]>([]);
  const [showPreTender, setShowPreTender] = useState(false);
  
  // Supplier Shortlist modal state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierShortlist, setSupplierShortlist] = useState<SupplierMatch[]>([]);
  const [activatingLane, setActivatingLane] = useState<{ country: string; category: string } | null>(null);

  const fetchDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Recalculate intent scores server-side
      const { data: recalcResult, error: recalcError } = await (supabase.rpc as any)('recalculate_intent_scores');
      if (recalcError) console.warn('Intent recalc warning:', recalcError.message);
      else if (import.meta.env.DEV) console.log(`[DemandDashboard] Recalculated ${recalcResult} intent scores`);

      // 2. Fetch real metrics from DB function
      const { data: metricsData, error: metricsError } = await (supabase.rpc as any)('get_demand_dashboard_metrics');

      // 3. Fetch all raw data in parallel for the grid
      const [
        signalPagesRes,
        demandSignalsRes,
        capacityLanesRes
      ] = await Promise.all([
        supabase
          .from('admin_signal_pages')
          .select('target_country, category, intent_score, rfqs_submitted, views')
          .eq('is_active', true),
        supabase
          .from('demand_intelligence_signals')
          .select('id, country, category, estimated_value, decision_action, lane_state, created_at, first_signal_at, activated_at, intent_score, signal_source, priority, confidence_score'),
        supabase
          .from('supplier_capacity_lanes')
          .select('*')
          .eq('active', true)
      ]);

      if (signalPagesRes.error) throw signalPagesRes.error;
      if (demandSignalsRes.error) throw demandSignalsRes.error;
      if (capacityLanesRes.error) throw capacityLanesRes.error;

      const signalPages = signalPagesRes.data || [];
      const demandSignals = demandSignalsRes.data || [];
      const capacityData = capacityLanesRes.data || [];

      setCapacityLanes(capacityData);

      // Build capacity lookup map
      const capacityMap = new Map<string, CapacityLane>();
      capacityData.forEach(lane => {
        const key = `${lane.country.toUpperCase()}-${lane.category}`;
        capacityMap.set(key, lane);
      });

      // Build pending signals by cell
      const pendingByCell = new Map<string, number>();
      const stateByCell = new Map<string, LaneState>();
      
      demandSignals.forEach((signal: any) => {
        const key = `${(signal.country || 'IN').toUpperCase()}-${signal.category}`;
        if (signal.decision_action === 'pending' || signal.lane_state === 'pending' || signal.lane_state === 'detected') {
          pendingByCell.set(key, (pendingByCell.get(key) || 0) + 1);
        }
        const currentState = stateByCell.get(key);
        const signalState = (signal.lane_state || 'detected') as LaneState;
        const stateOrder: LaneState[] = ['detected', 'pending', 'activated', 'fulfilling', 'closed', 'lost'];
        if (!currentState || stateOrder.indexOf(signalState) > stateOrder.indexOf(currentState)) {
          stateByCell.set(key, signalState);
        }
      });

      // Build heatmap from signals (primary) and signal pages (secondary)
      const heatmapMap = new Map<string, HeatmapCell>();
      
      // Start with demand signals as primary source
      demandSignals.forEach((signal: any) => {
        const key = `${(signal.country || 'IN').toUpperCase()}-${signal.category}`;
        const existing = heatmapMap.get(key);
        
        if (existing) {
          existing.estimated_value += signal.estimated_value || 0;
          existing.intent_score = Math.max(existing.intent_score, signal.intent_score || 0);
          existing.rfqs_pending = pendingByCell.get(key) || 0;
          if (signal.priority === 'revenue_high') existing.priority = 'revenue_high';
        } else {
          const laneState = stateByCell.get(key) || 'detected';
          const category = signal.category || 'Unknown';
          heatmapMap.set(key, {
            country: (signal.country || 'IN').toUpperCase(),
            category,
            intent_score: signal.intent_score || 0,
            rfqs_submitted: 0,
            rfqs_pending: pendingByCell.get(key) || 0,
            estimated_value: signal.estimated_value || 0,
            priority_score: 0,
            priority: signal.priority === 'revenue_high' || isEnterpriseCategory(category) ? 'revenue_high' : 'normal',
            lane_state: laneState,
            capacity_status: 'NO_CAPACITY',
            available_capacity: 0,
            deficit_value: 0,
            utilization_pct: 0,
          });
        }
      });

      // Enrich with signal pages data
      signalPages.forEach((page: any) => {
        const key = `${(page.target_country || 'IN').toUpperCase()}-${page.category}`;
        const existing = heatmapMap.get(key);
        
        if (existing) {
          existing.rfqs_submitted += page.rfqs_submitted || 0;
        } else {
          const laneState = stateByCell.get(key) || 'detected';
          const category = page.category || 'Unknown';
          heatmapMap.set(key, {
            country: (page.target_country || 'IN').toUpperCase(),
            category,
            intent_score: page.intent_score || 0,
            rfqs_submitted: page.rfqs_submitted || 0,
            rfqs_pending: pendingByCell.get(key) || 0,
            estimated_value: 0,
            priority_score: 0,
            priority: isEnterpriseCategory(category) ? 'revenue_high' : 'normal',
            lane_state: laneState,
            capacity_status: 'NO_CAPACITY',
            available_capacity: 0,
            deficit_value: 0,
            utilization_pct: 0,
          });
        }
      });

      // Enrich with capacity data and calculate priority score
      const heatmapData = Array.from(heatmapMap.values())
        .map(cell => {
          const key = `${cell.country}-${cell.category}`;
          const capacity = capacityMap.get(key);
          const capacityStatus = computeLaneCapacityStatus(
            cell.country,
            cell.category,
            cell.estimated_value,
            capacity ? {
              monthly_capacity_value: Number(capacity.monthly_capacity_value),
              allocated_capacity_value: Number(capacity.allocated_capacity_value)
            } : null
          );

          const valueScore = (cell.estimated_value || 0) / 1_000_000;
          const intentScore = cell.intent_score || 0;
          const rfqScore = cell.rfqs_submitted || 0;
          
          let priorityScore = (valueScore * 0.5) + (intentScore * 0.3) + (rfqScore * 0.2);
          if (cell.priority === 'revenue_high') priorityScore *= 1.25;

          return {
            ...cell,
            priority_score: priorityScore,
            capacity_status: capacityStatus.status,
            available_capacity: capacityStatus.available_capacity,
            deficit_value: capacityStatus.deficit_value,
            utilization_pct: capacityStatus.utilization_pct,
          };
        })
        .sort((a, b) => b.priority_score - a.priority_score);

      setHeatmap(heatmapData);

      // Use DB-computed metrics (primary) with client fallback
      if (metricsData && !metricsError) {
        setTiles({
          totalSignals: metricsData.active_signals || 0,
          totalRevenueAtRisk: Number(metricsData.revenue_at_risk) || 0,
          topCountry: metricsData.top_country ? { label: metricsData.top_country, value: Number(metricsData.top_country_score) || 0 } : null,
          topCategory: metricsData.top_category ? { label: metricsData.top_category, value: Number(metricsData.top_category_score) || 0 } : null,
          rfqsLast7Days: metricsData.rfqs_7d || 0,
          avgCapacityUtilization: Number(metricsData.capacity_utilization) || 0,
          demandCapacityGap: Number(metricsData.demand_capacity_gap) || 0,
          activeLanes: metricsData.active_lanes || 0,
          avgTimeToActivation: Number(metricsData.avg_time_to_monetise) || 0,
        });
      } else {
        // Fallback: client-side calculation
        console.warn('Metrics RPC failed, using client fallback:', metricsError?.message);
        const activeSignals = demandSignals.filter((s: any) => !['closed', 'lost'].includes(s.lane_state));
        const revenueAtRisk = activeSignals
          .filter((s: any) => ['detected', 'pending'].includes(s.lane_state))
          .reduce((sum: number, s: any) => sum + (s.estimated_value || 0), 0);
        
        const countryIntents = new Map<string, number>();
        heatmapData.forEach(cell => countryIntents.set(cell.country, (countryIntents.get(cell.country) || 0) + cell.intent_score));
        let topCountry: { label: string; value: number } | null = null;
        countryIntents.forEach((value, label) => { if (!topCountry || value > topCountry.value) topCountry = { label, value }; });

        const categoryIntents = new Map<string, number>();
        heatmapData.forEach(cell => categoryIntents.set(cell.category, (categoryIntents.get(cell.category) || 0) + cell.intent_score));
        let topCategory: { label: string; value: number } | null = null;
        categoryIntents.forEach((value, label) => { if (!topCategory || value > topCategory.value) topCategory = { label, value }; });

        const activeLanesSet = new Set(
          demandSignals
            .filter((s: any) => s.lane_state === 'activated' || s.lane_state === 'fulfilling')
            .map((s: any) => `${s.country}-${s.category}`)
        );

        const avgUtil = capacityData.length > 0
          ? capacityData.reduce((sum, l) => sum + (Number(l.monthly_capacity_value) > 0 ? (Number(l.allocated_capacity_value) / Number(l.monthly_capacity_value)) * 100 : 0), 0) / capacityData.length
          : 0;

        setTiles({
          totalSignals: activeSignals.length,
          totalRevenueAtRisk: revenueAtRisk,
          topCountry,
          topCategory,
          rfqsLast7Days: 0, // would need separate query
          avgCapacityUtilization: avgUtil,
          demandCapacityGap: heatmapData.filter(c => c.capacity_status !== 'OK').reduce((sum, c) => sum + c.deficit_value, 0),
          activeLanes: activeLanesSet.size,
          avgTimeToActivation: 0,
        });
      }

      // Generate urgent actions
      const urgentList: UrgentAction[] = heatmapData
        .filter(cell => 
          cell.priority === 'revenue_high' ||
          cell.priority_score > 25 ||
          cell.intent_score > 5 || 
          cell.estimated_value > 5000000
        )
        .slice(0, 10)
        .map(cell => {
          let reason = '';
          if (cell.priority === 'revenue_high' && cell.estimated_value > 10000000) {
            reason = '🏆 Enterprise Lane – High Value';
          } else if (cell.priority === 'revenue_high') {
            reason = '🏆 Enterprise Lane';
          } else if (cell.intent_score > 7) {
            reason = 'High intent detected';
          } else if (cell.estimated_value > 10000000) {
            reason = 'Large deal opportunity';
          } else if (cell.rfqs_pending === 0) {
            reason = 'Intent but no pending RFQs';
          } else {
            reason = 'Active demand';
          }

          return {
            category: cell.category,
            country: cell.country,
            intent_score: cell.intent_score,
            rfqs_pending: cell.rfqs_pending,
            estimated_value: cell.estimated_value,
            reason,
            lane_state: cell.lane_state,
            can_allocate: cell.lane_state === 'activated' && cell.capacity_status === 'OK',
            priority: cell.priority,
          };
        });

      setUrgentActions(urgentList);

    } catch (error) {
      console.error('Error fetching demand dashboard:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Fetch pre-tender opportunities (uses new view - type assertion needed)
  const fetchPreTenderOpportunities = useCallback(async () => {
    try {
      // Query demand_intelligence_signals directly with same filter as view
      const { data, error } = await supabase
        .from('demand_intelligence_signals')
        .select('id, category, country, intent_score, priority, lane_state, estimated_value, created_at')
        .eq('priority', 'revenue_high')
        .or('lane_state.eq.detected,lane_state.is.null')
        .order('intent_score', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Map to PreTenderOpportunity format
      const mapped = (data || []).map(d => ({
        id: d.id,
        category: d.category || '',
        country: d.country || '',
        intent_score: d.intent_score || 0,
        priority: d.priority || 'normal',
        status: d.lane_state || 'detected',
        estimated_value: d.estimated_value || 0,
        created_at: d.created_at || '',
      }));
      
      setPreTenderOpportunities(mapped);
    } catch (error) {
      console.error('Error fetching pre-tender opportunities:', error);
    }
  }, []);

  useEffect(() => {
    fetchPreTenderOpportunities();
  }, [fetchPreTenderOpportunities]);

  // Fetch supplier shortlist for activation modal
  async function fetchSupplierShortlist(country: string, category: string) {
    try {
      // Note: Type assertion needed as RPC was just created
      const { data, error } = await (supabase.rpc as any)('get_supplier_shortlist', {
        p_country: country,
        p_category: category,
      });

      if (error) throw error;
      setSupplierShortlist(data || []);
    } catch (error) {
      console.error('Error fetching supplier shortlist:', error);
      setSupplierShortlist([]);
    }
  }

  // Lane activation with supplier shortlist modal
  async function handleActivateLaneClick(country: string, category: string) {
    setActivatingLane({ country, category });
    await fetchSupplierShortlist(country, category);
    setShowSupplierModal(true);
  }

  // Activate lane via RPC - finds matching signals and activates them
  async function activateLaneByCountryCategory(country: string, category: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to activate lanes');
        return;
      }

      // Find signals for this country+category that can be activated
      const { data: signals, error: fetchError } = await supabase
        .from('demand_intelligence_signals')
        .select('id, lane_state, country, category')
        .eq('country', country.toUpperCase())
        .eq('category', category)
        .in('lane_state', ['detected', 'pending'])
        .limit(10);

      if (fetchError) throw fetchError;

      if (!signals || signals.length === 0) {
        toast.error(`No activatable signals found for ${country} × ${category}. Signals may already be activated or in a terminal state.`);
        return;
      }

      let successCount = 0;
      let lastError = '';
      for (const signal of signals) {
        const { data: result, error: rpcError } = await (supabase.rpc as any)('activate_demand_lane', {
          p_signal_id: signal.id,
          p_admin_id: user.id,
        });

        if (rpcError) {
          lastError = rpcError.message;
          console.error(`[ActivateLane] RPC error for signal ${signal.id}:`, rpcError);
          continue;
        }

        if (result && result.success) {
          successCount++;
        } else if (result) {
          lastError = result.error || 'Unknown error';
          console.warn(`[ActivateLane] Signal ${signal.id} failed:`, result.error, result.code);
        }
      }

      if (successCount > 0) {
        toast.success(`Activated ${successCount} signal(s) for ${country} × ${category}`);
        fetchDashboard();
        fetchPreTenderOpportunities();
      } else {
        toast.error(`Failed to activate lane: ${lastError}`);
      }
    } catch (error: any) {
      console.error('Error activating lane:', error);
      toast.error(`Failed to activate lane: ${error.message || 'Unknown error'}`);
    }
  }

  // Confirm lane activation from modal
  async function confirmActivateLane() {
    if (!activatingLane) return;
    await activateLaneByCountryCategory(activatingLane.country, activatingLane.category);
    setShowSupplierModal(false);
    setActivatingLane(null);
  }

  // Direct lane activation (from urgent actions panel)
  async function activateLane(country: string, category: string) {
    await activateLaneByCountryCategory(country, category);
  }

  // Capacity allocation action
  async function allocateCapacity(country: string, category: string, demandValue: number) {
    try {
      const key = `${country.toUpperCase()}-${category}`;
      const lane = capacityLanes.find(l => 
        `${l.country.toUpperCase()}-${l.category}` === key
      );

      if (!lane) {
        toast.error('No capacity lane found');
        return;
      }

      const available = Number(lane.monthly_capacity_value) - Number(lane.allocated_capacity_value);
      const allocation = Math.min(available, demandValue);

      // Update capacity lane
      const { error: capacityError } = await supabase
        .from('supplier_capacity_lanes')
        .update({
          allocated_capacity_value: Number(lane.allocated_capacity_value) + allocation,
        })
        .eq('id', lane.id);

      if (capacityError) throw capacityError;

      // Update demand signals to fulfilling (country is now normalized to uppercase)
      const { error: signalError } = await supabase
        .from('demand_intelligence_signals')
        .update({
          lane_state: 'fulfilling',
          fulfilling_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('country', country.toUpperCase())
        .eq('category', category)
        .eq('lane_state', 'activated');

      if (signalError) throw signalError;

      toast.success(`Allocated ${formatCurrency(allocation)} capacity`);
      fetchDashboard();
    } catch (error) {
      console.error('Error allocating capacity:', error);
      toast.error('Failed to allocate capacity');
    }
  }

  function getIntentColor(score: number): string {
    if (score > 50) return 'bg-red-500/20 text-red-600 border-red-500/30';
    if (score > 30) return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
    if (score > 15) return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
    return 'bg-muted text-muted-foreground';
  }

  function getIntentBadgeVariant(score: number): 'destructive' | 'secondary' | 'outline' {
    if (score > 50) return 'destructive';
    if (score > 20) return 'secondary';
    return 'outline';
  }

  function formatCurrency(value: number): string {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
    return `₹${value.toLocaleString()}`;
  }

  function formatCategoryName(category: string): string {
    return category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  function getCountryFlag(code: string): string {
    const flags: Record<string, string> = {
      'INDIA': '🇮🇳', 'IN': '🇮🇳',
      'UAE': '🇦🇪', 'AE': '🇦🇪',
      'SAUDI': '🇸🇦', 'SA': '🇸🇦',
      'QATAR': '🇶🇦', 'QA': '🇶🇦',
      'KENYA': '🇰🇪', 'KE': '🇰🇪',
      'NIGERIA': '🇳🇬', 'NG': '🇳🇬',
      'US': '🇺🇸', 'USA': '🇺🇸',
    };
    return flags[code.toUpperCase()] || '🌍';
  }

  function getCapacityStatusBadge(status: 'OK' | 'DEFICIT' | 'NO_CAPACITY') {
    switch (status) {
      case 'DEFICIT':
        return <Badge variant="destructive">Deficit</Badge>;
      case 'NO_CAPACITY':
        return <Badge variant="secondary">No Lane</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-600">OK</Badge>;
    }
  }

  function getLaneStateBadge(state: LaneState) {
    const config = LANE_STATE_CONFIG[state];
    return (
      <Badge variant={config.badgeVariant} className={config.color}>
        {config.label}
      </Badge>
    );
  }

  // Filter heatmap and sort enterprise first
  const filteredHeatmap = heatmap
    .filter(cell => {
      if (selectedCountry && cell.country !== selectedCountry) return false;
      if (selectedCategory && cell.category !== selectedCategory) return false;
      if (selectedLaneState && cell.lane_state !== selectedLaneState) return false;
      return true;
    })
    .sort((a, b) => {
      // Enterprise lanes always first
      if (a.priority === 'revenue_high' && b.priority !== 'revenue_high') return -1;
      if (a.priority !== 'revenue_high' && b.priority === 'revenue_high') return 1;
      // Then by priority score
      return b.priority_score - a.priority_score;
    });

  const uniqueCountries = [...new Set(heatmap.map(h => h.country))];
  const uniqueCategories = [...new Set(heatmap.map(h => h.category))];
  const uniqueStates = [...new Set(heatmap.map(h => h.lane_state))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Global Demand Signals (Live)
            <AIMonitoringBadge 
              variant={heatmap.length > 0 ? 'active' : 'monitoring'} 
              label={heatmap.length > 0 ? 'AI Monitoring Live' : 'AI Monitoring'}
            />
          </h2>
          <p className="text-muted-foreground text-sm">
            Real-time demand intelligence across {uniqueCountries.length} countries × {uniqueCategories.length} categories
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Signals are generated from SEO pages, RFQs, and buyer intent across countries.
          </p>
          {/* Coverage Badge */}
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Brain className="h-3 w-3" />
            AI-powered analysis across 6 countries • 9 enterprise categories
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDashboard}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Empty-State Helper Banner */}
      {heatmap.length < 5 && (
        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Enterprise lanes appear automatically when buyers visit signal pages or submit RFQs.
        </div>
      )}

      {/* Top KPI Tiles - Original 5 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Active Signals - CLICKABLE */}
        <Card 
          className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/5 cursor-pointer hover:shadow-md hover:bg-red-500/15 transition-all"
          onClick={() => {
            setSelectedCountry(null);
            setSelectedCategory(null);
            setSelectedLaneState('detected');
            toast.info('Filtered to active signals (detected/pending)');
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Flame className="h-4 w-4 text-red-500" />
              Active Signals
            </div>
            <div className="text-3xl font-bold text-red-600">
              {tiles.totalSignals}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending decisions</p>
          </CardContent>
        </Card>

        {/* Top Country - CLICKABLE */}
        <Card 
          className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 cursor-pointer hover:shadow-md hover:bg-blue-500/15 transition-all"
          onClick={() => {
            if (tiles.topCountry) {
              setSelectedCountry(tiles.topCountry.label);
              setSelectedCategory(null);
              setSelectedLaneState(null);
              toast.info(`Filtered to ${tiles.topCountry.label}`);
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Globe className="h-4 w-4 text-blue-500" />
              Top Country
            </div>
            <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              {tiles.topCountry ? (
                <>
                  {getCountryFlag(tiles.topCountry.label)}
                  {tiles.topCountry.label}
                </>
              ) : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tiles.topCountry?.value || 0} intent score
            </p>
          </CardContent>
        </Card>

        {/* Top Category - CLICKABLE */}
        <Card 
          className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/5 cursor-pointer hover:shadow-md hover:bg-purple-500/15 transition-all"
          onClick={() => {
            if (tiles.topCategory) {
              setSelectedCategory(tiles.topCategory.label);
              setSelectedCountry(null);
              setSelectedLaneState(null);
              toast.info(`Filtered to ${formatCategoryName(tiles.topCategory.label)}`);
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Building2 className="h-4 w-4 text-purple-500" />
              Top Category
            </div>
            <div className="text-lg font-bold text-purple-600 truncate">
              {tiles.topCategory ? formatCategoryName(tiles.topCategory.label) : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tiles.topCategory?.value || 0} intent score
            </p>
          </CardContent>
        </Card>

        {/* Revenue at Risk - NON-CLICKABLE (stays static for now) */}
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <IndianRupee className="h-4 w-4 text-green-500" />
              Revenue at Risk
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(tiles.totalRevenueAtRisk)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending fulfillment</p>
          </CardContent>
        </Card>

        {/* RFQs (7 days) - CLICKABLE */}
        <Card 
          className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 cursor-pointer hover:shadow-md hover:bg-amber-500/15 transition-all"
          onClick={() => {
            // Navigate to requirements tab (admin dashboard tab) or show recent RFQs
            // For now, show a toast and could be extended to navigate
            toast.info('Showing RFQs from last 7 days - check Requirements tab');
            // Future: navigate('/admin?tab=requirements&filter=7days')
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4 text-amber-500" />
              RFQs (7 days)
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {tiles.rfqsLast7Days}
            </div>
            <p className="text-xs text-muted-foreground mt-1">New requirements</p>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Investor-Grade KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Gauge className="h-4 w-4 text-cyan-500" />
              Capacity Utilization
            </div>
            <div className="text-3xl font-bold text-cyan-600">
              {tiles.avgCapacityUtilization > 0 ? `${tiles.avgCapacityUtilization.toFixed(0)}%` : 'No Data'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tiles.avgCapacityUtilization > 0 ? 'Avg across lanes' : 'No capacity lanes configured'}</p>
          </CardContent>
        </Card>

        <Card className="border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Demand–Capacity Gap
            </div>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(tiles.demandCapacityGap)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unmet demand</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Package className="h-4 w-4 text-emerald-500" />
              Active Lanes
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {tiles.activeLanes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Activated or fulfilling</p>
          </CardContent>
        </Card>

        <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Timer className="h-4 w-4 text-violet-500" />
              Avg Time to Monetise
            </div>
            <div className="text-3xl font-bold text-violet-600">
              {tiles.avgTimeToActivation > 0 ? `${tiles.avgTimeToActivation.toFixed(1)}d` : 'Insufficient Data'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tiles.avgTimeToActivation > 0 ? 'Days to activation' : 'No lanes activated yet'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Heatmap + Urgent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Demand Intelligence Grid
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <select 
                  className="text-sm border rounded px-2 py-1 bg-background"
                  value={selectedCountry || ''}
                  onChange={e => setSelectedCountry(e.target.value || null)}
                >
                  <option value="">All Countries</option>
                  {uniqueCountries.map(c => (
                    <option key={c} value={c}>{getCountryFlag(c)} {c}</option>
                  ))}
                </select>
                <select 
                  className="text-sm border rounded px-2 py-1 bg-background"
                  value={selectedCategory || ''}
                  onChange={e => setSelectedCategory(e.target.value || null)}
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{formatCategoryName(c)}</option>
                  ))}
                </select>
                <select 
                  className="text-sm border rounded px-2 py-1 bg-background"
                  value={selectedLaneState || ''}
                  onChange={e => setSelectedLaneState(e.target.value || null)}
                >
                  <option value="">All States</option>
                  {uniqueStates.map(s => (
                    <option key={s} value={s}>{LANE_STATE_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b z-10">
                  <tr>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Country</th>
                    <th className="text-right p-3 font-medium">Intent</th>
                    <th className="text-right p-3 font-medium">State</th>
                    <th className="text-right p-3 font-medium">Value</th>
                    <th className="text-right p-3 font-medium">Capacity</th>
                    <th className="text-right p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHeatmap.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No demand data available for selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredHeatmap.map((cell, i) => (
                      <tr 
                        key={i} 
                        className={`border-b hover:bg-muted/50 transition-colors ${getIntentColor(cell.intent_score)}`}
                      >
                        <td className="p-3 font-medium">
                          <div className="flex items-center gap-2">
                            {formatCategoryName(cell.category)}
                            {cell.priority === 'revenue_high' && (
                              <Badge className="bg-black text-yellow-400 text-xs flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                Enterprise
                              </Badge>
                            )}
                            {/* Hot Lane Badge - triggers when pre-tender signal is forming */}
                            {(cell.lane_state === 'pending' ||
                              cell.intent_score >= 8 ||
                              cell.rfqs_submitted >= 2) && (
                              <Badge className="bg-red-600 text-white text-xs animate-pulse flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                Hot Lane
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-2">
                            {getCountryFlag(cell.country)}
                            {cell.country}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant={getIntentBadgeVariant(cell.intent_score)}>
                            {cell.intent_score}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {getLaneStateBadge(cell.lane_state)}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {formatCurrency(cell.estimated_value)}
                        </td>
                        <td className="p-3 text-right font-mono text-xs">
                          {cell.capacity_status !== 'NO_CAPACITY' 
                            ? formatCurrency(cell.available_capacity)
                            : '—'}
                        </td>
                        <td className="p-3 text-right">
                          {getCapacityStatusBadge(cell.capacity_status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Urgent Actions Panel */}
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Act Now
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              High-priority demand requiring immediate action
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {urgentActions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No urgent actions at this time</p>
                  </div>
                ) : (
                  urgentActions.map((action, i) => (
                    <div 
                      key={i}
                      className={`p-3 rounded-lg border transition-colors ${
                        action.priority === 'revenue_high' 
                          ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-500/30 hover:from-yellow-500/20' 
                          : 'bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium flex items-center gap-2">
                          {formatCategoryName(action.category)}
                          {action.priority === 'revenue_high' && (
                            <Badge className="bg-black text-yellow-400 text-xs flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Enterprise
                            </Badge>
                          )}
                        </div>
                        {getLaneStateBadge(action.lane_state)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{getCountryFlag(action.country)}</span>
                        <span>{action.country}</span>
                        <span className="text-muted-foreground">•</span>
                        {action.estimated_value > 0 ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(action.estimated_value)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            Potential Enterprise Lane
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-orange-600">
                          🚨 {action.reason}
                        </span>
                        <div className="flex gap-1">
                          {(action.lane_state === 'detected' || action.lane_state === 'pending') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => activateLane(action.country, action.category)}
                            >
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          )}
                          {action.can_allocate && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => allocateCapacity(action.country, action.category, action.estimated_value)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Allocate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* AI Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights Card */}
        <AIInsightsCard
          topCountry={tiles.topCountry}
          topCategory={tiles.topCategory}
          totalSignals={tiles.totalSignals}
          totalRevenueAtRisk={tiles.totalRevenueAtRisk}
          rfqsLast7Days={tiles.rfqsLast7Days}
          avgCapacityUtilization={tiles.avgCapacityUtilization}
          demandCapacityGap={tiles.demandCapacityGap}
          activeLanes={tiles.activeLanes}
          hasData={heatmap.length > 0 || tiles.totalSignals > 0 || tiles.rfqsLast7Days > 0}
        />

        {/* AI Recommended Actions Card */}
        <AIRecommendedActionsCard
          topCountry={tiles.topCountry}
          topCategory={tiles.topCategory}
          heatmapData={heatmap}
          activeLanes={tiles.activeLanes}
          demandCapacityGap={tiles.demandCapacityGap}
          rfqsLast7Days={tiles.rfqsLast7Days}
          onActivateLane={(country, category) => handleActivateLaneClick(country, category)}
        />
      </div>

      {/* Pre-Tender Opportunities Section */}
      {preTenderOpportunities.length > 0 && (
        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-blue-500" />
                Pre-Tender Opportunities (Sales Radar)
              </CardTitle>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {preTenderOpportunities.length} Lanes
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Enterprise lanes detected before RFQs come in. Activate to prepare supplier shortlist.
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {preTenderOpportunities.map((opp) => (
                  <div 
                    key={opp.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-black text-yellow-400 text-xs flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Enterprise
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{formatCategoryName(opp.category)}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {getCountryFlag(opp.country)} {opp.country}
                          <span className="mx-1">•</span>
                          Intent: {opp.intent_score}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleActivateLaneClick(opp.country, opp.category)}
                      className="gap-1"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                      Activate Lane
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Supplier Shortlist Modal */}
      <Dialog open={showSupplierModal} onOpenChange={setShowSupplierModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Suggested Suppliers for Lane
            </DialogTitle>
          </DialogHeader>
          
          {activatingLane && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="font-medium">{formatCategoryName(activatingLane.category)}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                {getCountryFlag(activatingLane.country)} {activatingLane.country}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {supplierShortlist.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pre-qualified suppliers found for this lane.</p>
                <p className="text-xs mt-1">Consider onboarding suppliers in this category.</p>
              </div>
            ) : (
              supplierShortlist.map((supplier) => (
                <div 
                  key={supplier.supplier_id}
                  className="p-3 rounded-lg border bg-card flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {supplier.company_name || 'Verified Supplier'}
                        {supplier.is_verified && (
                          <Shield className="h-4 w-4 text-green-600" />
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {supplier.supplier_country || 'India'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    Invite
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowSupplierModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={confirmActivateLane}
            >
              <CheckCircle2 className="h-4 w-4" />
              Activate Lane
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDemandHeatmap;
