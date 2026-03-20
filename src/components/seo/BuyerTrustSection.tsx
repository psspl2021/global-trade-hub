import { CheckCircle, Shield } from 'lucide-react';

const trustPoints = [
  'Verified suppliers with BIS/ISO compliance checks',
  'Reverse auction ensures transparent best-price discovery',
  'End-to-end procurement support from RFQ to delivery',
  'Sealed-bid format prevents supplier collusion',
  'Real-time tracking and quality assurance',
];

export default function BuyerTrustSection() {
  return (
    <section className="rounded-xl border border-border bg-muted/30 p-8 space-y-5">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          Why Buyers Trust ProcureSaathi
        </h2>
      </div>
      <ul className="space-y-3">
        {trustPoints.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-muted-foreground">
            <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
