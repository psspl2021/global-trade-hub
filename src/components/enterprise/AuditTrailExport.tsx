/**
 * Audit Trail Export — Phase 3
 * Download full lane audit as JSON + PDF.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, FileJson, FileText, Loader2, Search, Shield } from 'lucide-react';
import { useAuditExport } from '@/hooks/useAuditExport';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export function AuditTrailExport() {
  const [signalId, setSignalId] = useState('');
  const [auditData, setAuditData] = useState<any>(null);
  const { exportAudit, downloadJSON, loading } = useAuditExport();

  const handleExport = async () => {
    if (!signalId.trim()) { toast.error('Enter a Signal ID'); return; }
    try {
      const data = await exportAudit(signalId.trim()) as any;
      if (data?.error) { toast.error(String(data.error)); return; }
      setAuditData(data);
      toast.success('Audit report generated');
    } catch (e: any) {
      toast.error(e.message || 'Export failed');
    }
  };

  const handlePDFDownload = () => {
    if (!auditData) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Lane Audit Report', 14, 20);
    doc.setFontSize(9);
    doc.text(`Generated: ${auditData.audit_generated_at}`, 14, 27);
    doc.text(`Signal: ${auditData.signal?.id}`, 14, 33);
    doc.text(`Category: ${auditData.signal?.category} / ${auditData.signal?.subcategory}`, 14, 39);
    doc.text(`Country: ${auditData.signal?.country_iso || auditData.signal?.country}`, 14, 45);
    doc.text(`Intent Score: ${auditData.signal?.intent_score}`, 14, 51);
    doc.text(`Lane State: ${auditData.signal?.lane_state}`, 14, 57);
    doc.text(`Classification: ${auditData.signal?.classification}`, 14, 63);

    let y = 75;
    doc.setFontSize(12);
    doc.text('Timeline Events', 14, y);
    doc.setFontSize(9);
    y += 8;
    (auditData.timeline || []).forEach((e: any) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${e.occurred_at} | ${e.event_type} | ${e.from_state} → ${e.to_state}`, 14, y);
      y += 6;
    });

    y += 8;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text(`Bids (${(auditData.bids || []).length})`, 14, y);
    doc.setFontSize(9);
    y += 8;
    (auditData.bids || []).forEach((b: any) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${b.bid_id?.slice(0, 8)} | ₹${b.buyer_visible_price} | ${b.status} | ${b.delivery_timeline_days}d`, 14, y);
      y += 6;
    });

    doc.save(`audit-${signalId.slice(0, 8)}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-slate-700 to-zinc-800">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Audit Trail Export</h2>
          <p className="text-xs text-muted-foreground">Immutable, timestamped lane audit snapshots</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Signal ID (UUID)"
              value={signalId}
              onChange={e => setSignalId(e.target.value)}
              className="font-mono text-sm"
            />
            <Button onClick={handleExport} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
              Generate
            </Button>
          </div>

          {auditData && !auditData.error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge>{auditData.signal?.lane_state}</Badge>
                <Badge variant="outline">{auditData.signal?.category}</Badge>
                <Badge variant="outline">{auditData.signal?.country_iso}</Badge>
                <span className="text-xs text-muted-foreground">
                  {(auditData.timeline || []).length} events • {(auditData.bids || []).length} bids
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadJSON(auditData, `audit-${signalId.slice(0, 8)}.json`)}>
                  <FileJson className="h-3 w-3 mr-1" /> Download JSON
                </Button>
                <Button size="sm" variant="outline" onClick={handlePDFDownload}>
                  <FileText className="h-3 w-3 mr-1" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
