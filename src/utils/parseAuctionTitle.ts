/**
 * Parses a free-text auction title into structured line items.
 * Example: "hr coil 2mm 30 ton, 5mm 10 ton"
 * → [{ product: "hr coil 2mm", quantity: "30", unit: "TON" },
 *    { product: "5mm", quantity: "10", unit: "TON" }]
 */
export interface ParsedItem {
  product: string;
  quantity: string;
  unit: string;
}

const UNIT_MAP: Record<string, string> = {
  ton: 'MT',
  tons: 'MT',
  mt: 'MT',
  kg: 'KG',
  kgs: 'KG',
  pcs: 'Pcs',
  pieces: 'Pcs',
  ltrs: 'Ltrs',
  litres: 'Ltrs',
  liters: 'Ltrs',
};

export function parseAuctionTitle(input: string): ParsedItem[] {
  if (!input) return [];

  const items: ParsedItem[] = [];
  const parts = input.split(',');

  for (const part of parts) {
    const text = part.trim();
    if (!text) continue;

    const UNITS_RE = 'ton|tons|mt|kg|kgs|pcs|pieces|ltrs|litres|liters';
    const match =
      text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${UNITS_RE})`, 'i')) ||
      text.match(new RegExp(`(${UNITS_RE})\\s*(\\d+(?:\\.\\d+)?)`, 'i'));
    if (!match) continue;

    // Determine which capture group has the number vs unit
    const isQtyFirst = /^\d/.test(match[1]);
    const quantity = isQtyFirst ? match[1] : match[2];
    const rawUnit = (isQtyFirst ? match[2] : match[1]).toLowerCase();
    const unit = UNIT_MAP[rawUnit] || 'MT';
    const product = text.replace(match[0], '').trim();

    if (product) {
      items.push({ product, quantity, unit });
    }
  }

  return items;
}
