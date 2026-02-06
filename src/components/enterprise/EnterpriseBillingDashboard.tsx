/**
 * ============================================================
 * ENTERPRISE BILLING DASHBOARD (CFO/CEO VIEW)
 * ============================================================
 * 
 * Internal billing dashboard for enterprise management.
 * 
 * STRICT CONSTRAINTS:
 * - DO NOT show fees to suppliers
 * - DO NOT link fees to rewards
 * - DO NOT deduct fees from savings
 * - DO NOT describe fees as commission or brokerage
 * - DO NOT enable billing in Q1
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  TrendingUp, 
  Shield,
  Lock,
  IndianRupee,
  Activity
} from 'lucide-react';
import { useEnterpriseBilling } from '@/hooks/useEnterpriseBilling';
import { OnboardingBanner } from './OnboardingBanner';
import { BillingFeeStructure } from './BillingFeeStructure';
import { BillingHistory } from './BillingHistory';
import { BillingDisclaimer } from './BillingDisclaimer';

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export function EnterpriseBillingDashboard() {
  const { 
    config, 
    billingHistory, 
    isLoading, 
    isOnboarding, 
    daysRemaining 
  } = useEnterpriseBilling();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading billing dashboard...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Billing</h1>
            <p className="text-sm text-muted-foreground">
              Quarterly governance fee dashboard
            </p>
          </div>
        </div>
        <Badge className="bg-blue-600 text-white">
          <Lock className="w-3 h-3 mr-1" />
          CFO/CEO Access
        </Badge>
      </div>

      {/* Onboarding Banner (Q1 Free) */}
      {isOnboarding && (
        <OnboardingBanner 
          daysRemaining={daysRemaining}
          onboardingEndDate={config?.onboarding_end_date}
        />
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600/80 font-medium">
                  Total Transacted Value
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(config?.total_transacted_value || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-200/50">
                <IndianRupee className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600/70 mt-2">
              AI-tracked during onboarding
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600/80 font-medium">
                  Verified Savings
                </p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(config?.total_verified_savings || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-200/50">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600/70 mt-2">
              AI-verified procurement savings
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600/80 font-medium">
                  Billing Status
                </p>
                <p className="text-2xl font-bold text-purple-700">
                  {isOnboarding ? 'Onboarding' : 'Active'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-200/50">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-purple-600/70 mt-2">
              {isOnboarding 
                ? `${daysRemaining} days until billing starts`
                : 'Quarterly billing active'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Structure */}
      <BillingFeeStructure 
        domesticPercent={config?.domestic_fee_percent || 0.5}
        importExportPercent={config?.import_export_fee_percent || 2.0}
        isOnboarding={isOnboarding}
      />

      {/* Billing History */}
      <BillingHistory 
        history={billingHistory}
        isLoading={isLoading}
      />

      {/* Disclaimers */}
      <BillingDisclaimer variant="enterprise" />

      {/* Footer */}
      <BillingDisclaimer variant="compact" />
    </div>
  );
}

export default EnterpriseBillingDashboard;
