/**
 * ============================================================
 * ADMIN INCENTIVE AUDIT (READ-ONLY)
 * ============================================================
 * 
 * ProcureSaathi Admin view for audit & compliance.
 * READ-ONLY - cannot modify any data.
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
  Shield, 
  Gift,
  Eye,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Clock,
  Lock
} from 'lucide-react';
import { IncentiveDeclaration } from '@/hooks/usePurchaserIncentives';
import { IncentiveDisclaimer } from './IncentiveDisclaimer';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { AccessDenied } from './AccessDenied';

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

export function AdminIncentiveAudit() {
  const [declarations, setDeclarations] = useState<IncentiveDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Access control - only ps_admin can view audit
  const { canToggleRewards, primaryRole, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();

  const fetchDeclarations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('purchaser_incentive_declarations' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeclarations((data || []) as unknown as IncentiveDeclaration[]);
    } catch (err) {
      console.error('[AdminIncentiveAudit] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  // Access control: Only ps_admin can access audit
  if (!accessLoading && (isAccessDenied || !canToggleRewards)) {
    return <AccessDenied />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'approved':
        return <Badge className="bg-blue-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'declared':
        return <Badge className="bg-amber-500 text-white"><Clock className="w-3 h-3 mr-1" />Declared</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading || accessLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading audit data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-600">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Incentive Audit & Compliance
                </h2>
                <p className="text-sm text-slate-600">
                  Read-only view for transparency and governance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-slate-300">
                <Lock className="w-3 h-3 mr-1" />
                Read-Only
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchDeclarations}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <IncentiveDisclaimer />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-slate-600" />
            <div>
              <p className="text-2xl font-bold">{declarations.length}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {declarations.filter(d => d.incentive_status === 'declared').length}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {declarations.filter(d => d.incentive_status === 'approved').length}
              </p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-emerald-50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {formatCurrency(
                  declarations
                    .filter(d => d.incentive_status === 'paid')
                    .reduce((sum, d) => sum + d.incentive_amount, 0)
                )}
              </p>
              <p className="text-xs text-muted-foreground">Total Paid</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Incentive Declaration Records
          </CardTitle>
          <CardDescription>
            Complete audit trail of all buyer-declared incentives
          </CardDescription>
        </CardHeader>
        <CardContent>
          {declarations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No incentive records to audit</p>
              <p className="text-sm mt-1">
                Records will appear here when enterprises declare incentives
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enterprise</TableHead>
                    <TableHead>Purchaser</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declarations.map((decl) => (
                    <TableRow key={decl.id}>
                      <TableCell className="font-mono text-xs">
                        {decl.enterprise_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {decl.purchaser_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {new Date(decl.period_start).toLocaleDateString('en-IN', { 
                            month: 'short', year: '2-digit' 
                          })} - {new Date(decl.period_end).toLocaleDateString('en-IN', { 
                            month: 'short', year: '2-digit' 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{decl.incentive_percentage}%</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(decl.incentive_amount, decl.currency)}
                      </TableCell>
                      <TableCell>
                        {decl.approval_role ? (
                          <Badge variant="secondary" className="text-xs">
                            {decl.approval_role.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(decl.incentive_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(decl.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Legal Note */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Audit & Compliance Note</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• All incentive data is entered by buyer organisations</li>
                <li>• ProcureSaathi does NOT calculate or pay incentives</li>
                <li>• This view is read-only for audit purposes</li>
                <li>• Data is retained for compliance and governance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminIncentiveAudit;
