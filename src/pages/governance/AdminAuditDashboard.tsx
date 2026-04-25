/**
 * ============================================================
 * ADMIN AUDIT DASHBOARD (/admin)
 * ============================================================
 * 
 * ROLE: ps_admin, admin
 * 
 * TILE-BASED ADMIN COMMAND LAUNCHER:
 * - Control Tower opens via button click
 * - All admin features shown as cards
 * - NO auto-redirect to Control Tower
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { useAdminRole, AdminDashboardRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  LogOut, 
  Loader2,
  BarChart3,
  Sparkles,
  TrendingUp,
  FileText,
  Truck,
  Users,
  ClipboardList,
  Gavel,
  Settings,
  Download,
  Mail,
  Gift,
  PenTool,
  IndianRupee,
  Car,
  Eye,
  RefreshCw,
  Globe,
  Monitor,
  Smartphone,
  Home,
  Zap,
  Rocket,
  BookOpen
} from 'lucide-react';
import { VisitorAnalyticsModal } from '@/components/admin/VisitorAnalyticsModal';
import { AccessDenied } from '@/components/purchaser';

import { NotificationBell } from '@/components/NotificationBell';
import { AdminUsersList } from '@/components/admin/AdminUsersList';
import { AdminRequirementsList } from '@/components/admin/AdminRequirementsList';
import { AdminBidsList } from '@/components/admin/AdminBidsList';
import { AdminLogisticsList } from '@/components/admin/AdminLogisticsList';
import { AdminL1AnalysisView } from '@/components/admin/AdminL1AnalysisView';
import { AdminDataExport } from '@/components/admin/AdminDataExport';

import AdminEmailTracking from '@/components/admin/AdminEmailTracking';
import { SupplierSelectionEngine } from '@/components/admin/SupplierSelectionEngine';
import { AdminReferralStats } from '@/components/admin/AdminReferralStats';
import { AdminInvoiceManagement } from '@/components/admin/AdminInvoiceManagement';
import { VehicleVerification } from '@/components/admin/VehicleVerification';
import { PartnerDocumentVerification } from '@/components/admin/PartnerDocumentVerification';
import { PremiumBidsManager } from '@/components/admin/PremiumBidsManager';
import { AdminDemandHeatmap } from '@/components/admin/AdminDemandHeatmap';
import { BenchmarkManager } from '@/components/admin/BenchmarkManager';
import AuctionTrackerCard from '@/components/admin/AuctionTrackerCard';
import { CreditLeadsSummaryCard } from '@/components/admin/CreditLeadsSummaryCard';
import { CreditLeadsCard } from '@/components/admin/CreditLeadsCard';
import { NudgeImpactPanel } from '@/components/admin/NudgeImpactPanel';
import RevenueDashboardView from '@/components/admin/RevenueDashboardView';
import { supabase } from '@/integrations/supabase/client';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

import { CEODashboard } from '@/components/admin/dashboards/CEODashboard';
import { OpsDashboard } from '@/components/admin/dashboards/OpsDashboard';
import { SalesDashboard } from '@/components/admin/dashboards/SalesDashboard';
import { RoleBadge } from '@/components/admin/dashboards/RoleBadge';
import { AdminRoleSwitch } from '@/components/admin/dashboards/AdminRoleSwitch';


const SEOCommandCenter = lazy(() => import('@/components/admin/SEOCommandCenter'));
const DemoGuidedFlow = lazy(() => import('@/components/demo/DemoGuidedFlow').then(m => ({ default: m.DemoGuidedFlow })));
const PlatformControlHub = lazy(() => import('@/components/admin/PlatformControlHub'));
const RevenueGrowthHub = lazy(() => import('@/components/admin/RevenueGrowthHub'));
const BidIntelligenceHub = lazy(() => import('@/components/admin/BidIntelligenceHub'));
const ContentStudioHub = lazy(() => import('@/components/admin/ContentStudioHub'));

type AdminView = 
  | 'dashboard' 
  | 'platform-control'
  | 'revenue-growth'
  | 'bid-intelligence'
  | 'content-studio'
  | 'demand-heatmap'
  | 'email-tracking'
  | 'benchmarks'
  | 'credit-leads'
  | 'nudge-impact'
  | 'seo-command'
  | 'demo';

export default function AdminAuditDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { primaryRole, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();
  
  const { dashboardRole } = useAdminRole(user?.id);
  const [roleOverride, setRoleOverride] = useState<AdminDashboardRole>(null);
  const activeRole = roleOverride || dashboardRole || 'admin';
  const isFullAdmin = dashboardRole === 'admin';
  
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  
  const [showUsers, setShowUsers] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [showBids, setShowBids] = useState(false);
  const [showL1Analysis, setShowL1Analysis] = useState(false);
  const [showLogistics, setShowLogistics] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [showPartnerDocs, setShowPartnerDocs] = useState(false);
  const [showPremiumBids, setShowPremiumBids] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSupplierSelection, setShowSupplierSelection] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);
  const [fullAnalytics, setFullAnalytics] = useState<any>(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRequirements: 0,
    pendingInvoices: 0,
    pendingInvoiceAmount: 0,
    totalCollected: 0,
    vehiclesPending: 0,
    partnerDocsPending: 0
  });
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    pageViews: 0,
    desktopPercent: 0,
    mobilePercent: 0,
    tabletPercent: 0,
    pagesPerVisit: 0,
    avgTimeSeconds: 0,
    topCountries: [] as Array<{ country: string; countryCode: string; visitors: number; percentage: number }>,
    topSources: [] as Array<{ source: string; count: number; percentage: number }>,
    lastUpdated: ''
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [userName, setUserName] = useState('Admin');

  const fetchStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_name, contact_person')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setUserName(profileData.contact_person || profileData.company_name || 'Admin');
      }

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const reqResult = await supabase
        .from('requirements')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      const reqCount = reqResult.count;

      const invoicesResult = await (supabase
        .from('platform_invoices') as any)
        .select('total_amount')
        .eq('status', 'pending');
      const invoicesData = invoicesResult.data || [];
      const pendingAmount = invoicesData.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

      const collectedResult = await (supabase
        .from('platform_invoices') as any)
        .select('total_amount')
        .eq('status', 'paid');
      const collectedData = collectedResult.data || [];
      const totalCollected = collectedData.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

      const vehiclesResult = await (supabase
        .from('vehicles') as any)
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'pending');
      const vehiclesCount = vehiclesResult.count || 0;

      const docsResult = await (supabase
        .from('partner_documents') as any)
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'pending');
      const docsCount = docsResult.count || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalRequirements: reqCount || 0,
        pendingInvoices: invoicesData?.length || 0,
        pendingInvoiceAmount: pendingAmount,
        totalCollected,
        vehiclesPending: vehiclesCount || 0,
        partnerDocsPending: docsCount || 0
      });

      const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('get-analytics', {
        body: { days: selectedDays }
      });

      if (!analyticsError && analyticsData) {
        setFullAnalytics(analyticsData);
        
        setVisitorStats({
          totalVisitors: analyticsData.totalVisitors || 0,
          pageViews: analyticsData.totalPageviews || 0,
          desktopPercent: analyticsData.deviceBreakdown?.desktop || 0,
          mobilePercent: analyticsData.deviceBreakdown?.mobile || 0,
          tabletPercent: analyticsData.deviceBreakdown?.tablet || 0,
          pagesPerVisit: analyticsData.pageviewsPerVisit || 0,
          avgTimeSeconds: analyticsData.avgTimeSpentSeconds || 0,
          topCountries: analyticsData.countryBreakdown || [],
          topSources: analyticsData.topSources || [],
          lastUpdated: new Date().toLocaleTimeString()
        });
      } else {
        setVisitorStats({
          totalVisitors: 0, pageViews: 0, desktopPercent: 0, mobilePercent: 0,
          tabletPercent: 0, pagesPerVisit: 0, avgTimeSeconds: 0,
          topCountries: [], topSources: [], lastUpdated: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStats();
  }, [user, selectedDays]);

  useEffect(() => {
    const handler = (e: Event) => {
      const view = (e as CustomEvent).detail as AdminView;
      if (view) setCurrentView(view);
    };
    window.addEventListener("open-admin-view", handler);
    return () => window.removeEventListener("open-admin-view", handler);
  }, []);

  useEffect(() => {
    if (!accessLoading) {
      console.log('[AdminAuditDashboard] Access check:', {
        primaryRole, isAccessDenied, authLoading, accessLoading, userId: user?.id
      });
    }
  }, [primaryRole, isAccessDenied, authLoading, accessLoading, user?.id]);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (!accessLoading && primaryRole) {
      if (['purchaser', 'buyer', 'buyer_purchaser'].includes(primaryRole)) { navigate('/dashboard'); return; }
      // Allow ceo, ops_manager, sales_manager to stay on /admin with role-based dashboards
      if (['manager', 'buyer_cfo', 'buyer_ceo', 'buyer_manager'].includes(primaryRole)) { navigate('/management'); return; }
    }
  }, [authLoading, accessLoading, user, primaryRole, navigate]);

  if (authLoading || accessLoading || !primaryRole || primaryRole === 'unknown') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (isAccessDenied || !['ps_admin', 'admin', 'ceo', 'ops_manager', 'sales_manager'].includes(primaryRole)) {
    // CEO role users get redirected to /management, so not included here
    console.warn('[AdminAuditDashboard] Access denied for role:', primaryRole);
    return <AccessDenied variant="404" />;
  }

  const renderView = () => {
    const lazyView = (node: React.ReactNode) => (
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto mt-12 text-muted-foreground" />}>
        {node}
      </Suspense>
    );
    switch (currentView) {
      case 'platform-control': return lazyView(<PlatformControlHub />);
      case 'revenue-growth': return lazyView(<RevenueGrowthHub />);
      case 'bid-intelligence': return lazyView(<BidIntelligenceHub />);
      case 'content-studio': return lazyView(<ContentStudioHub />);
      case 'demand-heatmap': return <AdminDemandHeatmap />;
      case 'email-tracking': return <AdminEmailTracking />;
      case 'benchmarks': return <BenchmarkManager />;
      case 'credit-leads': return <CreditLeadsCard />;
      case 'nudge-impact': return <NudgeImpactPanel />;
      case 'seo-command': return lazyView(<SEOCommandCenter />);
      case 'demo': return lazyView(<DemoGuidedFlow onReset={() => {}} onExit={() => setCurrentView('dashboard')} />);
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    // Role-based dashboard rendering
    if (activeRole === 'ceo') {
      return (
        <CEODashboard
          stats={stats}
          visitorStats={visitorStats}
          statsLoading={statsLoading}
          selectedDays={selectedDays}
          onSelectedDaysChange={setSelectedDays}
          onRefresh={fetchStats}
          onOpenView={(view) => setCurrentView(view as AdminView)}
          onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
          userName={userName}
        />
      );
    }

    if (activeRole === 'ops_manager') {
      return (
        <OpsDashboard
          stats={stats}
          onShowUsers={() => setShowUsers(true)}
          onShowRequirements={() => setShowRequirements(true)}
          onShowBids={() => setShowBids(true)}
          onShowL1Analysis={() => setShowL1Analysis(true)}
          onShowLogistics={() => setShowLogistics(true)}
          onShowVehicles={() => setShowVehicles(true)}
          onShowPartnerDocs={() => setShowPartnerDocs(true)}
          userName={userName}
        />
      );
    }

    if (activeRole === 'sales_manager') {
      return (
        <SalesDashboard
          visitorStats={visitorStats}
          statsLoading={statsLoading}
          selectedDays={selectedDays}
          onSelectedDaysChange={setSelectedDays}
          onRefresh={fetchStats}
          onOpenView={(view) => setCurrentView(view as AdminView)}
          onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
          onShowPremiumBids={() => setShowPremiumBids(true)}
          onShowReferrals={() => setShowReferrals(true)}
          userName={userName}
        />
      );
    }

    // Full admin dashboard (original)
    return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">ProcureSaathi Solutions Pvt Ltd • ADMIN</p>
      </div>

      {/* Row 1 — Primary Hubs (consolidated) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />Platform Control Hub
              <Badge className="bg-white/20 text-white text-xs">UNIFIED</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-300">Control Tower + Enterprise Center · analytics, spend, audit, ERP & governance.</p>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setCurrentView('platform-control')}>
              <Shield className="h-4 w-4 mr-2" />Open Platform Control
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-red-950 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />Revenue &amp; Growth Hub
              <Badge className="bg-white/20 text-white text-xs">UNIFIED</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-200">Sales pipeline + AI Sales Engine + Leads in one place.</p>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => setCurrentView('revenue-growth')}>
              <TrendingUp className="h-4 w-4 mr-2" />Open Revenue Hub
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — SEO + Content + Demand */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-950 to-violet-900 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />SEO Command Center
              <Badge className="bg-white/20 text-white text-xs">UNIFIED</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-indigo-200">Overview, performance, revenue attribution, intelligence & pipeline.</p>
            <Button className="w-full bg-white text-indigo-900 hover:bg-indigo-50" onClick={() => setCurrentView('seo-command')}>
              <Globe className="h-4 w-4 mr-2" />Open SEO Hub
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-900 to-fuchsia-900 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PenTool className="h-4 w-4" />Content Studio
              <Badge className="bg-white/20 text-white text-xs">UNIFIED</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-violet-200">AI Blog Generator + Pipeline + Manage in one studio.</p>
            <Button className="w-full bg-white text-violet-900 hover:bg-violet-50" onClick={() => setCurrentView('content-studio')}>
              <PenTool className="h-4 w-4 mr-2" />Open Content Studio
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-rose-500" />Demand Heatmap</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Global demand intelligence across 196 countries × 30 categories</p>
            <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white" onClick={() => setCurrentView('demand-heatmap')}><TrendingUp className="h-4 w-4 mr-2" />Open Heatmap</Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Bid Intelligence + Auction + Demo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-900 to-orange-900 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="h-4 w-4" />Bid Intelligence
              <Badge className="bg-white/20 text-white text-xs">UNIFIED</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-200">All bids + L1 analysis + AI selection engine.</p>
            <Button className="w-full bg-white text-amber-900 hover:bg-amber-50" onClick={() => setCurrentView('bid-intelligence')}>
              <Gavel className="h-4 w-4 mr-2" />Open Bid Hub
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4 w-4 text-primary" />Demo Mode
              <Badge variant="outline" className="text-xs">SALES</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Run guided procurement simulation for client calls</p>
            <Button variant="outline" className="w-full" onClick={() => setCurrentView('demo')}><Rocket className="h-4 w-4 mr-2" />Start Demo</Button>
          </CardContent>
        </Card>
        <AuctionTrackerCard />
      </div>

      {/* Row 4 — Analytics & Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-indigo-600" />Visitor Analytics
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={fetchStats} disabled={statsLoading}><RefreshCw className={`h-3 w-3 ${statsLoading ? 'animate-spin' : ''}`} /></Button>
              </CardTitle>
              <Select value={String(selectedDays)} onValueChange={(val) => setSelectedDays(Number(val))}>
                <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="15">Last 15 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last 365 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Updated: {visitorStats.lastUpdated}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {statsLoading ? (
              <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{visitorStats.totalVisitors.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Visitors</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{visitorStats.pageViews.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Page Views</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Monitor className="h-3 w-3" />{visitorStats.desktopPercent}%</span>
                  <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" />{visitorStats.mobilePercent}%</span>
                  <span>{visitorStats.pagesPerVisit} pages/visit</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1"><Globe className="h-3 w-3" />Top: {visitorStats.topCountries.slice(0, 2).map(c => `${c.country} (${c.percentage}%)`).join(', ') || 'No data'}</p>
                  <p>Top source: {visitorStats.topSources[0]?.source || 'No data'} ({visitorStats.topSources[0]?.percentage || 0}%)</p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowAnalyticsModal(true)}><BarChart3 className="h-4 w-4 mr-2" />View Detailed Analytics</Button>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-rose-500" />Pending Invoices</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-rose-500">{stats.pendingInvoices}</p>
            <p className="text-sm text-muted-foreground">₹{stats.pendingInvoiceAmount.toLocaleString()} pending · ₹{stats.totalCollected.toLocaleString()} collected</p>
            <Button className="w-full" onClick={() => setShowInvoices(true)}>Manage Invoices</Button>
          </CardContent>
        </Card>
        <CreditLeadsSummaryCard />
      </div>

      {/* Row 5 — Verification (kept separate; modal-based queues) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Car className="h-4 w-4 text-slate-600" />Vehicle Verification</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.vehiclesPending}</p>
            <p className="text-sm text-muted-foreground">Vehicles awaiting RC verification</p>
            <Button variant="outline" className="w-full" onClick={() => setShowVehicles(true)}>Verify Vehicles</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-slate-600" />Partner Documents</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.partnerDocsPending}</p>
            <p className="text-sm text-muted-foreground">Aadhar, PAN & Notary verification</p>
            <Button variant="outline" className="w-full" onClick={() => setShowPartnerDocs(true)}>Verify Documents</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-blue-500" />Logistics</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Vehicles, warehouses & requirements</p>
            <Button variant="outline" className="w-full" onClick={() => setShowLogistics(true)}><Eye className="h-4 w-4 mr-2" />View Logistics</Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 6 — Operations queues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />All Users</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
            <p className="text-sm text-muted-foreground">Buyers, Suppliers & Logistics Partners</p>
            <Button variant="outline" className="w-full" onClick={() => setShowUsers(true)}><Eye className="h-4 w-4 mr-2" />View All Users</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-slate-600" />Requirements</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.totalRequirements}</p>
            <p className="text-sm text-muted-foreground">Active requirements</p>
            <Button variant="outline" className="w-full" onClick={() => setShowRequirements(true)}><Eye className="h-4 w-4 mr-2" />View All Requirements</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-amber-500" />Premium Bids</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Manage premium bids for suppliers & transporters</p>
            <Button variant="outline" className="w-full" onClick={() => setShowPremiumBids(true)}><Sparkles className="h-4 w-4 mr-2" />Manage Premium Bids</Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 7 — Growth tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Gift className="h-4 w-4 text-rose-500" />Referral Program</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">View referral stats & top referrers leaderboard</p>
            <Button variant="outline" className="w-full" onClick={() => setShowReferrals(true)}><Eye className="h-4 w-4 mr-2" />View Referral Stats</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Zap className="h-4 w-4 text-yellow-500" />Nudge Intelligence</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Affiliate nudge performance, conversions & revenue impact</p>
            <Button variant="outline" className="w-full" onClick={() => setCurrentView('nudge-impact')}><Zap className="h-4 w-4 mr-2" />Open Nudge Panel</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><IndianRupee className="h-4 w-4 text-emerald-500" />Price Benchmarks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Set market benchmarks for savings visualization</p>
            <Button variant="outline" className="w-full" onClick={() => setCurrentView('benchmarks')}><IndianRupee className="h-4 w-4 mr-2" />Manage Benchmarks</Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 8 — Infrastructure */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-950 to-emerald-900 text-white border-0">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4" />FX Rates Console<Badge className="bg-white/20 text-white text-xs">Live</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-emerald-200">INR-anchored conversion rates · auto-updated daily 02:30 IST</p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/admin/fx-rates')}><Globe className="h-4 w-4 mr-2" />Open FX Console</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4 text-emerald-500" />Email Tracking</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Supplier email quotas, Brevo tracking & subscriptions</p>
            <Button variant="outline" className="w-full" onClick={() => setCurrentView('email-tracking')}><Mail className="h-4 w-4 mr-2" />Open Email Tracking</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Download className="h-4 w-4 text-slate-600" />Data Export</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Download signups, requirements, bids & transactions</p>
            <Button variant="outline" className="w-full" onClick={() => setShowDataExport(true)}>Export Data</Button>
          </CardContent>
        </Card>
      </div>

      {/* Admin dialogs are mounted globally below renderView() so all
          role-specific dashboards (Ops/Sales/CEO) can open them. */}
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-12 sm:h-14 w-auto" />
            </Link>
            {currentView !== 'dashboard' && (
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('dashboard')}>← Back to Dashboard</Button>
            )}
          </div>
           <div className="flex items-center gap-3">
            <RoleBadge role={activeRole} />
            {isFullAdmin && (
              <AdminRoleSwitch currentView={activeRole} onSwitch={(r) => setRoleOverride(r === dashboardRole ? null : r)} />
            )}
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={() => navigate('/')}><Home className="h-4 w-4 mr-2" />Home</Button>
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate('/'); }}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{renderView()}</main>
      <VisitorAnalyticsModal open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal} analytics={fullAnalytics} selectedDays={selectedDays} />

      {/* Global admin dialogs — must mount regardless of active role dashboard,
          so Ops/Sales/CEO sub-dashboards can trigger them via setShow*. */}
      <AdminUsersList open={showUsers} onOpenChange={setShowUsers} />
      <AdminRequirementsList open={showRequirements} onOpenChange={setShowRequirements} />
      <AdminBidsList open={showBids} onOpenChange={setShowBids} />
      <AdminL1AnalysisView open={showL1Analysis} onOpenChange={setShowL1Analysis} />
      <SupplierSelectionEngine open={showSupplierSelection} onOpenChange={setShowSupplierSelection} />
      <AdminLogisticsList open={showLogistics} onOpenChange={setShowLogistics} />
      <AdminDataExport open={showDataExport} onOpenChange={setShowDataExport} />
      <AdminReferralStats open={showReferrals} onOpenChange={setShowReferrals} />
      <AdminInvoiceManagement open={showInvoices} onOpenChange={setShowInvoices} />
      <VehicleVerification open={showVehicles} onOpenChange={setShowVehicles} adminId={user?.id || ''} />
      <PartnerDocumentVerification open={showPartnerDocs} onOpenChange={setShowPartnerDocs} adminId={user?.id || ''} />
      <PremiumBidsManager open={showPremiumBids} onOpenChange={setShowPremiumBids} adminId={user?.id || ''} />
    </div>
  );
}
