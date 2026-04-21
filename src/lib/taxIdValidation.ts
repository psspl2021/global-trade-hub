/**
 * Country-specific tax ID validation
 * Returns { valid, label, hint, error? }
 */

export interface TaxIdValidationResult {
  valid: boolean;
  label: string;
  hint: string;
  error?: string;
}

// Normalize country to ISO-2 or common name
const normalize = (c: string): string => (c || '').trim().toUpperCase();

const RULES: Record<string, { label: string; regex: RegExp; hint: string; example: string }> = {
  IN: {
    label: 'GSTIN',
    regex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    hint: '15 chars: 2 state + 10 PAN + entity + Z + check',
    example: '22AAAAA0000A1Z5',
  },
  US: {
    label: 'EIN',
    regex: /^\d{2}-?\d{7}$/,
    hint: 'Federal EIN: 9 digits (NN-NNNNNNN)',
    example: '12-3456789',
  },
  GB: {
    label: 'VAT Number',
    regex: /^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
    hint: 'UK VAT: GB + 9 or 12 digits',
    example: 'GB123456789',
  },
  AE: {
    label: 'TRN',
    regex: /^\d{15}$/,
    hint: 'UAE Tax Reg Number: 15 digits',
    example: '100000000000003',
  },
  SA: {
    label: 'TRN',
    regex: /^3\d{14}$/,
    hint: 'KSA VAT: 15 digits starting with 3',
    example: '300000000000003',
  },
  DE: {
    label: 'USt-IdNr',
    regex: /^DE\d{9}$/,
    hint: 'Germany VAT: DE + 9 digits',
    example: 'DE123456789',
  },
  FR: {
    label: 'TVA',
    regex: /^FR[A-Z0-9]{2}\d{9}$/,
    hint: 'France VAT: FR + 2 chars + 9 digits',
    example: 'FRXX123456789',
  },
  SG: {
    label: 'GST Reg No',
    regex: /^(\d{8}[A-Z]|[ST]\d{2}[A-Z]{2}\d{4}[A-Z])$/,
    hint: 'Singapore GST registration',
    example: '200012345A',
  },
  AU: {
    label: 'ABN',
    regex: /^\d{11}$/,
    hint: 'Australian Business Number: 11 digits',
    example: '12345678901',
  },
};

const ALIAS: Record<string, string> = {
  INDIA: 'IN',
  'UNITED STATES': 'US',
  USA: 'US',
  'UNITED KINGDOM': 'GB',
  UK: 'GB',
  GERMANY: 'DE',
  FRANCE: 'FR',
  SINGAPORE: 'SG',
  AUSTRALIA: 'AU',
  'SAUDI ARABIA': 'SA',
  'UNITED ARAB EMIRATES': 'AE',
  UAE: 'AE',
};

export function getTaxIdRule(country: string | null | undefined) {
  if (!country) return null;
  const key = ALIAS[normalize(country)] || normalize(country);
  return RULES[key] || null;
}

export function validateTaxId(country: string | null | undefined, value: string): TaxIdValidationResult {
  const rule = getTaxIdRule(country);
  if (!rule) {
    return {
      valid: value.trim().length >= 4,
      label: 'Tax ID',
      hint: 'Enter your business tax identification number',
      error: value.trim().length < 4 ? 'Tax ID seems too short' : undefined,
    };
  }
  const trimmed = value.trim().toUpperCase().replace(/\s+/g, '');
  const valid = rule.regex.test(trimmed);
  return {
    valid,
    label: rule.label,
    hint: `${rule.hint} (e.g. ${rule.example})`,
    error: !valid && value.length > 0 ? `Invalid ${rule.label} format` : undefined,
  };
}

export function getTaxIdLabel(country: string | null | undefined): string {
  return getTaxIdRule(country)?.label || 'Tax ID';
}
