/**
 * Procurement Audit Logger — Immutable, chain-linked, tamper-proof action logging
 * SHA-256 hash with previous_hash chain for cryptographic integrity
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
  | 'ERP_SYNCED' | 'ERP_SYNC_FAILED'
  | 'EXTERNAL_PO_LINKED' | 'ERP_SYNC_SKIPPED' | 'PO_MODE_SELECTED'
  | 'ERP_POLICY_ENFORCED' | 'SUPPLIER_PO_CONFIRMED';

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

async function getLastHash(entityFilter: { po_id?: string; auction_id?: string; rfq_id?: string }): Promise<string | null> {
  try {
    let query = supabase
      .from('procurement_audit_logs' as any)
      .select('hash_signature')
      .order('created_at', { ascending: false })
      .limit(1);

    if (entityFilter.po_id) query = query.eq('po_id', entityFilter.po_id);
    if (entityFilter.auction_id) query = query.eq('auction_id', entityFilter.auction_id);
    if (entityFilter.rfq_id) query = query.eq('rfq_id', entityFilter.rfq_id);

    const { data } = await query;
    return (data as any)?.[0]?.hash_signature || null;
  } catch {
    return null;
  }
}

export async function logProcurementEvent(entry: AuditEntry): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const previousHash = await getLastHash({
      po_id: entry.po_id,
      auction_id: entry.auction_id,
      rfq_id: entry.rfq_id,
    });

    const hashInput = `${previousHash || 'GENESIS'}|${entry.action_type}|${timestamp}|${entry.performed_by}|${JSON.stringify(entry.new_value || {})}`;
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
        previous_hash: previousHash,
      });
  } catch (err) {
    console.error('[ProcurementAudit] Failed to log:', entry.action_type, err);
  }
}

export async function verifyAuditChain(filters: {
  po_id?: string;
  auction_id?: string;
  rfq_id?: string;
}): Promise<{ total_records: number; verified_records: number; broken_at: string | null; is_intact: boolean }> {
  const { data, error } = await supabase.rpc('verify_audit_chain' as any, {
    p_po_id: filters.po_id || null,
    p_auction_id: filters.auction_id || null,
    p_rfq_id: filters.rfq_id || null,
  });

  if (error) throw error;
  const row = (data as any)?.[0] || { total_records: 0, verified_records: 0, broken_at: null, is_intact: true };
  return row;
}

export async function fetchAuditTimeline(filters: {
  rfq_id?: string;
  auction_id?: string;
  po_id?: string;
  action_type?: string;
  performed_by?: string;
  date_from?: string;
  date_to?: string;
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
  if (filters.action_type) query = query.eq('action_type', filters.action_type);
  if (filters.performed_by) query = query.eq('performed_by', filters.performed_by);
  if (filters.date_from) query = query.gte('created_at', filters.date_from);
  if (filters.date_to) query = query.lte('created_at', filters.date_to);

  const { data, error } = await query;
  if (error) throw error;
  return data as any[];
}
