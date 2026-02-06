/**
 * ============================================================
 * LEGAL DISCLAIMER (UI LEGAL ARMOR)
 * ============================================================
 * 
 * MANDATORY: Must appear on all reward-related dashboards.
 * This text is LOCKED and non-editable.
 * 
 * LEGAL ARMOR TEXTS (HARD-CODED EVERYWHERE):
 * - Footer: "All rewards are platform-measured, management-approved, 
 *   and fully independent of supplier payments."
 * - Billing: "ProcureSaathi operates as a neutral governance layer. 
 *   Fees are for platform infrastructure and risk management services."
 * - Incentive: "Incentives are declared and funded by the buyer organisation.
 *   ProcureSaathi provides independent measurement only."
 */

import { Shield, Building2, DollarSign, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalDisclaimerProps {
  variant?: 'default' | 'compact' | 'enterprise' | 'billing' | 'incentive';
  className?: string;
}

export function LegalDisclaimer({ 
  variant = 'default',
  className 
}: LegalDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <p className={cn(
        "text-xs text-muted-foreground text-center py-2",
        className
      )}>
        All rewards are platform-measured, management-approved, and fully 
        independent of supplier payments.
      </p>
    );
  }

  if (variant === 'enterprise') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-lg",
        "bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20",
        className
      )}>
        <Shield className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-primary">
            "We convert procurement ethics into measurable performance."
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All rewards are platform-measured, management-approved, and fully 
            independent of supplier payments.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'billing') {
    return (
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-dashed",
        className
      )}>
        <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">Platform Governance Fee Notice</p>
          <p className="text-xs text-muted-foreground mt-1">
            ProcureSaathi operates as a neutral governance layer. Fees are for 
            platform infrastructure and risk management services.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'incentive') {
    return (
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200",
        className
      )}>
        <Gift className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Incentive Governance</p>
          <p className="text-xs text-amber-700 mt-1">
            Incentives are declared and funded by the buyer organisation. 
            ProcureSaathi provides independent measurement only.
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
        All rewards are platform-measured, management-approved, and fully 
        independent of supplier payments.
      </p>
    </div>
  );
}

export default LegalDisclaimer;
