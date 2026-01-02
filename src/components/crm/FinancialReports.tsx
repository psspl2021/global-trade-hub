import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, TrendingUp, Wallet, Download, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancialReportsProps {
  userId: string;
  userType: 'supplier' | 'buyer';
}

interface CompanyInfo {
  companyName: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
}

type ReportPeriod = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';

export const FinancialReports = ({ userId, userType }: FinancialReportsProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    address: '',
    gstin: '',
    phone: '',
    email: '',
  });

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    switch (period) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'this_quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return { start: quarterStart, end: quarterEnd };
      case 'last_quarter':
        const lastQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
        const lastQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
        return { start: lastQuarterStart, end: lastQuarterEnd };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'last_year':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : startOfMonth(now),
          end: customEndDate ? new Date(customEndDate) : endOfMonth(now),
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchCompanyInfo = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, address, gstin, phone, email')
      .eq('id', userId)
      .single();

    if (profile) {
      setCompanyInfo({
        companyName: profile.company_name || '',
        address: profile.address || '',
        gstin: profile.gstin || '',
        phone: profile.phone || '',
        email: profile.email || '',
      });
    }
    return profile;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const generateBalanceSheet = async () => {
    setLoading('balance');
    try {
      const profile = await fetchCompanyInfo();
      const { start, end } = getDateRange();

      // Fetch invoices for receivables
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('supplier_id', userId)
        .gte('issue_date', format(start, 'yyyy-MM-dd'))
        .lte('issue_date', format(end, 'yyyy-MM-dd'));

      // Calculate assets
      const receivables = invoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;
      const cashReceived = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;
      
      // Fetch stock value
      const { data: products } = await supabase
        .from('products')
        .select('*, stock_inventory(*)')
        .eq('supplier_id', userId);

      const inventoryValue = products?.reduce((sum, p) => {
        const qty = p.stock_inventory?.[0]?.quantity || 0;
        const price = p.price_range_min || 0;
        return sum + (qty * price);
      }, 0) || 0;

      const totalAssets = receivables + cashReceived + inventoryValue;

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('BALANCE SHEET', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(profile?.company_name || companyInfo.companyName || 'Company Name', pageWidth / 2, 30, { align: 'center' });
      doc.text(`As of ${format(end, 'dd MMMM yyyy')}`, pageWidth / 2, 38, { align: 'center' });

      // Assets Section
      let yPos = 55;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ASSETS', 14, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Current Assets', 14, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      const assets = [
        ['Cash & Bank Balance', formatCurrency(cashReceived)],
        ['Accounts Receivable', formatCurrency(receivables)],
        ['Inventory', formatCurrency(inventoryValue)],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: assets,
        theme: 'plain',
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 60, halign: 'right' },
        },
        margin: { left: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Assets', 20, yPos);
      doc.text(formatCurrency(totalAssets), pageWidth - 20, yPos, { align: 'right' });

      // Liabilities Section
      yPos += 20;
      doc.setFontSize(14);
      doc.text('LIABILITIES & EQUITY', 14, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.text('Current Liabilities', 14, yPos);
      yPos += 8;

      const liabilities = [
        ['Accounts Payable', formatCurrency(0)],
        ['Tax Payable', formatCurrency(invoices?.reduce((sum, i) => sum + Number(i.tax_amount), 0) || 0)],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: liabilities,
        theme: 'plain',
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 60, halign: 'right' },
        },
        margin: { left: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Owner's Equity", 14, yPos);
      yPos += 8;

      const retainedEarnings = totalAssets - (invoices?.reduce((sum, i) => sum + Number(i.tax_amount), 0) || 0);
      const equity = [
        ['Retained Earnings', formatCurrency(retainedEarnings)],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: equity,
        theme: 'plain',
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 60, halign: 'right' },
        },
        margin: { left: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Total Liabilities & Equity', 20, yPos);
      doc.text(formatCurrency(totalAssets), pageWidth - 20, yPos, { align: 'right' });

      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 280);

      doc.save(`Balance_Sheet_${format(end, 'yyyy-MM-dd')}.pdf`);
      toast.success('Balance Sheet downloaded successfully!');
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      toast.error('Failed to generate balance sheet');
    } finally {
      setLoading(null);
    }
  };

  const generateIncomeStatement = async () => {
    setLoading('income');
    try {
      const profile = await fetchCompanyInfo();
      const { start, end } = getDateRange();

      // Fetch invoices for revenue
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('supplier_id', userId)
        .in('document_type', ['tax_invoice', 'proforma_invoice'])
        .gte('issue_date', format(start, 'yyyy-MM-dd'))
        .lte('issue_date', format(end, 'yyyy-MM-dd'));

      // Fetch purchase orders for expenses (if buyer) or cost of goods
      const { data: purchases } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', userId)
        .gte('order_date', format(start, 'yyyy-MM-dd'))
        .lte('order_date', format(end, 'yyyy-MM-dd'));

      const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.subtotal), 0) || 0;
      const totalTaxCollected = invoices?.reduce((sum, i) => sum + Number(i.tax_amount), 0) || 0;
      const costOfGoods = purchases?.reduce((sum, p) => sum + Number(p.subtotal), 0) || 0;
      const grossProfit = totalRevenue - costOfGoods;
      const operatingExpenses = 0; // Placeholder - could be extended
      const netProfit = grossProfit - operatingExpenses;

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('INCOME STATEMENT', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text('(Profit & Loss Statement)', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(profile?.company_name || companyInfo.companyName || 'Company Name', pageWidth / 2, 38, { align: 'center' });
      doc.text(`For the period ${format(start, 'dd MMM yyyy')} to ${format(end, 'dd MMM yyyy')}`, pageWidth / 2, 46, { align: 'center' });

      // Revenue Section
      let yPos = 65;
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Amount (₹)']],
        body: [
          [{ content: 'REVENUE', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
          ['Sales Revenue', formatCurrency(totalRevenue)],
          ['Less: Sales Returns & Discounts', formatCurrency(0)],
          [{ content: 'Net Revenue', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalRevenue), styles: { fontStyle: 'bold' } }],
          ['', ''],
          [{ content: 'COST OF GOODS SOLD', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
          ['Opening Inventory', formatCurrency(0)],
          ['Add: Purchases', formatCurrency(costOfGoods)],
          ['Less: Closing Inventory', formatCurrency(0)],
          [{ content: 'Cost of Goods Sold', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costOfGoods), styles: { fontStyle: 'bold' } }],
          ['', ''],
          [{ content: 'GROSS PROFIT', styles: { fontStyle: 'bold', textColor: grossProfit >= 0 ? [0, 128, 0] : [255, 0, 0] } }, 
           { content: formatCurrency(grossProfit), styles: { fontStyle: 'bold', textColor: grossProfit >= 0 ? [0, 128, 0] : [255, 0, 0] } }],
          ['', ''],
          [{ content: 'OPERATING EXPENSES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
          ['Salaries & Wages', formatCurrency(0)],
          ['Rent', formatCurrency(0)],
          ['Utilities', formatCurrency(0)],
          ['Other Expenses', formatCurrency(0)],
          [{ content: 'Total Operating Expenses', styles: { fontStyle: 'bold' } }, { content: formatCurrency(operatingExpenses), styles: { fontStyle: 'bold' } }],
          ['', ''],
          [{ content: 'NET PROFIT / (LOSS)', styles: { fontStyle: 'bold', fontSize: 12 } }, 
           { content: formatCurrency(netProfit), styles: { fontStyle: 'bold', fontSize: 12, textColor: netProfit >= 0 ? [0, 128, 0] : [255, 0, 0] } }],
        ],
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 50, halign: 'right' },
        },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Tax Summary
      yPos = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont('helvetica', 'bold');
      doc.text('TAX SUMMARY', 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: [
          ['GST/Tax Collected', formatCurrency(totalTaxCollected)],
          ['GST/Tax Paid (Input Credit)', formatCurrency(0)],
          ['Net Tax Liability', formatCurrency(totalTaxCollected)],
        ],
        theme: 'plain',
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 50, halign: 'right' },
        },
      });

      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 280);

      doc.save(`Income_Statement_${format(start, 'yyyy-MM-dd')}_to_${format(end, 'yyyy-MM-dd')}.pdf`);
      toast.success('Income Statement downloaded successfully!');
    } catch (error) {
      console.error('Error generating income statement:', error);
      toast.error('Failed to generate income statement');
    } finally {
      setLoading(null);
    }
  };

  const generateCashFlowStatement = async () => {
    setLoading('cashflow');
    try {
      const profile = await fetchCompanyInfo();
      const { start, end } = getDateRange();

      // Fetch paid invoices for cash inflows
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('supplier_id', userId)
        .eq('status', 'paid')
        .gte('issue_date', format(start, 'yyyy-MM-dd'))
        .lte('issue_date', format(end, 'yyyy-MM-dd'));

      // Fetch purchase orders for cash outflows
      const { data: purchases } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', userId)
        .eq('status', 'paid')
        .gte('order_date', format(start, 'yyyy-MM-dd'))
        .lte('order_date', format(end, 'yyyy-MM-dd'));

      const cashFromSales = invoices?.reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;
      const cashPaidToSuppliers = purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
      const netOperatingCash = cashFromSales - cashPaidToSuppliers;

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CASH FLOW STATEMENT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(profile?.company_name || companyInfo.companyName || 'Company Name', pageWidth / 2, 30, { align: 'center' });
      doc.text(`For the period ${format(start, 'dd MMM yyyy')} to ${format(end, 'dd MMM yyyy')}`, pageWidth / 2, 38, { align: 'center' });

      // Cash Flow Statement
      let yPos = 55;
      autoTable(doc, {
        startY: yPos,
        head: [['Particulars', 'Amount (₹)']],
        body: [
          [{ content: 'CASH FLOWS FROM OPERATING ACTIVITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
          ['Cash Received from Customers', formatCurrency(cashFromSales)],
          ['Cash Paid to Suppliers', `(${formatCurrency(cashPaidToSuppliers)})`],
          ['Cash Paid for Operating Expenses', formatCurrency(0)],
          ['Tax Payments', formatCurrency(0)],
          [{ content: 'Net Cash from Operating Activities', styles: { fontStyle: 'bold' } }, 
           { content: formatCurrency(netOperatingCash), styles: { fontStyle: 'bold', textColor: netOperatingCash >= 0 ? [0, 128, 0] : [255, 0, 0] } }],
          ['', ''],
          [{ content: 'CASH FLOWS FROM INVESTING ACTIVITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
          ['Purchase of Fixed Assets', formatCurrency(0)],
          ['Sale of Fixed Assets', formatCurrency(0)],
          [{ content: 'Net Cash from Investing Activities', styles: { fontStyle: 'bold' } }, { content: formatCurrency(0), styles: { fontStyle: 'bold' } }],
          ['', ''],
          [{ content: 'CASH FLOWS FROM FINANCING ACTIVITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
          ['Capital Introduced', formatCurrency(0)],
          ['Drawings / Dividends', formatCurrency(0)],
          ['Loan Received / (Repaid)', formatCurrency(0)],
          [{ content: 'Net Cash from Financing Activities', styles: { fontStyle: 'bold' } }, { content: formatCurrency(0), styles: { fontStyle: 'bold' } }],
          ['', ''],
          [{ content: 'NET INCREASE / (DECREASE) IN CASH', styles: { fontStyle: 'bold', fontSize: 12 } }, 
           { content: formatCurrency(netOperatingCash), styles: { fontStyle: 'bold', fontSize: 12, textColor: netOperatingCash >= 0 ? [0, 128, 0] : [255, 0, 0] } }],
          ['Opening Cash Balance', formatCurrency(0)],
          [{ content: 'CLOSING CASH BALANCE', styles: { fontStyle: 'bold', fontSize: 12, fillColor: [230, 230, 230] } }, 
           { content: formatCurrency(netOperatingCash), styles: { fontStyle: 'bold', fontSize: 12, fillColor: [230, 230, 230] } }],
        ],
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 50, halign: 'right' },
        },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 280);

      doc.save(`Cash_Flow_Statement_${format(start, 'yyyy-MM-dd')}_to_${format(end, 'yyyy-MM-dd')}.pdf`);
      toast.success('Cash Flow Statement downloaded successfully!');
    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      toast.error('Failed to generate cash flow statement');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Report Period</CardTitle>
          <CardDescription>Select the time period for your financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === 'custom' && (
              <>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Sheet */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Balance Sheet</CardTitle>
                <CardDescription>Assets, Liabilities & Equity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              A snapshot of your company's financial position showing assets, liabilities, and shareholder's equity at a specific point in time.
            </p>
            <Button 
              onClick={generateBalanceSheet} 
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'balance' ? (
                'Generating...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Income Statement */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Income Statement</CardTitle>
                <CardDescription>Profit & Loss Statement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Shows your company's revenues, expenses, and profits or losses over a period. Also known as P&L or earnings statement.
            </p>
            <Button 
              onClick={generateIncomeStatement} 
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'income' ? (
                'Generating...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Cash Flow Statement */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Cash Flow Statement</CardTitle>
                <CardDescription>Cash Movement Report</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tracks the flow of cash in and out of your business from operating, investing, and financing activities.
            </p>
            <Button 
              onClick={generateCashFlowStatement} 
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'cashflow' ? (
                'Generating...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">About Financial Reports</p>
              <p className="text-sm text-muted-foreground mt-1">
                These reports are generated based on your invoices, purchase orders, and inventory data. 
                For accurate financial reporting, ensure all transactions are recorded in the system. 
                The reports follow standard accounting formats and can be used for tax filing and business analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
