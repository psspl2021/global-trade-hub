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

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
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
  Home
} from 'lucide-react';
import { VisitorAnalyticsModal } from '@/components/admin/VisitorAnalyticsModal';
import { AccessDenied } from '@/components/purchaser';
import { ControlTowerExecutive } from '@/components/ai-enforcement/ControlTowerExecutive';
import { NotificationBell } from '@/components/NotificationBell';
import { AdminUsersList } from '@/components/admin/AdminUsersList';
import { AdminRequirementsList } from '@/components/admin/AdminRequirementsList';
import { AdminBidsList } from '@/components/admin/AdminBidsList';
import { AdminLogisticsList } from '@/components/admin/AdminLogisticsList';
import { AdminL1AnalysisView } from '@/components/admin/AdminL1AnalysisView';
import { AdminDataExport } from '@/components/admin/AdminDataExport';
import AdminBlogManager from '@/components/admin/AdminBlogManager';
import AdminEmailTracking from '@/components/admin/AdminEmailTracking';
import { AdminReferralStats } from '@/components/admin/AdminReferralStats';
import { AdminInvoiceManagement } from '@/components/admin/AdminInvoiceManagement';
import { VehicleVerification } from '@/components/admin/VehicleVerification';
import { PartnerDocumentVerification } from '@/components/admin/PartnerDocumentVerification';
import { PremiumBidsManager } from '@/components/admin/PremiumBidsManager';
import { LeadsDashboard } from '@/components/admin/LeadsDashboard';
import { AISalesDashboard } from '@/components/admin/AISalesDashboard';
import { AdminDemandHeatmap } from '@/components/admin/AdminDemandHeatmap';
import { SalesControlBoard } from '@/components/admin/SalesControlBoard';
import { BenchmarkManager } from '@/components/admin/BenchmarkManager';
import { AIBlogGenerator } from '@/components/admin/AIBlogGenerator';
import { supabase } from '@/integrations/supabase/client';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { EnterpriseControlCenter } from '@/components/enterprise/EnterpriseControlCenter';

type AdminView = 
  | 'dashboard' 
  | 'control-tower' 
  | 'ai-sales' 
  | 'demand-heatmap'
  | 'leads'
  | 'blogs'
  | 'email-tracking'
  | 'sales-board'
  | 'benchmarks'
  | 'ai-blog-gen'
  | 'enterprise';

export default function AdminAuditDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { primaryRole, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();
  
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  
  // Dialog states for modal-based components
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

  // Fetch analytics from edge function
  const fetchStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    
    try {
      // Fetch user name from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_name, contact_person')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setUserName(profileData.contact_person || profileData.company_name || 'Admin');
      }

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // Fetch requirements count
      const reqResult = await supabase
        .from('requirements')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      const reqCount = reqResult.count;

      // Fetch pending invoices
      const invoicesResult = await (supabase
        .from('platform_invoices') as any)
        .select('total_amount')
        .eq('payment_status', 'pending');
      const invoicesData = invoicesResult.data || [];
      const pendingAmount = invoicesData.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

      // Fetch total collected
      const collectedResult = await (supabase
        .from('platform_invoices') as any)
        .select('total_amount')
        .eq('payment_status', 'paid');
      const collectedData = collectedResult.data || [];
      const totalCollected = collectedData.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

      // Fetch vehicles pending verification
      const vehiclesResult = await (supabase
        .from('vehicles') as any)
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', false);
      const vehiclesCount = vehiclesResult.count || 0;

      // Fetch partner docs pending
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

      // Fetch REAL visitor analytics using edge function for complete data
      const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('get-analytics', {
        body: { days: selectedDays }
      });

      if (!analyticsError && analyticsData) {
        setFullAnalytics(analyticsData);
        
        // Format top countries string for card display
        const topCountryStr = analyticsData.countryBreakdown?.slice(0, 2)
          .map((c: any) => `${c.country} (${c.percentage}%)`)
          .join(', ') || 'No data';
        
        // Format top source string for card display
        const topSourceStr = analyticsData.topSources?.length > 0
          ? `${analyticsData.topSources[0].source} (${analyticsData.topSources[0].percentage}%)`
          : 'No data';
        
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
          totalVisitors: 0,
          pageViews: 0,
          desktopPercent: 0,
          mobilePercent: 0,
          tabletPercent: 0,
          pagesPerVisit: 0,
          avgTimeSeconds: 0,
          topCountries: [],
          topSources: [],
          lastUpdated: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Refetch when selectedDays changes
  useEffect(() => {
    if (user) fetchStats();
  }, [selectedDays]);

  // Initial fetch on mount
  useEffect(() => {
    fetchStats();
  }, [user]);

  // Debug log for role access
  useEffect(() => {
    if (!accessLoading) {
      console.log('[AdminAuditDashboard] Access check:', {
        primaryRole,
        isAccessDenied,
        authLoading,
        accessLoading,
        userId: user?.id
      });
    }
  }, [primaryRole, isAccessDenied, authLoading, accessLoading, user?.id]);

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

  // STEP 1: Show loading until BOTH auth AND role are fully resolved
  if (authLoading || accessLoading || !primaryRole || primaryRole === 'unknown') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  // STEP 2: Only AFTER role is resolved, check access
  if (isAccessDenied || !['ps_admin', 'admin'].includes(primaryRole)) {
    console.warn('[AdminAuditDashboard] Access denied for role:', primaryRole);
    return <AccessDenied variant="404" />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'control-tower':
        return <ControlTowerExecutive />;
      case 'ai-sales':
        return <AISalesDashboard />;
      case 'demand-heatmap':
        return <AdminDemandHeatmap />;
      case 'leads':
        return <LeadsDashboard />;
      case 'blogs':
        return <AdminBlogManager />;
      case 'email-tracking':
        return <AdminEmailTracking />;
      case 'sales-board':
        return <SalesControlBoard />;
      case 'benchmarks':
        return <BenchmarkManager />;
      case 'ai-blog-gen':
        return <AIBlogGenerator />;
      case 'enterprise':
        return <EnterpriseControlCenter />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">ProcureSaathi Solutions Pvt Ltd • ADMIN</p>
      </div>

      {/* TOP ROW — Sales-Critical Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sales Control Board */}
        <Card className="bg-red-950 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Sales Control Board
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-200">
              HOT / WARM / COLD RFQ pipeline with sales actions
            </p>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setCurrentView('sales-board')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Open Sales Board
            </Button>
          </CardContent>
        </Card>

        {/* Price Benchmarks */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              Price Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Set market benchmarks for savings visualization
            </p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setCurrentView('benchmarks')}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              Manage Benchmarks
            </Button>
          </CardContent>
        </Card>

        {/* AI Blog Generator */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PenTool className="h-4 w-4 text-violet-500" />
              AI Blog Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Auto-generate buyer-intent SEO blogs
            </p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setCurrentView('ai-blog-gen')}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Generate Blog
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Control Tower */}
        <Card className="bg-slate-800 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Control Tower
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-300">
              Complete platform analytics, AI inventory tracking & financial metrics
            </p>
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => setCurrentView('control-tower')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Open Control Tower
            </Button>
          </CardContent>
        </Card>

        {/* AI Sales Engine */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Sales Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              AI-powered global buyer & supplier discovery, outreach, and conversion
            </p>
            <Button 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setCurrentView('ai-sales')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Open AI Sales
            </Button>
          </CardContent>
        </Card>

        {/* Demand Heatmap */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-rose-500" />
              Demand Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Global demand intelligence across 196 countries × 30 categories
            </p>
            <Button 
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => setCurrentView('demand-heatmap')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Open Demand Heatmap
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Intelligence Row */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card className="bg-gradient-to-r from-slate-900 to-zinc-800 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Enterprise Control Center
              <Badge className="bg-white/20 text-white text-xs">NEW</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-300">
              Commercial Intelligence • Spend Analytics • Audit Trails • ERP Exports • Governance Controls
            </p>
            <Button 
              className="w-full bg-white text-slate-900 hover:bg-slate-100"
              onClick={() => setCurrentView('enterprise')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Open Enterprise Center
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Analytics & Verification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Visitor Analytics */}
        <Card className="bg-card border md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Visitor Analytics
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={fetchStats} disabled={statsLoading}>
                  <RefreshCw className={`h-3 w-3 ${statsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <Select value={String(selectedDays)} onValueChange={(val) => setSelectedDays(Number(val))}>
                <SelectTrigger className="w-[110px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
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
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
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
                  <span className="flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    {visitorStats.desktopPercent}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    {visitorStats.mobilePercent}%
                  </span>
                  <span>{visitorStats.pagesPerVisit} pages/visit</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Top: {visitorStats.topCountries.slice(0, 2).map(c => `${c.country} (${c.percentage}%)`).join(', ') || 'No data'}
                  </p>
                  <p>Top source: {visitorStats.topSources[0]?.source || 'No data'} ({visitorStats.topSources[0]?.percentage || 0}%)</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowAnalyticsModal(true)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Detailed Analytics
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-rose-500" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-rose-500">{stats.pendingInvoices}</p>
            <p className="text-sm text-muted-foreground">
              ₹{stats.pendingInvoiceAmount.toLocaleString()} pending collection
            </p>
            <Button 
              className="w-full"
              onClick={() => setShowInvoices(true)}
            >
              Manage Invoices
            </Button>
          </CardContent>
        </Card>

        {/* Vehicle Verification */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4 text-slate-600" />
              Vehicle Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.vehiclesPending}</p>
            <p className="text-sm text-muted-foreground">Vehicles awaiting RC verification</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowVehicles(true)}
            >
              Verify Vehicles
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Documents & Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Partner Documents */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-slate-600" />
              Partner Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.partnerDocsPending}</p>
            <p className="text-sm text-muted-foreground">Aadhar, PAN & Notary verification</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowPartnerDocs(true)}
            >
              Verify Documents
            </Button>
          </CardContent>
        </Card>

        {/* Total Collected */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-emerald-600">₹{stats.totalCollected.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Platform profit collected</p>
          </CardContent>
        </Card>

        {/* All Users */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
            <p className="text-sm text-muted-foreground">Suppliers & Logistics Partners</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowUsers(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Users
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fourth Row - Operations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Requirements */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-slate-600" />
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.totalRequirements}</p>
            <p className="text-sm text-muted-foreground">Active requirements</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowRequirements(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Requirements
            </Button>
          </CardContent>
        </Card>

        {/* All Bids */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="h-4 w-4 text-amber-500" />
              All Bids
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">View supplier & logistics bids</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowBids(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Bids
            </Button>
          </CardContent>
        </Card>

        {/* L1 Analysis */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-violet-500" />
              L1 Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Line-item level L1 supplier analysis</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowL1Analysis(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              View L1 Analysis
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fifth Row - AI & Logistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AI Selection Engine */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-slate-600" />
              AI Selection Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">AI-powered supplier selection with anonymity</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowL1Analysis(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Open AI Engine
            </Button>
          </CardContent>
        </Card>

        {/* Logistics */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4 text-blue-500" />
              Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Vehicles, warehouses & requirements</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowLogistics(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Logistics
            </Button>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4 text-slate-600" />
              Data Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Download signups, requirements, bids & transactions</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowDataExport(true)}
            >
              Export Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sixth Row - Leads & Programs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Leads Dashboard */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-slate-600" />
              Leads Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Newsletter subscribers & demo requests</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setCurrentView('leads')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Leads
            </Button>
          </CardContent>
        </Card>

        {/* Premium Bids */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Premium Bids
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Manage premium bids for suppliers & transporters</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowPremiumBids(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Manage Premium Bids
            </Button>
          </CardContent>
        </Card>

        {/* Referral Program */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-rose-500" />
              Referral Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">View referral stats & top referrers leaderboard</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowReferrals(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Referral Stats
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Seventh Row - Content & Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blog Management */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PenTool className="h-4 w-4 text-slate-600" />
              Blog Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Create and manage blog posts</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setCurrentView('blogs')}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Manage Blogs
            </Button>
          </CardContent>
        </Card>

        {/* Email Tracking */}
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-emerald-500" />
              Email Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Supplier email quotas, Brevo tracking & subscriptions</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setCurrentView('email-tracking')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Manage Email Tracking
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog-based admin modals */}
      <AdminUsersList open={showUsers} onOpenChange={setShowUsers} />
      <AdminRequirementsList open={showRequirements} onOpenChange={setShowRequirements} />
      <AdminBidsList open={showBids} onOpenChange={setShowBids} />
      <AdminL1AnalysisView open={showL1Analysis} onOpenChange={setShowL1Analysis} />
      <AdminLogisticsList open={showLogistics} onOpenChange={setShowLogistics} />
      <AdminDataExport open={showDataExport} onOpenChange={setShowDataExport} />
      <AdminReferralStats open={showReferrals} onOpenChange={setShowReferrals} />
      <AdminInvoiceManagement open={showInvoices} onOpenChange={setShowInvoices} />
      <VehicleVerification open={showVehicles} onOpenChange={setShowVehicles} adminId={user?.id || ''} />
      <PartnerDocumentVerification open={showPartnerDocs} onOpenChange={setShowPartnerDocs} adminId={user?.id || ''} />
      <PremiumBidsManager open={showPremiumBids} onOpenChange={setShowPremiumBids} adminId={user?.id || ''} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={procureSaathiLogo} 
                alt="ProcureSaathi" 
                className="h-12 sm:h-14 w-auto"
              />
            </Link>
            {currentView !== 'dashboard' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentView('dashboard')}
              >
                ← Back to Dashboard
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-600 text-white border-0">
              <Shield className="w-3 h-3 mr-1" />
              ADMIN
            </Badge>
            <NotificationBell />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = 'https://www.procuresaathi.com'}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {renderView()}
      </main>

      {/* Visitor Analytics Modal */}
      <VisitorAnalyticsModal
        open={showAnalyticsModal}
        onOpenChange={setShowAnalyticsModal}
        analytics={fullAnalytics}
        selectedDays={selectedDays}
      />
    </div>
  );
}
