/**
 * ============================================================
 * DEMAND FORECAST PANEL (ADMIN)
 * ============================================================
 * 
 * AI-powered demand forecasting dashboard showing:
 * - Projected intent by category × country
 * - Velocity indicators (trending up/down)
 * - Confidence scores
 * - 7-day vs 30-day trends
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Loader2,
  RefreshCw,
  Target,
  Gauge,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { countries } from '@/data/countries';
import { getMappedCategories } from '@/data/categorySubcategoryMap';

interface ForecastData {
  category: string;
  country: string;
  projected_intent: number;
  projected_rfqs: number;
  velocity_score: number;
  trend_7d: number;
  trend_30d: number;
  confidence_score: number;
  forecast_date: string;
}

export function DemandForecastPanel() {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [forecastDays, setForecastDays] = useState<number>(7);

  const categories = getMappedCategories();
  const countryOptions = countries.map(c => ({ value: c.code.toLowerCase(), label: c.name }));

  const fetchForecasts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_forecast_demand', {
        p_category: selectedCategory || null,
        p_country: selectedCountry || null,
        p_days: forecastDays
      });

      if (error) throw error;
      setForecasts((data || []) as ForecastData[]);
    } catch (err) {
      console.error('[DemandForecastPanel] Error:', err);
      toast.error('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedCountry, forecastDays]);

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  const getTrendIcon = (velocity: number) => {
    if (velocity >= 3) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (velocity <= -3) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getIntentColor = (intent: number) => {
    if (intent >= 8) return 'text-green-600 font-bold';
    if (intent >= 5) return 'text-amber-600 font-semibold';
    if (intent >= 3) return 'text-blue-600';
    return 'text-muted-foreground';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 70) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (confidence >= 40) return <Badge className="bg-amber-100 text-amber-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  // Summary stats
  const highIntentCount = forecasts.filter(f => f.projected_intent >= 7).length;
  const acceleratingCount = forecasts.filter(f => f.velocity_score >= 5).length;
  const totalProjectedRFQs = forecasts.reduce((sum, f) => sum + (f.projected_rfqs || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            AI Demand Forecast
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Projected demand based on weighted moving averages and trend analysis
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchForecasts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[150px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {countryOptions.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[120px]">
            <Select value={String(forecastDays)} onValueChange={(v) => setForecastDays(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">High Intent</span>
            </div>
            <div className="text-2xl font-bold text-green-800">{highIntentCount}</div>
            <div className="text-xs text-green-600">Projected intent ≥ 7</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Accelerating</span>
            </div>
            <div className="text-2xl font-bold text-amber-800">{acceleratingCount}</div>
            <div className="text-xs text-amber-600">Velocity score ≥ 5</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Projected RFQs</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">{totalProjectedRFQs}</div>
            <div className="text-xs text-blue-600">Next {forecastDays} days</div>
          </div>
        </div>

        {/* Forecast Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : forecasts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gauge className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No forecast data available</p>
            <p className="text-sm mt-1">Requires minimum 3 data points per category</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-center">Projected Intent</TableHead>
                <TableHead className="text-center">Velocity</TableHead>
                <TableHead className="text-center">7d Trend</TableHead>
                <TableHead className="text-center">30d Trend</TableHead>
                <TableHead className="text-center">Est. RFQs</TableHead>
                <TableHead className="text-center">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecasts.slice(0, 20).map((forecast, idx) => (
                <TableRow key={`${forecast.category}-${forecast.country}-${idx}`}>
                  <TableCell className="font-medium">{forecast.category}</TableCell>
                  <TableCell>{forecast.country?.toUpperCase()}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={getIntentColor(forecast.projected_intent)}>
                        {forecast.projected_intent.toFixed(1)}
                      </span>
                      <Progress 
                        value={forecast.projected_intent * 10} 
                        className="w-16 h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(forecast.velocity_score)}
                      <span className={
                        forecast.velocity_score >= 3 ? 'text-green-600' :
                        forecast.velocity_score <= -3 ? 'text-red-600' :
                        'text-muted-foreground'
                      }>
                        {forecast.velocity_score > 0 ? '+' : ''}{forecast.velocity_score.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={forecast.trend_7d >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {forecast.trend_7d > 0 ? '+' : ''}{forecast.trend_7d.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={forecast.trend_30d >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {forecast.trend_30d > 0 ? '+' : ''}{forecast.trend_30d.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {forecast.projected_rfqs}
                  </TableCell>
                  <TableCell className="text-center">
                    {getConfidenceBadge(forecast.confidence_score)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default DemandForecastPanel;
