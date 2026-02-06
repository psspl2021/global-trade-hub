/**
 * ============================================================
 * PERFORMANCE SCORE (PURCHASER VIEW)
 * ============================================================
 * 
 * INTERNAL GOVERNANCE METRIC
 * 
 * Efficiency score based on:
 * - Total savings generated (35% weight)
 * - RFQ turnaround time (20% weight)
 * - Price variance reduction (15% weight)
 * - Process compliance (15% weight)
 * - Zero-deviation audit score (15% weight)
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  TrendingUp, 
  Clock, 
  Target,
  Shield,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LegalDisclaimer } from './LegalDisclaimer';

interface ScoreMetric {
  name: string;
  value: number;
  maxValue: number;
  weight: number;
  icon: typeof TrendingUp;
  color: string;
}

const metrics: ScoreMetric[] = [
  {
    name: 'Savings Generated',
    value: 85,
    maxValue: 100,
    weight: 35,
    icon: TrendingUp,
    color: 'text-emerald-600',
  },
  {
    name: 'Turnaround Time',
    value: 92,
    maxValue: 100,
    weight: 20,
    icon: Clock,
    color: 'text-blue-600',
  },
  {
    name: 'Price Variance',
    value: 78,
    maxValue: 100,
    weight: 15,
    icon: Target,
    color: 'text-amber-600',
  },
  {
    name: 'Process Compliance',
    value: 100,
    maxValue: 100,
    weight: 15,
    icon: Shield,
    color: 'text-purple-600',
  },
  {
    name: 'Audit Score',
    value: 95,
    maxValue: 100,
    weight: 15,
    icon: CheckCircle2,
    color: 'text-indigo-600',
  },
];

export function PerformanceScore() {
  // Calculate overall score
  const overallScore = metrics.reduce(
    (sum, m) => sum + (m.value * m.weight) / 100,
    0
  );

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { label: 'Exceptional', color: 'bg-emerald-600' };
    if (score >= 75) return { label: 'Excellent', color: 'bg-blue-600' };
    if (score >= 60) return { label: 'Good', color: 'bg-amber-600' };
    return { label: 'Developing', color: 'bg-muted' };
  };

  const scoreLevel = getScoreLevel(overallScore);

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">
                    {Math.round(overallScore)}
                  </span>
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold">Efficiency Score</h3>
                <Badge className={cn('mt-1', scoreLevel.color)}>
                  {scoreLevel.label}
                </Badge>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">Current Period</p>
              <p className="font-semibold">Q1 2026</p>
              <p className="text-xs text-muted-foreground mt-1">
                Updated daily by AI
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Performance Breakdown
          </CardTitle>
          <CardDescription>
            Weighted metrics contributing to your efficiency score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('w-4 h-4', metric.color)} />
                      <span className="font-medium">{metric.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {metric.weight}% weight
                      </Badge>
                    </div>
                    <span className={cn('font-bold', metric.color)}>
                      {metric.value}%
                    </span>
                  </div>
                  <Progress
                    value={metric.value}
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Period History */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { period: 'Q4 2025', score: 82 },
              { period: 'Q3 2025', score: 78 },
              { period: 'Q2 2025', score: 75 },
              { period: 'Q1 2025', score: 72 },
            ].map((item) => (
              <div
                key={item.period}
                className="p-4 rounded-lg bg-muted/50 text-center"
              >
                <p className="text-sm text-muted-foreground">{item.period}</p>
                <p className="text-2xl font-bold">{item.score}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Continuous improvement shows commitment to ethical procurement
          </p>
        </CardContent>
      </Card>

      {/* Legal Disclaimer */}
      <LegalDisclaimer />
    </div>
  );
}

export default PerformanceScore;
