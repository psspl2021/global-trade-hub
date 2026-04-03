/**
 * Auction Audit Logger — Enterprise-grade event tracking for reverse auctions
 * Logs all bid events (placed, edited, awarded, cancelled) to the database
 */
import { supabase } from '@/integrations/supabase/client';

export type AuctionEventType =
  | 'BID_PLACED'
  | 'BID_EDITED'
  | 'AUCTION_CREATED'
  | 'AUCTION_STARTED'
  | 'AUCTION_COMPLETED'
  | 'AUCTION_CANCELLED'
  | 'AUCTION_REPUBLISHED'
  | 'ANTI_SNIPE_TRIGGERED'
  | 'WINNER_AWARDED';

interface AuditLogEntry {
  auction_id: string;
  event_type: AuctionEventType;
  actor_id: string;
  actor_role: 'buyer' | 'supplier' | 'system';
  bid_id?: string;
  bid_amount?: number;
  metadata?: Record<string, any>;
}

export async function logAuctionEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await supabase
      .from('reverse_auction_audit_logs' as any)
      .insert({
        auction_id: entry.auction_id,
        event_type: entry.event_type,
        actor_id: entry.actor_id,
        actor_role: entry.actor_role,
        bid_id: entry.bid_id || null,
        bid_amount: entry.bid_amount || null,
        metadata: entry.metadata || null,
      });
  } catch (err) {
    console.error('[AuctionAudit] Failed to log event:', entry.event_type, err);
  }
}
