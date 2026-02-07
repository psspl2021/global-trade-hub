/**
 * ============================================================
 * MANAGEMENT EXECUTIVE DASHBOARD (/management)
 * ============================================================
 * 
 * ROLES: cfo, ceo, manager
 * THEME: DARK / EXECUTIVE
 * 
 * SHOWS ONLY:
 * - Total AI-Verified Savings (ORG LEVEL)
 * - Category-wise & purchaser-wise savings
 * - Incentive Declaration Panel (CFO/CEO only)
 * - Platform Governance Fee (0.5% / 2%)
 * - ROI Ratio
 * - Compliance & Legal Armor
 * 
 * HEADER COPY (LOCKED):
 * "We convert procurement ethics into measurable performance."
 * 
 * HIDES COMPLETELY:
 * - RFQ creation
 * - Manual buyer execution UI
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Gift,
  LogOut, 
  Loader2,
  Shield,
  BarChart3,
  Building2,
  Calculator,
  Briefcase
} from 'lucide-react';
import { AccessDenied } from '@/components/purchaser';
import { GovernanceLegalArmor } from '@/components/governance';
import { CFOIncentiveManagement } from '@/components/purchaser/CFOIncentiveManagement';
import { SavingsSourceOfTruth } from '@/components/governance/SavingsSourceOfTruth';
import { NotificationBell } from '@/components/NotificationBell';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

interface OrgMetrics {
  totalAISavings: number;
  platformFee: number;
  roiRatio: number;
  activePurchasers: number;
  totalDeals: number;
}

export default function ManagementExecutiveDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { primaryRole, canEditIncentives, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<OrgMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch org-level metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch from accepted bids for savings calculation
        const { data: bidsData } = await supabase
          .from('bids')
          .select('markup_amount, service_fee')
          .eq('status', 'accepted');

        // Get purchaser count
        const { count: purchaserCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .in('business_type', ['buyer', 'purchaser', 'enterprise']);

        // Get active RFQs count
        const { count: activeRfqs } = await supabase
          .from('requirements')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active');

        const totalSavings = bidsData?.reduce((sum, b) => sum + (b.markup_amount || 0), 0) || 0;
        const totalFee = bidsData?.reduce((sum, b) => sum + (b.service_fee || 0), 0) || 0;

        setMetrics({
          totalAISavings: totalSavings,
          platformFee: totalFee,
          roiRatio: totalFee > 0 ? totalSavings / totalFee : 0,
          activePurchasers: purchaserCount || 0,
          totalDeals: activeRfqs || 0,
        });
      } catch (err) {
        console.error('[ManagementDashboard] Metrics error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!accessLoading) {
      fetchMetrics();
    }
  }, [user?.id, accessLoading]);

  // Role-based redirects
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (!accessLoading && primaryRole) {
      // Purchaser/buyer roles (including buyer_purchaser) → /dashboard
      if (['purchaser', 'buyer_purchaser', 'buyer'].includes(primaryRole)) {
        navigate('/dashboard');
        return;
      }
      // ps_admin → /admin
      if (primaryRole === 'ps_admin' || primaryRole === 'admin') {
        navigate('/admin');
        return;
      }
    }
  }, [authLoading, accessLoading, user, primaryRole, navigate]);

  // HARD 404 for supplier/external_guest
  if (!accessLoading && isAccessDenied) {
    return <AccessDenied variant="404" />;
  }

  if (authLoading || accessLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Only allow cfo, ceo, manager roles (including buyer variants)
  if (!['cfo', 'buyer_cfo', 'ceo', 'buyer_ceo', 'manager', 'buyer_manager'].includes(primaryRole)) {
    return <AccessDenied variant="404" />;
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header - Dark Executive Theme */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi" 
              className="h-12 sm:h-14 w-auto brightness-0 invert"
            />
          </Link>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-slate-700 text-slate-200 border-slate-600">
              <Briefcase className="w-3 h-3 mr-1" />
              {primaryRole.toUpperCase()}
            </Badge>
            <NotificationBell />
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
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

      {/* Positioning Banner (LOCKED) */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-3 px-4">
        <div className="container mx-auto text-center">
          <p className="text-lg font-semibold text-white">
            "We convert procurement ethics into measurable performance."
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total AI-Verified Savings</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {formatCurrency(metrics?.totalAISavings || 0)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-emerald-500 opacity-50" />
              </div>
              <p className="text-xs text-slate-500 mt-2">Org-level cumulative</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Platform Governance Fee</p>
                  <p className="text-3xl font-bold text-amber-400">
                    {formatCurrency(metrics?.platformFee || 0)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-amber-500 opacity-50" />
              </div>
              <p className="text-xs text-slate-500 mt-2">0.5% - 2% of GMV</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">ROI Ratio</p>
                  <p className="text-3xl font-bold text-sky-400">
                    {(metrics?.roiRatio || 0).toFixed(1)}x
                  </p>
                </div>
                <Calculator className="w-10 h-10 text-sky-500 opacity-50" />
              </div>
              <p className="text-xs text-slate-500 mt-2">Savings ÷ Platform Fee</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Purchasers</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {metrics?.activePurchasers || 0}
                  </p>
                </div>
                <Users className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
              <p className="text-xs text-slate-500 mt-2">Registered in platform</p>
            </CardContent>
          </Card>
        </div>

        {/* Governance Fee Notice */}
        <GovernanceLegalArmor variant="billing" className="bg-slate-800/50 border-slate-700" />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300">
              <BarChart3 className="w-4 h-4 mr-2" />
              Savings Overview
            </TabsTrigger>
            {canEditIncentives && (
              <TabsTrigger value="incentives" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300">
                <Gift className="w-4 h-4 mr-2" />
                Incentive Management
              </TabsTrigger>
            )}
            <TabsTrigger value="compliance" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300">
              <Shield className="w-4 h-4 mr-2" />
              Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-500" />
                  Organisation Savings (Source of Truth)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  AI-verified savings by category and purchaser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SavingsSourceOfTruth />
              </CardContent>
            </Card>
          </TabsContent>

          {canEditIncentives && (
            <TabsContent value="incentives" className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    Incentive Declaration Panel
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    CFO/CEO: Declare, fund, and approve purchaser incentives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GovernanceLegalArmor variant="incentive" className="mb-4" />
                  <CFOIncentiveManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="compliance" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-sky-500" />
                  Compliance & Legal Armor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <GovernanceLegalArmor variant="footer" className="bg-slate-700/50 border-slate-600" />
                <GovernanceLegalArmor variant="billing" className="bg-slate-700/50 border-slate-600" />
                <GovernanceLegalArmor variant="incentive" className="!bg-amber-950/50 !border-amber-800" />
                <GovernanceLegalArmor variant="positioning" className="!bg-emerald-950/50 !border-emerald-800 !text-emerald-300" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Legal Footer */}
        <GovernanceLegalArmor variant="footer" className="bg-slate-800/50 border-slate-700" />
      </main>
    </div>
  );
}
