/**
 * ============================================================
 * GOVERNANCE LEGAL ARMOR (HARD-CODED EVERYWHERE)
 * ============================================================
 * 
 * MANDATORY legal disclaimers for all internal dashboards.
 * These texts are LOCKED and NON-EDITABLE.
 */

import { Shield, Building2, Gift, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GovernanceLegalArmorProps {
  variant?: 'footer' | 'billing' | 'incentive' | 'positioning';
  className?: string;
}

export function GovernanceLegalArmor({ 
  variant = 'footer',
  className 
}: GovernanceLegalArmorProps) {
  // FOOTER: "All rewards are platform-measured, management-approved..."
  if (variant === 'footer') {
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

  // BILLING: "ProcureSaathi operates as a neutral governance layer..."
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

  // INCENTIVE: "Incentives are declared and funded by the buyer organisation..."
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

  // POSITIONING: "We convert procurement ethics into measurable performance."
  if (variant === 'positioning') {
    return (
      <div className={cn(
        "text-center py-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20",
        className
      )}>
        <p className="text-sm font-medium text-primary">
          "We convert procurement ethics into measurable performance."
        </p>
      </div>
    );
  }

  return null;
}

export default GovernanceLegalArmor;
