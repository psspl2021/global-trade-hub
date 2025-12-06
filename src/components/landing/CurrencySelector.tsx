import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const currencies = [
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
const exchangeRates: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  SAR: 0.045,
  JPY: 1.8,
  AUD: 0.018,
};

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: string, rate: number) => void;
  className?: string;
}

export const CurrencySelector = ({ onCurrencyChange, className }: CurrencySelectorProps) => {
  const [selectedCurrency, setSelectedCurrency] = useState("INR");

  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
    onCurrencyChange?.(value, exchangeRates[value] || 1);
  };

  const currentCurrency = currencies.find(c => c.code === selectedCurrency);

  return (
    <div className={className}>
      <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{currentCurrency?.flag}</span>
              <span>{currentCurrency?.code}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span>{currency.flag}</span>
                <span className="font-medium">{currency.code}</span>
                <span className="text-muted-foreground text-xs">
                  {currency.symbol}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Badge variant="outline" className="ml-2 text-xs">
        Indicative rates
      </Badge>
    </div>
  );
};

// Utility function to format price in selected currency
export const formatCurrency = (
  amountINR: number,
  currencyCode: string,
  options?: { showSymbol?: boolean }
): string => {
  const rate = exchangeRates[currencyCode] || 1;
  const converted = amountINR * rate;
  const currency = currencies.find(c => c.code === currencyCode);
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  }).format(converted);

  if (options?.showSymbol !== false && currency) {
    return `${currency.symbol}${formatted}`;
  }
  return formatted;
};
