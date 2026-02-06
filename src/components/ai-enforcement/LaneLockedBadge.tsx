/**
 * ============================================================
 * LANE LOCKED BADGE
 * ============================================================
 * 
 * RULE 2: SUPPLIER LANE LOCKING
 * If RFQ intent_score >= 7:
 *   • Only TOP 3 AI-ranked suppliers receive the RFQ
 *   • All other suppliers see status: "Lane Locked by AI"
 * 
 * Locked suppliers cannot submit bids or view RFQ details.
 */

import { Lock, AlertTriangle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LaneLockedBadgeProps {
  variant?: 'badge' | 'card' | 'inline';
  intentScore?: number;
  className?: string;
}

export function LaneLockedBadge({ 
  variant = 'badge',
  intentScore,
  className 
}: LaneLockedBadgeProps) {
  if (variant === 'card') {
    return (
      <Card className={cn("border-amber-300 bg-amber-50", className)}>
        <CardContent className="py-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-amber-100">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="font-semibold text-amber-800 mb-2">
            Lane Locked by AI
          </h3>
          <p className="text-sm text-amber-700">
            This high-intent RFQ {intentScore && `(score: ${intentScore}/10)`} has been locked to the top 3 AI-ranked suppliers.
          </p>
          <p className="text-xs text-amber-600 mt-3">
            You are not eligible to bid on this requirement.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200",
        className
      )}>
        <Lock className="w-4 h-4 text-amber-600" />
        <p className="text-sm text-amber-700">
          Lane Locked by AI — Only top 3 ranked suppliers can access this RFQ
        </p>
      </div>
    );
  }

  return (
    <Badge 
      className={cn(
        "bg-amber-500 text-white hover:bg-amber-600",
        className
      )}
    >
      <Lock className="w-3 h-3 mr-1" />
      Lane Locked
    </Badge>
  );
}

/**
 * Component to check and display lane lock status for suppliers
 */
interface LaneStatusForSupplierProps {
  isLocked: boolean;
  isTopThree: boolean;
  aiRank?: number;
  className?: string;
}

export function LaneStatusForSupplier({
  isLocked,
  isTopThree,
  aiRank,
  className
}: LaneStatusForSupplierProps) {
  if (!isLocked) {
    return null; // No lock in effect
  }

  if (isTopThree) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200",
        className
      )}>
        <Shield className="w-4 h-4 text-emerald-600" />
        <p className="text-sm text-emerald-700">
          You have exclusive access to this RFQ 
          {aiRank && <span className="font-semibold"> (AI Rank #{aiRank})</span>}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200",
      className
    )}>
      <AlertTriangle className="w-4 h-4 text-red-600" />
      <p className="text-sm text-red-700">
        This lane is locked. You cannot view or bid on this RFQ.
      </p>
    </div>
  );
}

export default LaneLockedBadge;
