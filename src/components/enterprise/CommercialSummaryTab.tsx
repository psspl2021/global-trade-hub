/**
 * Commercial Summary Tab — Phase 1
 * Displays contract metadata for activated lanes.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useContractSummaries } from '@/hooks/useContractSummaries';
import jsPDF from 'jspdf';

interface Props {
  signalId?: string;
}

export function CommercialSummaryTab({ signalId }: Props) {
  const { contracts, loading } = useContractSummaries(signalId);
  const [exporting, setExporting] = useState(false);

  const handlePDFExport = (contract: any) => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Commercial Summary', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toISOString()}`, 14, 28);
      doc.setFontSize(12);
      
      const lines = [
        `Signal ID: ${contract.signal_id || 'N/A'}`,
        `Buyer ID: ${contract.buyer_id || 'N/A'}`,
        `Supplier ID: ${contract.supplier_id || 'N/A'}`,
        `Finance Partner: ${contract.finance_partner || 'N/A'}`,
        `Credit Days: ${contract.credit_days ?? 'N/A'}`,
        `Base Price: ₹${(contract.base_price || 0).toLocaleString('en-IN')}`,
        `Platform Margin: ₹${(contract.platform_margin || 0).toLocaleString('en-IN')}`,
        `Total Value: ₹${(contract.total_value || 0).toLocaleString('en-IN')}`,
        `Activation: ${contract.created_at ? new Date(contract.created_at).toLocaleDateString() : 'N/A'}`
      ];
      
      lines.forEach((line, i) => {
        doc.text(line, 14, 40 + i * 8);
      });
      
      doc.save(`commercial-summary-${contract.id.slice(0, 8)}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Loading commercial data...
        </CardContent>
      </Card>
    );
  }

  if (!contracts.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Insufficient Data — No commercial summaries recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Commercial Summary
          <Badge variant="secondary">{contracts.length} records</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Finance Partner</TableHead>
                <TableHead>Credit Days</TableHead>
                <TableHead className="text-right">Base Price</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.buyer_id?.slice(0, 8) || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{c.supplier_id?.slice(0, 8) || '—'}</TableCell>
                  <TableCell>{c.finance_partner || '—'}</TableCell>
                  <TableCell>{c.credit_days ?? '—'}</TableCell>
                  <TableCell className="text-right">₹{(c.base_price || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">₹{(c.platform_margin || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right font-semibold">₹{(c.total_value || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => handlePDFExport(c)} disabled={exporting}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
