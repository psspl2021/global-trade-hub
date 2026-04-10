/**
 * Multi-currency formatting and conversion utilities
 * Used across the global reverse auction system
 */

// Country to default currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  india: 'INR', in: 'INR', ind: 'INR',
  uae: 'AED', ae: 'AED',
  saudi: 'SAR', sa: 'SAR',
  qatar: 'QAR', qa: 'QAR',
  kenya: 'KES', ke: 'KES',
  nigeria: 'NGN', ng: 'NGN',
  us: 'USD', usa: 'USD',
  uk: 'GBP', gb: 'GBP',
  eu: 'EUR', de: 'EUR', fr: 'EUR', it: 'EUR', es: 'EUR', nl: 'EUR',
  jp: 'JPY', japan: 'JPY',
  cn: 'CNY', china: 'CNY',
  vn: 'VND', vietnam: 'VND',
  th: 'THB', thailand: 'THB',
  sg: 'SGD', singapore: 'SGD',
  my: 'MYR', malaysia: 'MYR',
  au: 'AUD', australia: 'AUD',
  br: 'BRL', brazil: 'BRL',
  za: 'ZAR',
  eg: 'EGP', egypt: 'EGP',
  tr: 'TRY', turkey: 'TRY',
};

// Supported currencies with symbols
export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const;

/**
 * Format a value in the specified currency
 */
export function formatCurrency(value: number, currency: string = 'INR'): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

/**
 * Get default currency for a country
 */
export function getCurrencyForCountry(country: string): string {
  return COUNTRY_CURRENCY_MAP[country.toLowerCase()] || 'USD';
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

// ── Global Buyer Plan FX ────────────────────────────
const PLAN_BASE_INR = 700000;

/** Indicative FX rates (replace with live API feed) */
export const FX_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  AED: 0.044,
  SAR: 0.045,
  GBP: 0.0095,
  CNY: 0.086,
  VND: 295,
  KES: 1.86,
  NGN: 18.8,
  JPY: 1.79,
  SGD: 0.016,
  AUD: 0.018,
  QAR: 0.044,
};

/**
 * Convert the 6-month plan price to a target currency
 */
export function convertPlanPrice(currency: string, customRate?: number): number {
  const rate = customRate ?? FX_RATES[currency] ?? 1;
  return Math.round(PLAN_BASE_INR * rate);
}

/**
 * Format the plan price with "Billed as ₹7,00,000 equivalent" note
 */
export function formatPlanPrice(currency: string): { price: string; note: string } {
  if (currency === 'INR') {
    return { price: formatCurrency(PLAN_BASE_INR, 'INR'), note: '' };
  }
  const converted = convertPlanPrice(currency);
  return {
    price: formatCurrency(converted, currency),
    note: `Billed as ₹7,00,000 equivalent`,
  };
}
