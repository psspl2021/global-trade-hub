/**
 * AI Insights Card - Rules-Based Intelligence Layer
 * 
 * Provides intelligent explanations for demand heatmap data.
 * This is a rules-based system, not machine learning.
 */

import { Brain, Lightbulb, Activity, TrendingUp, Globe, Building2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AIInsightsCardProps {
  topCountry: { label: string; value: number } | null;
  topCategory: { label: string; value: number } | null;
  totalSignals: number;
  totalRevenueAtRisk: number;
  rfqsLast7Days: number;
  avgCapacityUtilization: number;
  demandCapacityGap: number;
  activeLanes: number;
  hasData: boolean;
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount?.toFixed(0) || 0}`;
}

function formatCategoryName(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function generateCountryInsight(country: { label: string; value: number } | null, rfqs: number): string {
  if (!country) {
    return "No dominant country detected yet. AI is monitoring intent signals across all regions.";
  }
  
  const score = country.value;
  const name = country.label;
  
  if (score > 100) {
    return `${name} ranks highest due to sustained buyer intent signals and SEO traffic. This indicates active procurement research from enterprise buyers in this region.`;
  } else if (score > 50) {
    return `${name} shows moderate demand activity. Intent signals suggest growing buyer interest—consider activating supplier lanes to capture this demand.`;
  } else if (score > 0) {
    return `${name} has emerging demand signals. Early-stage buyer research detected. Monitor for conversion to RFQs.`;
  }
  
  return `${name} has minimal activity. AI continues monitoring for demand emergence.`;
}

function generateCategoryInsight(category: { label: string; value: number } | null, activeLanes: number): string {
  if (!category) {
    return "No trending category identified. AI is analyzing buyer search patterns across all product segments.";
  }
  
  const score = category.value;
  const name = formatCategoryName(category.label);
  
  if (score > 100) {
    return `${name} is trending due to high buyer search volume and RFQ submissions. This category has proven demand and should be prioritized for supplier acquisition.`;
  } else if (score > 50) {
    return `${name} shows consistent interest. Buyers are actively researching this category. Ensure verified suppliers are available.`;
  } else if (score > 0) {
    return `${name} has initial traction. Early demand signals detected from enterprise buyers.`;
  }
  
  return `${name} is emerging. AI is tracking intent patterns.`;
}

function generateNextAction(
  topCountry: { label: string; value: number } | null,
  topCategory: { label: string; value: number } | null,
  demandCapacityGap: number,
  activeLanes: number,
  rfqs: number
): string {
  // High priority: Capacity gap
  if (demandCapacityGap > 10000000) {
    return `Priority: Address ${formatCurrency(demandCapacityGap)} demand-capacity gap. Invite suppliers for high-demand lanes to capture revenue.`;
  }
  
  // No active lanes
  if (activeLanes === 0 && (topCountry || topCategory)) {
    const target = topCountry?.label || formatCategoryName(topCategory?.label || '');
    return `Activate your first lane for ${target}. This enables supplier matching and RFQ fulfillment.`;
  }
  
  // Recent RFQs but low activation
  if (rfqs > 0 && activeLanes < 3) {
    return `${rfqs} RFQs received this week. Consider activating additional lanes to improve fulfillment coverage.`;
  }
  
  // Healthy state
  if (topCountry && topCategory) {
    return `Focus supplier outreach on ${formatCategoryName(topCategory.label)} in ${topCountry.label}. This combination shows the highest monetization potential.`;
  }
  
  return "Continue monitoring. AI will alert when actionable demand signals emerge.";
}

export function AIInsightsCard({
  topCountry,
  topCategory,
  totalSignals,
  totalRevenueAtRisk,
  rfqsLast7Days,
  avgCapacityUtilization,
  demandCapacityGap,
  activeLanes,
  hasData,
}: AIInsightsCardProps) {
  // No data state - show monitoring message
  if (!hasData) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            AI Insights
            <Badge variant="outline" className="ml-2 text-xs font-normal">
              <Activity className="h-3 w-3 mr-1" />
              Monitoring
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI Monitoring Live Demand</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The demand intelligence system is operational and monitoring buyer activity across all regions and categories.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  AI insights will activate once RFQs, supplier bids, or significant SEO intent is detected. This ensures all recommendations are based on real, actionable demand.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Tip: Share signal pages with potential buyers to generate demand signals.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has data - show insights
  const countryInsight = generateCountryInsight(topCountry, rfqsLast7Days);
  const categoryInsight = generateCategoryInsight(topCategory, activeLanes);
  const nextAction = generateNextAction(topCountry, topCategory, demandCapacityGap, activeLanes, rfqsLast7Days);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI Insights
          <Badge variant="outline" className="ml-2 text-xs font-normal text-green-600 border-green-300">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Country Insight */}
        {topCountry && (
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-200/30">
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                  AI Insight: Top Country
                </p>
                <p className="text-sm text-foreground/90">{countryInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Category Insight */}
        {topCategory && (
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-200/30">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">
                  AI Insight: Trending Category
                </p>
                <p className="text-sm text-foreground/90">{categoryInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Next Action */}
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-200/30">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
                AI Recommendation
              </p>
              <p className="text-sm text-foreground/90">{nextAction}</p>
            </div>
          </div>
        </div>

        {/* Capacity Warning */}
        {demandCapacityGap > 5000000 && (
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-200/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
                  AI Alert: Capacity Gap
                </p>
                <p className="text-sm text-foreground/90">
                  {formatCurrency(demandCapacityGap)} in detected demand exceeds current supplier capacity. Revenue at risk without additional supplier lanes.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIInsightsCard;
