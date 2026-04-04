/**
 * Auction Realtime Hook
 * Unified WebSocket channel for bids, messages, and counter offers
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuctionRealtimeCallbacks {
  onBidUpdate?: () => void;
  onMessage?: (msg: any) => void;
  onCounterOffer?: (offer: any) => void;
}

export function useAuctionRealtime(auctionId: string | null, callbacks: AuctionRealtimeCallbacks) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (!auctionId) return;

    const channel = supabase
      .channel(`auction-realtime-${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reverse_auction_bids',
          filter: `auction_id=eq.${auctionId}`,
        },
        () => cbRef.current.onBidUpdate?.()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_messages',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => cbRef.current.onMessage?.(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_counter_offers',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => cbRef.current.onCounterOffer?.(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId]);
}
