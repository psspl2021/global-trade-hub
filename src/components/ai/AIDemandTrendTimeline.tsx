/**
 * AI Demand Trend Timeline
 * 
 * Shows last 6 months of illustrative trend labels.
 * NO numbers, NO graphs - text-only pattern language.
 * For supplier pages only.
 */

import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IllustrativeDisclaimer } from '@/components/IllustrativeDisclaimer';

interface TrendMonth {
  month: string;
  trend: 'rising' | 'stable' | 'seasonal' | 'emerging';
}

interface AIDemandTrendTimelineProps {
  categorySlug: string;
  productName?: string;
}

// Pattern-based trend generation (no real data, illustrative only)
function generateIllustrativeTrends(categorySlug: string): TrendMonth[] {
  const now = new Date();
  const months: TrendMonth[] = [];
  
  // Normalize slug for pattern matching
  const slug = categorySlug.toLowerCase();
  
  // Determine base pattern based on category
  let pattern: ('rising' | 'stable' | 'seasonal' | 'emerging')[] = [];
  
  if (slug.includes('steel') || slug.includes('metal') || slug.includes('construction')) {
    // Infrastructure categories: infrastructure projects drive seasonal spikes
    pattern = ['stable', 'rising', 'rising', 'stable', 'seasonal', 'rising'];
  } else if (slug.includes('food') || slug.includes('agriculture') || slug.includes('spice')) {
    // Agricultural: seasonal patterns
    pattern = ['seasonal', 'rising', 'stable', 'seasonal', 'emerging', 'stable'];
  } else if (slug.includes('chemical') || slug.includes('polymer') || slug.includes('plastic')) {
    // Industrial chemicals: steady industrial demand
    pattern = ['stable', 'stable', 'rising', 'stable', 'emerging', 'rising'];
  } else if (slug.includes('pharma') || slug.includes('medical') || slug.includes('health')) {
    // Healthcare: consistent rising trend
    pattern = ['rising', 'stable', 'rising', 'rising', 'stable', 'rising'];
  } else if (slug.includes('textile') || slug.includes('apparel') || slug.includes('fashion')) {
    // Fashion: seasonal patterns
    pattern = ['seasonal', 'stable', 'rising', 'seasonal', 'rising', 'stable'];
  } else if (slug.includes('electronic') || slug.includes('machinery')) {
    // Tech/machinery: emerging patterns
    pattern = ['emerging', 'stable', 'rising', 'emerging', 'stable', 'rising'];
  } else {
    // Default pattern
    pattern = ['stable', 'rising', 'stable', 'emerging', 'stable', 'rising'];
  }
  
  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({
      month: monthName,
      trend: pattern[5 - i],
    });
  }
  
  return months;
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'rising':
      return <TrendingUp className="h-3 w-3 text-emerald-600" />;
    case 'seasonal':
      return <Calendar className="h-3 w-3 text-amber-600" />;
    case 'emerging':
      return <TrendingUp className="h-3 w-3 text-blue-600" />;
    default:
      return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
}

function getTrendLabel(trend: string) {
  switch (trend) {
    case 'rising':
      return { label: 'Rising', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    case 'seasonal':
      return { label: 'Seasonal', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'emerging':
      return { label: 'Emerging', className: 'bg-blue-100 text-blue-700 border-blue-200' };
    default:
      return { label: 'Stable', className: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
}

export function AIDemandTrendTimeline({ categorySlug, productName }: AIDemandTrendTimelineProps) {
  const trends = generateIllustrativeTrends(categorySlug);
  
  return (
    <Card className="border-dashed border-primary/30 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          AI Demand Trend Signals
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
            Illustrative
          </Badge>
        </CardTitle>
        {productName && (
          <p className="text-xs text-muted-foreground">
            Pattern analysis for {productName} procurement activity
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Timeline */}
        <div className="flex items-center justify-between gap-1">
          {trends.map((item, index) => {
            const { label, className } = getTrendLabel(item.trend);
            return (
              <div 
                key={index} 
                className="flex flex-col items-center gap-1 flex-1"
              >
                <Badge 
                  variant="outline" 
                  className={`text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 ${className}`}
                >
                  {getTrendIcon(item.trend)}
                  <span className="hidden sm:inline">{label}</span>
                </Badge>
                <span className="text-[10px] text-muted-foreground">{item.month}</span>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-2.5 w-2.5 text-emerald-600" /> Rising interest
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Minus className="h-2.5 w-2.5" /> Stable demand
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 text-amber-600" /> Seasonal patterns
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-2.5 w-2.5 text-blue-600" /> Emerging signals
          </span>
        </div>
        
        {/* Disclaimer */}
        <IllustrativeDisclaimer variant="xs" />
      </CardContent>
    </Card>
  );
}
