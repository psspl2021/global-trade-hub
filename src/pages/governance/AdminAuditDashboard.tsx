/**
 * ============================================================
 * ADMIN AUDIT DASHBOARD (/admin)
 * ============================================================
 * 
 * ROLE: ps_admin, admin
 * 
 * RESTORED OLD BEHAVIOR:
 * - Control Tower is the PRIMARY and DEFAULT admin view
 * - All admin capabilities live INSIDE the Control Tower
 * - NO tile-based launcher dashboard
 * - Admin lands directly on Control Tower interface
 */

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  LogOut, 
  Loader2,
  Lock
} from 'lucide-react';
import { AccessDenied } from '@/components/purchaser';
import { ControlTowerExecutive } from '@/components/ai-enforcement/ControlTowerExecutive';
import { NotificationBell } from '@/components/NotificationBell';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

export default function AdminAuditDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { primaryRole, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();

  // Role-based redirects
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (!accessLoading && primaryRole) {
      // Purchaser/buyer roles → /dashboard
      if (['purchaser', 'buyer', 'buyer_purchaser'].includes(primaryRole)) {
        navigate('/dashboard');
        return;
      }
      // Management roles → /management
      if (['cfo', 'ceo', 'manager', 'buyer_cfo', 'buyer_ceo', 'buyer_manager'].includes(primaryRole)) {
        navigate('/management');
        return;
      }
    }
  }, [authLoading, accessLoading, user, primaryRole, navigate]);

  // HARD 404 for supplier/external_guest
  if (!accessLoading && isAccessDenied) {
    return <AccessDenied variant="404" />;
  }

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only allow ps_admin and admin roles
  if (!['ps_admin', 'admin'].includes(primaryRole)) {
    return <AccessDenied variant="404" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header - Dark Control Tower Theme */}
      <header className="border-b border-slate-700 bg-slate-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi" 
              className="h-12 sm:h-14 w-auto"
            />
          </Link>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-600 text-white border-0">
              <Shield className="w-3 h-3 mr-1" />
              CONTROL TOWER
            </Badge>
            <NotificationBell />
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* READ-ONLY Banner */}
      <div className="bg-slate-800 border-b border-slate-700 py-2 px-4">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-medium text-slate-300">
            ProcureSaathi Control Tower — Global Governance & AI Analytics
          </p>
        </div>
      </div>

      {/* DIRECT Control Tower View - NO TABS, NO TILES */}
      <main className="container mx-auto px-4 py-6">
        <ControlTowerExecutive />
      </main>
    </div>
  );
}
