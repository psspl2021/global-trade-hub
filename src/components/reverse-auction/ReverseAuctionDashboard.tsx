/**
 * Reverse Auction Dashboard — Full page view matching enterprise layout
 * Header + Credits + Pricing Plans + War Room + Supplier Network + Auction List
 * Selected auction persisted via URL search params for refresh survival
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ReverseAuctionList } from './ReverseAuctionList';
import { AuctionDashboardModules } from './AuctionDashboardModules';
import { LiveAuctionView } from './LiveAuctionView';
import { MonthlySavingsAnalytics } from './MonthlySavingsAnalytics';
import { AuctionCreditsPage } from '@/components/auction-credits/AuctionCreditsPage';
import { AuctionWarRoom } from './AuctionWarRoom';
import { SupplierNetworkPage } from '@/components/supplier-network/SupplierNetworkPage';
import { PurchaseOrdersPage } from '@/components/purchase-orders/PurchaseOrdersPage';
import { ExecutionTrackingPage } from '@/components/execution-tracking/ExecutionTrackingPage';
import { UsageProgressMeter } from './UsageProgressMeter';
import { ReverseAuction } from '@/hooks/useReverseAuction';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DASHBOARD_LOCKIN_COPY } from '@/lib/global-positioning';
import { Gavel, Sparkles, Target, Loader2, Users, ArrowLeft, ShoppingCart, Truck, CreditCard, Globe, ListOrdered } from 'lucide-react';

interface ReverseAuctionDashboardProps {
  isSupplier?: boolean;
}

export function ReverseAuctionDashboard({ isSupplier = false }: ReverseAuctionDashboardProps) {
  const [selectedAuction, setSelectedAuction] = useState<ReverseAuction | null>(null);
  const [showWarRoom, setShowWarRoom] = useState(false);
  const [showSupplierNetwork, setShowSupplierNetwork] = useState(false);
  const [showPurchaseOrders, setShowPurchaseOrders] = useState(false);
  const [showExecutionTracking, setShowExecutionTracking] = useState(false);
  const [showAuctionCredits, setShowAuctionCredits] = useState(false);
  const [showAllAuctions, setShowAllAuctions] = useState(false);
  const [isRestoringAuction, setIsRestoringAuction] = useState(false);
  const [auctionCountByScope, setAuctionCountByScope] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { selectedPurchaserId, isLoading: contextLoading } = useBuyerCompanyContext();
  // Scope-keyed count avoids flash-of-stale-count when switching purchasers:
  // the value is read by current scope key, so a switch instantly shows 0
  // (or the cached count for that scope) even before the fetch resolves.
  const scopeKey = `${user?.id ?? 'anon'}:${selectedPurchaserId ?? 'self'}`;
  const auctionCount = contextLoading ? 0 : (auctionCountByScope[scopeKey] ?? 0);

  const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    updater(next);
    setSearchParams(next, { replace: true });
  };

  // Fetch auction count only after purchaser context resolves; otherwise a
  // manager briefly fetches with null selection and paints the default/self
  // scope before the intended purchaser scope lands.
  useEffect(() => {
    if (!user || isSupplier || contextLoading) return;
    const key = scopeKey;
    let cancelled = false;
    (async () => {
      try {
        const { fetchScopedAuctions } = await import('@/hooks/useScopedAuctions');
        const data = await fetchScopedAuctions({
          p_user_id: user.id,
          p_selected_purchaser: selectedPurchaserId,
        });
        if (cancelled) return;
        setAuctionCountByScope((prev) => ({ ...prev, [key]: (data || []).length }));
      } catch (error: any) {
        console.warn('[ReverseAuctionDashboard] auction count RPC error:', error);
        if (!cancelled) setAuctionCountByScope((prev) => ({ ...prev, [key]: 0 }));
      }
    })();
    return () => { cancelled = true; };
  }, [user, isSupplier, selectedPurchaserId, scopeKey, contextLoading]);

  // Scope boundary hardening: selected auction must never survive an acting purchaser switch.
  useEffect(() => {
    if (isSupplier) return;
    setSelectedAuction(null);
    setIsRestoringAuction(false);
    updateSearchParams((params) => {
      params.delete('auction');
    });
  }, [selectedPurchaserId, isSupplier]);

  // Persist selected auction ID in URL
  const selectAuction = (auction: ReverseAuction | null) => {
    setSelectedAuction(auction);
    updateSearchParams((params) => {
      if (auction) {
        params.set('auction', auction.id);
        params.delete('auctionView');
      } else {
        params.delete('auction');
      }
    });
  };

  // URL-based sub-view for supplier network & purchase orders
  useEffect(() => {
    const auctionView = searchParams.get('auctionView');
    setShowSupplierNetwork(auctionView === 'supplier-network');
    setShowPurchaseOrders(auctionView === 'purchase-orders');
    setShowExecutionTracking(auctionView === 'execution-tracking');
    setShowAuctionCredits(auctionView === 'auction-credits');
  }, [searchParams]);

  const setAuctionView = (view: string | null) => {
    updateSearchParams((params) => {
      if (view) {
        params.set('auctionView', view);
      } else {
        params.delete('auctionView');
      }
    });
  };

  // Restore selected auction only if it belongs to the current scoped purchaser context.
  useEffect(() => {
    const auctionId = searchParams.get('auction');
    if (!auctionId || selectedAuction || !user) return;

    const restoreAuction = async () => {
      setIsRestoringAuction(true);
      try {
        if (isSupplier) {
          const { data, error } = await supabase
            .from('reverse_auctions')
            .select('*')
            .eq('id', auctionId)
            .single();

          if (data && !error) {
            setSelectedAuction(data as unknown as ReverseAuction);
            return;
          }
        } else {
          const { data, error } = await (supabase as any).rpc('get_scoped_auctions_by_purchaser', {
            p_user_id: user.id,
            p_selected_purchaser: selectedPurchaserId,
            p_limit: 200,
            p_offset: 0,
          });

          if (!error) {
            const scopedAuction = ((data || []) as ReverseAuction[]).find((auction) => auction.id === auctionId);
            if (scopedAuction) {
              setSelectedAuction(scopedAuction);
              return;
            }
          }
        }

        updateSearchParams((params) => {
          params.delete('auction');
        });
      } finally {
        setIsRestoringAuction(false);
      }
    };

    void restoreAuction();
  }, [searchParams, selectedAuction, user, isSupplier, selectedPurchaserId]);

  if (isRestoringAuction) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading auction...
      </div>
    );
  }

  if (selectedAuction) {
    return (
      <LiveAuctionView
        auction={selectedAuction}
        onBack={() => selectAuction(null)}
        isSupplier={isSupplier}
      />
    );
  }

  if (showWarRoom && !isSupplier) {
    return (
      <AuctionWarRoom
        onBack={() => setShowWarRoom(false)}
        onSelectAuction={(auction) => {
          setShowWarRoom(false);
          selectAuction(auction);
        }}
      />
    );
  }

  if (showSupplierNetwork && !isSupplier && user) {
    return (
      <SupplierNetworkPage
        userId={user.id}
        onBack={() => setAuctionView(null)}
      />
    );
  }

  if (showPurchaseOrders && !isSupplier && user) {
    return (
      <PurchaseOrdersPage
        userId={user.id}
        onBack={() => setAuctionView(null)}
      />
    );
  }

  if (showExecutionTracking && !isSupplier && user) {
    return (
      <ExecutionTrackingPage
        userId={user.id}
        onBack={() => setAuctionView(null)}
      />
    );
  }

  if (showAuctionCredits && !isSupplier && user) {
    return (
      <AuctionCreditsPage
        userId={user.id}
        onBack={() => setAuctionView(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with lock-in positioning */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gavel className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{DASHBOARD_LOCKIN_COPY.title}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {DASHBOARD_LOCKIN_COPY.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isSupplier && (
            <Button variant="outline" onClick={() => setShowWarRoom(true)} className="gap-2">
              <Target className="w-4 h-4" />
              War Room
            </Button>
          )}
          {!isSupplier && (
            <Button onClick={() => navigate('/buyer/create-reverse-auction')} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Create Global Auction
            </Button>
          )}
        </div>
      </div>

      {/* Usage Progress Meter (buyer only) */}
      {!isSupplier && <UsageProgressMeter auctionCount={auctionCount} />}

      {/* Quick Access Cards (buyer only) */}
      {!isSupplier && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card
            variant="interactive"
            className="p-4 group hover:shadow-md transition-all border-l-4 border-l-violet-500 cursor-pointer"
            onClick={() => setAuctionView('supplier-network')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Supplier Network</p>
                <p className="text-[11px] text-muted-foreground">Add & manage your supplier base</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-violet-500 transition-colors" />
            </div>
          </Card>
          <Card
            variant="interactive"
            className="p-4 group hover:shadow-md transition-all border-l-4 border-l-amber-500 cursor-pointer"
            onClick={() => setAuctionView('purchase-orders')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Purchase Orders</p>
                <p className="text-[11px] text-muted-foreground">Track & manage purchase records</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-amber-500 transition-colors" />
            </div>
          </Card>
          <Card
            variant="interactive"
            className="p-4 group hover:shadow-md transition-all border-l-4 border-l-emerald-500 cursor-pointer"
            onClick={() => setAuctionView('execution-tracking')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Execution Tracking</p>
                <p className="text-[11px] text-muted-foreground">Award to delivery pipeline</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-emerald-500 transition-colors" />
            </div>
          </Card>
          <Card
            variant="interactive"
            className="p-4 group hover:shadow-md transition-all border-l-4 border-l-blue-500 cursor-pointer"
            onClick={() => setAuctionView('auction-credits')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Auction Credits</p>
                <p className="text-[11px] text-muted-foreground">Free credits & buy packs</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-blue-500 transition-colors" />
            </div>
          </Card>
        </div>
      )}

      {/* Procol-style Dashboard Modules (buyer only) */}
      {!isSupplier && <AuctionDashboardModules onSelectAuction={selectAuction} />}

      {/* Monthly Savings Analytics (buyer only) */}
      {!isSupplier && <MonthlySavingsAnalytics />}

      {/* All Auctions — collapsed module card (buyer only). Click expands list. */}
      {!isSupplier ? (
        showAllAuctions ? (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuctionView(null)}
              className="gap-2 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <ReverseAuctionList
              onSelectAuction={selectAuction}
              isBuyer={!isSupplier}
              isSupplier={isSupplier}
            />
          </div>
        ) : (
          <Card
            variant="interactive"
            className="p-4 group hover:shadow-md transition-all border-l-4 border-l-rose-500 cursor-pointer"
            onClick={() => setAuctionView('all-auctions')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-sm">
                <ListOrdered className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">All Auctions</p>
                <p className="text-[11px] text-muted-foreground">
                  {auctionCount > 0 ? `${auctionCount} auction${auctionCount === 1 ? '' : 's'} • view & manage` : 'View & manage all auctions'}
                </p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-rose-500 transition-colors" />
            </div>
          </Card>
        )
      ) : (
        <ReverseAuctionList
          onSelectAuction={selectAuction}
          isBuyer={!isSupplier}
          isSupplier={isSupplier}
        />
      )}
    </div>
  );
}