/**
 * Auction Pricing Utility — Fixed Fee Model with Launch Discount
 * Domestic: ₹5,000 + 18% GST = ₹5,900 (first 5 auctions: ₹2,500 + 18% GST = ₹2,950)
 * Import/Export: ₹10,000 + 18% GST = ₹11,800
 */

export interface AuctionFee {
  base: number;
  gst: number;
  total: number;
  label: string;
  discountApplied: boolean;
  originalBase?: number;
}

const GST_RATE = 0.18;

export function getAuctionFee(transactionType: string, buyerAuctionCount?: number): AuctionFee | null {
  if (transactionType === 'domestic') {
    const isDiscounted = typeof buyerAuctionCount === 'number' && buyerAuctionCount < 5;
    const base = isDiscounted ? 2500 : 5000;
    const gst = Math.round(base * GST_RATE);
    return {
      base,
      gst,
      total: base + gst,
      label: 'Domestic Auction Fee',
      discountApplied: isDiscounted,
      originalBase: isDiscounted ? 5000 : undefined,
    };
  }

  if (transactionType === 'import' || transactionType === 'export') {
    const base = 10000;
    const gst = Math.round(base * GST_RATE);
    return { base, gst, total: base + gst, label: 'Import/Export Auction Fee', discountApplied: false };
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
