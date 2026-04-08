/**
 * Auction Result Export — CSV + PDF download for completed auctions
 * Enterprise buyers need audit-ready exports for procurement records
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { ReverseAuction, ReverseAuctionBid, getRankedBids } from '@/hooks/useReverseAuction';
import { format } from 'date-fns';

interface AuctionResultExportProps {
  auction: ReverseAuction;
  bids: ReverseAuctionBid[];
}

function formatINR(value: number | null, currency = 'INR') {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.floor(value));
}

export function AuctionResultExport({ auction, bids }: AuctionResultExportProps) {
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const ranked = getRankedBids(bids);

  const totalSaved = auction.starting_price && auction.winning_price
    ? auction.starting_price - auction.winning_price : 0;
  const savingsPct = auction.starting_price && totalSaved > 0
    ? ((totalSaved / auction.starting_price) * 100).toFixed(1) : '0';
  const savingsPerUnit = auction.quantity > 0 ? totalSaved / auction.quantity : 0;

  const exportCSV = () => {
    setExporting('csv');
    try {
      const header = ['Rank', 'Supplier ID', 'Bid Price', 'Bid Time', 'Status'];
      const rows = ranked.map(b => [
        `L${b.rank}`,
        b.supplier_id.slice(0, 8) + '...',
        b.bid_price.toString(),
        format(new Date(b.created_at), 'dd-MMM-yyyy HH:mm:ss'),
        b.is_winning ? 'WINNER' : 'Participant',
      ]);

      const summaryRows = [
        [],
        ['AUCTION SUMMARY'],
        ['Title', auction.title],
        ['Product', auction.product_slug],
        ['Quantity', `${auction.quantity} ${auction.unit}`],
        ['Starting Price', auction.starting_price?.toString() || ''],
        ['Winning Price', auction.winning_price?.toString() || ''],
        ['Savings', `${formatINR(totalSaved)} (${savingsPct}%)`],
        ['Total Bids', bids.length.toString()],
        ['Auction Start', auction.auction_start ? format(new Date(auction.auction_start), 'dd-MMM-yyyy HH:mm') : ''],
        ['Auction End', auction.auction_end ? format(new Date(auction.auction_end), 'dd-MMM-yyyy HH:mm') : ''],
        ['Status', auction.status],
        [],
        ['BID DETAILS'],
        header,
        ...rows,
      ];

      const csvContent = summaryRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auction-${auction.title.replace(/\s+/g, '-').slice(0, 30)}-${format(new Date(), 'yyyyMMdd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = () => {
    setExporting('pdf');
    try {
      const bidRows = ranked.map(b => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px;font-weight:${b.rank <= 3 ? '600' : '400'};color:${b.rank === 1 ? '#16a34a' : '#374151'}">L${b.rank}</td>
          <td style="padding:8px;">PS-${b.supplier_id.slice(0, 6).toUpperCase()}</td>
          <td style="padding:8px;text-align:right;">${formatINR(b.bid_price, auction.currency)}</td>
          <td style="padding:8px;">${format(new Date(b.created_at), 'dd-MMM HH:mm:ss')}</td>
          <td style="padding:8px;">${b.is_winning ? '🏆 Winner' : '—'}</td>
        </tr>
      `).join('');

      const html = `
        <html><head><style>
          body{font-family:Arial,sans-serif;padding:40px;color:#1f2937}
          h1{font-size:20px;color:#1e40af;margin:0 0 4px}
          h2{font-size:14px;color:#6b7280;margin:0 0 24px;font-weight:400}
          .summary{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
          .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;min-width:140px}
          .card-label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px}
          .card-value{font-size:18px;font-weight:700;margin-top:2px}
          .savings{background:#ecfdf5;border-color:#86efac}
          .savings .card-value{color:#059669}
          table{width:100%;border-collapse:collapse;margin-top:16px}
          th{background:#f3f4f6;padding:8px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280}
          .footer{margin-top:32px;font-size:11px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:12px}
          @media print{body{padding:20px}}
        </style></head><body>
          <h1>${auction.title}</h1>
          <h2>${auction.product_slug} · ${auction.quantity} ${auction.unit} · ${auction.status.toUpperCase()}</h2>
          
          <div class="summary">
            <div class="card"><div class="card-label">Starting Price</div><div class="card-value">${formatINR(auction.starting_price, auction.currency)}</div></div>
            <div class="card"><div class="card-label">Winning Price</div><div class="card-value" style="color:#2563eb">${formatINR(auction.winning_price, auction.currency)}</div></div>
            <div class="card savings"><div class="card-label">Total Saved</div><div class="card-value">${formatINR(totalSaved, auction.currency)} (${savingsPct}%)</div></div>
            <div class="card"><div class="card-label">Total Bids</div><div class="card-value">${bids.length}</div></div>
          </div>

          <div style="display:flex;gap:24px;margin-bottom:24px;font-size:13px;color:#6b7280;">
            <span>📅 Start: ${auction.auction_start ? format(new Date(auction.auction_start), 'dd MMM yyyy, HH:mm') : '—'}</span>
            <span>🏁 End: ${auction.auction_end ? format(new Date(auction.auction_end), 'dd MMM yyyy, HH:mm') : '—'}</span>
          </div>

          <table>
            <thead><tr><th>Rank</th><th>Supplier</th><th style="text-align:right">Bid Price</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>${bidRows}</tbody>
          </table>
          
          <div class="footer">
            Generated on ${format(new Date(), 'dd MMM yyyy, HH:mm')} · ProcureSaathi — India's B2B Procurement Platform
          </div>
        </body></html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
    } finally {
      setExporting(null);
    }
  };

  if (auction.status !== 'completed') return null;

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportCSV}
        disabled={exporting === 'csv'}
        className="gap-1.5"
      >
        <FileSpreadsheet className="h-4 w-4" />
        {exporting === 'csv' ? 'Exporting…' : 'CSV'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportPDF}
        disabled={exporting === 'pdf'}
        className="gap-1.5"
      >
        <FileText className="h-4 w-4" />
        {exporting === 'pdf' ? 'Preparing…' : 'PDF Report'}
      </Button>
    </div>
  );
}
