/**
 * IncotermsPicker — reusable Incoterms 2020 dropdown.
 * Use anywhere RFQs, POs, or shipments need delivery terms.
 */
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const INCOTERMS_2020 = [
  { code: 'EXW', desc: 'Ex Works — buyer collects from seller premises' },
  { code: 'FCA', desc: 'Free Carrier — seller delivers to named carrier' },
  { code: 'CPT', desc: 'Carriage Paid To — seller pays freight to destination' },
  { code: 'CIP', desc: 'Carriage & Insurance Paid — CPT + insurance' },
  { code: 'DAP', desc: 'Delivered at Place — seller delivers ready for unload' },
  { code: 'DPU', desc: 'Delivered at Place Unloaded — seller unloads at destination' },
  { code: 'DDP', desc: 'Delivered Duty Paid — seller bears all costs incl. duties' },
  { code: 'FAS', desc: 'Free Alongside Ship — seller delivers next to vessel (sea)' },
  { code: 'FOB', desc: 'Free On Board — seller loads onto vessel (sea)' },
  { code: 'CFR', desc: 'Cost & Freight — FOB + freight to destination port (sea)' },
  { code: 'CIF', desc: 'Cost, Insurance & Freight — CFR + insurance (sea)' },
];

interface IncotermsPickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  className?: string;
}

export function IncotermsPicker({
  value,
  onChange,
  required = false,
  label = 'Incoterms',
  className,
}: IncotermsPickerProps) {
  return (
    <div className={className}>
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select delivery terms" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {INCOTERMS_2020.map((t) => (
            <SelectItem key={t.code} value={t.code}>
              <span className="font-mono font-semibold mr-2">{t.code}</span>
              <span className="text-xs text-muted-foreground">{t.desc}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
