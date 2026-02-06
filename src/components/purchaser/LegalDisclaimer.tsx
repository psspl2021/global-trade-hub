/**
 * ============================================================
 * LEGAL DISCLAIMER (UI LEGAL ARMOR)
 * ============================================================
 * 
 * MANDATORY: Must appear on all reward-related dashboards.
 * This text is LOCKED and non-editable.
 */

import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalDisclaimerProps {
  variant?: 'default' | 'compact' | 'enterprise';
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
