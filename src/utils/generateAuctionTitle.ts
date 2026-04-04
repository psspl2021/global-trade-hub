/**
 * AI-style auction title generator from line items + trade type
 */
export interface AuctionLineItem {
  product: string;
  quantity: string;
  unit: string;
  description?: string;
}

export function generateAuctionTitle(items: AuctionLineItem[], transactionType: string): string {
  const validItems = items.filter(i => i.product.trim());
  if (validItems.length === 0) return '';

  const tradeLabel =
    transactionType === 'domestic' ? 'Domestic' :
    transactionType === 'import' ? 'Import' : 'Export';

  if (validItems.length === 1) {
    const { product, quantity, unit } = validItems[0];
    return `${product}${quantity ? ` – ${quantity} ${unit}` : ''} Reverse Auction (${tradeLabel})`;
  }

  const names = validItems.map(i => i.product).join(', ');
  return `${names} – Multi-Item Reverse Auction (${tradeLabel})`;
}
