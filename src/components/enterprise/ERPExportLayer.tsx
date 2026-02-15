/**
 * ERP Export Layer — Phase 5
 * PO CSV, Transaction Summary CSV, Invoice Reference Sheet.
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditExport } from '@/hooks/useAuditExport';

export function ERPExportLayer() {
  const [lanes, setLanes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { downloadCSV } = useAuditExport();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('demand_intelligence_signals')
        .select('id, category, subcategory, country, country_iso, lane_state, awarded_value, awarded_supplier_id, activated_at, closed_at')
        .in('lane_state', ['activated', 'fulfilling', 'closed'])
        .order('activated_at', { ascending: false })
        .limit(100);
      if (data) setLanes(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const exportPOCSV = () => {
    const rows = lanes.map(l => ({
      signal_id: l.id,
      category: l.category,
      subcategory: l.subcategory || '',
      country: l.country_iso || l.country,
      lane_state: l.lane_state,
      awarded_value: l.awarded_value || 0,
      activation_date: l.activated_at || '',
      fulfillment_date: l.closed_at || ''
    }));
    downloadCSV(rows, `po-export-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportTransactionCSV = async () => {
    const { data: contracts } = await (supabase.from('contract_summaries') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    
    if (!contracts?.length) return;
    
    const rows = contracts.map((c: any) => ({
      signal_id: c.signal_id || '',
      buyer_id: c.buyer_id || '',
      supplier_id: c.supplier_id || '',
      finance_partner: c.finance_partner || '',
      credit_days: c.credit_days || '',
      base_price: c.base_price || 0,
      platform_margin: c.platform_margin || 0,
      total_value: c.total_value || 0,
      created_at: c.created_at || ''
    }));
    downloadCSV(rows, `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportInvoiceRef = async () => {
    const { data: invoices } = await (supabase.from('platform_invoices') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    
    if (!invoices?.length) return;
    
    const rows = invoices.map((inv: any) => ({
      invoice_number: inv.invoice_number || inv.id,
      buyer_id: inv.buyer_id || '',
      total_amount: inv.total_amount || 0,
      payment_status: inv.payment_status || '',
      created_at: inv.created_at || ''
    }));
    downloadCSV(rows, `invoice-ref-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (loading) {
    return (
      <Card><CardContent className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700">
          <FileSpreadsheet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">ERP / Accounting Export</h2>
          <p className="text-xs text-muted-foreground">Structured CSV exports for enterprise systems</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 space-y-3">
            <h3 className="font-semibold text-sm">Purchase Order CSV</h3>
            <p className="text-xs text-muted-foreground">{lanes.length} activated lanes available</p>
            <Button size="sm" className="w-full" onClick={exportPOCSV} disabled={!lanes.length}>
              <Download className="h-3 w-3 mr-1" /> Export PO CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-3">
            <h3 className="font-semibold text-sm">Transaction Summary CSV</h3>
            <p className="text-xs text-muted-foreground">Contract metadata + margins</p>
            <Button size="sm" variant="outline" className="w-full" onClick={exportTransactionCSV}>
              <Download className="h-3 w-3 mr-1" /> Export Transactions
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-3">
            <h3 className="font-semibold text-sm">Invoice Reference Sheet</h3>
            <p className="text-xs text-muted-foreground">Invoice numbers + amounts</p>
            <Button size="sm" variant="outline" className="w-full" onClick={exportInvoiceRef}>
              <Download className="h-3 w-3 mr-1" /> Export Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
