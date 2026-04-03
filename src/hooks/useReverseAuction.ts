/**
 * Hook for reverse auction operations
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ReverseAuction {
  id: string;
  buyer_id: string;
  title: string;
  product_slug: string;
  category: string;
  quantity: number;
  unit: string;
  starting_price: number;
  current_price: number | null;
  reserve_price: number | null;
  currency: string;
  minimum_bid_step_pct: number;
  auction_start: string | null;
  auction_end: string | null;
  anti_snipe_seconds: number;
  anti_snipe_threshold_seconds: number;
  transaction_type: string;
  status: string;
  winner_supplier_id: string | null;
  winning_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReverseAuctionBid {
  id: string;
  auction_id: string;
  supplier_id: string;
  bid_price: number;
  is_winning: boolean;
  created_at: string;
}

export interface CreateAuctionInput {
  title: string;
  product_slug: string;
  category: string;
  quantity: number;
  unit: string;
  starting_price: number;
  reserve_price?: number;
  currency?: string;
  minimum_bid_step_pct?: number;
  auction_start: string;
  auction_end: string;
  transaction_type?: string;
  invited_supplier_ids: string[];
  invited_suppliers?: { id: string; email?: string; manual?: boolean }[];
}

export function useReverseAuction() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<ReverseAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuctions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reverse_auctions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuctions((data as unknown as ReverseAuction[]) || []);
    } catch (err: any) {
      console.error('Error fetching reverse auctions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const createAuction = async (input: CreateAuctionInput) => {
    if (!user) return null;
    try {
      const { data: auction, error } = await supabase
        .from('reverse_auctions')
        .insert({
          buyer_id: user.id,
          title: input.title,
          product_slug: input.product_slug,
          category: input.category,
          quantity: input.quantity,
          unit: input.unit,
          starting_price: input.starting_price,
          current_price: input.starting_price,
          reserve_price: input.reserve_price || null,
          currency: input.currency || 'INR',
          minimum_bid_step_pct: input.minimum_bid_step_pct || 0.25,
          auction_start: input.auction_start,
          auction_end: input.auction_end,
          transaction_type: input.transaction_type || 'domestic',
          status: 'scheduled',
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Invite suppliers with dedup, email guarantee, and source tracking
      const auctionId = (auction as any).id;
      const allInvites = input.invited_suppliers || [];
      
      if (allInvites.length > 0 && auction) {
        // Step 1: Deduplicate by email or id
        const uniqueInvites = Array.from(
          new Map(allInvites.map(s => [s.email || s.id, s])).values()
        );

        // Step 2: For platform suppliers, fetch their email from profiles
        const platformIds = uniqueInvites.filter(s => !s.manual).map(s => s.id);
        let profileEmails: Record<string, string> = {};
        if (platformIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', platformIds);
          if (profiles) {
            profileEmails = Object.fromEntries(profiles.map((p: any) => [p.id, p.email]));
          }
        }

        // Step 3: Build invites with guaranteed email and source tracking
        const invites = uniqueInvites.map(s => ({
          auction_id: auctionId,
          supplier_id: s.manual ? null : s.id,
          supplier_email: s.email || profileEmails[s.id] || null,
          invited_by: user.id,
          supplier_source: s.manual ? 'buyer_invite' : 'platform',
          supplier_company_name: s.manual ? (s.email || null) : null,
        }));

        const { error: inviteError } = await supabase
          .from('reverse_auction_suppliers')
          .insert(invites as any);
        if (inviteError) console.error('Error inviting suppliers:', inviteError);

        // Step 4: Send email invitations to all suppliers with emails
        const product = input.product_slug.replace(/_/g, ', ').replace(/-/g, ' ');
        const quantity = `${input.quantity} ${input.unit}`;
        const auctionLink = `https://www.procuresaathi.com/reverse-auction/${auctionId}`;

        for (const invite of invites) {
          if (!invite.supplier_email) continue;
          try {
            const { error: emailErr } = await supabase.functions.invoke('send-auction-invite', {
              body: {
                email: invite.supplier_email,
                auctionTitle: input.title,
                auctionId,
                product,
                quantity,
                startTime: input.auction_start,
                auctionLink,
              },
            });
            if (!emailErr) {
              // Update invite_status to 'sent'
              await supabase
                .from('reverse_auction_suppliers')
                .update({ invite_status: 'sent' } as any)
                .eq('auction_id', auctionId)
                .eq('supplier_email', invite.supplier_email);
            }
          } catch (emailErr) {
            console.error('Failed to send invite email:', emailErr);
          }
        }
      } else if (input.invited_supplier_ids.length > 0 && auction) {
        // Legacy: invited_supplier_ids only
        const invites = input.invited_supplier_ids.map(sid => ({
          auction_id: auctionId,
          supplier_id: sid,
          invited_by: user.id,
          supplier_source: 'platform',
        }));
        const { error: inviteError } = await supabase
          .from('reverse_auction_suppliers')
          .insert(invites as any);
        if (inviteError) console.error('Error inviting suppliers:', inviteError);
      }

      toast.success('Reverse auction created!');
      fetchAuctions();
      return auction;
    } catch (err: any) {
      toast.error('Failed to create auction: ' + err.message);
      return null;
    }
  };

  const startAuction = async (auctionId: string) => {
    try {
      const { error } = await supabase
        .from('reverse_auctions')
        .update({ status: 'live', auction_start: new Date().toISOString() } as any)
        .eq('id', auctionId);
      if (error) throw error;
      toast.success('Auction is now LIVE!');
      fetchAuctions();
    } catch (err: any) {
      toast.error('Failed to start auction: ' + err.message);
    }
  };

  const updateAuction = async (auctionId: string, updates: {
    title?: string;
    starting_price?: number;
    reserve_price?: number | null;
    quantity?: number;
    unit?: string;
    auction_end?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('reverse_auctions')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', auctionId);
      if (error) throw error;
      toast.success('Auction updated successfully!');
      fetchAuctions();
      return true;
    } catch (err: any) {
      toast.error('Failed to update auction: ' + err.message);
      return false;
    }
  };

  const cancelAuction = async (auctionId: string) => {
    try {
      const { error } = await supabase
        .from('reverse_auctions')
        .update({ status: 'cancelled' } as any)
        .eq('id', auctionId);
      if (error) throw error;
      toast.success('Auction cancelled.');
      fetchAuctions();
    } catch (err: any) {
      toast.error('Failed to cancel auction: ' + err.message);
    }
  };

  const completeAuction = async (auctionId: string) => {
    try {
      // Find lowest bid
      const { data: bids, error: bidError } = await supabase
        .from('reverse_auction_bids')
        .select('*')
        .eq('auction_id', auctionId)
        .order('bid_price', { ascending: true })
        .limit(1);

      if (bidError) throw bidError;

      const updates: any = { status: 'completed' };
      if (bids && bids.length > 0) {
        updates.winner_supplier_id = bids[0].supplier_id;
        updates.winning_price = bids[0].bid_price;

        // Mark winning bid
        await supabase
          .from('reverse_auction_bids')
          .update({ is_winning: true } as any)
          .eq('id', bids[0].id);
      }

      const { error } = await supabase
        .from('reverse_auctions')
        .update(updates)
        .eq('id', auctionId);

      if (error) throw error;
      toast.success('Auction completed!');
      fetchAuctions();
    } catch (err: any) {
      toast.error('Failed to complete auction: ' + err.message);
    }
  };

  return {
    auctions,
    isLoading,
    createAuction,
    startAuction,
    cancelAuction,
    completeAuction,
    refetch: fetchAuctions,
  };
}

export function useReverseAuctionBids(auctionId: string | null) {
  const [bids, setBids] = useState<ReverseAuctionBid[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBids = useCallback(async () => {
    if (!auctionId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reverse_auction_bids')
        .select('*')
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBids((data as unknown as ReverseAuctionBid[]) || []);
    } catch (err: any) {
      console.error('Error fetching bids:', err);
    } finally {
      setIsLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  // Realtime subscription for live bid updates
  useEffect(() => {
    if (!auctionId) return;
    const channel = supabase
      .channel(`auction-bids-${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reverse_auction_bids',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          setBids((prev) => [payload.new as unknown as ReverseAuctionBid, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId]);

  const placeBid = async (supplierId: string, bidPrice: number) => {
    if (!auctionId) return false;
    try {
      const { error } = await supabase
        .from('reverse_auction_bids')
        .insert({
          auction_id: auctionId,
          supplier_id: supplierId,
          bid_price: bidPrice,
        } as any);
      if (error) throw error;

      // Update current price on auction
      await supabase
        .from('reverse_auctions')
        .update({ current_price: bidPrice, updated_at: new Date().toISOString() } as any)
        .eq('id', auctionId);

      toast.success('Bid placed successfully!');
      return true;
    } catch (err: any) {
      toast.error('Failed to place bid: ' + err.message);
      return false;
    }
  };

  return { bids, isLoading, placeBid, refetch: fetchBids };
}
