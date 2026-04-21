/**
 * HSCodeField — Harmonized System code input with format hint.
 * 6-digit international, 8-digit (EU CN), or 10-digit (US HTS / India ITC).
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HSCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  className?: string;
  id?: string;
}

export function HSCodeField({
  value,
  onChange,
  required = false,
  label = 'HS / HSN Code',
  className,
  id,
}: HSCodeFieldProps) {
  const cleaned = value.replace(/\D/g, '');
  const valid = cleaned.length === 0 || cleaned.length === 6 || cleaned.length === 8 || cleaned.length === 10;

  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder="6 / 8 / 10 digits (e.g. 720839)"
        inputMode="numeric"
        className={!valid ? 'border-destructive' : ''}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {!valid ? 'HS code must be 6, 8, or 10 digits' : '6-digit international, 8 (EU), or 10 (US/India)'}
      </p>
    </div>
  );
}
