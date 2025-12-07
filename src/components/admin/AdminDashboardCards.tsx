import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Users, FileText, IndianRupee, AlertTriangle, Truck, Download, Gavel, Eye, Mail, History } from 'lucide-react';

interface AdminStats {
  pendingInvoices: number;
  pendingAmount: number;
  totalCollected: number;
  activeSuppliers: number;
  activeRequirements: number;
  overdueInvoices: number;
  pendingVehicles: number;
  recentActivityCount: number;
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
  onOpenActivityLog: () => void;
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
  onOpenActivityLog,
}: AdminDashboardCardsProps) {
  const [stats, setStats] = useState<AdminStats>({
    pendingInvoices: 0,
    pendingAmount: 0,
    totalCollected: 0,
    activeSuppliers: 0,
    activeRequirements: 0,
    overdueInvoices: 0,
    pendingVehicles: 0,
    recentActivityCount: 0,
  });
  const [loading, setLoading] = useState(true);

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

        // Fetch recent activity count (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const { count: activityCount } = await supabase
          .from('admin_activity_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', yesterday.toISOString());

        setStats({
          pendingInvoices: pending.length,
          pendingAmount: pending.reduce((sum, i) => sum + Number(i.total_amount), 0),
          totalCollected: paid.reduce((sum, i) => sum + Number(i.total_amount), 0),
          activeSuppliers: suppliersCount || 0,
          activeRequirements: requirementsCount || 0,
          overdueInvoices: overdue.length,
          pendingVehicles: pendingVehiclesCount || 0,
          recentActivityCount: activityCount || 0,
        });
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      <Card className="border-slate-500/20 bg-slate-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-slate-600" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-600">{stats.recentActivityCount}</div>
          <p className="text-sm text-muted-foreground mb-4">
            Actions in last 24 hours
          </p>
          <Button className="w-full" variant="outline" onClick={onOpenActivityLog}>
            <Eye className="h-4 w-4 mr-2" />
            View Activity
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}