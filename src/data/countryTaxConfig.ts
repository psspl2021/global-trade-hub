// Country-specific Tax ID Configuration for Signup Form
// Maps each supported country to its tax identification requirements

export interface CountryTaxConfig {
  countryCode: string;
  label: string;
  placeholder: string;
  helperText: string;
  maxLength: number;
  isRequired: boolean;
  vatRate?: string;
  // Regex pattern for validation (optional - if undefined, no format validation)
  pattern?: RegExp;
  patternError?: string;
}

export const countryTaxConfigs: Record<string, CountryTaxConfig> = {
  india: {
    countryCode: 'india',
    label: 'GSTIN',
    placeholder: '22AAAAA0000A1Z5',
    helperText: '15-character GST Identification Number',
    maxLength: 15,
    isRequired: true,
    vatRate: '18% GST',
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    patternError: 'Please enter a valid 15-character GSTIN',
  },
  uae: {
    countryCode: 'uae',
    label: 'VAT Registration Number (TRN)',
    placeholder: '100XXXXXXXXXXXXXXX',
    helperText: '5% VAT | Mandatory for businesses above AED 375,000 turnover',
    maxLength: 15,
    isRequired: false, // Optional for smaller businesses
    vatRate: '5% VAT',
    pattern: /^[0-9]{15}$/,
    patternError: 'Please enter a valid 15-digit UAE TRN',
  },
  saudi: {
    countryCode: 'saudi',
    label: 'VAT Registration Number',
    placeholder: '3XXXXXXXXXXXXXX',
    helperText: '15% VAT | Required for registered businesses',
    maxLength: 15,
    isRequired: false,
    vatRate: '15% VAT',
    pattern: /^3[0-9]{14}$/,
    patternError: 'Please enter a valid 15-digit Saudi VAT number (starts with 3)',
  },
  qatar: {
    countryCode: 'qatar',
    label: 'Commercial Registration Number',
    placeholder: 'XXXXXXXXX',
    helperText: 'No VAT applicable in Qatar',
    maxLength: 20,
    isRequired: false,
    vatRate: 'No VAT',
  },
  kenya: {
    countryCode: 'kenya',
    label: 'KRA PIN',
    placeholder: 'AXXXXXXXXX',
    helperText: '16% VAT | Kenya Revenue Authority PIN',
    maxLength: 11,
    isRequired: false,
    vatRate: '16% VAT',
    pattern: /^[AP][0-9]{9}[A-Z]$/,
    patternError: 'Please enter a valid KRA PIN',
  },
  nigeria: {
    countryCode: 'nigeria',
    label: 'Tax Identification Number (TIN)',
    placeholder: 'XXXXXXXXXX-0001',
    helperText: '7.5% VAT | FIRS Tax ID',
    maxLength: 20,
    isRequired: false,
    vatRate: '7.5% VAT',
  },
  // Default for other/unknown countries
  default: {
    countryCode: 'default',
    label: 'Tax Identification Number',
    placeholder: 'Enter your Tax ID',
    helperText: 'Your business tax registration number',
    maxLength: 30,
    isRequired: false,
  },
};

/**
 * Get tax configuration for a specific country
 * @param countryCode - The country code (e.g., 'india', 'uae', 'saudi')
 * @returns The tax configuration for the country, or default config
 */
export function getTaxConfigForCountry(countryCode: string | null): CountryTaxConfig {
  if (!countryCode) {
    return countryTaxConfigs.india; // Default to India
  }
  
  const normalizedCode = countryCode.toLowerCase();
  return countryTaxConfigs[normalizedCode] || countryTaxConfigs.default;
}

/**
 * Extract country code from URL path
 * Handles paths like /uae/procurement/... or /saudi/procurement/...
 * @param pathname - The current URL pathname
 * @returns The country code or null if not found
 */
export function extractCountryFromPath(pathname: string): string | null {
  // Check for country prefix in path: /uae/, /saudi/, /qatar/, /kenya/, /nigeria/
  const countryMatch = pathname.match(/^\/(uae|saudi|qatar|kenya|nigeria)\//i);
  if (countryMatch) {
    return countryMatch[1].toLowerCase();
  }
  
  // Default to India for root paths
  return null;
}

/**
 * Get country from URL search params or referrer
 * Checks for ?country=uae or parses document.referrer
 */
export function getCountryFromContext(): string | null {
  // Check URL search params first
  const urlParams = new URLSearchParams(window.location.search);
  const countryParam = urlParams.get('country');
  if (countryParam && countryTaxConfigs[countryParam.toLowerCase()]) {
    return countryParam.toLowerCase();
  }
  
  // Check localStorage for last visited country context
  try {
    const storedCountry = localStorage.getItem('signup_country_context');
    if (storedCountry && countryTaxConfigs[storedCountry]) {
      return storedCountry;
    }
  } catch {
    // localStorage not available
  }
  
  // Check referrer for country path
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      const referrerCountry = extractCountryFromPath(referrerUrl.pathname);
      if (referrerCountry) {
        return referrerCountry;
      }
    } catch {
      // Invalid referrer URL
    }
  }
  
  return null;
}

/**
 * Save country context to localStorage for signup flow
 */
export function saveCountryContext(countryCode: string): void {
  try {
    localStorage.setItem('signup_country_context', countryCode.toLowerCase());
  } catch {
    // localStorage not available
  }
}

/**
 * Clear country context from localStorage
 */
export function clearCountryContext(): void {
  try {
    localStorage.removeItem('signup_country_context');
  } catch {
    // localStorage not available
  }
}
