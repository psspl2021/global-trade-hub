/**
 * ============================================================
 * PURCHASER INCENTIVE CARD (READ-ONLY)
 * ============================================================
 * 
 * Displays incentive declared by buyer organisation.
 * READ-ONLY for purchasers.
 * 
 * Shows:
 * - Incentive % applied
 * - Incentive amount
 * - Quarter
 * - Status badge
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Calendar, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Building2,
  Percent
} from 'lucide-react';
import { IncentiveSummary } from '@/hooks/usePurchaserIncentives';
import { IncentiveDisclaimer } from './IncentiveDisclaimer';
import { cn } from '@/lib/utils';

interface PurchaserIncentiveCardProps {
  summary: IncentiveSummary | null;
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return (
        <Badge className="bg-emerald-600 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    case 'approved':
      return (
        <Badge className="bg-blue-600 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case 'declared':
      return (
        <Badge variant="secondary" className="text-amber-700 bg-amber-100">
          <Clock className="w-3 h-3 mr-1" />
          Declared
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export function PurchaserIncentiveCard({ summary, isLoading }: PurchaserIncentiveCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading incentive data...
        </CardContent>
      </Card>
    );
  }

  const currentQuarter = summary?.current_quarter;

  return (
    <div className="space-y-4">
      {/* Main Incentive Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Gift className="w-5 h-5 text-amber-600" />
              Incentive Declared by Your Organisation
            </CardTitle>
            {currentQuarter && getStatusBadge(currentQuarter.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuarter ? (
            <>
              {/* Incentive Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-amber-600 font-medium">Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    {currentQuarter.percentage}%
                  </p>
                </div>
                
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-amber-600 font-medium">Amount</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatCurrency(currentQuarter.amount, currentQuarter.currency)}
                  </p>
                </div>
                
                <div className="bg-white/60 rounded-lg p-3 text-center col-span-2">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-amber-600 font-medium">Period</span>
                  </div>
                  <p className="text-lg font-semibold text-amber-900">
                    {new Date(currentQuarter.period_start).toLocaleDateString('en-IN', { 
                      month: 'short', year: 'numeric' 
                    })} - {new Date(currentQuarter.period_end).toLocaleDateString('en-IN', { 
                      month: 'short', year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Totals */}
              {summary && (
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-amber-200">
                  <div className="text-center">
                    <p className="text-xs text-amber-600">Total Declared</p>
                    <p className="font-semibold text-amber-800">
                      {formatCurrency(summary.total_declared)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-amber-600">Total Approved</p>
                    <p className="font-semibold text-amber-800">
                      {formatCurrency(summary.total_approved)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-amber-600">Total Paid</p>
                    <p className="font-semibold text-emerald-700">
                      {formatCurrency(summary.total_paid)}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <p className="text-amber-700 font-medium">No Incentive Declared Yet</p>
              <p className="text-sm text-amber-600 mt-1">
                Your organisation has not declared an incentive for the current quarter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal Disclaimer */}
      <IncentiveDisclaimer variant="banner" />
    </div>
  );
}

export default PurchaserIncentiveCard;
