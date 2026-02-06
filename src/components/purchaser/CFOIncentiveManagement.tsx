/**
 * ============================================================
 * CFO INCENTIVE MANAGEMENT
 * ============================================================
 * 
 * CFO/CEO can:
 * - Declare incentive %
 * - Set incentive amount
 * - Approve incentives
 * - Mark as paid
 * 
 * ProcureSaathi NEVER calculates or pays incentives.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Gift, 
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  Percent,
  Calendar,
  RefreshCw,
  Building2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { IncentiveDeclaration } from '@/hooks/usePurchaserIncentives';
import { IncentiveDisclaimer } from './IncentiveDisclaimer';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { AccessDenied } from './AccessDenied';
import { cn } from '@/lib/utils';

// CFO CONFIRMATION TEXT (LOCKED)
const CFO_ETHICS_CONFIRMATION = "I confirm this incentive is funded from internal corporate budgets and complies with our HR/Ethics policy.";

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

export function CFOIncentiveManagement() {
  const [declarations, setDeclarations] = useState<IncentiveDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [ethicsConfirmed, setEthicsConfirmed] = useState(false);
  
  // Access control - MUST be before any early returns
  const { canEditIncentives, isReadOnly, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();
  
  const [newDeclaration, setNewDeclaration] = useState({
    purchaser_id: '',
    period_start: '',
    period_end: '',
    incentive_percentage: '',
    incentive_amount: '',
    currency: 'INR',
    notes: '',
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getUser();
  }, []);

  const fetchDeclarations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('purchaser_incentive_declarations' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeclarations((data || []) as unknown as IncentiveDeclaration[]);
    } catch (err) {
      console.error('[CFOIncentiveManagement] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  // Access control: Show denied screen for unauthorized users
  if (!accessLoading && isAccessDenied) {
    return <AccessDenied />;
  }

  const createDeclaration = async () => {
    if (!currentUser) {
      toast.error('You must be logged in');
      return;
    }

    if (!newDeclaration.purchaser_id || !newDeclaration.period_start || 
        !newDeclaration.period_end || !newDeclaration.incentive_amount) {
      toast.error('Please fill all required fields');
      return;
    }

    // MANDATORY: CFO must confirm ethics policy
    if (!ethicsConfirmed) {
      toast.error('You must confirm the ethics policy before declaring incentive');
      return;
    }

    try {
      const { error } = await supabase
        .from('purchaser_incentive_declarations' as any)
        .insert({
          enterprise_id: currentUser, // Simplified - in real app would be actual enterprise
          cfo_ethics_confirmed: true,
          cfo_confirmation_text: CFO_ETHICS_CONFIRMATION,
          purchaser_id: newDeclaration.purchaser_id,
          period_start: newDeclaration.period_start,
          period_end: newDeclaration.period_end,
          incentive_percentage: parseFloat(newDeclaration.incentive_percentage) || 0,
          incentive_amount: parseFloat(newDeclaration.incentive_amount),
          currency: newDeclaration.currency,
          notes: newDeclaration.notes || null,
          created_by: currentUser,
          incentive_status: 'declared',
        });

      if (error) throw error;

      toast.success('Incentive declared successfully');
      setCreateDialogOpen(false);
      setNewDeclaration({
        purchaser_id: '',
        period_start: '',
        period_end: '',
        incentive_percentage: '',
        incentive_amount: '',
        currency: 'INR',
        notes: '',
      });
      setEthicsConfirmed(false);
      fetchDeclarations();
    } catch (err: any) {
      console.error('[CFOIncentiveManagement] Create error:', err);
      toast.error(err.message || 'Failed to declare incentive');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { incentive_status: newStatus };
      
      if (newStatus === 'approved') {
        updateData.approved_by = currentUser;
        updateData.approved_at = new Date().toISOString();
        updateData.approval_role = 'cfo'; // Simplified
      } else if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('purchaser_incentive_declarations' as any)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success(`Incentive ${newStatus}`);
      fetchDeclarations();
    } catch (err) {
      console.error('[CFOIncentiveManagement] Update error:', err);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-600 text-white">Paid</Badge>;
      case 'approved':
        return <Badge className="bg-blue-600 text-white">Approved</Badge>;
      case 'declared':
        return <Badge className="bg-amber-500 text-white">Declared</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading incentive management...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-600">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-900">
                  Purchaser Incentive Management
                </h2>
                <p className="text-sm text-amber-600">
                  Declare, approve, and track purchaser incentives
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchDeclarations}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Declare Incentive
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Declare Purchaser Incentive</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Purchaser ID *</Label>
                      <Input
                        value={newDeclaration.purchaser_id}
                        onChange={(e) => setNewDeclaration({ ...newDeclaration, purchaser_id: e.target.value })}
                        placeholder="Enter purchaser user ID"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Period Start *</Label>
                        <Input
                          type="date"
                          value={newDeclaration.period_start}
                          onChange={(e) => setNewDeclaration({ ...newDeclaration, period_start: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Period End *</Label>
                        <Input
                          type="date"
                          value={newDeclaration.period_end}
                          onChange={(e) => setNewDeclaration({ ...newDeclaration, period_end: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Incentive %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newDeclaration.incentive_percentage}
                          onChange={(e) => setNewDeclaration({ ...newDeclaration, incentive_percentage: e.target.value })}
                          placeholder="e.g., 1.5"
                        />
                      </div>
                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          value={newDeclaration.incentive_amount}
                          onChange={(e) => setNewDeclaration({ ...newDeclaration, incentive_amount: e.target.value })}
                          placeholder="e.g., 50000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select 
                        value={newDeclaration.currency} 
                        onValueChange={(val) => setNewDeclaration({ ...newDeclaration, currency: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input
                        value={newDeclaration.notes}
                        onChange={(e) => setNewDeclaration({ ...newDeclaration, notes: e.target.value })}
                        placeholder="Optional notes"
                      />
                    </div>

                    {/* MANDATORY CFO ETHICS CONFIRMATION */}
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Ethics Confirmation Required</p>
                          <p className="text-xs text-amber-700 mt-1">
                            As per governance policy, you must confirm compliance before declaring incentive.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          id="ethics-confirm"
                          checked={ethicsConfirmed}
                          onCheckedChange={(checked) => setEthicsConfirmed(checked === true)}
                          className="mt-1"
                        />
                        <Label 
                          htmlFor="ethics-confirm" 
                          className="text-sm text-amber-800 cursor-pointer leading-relaxed"
                        >
                          {CFO_ETHICS_CONFIRMATION}
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={createDeclaration} 
                      disabled={!ethicsConfirmed || !canEditIncentives}
                      className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      Declare Incentive
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <IncentiveDisclaimer variant="banner" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-2xl font-bold">{declarations.length}</p>
              <p className="text-xs text-muted-foreground">Total Declarations</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {declarations.filter(d => d.incentive_status === 'declared').length}
              </p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
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
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-emerald-600" />
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

      {/* Declarations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            All Incentive Declarations
          </CardTitle>
          <CardDescription>
            Manage purchaser incentives for your organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {declarations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No incentive declarations yet</p>
              <p className="text-sm mt-1">
                Click "Declare Incentive" to create the first one
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchaser</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declarations.map((decl) => (
                    <TableRow key={decl.id}>
                      <TableCell className="font-mono text-xs">
                        {decl.purchaser_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {new Date(decl.period_start).toLocaleDateString('en-IN', { 
                            month: 'short', year: 'numeric' 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{decl.incentive_percentage}%</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(decl.incentive_amount, decl.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(decl.incentive_status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {decl.incentive_status === 'declared' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(decl.id, 'approved')}
                            >
                              Approve
                            </Button>
                          )}
                          {decl.incentive_status === 'approved' && (
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => updateStatus(decl.id, 'paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Footer Disclaimer */}
      <IncentiveDisclaimer variant="compact" />
    </div>
  );
}

export default CFOIncentiveManagement;
