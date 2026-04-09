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
import { AuctionCreditsPurchase } from './AuctionCreditsPurchase';
import { MonthlySavingsAnalytics } from './MonthlySavingsAnalytics';
import { AuctionWarRoom } from './AuctionWarRoom';
import { SupplierNetworkPage } from '@/components/supplier-network/SupplierNetworkPage';
import { PurchaseOrdersPage } from '@/components/purchase-orders/PurchaseOrdersPage';
import { ReverseAuction } from '@/hooks/useReverseAuction';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gavel, Sparkles, Target, Loader2, Users, ArrowLeft, ShoppingCart } from 'lucide-react';

interface ReverseAuctionDashboardProps {
  isSupplier?: boolean;
}

export function ReverseAuctionDashboard({ isSupplier = false }: ReverseAuctionDashboardProps) {
  const [selectedAuction, setSelectedAuction] = useState<ReverseAuction | null>(null);
  const [creditsKey, setCreditsKey] = useState(0);
  const [showWarRoom, setShowWarRoom] = useState(false);
  const [showSupplierNetwork, setShowSupplierNetwork] = useState(false);
  const [showPurchaseOrders, setShowPurchaseOrders] = useState(false);
  const [isRestoringAuction, setIsRestoringAuction] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Persist selected auction ID in URL
  const selectAuction = (auction: ReverseAuction | null) => {
    setSelectedAuction(auction);
    if (auction) {
      searchParams.set('auction', auction.id);
      searchParams.delete('auctionView');
    } else {
      searchParams.delete('auction');
    }
    setSearchParams(searchParams, { replace: true });
  };

  // URL-based sub-view for supplier network & purchase orders
  useEffect(() => {
    const auctionView = searchParams.get('auctionView');
    setShowSupplierNetwork(auctionView === 'supplier-network');
    setShowPurchaseOrders(auctionView === 'purchase-orders');
  }, [searchParams]);

  const setAuctionView = (view: string | null) => {
    if (view) {
      searchParams.set('auctionView', view);
    } else {
      searchParams.delete('auctionView');
    }
    setSearchParams(searchParams, { replace: true });
  };

  // Restore selected auction from URL on mount
  useEffect(() => {
    const auctionId = searchParams.get('auction');
    if (auctionId && !selectedAuction) {
      setIsRestoringAuction(true);
      supabase
        .from('reverse_auctions')
        .select('*')
        .eq('id', auctionId)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setSelectedAuction(data as unknown as ReverseAuction);
          } else {
            searchParams.delete('auction');
            setSearchParams(searchParams, { replace: true });
          }
          setIsRestoringAuction(false);
        });
    }
  }, []); // Only on mount

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gavel className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Reverse Auctions</h2>
            <p className="text-sm text-muted-foreground">Price discovery through competitive reverse bidding</p>
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
              Create Reverse Auction
            </Button>
          )}
        </div>
      </div>

      {/* Quick Access Cards (buyer only) */}
      {!isSupplier && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>
      )}

      {/* Procol-style Dashboard Modules (buyer only) */}
      {!isSupplier && <AuctionDashboardModules onSelectAuction={selectAuction} />}

      {/* Credits + Pricing Plans (buyer only) */}
      {!isSupplier && (
        <AuctionCreditsPurchase
          key={creditsKey}
          onCreditsUpdated={() => setCreditsKey(k => k + 1)}
        />
      )}

      {/* Monthly Savings Analytics (buyer only) */}
      {!isSupplier && <MonthlySavingsAnalytics />}

      {/* Auction List */}
      <ReverseAuctionList
        onSelectAuction={selectAuction}
        isBuyer={!isSupplier}
        isSupplier={isSupplier}
      />
    </div>
  );
}