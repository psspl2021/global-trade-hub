/**
 * Hook for reverse auction operations
 * Enterprise-grade: Anti-sniping, audit logging, ranked bids
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';
import { toast } from 'sonner';
import { logAuctionEvent } from '@/utils/auctionAuditLogger';

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
  edit_count: number;
  created_at: string;
}

/** Ranked bid with L1/L2/L3 rank */
export interface RankedBid extends ReverseAuctionBid {
  rank: number;
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
  // RFQ-style fields
  description?: string;
  rfq_type?: string;
  destination_country?: string;
  destination_state?: string;
  delivery_address?: string;
  payment_terms?: string;
  certifications?: string;
  quality_standards?: string;
  line_items?: { product_name: string; quantity: number; unit: string; description?: string; category?: string; unit_price?: number }[];
  deadline?: string;
  // Global trade fields
  incoterm?: string;
  origin_country?: string;
  shipment_mode?: string;
}

/** Returns bids sorted by price with rank (L1=1, L2=2, etc.) */
export function getRankedBids(bids: ReverseAuctionBid[]): RankedBid[] {
  if (bids.length === 0) return [];
  
  // Group by supplier, keep best (lowest) bid per supplier
  const bestBySupplier = new Map<string, ReverseAuctionBid>();
  for (const bid of bids) {
    const existing = bestBySupplier.get(bid.supplier_id);
    if (!existing || bid.bid_price < existing.bid_price) {
      bestBySupplier.set(bid.supplier_id, bid);
    }
  }

  return Array.from(bestBySupplier.values())
    .sort((a, b) => a.bid_price - b.bid_price)
    .map((bid, index) => ({ ...bid, rank: index + 1 }));
}

export interface AuctionFilters {
  status?: string;
  category?: string;
  search?: string;
  sortBy?: string;
}

export function useReverseAuction(supplierMode: boolean = false) {
  const { user } = useAuth();
  const { selectedPurchaserId, isLoading: contextLoading } = useBuyerCompanyContext();
  const [auctions, setAuctions] = useState<ReverseAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuctions = useCallback(async (filters?: AuctionFilters) => {
    if (!user) return;
    // Wait for purchaser context to resolve to avoid leaking other purchasers' auctions
    if (!supplierMode && contextLoading) return;
    setIsLoading(true);
    try {
      if (supplierMode) {
        const { data: invites, error: invErr } = await supabase
          .from('reverse_auction_suppliers')
          .select('auction_id')
          .or(`supplier_id.eq.${user.id},supplier_email.eq.${user.email}`);
        if (invErr) throw invErr;
        const auctionIds = (invites || []).map((i: any) => i.auction_id);
        if (auctionIds.length === 0) {
          setAuctions([]);
          setIsLoading(false);
          return;
        }
        let query = supabase
          .from('reverse_auctions')
          .select('*')
          .in('id', auctionIds)
          .in('status', ['scheduled', 'live', 'completed']);

        // Apply server-side filters only for cancelled (completed is time-derived, handled client-side)
        if (filters?.status === 'cancelled') {
          query = query.eq('status', filters.status);
        }
        if (filters?.category && filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,product_slug.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
        }

        // Sort
        if (filters?.sortBy === 'price_low') {
          query = query.order('starting_price', { ascending: true });
        } else if (filters?.sortBy === 'price_high') {
          query = query.order('starting_price', { ascending: false });
        } else if (filters?.sortBy === 'oldest') {
          query = query.order('created_at', { ascending: true });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        setAuctions((data as unknown as ReverseAuction[]) || []);
      } else {
        // Scope to the acting purchaser. Management views pass selectedPurchaserId;
        // purchasers/buyers default to themselves. DB-side scoping (purchaser_id) is
        // the authoritative leak-prevention boundary.
        const effectivePurchaserId = selectedPurchaserId || user.id;
        let query = supabase
          .from('reverse_auctions')
          .select('*')
          .eq('purchaser_id', effectivePurchaserId);

        // Apply server-side filters only for cancelled (completed is time-derived, handled client-side)
        if (filters?.status === 'cancelled') {
          query = query.eq('status', filters.status);
        }
        if (filters?.category && filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,product_slug.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
        }

        // Sort
        if (filters?.sortBy === 'price_low') {
          query = query.order('starting_price', { ascending: true });
        } else if (filters?.sortBy === 'price_high') {
          query = query.order('starting_price', { ascending: false });
        } else if (filters?.sortBy === 'oldest') {
          query = query.order('created_at', { ascending: true });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        setAuctions((data as unknown as ReverseAuction[]) || []);
      }
    } catch (err: any) {
      console.error('Error fetching reverse auctions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, supplierMode, selectedPurchaserId, contextLoading]);

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
          description: input.description || null,
          rfq_type: input.rfq_type || 'domestic',
          destination_country: input.destination_country || 'India',
          destination_state: input.destination_state || null,
          delivery_address: input.delivery_address || null,
          payment_terms: input.payment_terms || null,
          certifications: input.certifications || null,
          quality_standards: input.quality_standards || null,
          deadline: input.deadline || null,
          incoterm: input.incoterm || null,
          origin_country: input.origin_country || null,
          shipment_mode: input.shipment_mode || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      const auctionId = (auction as any).id;

      // Insert line items if provided
      if (input.line_items && input.line_items.length > 0) {
        const lineItems = input.line_items.map(li => ({
          auction_id: auctionId,
          product_name: li.product_name,
          quantity: li.quantity,
          unit: li.unit,
          category: li.category || input.category,
          description: li.description || null,
          unit_price: li.unit_price || 0,
        }));
        await supabase.from('reverse_auction_items').insert(lineItems as any);
      }

      // Audit log
      logAuctionEvent({
        auction_id: auctionId,
        event_type: 'AUCTION_CREATED',
        actor_id: user.id,
        actor_role: 'buyer',
        metadata: { title: input.title, starting_price: input.starting_price },
      });

      // Invite suppliers with dedup, email guarantee, and source tracking
      const allInvites = input.invited_suppliers || [];
      
      if (allInvites.length > 0 && auction) {
        const uniqueInvites = Array.from(
          new Map(allInvites.map(s => [s.email || s.id, s])).values()
        );

        const platformIds = uniqueInvites.filter(s => !s.manual).map(s => s.id);
        const manualEmails = uniqueInvites.filter(s => s.manual && s.email).map(s => s.email!);
        let profileEmails: Record<string, string> = {};
        let profileIdsByEmail: Record<string, string> = {};
        if (platformIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', platformIds);
          if (profiles) {
            profileEmails = Object.fromEntries(profiles.map((p: any) => [p.id, p.email]));
          }
        }
        // Resolve supplier_id for manual (email-only) invites
        if (manualEmails.length > 0) {
          const { data: emailProfiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('email', manualEmails);
          if (emailProfiles) {
            profileIdsByEmail = Object.fromEntries(emailProfiles.map((p: any) => [p.email.toLowerCase(), p.id]));
          }
        }

        const invites = uniqueInvites.map(s => ({
          auction_id: auctionId,
          supplier_id: s.manual ? (profileIdsByEmail[(s.email || '').toLowerCase()] || null) : s.id,
          supplier_email: s.email || profileEmails[s.id] || null,
          invited_by: user.id,
          supplier_source: s.manual ? 'buyer_invite' : 'platform',
          supplier_company_name: s.manual ? (s.email || null) : null,
        }));

        const { error: inviteError } = await supabase
          .from('reverse_auction_suppliers')
          .insert(invites as any);
        if (inviteError) console.error('Error inviting suppliers:', inviteError);

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
    if (!user) return;
    try {
      const { error } = await supabase
        .from('reverse_auctions')
        .update({ status: 'live', auction_start: new Date().toISOString() } as any)
        .eq('id', auctionId);
      if (error) throw error;
      logAuctionEvent({ auction_id: auctionId, event_type: 'AUCTION_STARTED', actor_id: user.id, actor_role: 'buyer' });
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
    product_slug?: string;
    auction_end?: string;
    description?: string;
    destination_country?: string;
    destination_state?: string;
    delivery_address?: string;
    payment_terms?: string;
    certifications?: string;
    quality_standards?: string;
    deadline?: string | null;
    line_items?: { product_name: string; quantity: number; unit: string; description?: string; category?: string; unit_price?: number }[];
  }, currentEditCount: number = 0) => {
    if (currentEditCount >= 2) {
      toast.error('Maximum 2 edits allowed per auction');
      return false;
    }
    try {
      const { line_items, ...auctionUpdates } = updates;
      const { error } = await supabase
        .from('reverse_auctions')
        .update({ ...auctionUpdates, buyer_edit_count: currentEditCount + 1, updated_at: new Date().toISOString() } as any)
        .eq('id', auctionId);
      if (error) throw error;

      // Replace line items: insert first, then delete old (safe against partial failure)
      if (line_items && line_items.length > 0) {
        const itemsToInsert = line_items.map(li => ({
          auction_id: auctionId,
          product_name: li.product_name,
          quantity: li.quantity,
          unit: li.unit,
          category: li.category || null,
          description: li.description || null,
          unit_price: li.unit_price || 0,
        }));
        // Get old item IDs first
        const { data: oldItems } = await supabase
          .from('reverse_auction_items')
          .select('id')
          .eq('auction_id', auctionId);
        // Insert new items
        const { error: insertErr } = await supabase.from('reverse_auction_items').insert(itemsToInsert as any);
        if (insertErr) throw insertErr;
        // Only delete old items after successful insert
        if (oldItems && oldItems.length > 0) {
          const oldIds = oldItems.map((o: any) => o.id);
          await supabase.from('reverse_auction_items').delete().in('id', oldIds);
        }
      }

      toast.success(`Auction updated! (${currentEditCount + 1}/2 edits used)`);
      fetchAuctions();
      return true;
    } catch (err: any) {
      toast.error('Failed to update auction: ' + err.message);
      return false;
    }
  };

  const cancelAuction = async (auctionId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('reverse_auctions')
        .update({ status: 'cancelled' } as any)
        .eq('id', auctionId);
      if (error) throw error;
      logAuctionEvent({ auction_id: auctionId, event_type: 'AUCTION_CANCELLED', actor_id: user.id, actor_role: 'buyer' });
      toast.success('Auction cancelled.');
      fetchAuctions();
    } catch (err: any) {
      toast.error('Failed to cancel auction: ' + err.message);
    }
  };

  const completeAuction = async (auctionId: string) => {
    if (!user) return;
    try {
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

        await supabase
          .from('reverse_auction_bids')
          .update({ is_winning: true } as any)
          .eq('id', bids[0].id);

        logAuctionEvent({
          auction_id: auctionId,
          event_type: 'WINNER_AWARDED',
          actor_id: user.id,
          actor_role: 'buyer',
          bid_id: bids[0].id,
          bid_amount: bids[0].bid_price,
          metadata: { winner_supplier_id: bids[0].supplier_id },
        });
      }

      const { error } = await supabase
        .from('reverse_auctions')
        .update(updates)
        .eq('id', auctionId);

      if (error) throw error;
      logAuctionEvent({ auction_id: auctionId, event_type: 'AUCTION_COMPLETED', actor_id: user.id, actor_role: 'buyer' });

      // Send winner/loser/buyer notification emails
      supabase.functions.invoke('send-auction-result', {
        body: { auction_id: auctionId },
      }).catch(err => console.error('Failed to send auction result emails:', err));

      toast.success('Auction completed! Winner notified.');
      fetchAuctions();
    } catch (err: any) {
      toast.error('Failed to complete auction: ' + err.message);
    }
  };

  const updateAuctionStatus = async (auctionId: string, newStatus: string) => {
    try {
      await supabase
        .from('reverse_auctions')
        .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
        .eq('id', auctionId);
      fetchAuctions();
    } catch (err) {
      console.error('Failed to auto-update auction status:', err);
    }
  };

  const republishAuction = async (auctionId: string, newSchedule?: {
    auction_start: string;
    auction_end: string;
    starting_price?: number;
    quantity?: number;
    unit?: string;
  }) => {
    if (!user) return;
    try {
      const updates: any = {
        status: 'scheduled',
        winner_supplier_id: null,
        winning_bid: null,
        winning_price: null,
        current_price: null,
        buyer_edit_count: 0,
      };
      if (newSchedule) {
        updates.auction_start = newSchedule.auction_start;
        updates.auction_end = newSchedule.auction_end;
        if (newSchedule.starting_price) {
          updates.starting_price = newSchedule.starting_price;
          updates.current_price = newSchedule.starting_price;
        }
        if (newSchedule.quantity) updates.quantity = newSchedule.quantity;
        if (newSchedule.unit) updates.unit = newSchedule.unit;
      }

      const { error } = await supabase
        .from('reverse_auctions')
        .update(updates)
        .eq('id', auctionId);
      if (error) throw error;

      const { error: bidDeleteError } = await supabase
        .from('reverse_auction_bids')
        .delete()
        .eq('auction_id', auctionId);
      if (bidDeleteError) throw bidDeleteError;

      const [auctionRes, suppliersRes] = await Promise.all([
        supabase
          .from('reverse_auctions')
          .select('id, title, product_slug, quantity, unit, auction_start')
          .eq('id', auctionId)
          .single(),
        supabase
          .from('reverse_auction_suppliers')
          .select('id, supplier_id, supplier_email, is_active')
          .eq('auction_id', auctionId)
          .eq('is_active', true),
      ]);

      if (auctionRes.error) throw auctionRes.error;
      if (suppliersRes.error) throw suppliersRes.error;

      const activeSuppliers = suppliersRes.data || [];
      const missingEmailSupplierIds = Array.from(
        new Set(
          activeSuppliers
            .filter((supplier: any) => !supplier.supplier_email && supplier.supplier_id)
            .map((supplier: any) => supplier.supplier_id as string)
        )
      );

      let profileEmailBySupplierId: Record<string, string> = {};
      if (missingEmailSupplierIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', missingEmailSupplierIds);

        if (profilesError) {
          console.error('Failed to resolve supplier emails for republish:', profilesError);
        } else if (profiles) {
          profileEmailBySupplierId = Object.fromEntries(
            profiles
              .filter((profile: any) => profile.email)
              .map((profile: any) => [profile.id, profile.email as string])
          );
        }
      }

      const resolvedSuppliers = activeSuppliers
        .map((supplier: any) => {
          const resolvedEmail = supplier.supplier_email || (supplier.supplier_id ? profileEmailBySupplierId[supplier.supplier_id] : null);
          return resolvedEmail
            ? { ...supplier, resolvedEmail }
            : null;
        })
        .filter(Boolean) as Array<{
          id: string;
          supplier_id: string | null;
          supplier_email: string | null;
          resolvedEmail: string;
        }>;

      if (resolvedSuppliers.length > 0) {
        await supabase
          .from('reverse_auction_suppliers')
          .update({ invite_status: 'pending' } as any)
          .eq('auction_id', auctionId)
          .eq('is_active', true);

        const auctionData = auctionRes.data;
        const product = auctionData.product_slug.replace(/_/g, ', ').replace(/-/g, ' ');
        const quantity = `${auctionData.quantity} ${auctionData.unit}`;
        const auctionLink = `https://www.procuresaathi.com/reverse-auction/${auctionId}`;

        await Promise.all(
          resolvedSuppliers.map(async (supplier) => {
            try {
              const { error: emailError } = await supabase.functions.invoke('send-auction-invite', {
                body: {
                  email: supplier.resolvedEmail,
                  auctionTitle: auctionData.title,
                  auctionId,
                  product,
                  quantity,
                  startTime: auctionData.auction_start,
                  auctionLink,
                },
              });

              if (emailError) throw emailError;

              const { error: inviteUpdateError } = await supabase
                .from('reverse_auction_suppliers')
                .update({
                  invite_status: 'sent',
                  supplier_email: supplier.resolvedEmail,
                } as any)
                .eq('id', supplier.id);

              if (inviteUpdateError) {
                console.error('Failed to update invite status after republish:', inviteUpdateError);
              }
            } catch (inviteError) {
              console.error(`Failed to send republish invite to ${supplier.resolvedEmail}:`, inviteError);
            }
          })
        );
      }

      logAuctionEvent({ auction_id: auctionId, event_type: 'AUCTION_REPUBLISHED', actor_id: user.id, actor_role: 'buyer' });
      toast.success('Auction republished successfully.');
      fetchAuctions();
    } catch (err: any) {
      toast.error('Failed to republish auction: ' + err.message);
    }
  };

  // Analytics computed from auctions
  const analytics = useMemo(() => {
    const live = auctions.filter(a => {
      if (a.status === 'cancelled' || a.status === 'completed') return false;
      const now = new Date();
      if (a.auction_end && new Date(a.auction_end) <= now) return false;
      if (a.auction_start && new Date(a.auction_start) <= now) return true;
      return false;
    });

    const completed = auctions.filter(a => a.status === 'completed');
    
    let totalSavings = 0;
    let totalSavingsPct = 0;
    let savingsCount = 0;
    
    for (const a of completed) {
      if (a.winning_price && a.starting_price && a.winning_price < a.starting_price) {
        totalSavings += (a.starting_price - a.winning_price) * a.quantity;
        totalSavingsPct += ((a.starting_price - a.winning_price) / a.starting_price) * 100;
        savingsCount++;
      }
    }

    return {
      totalAuctions: auctions.length,
      liveCount: live.length,
      completedCount: completed.length,
      totalSavings,
      avgBidReduction: savingsCount > 0 ? totalSavingsPct / savingsCount : 0,
    };
  }, [auctions]);

  return {
    auctions,
    isLoading,
    analytics,
    createAuction,
    startAuction,
    updateAuction,
    updateAuctionStatus,
    cancelAuction,
    completeAuction,
    republishAuction,
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
        { event: 'INSERT', schema: 'public', table: 'reverse_auction_bids', filter: `auction_id=eq.${auctionId}` },
        (payload) => {
          setBids((prev) => [payload.new as unknown as ReverseAuctionBid, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reverse_auction_bids', filter: `auction_id=eq.${auctionId}` },
        (payload) => {
          const updated = payload.new as unknown as ReverseAuctionBid;
          setBids((prev) => prev.map(b => b.id === updated.id ? updated : b));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [auctionId]);

  const placeBid = async (supplierId: string, bidPrice: number, auctionData?: ReverseAuction) => {
    if (!auctionId) return false;
    try {
      const { data: newBid, error } = await supabase
        .from('reverse_auction_bids')
        .insert({
          auction_id: auctionId,
          supplier_id: supplierId,
          bid_price: bidPrice,
        } as any)
        .select()
        .single();
      if (error) {
        // Handle rate-limit error from DB trigger
        if (error.message?.includes('Rate limit')) {
          toast.error('Too fast! Please wait 2 seconds between bids.');
          return false;
        }
        throw error;
      }

      // Update current price on auction
      await supabase
        .from('reverse_auctions')
        .update({ current_price: bidPrice, updated_at: new Date().toISOString() } as any)
        .eq('id', auctionId);

      // Anti-sniping + fraud detection handled server-side via DB triggers
      // No client-side logic needed — prevents race conditions & manipulation

      // Audit log
      logAuctionEvent({
        auction_id: auctionId,
        event_type: 'BID_PLACED',
        actor_id: supplierId,
        actor_role: 'supplier',
        bid_id: (newBid as any)?.id,
        bid_amount: bidPrice,
      });

      toast.success('Bid placed successfully!');
      return true;
    } catch (err: any) {
      const msg = err.message || 'Failed to place bid';
      if (!msg.includes('Too fast')) toast.error('Failed to place bid: ' + msg);
      return false;
    }
  };

  const editBid = async (bidId: string, newPrice: number, currentEditCount: number, supplierId?: string) => {
    if (!auctionId) return false;
    if (currentEditCount >= 2) {
      toast.error('Maximum 2 edits allowed per bid');
      return false;
    }
    try {
      const { error } = await supabase
        .from('reverse_auction_bids')
        .update({
          bid_price: newPrice,
          edit_count: currentEditCount + 1,
        } as any)
        .eq('id', bidId);
      if (error) throw error;

      await supabase
        .from('reverse_auctions')
        .update({ current_price: newPrice, updated_at: new Date().toISOString() } as any)
        .eq('id', auctionId);

      // Audit log
      if (supplierId) {
        logAuctionEvent({
          auction_id: auctionId,
          event_type: 'BID_EDITED',
          actor_id: supplierId,
          actor_role: 'supplier',
          bid_id: bidId,
          bid_amount: newPrice,
          metadata: { edit_number: currentEditCount + 1 },
        });
      }

      fetchBids();
      toast.success(`Bid updated! (${currentEditCount + 1}/2 edits used)`);
      return true;
    } catch (err: any) {
      toast.error('Failed to edit bid: ' + err.message);
      return false;
    }
  };

  return { bids, isLoading, placeBid, editBid, refetch: fetchBids };
}
