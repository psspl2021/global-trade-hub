/**
 * ============================================================
 * ADMIN BILLING MANAGEMENT
 * ============================================================
 * 
 * Admin control panel for enterprise billing configuration.
 * 
 * Features:
 * - View all enterprise billing configs
 * - Manage onboarding periods
 * - Generate quarterly invoices
 * - Track billing status
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Building2, 
  RefreshCw,
  Clock,
  CheckCircle2,
  DollarSign,
  Calendar,
  Lock,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { EnterpriseBillingConfig } from '@/hooks/useEnterpriseBilling';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { AccessDenied } from '@/components/purchaser/AccessDenied';
import { GovernanceLegalArmor } from '@/components/governance/GovernanceLegalArmor';

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export function AdminBillingManagement() {
  const [configs, setConfigs] = useState<EnterpriseBillingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Access control - only management can view billing
  const { canViewManagementDashboard, canEditIncentives, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();

  const fetchConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('enterprise_billing_config' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs((data || []) as unknown as EnterpriseBillingConfig[]);
    } catch (err) {
      console.error('[AdminBillingManagement] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleBillingActive = useCallback(async (configId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('enterprise_billing_config' as any)
        .update({ billing_active: !currentActive })
        .eq('id', configId);

      if (error) throw error;
      toast.success(currentActive ? 'Billing deactivated' : 'Billing activated');
      fetchConfigs();
    } catch (err) {
      console.error('[AdminBillingManagement] Toggle error:', err);
      toast.error('Failed to update billing status');
    }
  }, [fetchConfigs]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const isOnboarding = (config: EnterpriseBillingConfig) => {
    return new Date() <= new Date(config.onboarding_end_date);
  };

  // Access control: Show denied screen for unauthorized users
  if (!accessLoading && (isAccessDenied || !canViewManagementDashboard)) {
    return <AccessDenied />;
  }

  if (loading || accessLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading billing configurations...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-600">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-900">
                  Enterprise Billing Management
                </h2>
                <p className="text-sm text-blue-600">
                  Quarterly governance fee administration
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchConfigs}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{configs.length}</p>
              <p className="text-xs text-muted-foreground">Total Enterprises</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {configs.filter(c => isOnboarding(c)).length}
              </p>
              <p className="text-xs text-muted-foreground">In Onboarding</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {configs.filter(c => c.billing_active && !isOnboarding(c)).length}
              </p>
              <p className="text-xs text-muted-foreground">Active Billing</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {formatCurrency(configs.reduce((sum, c) => sum + c.total_transacted_value, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Total Volume</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Enterprise Billing Configurations
          </CardTitle>
          <CardDescription>
            Manage billing settings for each enterprise
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No enterprise billing configurations</p>
              <p className="text-sm mt-1">
                Configurations are created when enterprises onboard
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enterprise</TableHead>
                    <TableHead>Onboarding Ends</TableHead>
                    <TableHead>Domestic %</TableHead>
                    <TableHead>Import/Export %</TableHead>
                    <TableHead>Transacted Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">
                        {config.enterprise_name || config.enterprise_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {new Date(config.onboarding_end_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{config.domestic_fee_percent}%</TableCell>
                      <TableCell>{config.import_export_fee_percent}%</TableCell>
                      <TableCell>{formatCurrency(config.total_transacted_value)}</TableCell>
                      <TableCell>
                        {isOnboarding(config) ? (
                          <Badge className="bg-emerald-600 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            Onboarding
                          </Badge>
                        ) : config.billing_active ? (
                          <Badge className="bg-blue-600 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleBillingActive(config.id, config.billing_active)}
                          disabled={isOnboarding(config)}
                        >
                          {config.billing_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Billing Rules Reminder */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Billing Governance Rules</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Q1 (first 90 days) is FREE - no charges applied</li>
                <li>• From Q2: 0.5% domestic / 2% import-export per quarter</li>
                <li>• Fee based on ACTUAL transacted volume</li>
                <li>• Fee is NOT deducted from savings or rewards</li>
                <li>• Fee is NEVER visible to suppliers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminBillingManagement;
