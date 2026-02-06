/**
 * ============================================================
 * CONTROL TOWER PAGE
 * ============================================================
 * 
 * Executive Command Mode for Control Tower
 * RULE 9: Only accessible by cfo, ceo, manager, ps_admin, admin
 */

import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { ControlTowerExecutive } from '@/components/ai-enforcement';
import { AccessDenied } from '@/components/purchaser/AccessDenied';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/landing/Footer';

export function ControlTowerPage() {
  const { 
    canViewManagementDashboard, 
    primaryRole, 
    isLoading, 
    isAccessDenied 
  } = useGovernanceAccess();

  // RULE 9: Show 404 for supplier/external_guest
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
              Loading Control Tower...
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <ControlTowerExecutive />
      </div>
      <Footer />
    </main>
  );
}

export default ControlTowerPage;
