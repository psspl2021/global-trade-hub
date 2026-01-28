/**
 * AI Recommended Actions Card
 * 
 * Provides dynamic, rules-based suggestions for platform operations.
 * Actions are prioritized by potential revenue impact and urgency.
 */

import { Sparkles, ArrowRight, Users, Globe, Target, FileText, Megaphone, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HeatmapCell {
  country: string;
  category: string;
  intent_score: number;
  rfqs_submitted: number;
  estimated_value: number;
  lane_state: string;
  priority: 'revenue_high' | 'normal';
  capacity_status: 'OK' | 'DEFICIT' | 'NO_CAPACITY';
}

interface AIRecommendedActionsCardProps {
  topCountry: { label: string; value: number } | null;
  topCategory: { label: string; value: number } | null;
  heatmapData: HeatmapCell[];
  activeLanes: number;
  demandCapacityGap: number;
  rfqsLast7Days: number;
  onActivateLane?: (country: string, category: string) => void;
}

interface RecommendedAction {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionData?: { country: string; category: string };
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

function generateRecommendations(
  topCountry: { label: string; value: number } | null,
  topCategory: { label: string; value: number } | null,
  heatmapData: HeatmapCell[],
  activeLanes: number,
  demandCapacityGap: number,
  rfqsLast7Days: number
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  // 1. Enterprise lanes needing activation
  const enterprisePending = heatmapData
    .filter(cell => 
      cell.priority === 'revenue_high' && 
      (cell.lane_state === 'detected' || cell.lane_state === 'pending') &&
      cell.intent_score > 20
    )
    .sort((a, b) => b.intent_score - a.intent_score)
    .slice(0, 2);

  enterprisePending.forEach((lane, i) => {
    actions.push({
      id: `enterprise-${i}`,
      icon: <Target className="h-4 w-4 text-amber-500" />,
      title: `Activate ${formatCategoryName(lane.category)} lane for ${lane.country}`,
      description: `Enterprise lane with intent score ${lane.intent_score}. Early activation enables supplier shortlisting before RFQs arrive.`,
      priority: 'high',
      actionLabel: 'Activate Lane',
      actionData: { country: lane.country, category: lane.category }
    });
  });

  // 2. Capacity deficit warning
  const deficitLanes = heatmapData.filter(cell => 
    cell.capacity_status === 'DEFICIT' && cell.estimated_value > 1000000
  );

  if (deficitLanes.length > 0) {
    const topDeficit = deficitLanes[0];
    actions.push({
      id: 'capacity-deficit',
      icon: <Users className="h-4 w-4 text-red-500" />,
      title: `Invite suppliers for ${formatCategoryName(topDeficit.category)}`,
      description: `Demand exceeds capacity. Onboard suppliers to capture ${formatCurrency(topDeficit.estimated_value)} in potential revenue.`,
      priority: 'high'
    });
  }

  // 3. Geographic expansion
  if (topCountry && topCountry.value > 50) {
    const countryLanes = heatmapData.filter(cell => cell.country === topCountry.label);
    const inactiveLanes = countryLanes.filter(cell => 
      cell.lane_state === 'detected' || cell.lane_state === 'pending'
    );
    
    if (inactiveLanes.length > 2) {
      actions.push({
        id: 'geo-expansion',
        icon: <Globe className="h-4 w-4 text-blue-500" />,
        title: `Expand presence in ${topCountry.label}`,
        description: `${inactiveLanes.length} categories show demand signals. Consider activating lanes to establish market presence.`,
        priority: 'medium'
      });
    }
  }

  // 4. Create geo-specific RFQs
  if (topCountry && rfqsLast7Days < 5 && activeLanes > 0) {
    actions.push({
      id: 'create-rfq',
      icon: <FileText className="h-4 w-4 text-green-500" />,
      title: `Create RFQs for ${topCountry.label} market`,
      description: `Low RFQ volume this week. Consider creating illustrative RFQs to attract suppliers and demonstrate demand.`,
      priority: 'medium'
    });
  }

  // 5. Category-specific campaign
  if (topCategory && topCategory.value > 30) {
    actions.push({
      id: 'category-campaign',
      icon: <Megaphone className="h-4 w-4 text-purple-500" />,
      title: `Run supplier acquisition campaign for ${formatCategoryName(topCategory.label)}`,
      description: `High intent detected. Targeted outreach to suppliers in this category could accelerate lane activation.`,
      priority: 'medium'
    });
  }

  // 6. No active lanes
  if (activeLanes === 0) {
    actions.push({
      id: 'first-lane',
      icon: <Package className="h-4 w-4 text-primary" />,
      title: 'Activate your first supplier lane',
      description: `No lanes currently active. Activate a lane to enable supplier matching and fulfillment tracking.`,
      priority: 'high'
    });
  }

  // 7. Low data state
  if (heatmapData.length < 3) {
    actions.push({
      id: 'generate-demand',
      icon: <Sparkles className="h-4 w-4 text-cyan-500" />,
      title: 'Generate demand signals',
      description: `Share signal pages with potential buyers. Traffic to these pages creates intent signals for the heatmap.`,
      priority: 'low'
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 5);
}

function getPriorityBadge(priority: 'high' | 'medium' | 'low') {
  switch (priority) {
    case 'high':
      return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Urgent</Badge>;
    case 'medium':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Recommended</Badge>;
    case 'low':
      return <Badge variant="outline" className="text-xs">Optional</Badge>;
  }
}

export function AIRecommendedActionsCard({
  topCountry,
  topCategory,
  heatmapData,
  activeLanes,
  demandCapacityGap,
  rfqsLast7Days,
  onActivateLane,
}: AIRecommendedActionsCardProps) {
  const recommendations = generateRecommendations(
    topCountry,
    topCategory,
    heatmapData,
    activeLanes,
    demandCapacityGap,
    rfqsLast7Days
  );

  // Empty state
  if (recommendations.length === 0) {
    return (
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            AI Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All systems optimal</p>
            <p className="text-xs mt-1">AI will surface recommendations when actions are needed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            AI Recommended Actions
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {recommendations.length} actions
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Prioritized suggestions based on current demand signals
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-3">
            {recommendations.map((action) => (
              <div 
                key={action.id}
                className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                  action.priority === 'high' 
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200/50' 
                    : 'bg-card'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-sm">{action.title}</p>
                      {getPriorityBadge(action.priority)}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                    {action.actionLabel && action.actionData && onActivateLane && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2 h-7 text-xs gap-1"
                        onClick={() => onActivateLane(action.actionData!.country, action.actionData!.category)}
                      >
                        {action.actionLabel}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AIRecommendedActionsCard;
