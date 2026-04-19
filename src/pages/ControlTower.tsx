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
import { useUserScope } from '@/hooks/useUserScope';
import { ControlTowerExecutive } from '@/components/ai-enforcement';
import { AdminControlTower } from '@/components/admin/AdminControlTower';
import { AccessDenied } from '@/components/purchaser/AccessDenied';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/landing/Footer';

// Admin identity is a top-level persona (not a company-governance role) and
// remains a primaryRole check. Executive vs purchaser scope, however, is
// driven entirely by get_user_scope() — no role-string arrays.
const ADMIN_ROLES = ['ps_admin', 'admin'];

export function ControlTowerPage() {
  const {
    canViewControlTower,
    primaryRole,
    isLoading,
    isAccessDenied
  } = useGovernanceAccess();
  const { isExecutive, isManagement, loading: scopeLoading } = useUserScope();

  // STEP 1: Loading guard — never render 404 until role + scope are resolved
  if (isLoading || scopeLoading) {
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

  // STEP 3: Rendering mode — admin persona OR executive/management scope.
  const isAdmin = ADMIN_ROLES.includes(primaryRole);
  const showExecutive = isExecutive || isManagement;

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="container mx-auto max-w-7xl">
        {isAdmin ? (
          <AdminControlTower />
        ) : showExecutive ? (
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
