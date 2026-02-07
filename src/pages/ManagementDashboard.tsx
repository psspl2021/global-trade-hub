/**
 * ============================================================
 * MANAGEMENT DASHBOARD PAGE
 * ============================================================
 * 
 * CFO/CEO/Manager access to governance features.
 * RULE 9: Suppliers and external_guests see HARD 404.
 */

import { ManagementDashboard } from '@/components/governance';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { AccessDenied } from '@/components/purchaser/AccessDenied';
import { Card, CardContent } from '@/components/ui/card';

export default function ManagementDashboardPage() {
  const { canViewManagementDashboard, isLoading, isAccessDenied } = useGovernanceAccess();

  // RULE 9: Show HARD 404 for supplier/external_guest - NO UI LEAKAGE
  if (!isLoading && (isAccessDenied || !canViewManagementDashboard)) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <AccessDenied variant="404" />
        </div>
      </main>
    );
  }

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

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
        <ManagementDashboard />
      </div>
    </div>
  );
}
