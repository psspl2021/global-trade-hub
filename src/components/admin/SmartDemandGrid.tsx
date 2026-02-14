/**
 * ============================================================
 * SMART DEMAND GRID (LEARNING-ENABLED)
 * ============================================================
 * 
 * Enhanced demand grid that LEARNS from real user behavior.
 * Connects SEO signals to grid state updates.
 * 
 * Grid State Logic:
 * - SEO_VISIT detected → State = "Detected"
 * - RFQ_INTEREST detected → State = "Confirmed" 
 * - RFQ_SUBMITTED → Lane Recommendation = "Activate Lane"
 * 
 * NEVER exposes: counts, revenue, scores
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Globe, 
  Filter, 
  Search,
  TrendingUp,
  Zap,
  RefreshCw,
  Info,
  Package,
  MapPin,
  Layers,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  Activity,
  UserCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getDemandGridStats,
  getAllCountriesForGrid,
  getAllCategoriesForGrid,
  getSubcategoriesForCategory,
  getTopCategoriesByDetection,
  logDemandGridStats,
  type DemandGridStats
} from "@/lib/demandGridGenerator";
import { IllustrativeDisclaimer } from "@/components/IllustrativeDisclaimer";
import {
  getTrendEmoji,
  getTrendLabel,
  calculateTrendDirection,
  TrendDirection,
} from "@/lib/demandSignalCapture";

// Enhanced row type with learning state
interface SmartGridRow {
  id: string;
  category_slug: string;
  category_name: string;
  subcategory_slug: string;
  subcategory_name: string;
  country_code: string;
  country_name: string;
  // Learning-derived states
  state: 'No Signal' | 'Detected' | 'Confirmed' | 'Active' | 'Activated';
  trend: TrendDirection;
  lane_status: 'No Lane' | 'Consider Activation' | 'Activate Lane' | 'Lane Active';
  // Metadata (not exposed publicly)
  signal_count: number;
  last_signal_at: string | null;
  source: 'taxonomy' | 'real_signal' | 'seo_rfq' | 'activation';
  // Aggregated intent score: SUM(intent_score * 10)
  aggregated_intent?: number;
  rfq_count?: number;
  // Buyer activation flag
  has_activation_signal?: boolean;
  // Lane state from DB (detected, pending, activated, fulfilling, closed, lost)
  db_lane_state?: string;
}

// ============= IMPORTS FOR REGION SUPPORT =============
import { getAllRegions, getRegionName, type Region } from '@/data/countryMaster';
import { useCountriesMaster } from '@/hooks/useCountriesMaster';

// ============= COMPONENT =============

export function SmartDemandGrid() {
  // Filters
  const [regionFilter, setRegionFilter] = useState<string>("all"); // NEW: Region filter
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [tradeTypeFilter, setTradeTypeFilter] = useState<string>("all"); // NEW: Trade type filter
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data
  const [gridRows, setGridRows] = useState<SmartGridRow[]>([]);
  const [stats, setStats] = useState<DemandGridStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [realSignalCount, setRealSignalCount] = useState(0);
  
  // DB-driven country list (no hardcoded arrays)
  const { countries: dbCountries, loading: countriesLoading, getFlag } = useCountriesMaster();
  
  // Dropdown options
  const allCountries = useMemo(() => 
    dbCountries.map(c => ({ code: c.iso_code, name: c.country_name, flag: getFlag(c.iso_code), region: c.region || '' })),
    [dbCountries, getFlag]
  );
  const allCategories = useMemo(() => getAllCategoriesForGrid(), []);
  const allRegions = useMemo(() => {
    const dbRegions = [...new Set(dbCountries.map(c => c.region).filter(Boolean))] as string[];
    return dbRegions.length > 0 ? dbRegions : getAllRegions();
  }, [dbCountries]);
  const subcategories = useMemo(() => 
    categoryFilter !== 'all' ? getSubcategoriesForCategory(categoryFilter) : [],
    [categoryFilter]
  );
  
  // Filter countries by selected region
  const filteredCountries = useMemo(() => {
    if (regionFilter === 'all') return allCountries;
    return allCountries.filter(c => c.region === regionFilter);
  }, [allCountries, regionFilter]);
  
  // Top categories for insights
  const topCategories = useMemo(() => getTopCategoriesByDetection(5), []);

  // Activate lane via canonical RPC — finds matching signals and activates them
  const activateLane = useCallback(async (country: string, category: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[SmartDemandGrid] No authenticated user');
        return false;
      }

      // Find signals for this country+category that can be activated
      const { data: signals, error: fetchError } = await supabase
        .from('demand_intelligence_signals')
        .select('id')
        .eq('country', country.toUpperCase())
        .eq('category', category)
        .not('lane_state', 'in', '(activated,fulfilling,closed,lost)');

      if (fetchError || !signals?.length) {
        console.error('[SmartDemandGrid] No activatable signals found:', fetchError);
        return false;
      }

      let activated = 0;
      for (const signal of signals) {
        const { data: result, error: rpcError } = await (supabase.rpc as any)('activate_demand_lane', {
          p_signal_id: signal.id,
          p_admin_id: user.id,
        });
        if (!rpcError && result?.success) activated++;
      }

      console.log(`[SmartDemandGrid] Activated ${activated}/${signals.length} signals`);
      return activated > 0;
    } catch (err) {
      console.error('[SmartDemandGrid] Lane activation failed:', err);
      return false;
    }
  }, []);

  // Fetch AGGREGATED signals using unified RPC (demand_intelligence + buyer_activation)
  const fetchRealSignals = useCallback(async () => {
    setLoading(true);
    
    try {
      // Use the unified aggregation function with buyer activation signals
      const { data, error } = await supabase
        .rpc('get_demand_intelligence_grid', {
          p_days_back: 7
        });
      
      if (error) {
        console.error('[SmartDemandGrid] Error fetching grid:', error);
        setGridRows([]);
        setLoading(false);
        return;
      }
      
      // Transform aggregated results to grid rows - NO client-side math
      let rows: SmartGridRow[] = (data || []).map((row: any) => {
        const key = `${row.country}-${row.category}`;
        const dbLaneState = row.lane_state || 'detected';
        
        // State: determine from DB lane_state first, then fallback to intent
        let state: SmartGridRow['state'];
        if (dbLaneState === 'activated' || dbLaneState === 'fulfilling') {
          state = 'Activated';
        } else if (row.has_activation) {
          state = 'Active';
        } else if (row.intent >= 7) {
          state = 'Active';
        } else if (row.intent >= 4) {
          state = 'Confirmed';
        } else {
          state = 'Detected';
        }
        
        // Lane status: based on DB lane_state
        let lane_status: SmartGridRow['lane_status'];
        if (dbLaneState === 'activated' || dbLaneState === 'fulfilling' || dbLaneState === 'closed') {
          lane_status = 'Lane Active';
        } else if (row.has_activation || row.intent >= 7 || row.rfqs > 0) {
          lane_status = 'Activate Lane';
        } else if (row.intent >= 4) {
          lane_status = 'Consider Activation';
        } else {
          lane_status = 'No Lane';
        }
        
        const country = allCountries.find(c => c.code === row.country);
        const category = allCategories.find(c => c.slug === row.category);
        
        return {
          id: key,
          category_slug: row.category || '',
          category_name: category?.name || row.category || '',
          subcategory_slug: 'general',
          subcategory_name: row.category || 'General',
          country_code: row.country || 'GLOBAL',
          country_name: country?.name || row.country || 'Global',
          state,
          trend: 'stable' as TrendDirection,
          lane_status,
          signal_count: 1,
          last_signal_at: null,
          source: row.source || 'real_signal',
          // Intent score directly from DB aggregation
          aggregated_intent: row.intent,
          rfq_count: row.rfqs,
          has_activation_signal: row.has_activation,
          db_lane_state: dbLaneState,
        };
      });
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        rows = rows.filter(row => 
          row.subcategory_name.toLowerCase().includes(query) ||
          row.category_name.toLowerCase().includes(query) ||
          row.country_name.toLowerCase().includes(query)
        );
      }
      
      // Apply state filter
      if (stateFilter !== 'all') {
        rows = rows.filter(row => row.state === stateFilter);
      }
      
      // Apply region filter (NEW)
      if (regionFilter !== 'all') {
        const countriesInRegion = filteredCountries.map(c => c.code);
        rows = rows.filter(row => countriesInRegion.includes(row.country_code));
      }
      
      // Apply country filter (additional client filter if needed)
      if (countryFilter !== 'all') {
        rows = rows.filter(row => row.country_code === countryFilter);
      }
      
      // Apply category filter
      if (categoryFilter !== 'all') {
        rows = rows.filter(row => row.category_slug === categoryFilter);
      }
      
      // Apply trade type filter (NEW)
      // Domestic = IN only, Export = non-IN
      if (tradeTypeFilter === 'domestic') {
        rows = rows.filter(row => row.country_code === 'IN');
      } else if (tradeTypeFilter === 'export') {
        rows = rows.filter(row => row.country_code !== 'IN');
      }
      
      setGridRows(rows.slice(0, 200));
      
      // Calculate total signals
      const totalSignals = rows.length;
      setRealSignalCount(totalSignals);
      
    } catch (error) {
      console.error('[SmartDemandGrid] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [regionFilter, countryFilter, categoryFilter, stateFilter, tradeTypeFilter, searchQuery, allCountries, allCategories, filteredCountries]);

  // Reset country when region changes
  useEffect(() => {
    if (regionFilter !== 'all') {
      setCountryFilter('all');
    }
  }, [regionFilter]);
  // Fetch stats on mount
  useEffect(() => {
    const statsData = getDemandGridStats();
    setStats(statsData);
    logDemandGridStats();
  }, []);
  
  // Fetch real signals when filters change
  useEffect(() => {
    fetchRealSignals();
  }, [fetchRealSignals]);
  
  // Reset subcategory when category changes
  useEffect(() => {
    setSubcategoryFilter("all");
  }, [categoryFilter]);

  // Format functions
  const getStateBadge = (state: SmartGridRow['state'], hasActivation?: boolean, dbLaneState?: string) => {
    // Show activated state for lanes that have been activated
    if (dbLaneState === 'activated' || dbLaneState === 'fulfilling') {
      return <Badge className="bg-green-600 text-white"><CheckCircle className="w-3 h-3 mr-1" />Lane Activated</Badge>;
    }
    if (hasActivation) {
      return <Badge className="bg-purple-600 text-white"><Zap className="w-3 h-3 mr-1" />Buyer Activated</Badge>;
    }
    switch (state) {
      case 'Active':
      case 'Activated':
        return <Badge className="bg-green-600 text-white"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'Confirmed':
        return <Badge className="bg-blue-600 text-white"><Activity className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'Detected':
        return <Badge variant="secondary">Detected</Badge>;
      default:
        return <Badge variant="outline">No Signal</Badge>;
    }
  };

  const getLaneStatusBadge = (status: SmartGridRow['lane_status']) => {
    switch (status) {
      case 'Lane Active':
        return <Badge className="bg-green-600 text-white">Lane Active</Badge>;
      case 'Activate Lane':
        return <Badge className="bg-amber-600 text-white">Activate Lane</Badge>;
      case 'Consider Activation':
        return <Badge className="bg-yellow-500 text-black">Consider</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500">No Lane</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'activation':
        return <Badge variant="outline" className="border-purple-300 text-purple-600 text-xs">Buyer Intent</Badge>;
      case 'seo_rfq':
        return <Badge variant="outline" className="border-blue-300 text-blue-600 text-xs">SEO/RFQ</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Signal</Badge>;
    }
  };
  
  // Handle lane activation with feedback
  const handleActivateLane = async (row: SmartGridRow) => {
    toast.loading(`Activating lane ${row.country_code} × ${row.category_slug}...`, { id: 'lane-activate' });
    const success = await activateLane(row.country_code, row.category_slug);
    if (success) {
      toast.success(`Lane ${row.country_name} × ${row.category_name} activated!`, { id: 'lane-activate' });
      // Refresh grid
      fetchRealSignals();
    } else {
      toast.error('Failed to activate lane', { id: 'lane-activate' });
    }
  };

  const getTrendBadge = (trend: TrendDirection) => {
    const label = getTrendLabel(trend);
    const emoji = getTrendEmoji(trend);
    
    switch (trend) {
      case 'emerging':
        return (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <ArrowUp className="w-3 h-3" />{label}
          </span>
        );
      case 'cooling':
        return (
          <span className="flex items-center gap-1 text-red-500 text-sm">
            <ArrowDown className="w-3 h-3" />{label}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-gray-500 text-sm">
            <ArrowRight className="w-3 h-3" />{label}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Smart Demand Grid</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered learning from real user behavior • {realSignalCount} real signals tracked
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-300 text-green-600">
            <Activity className="w-3 h-3 mr-1" />
            Learning Mode Active
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchRealSignals}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI INSIGHTS PANEL */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats?.totalCountries || 0}</p>
              <p className="text-xs text-blue-600/70 uppercase tracking-wide">Countries Covered</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">{realSignalCount}</p>
              <p className="text-xs text-green-600/70 uppercase tracking-wide">Real Signals</p>
            </div>
          </div>
        </Card>
        
        {/* NEW: Buyer Activation Signals */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {gridRows.filter(r => r.has_activation_signal).length}
              </p>
              <p className="text-xs text-purple-600/70 uppercase tracking-wide">Buyer Activated</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="text-2xl font-bold text-indigo-700">{gridRows.filter(r => r.state === 'Confirmed' || r.state === 'Active').length}</p>
              <p className="text-xs text-indigo-600/70 uppercase tracking-wide">Confirmed Demand</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{gridRows.filter(r => r.lane_status === 'Activate Lane').length}</p>
              <p className="text-xs text-amber-600/70 uppercase tracking-wide">Lane Recommendations</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI INSIGHT */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-purple-900">Unified Demand Intelligence</p>
            <p className="text-sm text-purple-700 mt-1">
              This grid combines <strong>SEO signals</strong>, <strong>RFQ activity</strong>, and <strong>Buyer Activation signals</strong> (draft abandonment, repeat drafts).
              Rows with <Badge className="bg-purple-600 text-white text-xs mx-1 py-0">Buyer Activated</Badge> indicate high-intent buyers who started but didn't complete RFQs—prioritize these for lane activation!
            </p>
          </div>
        </div>
      </Card>

      {/* FILTERS */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          {/* Region Filter (NEW) */}
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All Regions</SelectItem>
              {allRegions.map(region => (
                <SelectItem key={region} value={region}>
                  {getRegionName(region as Region)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Country Filter */}
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">🌍 All Countries ({filteredCountries.length})</SelectItem>
              {filteredCountries.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Trade Type Filter (NEW) */}
          <Select value={tradeTypeFilter} onValueChange={setTradeTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trade</SelectItem>
              <SelectItem value="domestic">🇮🇳 Domestic</SelectItem>
              <SelectItem value="export">🚢 Export</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">📦 All Categories ({allCategories.length})</SelectItem>
              {allCategories.map(cat => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* State Filter */}
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Detected">Detected</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="mt-3 text-sm text-muted-foreground">
          Showing {gridRows.length} rows with real demand signals
          {regionFilter !== 'all' && ` • Region: ${getRegionName(regionFilter as Region)}`}
          {countryFilter !== 'all' && ` • Country: ${filteredCountries.find(c => c.code === countryFilter)?.name || countryFilter}`}
          {tradeTypeFilter !== 'all' && ` • Trade: ${tradeTypeFilter === 'domestic' ? 'Domestic' : 'Export'}`}
          {categoryFilter !== 'all' && ` • Category: ${allCategories.find(c => c.slug === categoryFilter)?.name || categoryFilter}`}
        </div>
      </Card>

      {/* DEMAND GRID TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
              <p>Learning from demand signals...</p>
            </div>
          ) : gridRows.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Globe className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No demand signals yet</p>
              <p className="text-sm">Real signals will appear as users visit SEO pages and submit RFQs.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px]">Country</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-center">Intent</TableHead>
                    <TableHead className="text-center">RFQs</TableHead>
                    <TableHead className="text-center">State</TableHead>
                    <TableHead className="text-center">Lane Status</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gridRows.map((row) => (
                    <TableRow 
                      key={row.id} 
                      className={`hover:bg-muted/30 ${row.has_activation_signal ? 'bg-purple-50/50' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">{row.country_name}</span>
                          <span className="text-xs text-muted-foreground">({row.country_code})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {row.category_name.length > 25 
                            ? row.category_name.substring(0, 25) + '...' 
                            : row.category_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getSourceBadge(row.source)}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        <span className={
                          row.has_activation_signal ? 'text-purple-600' :
                          row.aggregated_intent >= 7 ? 'text-green-600' :
                          row.aggregated_intent >= 4 ? 'text-amber-600' :
                          'text-muted-foreground'
                        }>
                          {row.aggregated_intent}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {(row.rfq_count || 0) > 0 ? (
                          <Badge className="bg-green-600 text-white">{row.rfq_count}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStateBadge(row.state, row.has_activation_signal, row.db_lane_state)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getLaneStatusBadge(row.lane_status)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant={row.db_lane_state === 'activated' ? "secondary" : row.has_activation_signal ? "default" : "outline"}
                          size="sm"
                          className={`text-xs ${row.has_activation_signal && row.db_lane_state !== 'activated' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                          disabled={row.lane_status === 'Lane Active' || row.lane_status === 'No Lane' || row.db_lane_state === 'activated'}
                          onClick={() => handleActivateLane(row)}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          {row.db_lane_state === 'activated' ? 'Activated ✓' : row.has_activation_signal ? 'Act Now' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* DISCLAIMER */}
      <IllustrativeDisclaimer variant="compact" />
    </div>
  );
}

export default SmartDemandGrid;
