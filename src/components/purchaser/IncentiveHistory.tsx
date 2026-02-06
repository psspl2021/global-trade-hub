/**
 * ============================================================
 * INCENTIVE HISTORY (READ-ONLY)
 * ============================================================
 * 
 * Shows historical incentive declarations for purchaser.
 * READ-ONLY view.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Gift,
  Calendar
} from 'lucide-react';
import { IncentiveDeclaration } from '@/hooks/usePurchaserIncentives';
import { cn } from '@/lib/utils';

interface IncentiveHistoryProps {
  declarations: IncentiveDeclaration[];
  isLoading?: boolean;
}

const formatCurrency = (amount: number, currency: string = 'INR') => {
  if (currency === 'INR') {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount.toLocaleString()}`;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'paid':
      return {
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        label: 'Paid',
      };
    case 'approved':
      return {
        icon: CheckCircle2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Approved',
      };
    case 'declared':
      return {
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        label: 'Declared',
      };
    case 'cancelled':
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Cancelled',
      };
    default:
      return {
        icon: Clock,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        borderColor: 'border-muted',
        label: 'Unknown',
      };
  }
};

export function IncentiveHistory({ declarations, isLoading }: IncentiveHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading incentive history...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Incentive History
        </CardTitle>
        <CardDescription>
          Past incentive declarations from your organisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {declarations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No incentive history</p>
            <p className="text-sm mt-1">
              Incentive records will appear here once declared
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {declarations.map((declaration) => {
                const statusConfig = getStatusConfig(declaration.incentive_status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={declaration.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      statusConfig.bgColor,
                      statusConfig.borderColor
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-full bg-white/80")}>
                          <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {formatCurrency(declaration.incentive_amount, declaration.currency)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {declaration.incentive_percentage}%
                            </Badge>
                            <Badge className={cn(
                              "text-xs",
                              declaration.incentive_status === 'paid' && "bg-emerald-600",
                              declaration.incentive_status === 'approved' && "bg-blue-600",
                              declaration.incentive_status === 'declared' && "bg-amber-500",
                              declaration.incentive_status === 'cancelled' && "bg-red-600"
                            )}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(declaration.period_start).toLocaleDateString('en-IN', {
                                month: 'short',
                                year: 'numeric',
                              })} - {new Date(declaration.period_end).toLocaleDateString('en-IN', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {declaration.approval_role && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Approved by: {declaration.approval_role.toUpperCase()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default IncentiveHistory;
