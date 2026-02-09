/**
 * ============================================================
 * PURCHASER DASHBOARD PAGE
 * ============================================================
 * 
 * Purchaser/Buyer access to performance center.
 * RULE 9: Suppliers and external_guests see HARD 404.
 */

import { PurchaserDashboard } from '@/components/purchaser';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { AccessDenied } from '@/components/purchaser/AccessDenied';
import { Card, CardContent } from '@/components/ui/card';

export default function PurchaserDashboardPage() {
  const { canViewPurchaserDashboard, isLoading, isAccessDenied } = useGovernanceAccess();

  // STEP 1: Loading guard — never render 404 until role is resolved
  if (isLoading) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // STEP 2: Only after loading, check access
  if (isAccessDenied || !canViewPurchaserDashboard) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <AccessDenied variant="404" />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
        <PurchaserDashboard />
      </div>
    </div>
  );
}
