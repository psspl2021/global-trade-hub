interface Props {
  country: string;
  importDuty: string;
  leadTime: string;
  currencyRisk: string;
  moq: string;
  bisRequired: boolean;
}

export default function ImportIntelligenceBlock({
  country,
  importDuty,
  leadTime,
  currencyRisk,
  moq,
  bisRequired,
}: Props) {
  return (
    <section className="bg-muted p-6 rounded-xl mt-12">
      <h3 className="text-lg font-bold mb-4 text-foreground">
        Import Intelligence — {country}
      </h3>
      <ul className="space-y-2 text-muted-foreground">
        <li><strong>Import Duty:</strong> {importDuty}</li>
        <li><strong>Average Lead Time:</strong> {leadTime}</li>
        <li><strong>Currency Exposure:</strong> {currencyRisk}</li>
        <li><strong>Typical MOQ:</strong> {moq}</li>
        <li><strong>BIS Compliance Required:</strong> {bisRequired ? "Yes" : "Depends on category"}</li>
      </ul>
    </section>
  );
}
