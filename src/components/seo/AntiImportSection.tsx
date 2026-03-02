import { AlertTriangle } from "lucide-react";

interface Props {
  countryName: string;
  reasons: string[];
}

export default function AntiImportSection({ countryName, reasons }: Props) {
  if (!reasons.length) return null;

  return (
    <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        When NOT to Import from {countryName}
      </h2>
      <ul className="space-y-3">
        {reasons.map((reason, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-0.5 text-destructive font-bold">✖</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
