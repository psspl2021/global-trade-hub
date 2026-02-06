/**
 * ============================================================
 * MANAGEMENT DASHBOARD (CFO/CEO/MANAGER VIEW)
 * ============================================================
 * 
 * BUYER SIDE management dashboard for:
 * - AI-Verified Savings (source of truth)
 * - Incentive Management
 * - Enterprise Billing
 * 
 * ACCESS: CFO, CEO, Manager roles ONLY
 * 
 * STRICT CONSTRAINTS:
 * - Suppliers NEVER see this
 * - External guests NEVER see this
 * - Data is READ-ONLY for managers (CFO/CEO can edit)
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  TrendingUp, 
  Gift, 
  DollarSign,
  Shield,
  Lock
} from 'lucide-react';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { AccessDenied } from '@/components/purchaser/AccessDenied';
import { SavingsSourceOfTruth } from './SavingsSourceOfTruth';
import { CFOIncentiveManagement } from '@/components/purchaser/CFOIncentiveManagement';
import { EnterpriseBillingDashboard } from '@/components/enterprise/EnterpriseBillingDashboard';
import { GovernanceLegalArmor } from './GovernanceLegalArmor';
import { cn } from '@/lib/utils';

export function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState('savings');
  const { 
    canViewManagementDashboard, 
    canEditIncentives,
    primaryRole,
    isLoading,
    isAccessDenied 
  } = useGovernanceAccess();

  // Access control: Show denied screen for unauthorized users
  if (!isLoading && (isAccessDenied || !canViewManagementDashboard)) {
    return <AccessDenied />;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading management dashboard...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Positioning */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Management Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Enterprise governance & performance insights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "text-white",
            primaryRole === 'ceo' ? "bg-purple-600" :
            primaryRole === 'cfo' ? "bg-blue-600" :
            "bg-slate-600"
          )}>
            <Lock className="w-3 h-3 mr-1" />
            {primaryRole.toUpperCase()} Access
          </Badge>
        </div>
      </div>

      {/* Positioning Statement */}
      <GovernanceLegalArmor variant="positioning" />

      {/* Role-based Notice */}
      {!canEditIncentives && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <strong>Manager View:</strong> You have read-only access. CFO/CEO approval required for incentive changes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="savings" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">AI-Verified Savings</span>
            <span className="sm:hidden">Savings</span>
          </TabsTrigger>
          <TabsTrigger value="incentives" className="gap-2">
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Incentive Management</span>
            <span className="sm:hidden">Incentives</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Enterprise Billing</span>
            <span className="sm:hidden">Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="savings" className="space-y-6">
          <SavingsSourceOfTruth />
        </TabsContent>

        <TabsContent value="incentives" className="space-y-6">
          <CFOIncentiveManagement />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <EnterpriseBillingDashboard />
        </TabsContent>
      </Tabs>

      {/* Footer Legal Armor */}
      <GovernanceLegalArmor variant="footer" />
    </div>
  );
}

export default ManagementDashboard;
