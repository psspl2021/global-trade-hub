import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  country: string;
}

export default function ImportDecisionMatrix({ country }: Props) {
  return (
    <section className="mt-16 rounded-xl bg-primary/5 p-8">
      <h3 className="mb-6 text-lg font-bold text-foreground">
        When to Import from {country}
      </h3>
      <ul className="space-y-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          When price arbitrage exceeds 6–8%
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          When project timeline allows 25–40 days
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          When BIS compliance is verified
        </li>
        <li className="flex items-start gap-2">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          Avoid if urgent delivery under 15 days
        </li>
        <li className="flex items-start gap-2">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          Avoid during high currency volatility periods
        </li>
      </ul>
    </section>
  );
}
