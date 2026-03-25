/**
 * GSTIN (GST Identification Number) Validator
 * 
 * GSTIN Format: 22AAAAA0000A1Z5 (15 characters)
 * - Pos 1-2: State code (01-38)
 * - Pos 3-12: PAN (10 chars)
 * - Pos 13: Entity number (1-9 or A-Z)
 * - Pos 14: 'Z' by default
 * - Pos 15: Checksum character
 */

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Valid Indian state codes (01-38)
const VALID_STATE_CODES = new Set([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38',
]);

// Character set for checksum calculation
const CHECKSUM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Calculate the checksum digit of a GSTIN
 * Uses the Luhn-like algorithm specified by GSTN
 */
function calculateChecksum(gstin14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const charIndex = CHECKSUM_CHARS.indexOf(gstin14[i]);
    const factor = (i % 2 === 0) ? 1 : 2;
    const product = charIndex * factor;
    sum += Math.floor(product / 36) + (product % 36);
  }
  const remainder = sum % 36;
  const checksumIndex = (36 - remainder) % 36;
  return CHECKSUM_CHARS[checksumIndex];
}

export interface GSTINValidationResult {
  isValid: boolean;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  errors: string[];
}

const STATE_NAMES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra', '28': 'Andhra Pradesh (Old)', '29': 'Karnataka',
  '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
  '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

/**
 * Validate a GSTIN with format check, state code validation, and checksum verification
 */
export function validateGSTIN(gstin: string): GSTINValidationResult {
  const cleaned = gstin.trim().toUpperCase();
  const errors: string[] = [];

  // Length check
  if (cleaned.length === 0) {
    return { isValid: false, errors: [] }; // Empty is not an error, just incomplete
  }

  if (cleaned.length < 15) {
    return { isValid: false, errors: ['GSTIN must be 15 characters'] };
  }

  if (cleaned.length > 15) {
    return { isValid: false, errors: ['GSTIN must be exactly 15 characters'] };
  }

  // Format check
  if (!GSTIN_REGEX.test(cleaned)) {
    errors.push('Invalid GSTIN format. Expected: 22AAAAA0000A1Z5');
  }

  // State code check
  const stateCode = cleaned.substring(0, 2);
  if (!VALID_STATE_CODES.has(stateCode)) {
    errors.push(`Invalid state code: ${stateCode}`);
  }

  // Checksum verification
  if (errors.length === 0) {
    const expectedChecksum = calculateChecksum(cleaned.substring(0, 14));
    if (cleaned[14] !== expectedChecksum) {
      errors.push('Invalid checksum digit — please verify your GSTIN');
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    stateCode,
    stateName: STATE_NAMES[stateCode],
    pan: cleaned.substring(2, 12),
    errors: [],
  };
}
