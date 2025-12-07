// Rebuild: 2025-12-07T18:22:00Z - Context cache invalidation v2
import { createContext, useContext, useState, ReactNode } from 'react';

export const currencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
];

// Approximate exchange rates (INR base) - For display purposes only
export const exchangeRates: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  SAR: 0.045,
  JPY: 1.8,
  AUD: 0.018,
};

export const formatCurrency = (
  amountINR: number,
  currencyCode: string,
  options?: { showSymbol?: boolean; compact?: boolean }
): string => {
  const rate = exchangeRates[currencyCode] || 1;
  const converted = amountINR * rate;
  const currency = currencies.find(c => c.code === currencyCode);
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    notation: options?.compact ? 'compact' : 'standard',
  }).format(converted);

  if (options?.showSymbol !== false && currency) {
    return `${currency.symbol}${formatted}`;
  }
  return formatted;
};

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  formatPrice: (amountINR: number, options?: { showSymbol?: boolean; compact?: boolean }) => string;
  currentCurrency: typeof currencies[0] | undefined;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setSelectedCurrency] = useState("INR");

  const formatPrice = (amountINR: number, options?: { showSymbol?: boolean; compact?: boolean }) => {
    return formatCurrency(amountINR, selectedCurrency, options);
  };

  const currentCurrency = currencies.find(c => c.code === selectedCurrency);

  return (
    <CurrencyContext.Provider value={{ 
      selectedCurrency, 
      setCurrency: setSelectedCurrency, 
      formatPrice,
      currentCurrency
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
