import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { generateDocumentPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';

interface SubscriptionInvoice {
  id: string;
  invoice_number: string;
  payment_type: string;
  description: string;
  subtotal: number;
  total_tax: number;
  total_amount: number;
  invoice_date: string;
  customer_name: string;
  customer_email: string | null;
  customer_gstin: string | null;
  customer_address: string | null;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  hsn_sac_code: string;
  email_sent: boolean;
}

export const SubscriptionInvoices = () => {
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subscription_invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices((data as SubscriptionInvoice[]) || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice: SubscriptionInvoice) => {
    setDownloading(invoice.id);
    try {
      // Determine tax breakdown based on CGST/SGST vs IGST
      const isIntraState = invoice.cgst_amount > 0;
      const taxRate = isIntraState ? 9 : 18;

      await generateDocumentPDF({
        documentType: 'tax_invoice',
        documentNumber: invoice.invoice_number,
        issueDate: format(new Date(invoice.invoice_date), 'dd/MM/yyyy'),
        companyName: 'PROCURESAATHI SOLUTIONS PRIVATE LIMITED',
        companyAddress: 'METRO PILLAR NUMBER 564, 14/3 MATHURA ROAD, SECTOR 31, FARIDABAD, Haryana - 121003',
        companyGstin: '06AAMCP4662L1ZW',
        buyerName: invoice.customer_name,
        buyerAddress: invoice.customer_address || '',
        buyerGstin: invoice.customer_gstin || '',
        buyerEmail: invoice.customer_email || undefined,
        items: [{
          description: invoice.description,
          hsn_code: invoice.hsn_sac_code,
          quantity: 1,
          unit: 'Nos',
          unit_price: invoice.subtotal,
          tax_rate: 18,
          tax_amount: invoice.total_tax,
          total: invoice.total_amount,
        }],
        subtotal: invoice.subtotal,
        taxAmount: invoice.total_tax,
        totalAmount: invoice.total_amount,
        bankDetails: {
          bankName: 'HDFC Bank',
          bankAccount: '50200089456523',
          bankIfsc: 'HDFC0001234',
          bankLocation: 'Faridabad Sector 31',
        },
        terms: '1. This is a computer-generated invoice.\n2. Payment is non-refundable once the service is activated.\n3. Subject to Faridabad jurisdiction only.',
      });

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(null);
    }
  };

  const formatCurrency = (amount: number) => 
    `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return null; // Don't show if no invoices
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Payment Invoices</CardTitle>
        </div>
        <CardDescription>
          Download tax invoices for your premium purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div 
              key={invoice.id} 
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{invoice.invoice_number}</span>
                  <Badge variant="outline" className="text-xs">
                    {invoice.payment_type === 'premium_pack' ? 'Premium Pack' : 'Email Subscription'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {invoice.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(invoice.invoice_date), 'dd MMM yyyy')} • {formatCurrency(invoice.total_amount)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {invoice.email_sent && (
                  <span title="Invoice emailed">
                    <Mail className="h-4 w-4 text-green-500" />
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadPDF(invoice)}
                  disabled={downloading === invoice.id}
                >
                  {downloading === invoice.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
