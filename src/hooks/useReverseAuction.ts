/**
 * Hook for reverse auction operations
 * Enterprise-grade: Anti-sniping, audit logging, ranked bids
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  // Global trade (optional — populated for international auctions)
  incoterm?: string | null;
  origin_country?: string | null;
  destination_country?: string | null;
  shipment_mode?: string | null;
  hs_code?: string | null;
  port_of_loading?: string | null;
  port_of_discharge?: string | null;
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
  hs_code?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
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

// Module-level cache so switching the Acting Purchaser dropdown
// shows previously-loaded data instantly while a fresh fetch runs.
const auctionCache = new Map<string, { ts: number; rows: ReverseAuction[] }>();
const AUCTION_CACHE_TTL_MS = 60_000;
const auctionCacheKey = (userId: string, purchaserId: string | null, filters?: AuctionFilters) =>
  `${userId}|${purchaserId ?? 'self'}|${JSON.stringify(filters ?? {})}`;

export function useReverseAuction(supplierMode: boolean = false) {
  const { user } = useAuth();
  const { selectedPurchaserId, isLoading: contextLoading } = useBuyerCompanyContext();
  const [auctions, setAuctions] = useState<ReverseAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scopeVersionRef = useRef(0);
  const requestIdRef = useRef(0);

  const fetchAuctions = useCallback(async (filters?: AuctionFilters) => {
    if (!user) return;
    // Wait for purchaser context to resolve to avoid leaking other purchasers' auctions
    if (!supplierMode && contextLoading) return;
    const scopeVersion = scopeVersionRef.current;
    const requestId = ++requestIdRef.current;
    const shouldApply = () =>
      scopeVersionRef.current === scopeVersion && requestIdRef.current === requestId;

    // Serve cache instantly for the buyer path so re-selecting a purchaser feels instant.
    // CRITICAL: When switching purchasers, if no cache exists for the new key,
    // we MUST clear stale rows from the previous purchaser immediately —
    // otherwise the user sees another purchaser's auctions flash before the
    // fresh fetch returns (the "dikha phir gayab" bug).
    const cKey = !supplierMode ? auctionCacheKey(user.id, selectedPurchaserId, filters) : null;
    if (cKey) {
      const cached = auctionCache.get(cKey);
      if (cached) {
        if (!shouldApply()) return;
        setAuctions(cached.rows);
        setIsLoading(false);
        if (Date.now() - cached.ts < AUCTION_CACHE_TTL_MS) {
          return; // fresh enough — skip refetch
        }
      } else {
        // No cache for THIS purchaser — wipe stale rows from previous context
        if (!shouldApply()) return;
        setAuctions([]);
        setIsLoading(true);
      }
    } else {
      if (!shouldApply()) return;
      setAuctions([]);
      setIsLoading(true);
    }
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
        if (!shouldApply()) return;
        setAuctions((data as unknown as ReverseAuction[]) || []);
      } else {
        // ARCHITECTURAL CONTRACT: UI = intent, DB = enforcement.
        // All buyer-side auction reads go through the scoped RPC.
        // Routed through shared deduped fetcher so parallel components
        // (list, modules, savings) reuse a single RPC roundtrip.
        const { fetchScopedAuctions } = await import('@/hooks/useScopedAuctions');
        const data = await fetchScopedAuctions({
          p_user_id: user.id,
          p_selected_purchaser: selectedPurchaserId,
          p_status: filters?.status === 'cancelled' ? 'cancelled' : null,
          p_from: null,
          p_to: null,
          p_has_winner: null,
          p_limit: 200,
          p_offset: 0,
        });

        // Client-side filters that the RPC doesn't accept
        let rows = ((data as any[]) || []) as ReverseAuction[];
        if (filters?.category && filters.category !== 'all') {
          rows = rows.filter((a) => a.category === filters.category);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          rows = rows.filter((a) =>
            a.title?.toLowerCase().includes(q) ||
            a.product_slug?.toLowerCase().includes(q) ||
            a.category?.toLowerCase().includes(q)
          );
        }
        if (filters?.sortBy === 'price_low') {
          rows = [...rows].sort((a, b) => a.starting_price - b.starting_price);
        } else if (filters?.sortBy === 'price_high') {
          rows = [...rows].sort((a, b) => b.starting_price - a.starting_price);
        } else if (filters?.sortBy === 'oldest') {
          rows = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
        }
        if (!shouldApply()) return;
        setAuctions(rows);
        if (cKey) auctionCache.set(cKey, { ts: Date.now(), rows });
      }
    } catch (err: any) {
      console.error('Error fetching reverse auctions:', err);
    } finally {
      if (shouldApply()) {
        setIsLoading(false);
      }
    }
  }, [user, supplierMode, selectedPurchaserId, contextLoading]);

  // Hardening: clear state immediately on scope change, before any cache/fetch
  // logic runs. Guarantees zero stale render even if cache logic evolves.
  useEffect(() => {
    scopeVersionRef.current += 1;
    requestIdRef.current += 1;
    if (!supplierMode) {
      setAuctions([]);
      setIsLoading(true);
    }
  }, [selectedPurchaserId, supplierMode, contextLoading, user?.id]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const createAuction = async (input: CreateAuctionInput) => {
    if (!user) return null;
    try {
      // Stage 2: route base insert through SECURITY DEFINER RPC.
      // Client retains orchestration for line items + supplier invites.
      const { data: newAuctionId, error } = await supabase.rpc('create_reverse_auction' as any, {
        payload: {
          title: input.title,
          product_slug: input.product_slug,
          category: input.category,
          quantity: input.quantity,
          unit: input.unit,
          starting_price: input.starting_price,
          reserve_price: input.reserve_price || null,
          currency: input.currency || 'INR',
          minimum_bid_step_pct: input.minimum_bid_step_pct || 0.25,
          auction_start: input.auction_start,
          auction_end: input.auction_end,
          transaction_type: input.transaction_type || 'domestic',
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
          hs_code: input.hs_code || null,
          port_of_loading: input.port_of_loading || null,
          port_of_discharge: input.port_of_discharge || null,
        },
      });

      if (error) throw error;

      const auctionId = newAuctionId as unknown as string;
      // Hydrate auction object for downstream code that expects the row
      const auction: any = { id: auctionId };

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
      const { error } = await (supabase as any).rpc('start_reverse_auction', { p_auction_id: auctionId });
      if (error) throw error;
      // Optimistic UI: flip auction to 'live' immediately so "View Live" appears without waiting for refetch
      setAuctions(prev => prev.map(a =>
        a.id === auctionId
          ? { ...a, status: 'live', auction_start: a.auction_start || new Date().toISOString() }
          : a
      ));
      toast.success('Auction is now LIVE!');
      // Fire-and-forget audit log + refetch in background (don't block UI)
      logAuctionEvent({ auction_id: auctionId, event_type: 'AUCTION_STARTED', actor_id: user.id, actor_role: 'buyer' });
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
    if (currentEditCount >= 5) {
      toast.error('Maximum 5 edits allowed per auction');
      return false;
    }
    try {
      const { line_items, ...auctionUpdates } = updates;
      const { error } = await (supabase as any).rpc('update_reverse_auction', {
        p_auction_id: auctionId,
        p_updates: auctionUpdates,
      });
      if (error) throw error;

      // Replace line items via SECURITY DEFINER RPC to avoid direct table permission failures
      if (line_items) {
        const { error: itemsError } = await (supabase as any).rpc('replace_reverse_auction_items', {
          p_auction_id: auctionId,
          p_items: line_items,
        });
        if (itemsError) throw itemsError;
      }

      toast.success(`Auction updated! (${currentEditCount + 1}/5 edits used)`);
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
      const { error } = await (supabase as any).rpc('cancel_reverse_auction', { p_auction_id: auctionId });
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
      const { data: row, error } = await (supabase as any).rpc('complete_reverse_auction', { p_auction_id: auctionId });
      if (error) throw error;

      logAuctionEvent({ auction_id: auctionId, event_type: 'AUCTION_COMPLETED', actor_id: user.id, actor_role: 'buyer' });
      if (row?.winner_supplier_id) {
        logAuctionEvent({
          auction_id: auctionId,
          event_type: 'WINNER_AWARDED',
          actor_id: user.id,
          actor_role: 'buyer',
          metadata: { winner_supplier_id: row.winner_supplier_id, winning_price: row.winning_price },
        });
      }

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
      await (supabase as any).rpc('update_auction_status', { p_auction_id: auctionId, p_status: newStatus });
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
      const { data: republishedAuction, error } = await (supabase as any).rpc('republish_reverse_auction', {
        p_auction_id: auctionId,
        p_auction_start: newSchedule?.auction_start ?? null,
        p_auction_end: newSchedule?.auction_end ?? null,
        p_starting_price: newSchedule?.starting_price ?? null,
        p_quantity: newSchedule?.quantity ?? null,
        p_unit: newSchedule?.unit ?? null,
      });
      if (error) throw error;

      const { data: suppliers, error: suppliersError } = await supabase
          .from('reverse_auction_suppliers')
          .select('id, supplier_id, supplier_email, is_active')
          .eq('auction_id', auctionId)
          .eq('is_active', true);

      if (suppliersError) throw suppliersError;

      const auctionData = republishedAuction as {
        id: string;
        title: string;
        product_slug: string;
        quantity: number;
        unit: string;
        auction_start: string | null;
      } | null;

      if (!auctionData) {
        throw new Error('Republish succeeded but no auction data was returned');
      }

      const activeSuppliers = suppliers || [];
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

  const placeBid = async (
    supplierId: string,
    bidPrice: number,
    auctionData?: ReverseAuction,
    currencyMeta?: { currency: string; fxRate: number },
  ) => {
    if (!auctionId) return false;
    try {
      // Stage 2: atomic bid + price update + anti-snipe via SECURITY DEFINER RPC.
      const { data: rpcResult, error } = await supabase.rpc('place_bid_atomic' as any, {
        p_auction_id: auctionId,
        p_bid_price: bidPrice,
      });
      const newBid: any = rpcResult ? { id: (rpcResult as any).bid_id } : null;
      if (error) {
        // Handle rate-limit error from DB trigger
        if (error.message?.includes('Rate limit')) {
          toast.error('Too fast! Please wait 2 seconds between bids.');
          return false;
        }
        throw error;
      }

      // current_price update + anti-snipe extension are handled atomically
      // server-side inside place_bid_atomic — no client follow-up needed.

      // Persist supplier's original currency + FX snapshot for audit (best-effort).
      if (newBid?.id && currencyMeta && currencyMeta.currency && currencyMeta.currency !== 'INR') {
        await supabase
          .from('reverse_auction_bids')
          .update({
            bid_currency: currencyMeta.currency,
            fx_rate_to_inr: currencyMeta.fxRate,
          } as any)
          .eq('id', newBid.id);
      }

      // Audit log
      logAuctionEvent({
        auction_id: auctionId,
        event_type: 'BID_PLACED',
        actor_id: supplierId,
        actor_role: 'supplier',
        bid_id: (newBid as any)?.id,
        bid_amount: bidPrice,
        metadata: currencyMeta?.currency && currencyMeta.currency !== 'INR'
          ? { bid_currency: currencyMeta.currency, fx_rate_to_inr: currencyMeta.fxRate }
          : undefined,
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
