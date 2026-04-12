import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface DemoSavingsGraphProps {
  baselinePrice: number;
  finalPrice: number;
}

const generatePriceData = (baseline: number, final: number) => {
  const drop = baseline - final;
  return [
    { round: 1, price: baseline },
    { round: 2, price: baseline - drop * 0.08 },
    { round: 3, price: baseline - drop * 0.22 },
    { round: 4, price: baseline - drop * 0.38 },
    { round: 5, price: baseline - drop * 0.55 },
    { round: 6, price: baseline - drop * 0.72 },
    { round: 7, price: baseline - drop * 0.88 },
    { round: 8, price: final },
  ].map(d => ({ ...d, price: Math.round(d.price) }));
};

export function DemoSavingsGraph({ baselinePrice, finalPrice }: DemoSavingsGraphProps) {
  const data = generatePriceData(baselinePrice, finalPrice);
  const savings = baselinePrice - finalPrice;
  const pct = ((savings / baselinePrice) * 100).toFixed(1);

  return (
    <div className="p-4 rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
          <TrendingDown className="w-4 h-4 text-indigo-600" />
        </div>
        <span className="text-sm font-semibold text-foreground">Price Drop Over Auction Rounds</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        ₹{savings.toLocaleString('en-IN')}/MT saved ({pct}% below baseline)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="round" tick={{ fontSize: 10 }} label={{ value: 'Round', position: 'insideBottom', offset: -2, fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 200', 'dataMax + 200']} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(1)}k`} />
          <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Price/MT']} />
          <ReferenceLine y={baselinePrice} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: 'Baseline', position: 'right', fontSize: 10 }} />
          <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
