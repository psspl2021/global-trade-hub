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
  CheckCircle2
} from 'lucide-react';
import { 
  type LaneState, 
  type LaneCapacityStatus,
  computeLaneCapacityStatus,
  LANE_STATE_CONFIG 
} from '@/lib/laneStateTransitions';

interface HeatmapCell {
  country: string;
  category: string;
  intent_score: number;
  rfqs_submitted: number;
  rfqs_pending: number;
  estimated_value: number;
  priority_score: number;
  lane_state: LaneState;
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

  const fetchDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch all data in parallel
      const [
        signalPagesRes,
        demandSignalsRes,
        recentRFQsRes,
        capacityLanesRes
      ] = await Promise.all([
        supabase
          .from('admin_signal_pages')
          .select('target_country, category, intent_score, rfqs_submitted, views')
          .eq('is_active', true),
        supabase
          .from('demand_intelligence_signals')
          .select('country, category, estimated_value, decision_action, lane_state, created_at, first_signal_at, activated_at'),
        supabase
          .from('requirements')
          .select('id')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('supplier_capacity_lanes')
          .select('*')
          .eq('active', true)
      ]);

      if (signalPagesRes.error) throw signalPagesRes.error;
      if (demandSignalsRes.error) throw demandSignalsRes.error;
      if (recentRFQsRes.error) throw recentRFQsRes.error;
      if (capacityLanesRes.error) throw capacityLanesRes.error;

      const signalPages = signalPagesRes.data || [];
      const demandSignals = demandSignalsRes.data || [];
      const recentRFQs = recentRFQsRes.data || [];
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
        if (signal.decision_action === 'pending' || signal.lane_state === 'pending') {
          pendingByCell.set(key, (pendingByCell.get(key) || 0) + 1);
        }
        // Track most advanced lane state per cell
        const currentState = stateByCell.get(key);
        const signalState = (signal.lane_state || 'detected') as LaneState;
        const stateOrder: LaneState[] = ['detected', 'pending', 'activated', 'fulfilling', 'closed', 'lost'];
        if (!currentState || stateOrder.indexOf(signalState) > stateOrder.indexOf(currentState)) {
          stateByCell.set(key, signalState);
        }
      });

      // Build heatmap
      const heatmapMap = new Map<string, HeatmapCell>();
      
      signalPages.forEach((page: any) => {
        const key = `${(page.target_country || 'INDIA').toUpperCase()}-${page.category}`;
        const existing = heatmapMap.get(key);
        
        if (existing) {
          existing.intent_score += page.intent_score || 0;
          existing.rfqs_submitted += page.rfqs_submitted || 0;
        } else {
          const capacity = capacityMap.get(key);
          const laneState = stateByCell.get(key) || 'detected';
          
          heatmapMap.set(key, {
            country: (page.target_country || 'INDIA').toUpperCase(),
            category: page.category,
            intent_score: page.intent_score || 0,
            rfqs_submitted: page.rfqs_submitted || 0,
            rfqs_pending: pendingByCell.get(key) || 0,
            estimated_value: 0,
            priority_score: 0,
            lane_state: laneState,
            capacity_status: 'NO_CAPACITY',
            available_capacity: 0,
            deficit_value: 0,
            utilization_pct: 0,
          });
        }
      });

      // Add demand signal data
      demandSignals.forEach((signal: any) => {
        const key = `${(signal.country || 'IN').toUpperCase()}-${signal.category}`;
        const existing = heatmapMap.get(key);
        
        if (existing) {
          existing.estimated_value += signal.estimated_value || 0;
          existing.rfqs_pending = pendingByCell.get(key) || 0;
          existing.lane_state = stateByCell.get(key) || 'detected';
        } else {
          const laneState = stateByCell.get(key) || 'detected';
          heatmapMap.set(key, {
            country: (signal.country || 'IN').toUpperCase(),
            category: signal.category || 'Unknown',
            intent_score: 0,
            rfqs_submitted: 0,
            rfqs_pending: pendingByCell.get(key) || 0,
            estimated_value: signal.estimated_value || 0,
            priority_score: 0,
            lane_state: laneState,
            capacity_status: 'NO_CAPACITY',
            available_capacity: 0,
            deficit_value: 0,
            utilization_pct: 0,
          });
        }
      });

      // Enrich with capacity data and calculate priority
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

          return {
            ...cell,
            priority_score: (cell.intent_score * 0.4) 
              + (cell.rfqs_submitted * 0.3) 
              + ((cell.estimated_value || 0) / 1_000_000 * 0.3),
            capacity_status: capacityStatus.status,
            available_capacity: capacityStatus.available_capacity,
            deficit_value: capacityStatus.deficit_value,
            utilization_pct: capacityStatus.utilization_pct,
          };
        })
        .sort((a, b) => b.priority_score - a.priority_score);

      setHeatmap(heatmapData);

      // Calculate KPI tiles
      const pendingSignals = demandSignals.filter((s: any) => 
        s.decision_action === 'pending' || s.lane_state === 'pending' || s.lane_state === 'detected'
      );
      const totalSignals = pendingSignals.length;
      const totalRevenueAtRisk = pendingSignals.reduce((sum: number, s: any) => sum + (s.estimated_value || 0), 0);

      // Top country by intent
      const countryIntents = new Map<string, number>();
      heatmapData.forEach(cell => {
        countryIntents.set(cell.country, (countryIntents.get(cell.country) || 0) + cell.intent_score);
      });
      let topCountry: { label: string; value: number } | null = null;
      countryIntents.forEach((value, label) => {
        if (!topCountry || value > topCountry.value) topCountry = { label, value };
      });

      // Top category by intent
      const categoryIntents = new Map<string, number>();
      heatmapData.forEach(cell => {
        categoryIntents.set(cell.category, (categoryIntents.get(cell.category) || 0) + cell.intent_score);
      });
      let topCategory: { label: string; value: number } | null = null;
      categoryIntents.forEach((value, label) => {
        if (!topCategory || value > topCategory.value) topCategory = { label, value };
      });

      // NEW: Capacity utilization
      const avgCapacityUtilization = capacityData.length > 0
        ? capacityData.reduce((sum, l) => 
            sum + (Number(l.monthly_capacity_value) > 0 
              ? (Number(l.allocated_capacity_value) / Number(l.monthly_capacity_value)) * 100 
              : 0), 0) / capacityData.length
        : 0;

      // NEW: Demand-Capacity Gap
      const demandCapacityGap = heatmapData
        .filter(c => c.capacity_status === 'DEFICIT' || c.capacity_status === 'NO_CAPACITY')
        .reduce((sum, c) => sum + c.deficit_value, 0);

      // NEW: Active Lanes count
      const activeLanesSet = new Set(
        demandSignals
          .filter((s: any) => s.lane_state === 'activated' || s.lane_state === 'fulfilling')
          .map((s: any) => `${s.country}-${s.category}`)
      );

      // NEW: Avg Time to Activation (in days)
      const activationTimes = demandSignals
        .filter((s: any) => s.activated_at && (s.first_signal_at || s.created_at))
        .map((s: any) => {
          const start = new Date(s.first_signal_at || s.created_at).getTime();
          const end = new Date(s.activated_at).getTime();
          return (end - start) / (1000 * 60 * 60 * 24); // days
        })
        .filter((d: number) => d >= 0 && d < 365); // filter outliers

      const avgTimeToActivation = activationTimes.length > 0
        ? activationTimes.reduce((a: number, b: number) => a + b, 0) / activationTimes.length
        : 0;

      setTiles({
        totalSignals,
        totalRevenueAtRisk,
        topCountry,
        topCategory,
        rfqsLast7Days: recentRFQs.length,
        avgCapacityUtilization,
        demandCapacityGap,
        activeLanes: activeLanesSet.size,
        avgTimeToActivation,
      });

      // Generate urgent actions
      const urgentList: UrgentAction[] = heatmapData
        .filter(cell => cell.intent_score > 30 || cell.estimated_value > 5000000)
        .slice(0, 10)
        .map(cell => {
          let reason = '';
          if (cell.intent_score > 50) reason = 'High intent detected';
          else if (cell.estimated_value > 10000000) reason = 'Large deal opportunity';
          else if (cell.rfqs_pending === 0) reason = 'Intent but no pending RFQs';
          else reason = 'Active demand';

          const canAllocate = cell.lane_state === 'activated' && cell.capacity_status === 'OK';

          return {
            category: cell.category,
            country: cell.country,
            intent_score: cell.intent_score,
            rfqs_pending: cell.rfqs_pending,
            estimated_value: cell.estimated_value,
            reason,
            lane_state: cell.lane_state,
            can_allocate: canAllocate,
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

  // Lane activation action
  async function activateLane(country: string, category: string) {
    try {
      const { error } = await supabase
        .from('demand_intelligence_signals')
        .update({
          decision_action: 'activated',
          lane_state: 'activated',
          activated_at: new Date().toISOString(),
        })
        .eq('country', country.toLowerCase())
        .in('lane_state', ['detected', 'pending']);

      // Also try with original case
      await supabase
        .from('demand_intelligence_signals')
        .update({
          decision_action: 'activated',
          lane_state: 'activated',
          activated_at: new Date().toISOString(),
        })
        .eq('country', country)
        .eq('category', category)
        .in('lane_state', ['detected', 'pending']);

      if (error) throw error;
      
      toast.success(`Lane ${country} × ${category} activated`);
      fetchDashboard();
    } catch (error) {
      console.error('Error activating lane:', error);
      toast.error('Failed to activate lane');
    }
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

      // Update demand signals to fulfilling
      const { error: signalError } = await supabase
        .from('demand_intelligence_signals')
        .update({
          lane_state: 'fulfilling',
          fulfilling_at: new Date().toISOString(),
        })
        .eq('country', country.toLowerCase())
        .eq('category', category)
        .eq('lane_state', 'activated');

      // Also try with original case
      await supabase
        .from('demand_intelligence_signals')
        .update({
          lane_state: 'fulfilling',
          fulfilling_at: new Date().toISOString(),
        })
        .eq('country', country)
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

  // Filter heatmap
  const filteredHeatmap = heatmap.filter(cell => {
    if (selectedCountry && cell.country !== selectedCountry) return false;
    if (selectedCategory && cell.category !== selectedCategory) return false;
    if (selectedLaneState && cell.lane_state !== selectedLaneState) return false;
    return true;
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
            Global Demand Heatmap
          </h2>
          <p className="text-muted-foreground text-sm">
            Real-time demand intelligence across {uniqueCountries.length} countries × {uniqueCategories.length} categories
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

      {/* Top KPI Tiles - Original 5 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/5">
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

        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
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

        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/5">
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

        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
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
              {tiles.avgCapacityUtilization.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg across lanes</p>
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
              {tiles.avgTimeToActivation > 0 ? `${tiles.avgTimeToActivation.toFixed(1)}d` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Days to activation</p>
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
                          {formatCategoryName(cell.category)}
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
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium">
                          {formatCategoryName(action.category)}
                        </div>
                        {getLaneStateBadge(action.lane_state)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{getCountryFlag(action.country)}</span>
                        <span>{action.country}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(action.estimated_value)}
                        </span>
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

      {/* Strategy Insights */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Demand Intelligence Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Country Expansion Signal
              </h4>
              <p className="text-muted-foreground">
                {tiles.topCountry && tiles.topCountry.value > 50 
                  ? `${tiles.topCountry.label} shows strong demand. Consider opening a fulfillment lane.`
                  : 'Monitor emerging markets for expansion opportunities.'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                Category Focus
              </h4>
              <p className="text-muted-foreground">
                {tiles.topCategory 
                  ? `${formatCategoryName(tiles.topCategory.label)} leads demand. Prioritize supplier onboarding.`
                  : 'Build supplier capacity across high-intent categories.'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-500" />
                Capacity Alert
              </h4>
              <p className="text-muted-foreground">
                {tiles.demandCapacityGap > 10000000 
                  ? `${formatCurrency(tiles.demandCapacityGap)} demand exceeds capacity. Urgent supplier expansion needed.`
                  : tiles.avgCapacityUtilization > 80
                    ? 'Capacity utilization high. Consider adding supplier lanes.'
                    : 'Capacity healthy. Focus on demand activation.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDemandHeatmap;
