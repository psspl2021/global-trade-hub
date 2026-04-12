/**
 * Procurement Audit Logger — Immutable, tamper-proof action logging
 * SHA-256 hash signature for every entry
 */
import { supabase } from '@/integrations/supabase/client';

export type ProcurementAction =
  | 'RFQ_CREATED' | 'RFQ_UPDATED'
  | 'SUPPLIER_INVITED' | 'INVITE_ACCEPTED'
  | 'BID_PLACED' | 'BID_UPDATED'
  | 'AUCTION_STARTED' | 'AUCTION_CLOSED'
  | 'PO_CREATED' | 'PO_SENT_TO_SUPPLIER' | 'PO_ACCEPTED'
  | 'SHIPMENT_MARKED' | 'DELIVERY_CONFIRMED'
  | 'PAYMENT_MARKED_DONE'
  | 'ERP_SYNCED' | 'ERP_SYNC_FAILED';

interface AuditEntry {
  rfq_id?: string;
  auction_id?: string;
  po_id?: string;
  action_type: ProcurementAction;
  performed_by: string;
  performed_by_role: 'buyer' | 'supplier' | 'system';
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  is_system_action?: boolean;
}

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function logProcurementEvent(entry: AuditEntry): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const hashInput = `${entry.action_type}|${timestamp}|${entry.performed_by}|${JSON.stringify(entry.new_value || {})}`;
    const hash = await generateHash(hashInput);

    await supabase
      .from('procurement_audit_logs' as any)
      .insert({
        rfq_id: entry.rfq_id || null,
        auction_id: entry.auction_id || null,
        po_id: entry.po_id || null,
        action_type: entry.action_type,
        performed_by: entry.performed_by,
        performed_by_role: entry.performed_by_role,
        old_value: entry.old_value || null,
        new_value: entry.new_value || null,
        is_system_action: entry.is_system_action || false,
        hash_signature: hash,
      });
  } catch (err) {
    console.error('[ProcurementAudit] Failed to log:', entry.action_type, err);
  }
}

export async function fetchAuditTimeline(filters: {
  rfq_id?: string;
  auction_id?: string;
  po_id?: string;
  limit?: number;
}) {
  let query = supabase
    .from('procurement_audit_logs' as any)
    .select('*')
    .order('created_at', { ascending: true })
    .limit(filters.limit || 100);

  if (filters.rfq_id) query = query.eq('rfq_id', filters.rfq_id);
  if (filters.auction_id) query = query.eq('auction_id', filters.auction_id);
  if (filters.po_id) query = query.eq('po_id', filters.po_id);

  const { data, error } = await query;
  if (error) throw error;
  return data as any[];
}
