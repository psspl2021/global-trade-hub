/**
 * ============================================================
 * ADMIN AUDIT PAGE
 * ============================================================
 * 
 * PS_Admin READ-ONLY audit view.
 * Includes Kill Switch and Incentive Audit.
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Power, Gift, Lock } from 'lucide-react';
import { AdminKillSwitch } from '@/components/governance';
import { AdminIncentiveAudit } from '@/components/purchaser';
import { AdminBillingManagement } from '@/components/admin/AdminBillingManagement';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { AccessDenied } from '@/components/purchaser';
import { GovernanceLegalArmor } from '@/components/governance/GovernanceLegalArmor';

export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState('killswitch');
  const { canToggleRewards, isLoading, isAccessDenied } = useGovernanceAccess();

  // Access control
  if (!isLoading && (isAccessDenied || !canToggleRewards)) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
          <AccessDenied />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading admin panel...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-600 shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Audit Panel</h1>
              <p className="text-sm text-muted-foreground">
                ProcureSaathi governance & compliance controls
              </p>
            </div>
          </div>
          <Badge className="bg-slate-600 text-white">
            <Lock className="w-3 h-3 mr-1" />
            PS_ADMIN Only
          </Badge>
        </div>

        {/* Positioning */}
        <GovernanceLegalArmor variant="positioning" />

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="killswitch" className="gap-2">
              <Power className="w-4 h-4" />
              <span className="hidden sm:inline">Kill Switch</span>
            </TabsTrigger>
            <TabsTrigger value="incentives" className="gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Incentive Audit</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="killswitch" className="space-y-6">
            <AdminKillSwitch />
          </TabsContent>

          <TabsContent value="incentives" className="space-y-6">
            <AdminIncentiveAudit />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <AdminBillingManagement />
          </TabsContent>
        </Tabs>

        {/* Footer Legal Armor */}
        <GovernanceLegalArmor variant="footer" />
      </div>
    </div>
  );
}
