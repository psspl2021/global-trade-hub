import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, IndianRupee, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface CRMDashboardProps {
  userId: string;
  userType: 'supplier' | 'buyer';
}

interface DashboardStats {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalInvoices: number;
  totalCustomers: number;
  totalTax: number;
  revenueGrowth: number;
  recentInvoices: any[];
  paymentSummary: { paid: number; pending: number; overdue: number };
}

export const CRMDashboard = ({ userId, userType }: CRMDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalPending: 0,
    totalOverdue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalTax: 0,
    revenueGrowth: 0,
    recentInvoices: [],
    paymentSummary: { paid: 0, pending: 0, overdue: 0 },
  });

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    setLoading(true);

    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);

    // Fetch invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('supplier_id', userId)
      .in('document_type', ['tax_invoice', 'proforma_invoice']);

    // Fetch customers/suppliers
    let customersCount = 0;
    if (userType === 'supplier') {
      const { count } = await supabase
        .from('supplier_customers')
        .select('id', { count: 'exact', head: true })
        .eq('supplier_id', userId);
      customersCount = count || 0;
    } else {
      const { count } = await supabase
        .from('buyer_suppliers')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_id', userId);
      customersCount = count || 0;
    }

    // Calculate stats
    const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
    const pendingInvoices = invoices?.filter(i => i.status === 'sent' || i.status === 'accepted') || [];
    const overdueInvoices = invoices?.filter(i => {
      if (i.status === 'paid' || i.status === 'cancelled') return false;
      if (!i.due_date) return false;
      return new Date(i.due_date) < new Date();
    }) || [];

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const totalTax = invoices?.reduce((sum, inv) => sum + Number(inv.tax_amount), 0) || 0;

    // Calculate month-over-month growth
    const currentMonthInvoices = paidInvoices.filter(inv => {
      const date = new Date(inv.issue_date);
      return date >= startOfMonth(currentMonth) && date <= endOfMonth(currentMonth);
    });
    const lastMonthInvoices = paidInvoices.filter(inv => {
      const date = new Date(inv.issue_date);
      return date >= startOfMonth(lastMonth) && date <= endOfMonth(lastMonth);
    });

    const currentMonthRevenue = currentMonthInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Recent invoices
    const recentInvoices = (invoices || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    setStats({
      totalRevenue,
      totalPending,
      totalOverdue,
      paidInvoices: paidInvoices.length,
      unpaidInvoices: pendingInvoices.length + overdueInvoices.length,
      totalInvoices: invoices?.length || 0,
      totalCustomers: customersCount,
      totalTax,
      revenueGrowth,
      recentInvoices,
      paymentSummary: {
        paid: paidInvoices.length,
        pending: pendingInvoices.length,
        overdue: overdueInvoices.length,
      },
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
            </div>
            {stats.revenueGrowth !== 0 && (
              <div className={`flex items-center text-xs mt-2 ${stats.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueGrowth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(stats.revenueGrowth).toFixed(1)}% vs last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.totalPending)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.unpaidInvoices} unpaid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOverdue)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.paymentSummary.overdue} overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tax</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalTax)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.totalInvoices} total invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Status Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.paymentSummary.paid}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full" 
                      style={{ width: `${(stats.paymentSummary.paid / Math.max(stats.totalInvoices, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.paymentSummary.pending}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-600 rounded-full" 
                      style={{ width: `${(stats.paymentSummary.pending / Math.max(stats.totalInvoices, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Overdue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.paymentSummary.overdue}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 rounded-full" 
                      style={{ width: `${(stats.paymentSummary.overdue / Math.max(stats.totalInvoices, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No invoices yet</p>
            ) : (
              <div className="space-y-2">
                {stats.recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.buyer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{Number(inv.total_amount).toLocaleString()}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          inv.status === 'paid' ? 'text-green-600 border-green-600' : 
                          inv.status === 'sent' ? 'text-blue-600 border-blue-600' : 
                          'text-muted-foreground'
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
