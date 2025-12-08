import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Users, FileText, IndianRupee, AlertTriangle, Truck, Download, Gavel, Eye, Mail, BarChart3, Monitor, Smartphone, Globe, TrendingUp } from 'lucide-react';
import { VisitorAnalyticsModal } from './VisitorAnalyticsModal';

interface AdminStats {
  pendingInvoices: number;
  pendingAmount: number;
  totalCollected: number;
  activeSuppliers: number;
  activeRequirements: number;
  overdueInvoices: number;
  pendingVehicles: number;
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
}: AdminDashboardCardsProps) {
  const [stats, setStats] = useState<AdminStats>({
    pendingInvoices: 0,
    pendingAmount: 0,
    totalCollected: 0,
    activeSuppliers: 0,
    activeRequirements: 0,
    overdueInvoices: 0,
    pendingVehicles: 0,
  });
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(7);

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

        // Fetch active suppliers count
        const { count: suppliersCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'supplier');

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

        setStats({
          pendingInvoices: pending.length,
          pendingAmount: pending.reduce((sum, i) => sum + Number(i.total_amount), 0),
          totalCollected: paid.reduce((sum, i) => sum + Number(i.total_amount), 0),
          activeSuppliers: suppliersCount || 0,
          activeRequirements: requirementsCount || 0,
          overdueInvoices: overdue.length,
          pendingVehicles: pendingVehiclesCount || 0,
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
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedDays]);

  function getDateString(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Visitor Analytics Card - First Position */}
      <Card className="border-indigo-500/20 bg-indigo-500/5 md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Visitor Analytics
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
            Suppliers registered
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
    </div>
  );
}