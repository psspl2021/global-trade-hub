import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Copy, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PlatformInvoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  description: string;
  due_date: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
}

interface PlatformInvoicesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

// ProcureSaathi Bank Details
const BANK_DETAILS = {
  accountName: 'ProcureSaathi Private Limited',
  accountNumber: '50200012345678',
  ifscCode: 'HDFC0001234',
  bankName: 'HDFC Bank',
  branch: 'Mumbai Main Branch',
  upiId: 'procuresaathi@hdfcbank',
  gstin: '27AABCP1234A1Z5',
};

export const PlatformInvoices = ({ open, onOpenChange, userId }: PlatformInvoicesProps) => {
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<PlatformInvoice | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load invoices');
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && userId) {
      fetchInvoices();
    }
  }, [open, userId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInvoiceTypeLabel = (type: string) => {
    switch (type) {
      case 'service_fee':
        return 'Service Fee';
      case 'subscription':
        return 'Subscription';
      case 'extra_bid':
        return 'Extra Bid Charge';
      default:
        return type;
    }
  };

  const pendingTotal = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total_amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ProcureSaathi Invoices
          </DialogTitle>
        </DialogHeader>

        {/* Summary Card */}
        {pendingTotal > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Total Pending Amount</p>
                  <p className="text-2xl font-bold text-orange-800">₹{pendingTotal.toLocaleString('en-IN')}</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedInvoice(invoices.find(i => i.status === 'pending') || null)}>
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found</p>
                <p className="text-sm">Platform invoices will appear here when generated</p>
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.id} className={invoice.status === 'pending' ? 'border-orange-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-medium">{invoice.invoice_number}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>Type: <strong>{getInvoiceTypeLabel(invoice.invoice_type)}</strong></span>
                        <span>Date: {format(new Date(invoice.created_at), 'dd MMM yyyy')}</span>
                        {invoice.due_date && invoice.status === 'pending' && (
                          <span className="text-orange-600">Due: {format(new Date(invoice.due_date), 'dd MMM yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Amount: ₹{invoice.amount.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-muted-foreground">GST (18%): ₹{invoice.tax_amount.toLocaleString('en-IN')}</p>
                      <p className="text-xl font-bold">₹{invoice.total_amount.toLocaleString('en-IN')}</p>
                      {invoice.status === 'pending' && (
                        <Button size="sm" className="mt-2" onClick={() => setSelectedInvoice(invoice)}>
                          View & Pay
                        </Button>
                      )}
                      {invoice.status === 'paid' && invoice.payment_reference && (
                        <p className="text-xs text-green-600 mt-1">Ref: {invoice.payment_reference}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Payment Details Modal */}
        {selectedInvoice && (
          <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Payment Details - {selectedInvoice.invoice_number}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Invoice Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Invoice Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Amount</span>
                      <span>₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span>₹{selectedInvoice.tax_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total Payable</span>
                      <span>₹{selectedInvoice.total_amount.toLocaleString('en-IN')}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Bank Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Bank Transfer Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-muted-foreground">Account Name</p>
                        <p className="font-medium">{BANK_DETAILS.accountName}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(BANK_DETAILS.accountName, 'Account name')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-muted-foreground">Account Number</p>
                        <p className="font-mono font-medium">{BANK_DETAILS.accountNumber}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, 'Account number')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-muted-foreground">IFSC Code</p>
                        <p className="font-mono font-medium">{BANK_DETAILS.ifscCode}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(BANK_DETAILS.ifscCode, 'IFSC code')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank</p>
                      <p className="font-medium">{BANK_DETAILS.bankName}, {BANK_DETAILS.branch}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* UPI Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">UPI Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-muted-foreground">UPI ID</p>
                        <p className="font-mono font-medium">{BANK_DETAILS.upiId}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(BANK_DETAILS.upiId, 'UPI ID')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">Payment Instructions:</p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Use invoice number <strong>{selectedInvoice.invoice_number}</strong> as payment reference</li>
                      <li>Pay via NEFT/RTGS/IMPS or UPI</li>
                      <li>Payment will be verified within 24-48 hours</li>
                      <li>For queries, contact: payments@procuresaathi.com</li>
                    </ol>
                  </CardContent>
                </Card>

                {/* GSTIN */}
                <p className="text-xs text-center text-muted-foreground">
                  ProcureSaathi GSTIN: {BANK_DETAILS.gstin}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};
