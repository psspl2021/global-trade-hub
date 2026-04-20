/**
 * MultiCurrencyBidInput — supplier bid entry that supports any currency
 * and auto-converts to INR for storage / ranking.
 *
 * Buyers always see INR-normalized totals; the supplier sees their own
 * currency entry plus a live "≈ ₹X" preview.
 */
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

interface FxRow {
  currency_code: string;
  rate_to_inr: number;
}

interface Props {
  value: string; // string in chosen currency
  onChange: (info: { displayValue: string; inrValue: number; currency: string; fxRate: number }) => void;
  defaultCurrency?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const COMMON = ['INR','USD','EUR','GBP','AED','SAR','CNY','SGD','JPY','KES','NGN','VND','AUD','QAR'];

export function MultiCurrencyBidInput({
  value,
  onChange,
  defaultCurrency = 'INR',
  label = 'Your Bid',
  required,
  disabled,
}: Props) {
  const [currency, setCurrency] = useState(defaultCurrency);
  const [rates, setRates] = useState<Record<string, number>>({ INR: 1 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('fx_rates').select('currency_code, rate_to_inr');
      if (cancelled || !data) return;
      const map: Record<string, number> = { INR: 1 };
      (data as FxRow[]).forEach((r) => { map[r.currency_code] = Number(r.rate_to_inr) || 0; });
      setRates(map);
    })();
    return () => { cancelled = true; };
  }, []);

  const fxRate = rates[currency] ?? 1; // 1 unit foreign = X INR
  const numeric = Number(value || 0);
  const inrValue = useMemo(() => Math.round(numeric * fxRate * 100) / 100, [numeric, fxRate]);

  const emit = (raw: string, cur: string) => {
    const n = Number(raw || 0);
    const r = rates[cur] ?? 1;
    onChange({
      displayValue: raw,
      inrValue: Math.round(n * r * 100) / 100,
      currency: cur,
      fxRate: r,
    });
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-2">
        <Select
          value={currency}
          onValueChange={(c) => { setCurrency(c); emit(value, c); }}
          disabled={disabled}
        >
          <SelectTrigger className="w-28 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON.map((c) => (
              <SelectItem key={c} value={c}>
                {getCurrencySymbol(c)} {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={value}
          onChange={(e) => emit(e.target.value, currency)}
          disabled={disabled}
          className="flex-1 tabular-nums"
        />
      </div>
      {currency !== 'INR' && numeric > 0 && (
        <p className="text-[11px] text-muted-foreground">
          ≈ {formatCurrency(inrValue, 'INR')} (rate: 1 {currency} = ₹{fxRate.toFixed(4)})
        </p>
      )}
      {!rates[currency] && currency !== 'INR' && (
        <p className="text-[11px] text-amber-600">
          Live rate for {currency} unavailable — using fallback.
        </p>
      )}
    </div>
  );
}
