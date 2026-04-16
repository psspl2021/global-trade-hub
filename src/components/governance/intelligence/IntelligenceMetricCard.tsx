/**
 * IntelligenceMetricCard — presentational only.
 * Currency formatting is region-aware (presentation layer),
 * but the underlying numeric is always FX-normalized base currency.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: '﷼',
  JPY: '¥', CNY: '¥', SGD: 'S$', AUD: 'A$', CAD: 'C$', CHF: 'CHF',
};

export function formatBaseAmount(value: number, baseCurrency: string = 'INR'): string {
  const sym = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency + ' ';
  const safe = Number.isFinite(value) ? value : 0;
  if (Math.abs(safe) >= 1_00_00_000) return `${sym}${(safe / 1_00_00_000).toFixed(2)} Cr`;
  if (Math.abs(safe) >= 1_00_000) return `${sym}${(safe / 1_00_000).toFixed(2)} L`;
  if (Math.abs(safe) >= 1_000) return `${sym}${(safe / 1_000).toFixed(1)}k`;
  return `${sym}${safe.toFixed(0)}`;
}

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  hint?: string;
}

export function IntelligenceMetricCard({ title, value, icon: Icon, tone = 'default', hint }: Props) {
  const toneClass = {
    default: 'text-foreground',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-destructive',
    success: 'text-emerald-600 dark:text-emerald-400',
  }[tone];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', toneClass)} />
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold tabular-nums', toneClass)}>{value}</div>
        {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export default IntelligenceMetricCard;
