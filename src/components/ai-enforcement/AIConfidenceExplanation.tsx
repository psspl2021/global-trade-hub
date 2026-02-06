/**
 * ============================================================
 * AI CONFIDENCE EXPLANATION (MANDATORY)
 * ============================================================
 * 
 * RULE 4: AI CONFIDENCE EXPLANATION (MANDATORY)
 * Every AI L1 decision must show:
 *   "AI Confidence: XX%"
 *   Based on:
 *     • Price competitiveness
 *     • Delivery reliability
 *     • Risk score
 *     • Past performance
 * 
 * This explanation is READ-ONLY and cannot be hidden.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Percent, 
  Truck, 
  Shield, 
  TrendingUp,
  Info,
  Lock,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIConfidenceExplanationProps {
  confidence: number;
  priceScore: number;
  deliveryScore: number;
  riskScore: number;
  performanceScore: number;
  reasoning?: string;
  className?: string;
  variant?: 'full' | 'compact';
}

export function AIConfidenceExplanation({
  confidence,
  priceScore,
  deliveryScore,
  riskScore,
  performanceScore,
  reasoning,
  className,
  variant = 'full'
}: AIConfidenceExplanationProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (variant === 'compact') {
    return (
      <div className={cn("p-3 rounded-lg bg-primary/5 border border-primary/20", className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium flex items-center gap-1">
            <Brain className="w-4 h-4 text-primary" />
            AI Confidence
          </span>
          <span className="text-lg font-bold text-primary">{confidence.toFixed(0)}%</span>
        </div>
        <Progress value={confidence} className="h-1.5" />
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>Read-only • Cannot be hidden</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Confidence Explanation
          </span>
          <span className="text-2xl font-bold text-primary">{confidence.toFixed(0)}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Progress */}
        <div className="space-y-2">
          <Progress value={confidence} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Low Confidence</span>
            <span>High Confidence</span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Price Competitiveness</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", getProgressColor(priceScore))}
                  style={{ width: `${priceScore * 10}%` }}
                />
              </div>
              <span className={cn("text-sm font-semibold", getScoreColor(priceScore))}>
                {priceScore.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-600" />
              <span className="text-sm">Delivery Reliability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", getProgressColor(deliveryScore))}
                  style={{ width: `${deliveryScore * 10}%` }}
                />
              </div>
              <span className={cn("text-sm font-semibold", getScoreColor(deliveryScore))}>
                {deliveryScore.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-sm">Risk Score (Inverse)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", getProgressColor(10 - riskScore))}
                  style={{ width: `${(10 - riskScore) * 10}%` }}
                />
              </div>
              <span className={cn("text-sm font-semibold", getScoreColor(10 - riskScore))}>
                {(10 - riskScore).toFixed(1)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Past Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", getProgressColor(performanceScore))}
                  style={{ width: `${performanceScore * 10}%` }}
                />
              </div>
              <span className={cn("text-sm font-semibold", getScoreColor(performanceScore))}>
                {performanceScore.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        {reasoning && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">AI Reasoning</p>
                <p className="text-xs text-blue-700 mt-1">{reasoning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Read-only Notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Lock className="w-3 h-3" />
          <span>This explanation is mandatory and cannot be hidden or modified</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIConfidenceExplanation;
