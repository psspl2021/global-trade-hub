/**
 * TaxIdField — Country-aware tax identifier input.
 * - India → GSTIN (with format validation hint)
 * - Global → Tax ID / VAT (free-form)
 *
 * Use everywhere a vendor/buyer enters their fiscal identifier.
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateGSTIN } from '@/lib/gstinValidator';
import { cn } from '@/lib/utils';

interface TaxIdFieldProps {
  country?: string | null;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function isIndia(country?: string | null): boolean {
  if (!country) return true; // default: India (preserves legacy behaviour)
  const c = country.trim().toLowerCase();
  return c === 'india' || c === 'in' || c === 'ind';
}

export function getTaxIdLabel(country?: string | null): string {
  return isIndia(country) ? 'GSTIN' : 'Tax ID / VAT';
}

export function getTaxIdPlaceholder(country?: string | null): string {
  return isIndia(country) ? '22AAAAA0000A1Z5' : 'e.g. VAT/EIN/TRN';
}

export function TaxIdField({
  country,
  value,
  onChange,
  label,
  required,
  className,
  id = 'tax_id',
  disabled,
}: TaxIdFieldProps) {
  const india = isIndia(country);
  const computedLabel = label ?? getTaxIdLabel(country);
  const placeholder = getTaxIdPlaceholder(country);

  const validation = india && value ? validateGSTIN(value) : null;
  const showError = validation && !validation.valid;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-xs">
        {computedLabel} {required && <span className="text-destructive">*</span>}
        {!india && !required && (
          <span className="ml-1 text-muted-foreground">(optional)</span>
        )}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(india ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        maxLength={india ? 15 : 50}
        disabled={disabled}
        className={cn(showError && 'border-destructive')}
      />
      {showError && (
        <p className="text-[11px] text-destructive">{validation?.error}</p>
      )}
      {!india && (
        <p className="text-[11px] text-muted-foreground">
          Enter your local business tax identifier (VAT, EIN, TRN, ABN, etc.)
        </p>
      )}
    </div>
  );
}
