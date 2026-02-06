/**
 * ============================================================
 * INCENTIVE DISCLAIMER (LOCKED TEXT)
 * ============================================================
 * 
 * MANDATORY: Must appear on all incentive-related dashboards.
 * This text is LOCKED and non-editable.
 */

import { Shield, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncentiveDisclaimerProps {
  variant?: 'default' | 'compact' | 'banner';
  className?: string;
}

export function IncentiveDisclaimer({ 
  variant = 'default',
  className 
}: IncentiveDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <p className={cn(
        "text-xs text-muted-foreground text-center py-2",
        className
      )}>
        Incentives are declared and funded by the buyer organisation. 
        ProcureSaathi acts only as a measurement, visibility, and audit layer.
      </p>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-lg",
        "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200",
        className
      )}>
        <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">
            Organisation-Funded Incentives
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Incentives are declared and funded by your organisation. 
            ProcureSaathi displays this for transparency and audit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg bg-muted/50 border",
      className
    )}>
      <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <p className="text-xs text-muted-foreground">
        Incentives are declared and funded by the buyer organisation. 
        ProcureSaathi acts only as a measurement, visibility, and audit layer.
      </p>
    </div>
  );
}

export default IncentiveDisclaimer;
