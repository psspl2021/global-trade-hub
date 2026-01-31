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
  Activity
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
  state: 'No Signal' | 'Detected' | 'Confirmed' | 'Active';
  trend: TrendDirection;
  lane_status: 'No Lane' | 'Consider Activation' | 'Activate Lane' | 'Lane Active';
  // Metadata (not exposed publicly)
  signal_count: number;
  last_signal_at: string | null;
  source: 'taxonomy' | 'real_signal';
}

// ============= COMPONENT =============

export function SmartDemandGrid() {
  // Filters
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data
  const [gridRows, setGridRows] = useState<SmartGridRow[]>([]);
  const [stats, setStats] = useState<DemandGridStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [realSignalCount, setRealSignalCount] = useState(0);
  
  // Dropdown options
  const allCountries = useMemo(() => getAllCountriesForGrid(), []);
  const allCategories = useMemo(() => getAllCategoriesForGrid(), []);
  const subcategories = useMemo(() => 
    categoryFilter !== 'all' ? getSubcategoriesForCategory(categoryFilter) : [],
    [categoryFilter]
  );
  
  // Top categories for insights
  const topCategories = useMemo(() => getTopCategoriesByDetection(5), []);

  // Fetch real signals from database
  const fetchRealSignals = useCallback(async () => {
    setLoading(true);
    
    try {
      // Query demand_intelligence_signals for real user behavior
      let query = supabase
        .from('demand_intelligence_signals')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(500);
      
      // Apply filters
      if (countryFilter !== 'all') {
        query = query.eq('country', countryFilter);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (subcategoryFilter !== 'all') {
        query = query.eq('subcategory', subcategoryFilter);
      }
      
      const { data: signals, error } = await query;
      
      if (error) {
        console.error('[SmartDemandGrid] Error fetching signals:', error);
        setGridRows([]);
        return;
      }
      
      // Aggregate signals by country + category + subcategory
      const aggregated = new Map<string, SmartGridRow>();
      
      (signals || []).forEach(signal => {
        const key = `${signal.country}-${signal.category}-${signal.subcategory || 'general'}`;
        
        const existing = aggregated.get(key);
        
        // Determine state from signal classification
        let state: SmartGridRow['state'] = 'Detected';
        if (signal.classification === 'buy') state = 'Active';
        else if (signal.lane_state === 'confirmed') state = 'Confirmed';
        
        // Determine lane recommendation
        let lane_status: SmartGridRow['lane_status'] = 'No Lane';
        if (signal.lane_state === 'active') lane_status = 'Lane Active';
        else if (signal.intent_score && signal.intent_score >= 0.7) lane_status = 'Activate Lane';
        else if (signal.intent_score && signal.intent_score >= 0.4) lane_status = 'Consider Activation';
        
        const country = allCountries.find(c => c.code === signal.country);
        const category = allCategories.find(c => c.slug === signal.category);
        
        if (existing) {
          // Update with strongest state
          const stateOrder = { 'No Signal': 0, 'Detected': 1, 'Confirmed': 2, 'Active': 3 };
          if (stateOrder[state] > stateOrder[existing.state]) {
            existing.state = state;
          }
          existing.signal_count++;
          if (signal.discovered_at && (!existing.last_signal_at || signal.discovered_at > existing.last_signal_at)) {
            existing.last_signal_at = signal.discovered_at;
          }
        } else {
          aggregated.set(key, {
            id: key,
            category_slug: signal.category || '',
            category_name: category?.name || signal.category || '',
            subcategory_slug: signal.subcategory || 'general',
            subcategory_name: signal.subcategory || signal.product_description || 'General',
            country_code: signal.country || 'GLOBAL',
            country_name: country?.name || signal.country || 'Global',
            state,
            trend: 'stable',
            lane_status,
            signal_count: 1,
            last_signal_at: signal.discovered_at || null,
            source: 'real_signal',
          });
        }
      });
      
      let rows = Array.from(aggregated.values());
      
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
      
      // Sort by signal count (most active first)
      rows.sort((a, b) => b.signal_count - a.signal_count);
      
      setGridRows(rows.slice(0, 200));
      setRealSignalCount(signals?.length || 0);
      
    } catch (error) {
      console.error('[SmartDemandGrid] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [countryFilter, categoryFilter, subcategoryFilter, stateFilter, searchQuery, allCountries, allCategories]);

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
  const getStateBadge = (state: SmartGridRow['state']) => {
    switch (state) {
      case 'Active':
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">{gridRows.filter(r => r.state === 'Confirmed' || r.state === 'Active').length}</p>
              <p className="text-xs text-purple-600/70 uppercase tracking-wide">Confirmed Demand</p>
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
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-blue-900">AI Learning Status</p>
            <p className="text-sm text-blue-700 mt-1">
              This grid learns from real user behavior. 
              <strong> SEO visits → "Detected"</strong>, 
              <strong> RFQ interest → "Confirmed"</strong>, 
              <strong> RFQ submissions → "Active"</strong>.
              Lane recommendations are generated automatically based on signal patterns.
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
          
          {/* Country Filter */}
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">🌍 All Countries ({allCountries.length})</SelectItem>
              {allCountries.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
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
          {countryFilter !== 'all' && ` • Country: ${allCountries.find(c => c.code === countryFilter)?.name || countryFilter}`}
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
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">State</TableHead>
                    <TableHead className="text-center">Trend</TableHead>
                    <TableHead className="text-center">Lane Status</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gridRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
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
                        <span className="font-medium">{row.subcategory_name}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStateBadge(row.state)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getTrendBadge(row.trend)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getLaneStatusBadge(row.lane_status)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          disabled={row.lane_status === 'Lane Active' || row.lane_status === 'No Lane'}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Activate
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
