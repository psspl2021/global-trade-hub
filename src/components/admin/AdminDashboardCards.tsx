import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Users, FileText, IndianRupee, AlertTriangle, Truck, Download, Gavel, Eye, Mail, BarChart3, Monitor, Smartphone, Globe, TrendingUp, RefreshCw, Star, Gift, PenTool, Search, CreditCard, Target, Trophy, Brain, Gauge, Rocket } from 'lucide-react';
import { VisitorAnalyticsModal } from './VisitorAnalyticsModal';

interface AdminStats {
  pendingInvoices: number;
  pendingAmount: number;
  totalCollected: number;
  activeSuppliers: number;
  activeRequirements: number;
  overdueInvoices: number;
  pendingVehicles: number;
  pendingDocuments: number;
}

interface VisitorAnalytics {
  totalVisitors: number;
  totalPageviews: number;
  pageviewsPerVisit: number;
  topPages: Array<{ page: string; views: number }>;
  topSources: Array<{ source: string; count: number; percentage: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  dailyData: Array<{ date: string; visitors: number; pageviews: number }>;
  countryBreakdown: Array<{ country: string; countryCode: string; visitors: number; percentage: number }>;
}

interface AdminDashboardCardsProps {
  onOpenInvoiceManagement: () => void;
  onOpenVehicleVerification: () => void;
  onOpenDataExport: () => void;
  onOpenUsersList: () => void;
  onOpenRequirementsList: () => void;
  onOpenBidsList: () => void;
  onOpenLogisticsList: () => void;
  onOpenLeadsDashboard: () => void;
  onOpenPremiumBidsManager: () => void;
  onOpenReferralStats: () => void;
  onOpenBlogManager: () => void;
  onOpenPartnerDocumentVerification: () => void;
  onOpenL1Analysis: () => void;
  onOpenEmailTracking: () => void;
  onOpenSupplierSelection: () => void;
  onOpenControlTower: () => void;
  onOpenAISalesEngine: () => void;
}

export function AdminDashboardCards({ 
  onOpenInvoiceManagement, 
  onOpenVehicleVerification, 
  onOpenDataExport,
  onOpenUsersList,
  onOpenRequirementsList,
  onOpenBidsList,
  onOpenLogisticsList,
  onOpenLeadsDashboard,
  onOpenPremiumBidsManager,
  onOpenReferralStats,
  onOpenBlogManager,
  onOpenPartnerDocumentVerification,
  onOpenL1Analysis,
  onOpenEmailTracking,
  onOpenSupplierSelection,
  onOpenControlTower,
  onOpenAISalesEngine,
}: AdminDashboardCardsProps) {
  const [stats, setStats] = useState<AdminStats>({
    pendingInvoices: 0,
    pendingAmount: 0,
    totalCollected: 0,
    activeSuppliers: 0,
    activeRequirements: 0,
    overdueInvoices: 0,
    pendingVehicles: 0,
    pendingDocuments: 0,
  });
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: {
          startDate: getDateString(-selectedDays),
          endDate: getDateString(0),
          days: selectedDays,
        },
      });

      if (error) {
        console.error('Error fetching analytics:', error);
        return;
      }

      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch platform invoices stats
        const { data: invoices } = await supabase
          .from('platform_invoices')
          .select('status, total_amount, due_date');

        const pending = invoices?.filter(i => i.status === 'pending') || [];
        const paid = invoices?.filter(i => i.status === 'paid') || [];
        const overdue = pending.filter(i => i.due_date && new Date(i.due_date) < new Date());

        // Fetch active suppliers and logistics partners count
        const { count: suppliersCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .in('role', ['supplier', 'logistics_partner']);
        // Fetch active requirements count
        const { count: requirementsCount } = await supabase
          .from('requirements')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch pending vehicles count
        const { count: pendingVehiclesCount } = await (supabase
          .from('vehicles') as any)
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending');

        // Fetch pending partner documents count
        const { count: pendingDocsCount } = await supabase
          .from('partner_documents')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending');

        setStats({
          pendingInvoices: pending.length,
          pendingAmount: pending.reduce((sum, i) => sum + Number(i.total_amount), 0),
          totalCollected: paid.reduce((sum, i) => sum + Number(i.total_amount), 0),
          activeSuppliers: suppliersCount || 0,
          activeRequirements: requirementsCount || 0,
          overdueInvoices: overdue.length,
          pendingVehicles: pendingVehiclesCount || 0,
          pendingDocuments: pendingDocsCount || 0,
        });
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    fetchAnalytics();
    
    // Subscribe to real-time page_visits updates
    const channel = supabase
      .channel('page-visits-analytics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_visits'
        },
        () => {
          // Refresh analytics when new visit is recorded
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDays]);

  function getDateString(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Control Tower Card - First Position (Featured) */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5 text-primary" />
            Control Tower
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Complete platform analytics, AI inventory tracking & financial metrics
          </p>
          <Button className="w-full" onClick={onOpenControlTower}>
            <Gauge className="h-4 w-4 mr-2" />
            Open Control Tower
          </Button>
        </CardContent>
      </Card>

      {/* AI Sales Engine Card - Featured Position */}
      <Card className="border-2 border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-blue-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5 text-purple-600" />
            AI Sales Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered global buyer & supplier discovery, outreach, and conversion
          </p>
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
            onClick={onOpenAISalesEngine}
          >
            <Rocket className="h-4 w-4 mr-2" />
            Open AI Sales
          </Button>
        </CardContent>
      </Card>

      <Card className="border-indigo-500/20 bg-indigo-500/5 md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Visitor Analytics
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-1"
              onClick={fetchAnalytics}
              disabled={analyticsLoading}
            >
              <RefreshCw className={`h-3 w-3 ${analyticsLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Select value={String(selectedDays)} onValueChange={(val) => setSelectedDays(Number(val))}>
              <SelectTrigger className="ml-auto w-[130px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 365 days</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : analytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-indigo-600">{analytics.totalVisitors}</div>
                  <p className="text-xs text-muted-foreground">Total Visitors</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600">{analytics.totalPageviews}</div>
                  <p className="text-xs text-muted-foreground">Page Views</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span>{analytics.deviceBreakdown.desktop}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span>{analytics.deviceBreakdown.mobile}%</span>
                </div>
                <div className="ml-auto text-muted-foreground">
                  {analytics.pageviewsPerVisit} pages/visit
                </div>
              </div>

              {/* Geographic Preview */}
              {analytics.countryBreakdown && analytics.countryBreakdown.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span>
                    Top: {analytics.countryBreakdown.slice(0, 2).map(c => `${c.country} (${c.percentage}%)`).join(', ')}
                  </span>
                </div>
              )}

              {analytics.topSources.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Top source: {analytics.topSources[0].source} ({analytics.topSources[0].percentage}%)
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={() => setAnalyticsModalOpen(true)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to load analytics</p>
          )}
        </CardContent>
      </Card>

      {/* Analytics Modal */}
      <VisitorAnalyticsModal 
        open={analyticsModalOpen} 
        onOpenChange={setAnalyticsModalOpen} 
        analytics={analytics}
        selectedDays={selectedDays}
      />

      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-orange-600" />
            Pending Invoices
            {stats.overdueInvoices > 0 && (
              <span className="ml-auto flex items-center gap-1 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {stats.overdueInvoices} overdue
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">{stats.pendingInvoices}</div>
          <p className="text-sm text-muted-foreground mb-4">
            ₹{stats.pendingAmount.toLocaleString()} pending collection
          </p>
          <Button className="w-full" onClick={onOpenInvoiceManagement}>
            Manage Invoices
          </Button>
        </CardContent>
      </Card>

      <Card className={stats.pendingVehicles > 0 ? "border-blue-500/20 bg-blue-500/5" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5 text-blue-600" />
            Vehicle Verification
            {stats.pendingVehicles > 0 && (
              <span className="ml-auto flex items-center gap-1 text-sm text-blue-600">
                <AlertTriangle className="h-4 w-4" />
                {stats.pendingVehicles} pending
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{stats.pendingVehicles}</div>
          <p className="text-sm text-muted-foreground mb-4">
            Vehicles awaiting RC verification
          </p>
          <Button className="w-full" variant={stats.pendingVehicles > 0 ? "default" : "outline"} onClick={onOpenVehicleVerification}>
            Verify Vehicles
          </Button>
        </CardContent>
      </Card>

      <Card className={stats.pendingDocuments > 0 ? "border-violet-500/20 bg-violet-500/5" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-violet-600" />
            Partner Documents
            {stats.pendingDocuments > 0 && (
              <span className="ml-auto flex items-center gap-1 text-sm text-violet-600">
                <AlertTriangle className="h-4 w-4" />
                {stats.pendingDocuments} pending
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-violet-600">{stats.pendingDocuments}</div>
          <p className="text-sm text-muted-foreground mb-4">
            Aadhar, PAN & Notary verification
          </p>
          <Button className="w-full" variant={stats.pendingDocuments > 0 ? "default" : "outline"} onClick={onOpenPartnerDocumentVerification}>
            Verify Documents
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <IndianRupee className="h-5 w-5 text-green-600" />
            Total Collected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            ₹{stats.totalCollected.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            Platform service fees collected
          </p>
        </CardContent>
      </Card>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-600" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{stats.activeSuppliers}</div>
          <p className="text-sm text-muted-foreground mb-4">
            Suppliers & Logistics Partners
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenUsersList}>
            <Eye className="h-4 w-4 mr-2" />
            View All Users
          </Button>
        </CardContent>
      </Card>

      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-purple-600" />
            Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">{stats.activeRequirements}</div>
          <p className="text-sm text-muted-foreground mb-4">
            Active requirements
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenRequirementsList}>
            <Eye className="h-4 w-4 mr-2" />
            View All Requirements
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gavel className="h-5 w-5 text-amber-600" />
            All Bids
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            View supplier & logistics bids
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenBidsList}>
            <Eye className="h-4 w-4 mr-2" />
            View All Bids
          </Button>
        </CardContent>
      </Card>

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-600" />
            L1 Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Line-item level L1 supplier analysis
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenL1Analysis}>
            <Trophy className="h-4 w-4 mr-2" />
            View L1 Analysis
          </Button>
        </CardContent>
      </Card>

      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-indigo-600" />
            AI Selection Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered supplier selection with anonymity
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenSupplierSelection}>
            <Brain className="h-4 w-4 mr-2" />
            Open AI Engine
          </Button>
        </CardContent>
      </Card>

      <Card className="border-cyan-500/20 bg-cyan-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5 text-cyan-600" />
            Logistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Vehicles, warehouses & requirements
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenLogisticsList}>
            <Eye className="h-4 w-4 mr-2" />
            View Logistics
          </Button>
        </CardContent>
      </Card>

      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-emerald-600" />
            Data Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Download signups, requirements, bids & transactions
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenDataExport}>
            Export Data
          </Button>
        </CardContent>
      </Card>

      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-rose-600" />
            Leads Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Newsletter subscribers & demo requests
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenLeadsDashboard}>
            <Eye className="h-4 w-4 mr-2" />
            View Leads
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            Premium Bids
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage premium bids for suppliers & transporters
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenPremiumBidsManager}>
            <Star className="h-4 w-4 mr-2" />
            Manage Premium Bids
          </Button>
        </CardContent>
      </Card>

      <Card className="border-pink-500/20 bg-pink-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-pink-600" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            View referral stats & top referrers leaderboard
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenReferralStats}>
            <Eye className="h-4 w-4 mr-2" />
            View Referral Stats
          </Button>
        </CardContent>
      </Card>

      <Card className="border-teal-500/20 bg-teal-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PenTool className="h-5 w-5 text-teal-600" />
            Blog Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Create and manage blog posts
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenBlogManager}>
            <PenTool className="h-4 w-4 mr-2" />
            Manage Blogs
          </Button>
        </CardContent>
      </Card>

      {/* SEO & SEM are now inside AI Sales Engine */}

      <Card className="border-teal-500/20 bg-teal-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-teal-600" />
            Email Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Supplier email quotas, Brevo tracking & subscriptions
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenEmailTracking}>
            <Mail className="h-4 w-4 mr-2" />
            Manage Email Tracking
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}