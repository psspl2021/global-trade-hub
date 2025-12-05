import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Users, FileText, IndianRupee, AlertTriangle } from 'lucide-react';

interface AdminStats {
  pendingInvoices: number;
  pendingAmount: number;
  totalCollected: number;
  activeSuppliers: number;
  activeRequirements: number;
  overdueInvoices: number;
}

interface AdminDashboardCardsProps {
  onOpenInvoiceManagement: () => void;
}

export function AdminDashboardCards({ onOpenInvoiceManagement }: AdminDashboardCardsProps) {
  const [stats, setStats] = useState<AdminStats>({
    pendingInvoices: 0,
    pendingAmount: 0,
    totalCollected: 0,
    activeSuppliers: 0,
    activeRequirements: 0,
    overdueInvoices: 0,
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

        setStats({
          pendingInvoices: pending.length,
          pendingAmount: pending.reduce((sum, i) => sum + Number(i.total_amount), 0),
          totalCollected: paid.reduce((sum, i) => sum + Number(i.total_amount), 0),
          activeSuppliers: suppliersCount || 0,
          activeRequirements: requirementsCount || 0,
          overdueInvoices: overdue.length,
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-600" />
            Active Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.activeSuppliers}</div>
          <p className="text-sm text-muted-foreground">
            Registered suppliers on platform
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-purple-600" />
            Active Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.activeRequirements}</div>
          <p className="text-sm text-muted-foreground">
            Open buyer requirements
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
