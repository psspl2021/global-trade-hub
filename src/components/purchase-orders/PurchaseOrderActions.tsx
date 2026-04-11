import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  getAvailableActions,
  mapUserRoleToExecRole,
  PO_STATUS_LABELS,
  validateTransportDetails,
  type POExecutionStatus,
  type TransportDetails,
} from '@/lib/po-execution-engine';

interface PurchaseOrderActionsProps {
  poId: string;
  currentStatus: POExecutionStatus;
  userId: string;
  userRole: string | null;
  onStatusChange: () => void;
}

export function PurchaseOrderActions({ poId, currentStatus, userId, userRole, onStatusChange }: PurchaseOrderActionsProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [transport, setTransport] = useState<TransportDetails>({ vehicle_number: '', transporter_name: '', driver_contact: '' });
  const { toast } = useToast();

  const execRole = mapUserRoleToExecRole(userRole);
  const actions = getAvailableActions(currentStatus, execRole);

  if (actions.length === 0) return null;

  const handleTransition = async (targetStatus: POExecutionStatus, requiresTransport?: boolean) => {
    if (requiresTransport) {
      const err = validateTransportDetails(transport);
      if (err) {
        toast({ title: 'Missing Details', description: err, variant: 'destructive' });
        return;
      }
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('transition_po_status', {
        p_po_id: poId,
        p_new_status: targetStatus,
        p_user_id: userId,
        p_user_role: userRole || '',
        p_notes: notes || null,
        p_vehicle_number: requiresTransport ? transport.vehicle_number : null,
        p_transporter_name: requiresTransport ? transport.transporter_name : null,
        p_driver_contact: requiresTransport ? transport.driver_contact : null,
      });

      if (error) throw error;

      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || 'Transition failed');
      }

      toast({
        title: 'Status Updated',
        description: `Order moved to "${PO_STATUS_LABELS[targetStatus]}"`,
      });
      setNotes('');
      setTransport({ vehicle_number: '', transporter_name: '', driver_contact: '' });
      onStatusChange();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <AlertDialog key={action.targetStatus}>
          <AlertDialogTrigger asChild>
            <Button variant={action.variant} size="sm" disabled={loading}>
              {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {action.requiresTransportDetails && <Truck className="w-3 h-3 mr-1" />}
              {action.label}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{action.label}</AlertDialogTitle>
              <AlertDialogDescription>{action.confirmMessage}</AlertDialogDescription>
            </AlertDialogHeader>

            {action.requiresTransportDetails && (
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <Truck className="w-4 h-4" />
                  Transport Details (Required)
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="vehicle_number" className="text-xs">Vehicle Number</Label>
                    <Input id="vehicle_number" placeholder="e.g. MH12AB1234" value={transport.vehicle_number} onChange={(e) => setTransport(p => ({ ...p, vehicle_number: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="transporter_name" className="text-xs">Transporter Company Name</Label>
                    <Input id="transporter_name" placeholder="e.g. BlueDart Logistics" value={transport.transporter_name} onChange={(e) => setTransport(p => ({ ...p, transporter_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="driver_contact" className="text-xs">Driver Contact Number</Label>
                    <Input id="driver_contact" placeholder="e.g. +91 98765 43210" value={transport.driver_contact} onChange={(e) => setTransport(p => ({ ...p, driver_contact: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            <Textarea
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={2}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleTransition(action.targetStatus, action.requiresTransportDetails)}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
}
