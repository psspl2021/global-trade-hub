import { Link } from "react-router-dom";
import { getCountrySkuOptions, type CountrySkuEntry } from "@/data/countrySkuMapping";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  countrySlug: string;
}

export default function CountrySkuTable({ countrySlug }: Props) {
  const entries = getCountrySkuOptions(countrySlug);
  if (!entries.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        SKU Procurement Intelligence
      </h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Cost Advantage</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">
                  <Link to={`/demand/${e.sku}`} className="text-primary hover:underline">
                    {e.skuLabel}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{e.costAdvantage}</TableCell>
                <TableCell className="text-sm">{e.leadTimeDays} days</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
