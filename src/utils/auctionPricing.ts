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

// --- Tick-accurate bid pricing ---
export const TICK_SIZE = 0.01;

export const getTickSize = (category?: string): number => {
  switch (category) {
    case 'steel':
      return 1;
    case 'cement':
      return 0.1;
    case 'chemicals':
      return 0.01;
    default:
      return TICK_SIZE;
  }
};

export const normalizePrice = (n: number): number =>
  Math.round(n * 100) / 100;

export const getWinningBid = (l1: number, category?: string): number => {
  if (!l1 || l1 <= 0) return 0;
  const tick = getTickSize(category);
  return normalizePrice(l1 - tick);
};

export const isValidBid = (bid: number, l1: number): boolean =>
  bid > 0 && bid < l1;
