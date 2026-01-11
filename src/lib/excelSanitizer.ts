/**
 * Excel Formula Injection Sanitizer
 * 
 * Prevents CSV/Excel formula injection attacks by escaping values
 * that start with characters that Excel interprets as formulas.
 * 
 * Attack vectors blocked:
 * - =HYPERLINK("malicious-url") - Formula injection
 * - +cmd|'/C calc'!A0 - DDE command execution
 * - -cmd|'/C calc'!A0 - DDE command execution  
 * - @SUM(1+1)*cmd|'/C calc'!A0 - DDE command execution
 * - \t (tab) followed by formula - Tab-based injection
 * - \r, \n - Newline injection for row splitting
 * 
 * @see https://owasp.org/www-community/attacks/CSV_Injection
 */

/**
 * Sanitizes a single value to prevent Excel formula injection
 * Prefixes dangerous characters with a single quote to neutralize them
 */
export function sanitizeExcelValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Characters that can trigger formula execution in Excel/Sheets
  const dangerousChars = /^[=+\-@\t\r\n]/;
  
  if (dangerousChars.test(value)) {
    // Prefix with single quote - Excel displays the value as-is
    return `'${value}`;
  }
  
  return value;
}

/**
 * Sanitizes an object's string values for safe Excel export
 * Recursively handles nested objects
 */
export function sanitizeExcelRow<T extends Record<string, unknown>>(row: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(row)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key as keyof T] = sanitizeExcelRow(value as Record<string, unknown>) as T[keyof T];
    } else {
      sanitized[key as keyof T] = sanitizeExcelValue(value) as T[keyof T];
    }
  }
  
  return sanitized;
}

/**
 * Sanitizes an array of objects for safe Excel export
 * Use this before passing data to XLSX.utils.json_to_sheet()
 */
export function sanitizeExcelData<T extends Record<string, unknown>>(data: T[]): T[] {
  return data.map(row => sanitizeExcelRow(row));
}

/**
 * Sanitizes an array of arrays (AOA) for safe Excel export
 * Use this before passing data to XLSX.utils.aoa_to_sheet()
 */
export function sanitizeExcelAOA(data: unknown[][]): unknown[][] {
  return data.map(row => row.map(cell => sanitizeExcelValue(cell)));
}

/**
 * Sanitizes imported Excel data to clean potentially malicious formulas
 * Use this after parsing Excel files before processing the data
 */
export function sanitizeImportedExcelData<T extends Record<string, unknown>>(data: T[]): T[] {
  return data.map(row => {
    const sanitized = {} as T;
    
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string') {
        // Remove leading single quotes that might have been added for display
        // but also strip dangerous formula characters
        let cleanValue = value.trim();
        if (/^[=+\-@]/.test(cleanValue)) {
          // If the value looks like a formula, strip the dangerous character
          // This prevents execution if the data is re-exported
          cleanValue = cleanValue.slice(1);
        }
        sanitized[key as keyof T] = cleanValue as T[keyof T];
      } else {
        sanitized[key as keyof T] = value as T[keyof T];
      }
    }
    
    return sanitized;
  });
}
