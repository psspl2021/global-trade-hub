/**
 * ============================================================
 * CONTROL TOWER PAGE
 * ============================================================
 * 
 * Role-based Control Tower rendering:
 * - admin / ps_admin → Full operational AdminControlTower
 * - cfo / ceo / manager → Executive KPIs only
 * - All others → HARD 404 after role resolution
 */

import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { ControlTowerExecutive } from '@/components/ai-enforcement';
import { AdminControlTower } from '@/components/admin/AdminControlTower';
import { AccessDenied } from '@/components/purchaser/AccessDenied';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/landing/Footer';

const ADMIN_ROLES = ['ps_admin', 'admin'];
const EXECUTIVE_ROLES = ['cfo', 'buyer_cfo', 'ceo', 'buyer_ceo', 'manager', 'buyer_manager'];

export function ControlTowerPage() {
  const { 
    canViewControlTower, 
    primaryRole, 
    isLoading, 
    isAccessDenied 
  } = useGovernanceAccess();

  // STEP 1: Loading guard — never render 404 until role is resolved
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

  // STEP 2: Only after loading, check access
  if (isAccessDenied || !canViewControlTower) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <AccessDenied variant="404" />
        </div>
      </main>
    );
  }

  // STEP 3: Role-based rendering — single route, two modes
  const isAdmin = ADMIN_ROLES.includes(primaryRole);
  const isExecutive = EXECUTIVE_ROLES.includes(primaryRole);

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="container mx-auto max-w-7xl">
        {isAdmin ? (
          <AdminControlTower />
        ) : isExecutive ? (
          <ControlTowerExecutive />
        ) : (
          <AccessDenied variant="404" />
        )}
      </div>
      <Footer />
    </main>
  );
}

export default ControlTowerPage;
