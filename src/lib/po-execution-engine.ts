/**
 * PO Execution Engine — strict status lifecycle with role-based actions
 * Flow: draft → sent → accepted → in_transit → delivered → payment_done → closed
 */

export type POExecutionStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'in_transit'
  | 'delivered'
  | 'payment_done'
  | 'closed';

export const PO_STATUS_FLOW: POExecutionStatus[] = [
  'draft',
  'sent',
  'accepted',
  'in_transit',
  'delivered',
  'payment_done',
  'closed',
];

export const PO_STATUS_LABELS: Record<POExecutionStatus, string> = {
  draft: 'Draft',
  sent: 'PO Sent',
  accepted: 'Accepted',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  payment_done: 'Payment Done',
  closed: 'Closed',
};

export const PO_STATUS_COLORS: Record<POExecutionStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-muted' },
  sent: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  accepted: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
  in_transit: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  delivered: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  payment_done: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  closed: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
};

type ExecutionRole = 'buyer' | 'supplier' | 'transporter' | 'admin';

export type TransportSource = 'supplier' | 'buyer' | 'platform';
export type PaymentMode = 'manual' | 'proof_upload' | 'escrow';

interface AvailableAction {
  label: string;
  targetStatus: POExecutionStatus;
  variant: 'default' | 'outline' | 'destructive';
  confirmMessage: string;
  requiresTransportDetails?: boolean;
  requiresPaymentDetails?: boolean;
  requiresDeliveryNotes?: boolean;
}

export const DELIVERY_DELAY_REASONS = [
  'Vehicle breakdown',
  'Route delay',
  'Weather issue',
  'Supplier dispatch delay',
  'Custom clearance delay',
  'Other',
];

export const TRANSPORT_SOURCE_OPTIONS: { value: TransportSource; label: string }[] = [
  { value: 'supplier', label: 'Supplier Arranged' },
  { value: 'buyer', label: 'Buyer Arranged' },
  { value: 'platform', label: 'Platform (ProcureSaathi)' },
];

export const PAYMENT_MODE_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: 'manual', label: 'Mark as Paid (Manual)' },
  { value: 'proof_upload', label: 'Upload Payment Proof' },
  { value: 'escrow', label: 'Escrow Payment' },
];

export function mapUserRoleToExecRole(role: string | null): ExecutionRole | null {
  if (!role) return null;
  if (['buyer', 'buyer_purchaser', 'buyer_cfo', 'buyer_ceo', 'buyer_manager', 'buyer_hr', 'purchaser'].includes(role)) return 'buyer';
  if (role === 'supplier') return 'supplier';
  if (['transporter', 'logistics_partner'].includes(role)) return 'transporter';
  if (['admin', 'ps_admin'].includes(role)) return 'admin';
  return null;
}

export function getAvailableActions(status: POExecutionStatus, execRole: ExecutionRole | null): AvailableAction[] {
  if (!execRole) return [];

  const actions: AvailableAction[] = [];

  if (status === 'draft' && (execRole === 'buyer' || execRole === 'admin')) {
    actions.push({ label: 'Send PO', targetStatus: 'sent', variant: 'default', confirmMessage: 'Send this Purchase Order to the supplier?' });
  }
  if (status === 'sent' && execRole === 'supplier') {
    actions.push({ label: 'Accept Order', targetStatus: 'accepted', variant: 'default', confirmMessage: 'Accept this Purchase Order?' });
  }
  if (status === 'accepted' && (execRole === 'supplier' || execRole === 'transporter')) {
    actions.push({ label: 'Mark In Transit', targetStatus: 'in_transit', variant: 'default', confirmMessage: 'Confirm shipment is in transit?', requiresTransportDetails: true });
  }
  if (status === 'in_transit' && (execRole === 'supplier' || execRole === 'transporter')) {
    actions.push({ label: 'Mark Delivered', targetStatus: 'delivered', variant: 'default', confirmMessage: 'Confirm delivery has been completed?', requiresDeliveryNotes: true });
  }
  if (status === 'delivered' && (execRole === 'buyer' || execRole === 'admin')) {
    actions.push({ label: 'Confirm Payment', targetStatus: 'payment_done', variant: 'default', confirmMessage: 'Confirm payment has been made for this order?', requiresPaymentDetails: true });
  }
  if (status === 'payment_done' && (execRole === 'buyer' || execRole === 'admin')) {
    actions.push({ label: 'Close Order', targetStatus: 'closed', variant: 'outline', confirmMessage: 'Close this order? This action is final.' });
  }

  return actions;
}

export function getStatusIndex(status: POExecutionStatus): number {
  return PO_STATUS_FLOW.indexOf(status);
}

export interface TransportDetails {
  vehicle_number: string;
  transporter_name: string;
  driver_contact: string;
  transport_source: TransportSource;
}

export interface PaymentDetails {
  payment_mode: PaymentMode;
  payment_proof_url?: string;
}

export interface DeliveryDetails {
  delay_reason?: string;
  delay_notes?: string;
}

export function validateTransportDetails(data: Partial<TransportDetails>): string | null {
  if (!data.vehicle_number?.trim()) return 'Vehicle number is required';
  if (!data.transporter_name?.trim()) return 'Transporter company name is required';
  if (!data.driver_contact?.trim()) return 'Driver contact number is required';
  return null;
}

export function getReliabilityBadge(score: number): { label: string; color: string } {
  if (score >= 80) return { label: `🟢 ${score}% Reliable`, color: 'text-green-600' };
  if (score >= 50) return { label: `🟡 ${score}% Moderate`, color: 'text-amber-600' };
  return { label: `🔴 ${score}% Risky`, color: 'text-red-600' };
}
