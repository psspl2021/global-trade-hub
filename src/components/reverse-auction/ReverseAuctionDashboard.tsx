/**
 * Reverse Auction Dashboard — Entry point for buyer/supplier reverse auction management
 * Now with analytics summary cards
 */
import { useState } from 'react';
import { ReverseAuctionList } from './ReverseAuctionList';
import { LiveAuctionView } from './LiveAuctionView';
import { AuctionAnalyticsCards } from './AuctionAnalyticsCards';
import { ReverseAuction, useReverseAuction } from '@/hooks/useReverseAuction';

interface ReverseAuctionDashboardProps {
  isSupplier?: boolean;
}

export function ReverseAuctionDashboard({ isSupplier = false }: ReverseAuctionDashboardProps) {
  const [selectedAuction, setSelectedAuction] = useState<ReverseAuction | null>(null);
  const { analytics } = useReverseAuction(isSupplier);

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
    <div className="space-y-4">
      {/* Analytics Summary Cards */}
      <AuctionAnalyticsCards
        totalAuctions={analytics.totalAuctions}
        liveCount={analytics.liveCount}
        completedCount={analytics.completedCount}
        totalSavings={analytics.totalSavings}
        avgBidReduction={analytics.avgBidReduction}
      />

      <ReverseAuctionList
        onSelectAuction={setSelectedAuction}
        isBuyer={!isSupplier}
        isSupplier={isSupplier}
      />
    </div>
  );
}
