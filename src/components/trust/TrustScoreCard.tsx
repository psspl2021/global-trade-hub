/**
 * Trust Score Card Component
 * 
 * Displays comprehensive trust metrics for suppliers.
 * Part of ProcureSaathi's Trust Infrastructure system.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AIVerifiedBadge } from './AIVerifiedBadge';
import { 
  Shield, 
  FileCheck, 
  Clock, 
  MapPin, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskMetric {
  label: string;
  score: number;
  status: 'low' | 'medium' | 'high';
  icon: React.ReactNode;
}

interface TrustScoreCardProps {
  supplierName?: string;
  overallScore: number;
  operationalRisk?: number;
  financialRisk?: number;
  documentScore?: number;
  geopoliticalRisk?: number;
  isExportReady?: boolean;
  lastVerified?: string;
  className?: string;
}

export function TrustScoreCard({
  supplierName = 'Supplier',
  overallScore = 85,
  operationalRisk = 88,
  financialRisk = 82,
  documentScore = 95,
  geopoliticalRisk = 75,
  isExportReady = false,
  lastVerified,
  className,
}: TrustScoreCardProps) {
  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatus = (score: number): 'low' | 'medium' | 'high' => {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  };

  const metrics: RiskMetric[] = [
    {
      label: 'Operational Risk',
      score: operationalRisk,
      status: getStatus(operationalRisk),
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: 'Financial Health',
      score: financialRisk,
      status: getStatus(financialRisk),
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      label: 'Document Verification',
      score: documentScore,
      status: getStatus(documentScore),
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      label: 'Geopolitical Stability',
      score: geopoliticalRisk,
      status: getStatus(geopoliticalRisk),
      icon: <MapPin className="w-4 h-4" />,
    },
  ];

  return (
    <Card className={cn('overflow-hidden', className)} variant="elevated">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{supplierName}</CardTitle>
              {lastVerified && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Last verified: {lastVerified}
                </p>
              )}
            </div>
          </div>
          <AIVerifiedBadge trustScore={overallScore} size="sm" showLabel={false} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Overall Trust Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-medium">Trust Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-2xl font-bold', getStatusColor(overallScore))}>
              {overallScore}%
            </span>
            {isExportReady && (
              <Badge className="bg-emerald-600 text-white text-xs">
                Export Ready
              </Badge>
            )}
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {metric.icon}
                  <span>{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium', getStatusColor(metric.score))}>
                    {metric.score}%
                  </span>
                  {metric.status === 'low' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  {metric.status === 'high' && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  )}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className={cn('h-full rounded-full transition-all duration-500', getProgressColor(metric.score))}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Risk Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>
              AI-powered verification based on GST records, delivery history, and document analysis
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TrustScoreCard;
