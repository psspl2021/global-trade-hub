import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Users, FileText, Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { sanitizeExcelData } from '@/lib/excelSanitizer';

interface AdminDataExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminDataExport({ open, onOpenChange }: AdminDataExportProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const downloadAsExcel = (data: any[], filename: string) => {
    // Sanitize data to prevent Excel formula injection attacks
    const sanitizedData = sanitizeExcelData(data);
    const ws = XLSX.utils.json_to_sheet(sanitizedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportSignups = async () => {
    setLoading('signups');
    try {
      let query = supabase
        .from('profiles')
        .select('id, company_name, contact_person, email, phone, city, state, country, gstin, business_type, created_at');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data: profiles, error: profilesError } = await query.order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      const exportData = profiles?.map(p => ({
        'Company Name': p.company_name,
        'Contact Person': p.contact_person,
        'Email': p.email,
        'Phone': p.phone,
        'Role': roleMap.get(p.id) || 'Unknown',
        'City': p.city || '',
        'State': p.state || '',
        'Country': p.country || '',
        'GSTIN': p.gstin || '',
        'Business Type': p.business_type || '',
        'Registered On': p.created_at ? format(new Date(p.created_at), 'yyyy-MM-dd HH:mm') : '',
      })) || [];

      if (exportData.length === 0) {
        toast.info('No signup data found for the selected period');
        return;
      }

      downloadAsExcel(exportData, 'ProcureSaathi_Signups');
      toast.success(`Exported ${exportData.length} signups`);
    } catch (error) {
      console.error('Error exporting signups:', error);
      toast.error('Failed to export signup data');
    } finally {
      setLoading(null);
    }
  };

  const exportRequirements = async () => {
    setLoading('requirements');
    try {
      let query = supabase
        .from('requirements')
        .select('*, profiles:buyer_id(company_name, contact_person, email, phone)');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data: requirements, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const exportData = requirements?.map(r => ({
        'Title': r.title,
        'Category': r.product_category,
        'Description': r.description,
        'Quantity': r.quantity,
        'Unit': r.unit,
        'Budget Min': r.budget_min || '',
        'Budget Max': r.budget_max || '',
        'Delivery Location': r.delivery_location,
        'Deadline': r.deadline ? format(new Date(r.deadline), 'yyyy-MM-dd') : '',
        'Status': r.status,
        'Trade Type': r.trade_type || 'domestic_india',
        'Buyer Company': (r.profiles as any)?.company_name || '',
        'Buyer Contact': (r.profiles as any)?.contact_person || '',
        'Buyer Email': (r.profiles as any)?.email || '',
        'Buyer Phone': (r.profiles as any)?.phone || '',
        'Created On': r.created_at ? format(new Date(r.created_at), 'yyyy-MM-dd HH:mm') : '',
      })) || [];

      if (exportData.length === 0) {
        toast.info('No requirements found for the selected period');
        return;
      }

      downloadAsExcel(exportData, 'ProcureSaathi_Requirements');
      toast.success(`Exported ${exportData.length} requirements`);
    } catch (error) {
      console.error('Error exporting requirements:', error);
      toast.error('Failed to export requirements data');
    } finally {
      setLoading(null);
    }
  };

  const exportBids = async () => {
    setLoading('bids');
    try {
      const { data: bids, error } = await supabase
        .from('bids')
        .select(`
          *,
          requirements:requirement_id(title, product_category, buyer_id),
          supplier_profile:supplier_id(company_name, contact_person, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get buyer profiles
      const buyerIds = [...new Set(bids?.map(b => (b.requirements as any)?.buyer_id).filter(Boolean))];
      const { data: buyerProfiles } = await supabase
        .from('profiles')
        .select('id, company_name')
        .in('id', buyerIds);

      const buyerMap = new Map(buyerProfiles?.map(p => [p.id, p.company_name]) || []);

      let filteredBids = bids || [];
      if (dateFrom) {
        filteredBids = filteredBids.filter(b => new Date(b.created_at) >= new Date(dateFrom));
      }
      if (dateTo) {
        filteredBids = filteredBids.filter(b => new Date(b.created_at) <= new Date(`${dateTo}T23:59:59`));
      }

      const exportData = filteredBids.map(b => ({
        'Requirement Title': (b.requirements as any)?.title || '',
        'Requirement Category': (b.requirements as any)?.product_category || '',
        'Buyer Company': buyerMap.get((b.requirements as any)?.buyer_id) || '',
        'Supplier Company': (b.supplier_profile as any)?.company_name || '',
        'Supplier Contact': (b.supplier_profile as any)?.contact_person || '',
        'Supplier Email': (b.supplier_profile as any)?.email || '',
        'Supplier Phone': (b.supplier_profile as any)?.phone || '',
        'Bid Amount': b.bid_amount,
        'Profit': b.service_fee,
        'Total Amount': b.total_amount,
        'Delivery Days': b.delivery_timeline_days,
        'Status': b.status,
        'Created On': b.created_at ? format(new Date(b.created_at), 'yyyy-MM-dd HH:mm') : '',
      }));

      if (exportData.length === 0) {
        toast.info('No bids found for the selected period');
        return;
      }

      downloadAsExcel(exportData, 'ProcureSaathi_Bids');
      toast.success(`Exported ${exportData.length} bids`);
    } catch (error) {
      console.error('Error exporting bids:', error);
      toast.error('Failed to export bids data');
    } finally {
      setLoading(null);
    }
  };

  const exportTransactions = async () => {
    setLoading('transactions');
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          buyer_profile:buyer_id(company_name, email),
          supplier_profile:supplier_id(company_name, email)
        `);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data: transactions, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const exportData = transactions?.map(t => ({
        'Buyer Company': (t.buyer_profile as any)?.company_name || '',
        'Buyer Email': (t.buyer_profile as any)?.email || '',
        'Supplier Company': (t.supplier_profile as any)?.company_name || '',
        'Supplier Email': (t.supplier_profile as any)?.email || '',
        'Amount': t.amount,
        'Profit': t.service_fee,
        'Fee Paid': t.fee_paid ? 'Yes' : 'No',
        'Payment Date': t.payment_date ? format(new Date(t.payment_date), 'yyyy-MM-dd HH:mm') : '',
        'Created On': t.created_at ? format(new Date(t.created_at), 'yyyy-MM-dd HH:mm') : '',
      })) || [];

      if (exportData.length === 0) {
        toast.info('No transactions found for the selected period');
        return;
      }

      downloadAsExcel(exportData, 'ProcureSaathi_Transactions');
      toast.success(`Exported ${exportData.length} transactions`);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast.error('Failed to export transactions data');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Platform Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Filters */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <p className="col-span-2 text-sm text-muted-foreground">
              Leave empty to export all data
            </p>
          </div>

          {/* Export Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-blue-600" />
                  User Signups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Company details, contact info, roles, registration dates
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={exportSignups}
                  disabled={loading === 'signups'}
                >
                  {loading === 'signups' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Signups
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  All buyer requirements with details and buyer info
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={exportRequirements}
                  disabled={loading === 'requirements'}
                >
                  {loading === 'requirements' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Requirements
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-green-600" />
                  Bids
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  All supplier bids with amounts and supplier details
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={exportBids}
                  disabled={loading === 'bids'}
                >
                  {loading === 'bids' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Bids
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-orange-600" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Accepted deals with amounts and payment status
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={exportTransactions}
                  disabled={loading === 'transactions'}
                >
                  {loading === 'transactions' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Transactions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
