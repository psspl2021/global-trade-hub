export interface PerUnitResult {
  display: string;
  raw: number;
  rounded: number;
}

/**
 * Calculates per-unit savings with smart display formatting.
 * - Values < 1 show "< ₹1"
 * - Values >= 1 show one-decimal precision (e.g. ₹1.7)
 * - Hover tooltip exposes raw 4-decimal value
 */
export const getPerUnitDisplay = (
  totalSaved: number,
  quantity: number,
  currency: string = 'INR'
): PerUnitResult => {
  if (quantity <= 0) return { display: '₹0', raw: 0, rounded: 0 };

  const raw = totalSaved / quantity;
  const rounded = Math.round(raw * 10) / 10;

  if (rounded > 0 && rounded < 1) {
    return { display: '< ₹1', raw, rounded };
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rounded);

  return { display: formatted, raw, rounded };
};
