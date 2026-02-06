/**
 * ============================================================
 * PURCHASER DASHBOARD PAGE
 * ============================================================
 * 
 * Purchaser/Buyer access to performance center.
 * READ-ONLY for purchasers.
 */

import { PurchaserDashboard } from '@/components/purchaser';

export default function PurchaserDashboardPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
        <PurchaserDashboard />
      </div>
    </div>
  );
}
