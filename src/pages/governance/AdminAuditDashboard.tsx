/**
 * ============================================================
 * ADMIN AUDIT DASHBOARD (/admin)
 * ============================================================
 * 
 * ROLE: ps_admin, admin
 * THEME: NEUTRAL / AUDIT
 * 
 * SHOWS ONLY (READ-ONLY):
 * - Control Tower (4 KPIs max)
 * - AI Selection Engine (immutable)
 * - Audit Logs
 * - Demand Intelligence
 * 
 * NO EDIT PERMISSIONS on:
 * - Buyer incentives
 * - Savings numbers
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Eye,
  LogOut, 
  Loader2,
  Activity,
  Bot,
  FileSearch,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { AccessDenied } from '@/components/purchaser';
import { GovernanceLegalArmor } from '@/components/governance';
import { AdminKillSwitch } from '@/components/governance';
import { AdminIncentiveAudit } from '@/components/purchaser';
import { ControlTowerExecutive } from '@/components/ai-enforcement/ControlTowerExecutive';
import { NotificationBell } from '@/components/NotificationBell';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

export default function AdminAuditDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { primaryRole, canToggleRewards, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();
  const [activeTab, setActiveTab] = useState('control-tower');

  // Role-based redirects
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (!accessLoading && primaryRole) {
      // Purchaser/buyer roles → /dashboard
      if (['purchaser', 'buyer'].includes(primaryRole)) {
        navigate('/dashboard');
        return;
      }
      // Management roles → /management
      if (['cfo', 'ceo', 'manager'].includes(primaryRole)) {
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
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      {/* Header - Neutral Audit Theme */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi" 
              className="h-12 sm:h-14 w-auto grayscale"
            />
          </Link>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-muted-foreground text-background">
              <Shield className="w-3 h-3 mr-1" />
              AUDIT MODE
            </Badge>
            <NotificationBell />
            <Button 
              variant="outline" 
              size="sm"
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
      <div className="bg-muted-foreground text-background py-2 px-4">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          <p className="text-sm font-medium">
            ProcureSaathi Global Audit Console — READ-ONLY Access
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Positioning */}
        <GovernanceLegalArmor variant="positioning" />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted border">
            <TabsTrigger value="control-tower" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
              <Activity className="w-4 h-4 mr-2" />
              Control Tower
            </TabsTrigger>
            <TabsTrigger value="ai-selection" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
              <Bot className="w-4 h-4 mr-2" />
              AI Selection
            </TabsTrigger>
            <TabsTrigger value="audit-logs" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
              <FileSearch className="w-4 h-4 mr-2" />
              Audit Logs
            </TabsTrigger>
            {canToggleRewards && (
              <TabsTrigger value="kill-switch" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Kill Switch
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="control-tower" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-muted-foreground" />
                      Control Tower (Executive Metrics)
                    </CardTitle>
                    <CardDescription>
                      4 Core KPIs — AI-Verified Savings, Revenue Protected, High-Risk RFQs, ROI Ratio
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    READ-ONLY
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ControlTowerExecutive />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-selection" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-muted-foreground" />
                      AI Selection Engine (Immutable)
                    </CardTitle>
                    <CardDescription>
                      Authoritative supplier rankings — cannot be overridden
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    AI-LOCKED
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">AI Selection Engine</p>
                  <p className="text-sm mt-1">
                    Select a specific RFQ from the Control Tower to view AI rankings
                  </p>
                  <p className="text-xs mt-4 max-w-md mx-auto">
                    AI rankings are immutable and final. Buyers can only Accept L1 or Escalate to Admin.
                    No manual override is permitted.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit-logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-muted-foreground" />
                    Incentive Audit Logs
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    READ-ONLY
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <AdminIncentiveAudit />
              </CardContent>
            </Card>
          </TabsContent>

          {canToggleRewards && (
            <TabsContent value="kill-switch" className="space-y-4">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Admin Kill Switch
                  </CardTitle>
                  <CardDescription>
                    Emergency controls for governance system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminKillSwitch />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Legal Footer */}
        <GovernanceLegalArmor variant="footer" />
      </main>
    </div>
  );
}
