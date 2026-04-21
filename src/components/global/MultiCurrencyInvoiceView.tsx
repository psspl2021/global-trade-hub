/**
 * MultiCurrencyInvoiceView — renders an invoice in PO currency with INR equivalent
 * and the locked FX snapshot at PO time. Read-only display component.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';
import { formatInTz } from '@/lib/timezone';

interface MultiCurrencyInvoiceViewProps {
  poNumber: string;
  vendorName: string;
  currency: string;
  totalAmount: number;
  baseCurrency?: string;
  poValueBaseCurrency?: number | null;
  exchangeRate?: number | null;
  fxSource?: string | null;
  fxTimestamp?: string | null;
  incoterms?: string | null;
  orderDate?: string | null;
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    hs_code?: string | null;
  }>;
}

export function MultiCurrencyInvoiceView({
  poNumber,
  vendorName,
  currency,
  totalAmount,
  baseCurrency = 'INR',
  poValueBaseCurrency,
  exchangeRate,
  fxSource,
  fxTimestamp,
  incoterms,
  orderDate,
  items = [],
}: MultiCurrencyInvoiceViewProps) {
  const { formatAmount, orgTimezone } = useGlobalBuyerContext();
  const showFx = currency !== baseCurrency && exchangeRate && exchangeRate !== 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Invoice {poNumber}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{vendorName}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="font-mono">{currency}</Badge>
            {incoterms && <Badge variant="secondary">{incoterms}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Invoice Total</p>
            <p className="text-2xl font-bold">{formatAmount(totalAmount, currency)}</p>
          </div>
          {showFx && poValueBaseCurrency != null && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {baseCurrency} Equivalent
              </p>
              <p className="text-2xl font-bold text-muted-foreground">
                {formatAmount(poValueBaseCurrency, baseCurrency)}
              </p>
            </div>
          )}
        </div>

        {/* FX Snapshot */}
        {showFx && (
          <div className="text-xs border-l-2 border-primary pl-3 space-y-0.5">
            <p>
              <span className="text-muted-foreground">FX rate locked: </span>
              <span className="font-mono font-semibold">
                1 {currency} = {(1 / (exchangeRate || 1)).toFixed(4)} {baseCurrency}
              </span>
            </p>
            {fxSource && (
              <p className="text-muted-foreground">
                Source: {fxSource}
                {fxTimestamp && ` · ${formatInTz(fxTimestamp, orgTimezone, { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            )}
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">HS Code</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{it.description}</td>
                    <td className="px-3 py-2 font-mono text-xs">{it.hs_code || '—'}</td>
                    <td className="px-3 py-2 text-right">{it.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatAmount(it.unit_price, currency)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatAmount(it.total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orderDate && (
          <p className="text-xs text-muted-foreground">
            Order date: {formatInTz(orderDate, orgTimezone)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
