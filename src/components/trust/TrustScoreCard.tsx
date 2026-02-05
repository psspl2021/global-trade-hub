/**
 * TrustScoreCard (BUYER VIEW)
 * ==========================
 * 
 * CRITICAL ANONYMITY RULE:
 * supplierName MUST always be the anonymous display name.
 * Real supplier names are NEVER passed to this component in buyer views.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

interface Props {
  supplierName: string;
  overallScore: number;
  operationalRisk: number;
}

export function TrustScoreCard({
  supplierName,
  overallScore,
  operationalRisk,
}: Props) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-primary" />
          {supplierName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Overall Trust</p>
            <p className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Operational Reliability</p>
            <p className={`text-2xl font-bold ${getScoreColor(operationalRisk)}`}>
              {operationalRisk}%
            </p>
          </div>
        </div>
        
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            All transactions are managed by ProcureSaathi. Supplier identities are protected 
            to ensure fair pricing and prevent deal leakage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default TrustScoreCard;
