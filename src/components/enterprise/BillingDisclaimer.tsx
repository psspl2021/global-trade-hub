/**
 * ============================================================
 * BILLING DISCLAIMER (LOCKED TEXT)
 * ============================================================
 * 
 * MANDATORY: Must appear on all billing-related dashboards.
 * This text is LOCKED and non-editable.
 */

import { Shield, Building2, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingDisclaimerProps {
  variant?: 'default' | 'compact' | 'enterprise';
  className?: string;
}

export function BillingDisclaimer({ 
  variant = 'default',
  className 
}: BillingDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <p className={cn(
        "text-xs text-muted-foreground text-center py-2",
        className
      )}>
        ProcureSaathi charges a quarterly governance fee after onboarding, based on transacted volume.
      </p>
    );
  }

  if (variant === 'enterprise') {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Billing Section Copy (LOCKED TEXT) */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">
              Quarterly Governance Fee
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ProcureSaathi charges a quarterly governance fee after onboarding, based on transacted volume. 
              The first quarter is free to establish verified savings benchmarks.
            </p>
          </div>
        </div>

        {/* Rewards Section Copy (LOCKED TEXT) */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
          <Gift className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Purchaser Incentives</p>
            <p className="text-xs text-muted-foreground mt-1">
              Purchaser incentives are funded by your organisation. 
              ProcureSaathi only measures, verifies, and reports savings.
            </p>
          </div>
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
        ProcureSaathi charges a quarterly governance fee after onboarding, based on transacted volume.
        The first quarter is free to establish verified savings benchmarks.
      </p>
    </div>
  );
}

export default BillingDisclaimer;
