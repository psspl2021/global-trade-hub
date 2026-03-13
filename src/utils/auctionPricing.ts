/**
 * Auction Pricing Utility — Fixed Fee Model
 * Domestic: ₹5,000 + 18% GST = ₹5,900
 * Import/Export: ₹10,000 + 18% GST = ₹11,800
 */

export interface AuctionFee {
  base: number;
  gst: number;
  total: number;
  label: string;
}

const GST_RATE = 0.18;

export function getAuctionFee(transactionType: string): AuctionFee | null {
  if (transactionType === 'domestic') {
    const base = 5000;
    const gst = Math.round(base * GST_RATE);
    return { base, gst, total: base + gst, label: 'Domestic Auction Fee' };
  }

  if (transactionType === 'import' || transactionType === 'export') {
    const base = 10000;
    const gst = Math.round(base * GST_RATE);
    return { base, gst, total: base + gst, label: 'Import/Export Auction Fee' };
  }

  return null;
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}
