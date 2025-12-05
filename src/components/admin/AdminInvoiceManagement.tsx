import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Search, CheckCircle, Clock, IndianRupee, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PlatformInvoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  description: string | null;
  due_date: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
  } | null;
}

interface AdminInvoiceManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminInvoiceManagement({ open, onOpenChange }: AdminInvoiceManagementProps) {
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PlatformInvoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // Fetch invoices first
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('platform_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoiceError) throw invoiceError;

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(invoiceData?.map(i => i.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person, email, phone')
        .in('id', userIds);

      // Map profiles to invoices
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const invoicesWithProfiles = invoiceData?.map(invoice => ({
        ...invoice,
        profiles: profilesMap.get(invoice.user_id) || null,
      })) || [];

      setInvoices(invoicesWithProfiles as PlatformInvoice[]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchInvoices();
    }
  }, [open]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.profiles?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    pending: invoices.filter(i => i.status === 'pending').length,
    pendingAmount: invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.total_amount), 0),
    paidThisMonth: invoices.filter(i => {
      if (i.status !== 'paid' || !i.paid_at) return false;
      const paidDate = new Date(i.paid_at);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    }).reduce((sum, i) => sum + Number(i.total_amount), 0),
    overdue: invoices.filter(i => {
      if (i.status !== 'pending' || !i.due_date) return false;
      return new Date(i.due_date) < new Date();
    }).length,
  };

  const handleMarkAsPaid = async () => {
    if (!selectedInvoice || !paymentReference.trim()) {
      toast.error('Please enter payment reference');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('platform_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: paymentReference.trim(),
        })
        .eq('id', selectedInvoice.id);

      if (error) throw error;

      toast.success('Invoice marked as paid');
      setShowPaymentDialog(false);
      setPaymentReference('');
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-500/30">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin Invoice Management</DialogTitle>
          </DialogHeader>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">₹{stats.pendingAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <IndianRupee className="h-4 w-4" />
                  <span className="text-sm font-medium">Collected (Month)</span>
                </div>
                <div className="text-2xl font-bold">₹{stats.paidThisMonth.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Overdue</span>
                </div>
                <div className="text-2xl font-bold">{stats.overdue}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Invoices</span>
                </div>
                <div className="text-2xl font-bold">{invoices.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice # or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.profiles?.company_name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{invoice.profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{invoice.invoice_type.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right font-medium">₹{Number(invoice.total_amount).toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell>{format(new Date(invoice.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        {invoice.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPaymentDialog(true);
                            }}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {invoice.status === 'paid' && invoice.payment_reference && (
                          <span className="text-xs text-muted-foreground">
                            Ref: {invoice.payment_reference}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Invoice as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedInvoice && (
                <div className="space-y-2 mt-2">
                  <p><strong>Invoice:</strong> {selectedInvoice.invoice_number}</p>
                  <p><strong>Company:</strong> {selectedInvoice.profiles?.company_name}</p>
                  <p><strong>Amount:</strong> ₹{Number(selectedInvoice.total_amount).toLocaleString()}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="paymentRef">Payment Reference (UTR/Transaction ID)</Label>
            <Input
              id="paymentRef"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Enter UTR or Transaction ID"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPaymentReference('');
              setSelectedInvoice(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsPaid} disabled={updating || !paymentReference.trim()}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
