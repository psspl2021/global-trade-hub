/**
 * ============================================================
 * BILLING FEE STRUCTURE (CFO/CEO VIEW)
 * ============================================================
 * 
 * Displays quarterly governance fee structure.
 * 
 * STRICT CONSTRAINTS:
 * - DO NOT show fees to suppliers
 * - DO NOT link fees to rewards
 * - DO NOT deduct fees from savings
 * - DO NOT describe fees as commission or brokerage
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Globe2, 
  TrendingUp,
  Shield,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingFeeStructureProps {
  domesticPercent?: number;
  importExportPercent?: number;
  isOnboarding?: boolean;
  className?: string;
}

export function BillingFeeStructure({
  domesticPercent = 0.5,
  importExportPercent = 2.0,
  isOnboarding = true,
  className,
}: BillingFeeStructureProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Quarterly Governance Fee
            </CardTitle>
            <CardDescription>
              Platform charges based on transacted volume
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/30">
            <Lock className="w-3 h-3 mr-1" />
            CFO/CEO Only
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Domestic Trade */}
          <div className={cn(
            "p-5 rounded-xl border-2 transition-all",
            isOnboarding 
              ? "bg-muted/30 border-muted" 
              : "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className={cn(
                "w-5 h-5",
                isOnboarding ? "text-muted-foreground" : "text-blue-600"
              )} />
              <span className="font-semibold">Domestic Trade</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-4xl font-bold",
                isOnboarding ? "text-muted-foreground line-through" : "text-blue-700"
              )}>
                {domesticPercent}%
              </span>
              <span className="text-sm text-muted-foreground">per quarter</span>
            </div>
            {isOnboarding && (
              <Badge className="mt-2 bg-emerald-600 text-white">
                Free during onboarding
              </Badge>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Applied to total domestic transacted volume
            </p>
          </div>

          {/* Import/Export Trade */}
          <div className={cn(
            "p-5 rounded-xl border-2 transition-all",
            isOnboarding 
              ? "bg-muted/30 border-muted" 
              : "bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Globe2 className={cn(
                "w-5 h-5",
                isOnboarding ? "text-muted-foreground" : "text-indigo-600"
              )} />
              <span className="font-semibold">Import / Export Trade</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-4xl font-bold",
                isOnboarding ? "text-muted-foreground line-through" : "text-indigo-700"
              )}>
                {importExportPercent}%
              </span>
              <span className="text-sm text-muted-foreground">per quarter</span>
            </div>
            {isOnboarding && (
              <Badge className="mt-2 bg-emerald-600 text-white">
                Free during onboarding
              </Badge>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Applied to total import/export transacted volume
            </p>
          </div>
        </div>

        {/* Governance Guarantees */}
        <div className="bg-muted/30 rounded-lg p-4 border border-dashed">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Governance Guarantees</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                Fee is NOT deducted from savings
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                Fee is NOT linked to purchaser rewards
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                Fee is NOT visible to suppliers
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                Audit-safe, CFO-approved pricing
              </span>
            </div>
          </div>
        </div>

        {/* Enterprise Pitch */}
        <div className="text-center py-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary">
            "We convert procurement ethics into measurable performance."
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default BillingFeeStructure;
