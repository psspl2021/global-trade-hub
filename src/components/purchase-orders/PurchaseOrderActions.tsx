import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Truck, CreditCard, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  getAvailableActions,
  mapUserRoleToExecRole,
  PO_STATUS_LABELS,
  validateTransportDetails,
  DELIVERY_DELAY_REASONS,
  TRANSPORT_SOURCE_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  type POExecutionStatus,
  type TransportDetails,
  type PaymentDetails,
  type DeliveryDetails,
  type TransportSource,
  type PaymentMode,
} from '@/lib/po-execution-engine';

interface PurchaseOrderActionsProps {
  poId: string;
  currentStatus: POExecutionStatus;
  userId: string;
  userRole: string | null;
  onStatusChange: () => void;
  disabled?: boolean;
}

export function PurchaseOrderActions({ poId, currentStatus, userId, userRole, onStatusChange, disabled }: PurchaseOrderActionsProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [transport, setTransport] = useState<TransportDetails>({ vehicle_number: '', transporter_name: '', driver_contact: '', transport_source: 'supplier' });
  const [payment, setPayment] = useState<PaymentDetails>({ payment_mode: 'manual' });
  const [delivery, setDelivery] = useState<DeliveryDetails>({});
  const { toast } = useToast();

  const execRole = mapUserRoleToExecRole(userRole);
  const actions = getAvailableActions(currentStatus, execRole);

  if (actions.length === 0) return null;

  const resetFormState = () => {
    setNotes('');
    setTransport({ vehicle_number: '', transporter_name: '', driver_contact: '', transport_source: 'supplier' });
    setPayment({ payment_mode: 'manual' });
    setDelivery({});
  };

  const finishSuccess = (targetStatus: POExecutionStatus) => {
    toast({
      title: 'Status Updated',
      description: `Order moved to "${PO_STATUS_LABELS[targetStatus]}"`,
    });
    resetFormState();
    onStatusChange();
  };

  const fetchCurrentStatus = async () => {
    const { data } = await supabase
      .from('purchase_orders')
      .select('status')
      .eq('id', poId)
      .maybeSingle();

    return data?.status as POExecutionStatus | undefined;
  };

  const handleTransition = async (targetStatus: POExecutionStatus, requiresTransport?: boolean, requiresPayment?: boolean) => {
    if (requiresTransport) {
      const err = validateTransportDetails(transport);
      if (err) {
        toast({ title: 'Missing Details', description: err, variant: 'destructive' });
        return;
      }
    }

    setLoading(true);
    const idempotencyKey = `${poId}_${targetStatus}_${crypto.randomUUID()}`;
    try {
      // Race-safe: atomic server-side validation for external POs before transition
      const { data: gateCheck, error: gateError } = await supabase.rpc('proceed_po_step', {
        p_po_id: poId,
        p_new_status: targetStatus,
        p_updated_by: userId,
        p_idempotency_key: idempotencyKey,
      });

      if (gateError) throw gateError;
      const gate = gateCheck as any;
      if (gate && !gate.success) {
        throw new Error(gate.reason || 'Validation failed');
      }

      if (gate?.deduplicated) {
        const latestStatus = await fetchCurrentStatus();
        if (latestStatus === targetStatus) {
          finishSuccess(targetStatus);
          return;
        }
      }

      // proceed_po_step already updated status, now run transition for side-effects
      const { data, error } = await supabase.rpc('transition_po_status', {
        p_po_id: poId,
        p_new_status: targetStatus,
        p_user_id: userId,
        p_user_role: userRole || '',
        p_notes: notes || null,
        p_vehicle_number: requiresTransport ? transport.vehicle_number : null,
        p_transporter_name: requiresTransport ? transport.transporter_name : null,
        p_driver_contact: requiresTransport ? transport.driver_contact : null,
        p_transport_source: requiresTransport ? transport.transport_source : null,
        p_payment_mode: requiresPayment ? payment.payment_mode : null,
        p_payment_proof_url: requiresPayment ? payment.payment_proof_url || null : null,
        p_delivery_delay_reason: delivery.delay_reason || null,
        p_delivery_delay_notes: delivery.delay_notes || null,
      });

      if (error) {
        const latestStatus = await fetchCurrentStatus();
        if (latestStatus === targetStatus) {
          finishSuccess(targetStatus);
          return;
        }
        throw error;
      }

      const result = data as any;
      if (!result?.success) {
        const latestStatus = await fetchCurrentStatus();
        if (latestStatus === targetStatus) {
          finishSuccess(targetStatus);
          return;
        }
        throw new Error(result?.error || 'Transition failed');
      }

      finishSuccess(targetStatus);
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
            <Button variant={action.variant} size="sm" disabled={loading || disabled}>
              {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {action.requiresTransportDetails && <Truck className="w-3 h-3 mr-1" />}
              {action.requiresPaymentDetails && <CreditCard className="w-3 h-3 mr-1" />}
              {action.label}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>{action.label}</AlertDialogTitle>
              <AlertDialogDescription>{action.confirmMessage}</AlertDialogDescription>
            </AlertDialogHeader>

            {/* Transport Details Section */}
            {action.requiresTransportDetails && (
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <Truck className="w-4 h-4" />
                  Transport Details (Required)
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="transport_source" className="text-xs">Transport Arranged By</Label>
                    <Select value={transport.transport_source} onValueChange={(v) => setTransport(p => ({ ...p, transport_source: v as TransportSource }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRANSPORT_SOURCE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

            {/* Delivery Notes / Delay Reason Section */}
            {action.requiresDeliveryNotes && (
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-400">
                  <AlertTriangle className="w-4 h-4" />
                  Delivery Details
                </div>
                <div>
                  <Label className="text-xs">Delay Reason (if applicable)</Label>
                  <Select value={delivery.delay_reason || ''} onValueChange={(v) => setDelivery(p => ({ ...p, delay_reason: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select if delayed" /></SelectTrigger>
                    <SelectContent>
                      {DELIVERY_DELAY_REASONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {delivery.delay_reason && (
                  <div>
                    <Label className="text-xs">Additional Notes</Label>
                    <Textarea
                      placeholder="Describe the delay..."
                      value={delivery.delay_notes || ''}
                      onChange={(e) => setDelivery(p => ({ ...p, delay_notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Payment Details Section */}
            {action.requiresPaymentDetails && (
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                  Payment Confirmation
                </div>
                <div>
                  <Label className="text-xs">Payment Method</Label>
                  <Select value={payment.payment_mode} onValueChange={(v) => setPayment(p => ({ ...p, payment_mode: v as PaymentMode }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {payment.payment_mode === 'proof_upload' && (
                  <div>
                    <Label className="text-xs">Payment Proof URL</Label>
                    <Input
                      placeholder="Paste screenshot URL or upload link"
                      value={payment.payment_proof_url || ''}
                      onChange={(e) => setPayment(p => ({ ...p, payment_proof_url: e.target.value }))}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Upload payment screenshot and paste the link here</p>
                  </div>
                )}
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
              <AlertDialogAction onClick={() => handleTransition(action.targetStatus, action.requiresTransportDetails, action.requiresPaymentDetails)}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
}
