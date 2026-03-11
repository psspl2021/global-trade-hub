/**
 * Reverse Auction Dashboard — Entry point for buyer reverse auction management
 */
import { useState } from 'react';
import { ReverseAuctionList } from './ReverseAuctionList';
import { LiveAuctionView } from './LiveAuctionView';
import { ReverseAuction } from '@/hooks/useReverseAuction';

interface ReverseAuctionDashboardProps {
  isSupplier?: boolean;
}

export function ReverseAuctionDashboard({ isSupplier = false }: ReverseAuctionDashboardProps) {
  const [selectedAuction, setSelectedAuction] = useState<ReverseAuction | null>(null);

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
    <ReverseAuctionList
      onSelectAuction={setSelectedAuction}
      isBuyer={!isSupplier}
    />
  );
}
