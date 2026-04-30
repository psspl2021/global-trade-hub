import { Factory, Layers, FileCheck2, Repeat } from 'lucide-react';

const cards = [
  {
    icon: Factory,
    title: 'Manufacturers & authorised distributors',
    desc: 'Each supplier is classified by source — direct manufacturer, authorised distributor or stockist — so you know who you are quoting with.',
  },
  {
    icon: Layers,
    title: 'Category specialisation',
    desc: 'Suppliers are mapped to specific categories — TMT, MS pipes, packaging, industrial chemicals, electricals — not generic listings.',
  },
  {
    icon: FileCheck2,
    title: 'Business verification',
    desc: 'GST registration, operational presence and basic compliance documents are checked before a supplier can receive RFQs.',
  },
  {
    icon: Repeat,
    title: 'RFQ participation history',
    desc: 'Suppliers who consistently respond to RFQs and honour quotes are prioritised. Inactive accounts are filtered out.',
  },
];

export const SupplierTrustSection = () => {
  return (
    <section className="py-12 sm:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <div className="text-[10.5px] sm:text-[11px] font-semibold text-primary uppercase tracking-[0.16em] mb-2.5">
              Supplier pipeline
            </div>
            <h2 className="text-[22px] sm:text-[30px] font-display font-bold tracking-tight text-foreground leading-[1.15] mb-3">
              Verified suppliers across key procurement categories
            </h2>
            <p className="text-[13.5px] sm:text-[15px] text-muted-foreground leading-relaxed">
              Suppliers are screened for capability, responsiveness and business reliability before they receive RFQs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((c) => (
              <div
                key={c.title}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-[0_1px_3px_rgba(16,24,40,0.06)] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/15 text-primary flex items-center justify-center mb-3">
                  <c.icon className="h-[16px] w-[16px]" strokeWidth={2} />
                </div>
                <h3 className="text-[13.5px] font-semibold text-foreground leading-snug mb-1.5">
                  {c.title}
                </h3>
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
