/**
 * Reverse Auction Dashboard — Full page view matching enterprise layout
 * Header + Credits + Pricing Plans + War Room + Auction List
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
import { ReverseAuction } from '@/hooks/useReverseAuction';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Gavel, Sparkles, Target, Loader2 } from 'lucide-react';

interface ReverseAuctionDashboardProps {
  isSupplier?: boolean;
}

export function ReverseAuctionDashboard({ isSupplier = false }: ReverseAuctionDashboardProps) {
  const [selectedAuction, setSelectedAuction] = useState<ReverseAuction | null>(null);
  const [creditsKey, setCreditsKey] = useState(0);
  const [showWarRoom, setShowWarRoom] = useState(false);
  const [isRestoringAuction, setIsRestoringAuction] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Persist selected auction ID in URL
  const selectAuction = (auction: ReverseAuction | null) => {
    setSelectedAuction(auction);
    if (auction) {
      searchParams.set('auction', auction.id);
    } else {
      searchParams.delete('auction');
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
            // Invalid auction ID — clean up URL
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
