import { CheckCircle2 } from 'lucide-react';

type Row = {
  supplier: string;
  price: string;
  delivery: string;
  terms: string;
  notes: string;
  recommended?: boolean;
};

const rows: Row[] = [
  {
    supplier: 'Supplier A',
    price: 'Quote 1',
    delivery: '7–10 days',
    terms: 'Net 30',
    notes: 'Direct manufacturer',
  },
  {
    supplier: 'Supplier B',
    price: 'Quote 2 — lowest',
    delivery: '5–7 days',
    terms: 'Net 30',
    notes: 'Best fit on price + delivery',
    recommended: true,
  },
  {
    supplier: 'Supplier C',
    price: 'Quote 3',
    delivery: '10–14 days',
    terms: 'Advance + balance',
    notes: 'Authorised distributor',
  },
];

export const QuoteComparisonSection = () => {
  return (
    <section className="py-12 sm:py-20 bg-[hsl(var(--muted))]/40 border-y border-border/60">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-7 sm:mb-9">
            <div className="text-[10.5px] sm:text-[11px] font-semibold text-primary uppercase tracking-[0.16em] mb-2.5">
              Decision view
            </div>
            <h2 className="text-[22px] sm:text-[30px] font-display font-bold tracking-tight text-foreground leading-[1.15] mb-3">
              Compare supplier quotes clearly — not across calls and spreadsheets
            </h2>
            <p className="text-[13.5px] sm:text-[15px] text-muted-foreground leading-relaxed">
              Every quote lands in one structured view — price, delivery, terms and notes — so you can decide without chasing follow-ups.
            </p>
          </div>

          {/* Comparison card */}
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-5 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">Supplier</th>
                    <th className="px-5 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="px-5 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">Delivery</th>
                    <th className="px-5 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">Payment terms</th>
                    <th className="px-5 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.supplier}
                      className={`border-b border-border last:border-0 ${
                        r.recommended ? 'bg-primary/[0.04]' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-foreground">{r.supplier}</span>
                          {r.recommended && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9.5px] font-bold uppercase tracking-wider text-primary">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Best fit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[15px] font-bold ${r.recommended ? 'text-primary' : 'text-foreground'}`}>
                          {r.price}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-foreground/80">{r.delivery}</td>
                      <td className="px-5 py-4 text-[12.5px] text-muted-foreground">{r.terms}</td>
                      <td className="px-5 py-4 text-[12.5px] text-muted-foreground">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden divide-y divide-border">
              {rows.map((r) => (
                <div key={r.supplier} className={`p-4 ${r.recommended ? 'bg-primary/[0.04]' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13.5px] font-semibold text-foreground">{r.supplier}</span>
                    {r.recommended && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9.5px] font-bold uppercase tracking-wider text-primary">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Best fit
                      </span>
                    )}
                  </div>
                  <div className={`text-[15px] font-bold mb-1.5 ${r.recommended ? 'text-primary' : 'text-foreground'}`}>
                    {r.price}
                  </div>
                  <div className="text-[12px] text-foreground/80 mb-0.5">Delivery: {r.delivery}</div>
                  <div className="text-[11.5px] text-muted-foreground mb-0.5">Terms: {r.terms}</div>
                  <div className="text-[11.5px] text-muted-foreground">{r.notes}</div>
                </div>
              ))}
            </div>

            {/* Closing line */}
            <div className="border-t border-border bg-background/50 px-5 py-4">
              <p className="text-[12.5px] sm:text-[13.5px] text-foreground/80 leading-relaxed">
                <strong className="text-foreground">All quotes visible in one place.</strong> No follow-ups. No fragmented conversations.
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] sm:text-[11.5px] italic text-muted-foreground/80 text-center">
            Illustrative view of the supplier comparison screen. Actual quote values vary by category, supplier and market conditions.
          </p>
        </div>
      </div>
    </section>
  );
};
