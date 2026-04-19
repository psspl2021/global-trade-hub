export interface PerUnitResult {
  display: string;
  raw: number;
  rounded: number;
  isLowImpact: boolean;
}

/**
 * Calculates per-unit savings with smart display formatting.
 * - Values < 1 show "< ₹1" (flagged as low impact)
 * - Values 1–9.9 show one decimal (₹1.7)
 * - Values ≥ 10 show integers (₹12, ₹125)
 * - Hover tooltip exposes raw 4-decimal value
 */
export const getPerUnitDisplay = (
  totalSaved: number,
  quantity: number,
  currency: string = 'INR'
): PerUnitResult => {
  if (quantity <= 0) return { display: '₹0', raw: 0, rounded: 0, isLowImpact: true };

  const raw = totalSaved / quantity;
  const rounded = Math.round(raw * 100) / 100;

  if (rounded > 0 && rounded < 1) {
    return { display: '< ₹1', raw, rounded, isLowImpact: true };
  }

  // Always show 2 decimals so per-unit × quantity reconciles with total saved
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);

  return { display: formatted, raw, rounded, isLowImpact: raw < 1 };
};
