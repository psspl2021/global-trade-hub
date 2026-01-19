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
 * This is NOT a CRM. This is NOT a lead tracker.
 * This is a GLOBAL DEMAND CONTROL ROOM.
 * 
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  RefreshCw
} from 'lucide-react';
import { supportedCountries } from '@/data/supportedCountries';

interface HeatmapCell {
  country: string;
  category: string;
  intent_score: number;
  rfqs_submitted: number;
  estimated_value: number;
}

interface TopMetric {
  label: string;
  value: number;
}

interface UrgentAction {
  category: string;
  country: string;
  intent_score: number;
  rfqs_pending: number;
  estimated_value: number;
  reason: string;
}

interface DashboardTiles {
  totalSignals: number;
  totalRevenueAtRisk: number;
  topCountry: TopMetric | null;
  topCategory: TopMetric | null;
  rfqsLast7Days: number;
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
  });
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [urgentActions, setUrgentActions] = useState<UrgentAction[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setRefreshing(true);
    try {
      // Fetch signal pages data
      const { data: signalPages, error: signalError } = await supabase
        .from('admin_signal_pages')
        .select('target_country, category, intent_score, rfqs_submitted, views')
        .eq('is_active', true);

      if (signalError) throw signalError;

      // Fetch pending demand signals
      const { data: demandSignals, error: demandError } = await supabase
        .from('demand_intelligence_signals')
        .select('country, category, estimated_value, decision_action, created_at')
        .eq('decision_action', 'pending');

      if (demandError) throw demandError;

      // Fetch RFQs from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentRFQs, error: rfqError } = await supabase
        .from('requirements')
        .select('id')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (rfqError) throw rfqError;

      // Build heatmap data
      const heatmapMap = new Map<string, HeatmapCell>();
      
      signalPages?.forEach((page: any) => {
        const key = `${page.target_country || 'INDIA'}-${page.category}`;
        const existing = heatmapMap.get(key);
        
        if (existing) {
          existing.intent_score += page.intent_score || 0;
          existing.rfqs_submitted += page.rfqs_submitted || 0;
        } else {
          heatmapMap.set(key, {
            country: page.target_country || 'INDIA',
            category: page.category,
            intent_score: page.intent_score || 0,
            rfqs_submitted: page.rfqs_submitted || 0,
            estimated_value: 0,
          });
        }
      });

      // Add revenue data from demand signals
      demandSignals?.forEach((signal: any) => {
        const key = `${signal.country?.toUpperCase() || 'INDIA'}-${signal.category}`;
        const existing = heatmapMap.get(key);
        
        if (existing) {
          existing.estimated_value += signal.estimated_value || 0;
        } else {
          heatmapMap.set(key, {
            country: signal.country?.toUpperCase() || 'INDIA',
            category: signal.category || 'Unknown',
            intent_score: 0,
            rfqs_submitted: 0,
            estimated_value: signal.estimated_value || 0,
          });
        }
      });

      const heatmapData = Array.from(heatmapMap.values())
        .sort((a, b) => b.intent_score - a.intent_score);

      setHeatmap(heatmapData);

      // Calculate tiles
      const totalSignals = demandSignals?.length || 0;
      const totalRevenueAtRisk = demandSignals?.reduce((sum: number, s: any) => sum + (s.estimated_value || 0), 0) || 0;

      // Find top country by intent
      const countryIntents = new Map<string, number>();
      heatmapData.forEach(cell => {
        const current = countryIntents.get(cell.country) || 0;
        countryIntents.set(cell.country, current + cell.intent_score);
      });
      
      let topCountry: TopMetric | null = null;
      countryIntents.forEach((value, label) => {
        if (!topCountry || value > topCountry.value) {
          topCountry = { label, value };
        }
      });

      // Find top category by intent
      const categoryIntents = new Map<string, number>();
      heatmapData.forEach(cell => {
        const current = categoryIntents.get(cell.category) || 0;
        categoryIntents.set(cell.category, current + cell.intent_score);
      });
      
      let topCategory: TopMetric | null = null;
      categoryIntents.forEach((value, label) => {
        if (!topCategory || value > topCategory.value) {
          topCategory = { label, value };
        }
      });

      setTiles({
        totalSignals,
        totalRevenueAtRisk,
        topCountry,
        topCategory,
        rfqsLast7Days: recentRFQs?.length || 0,
      });

      // Generate urgent actions
      const urgentList: UrgentAction[] = heatmapData
        .filter(cell => cell.intent_score > 30 || cell.estimated_value > 5000000)
        .slice(0, 10)
        .map(cell => {
          let reason = '';
          if (cell.intent_score > 50) reason = 'High intent detected';
          else if (cell.estimated_value > 10000000) reason = 'Large deal opportunity';
          else if (cell.rfqs_submitted === 0) reason = 'Intent but no RFQs';
          else reason = 'Active demand';

          return {
            category: cell.category,
            country: cell.country,
            intent_score: cell.intent_score,
            rfqs_pending: cell.rfqs_submitted,
            estimated_value: cell.estimated_value,
            reason,
          };
        });

      setUrgentActions(urgentList);

    } catch (error) {
      console.error('Error fetching demand dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      'INDIA': '🇮🇳',
      'UAE': '🇦🇪',
      'SAUDI': '🇸🇦',
      'QATAR': '🇶🇦',
      'KENYA': '🇰🇪',
      'NIGERIA': '🇳🇬',
    };
    return flags[code.toUpperCase()] || '🌍';
  }

  // Filter heatmap based on selections
  const filteredHeatmap = heatmap.filter(cell => {
    if (selectedCountry && cell.country !== selectedCountry) return false;
    if (selectedCategory && cell.category !== selectedCategory) return false;
    return true;
  });

  // Get unique countries and categories for filters
  const uniqueCountries = [...new Set(heatmap.map(h => h.country))];
  const uniqueCategories = [...new Set(heatmap.map(h => h.category))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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

      {/* Top KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Active Demand Signals */}
        <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Flame className="h-4 w-4 text-red-500" />
              Active Signals
            </div>
            <div className="text-3xl font-bold text-red-600">
              {tiles.totalSignals}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending decisions
            </p>
          </CardContent>
        </Card>

        {/* Top Country */}
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

        {/* Top Category */}
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

        {/* Revenue at Risk */}
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <IndianRupee className="h-4 w-4 text-green-500" />
              Revenue at Risk
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(tiles.totalRevenueAtRisk)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending fulfillment
            </p>
          </CardContent>
        </Card>

        {/* RFQs Last 7 Days */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4 text-amber-500" />
              RFQs (7 days)
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {tiles.rfqsLast7Days}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              New requirements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Heatmap + Urgent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Demand Intelligence Grid
              </CardTitle>
              <div className="flex gap-2">
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Country</th>
                    <th className="text-right p-3 font-medium">Intent</th>
                    <th className="text-right p-3 font-medium">RFQs</th>
                    <th className="text-right p-3 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHeatmap.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
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
                        <td className="p-3 text-right font-mono">
                          {cell.rfqs_submitted}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {formatCurrency(cell.estimated_value)}
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
                        <Badge variant="destructive" className="text-xs">
                          {action.intent_score} intent
                        </Badge>
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
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          Action
                        </Button>
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
                Revenue Opportunity
              </h4>
              <p className="text-muted-foreground">
                {tiles.totalRevenueAtRisk > 10000000 
                  ? `${formatCurrency(tiles.totalRevenueAtRisk)} in pending demand. Fast-track fulfillment.`
                  : 'Increase demand capture through signal page optimization.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDemandHeatmap;
