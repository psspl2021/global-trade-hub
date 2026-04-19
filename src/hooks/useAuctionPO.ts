/**
 * useAuctionPO — Purchase Order utilities for reverse auction awards
 * Zero-storage: calculations + notes generation only, no DB persistence
 */

export interface POLineItem {
  item_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number; // 0, 5, 12, 18 or custom
}

export function calculatePOTotals(items: POLineItem[], freight: number) {
  let subtotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    const lineTotal = item.unit_price * item.quantity;
    const lineTax = (item.tax_rate / 100) * lineTotal;
    subtotal += lineTotal;
    taxTotal += lineTax;
  }

  // Round grand total to nearest whole rupee to eliminate per-line rounding drift (e.g. ₹0.59)
  const grandTotal = Math.round(subtotal + taxTotal + freight);
  return { subtotal, taxTotal, grandTotal };
}

export function generatePONotes(items: POLineItem[], auctionTitle: string) {
  return `Purchase Order generated from reverse auction: "${auctionTitle}". Includes ${items.length} SKU(s). All materials must meet agreed specifications. Delivery timelines and quality compliance are mandatory. Freight charges are agreed separately.`;
}
