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

/** Indicative FX rates: 1 INR = X foreign currency (replace with live API feed) */
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
 * Get the exchange rate factor for converting a currency amount to INR base.
 * Returns how many INR 1 unit of the given currency equals.
 */
export function getExchangeRateToBase(currency: string): number {
  const rate = FX_RATES[currency];
  if (!rate || rate === 0) return 1;
  // FX_RATES stores INR→foreign, so invert for foreign→INR
  return currency === 'INR' ? 1 : 1 / rate;
}

/**
 * Convert a value from one currency to INR base
 */
export function convertToBaseCurrency(value: number, currency: string): number {
  return Math.round(value * getExchangeRateToBase(currency));
}

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

// ── Compact Formatting ────────────────────────────

/**
 * Compact currency format:
 * - INR: ₹15L, ₹1.2Cr
 * - Others: $1.5M, $150K
 */
export function formatCompact(val: number, currency: string = 'INR'): string {
  const sym = getCurrencySymbol(currency);

  if (currency === 'INR') {
    if (val >= 10000000) return `${sym}${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${sym}${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${sym}${(val / 1000).toFixed(0)}K`;
    return `${sym}${Math.round(val).toLocaleString('en-IN')}`;
  }

  if (val >= 1000000) return `${sym}${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${sym}${(val / 1000).toFixed(0)}K`;
  return formatCurrency(val, currency);
}

/**
 * Compact number (no symbol)
 */
export function formatCompactNumber(val: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    return Math.round(val).toLocaleString('en-IN');
  }
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return Math.round(val).toLocaleString();
}

/**
 * Format number with locale grouping (no currency symbol)
 */
export function formatNumber(val: number, currency: string = 'INR'): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return Math.round(val).toLocaleString(locale);
}

/**
 * Get locale for number formatting
 */
export function getCurrencyLocale(currency: string): string {
  return currency === 'INR' ? 'en-IN' : 'en-US';
}

// ── React Hook ────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * React hook: auto-resolves user's org currency and provides bound formatters.
 * Resolution: buyer_companies.base_currency → region_type fallback → INR default.
 */
export function useCurrencyFormatter() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<string>('INR');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchCurrency = async () => {
      try {
        // Try company base currency first
        const { data: membership } = await supabase
          .from('buyer_company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (membership?.company_id) {
          const { data: company } = await supabase
            .from('buyer_companies')
            .select('base_currency, region_type')
            .eq('id', membership.company_id)
            .single();

          if ((company as any)?.base_currency) {
            setCurrency((company as any).base_currency);
            setIsLoading(false);
            return;
          }
          if ((company as any)?.region_type === 'global') {
            setCurrency('USD');
            setIsLoading(false);
            return;
          }
        }

        // Profile fallback
        const { data: profile } = await supabase
          .from('profiles')
          .select('region_type')
          .eq('id', user.id)
          .single();

        if ((profile as any)?.region_type === 'global') {
          setCurrency('USD');
        }
      } catch (err) {
        console.error('[useCurrencyFormatter] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrency();
  }, [user?.id]);

  const symbol = getCurrencySymbol(currency);
  const locale = getCurrencyLocale(currency);

  const fmt = useMemo(() => (val: number) => formatCurrency(val, currency), [currency]);
  const fmtCompact = useMemo(() => (val: number) => formatCompact(val, currency), [currency]);
  const fmtNumber = useMemo(() => (val: number) => formatNumber(val, currency), [currency]);

  /**
   * Convert an INR-stored value into the user's local currency for DISPLAY.
   * Use this on every screen showing money that's stored as INR in the DB.
   * For INR users, this is a no-op.
   */
  const fmtFromINR = useMemo(
    () => (inrValue: number) => {
      if (currency === 'INR') return formatCurrency(inrValue, 'INR');
      const rate = FX_RATES[currency] ?? 0;
      const converted = inrValue * rate;
      return `≈ ${formatCurrency(converted, currency)}`;
    },
    [currency]
  );

  const fmtCompactFromINR = useMemo(
    () => (inrValue: number) => {
      if (currency === 'INR') return formatCompact(inrValue, 'INR');
      const rate = FX_RATES[currency] ?? 0;
      return `≈ ${formatCompact(inrValue * rate, currency)}`;
    },
    [currency]
  );

  return {
    currency,
    symbol,
    locale,
    isLoading,
    fmt,
    fmtCompact,
    fmtNumber,
    fmtFromINR,
    fmtCompactFromINR,
    isGlobal: currency !== 'INR',
  };
}
