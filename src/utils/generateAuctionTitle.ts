/**
 * Smart auction title generator from line items + trade type
 * Produces structured, analytics-friendly titles like Procol/SAP Ariba
 */
export interface AuctionLineItem {
  product: string;
  quantity: string;
  unit: string;
  description?: string;
  category?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'Metals - Ferrous': 'Steel',
  'Metals - Non Ferrous': 'Non-Ferrous Metal',
  'Polymers & Plastics': 'Polymer',
  'Chemicals': 'Chemical',
  'Building Materials': 'Construction Material',
  'Industrial Supplies': 'Industrial Supply',
  'Packaging Materials': 'Packaging',
  'Energy & Power': 'Energy',
  'Textiles & Fabrics': 'Textile',
};

const TRADE_LABELS: Record<string, string> = {
  domestic: 'Domestic',
  import: 'Import',
  export: 'Export',
};

export function generateAuctionTitle(items: AuctionLineItem[], transactionType: string): string {
  const validItems = items.filter(i => i.product.trim());
  if (validItems.length === 0) return '';

  const tradeLabel = TRADE_LABELS[transactionType] || 'Domestic';

  if (validItems.length === 1) {
    const { product, quantity, unit } = validItems[0];
    const qtyStr = quantity ? ` (${quantity} ${unit || 'MT'})` : '';
    return `${product}${qtyStr} – ${tradeLabel} Reverse Auction`;
  }

  if (validItems.length === 2) {
    const parts = validItems.map(i => {
      const q = i.quantity ? ` (${i.quantity} ${i.unit || 'MT'})` : '';
      return `${i.product}${q}`;
    });
    return `${parts.join(' + ')} – ${tradeLabel} Reverse Auction`;
  }

  // 3+ items → summary style
  const totalQty = validItems.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const commonCategory = validItems[0]?.category;
  const catLabel = commonCategory ? CATEGORY_LABELS[commonCategory] || commonCategory : 'Multi-Item';
  const qtyStr = totalQty > 0 ? ` – ${totalQty} Total Qty` : '';
  return `${catLabel} Procurement (${validItems.length} SKUs${qtyStr}) – ${tradeLabel}`;
}
