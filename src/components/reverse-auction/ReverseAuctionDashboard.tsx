/**
 * Reverse Auction Dashboard — Full page view matching enterprise layout
 * Header + Credits + Pricing Plans + Auction List
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReverseAuctionList } from './ReverseAuctionList';
import { LiveAuctionView } from './LiveAuctionView';
import { AuctionCreditsPurchase } from './AuctionCreditsPurchase';
import { ReverseAuction } from '@/hooks/useReverseAuction';
import { Button } from '@/components/ui/button';
import { Gavel, Sparkles } from 'lucide-react';

interface ReverseAuctionDashboardProps {
  isSupplier?: boolean;
}

export function ReverseAuctionDashboard({ isSupplier = false }: ReverseAuctionDashboardProps) {
  const [selectedAuction, setSelectedAuction] = useState<ReverseAuction | null>(null);
  const [creditsKey, setCreditsKey] = useState(0);
  const navigate = useNavigate();

  if (selectedAuction) {
    return (
      <LiveAuctionView
        auction={selectedAuction}
        onBack={() => setSelectedAuction(null)}
        isSupplier={isSupplier}
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
        {!isSupplier && (
          <Button onClick={() => navigate('/create-reverse-auction')} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Create Reverse Auction
          </Button>
        )}
      </div>

      {/* Credits + Pricing Plans (buyer only) */}
      {!isSupplier && (
        <AuctionCreditsPurchase
          key={creditsKey}
          onCreditsUpdated={() => setCreditsKey(k => k + 1)}
        />
      )}

      {/* Auction List */}
      <ReverseAuctionList
        onSelectAuction={setSelectedAuction}
        isBuyer={!isSupplier}
        isSupplier={isSupplier}
      />
    </div>
  );
}
