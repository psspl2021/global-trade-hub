import { CheckCircle, Shield, Users } from 'lucide-react';

const trustPoints = [
  'Verified suppliers with BIS/ISO compliance checks',
  'Reverse auction ensures transparent best-price discovery',
  'End-to-end procurement support from RFQ to delivery',
  'Sealed-bid format prevents supplier collusion',
  'Real-time tracking and quality assurance',
];

export default function BuyerTrustSection() {
  return (
    <section className="rounded-lg border border-border bg-muted/30 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          Why Buyers Trust ProcureSaathi
        </h2>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {trustPoints.map((point) => (
          <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Users className="h-4 w-4 text-primary" />
        <p className="text-sm text-muted-foreground">
          Trusted by <span className="font-semibold text-foreground">500+</span> verified suppliers across India
        </p>
      </div>
    </section>
  );
}
