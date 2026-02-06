/**
 * ============================================================
 * PURCHASER GAMIFICATION & INCENTIVE DASHBOARD
 * ============================================================
 * 
 * INTERNAL PROCUREMENT GOVERNANCE OS
 * NOT a marketplace feature.
 * 
 * ACCESS CONTROL (HARD GATE):
 * - ONLY visible to: Purchasers, Buyers, Management (CFO/CEO), HR, Compliance
 * - NEVER visible to: Suppliers, External guests, Marketplace users
 * - Purchasers have READ-ONLY access
 * 
 * FINANCIAL STRUCTURE:
 * - Rewards funded by BUYER ORGANISATION's internal budget
 * - ProcureSaathi only MEASURES, VERIFIES, and REPORTS savings
 * - NEVER deduct from ProcureSaathi fees or link to supplier payments
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Trophy, 
  Award, 
  FileText, 
  Shield,
  Sparkles,
  Lock
} from 'lucide-react';
import { SavingsTracker } from './SavingsTracker';
import { PerformanceScore } from './PerformanceScore';
import { PurchaserLeaderboard } from './PurchaserLeaderboard';
import { CareerAssets } from './CareerAssets';
import { LegalDisclaimer } from './LegalDisclaimer';
import { GovernanceBanner } from './GovernanceBanner';
import { AccessDenied } from './AccessDenied';
import { useRewardsGovernance } from '@/hooks/useRewardsGovernance';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';

export function PurchaserDashboard() {
  const [activeTab, setActiveTab] = useState('savings');
  const { 
    rewardsEnabled, 
    pausedReason, 
    isLoading: rewardsLoading, 
    hasAccess,
    logAccess 
  } = useRewardsGovernance();
  
  // Governance access control
  const { 
    canViewPurchaserDashboard, 
    isReadOnly, 
    primaryRole,
    isLoading: accessLoading,
    isAccessDenied 
  } = useGovernanceAccess();

  // Log access when dashboard is viewed
  useEffect(() => {
    logAccess('view_dashboard', 'purchaser_dashboard');
  }, [logAccess]);

  const isLoading = rewardsLoading || accessLoading;

  // Access control: Show denied screen for unauthorized users (suppliers, external guests)
  if (!isLoading && (isAccessDenied || !canViewPurchaserDashboard)) {
    return <AccessDenied />;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading dashboard...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Governance Banner - Shows when rewards paused */}
      {!rewardsEnabled && (
        <GovernanceBanner pausedReason={pausedReason} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Performance Center</h1>
            <p className="text-sm text-muted-foreground">
              AI-verified savings → Management-approved rewards
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              <Lock className="w-3 h-3 mr-1" />
              Read-Only
            </Badge>
          )}
          <Badge className="bg-emerald-600 text-white">
            <Shield className="w-3 h-3 mr-1" />
            Internal Governance
          </Badge>
        </div>
      </div>

      {/* Enterprise Pitch + Legal Disclaimer */}
      <LegalDisclaimer variant="enterprise" />

      {/* System Message */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="py-4">
          <p className="text-sm text-emerald-800 font-medium">
            "ProcureSaathi converts procurement efficiency into legal rewards — not hidden commissions."
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            Your organisation funds rewards. ProcureSaathi provides auditable proof.
          </p>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="savings" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Savings</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="career" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Career</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="savings" className="space-y-6">
          <SavingsTracker rewardsEnabled={rewardsEnabled} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceScore />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <PurchaserLeaderboard rewardsEnabled={rewardsEnabled} />
        </TabsContent>

        <TabsContent value="career" className="space-y-6">
          <CareerAssets />
        </TabsContent>
      </Tabs>

      {/* Footer Legal Disclaimer */}
      <LegalDisclaimer variant="compact" />
    </div>
  );
}

export default PurchaserDashboard;
