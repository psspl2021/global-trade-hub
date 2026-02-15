/**
 * Supplier Risk Badges — Phase 4
 * KYC, Finance, Transaction Score badges.
 */
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Building, Star } from 'lucide-react';

interface Props {
  kycVerified?: boolean;
  financeApproved?: boolean;
  transactionScore?: number;
  compact?: boolean;
}

export function SupplierRiskBadges({ kycVerified, financeApproved, transactionScore = 0, compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {kycVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
        {financeApproved && <Building className="h-3.5 w-3.5 text-blue-500" />}
        {transactionScore > 0 && <Star className="h-3.5 w-3.5 text-amber-500" />}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {kycVerified ? (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 gap-1">
          <ShieldCheck className="h-3 w-3" /> KYC Verified
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground gap-1">
          <ShieldCheck className="h-3 w-3" /> KYC Pending
        </Badge>
      )}
      
      {financeApproved ? (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 gap-1">
          <Building className="h-3 w-3" /> Finance Approved
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground gap-1">
          <Building className="h-3 w-3" /> Finance Pending
        </Badge>
      )}
      
      <Badge variant="secondary" className={`gap-1 ${transactionScore >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
        <Star className="h-3 w-3" /> Score: {transactionScore > 0 ? transactionScore : '—'}
      </Badge>
    </div>
  );
}
