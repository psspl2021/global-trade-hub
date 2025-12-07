import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCurrency, currencies } from "@/contexts/CurrencyContext";

interface CurrencySelectorCompactProps {
  showBadge?: boolean;
  className?: string;
}

export const CurrencySelectorCompact = ({ showBadge = true, className }: CurrencySelectorCompactProps) => {
  const { selectedCurrency, setCurrency, currentCurrency } = useCurrency();

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Select value={selectedCurrency} onValueChange={setCurrency}>
        <SelectTrigger className="w-[120px] h-8 text-sm bg-background">
          <SelectValue>
            <div className="flex items-center gap-1.5">
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
      {showBadge && (
        <Badge variant="outline" className="text-xs h-6">
          Indicative
        </Badge>
      )}
    </div>
  );
};
